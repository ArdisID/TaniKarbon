import asyncio
import os
import sys
import pytest
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.dirname(__file__))

from main import app
from database import engine
from security import limiter

@pytest.mark.asyncio
async def test_create_and_delete_draft_land_plot():
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login Petani
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "petani@tanikarbon.com",
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        petani_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {petani_token}"}

        # 2. Login Korporat (untuk uji RBAC/Forbidden)
        corp_login = await client.post("/api/v1/auth/login", json={
            "identifier": "esg-team@industrihijau.co.id",
            "password": "Password123!"
        })
        assert corp_login.status_code == 200
        corp_token = corp_login.json()["access_token"]
        corp_headers = {"Authorization": f"Bearer {corp_token}"}

        # 3. Create Draft Land Plot
        polygon_geojson = '{"type":"Polygon","coordinates":[[[106.83300,-6.36850],[106.83371,-6.36842],[106.83379,-6.36904],[106.83308,-6.36912],[106.83300,-6.36850]]]}'
        create_res = await client.post(
            "/api/v1/farmer/lands",
            headers=headers,
            json={
                "name": "Kebun Uji Coba Hapus",
                "geojson_polygon": polygon_geojson,
                "document_no": "DOC-TEST-DEL",
                "ownership": "Milik Sendiri (SHM)",
                "status": "draft"
            }
        )
        assert create_res.status_code == 201
        created_land = create_res.json()
        land_id = created_land["id"]
        assert created_land["name"] == "Kebun Uji Coba Hapus"

        # 4. Uji Hapus dengan Role Bukan Pemilik (Korporat -> 403)
        corp_del_res = await client.delete(f"/api/v1/farmer/lands/{land_id}", headers=corp_headers)
        assert corp_del_res.status_code in [403, 401]

        # 5. Hapus oleh Pemilik Asli (Petani -> 200 Success)
        del_res = await client.delete(f"/api/v1/farmer/lands/{land_id}", headers=headers)
        assert del_res.status_code == 200
        del_data = del_res.json()
        assert del_data["status"] == "success"
        assert del_data["deleted_id"] == str(land_id)

        # 6. Uji Hapus Kembali (Sudah terhapus -> 404 Not Found)
        re_del_res = await client.delete(f"/api/v1/farmer/lands/{land_id}", headers=headers)
        assert re_del_res.status_code == 404
