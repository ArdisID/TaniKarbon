import os
import sys
import pytest
import pytest_asyncio
import uuid
import json
from httpx import AsyncClient, ASGITransport
from datetime import datetime, date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from main import app
from database import get_db, engine
from security import limiter
from sqlalchemy import text

FARMER_ID = uuid.UUID("11111111-1111-4111-8111-111111111111")
SURVEYOR_ID = uuid.UUID("22222222-2222-4222-8222-222222222222")
ADMIN_ID = uuid.UUID("99999999-9999-4999-8999-999999999999")
CLUSTER_ID = uuid.UUID("44444444-4444-4444-8444-444444444446")

@pytest.mark.asyncio
async def test_farmer_fullstack_and_cross_role_hooks():
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login Farmer
        f_login = await client.post("/api/v1/auth/login", json={
            "email": "petani@tanikarbon.com",
            "password": "Password123!"
        })
        assert f_login.status_code == 200, f_login.text
        farmer_token = f_login.json()["access_token"]
        f_headers = {"Authorization": f"Bearer {farmer_token}"}

        # 2. Login Admin
        a_login = await client.post("/api/v1/auth/login", json={
            "email": "admin@tanikarbon.com",
            "password": "Password123!"
        })
        assert a_login.status_code == 200, a_login.text
        admin_token = a_login.json()["access_token"]
        a_headers = {"Authorization": f"Bearer {admin_token}"}

        # 3. Login Surveyor
        s_login = await client.post("/api/v1/auth/login", json={
            "email": "surveyor@tanikarbon.com",
            "password": "Password123!"
        })
        assert s_login.status_code == 200, s_login.text
        surveyor_token = s_login.json()["access_token"]
        s_headers = {"Authorization": f"Bearer {surveyor_token}"}

        # ----------------------------------------------------------------------
        # TEST SECTION 1: MASTER DATA SPECIES & FARMER DASHBOARD
        # ----------------------------------------------------------------------
        # GET /api/v1/species
        sp_res = await client.get("/api/v1/species")
        assert sp_res.status_code == 200
        species_list = sp_res.json()
        assert len(species_list) >= 14
        assert any("sengon" in s["local_name"].lower() for s in species_list)

        # GET /api/v1/farmer/dashboard
        dash_res = await client.get("/api/v1/farmer/dashboard", headers=f_headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert "farmer_name" in dash_data
        assert "available_balance" in dash_data
        assert "total_all_trees" in dash_data
        assert "species_breakdown" in dash_data

        # ----------------------------------------------------------------------
        # TEST SECTION 3: PENDAFTARAN LAHAN (WIZARD) & POLYGON VALIDATION
        # ----------------------------------------------------------------------
        # Generate random unique polygon to avoid overlap
        poly_rnd = uuid.uuid4().hex[:6]
        # Unique non-overlapping coordinates in Central Java
        offset = (uuid.uuid4().int % 50000) / 10000.0 # offset in degrees
        base_lng = 112.0 + offset
        base_lat = -7.0 - offset
        d = 0.002
        poly_coords = [
            [base_lng, base_lat],
            [base_lng + d, base_lat],
            [base_lng + d, base_lat + d],
            [base_lng, base_lat + d],
            [base_lng, base_lat]
        ]
        poly_geojson = {
            "type": "Polygon",
            "coordinates": [poly_coords]
        }

        # Validate polygon
        val_res = await client.post("/api/v1/farmer/lands/validate-polygon", headers=f_headers, json={
            "polygon_boundary": poly_geojson
        })
        assert val_res.status_code == 200, val_res.text
        assert val_res.json()["valid"] is True

        # Kirim Pengajuan Verifikasi (Pendaftaran Lahan)
        # [INTEGRATION-HOOK: ROLE_ADMIN (DISPATCHER)]
        reg_payload = {
            "name": f"Kebun Kopi Lereng {poly_rnd}",
            "ownership": "SHM",
            "document_no": "SHM-2026-991",
            "village": "Sukamaju",
            "regency": "Wonosobo",
            "polygon_boundary": poly_geojson,
            "geojson_polygon": json.dumps(poly_geojson),
            "tree_blocks": [
                {
                    "species_name": "Sengon Laut",
                    "planting_year": 2021,
                    "total_population": 120,
                    "samples": [
                        {"sample_index": 1, "dbh_cm": 25.0, "height_m": 12.0},
                        {"sample_index": 2, "dbh_cm": 24.5, "height_m": 11.5},
                        {"sample_index": 3, "dbh_cm": 25.5, "height_m": 12.5}
                    ]
                }
            ]
        }
        reg_res = await client.post("/api/v1/farmer/lands", headers=f_headers, json={
            "name": reg_payload["name"],
            "ownership": reg_payload["ownership"],
            "document_no": reg_payload["document_no"],
            "village": reg_payload["village"],
            "regency": reg_payload["regency"],
            "geojson_polygon": reg_payload["geojson_polygon"],
            "polygon_boundary": reg_payload["polygon_boundary"],
            "tree_blocks": reg_payload["tree_blocks"]
        })
        assert reg_res.status_code == 201, reg_res.text
        created_land = reg_res.json()
        land_id = created_land["id"]
        assert created_land["status"] == "draft"

        # ----------------------------------------------------------------------
        # TEST SECTION 2: MANAJEMEN LAHAN & ADD TREE BLOCK
        # ----------------------------------------------------------------------
        # GET /api/v1/farmer/lands
        lands_res = await client.get("/api/v1/farmer/lands", headers=f_headers)
        assert lands_res.status_code == 200
        farmer_lands = lands_res.json()
        assert any(str(l["id"]) == str(land_id) for l in farmer_lands)

        # POST /api/v1/farmer/lands/{land_id}/blocks (+ Tambah Blok Pohon)
        block_res = await client.post(f"/api/v1/farmer/lands/{land_id}/blocks", headers=f_headers, json={
            "species_name": "Kopi Arabika",
            "planting_year": 2022,
            "total_population": 80,
            "samples": [
                {"sample_index": 1, "dbh_cm": 15.0},
                {"sample_index": 2, "dbh_cm": 14.8},
                {"sample_index": 3, "dbh_cm": 15.2}
            ]
        })
        assert block_res.status_code == 201, block_res.text
        assert block_res.json()["status"] == "success"

        # ----------------------------------------------------------------------
        # TEST CROSS-ROLE HOOK: ROLE_ADMIN (DISPATCHER)
        # ----------------------------------------------------------------------
        # Admin membaca daftar lahan
        adm_lands_res = await client.get("/api/v1/admin/lands", headers=a_headers)
        assert adm_lands_res.status_code == 200
        adm_plots = adm_lands_res.json()
        target_adm_plot = next((p for p in adm_plots if str(p["id"]) == str(land_id)), None)
        assert target_adm_plot is not None

        # Admin menjadwalkan surveyor
        sched_time = (datetime.utcnow() + timedelta(days=2)).isoformat()
        sched_res = await client.patch(f"/api/v1/admin/lands/{land_id}/schedule", headers=a_headers, json={
            "surveyor_id": str(SURVEYOR_ID),
            "scheduled_survey_date": sched_time,
            "priority": "Tinggi",
            "notes": "Prioritas verifikasi sensus DBH"
        })
        assert sched_res.status_code == 200, sched_res.text
        assert sched_res.json()["status"] == "success" or sched_res.json().get("current_status") == "pending_survey"

        # ----------------------------------------------------------------------
        # TEST CROSS-ROLE HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)
        # ----------------------------------------------------------------------
        # Surveyor upload foto geotag
        fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        photo_res = await client.post(
            f"/api/v1/surveyor/lands/{land_id}/photos",
            headers={"Authorization": f"Bearer {surveyor_token}"},
            files={"file": ("tree_sample_01.png", fake_png, "image/png")},
            data={
                "caption": "Pohon Sampel 1 - Sengon",
                "sample_code": "SMP-01",
                "dbh_cm": "25.2",
                "height_m": "12.0",
                "latitude": "-7.4568",
                "longitude": "110.1240"
            }
        )
        assert photo_res.status_code in [200, 201], photo_res.text
        assert photo_res.json()["status"] == "success"

        # Surveyor audit: minta revisi
        audit_rev_res = await client.post(f"/api/v1/surveyor/lands/{land_id}/audit", headers=s_headers, json={
            "decision": "revision",
            "category": "Koreksi Batas Timur",
            "notes": "Patok batas sisi timur melewati saluran air warga, mohon digeser 2 meter."
        })
        assert audit_rev_res.status_code == 200, audit_rev_res.text
        assert audit_rev_res.json()["status"] == "success"

        # Petani mengecek status revisi di Section 4 Lacak Verifikasi
        lands_after_audit = (await client.get("/api/v1/farmer/lands", headers=f_headers)).json()
        revised_plot = next(p for p in lands_after_audit if str(p["id"]) == str(land_id))
        assert len(revised_plot["photos"]) >= 1
        assert len(revised_plot["survey_logs"]) >= 1

        # Petani mengajukan respon revisi: PUT /api/v1/farmer/lands/{land_id}/revise
        farmer_rev_res = await client.put(f"/api/v1/farmer/lands/{land_id}/revise", headers=f_headers, json={
            "category": "Revisi Titik Poligon Batas",
            "notes": "Batas timur sudah kami sesuaikan berjarak 2.5m dari saluran air warga.",
            "detail_notes": "Batas timur sudah kami sesuaikan berjarak 2.5m dari saluran air warga."
        })
        assert farmer_rev_res.status_code in [200, 201], farmer_rev_res.text

        # Surveyor audit: Approved
        audit_app_res = await client.post(f"/api/v1/surveyor/lands/{land_id}/audit", headers=s_headers, json={
            "decision": "approved",
            "notes": "Verifikasi ulang sukses. Batas poligon dan sampel pohon sah sesuai MRV.",
            "block_adjustments": []
        })
        assert audit_app_res.status_code == 200, audit_app_res.text

        # ----------------------------------------------------------------------
        # TEST CROSS-ROLE HOOK: ROLE_ADMIN (CLUSTERING & EXTERNAL AUDIT)
        # ----------------------------------------------------------------------
        mint_res = await client.patch(f"/api/v1/admin/clusters/{CLUSTER_ID}/approve-audit", headers=a_headers, json={
            "auditor_organization": "PT Sucofindo (Persero)",
            "audit_report_no": "BAP-SUCOFINDO-2026-FINAL",
            "approved_quota_tco2e": 500.0,
            "cost_recovery_idr": 20000000.0
        })
        assert mint_res.status_code == 200, mint_res.text
        assert mint_res.json()["status"] == "available_for_sale"

        # ----------------------------------------------------------------------
        # TEST SECTION 5: DOMPET KARBON & BANK ACCOUNTS CRUD
        # ----------------------------------------------------------------------
        # Tambah Rekening Bank
        acc_res = await client.post("/api/v1/farmer/bank-accounts", headers=f_headers, json={
            "bank_code": "BCA",
            "bank_name": "Bank Central Asia",
            "account_number": "8899112233",
            "account_holder_name": "JOKO WIDODO",
            "is_primary": False
        })
        assert acc_res.status_code == 201, acc_res.text
        new_acc = acc_res.json()
        acc_id = new_acc["id"]

        # Jadikan Rekening Utama
        pri_res = await client.patch(f"/api/v1/farmer/bank-accounts/{acc_id}/primary", headers=f_headers)
        assert pri_res.status_code == 200, pri_res.text
        assert pri_res.json()["is_primary"] is True

        # Hapus Rekening
        del_acc_res = await client.delete(f"/api/v1/farmer/bank-accounts/{acc_id}", headers=f_headers)
        assert del_acc_res.status_code == 200, del_acc_res.text

        # Tarik Dana Dompet
        # [INTEGRATION-HOOK: ROLE_ADMIN (FINANCE & ESCROW PAYOUT) & ROLE_CORPORATE (CARBON BUYER)]
        # Pastikan saldo tersedia cukup untuk penarikan tes
        async for session in get_db():
            await session.execute(text("UPDATE wallets SET available_balance = available_balance + 250000 WHERE user_id = :uid"), {"uid": FARMER_ID})
            await session.commit()
            break

        wd_res = await client.post("/api/v1/farmer/wallet/withdraw", headers=f_headers, json={
            "amount": 100000.0,
            "bank_name": "Bank BRI",
            "account_number": "0142-01-084821-50-8"
        })
        assert wd_res.status_code == 200, wd_res.text
        tx_id = wd_res.json()["transaction_id"]

        # Admin Finance approve withdrawal
        app_wd_res = await client.patch(f"/api/v1/admin/withdrawals/{tx_id}", headers=a_headers, json={
            "bank_reference_no": "REF-BRI-20261030-9901",
            "admin_notes": "Pencairan dividen disetujui tanpa potongan"
        })
        assert app_wd_res.status_code == 200, app_wd_res.text

        # Cleanup test plot
        del_plot_res = await client.delete(f"/api/v1/farmer/lands/{land_id}", headers=f_headers)
        # Plot is verified, so deletion should properly return 400 bad request (protected)
        assert del_plot_res.status_code == 400

        print("\nAll Farmer Fullstack Sections & Cross-Role Hooks PASSED 100%!")
