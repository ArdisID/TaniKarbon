import asyncio
import json
import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from database import engine

@pytest.mark.asyncio
async def test_full_wizard_land_registration_flow():
    await engine.dispose()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n--- 1. Login Petani ---")
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "petani@tanikarbon.com",
            "password": "Password123!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✓ Token Petani berhasil diperoleh.")

        # Poligon demo Wonosobo: non-overlapping koordinat
        polygon_points = [
            [-7.3550, 109.9100],
            [-7.3550, 109.9110],
            [-7.3560, 109.9110],
            [-7.3560, 109.9100]
        ]
        ring = [[lng, lat] for lat, lng in polygon_points]
        ring.append(ring[0]) # close ring
        geojson = {"type": "Polygon", "coordinates": [ring]}

        print("\n--- 2. Pre-flight Validation: POST /api/v1/farmer/lands/validate-polygon ---")
        val_res = await client.post(
            "/api/v1/farmer/lands/validate-polygon",
            headers=headers,
            json={"polygon_boundary": geojson}
        )
        assert val_res.status_code == 200, f"Validation failed: {val_res.text}"
        val_data = val_res.json()
        assert val_data["valid"] is True
        print(f"✓ Pre-flight valid: {val_data['valid']}, Area: {val_data['area_sqm']:.2f} m²")

        print("\n--- 3. Pendaftaran Lahan: POST /api/v1/farmer/lands dengan Tree Blocks ---")
        payload = {
            "name": "Kebun Kopi & Sengon Garung (Uji Wizard)",
            "ownership": "Milik Sendiri (SHM)",
            "document_no": "SHM-No.9981/GARUNG",
            "village": "Garung",
            "regency": "Wonosobo",
            "status": "draft",
            "polygon_boundary": geojson,
            "geojson_polygon": json.dumps(geojson),
            "tree_blocks": [
                {
                    "species_name": "Sengon Laut",
                    "planting_year": 2021,
                    "total_population": 250,
                    "samples": [
                        {"sample_index": 1, "dbh_cm": 28.4, "circumference_cm": 89.22},
                        {"sample_index": 2, "dbh_cm": 27.2, "circumference_cm": 85.45},
                        {"sample_index": 3, "dbh_cm": 29.1, "circumference_cm": 91.42}
                    ]
                }
            ]
        }

        reg_res = await client.post("/api/v1/farmer/lands", headers=headers, json=payload)
        assert reg_res.status_code == 201, f"Register land failed: {reg_res.text}"
        land_data = reg_res.json()
        created_land_id = land_data["id"]
        assert land_data["name"] == "Kebun Kopi & Sengon Garung (Uji Wizard)"
        assert len(land_data.get("tree_blocks", [])) == 1
        tb = land_data["tree_blocks"][0]
        assert tb["species_name"] == "Sengon Laut"
        assert tb["estimated_tco2e_per_year"] > 0
        print(f"✓ Land Plot Registered: ID={created_land_id}, Name={land_data['name']}, Area={land_data['area_sqm']} m²")
        print(f"✓ Tree Block: {tb['species_name']}, Est. CO2: {tb['estimated_tco2e_per_year']} tCO2e/thn, Avg DBH: {tb['avg_dbh_cm']} cm")

        print("\n--- 4. Verifikasi di Database via GET /api/v1/farmer/lands ---")
        get_res = await client.get("/api/v1/farmer/lands", headers=headers)
        assert get_res.status_code == 200
        all_lands = get_res.json()
        target_plot = next((p for p in all_lands if str(p["id"]) == str(created_land_id)), None)
        assert target_plot is not None, "Plot tidak ditemukan pada GET /api/v1/farmer/lands"
        print(f"✓ Lahan terverifikasi di daftar lahan petani: '{target_plot['name']}' (status: {target_plot['status']})")
        assert len(target_plot["tree_blocks"]) >= 1, "Tree block tidak terhubung dengan land plot!"
        print(f"✓ Relasi tree_blocks valid di database: {target_plot['tree_blocks'][0]['species_name']} ({target_plot['tree_blocks'][0]['total_population']} pohon)")

        print("\n--- 5. Uji Spesifik Step 2: Alpukat Mentega dengan Sampling DBH & Tinggi (Sesuai Screenshot User) ---")
        alpukat_points = [
            [-7.3570, 109.9120],
            [-7.3570, 109.9130],
            [-7.3580, 109.9130],
            [-7.3580, 109.9120]
        ]
        alpukat_ring = [[lng, lat] for lat, lng in alpukat_points]
        alpukat_ring.append(alpukat_ring[0])
        alpukat_geojson = {"type": "Polygon", "coordinates": [alpukat_ring]}

        alpukat_payload = {
            "name": "Kebun Alpukat Mentega Garung",
            "ownership": "Milik Sendiri (SHM)",
            "document_no": "SHM-No.8821/ALPUKAT",
            "village": "Garung",
            "regency": "Wonosobo",
            "status": "draft",
            "polygon_boundary": alpukat_geojson,
            "geojson_polygon": json.dumps(alpukat_geojson),
            "tree_blocks": [
                {
                    "species_name": "Alpukat Mentega",
                    "planting_year": 2000,
                    "total_population": 100,
                    "samples": [
                        {"sample_index": 1, "dbh_cm": 28.0, "height_m": 12.0},
                        {"sample_index": 2, "dbh_cm": 26.0, "height_m": 14.0},
                        {"sample_index": 3, "dbh_cm": 24.0, "height_m": 14.0}
                    ]
                }
            ]
        }
        alpukat_res = await client.post("/api/v1/farmer/lands", headers=headers, json=alpukat_payload)
        assert alpukat_res.status_code == 201, f"Gagal mendaftarkan petak alpukat: {alpukat_res.text}"
        alpukat_land = alpukat_res.json()
        alpukat_land_id = alpukat_land["id"]
        assert len(alpukat_land["tree_blocks"]) == 1
        tb_alpukat = alpukat_land["tree_blocks"][0]

        # Validasi spesies Alpukat cocok (Ketterings, rho=0.43)
        assert tb_alpukat["matched_species"] == "Alpukat", f"Expected 'Alpukat', got '{tb_alpukat['matched_species']}'"
        assert tb_alpukat["formula_type"] == "ketterings"
        assert tb_alpukat["wood_density"] == 0.43
        assert tb_alpukat["avg_dbh_cm"] == 26.0
        assert tb_alpukat["avg_height_m"] == 13.33
        assert tb_alpukat["estimated_tco2e_per_year"] > 0
        print(f"✓ Alpukat Mentega terdeteksi: {tb_alpukat['matched_species']} (WD: {tb_alpukat['wood_density']})")
        print(f"✓ DBH rata-rata: {tb_alpukat['avg_dbh_cm']} cm, Tinggi rata-rata: {tb_alpukat['avg_height_m']} m")
        print(f"✓ Estimasi Serapan Karbon: {tb_alpukat['estimated_tco2e_per_year']} tCO2e/tahun")

        # Cek database GET /api/v1/farmer/lands untuk memastikan tree_samples tersimpan dan di-query dengan avg_dbh_cm
        get_res2 = await client.get("/api/v1/farmer/lands", headers=headers)
        assert get_res2.status_code == 200
        alpukat_plot = next((p for p in get_res2.json() if str(p["id"]) == str(alpukat_land_id)), None)
        assert alpukat_plot is not None
        assert alpukat_plot["tree_blocks"][0]["avg_dbh_cm"] == 26.0
        print(f"✓ GET /api/v1/farmer/lands mengembalikan avg_dbh_cm teragregasi dari tree_samples: {alpukat_plot['tree_blocks'][0]['avg_dbh_cm']} cm")

        # Hapus lahan uji coba alpukat
        del_alpukat = await client.delete(f"/api/v1/farmer/lands/{alpukat_land_id}", headers=headers)
        assert del_alpukat.status_code == 200
        print(f"✓ Lahan uji alpukat ID={alpukat_land_id} berhasil dibersihkan.")

        print("\n--- 6. Uji Error Handling: SHM Tanpa Dokumen (Validasi FastAPI 400) ---")
        bad_payload = {
            "name": "Kebun Tanpa Dokumen",
            "ownership": "Milik Sendiri (SHM)",
            "document_no": "",
            "geojson_polygon": json.dumps(geojson)
        }
        bad_res = await client.post("/api/v1/farmer/lands", headers=headers, json=bad_payload)
        assert bad_res.status_code == 400
        print(f"✓ Error tertangkap dengan benar (HTTP 400): {bad_res.json()['detail']}")

        print("\n--- 6. Cleanup Data Pengujian ---")
        del_res = await client.delete(f"/api/v1/farmer/lands/{created_land_id}", headers=headers)
        assert del_res.status_code == 200
        print(f"✓ Lahan uji coba ID={created_land_id} berhasil dibersihkan dari database.")

        await engine.dispose()
        print("\n=======================================================")
        print("  >>> SELURUH INTEGRASI FULLSTACK SELESAI DENGAN SUKSES! <<<")
        print("=======================================================\n")

