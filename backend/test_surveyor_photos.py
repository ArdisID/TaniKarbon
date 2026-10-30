import asyncio
import io
import os
import sys
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.dirname(__file__))

from main import app
from database import engine
from security import limiter

@pytest.mark.asyncio
async def test_surveyor_photo_upload_and_admin_inspection():
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login sebagai Surveyor
        surveyor_login = await client.post("/api/v1/auth/login", json={
            "surveyorId": "SRV-BUDI-09",
            "pin": "847291"
        })
        assert surveyor_login.status_code == 200, f"Login surveyor gagal: {surveyor_login.text}"
        srv_token = surveyor_login.json()["access_token"]
        srv_headers = {"Authorization": f"Bearer {srv_token}"}

        # 2. Ambil daftar tugas surveyor untuk mendapatkan ID lahan
        tasks_res = await client.get("/api/v1/surveyor/tasks", headers=srv_headers)
        assert tasks_res.status_code == 200
        tasks = tasks_res.json()
        assert len(tasks) > 0, "Harus ada minimal 1 tugas untuk Budi Surveyor"
        test_land_id = tasks[0]["id"]

        # 3. Buat dummy file gambar 1x1 GIF / PNG
        dummy_image_bytes = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
        files = {
            "file": ("patok_utara_dummy.gif", io.BytesIO(dummy_image_bytes), "image/gif")
        }
        data = {
            "title": "Foto Patok Batas Utara",
            "coord": "-6.368600, 106.833100",
            "timestamp": "Hari ini · 10:15 WIB"
        }

        # 4. Unggah foto via POST /api/v1/surveyor/lands/{land_id}/photos
        upload_res = await client.post(
            f"/api/v1/surveyor/lands/{test_land_id}/photos",
            headers=srv_headers,
            files=files,
            data=data
        )
        assert upload_res.status_code == 200, f"Upload foto gagal: {upload_res.text}"
        upload_data = upload_res.json()
        assert upload_data["status"] == "success"
        assert "photo" in upload_data
        photo_info = upload_data["photo"]
        assert photo_info["title"] == "Foto Patok Batas Utara"
        assert photo_info["name"] == "patok_utara_dummy.gif"
        assert "url" in photo_info
        photo_id = photo_info["id"]

        # 5. Verifikasi foto tersimpan via GET /api/v1/surveyor/lands/{land_id}/photos
        get_photos_res = await client.get(
            f"/api/v1/surveyor/lands/{test_land_id}/photos",
            headers=srv_headers
        )
        assert get_photos_res.status_code == 200
        photos_list = get_photos_res.json()
        assert any(p["id"] == photo_id for p in photos_list), "Foto yang baru diunggah harus ada di daftar"

        # 6. Login sebagai Admin & verifikasi bahwa foto terlihat di GET /api/v1/admin/lands
        admin_login = await client.post("/api/v1/auth/login", json={
            "adminId": "ADM-ROOT-01",
            "password": "Password123!"
        })
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        admin_lands_res = await client.get("/api/v1/admin/lands", headers=admin_headers)
        assert admin_lands_res.status_code == 200
        admin_lands = admin_lands_res.json()
        target_land = next((l for l in admin_lands if l["id"] == test_land_id), None)
        assert target_land is not None, "Lahan target harus ada di dashboard admin"
        assert "photos" in target_land
        assert any(p["id"] == photo_id for p in target_land["photos"]), "Foto surveyor harus dapat dilihat oleh Admin"

        # 7. Uji Hapus Foto via DELETE
        del_res = await client.delete(
            f"/api/v1/surveyor/lands/{test_land_id}/photos/{photo_id}",
            headers=srv_headers
        )
        assert del_res.status_code == 200
        del_data = del_res.json()
        assert del_data["status"] == "success"
        assert all(p["id"] != photo_id for p in del_data["photos"])

