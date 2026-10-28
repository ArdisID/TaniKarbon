import json
import os
import sys
import uuid

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(__file__))

from main import app
from database import engine
from security import limiter, hash_password, create_access_token


def make_polygon(lat: float, lng: float, dlat: float = 0.0004, dlng: float = 0.0004) -> dict:
    """Poligon kotak kecil di sekitar lat/lng (GeoJSON RFC 7946, lon-lat)."""
    return {
        "type": "Polygon",
        "coordinates": [[
            [lng - dlng, lat - dlat],
            [lng + dlng, lat - dlat],
            [lng + dlng, lat + dlat],
            [lng - dlng, lat + dlat],
            [lng - dlng, lat - dlat],
        ]],
    }


async def login_petani(client: AsyncClient) -> dict:
    response = await client.post("/api/v1/auth/login", json={
        "email": "petani@tanikarbon.com",
        "password": "Password123!"
    })
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.mark.asyncio
async def test_spatial_overlay_masks_other_farmers_and_exposes_own_land():
    """GET spatial-overlay: nama petani lain disamarkan, lahan sendiri tetap bernama asli."""
    await engine.dispose()
    limiter.reset()
    other_plot_id = uuid.uuid4()

    try:
        async with engine.begin() as conn:
            other_plot_id = (
                await conn.execute(
                    text("""
                        INSERT INTO land_plots (
                            id, farmer_id, name, polygon_boundary, centroid, total_area_sqm, status
                        )
                        VALUES (
                            :id,
                            '44444444-1111-4444-8444-444444444444',
                            'Lahan Rahasia Petani Lain',
                            ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326),
                            ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)),
                            ST_Area(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography),
                            'draft'
                        )
                        RETURNING id
                    """),
                    {
                        "id": other_plot_id,
                        "geojson": json.dumps(make_polygon(-6.81, 107.31)),
                    }
                )
            ).fetchone().id

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = await login_petani(client)
            response = await client.get("/api/v1/farmer/lands/spatial-overlay", headers=headers)
            assert response.status_code == 200, response.text
            overlay = response.json()
            assert len(overlay) >= 2

            own_plot = next(item for item in overlay if item["name"] == "Kebun Sengon Pertama")
            assert own_plot["is_own_land"] is True
            assert own_plot["status"] == "verified"
            assert own_plot["polygon_boundary"]["type"] == "Polygon"

            masked_plot = next(item for item in overlay if str(item["id"]) == str(other_plot_id))
            assert masked_plot["is_own_land"] is False
            assert masked_plot["name"].startswith("Zona Terdaftar #")
            assert "Rahasia" not in masked_plot["name"]
            assert masked_plot["polygon_boundary"]["type"] == "Polygon"

            assert not any(item["status"] == "rejected" for item in overlay)
    finally:
        async with engine.begin() as conn:
            await conn.execute(
                text("DELETE FROM land_plots WHERE id = :id"),
                {"id": other_plot_id}
            )
        await engine.dispose()


@pytest.mark.asyncio
async def test_validate_polygon_rejects_invalid_geometry_tiny_large_and_overlap():
    """POST validate-polygon: cek ST_IsValid, batas 100 m²–15 Ha, dan anti-overlap PostGIS."""
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = await login_petani(client)

        # 1. Poligon valid di area kosong
        valid_poly = make_polygon(-6.55, 107.05)
        valid_res = await client.post(
            "/api/v1/farmer/lands/validate-polygon",
            headers=headers,
            json={"polygon_boundary": valid_poly}
        )
        assert valid_res.status_code == 200, valid_res.text
        valid_data = valid_res.json()
        assert valid_data["valid"] is True
        assert 100.0 <= valid_data["area_sqm"] <= 150000.0
        assert valid_data["conflicting_plot"] is None

        # 2. Geometri self-intersection (bow-tie) -> ST_IsValid = false
        bowtie = {
            "type": "Polygon",
            "coordinates": [[
                [107.40, -6.40],
                [107.41, -6.41],
                [107.41, -6.40],
                [107.40, -6.41],
                [107.40, -6.40],
            ]]
        }
        bowtie_res = await client.post(
            "/api/v1/farmer/lands/validate-polygon",
            headers=headers,
            json={"polygon_boundary": bowtie}
        )
        assert bowtie_res.status_code == 200
        assert bowtie_res.json()["valid"] is False
        assert "tidak valid" in bowtie_res.json()["message"].lower()

        # 3. Poligon mikroskopis (< 100 m²) ditolak
        tiny_res = await client.post(
            "/api/v1/farmer/lands/validate-polygon",
            headers=headers,
            json={"polygon_boundary": make_polygon(-6.40, 107.50, 0.00002, 0.00002)}
        )
        assert tiny_res.status_code == 200
        assert tiny_res.json()["valid"] is False
        assert "minimal" in tiny_res.json()["message"].lower()

        # 4. Poligon > 15 Ha ditolak
        huge_res = await client.post(
            "/api/v1/farmer/lands/validate-polygon",
            headers=headers,
            json={"polygon_boundary": make_polygon(-6.40, 107.30, 0.02, 0.02)}
        )
        assert huge_res.status_code == 200
        huge_data = huge_res.json()
        assert huge_data["valid"] is False
        assert huge_data["area_sqm"] > 150000.0
        assert "15,00 Ha" in huge_data["message"]

        # 5. Overlap dengan Kebun Sengon Pertama (verified) ditolak + conflicting_plot
        overlap_poly = {
            "type": "Polygon",
            "coordinates": [[
                [106.8330, -6.3685],
                [106.8332, -6.3685],
                [106.8332, -6.3687],
                [106.8330, -6.3687],
                [106.8330, -6.3685],
            ]]
        }
        overlap_res = await client.post(
            "/api/v1/farmer/lands/validate-polygon",
            headers=headers,
            json={"polygon_boundary": overlap_poly}
        )
        assert overlap_res.status_code == 200
        overlap_data = overlap_res.json()
        assert overlap_data["valid"] is False
        assert overlap_data["conflicting_plot"] is not None
        assert str(overlap_data["conflicting_plot"]["id"])
        assert "tumpang-tindih" in overlap_data["message"].lower()

    await engine.dispose()


