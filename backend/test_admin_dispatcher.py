import asyncio
import os
import sys
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.dirname(__file__))

from main import app
from database import engine, AsyncSessionLocal
from security import limiter
from sqlalchemy import text

@pytest.mark.asyncio
async def test_admin_dispatcher_endpoints_and_state_transition():
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login sebagai Admin
        admin_login = await client.post("/api/v1/auth/login", json={
            "adminId": "ADM-ROOT-01",
            "password": "Password123!"
        })
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Login sebagai Petani (untuk menguji RBAC protection)
        petani_login = await client.post("/api/v1/auth/login", json={
            "email": "petani@tanikarbon.com",
            "password": "Password123!"
        })
        assert petani_login.status_code == 200
        petani_token = petani_login.json()["access_token"]
        petani_headers = {"Authorization": f"Bearer {petani_token}"}

        # 3. RBAC Check: Petani tidak boleh mengakses endpoint admin
        unauth_lands = await client.get("/api/v1/admin/lands", headers=petani_headers)
        assert unauth_lands.status_code in [401, 403]

        unauth_srv = await client.get("/api/v1/admin/surveyors", headers=petani_headers)
        assert unauth_srv.status_code in [401, 403]

        # 4. Admin memuat daftar surveyor
        srv_res = await client.get("/api/v1/admin/surveyors", headers=admin_headers)
        assert srv_res.status_code == 200
        surveyors = srv_res.json()
        assert isinstance(surveyors, list)
        assert len(surveyors) >= 1
        budi_srv = next((s for s in surveyors if "Budi" in s["full_name"]), None)
        assert budi_srv is not None
        assert "id" in budi_srv
        assert "email" in budi_srv
        assert "active_tasks" in budi_srv
        surveyor_id = budi_srv["id"]

        # 5. Admin memuat daftar lahan (dispatcher table)
        lands_res = await client.get("/api/v1/admin/lands", headers=admin_headers)
        assert lands_res.status_code == 200
        lands = lands_res.json()
        assert isinstance(lands, list)
        assert len(lands) >= 1

        # Cek struktur kolom data lahan
        sample_land = lands[0]
        assert "id" in sample_land
        assert "ticket_code" in sample_land
        assert "name" in sample_land
        assert "farmer_name" in sample_land
        assert "area_sqm" in sample_land
        assert "area_ha" in sample_land
        assert "status" in sample_land
        assert "tree_count" in sample_land
        assert "tree_blocks" in sample_land
        assert "survey_logs" in sample_land

        # Cari lahan draft untuk diuji scheduling
        target_land = next((l for l in lands if l["status"] in ["draft", "pending_survey"]), lands[0])
        target_land_id = target_land["id"]

        try:
            # 6. Jalankan PATCH /api/v1/admin/lands/{land_id}/schedule
            schedule_payload = {
                "surveyor_id": surveyor_id,
                "scheduled_survey_date": "2026-10-30",
                "priority": "Tinggi",
                "notes": "Bawa drone spasial dan alat ukur DBH laser."
            }
            sched_res = await client.patch(
                f"/api/v1/admin/lands/{target_land_id}/schedule",
                headers=admin_headers,
                json=schedule_payload
            )
            assert sched_res.status_code == 200, f"Scheduling failed: {sched_res.text}"
            sched_data = sched_res.json()
            assert sched_data["status"] == "success"
            assert sched_data["land_id"] == target_land_id
            assert sched_data["surveyor_name"] is not None

            # 7. Verifikasi perubahan di database & survey_logs
            updated_lands_res = await client.get("/api/v1/admin/lands", headers=admin_headers)
            assert updated_lands_res.status_code == 200
            updated_lands = updated_lands_res.json()
            updated_target = next(l for l in updated_lands if l["id"] == target_land_id)
            assert updated_target["surveyor_id"] == surveyor_id
            assert updated_target["scheduled_survey_date"] is not None
            assert len(updated_target["survey_logs"]) >= 1
            assert any("Bawa drone spasial" in log["notes"] for log in updated_target["survey_logs"])

        finally:
            # Pulihkan status asli agar suite test lain (seperti test_fase4) tetap memiliki petak draft
            async with AsyncSessionLocal() as session:
                await session.execute(
                    text("""
                        UPDATE land_plots 
                        SET status = CAST(:status AS land_status),
                            surveyor_id = :surveyor_id,
                            scheduled_survey_date = :scheduled_date
                        WHERE id = :id
                    """),
                    {
                        "status": "draft",
                        "surveyor_id": None,
                        "scheduled_date": None,
                        "id": target_land_id
                    }
                )
                await session.commit()

