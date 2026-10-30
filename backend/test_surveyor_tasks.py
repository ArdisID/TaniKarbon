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
async def test_surveyor_tasks_and_audit():
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login sebagai surveyor
        login_res = await client.post("/api/v1/auth/login", json={
            "surveyorId": "SRV-BUDI-09",
            "pin": "847291"
        })
        assert login_res.status_code == 200, f"Login surveyor gagal: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Akses endpoint tasks tanpa auth (harus ditolak 401)
        unauth_res = await client.get("/api/v1/surveyor/tasks")
        assert unauth_res.status_code == 401

        # 3. Akses dengan token surveyor
        tasks_res = await client.get("/api/v1/surveyor/tasks", headers=headers)
        assert tasks_res.status_code == 200, f"Get tasks gagal: {tasks_res.text}"
        tasks = tasks_res.json()
        assert isinstance(tasks, list)
        assert len(tasks) > 0, "Harus mengembalikan minimal 1 lahan dari database"
        
        # Validasi struktur field per tiket
        test_task = tasks[0]
        assert "id" in test_task
        assert "farmer_name" in test_task
        assert "landName" in test_task
        assert "area_sqm" in test_task
        assert "area_ha" in test_task
        assert "status" in test_task
        assert "lat" in test_task
        assert "lng" in test_task
        assert "centroid" in test_task
        assert "tree_blocks" in test_task
        assert "survey_logs" in test_task

        plot_id = test_task["id"]

        # 4. Uji Keputusan Audit: REVISION
        rev_res = await client.post(
            f"/api/v1/surveyor/lands/{plot_id}/audit",
            headers=headers,
            json={
                "decision": "revision",
                "category": "Revisi Titik Poligon Batas",
                "notes": "Tolong geser patok utara sejauh 5 meter."
            }
        )
        assert rev_res.status_code == 200, f"Audit revision failed: {rev_res.text}"
        rev_data = rev_res.json()
        assert rev_data["decision"] == "revision"
        assert rev_data["new_status"] in ["revision", "draft"]

        # 5. Uji Keputusan Audit: REJECTED
        rej_res = await client.post(
            f"/api/v1/surveyor/lands/{plot_id}/audit",
            headers=headers,
            json={
                "decision": "rejected",
                "notes": "Lahan berada di area terlarang konservasi inti."
            }
        )
        assert rej_res.status_code == 200, f"Audit rejected failed: {rej_res.text}"
        rej_data = rej_res.json()
        assert rej_data["decision"] == "rejected"
        assert rej_data["new_status"] == "rejected"

        # 6. Uji Keputusan Audit: APPROVED
        app_res = await client.post(
            f"/api/v1/surveyor/lands/{plot_id}/audit",
            headers=headers,
            json={
                "decision": "approved",
                "notes": "Seluruh batas poligon dan populasi pohon terverifikasi valid sesuai standar MRV.",
                "block_adjustments": []
            }
        )
        assert app_res.status_code == 200, f"Audit approved failed: {app_res.text}"
        app_data = app_res.json()
        assert app_data["decision"] == "approved"
        assert app_data["new_status"] == "verified"

        # 7. Uji Endpoint GET /api/v1/surveyor/history
        hist_res = await client.get("/api/v1/surveyor/history", headers=headers)
        assert hist_res.status_code == 200, f"Get history failed: {hist_res.text}"
        history_list = hist_res.json()
        assert isinstance(history_list, list)
        assert len(history_list) > 0
        assert any(str(h["id"]) == str(plot_id) for h in history_list)
