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
async def test_wallet_security_and_profile_crud_audit():
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
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # ======================================================================
        # BAGIAN 1: AUDIT KEAMANAN WALLET & LEDGER ANTI-DOUBLE SPEND
        # ======================================================================
        # 1a. Cek penolakan nominal <= 0 (Rp 0)
        res_zero = await client.post("/api/v1/farmer/wallet/withdraw", json={
            "amount": 0,
            "bank_name": "Bank BRI",
            "account_number": "0142-01-084821-50-8"
        }, headers=headers)
        assert res_zero.status_code == 422, "Penarikan nominal Rp 0 wajib ditolak (HTTP 422)"

        # 1b. Cek penolakan nominal negatif
        res_neg = await client.post("/api/v1/farmer/wallet/withdraw", json={
            "amount": -50000,
            "bank_name": "Bank BRI",
            "account_number": "0142-01-084821-50-8"
        }, headers=headers)
        assert res_neg.status_code == 422, "Penarikan nominal negatif wajib ditolak (HTTP 422)"

        # 1c. Ambil saldo saat ini
        wallet_res = await client.get("/api/v1/farmer/wallet", headers=headers)
        assert wallet_res.status_code == 200
        wallet_info = wallet_res.json()
        avail_bal = wallet_info["available_balance"]

        # 1d. Penarikan melebihi saldo -> 400 Bad Request
        res_over = await client.post("/api/v1/farmer/wallet/withdraw", json={
            "amount": avail_bal + 50000000,
            "bank_name": "Bank BRI",
            "account_number": "0142-01-084821-50-8"
        }, headers=headers)
        assert res_over.status_code == 400, "Penarikan over-balance wajib menghasilkan HTTP 400"

        # ======================================================================
        # BAGIAN 2: CRUD PROFIL MITRA TANI
        # ======================================================================
        # 2a. GET Profil Petani
        prof_get = await client.get("/api/v1/farmer/profile", headers=headers)
        assert prof_get.status_code == 200
        pdata = prof_get.json()
        assert pdata["email"] == "petani@tanikarbon.com"
        assert "nik" in pdata
        assert "gapoktan_name" in pdata

        # 2b. PATCH Update Profil Petani
        prof_patch = await client.patch("/api/v1/farmer/profile", json={
            "nik": "3307011234560001",
            "phone_number": "0812-9847-1920",
            "address": "Dusun Sikunir, RT 02 / RW 05",
            "village": "Sembungan",
            "regency": "Wonosobo",
            "province": "Jawa Tengah",
            "gapoktan_name": "Gapoktan Sindoro Lestari"
        }, headers=headers)
        assert prof_patch.status_code == 200
        up_data = prof_patch.json()
        assert up_data["nik"] == "3307011234560001"
        assert up_data["gapoktan_name"] == "Gapoktan Sindoro Lestari"
        assert up_data["village"] == "Sembungan"

        # 2c. Verifikasi persistensi
        prof_verify = await client.get("/api/v1/farmer/profile", headers=headers)
        assert prof_verify.status_code == 200
        assert prof_verify.json()["gapoktan_name"] == "Gapoktan Sindoro Lestari"

        # ======================================================================
        # BAGIAN 3: CRUD REKENING BANK & E-WALLET
        # ======================================================================
        # 3a. Buat rekening pertama (otomatis is_primary = True)
        acc1_res = await client.post("/api/v1/farmer/bank-accounts", json={
            "bank_code": "BRI",
            "bank_name": "Bank BRI",
            "account_number": "0142-01-084821-50-8",
            "account_holder_name": "Pak Joko Widodo",
            "is_primary": True
        }, headers=headers)
        assert acc1_res.status_code == 201
        acc1 = acc1_res.json()
        assert acc1["bank_code"] == "BRI"
        assert acc1["is_primary"] is True
        acc1_id = acc1["id"]

        # 3b. Buat rekening kedua (DANA E-Wallet) dan set is_primary = True
        acc2_res = await client.post("/api/v1/farmer/bank-accounts", json={
            "bank_code": "DANA",
            "bank_name": "DANA E-Wallet",
            "account_number": "0812-4921-7890",
            "account_holder_name": "Pak Joko Widodo",
            "is_primary": True
        }, headers=headers)
        assert acc2_res.status_code == 201
        acc2 = acc2_res.json()
        assert acc2["bank_code"] == "DANA"
        assert acc2["is_primary"] is True
        acc2_id = acc2["id"]

        # 3c. GET Daftar Rekening (Rekening kedua primer, rekening pertama non-primer)
        list_res = await client.get("/api/v1/farmer/bank-accounts", headers=headers)
        assert list_res.status_code == 200
        accounts = list_res.json()
        assert len(accounts) >= 2
        # Cek rekening DANA ada di urutan pertama karena is_primary=True
        assert accounts[0]["id"] == acc2_id
        assert accounts[0]["is_primary"] is True

        # Cek rekening BRI sekarang is_primary=False
        old_acc1 = next(a for a in accounts if a["id"] == acc1_id)
        assert old_acc1["is_primary"] is False

        # 3d. DELETE Rekening kedua
        del_res = await client.delete(f"/api/v1/farmer/bank-accounts/{acc2_id}", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "success"

        # 3e. Verifikasi rekening pertama otomatis dipromosikan jadi primer
        list_after_del = await client.get("/api/v1/farmer/bank-accounts", headers=headers)
        assert list_after_del.status_code == 200
        accounts_after = list_after_del.json()
        acc1_promoted = next(a for a in accounts_after if a["id"] == acc1_id)
        assert acc1_promoted["is_primary"] is True

        # Cleanup: hapus juga acc1 agar database bersih
        await client.delete(f"/api/v1/farmer/bank-accounts/{acc1_id}", headers=headers)

    await engine.dispose()