@pytest.mark.asyncio
async def test_register_land_rejects_over_limit_and_enforces_draft_quota_and_documents():
    """POST /lands: tolak >15 Ha, kuota 5 draft, dan dokumen SHM/HGU / lahan >2 Ha."""
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)
    test_farmer_id = uuid.uuid4()
    test_farmer_email = f"qa.spatial.{uuid.uuid4().hex[:8]}@tanikarbon.com"
    test_plot_name_prefix = f"QA SPATIAL {uuid.uuid4().hex[:6].upper()}"

    try:
        # Siapkan petani uji dengan 4 draft (menyisakan 1 slot sebelum kuota 5).
        async with engine.begin() as conn:
            await conn.execute(
                text("""
                    INSERT INTO users (id, full_name, email, password_hash, role, is_active, created_at)
                    VALUES (:id, :full_name, :email, :password_hash, 'farmer', TRUE, CURRENT_TIMESTAMP)
                """),
                {
                    "id": test_farmer_id,
                    "full_name": "QA Petani Spasial",
                    "email": test_farmer_email,
                    "password_hash": hash_password("Password123!"),
                }
            )
            for index in range(4):
                await conn.execute(
                    text("""
                        INSERT INTO land_plots (
                            id, farmer_id, name, polygon_boundary, centroid, total_area_sqm, status
                        )
                        VALUES (
                            :id, :farmer_id, :name,
                            ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326),
                            ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)),
                            ST_Area(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography),
                            'draft'
                        )
                    """),
                    {
                        "id": uuid.uuid4(),
                        "farmer_id": test_farmer_id,
                        "name": f"{test_plot_name_prefix} DRAFT {index + 1}",
                        "geojson": json.dumps(
                            make_polygon(-6.70 + (index * 0.003), 107.10 + (index * 0.003))
                        ),
                    }
                )

        test_token = create_access_token({
            "sub": str(test_farmer_id),
            "email": test_farmer_email,
            "role": "farmer",
        })
        test_headers = {"Authorization": f"Bearer {test_token}"}

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Pendaftaran valid (Girik, < 2 Ha, tanpa dokumen) -> 201 dan mengisi slot draft ke-5
            create_res = await client.post(
                "/api/v1/farmer/lands",
                headers=test_headers,
                json={
                    "name": f"{test_plot_name_prefix} VALID",
                    "geojson_polygon": json.dumps(make_polygon(-6.55, 107.05)),
                    "ownership": "Girik / Letter C",
                    "document_no": None,
                    "status": "draft",
                }
            )
            assert create_res.status_code == 201, create_res.text
            created_payload = create_res.json()
            assert 100.0 <= created_payload["area_sqm"] <= 150000.0
            assert created_payload["status"] == "draft"

            # 2. Draft ke-6 ditolak oleh kuota 5 petak draft aktif
            quota_res = await client.post(
                "/api/v1/farmer/lands",
                headers=test_headers,
                json={
                    "name": f"{test_plot_name_prefix} OVER QUOTA",
                    "geojson_polygon": json.dumps(make_polygon(-6.56, 107.06)),
                    "ownership": "Girik / Letter C",
                    "document_no": "GIRIK-QA-001",
                    "status": "draft",
                }
            )
            assert quota_res.status_code == 400, quota_res.text
            assert "kuota" in quota_res.json()["detail"].lower()

            # 3. Guardrail petani existing: luas > 15 Ha, < 100 m², dan dokumen berjenjang
            petani_headers = await login_petani(client)
            huge_payload = {
                "name": "QA Lahan 20 Ha",
                "geojson_polygon": json.dumps(
                    make_polygon(-6.42, 107.32, 0.02, 0.02)
                ),
                "ownership": "Milik Sendiri (SHM)",
                "document_no": "SHM-QA-999",
                "status": "draft",
            }
            huge_res = await client.post("/api/v1/farmer/lands", headers=petani_headers, json=huge_payload)
            assert huge_res.status_code == 400, huge_res.text
            assert "15,00 Ha" in huge_res.json()["detail"]

            tiny_payload = {
                "name": "QA Lahan Mikro",
                "geojson_polygon": json.dumps(
                    make_polygon(-6.41, 107.51, 0.00002, 0.00002)
                ),
                "ownership": "Girik / Letter C",
                "document_no": "GIRIK-QA-002",
                "status": "draft",
            }
            tiny_res = await client.post("/api/v1/farmer/lands", headers=petani_headers, json=tiny_payload)
            assert tiny_res.status_code == 400, tiny_res.text
            assert "minimal" in tiny_res.json()["detail"].lower()

            shm_payload = {
                "name": "QA Lahan SHM Tanpa Dokumen",
                "geojson_polygon": json.dumps(make_polygon(-6.60, 107.07)),
                "ownership": "Milik Sendiri (SHM)",
                "document_no": "",
                "status": "draft",
            }
            shm_res = await client.post("/api/v1/farmer/lands", headers=petani_headers, json=shm_payload)
            assert shm_res.status_code == 400, shm_res.text
            assert "nomor dokumen" in shm_res.json()["detail"].lower()

            hgu_payload = {
                "name": "QA Lahan HGU Tanpa Dokumen",
                "geojson_polygon": json.dumps(make_polygon(-6.61, 107.07)),
                "ownership": "HGU / Perkebunan",
                "document_no": None,
                "status": "draft",
            }
            hgu_res = await client.post("/api/v1/farmer/lands", headers=petani_headers, json=hgu_payload)
            assert hgu_res.status_code == 400, hgu_res.text
            assert "nomor dokumen" in hgu_res.json()["detail"].lower()

            # 4. Girik dengan luas > 2 Ha wajib Nomor Dokumen / Surat Keterangan Desa
            large_no_doc_payload = {
                "name": "QA Lahan Girik 3 Ha",
                "geojson_polygon": json.dumps(
                    make_polygon(-6.62, 107.08, 0.0018, 0.00135)
                ),
                "ownership": "Girik / Letter C",
                "document_no": "",
                "status": "draft",
            }
            large_res = await client.post(
                "/api/v1/farmer/lands",
                headers=petani_headers,
                json=large_no_doc_payload
            )
            assert large_res.status_code == 400, large_res.text
            assert "2,00 Ha" in large_res.json()["detail"]

            # 5. Dashboard summary tidak boleh menjadwalkan draft tanpa blok pohon
            summary_res = await client.get("/api/v1/farmer/dashboard/summary", headers=petani_headers)
            assert summary_res.status_code == 200
            lands_res = await client.get("/api/v1/farmer/lands", headers=petani_headers)
            assert lands_res.status_code == 200
            zero_tree_draft_ids = {
                str(plot["id"])
                for plot in lands_res.json()
                if plot["status"] == "draft" and len(plot.get("tree_blocks") or []) == 0
            }
            scheduled_ids = {
                str(item["land_plot_id"])
                for item in summary_res.json()["upcoming_inspections"]
                if item.get("land_plot_id")
            }
            assert zero_tree_draft_ids.isdisjoint(scheduled_ids)
    finally:
        # Bersihkan seluruh data uji coba
        async with engine.begin() as conn:
            await conn.execute(
                text("""
                    DELETE FROM tree_blocks
                    WHERE land_plot_id IN (
                        SELECT id FROM land_plots WHERE farmer_id = :farmer_id
                    )
                """),
                {"farmer_id": test_farmer_id}
            )
            await conn.execute(
                text("DELETE FROM land_plots WHERE farmer_id = :farmer_id"),
                {"farmer_id": test_farmer_id}
            )
            await conn.execute(
                text("DELETE FROM users WHERE id = :farmer_id"),
                {"farmer_id": test_farmer_id}
            )
        await engine.dispose()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
