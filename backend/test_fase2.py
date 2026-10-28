import asyncio
import os
import sys
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.dirname(__file__))

from main import app
from database import engine, AsyncSessionLocal
from models import User, Wallet
from security import limiter
from sqlalchemy.future import select
from sqlalchemy import text

@pytest.mark.asyncio
async def test_fase2_complete_verification():
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n=======================================================")
        print("  TEST 1: LOGIN DEFAULT ACCOUNTS & IDENTIFIER ALIASES")
        print("=======================================================")
        
        # 1a. Login Petani dengan Email
        res = await client.post("/api/v1/auth/login", json={
            "email": "petani@tanikarbon.com",
            "password": "Password123!"
        })
        assert res.status_code == 200, f"Petani email login failed: {res.text}"
        petani_data = res.json()
        assert petani_data["role"] == "farmer"
        petani_token = petani_data["access_token"]
        print("  ✓ Login Petani via Email: SUCCESS")

        # 1b. Login Petani via No Telepon / Alias Frontend (0812-9847-1920)
        res = await client.post("/api/v1/auth/login", json={
            "identifier": "0812-9847-1920",
            "password": "Password123!"
        })
        assert res.status_code == 200, f"Petani alias login failed: {res.text}"
        print("  ✓ Login Petani via Alias Telepon (0812-9847-1920): SUCCESS")

        # 1c. Login Korporat via Alias Frontend (esg-team@industrihijau.co.id)
        res = await client.post("/api/v1/auth/login", json={
            "identifier": "esg-team@industrihijau.co.id",
            "password": "Password123!"
        })
        assert res.status_code == 200, f"Korporat alias login failed: {res.text}"
        corp_data = res.json()
        assert corp_data["role"] in ["company", "corporate"]
        corp_token = corp_data["access_token"]
        print("  ✓ Login Korporat via Alias (esg-team@industrihijau.co.id): SUCCESS")

        # 1d. Login Admin via Alias ADM-ROOT-01
        res = await client.post("/api/v1/auth/login", json={
            "adminId": "ADM-ROOT-01",
            "password": "Password123!"
        })
        assert res.status_code == 200, f"Admin alias login failed: {res.text}"
        admin_data = res.json()
        assert admin_data["role"] == "admin"
        admin_token = admin_data["access_token"]
        print("  ✓ Login Admin via Alias (ADM-ROOT-01): SUCCESS")

        # 1e. Login Surveyor via Alias SRV-BUDI-09 dan PIN 847291
        res = await client.post("/api/v1/auth/login", json={
            "surveyorId": "SRV-BUDI-09",
            "pin": "847291"
        })
        assert res.status_code == 200, f"Surveyor alias login failed: {res.text}"
        surveyor_data = res.json()
        assert surveyor_data["role"] == "surveyor"
        surveyor_token = surveyor_data["access_token"]
        print("  ✓ Login Surveyor via Alias (SRV-BUDI-09) & PIN (847291): SUCCESS")

        # 1g. Test /api/v1/auth/me
        res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {petani_token}"})
        assert res.status_code == 200
        me = res.json()
        assert me["email"] == "petani@tanikarbon.com"
        assert me["role"] == "farmer"
        print("  ✓ GET /api/v1/auth/me dengan token valid: SUCCESS")


        print("\n=======================================================")
        print("  TEST 2: REGISTER USER BARU & AUTO-CREATION WALLET")
        print("=======================================================")
        limiter.reset()
        unique_suffix = uuid.uuid4().hex[:6]
        new_email = f"petani.baru.{unique_suffix}@tanikarbon.com"
        
        reg_res = await client.post("/api/v1/auth/register", json={
            "email": new_email,
            "full_name": "Pak Tani Uji Coba",
            "password": "PasswordBaru123!",
            "role": "farmer"
        })
        assert reg_res.status_code == 200, f"Register failed: {reg_res.text}"
        reg_data = reg_res.json()
        assert reg_data["email"] == new_email
        assert reg_data["role"] == "farmer"
        new_user_id = reg_data["user_id"]
        print(f"  ✓ Registrasi user baru ({new_email}): SUCCESS")

        # Cek duplikat register -> harus 400
        dup_res = await client.post("/api/v1/auth/register", json={
            "email": new_email,
            "full_name": "Duplikat",
            "password": "PasswordBaru123!",
            "role": "farmer"
        })
        assert dup_res.status_code == 400
        print("  ✓ Pencegahan duplikasi email (HTTP 400): SUCCESS")

        # Verifikasi Wallet di Database
        async with AsyncSessionLocal() as session:
            wallet_res = await session.execute(select(Wallet).where(Wallet.user_id == uuid.UUID(new_user_id)))
            created_wallet = wallet_res.scalars().first()
            assert created_wallet is not None, "Wallet baru tidak ditemukan di database!"
            assert float(created_wallet.available_balance) == 0.00
            print(f"  ✓ Inisiatif Relasi Database: Wallet otomatis dibuat dengan saldo Rp0.00 (Wallet ID: {created_wallet.id})")


        print("\n=======================================================")
        print("  TEST 3: RBAC GUARD & PEMBONGKARAN HARDCODE FARMER_ID")
        print("=======================================================")
        
        # 3a. Akses endpoint petani DENGAN token petani -> Harus 200
        res = await client.get("/api/v1/farmer/lands", headers={"Authorization": f"Bearer {petani_token}"})
        assert res.status_code == 200
        lands = res.json()
        print(f"  ✓ Petani mengakses GET /api/v1/farmer/lands (HTTP 200, count: {len(lands)})")

        # 3b. Akses endpoint petani TANPA token -> Harus 401/403
        res = await client.get("/api/v1/farmer/lands")
        assert res.status_code in [401, 403]
        print(f"  ✓ Akses tanpa token ditolak (HTTP {res.status_code}): SUCCESS")

        # 3c. Akses endpoint petani DENGAN token korporat -> Harus 403 Forbidden
        res = await client.get("/api/v1/farmer/lands", headers={"Authorization": f"Bearer {corp_token}"})
        assert res.status_code == 403
        print(f"  ✓ Korporat mengakses endpoint petani ditolak (HTTP 403): SUCCESS")

        # 3d. Akses endpoint petani DENGAN token admin -> Harus 403 Forbidden
        res = await client.get("/api/v1/farmer/lands", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 403
        print(f"  ✓ Admin mengakses endpoint petani ditolak (HTTP 403): SUCCESS")

        # 3e. Dashboard summary petani
        res = await client.get("/api/v1/farmer/dashboard/summary", headers={"Authorization": f"Bearer {petani_token}"})
        assert res.status_code == 200
        summary = res.json()
        print(f"  ✓ Petani mengakses GET /api/v1/farmer/dashboard/summary: Total Area {summary['total_land_area_sqm']} sqm")

        # 3f. Proteksi Admin: Petani mencoba distribute-revenue -> Harus 403 Forbidden
        res = await client.post("/api/v1/admin/distribute-revenue", 
            json={"transaction_id": "00000000-0000-0000-0000-000000000000"},
            headers={"Authorization": f"Bearer {petani_token}"}
        )
        assert res.status_code == 403
        print("  ✓ Petani mencoba akses endpoint admin ditolak (HTTP 403): SUCCESS")


        print("\n=======================================================")
        print("  TEST 4: SLOWAPI RATE LIMITER (ANTI BRUTE-FORCE)")
        print("=======================================================")
        limiter.reset()
        
        # Test rate limit pada endpoint login (limit: 5/minute)
        # Kirim 6 request berturut-turut
        rate_limited = False
        status_codes = []
        for i in range(7):
            r = await client.post("/api/v1/auth/login", json={
                "email": "petani@tanikarbon.com",
                "password": "Password123!"
            })
            status_codes.append(r.status_code)
            if r.status_code == 429:
                rate_limited = True
                print(f"  ✓ Request ke-{i+1} terkena blokir rate limit: HTTP 429 Too Many Requests")
                break
                
        print(f"  Status perulangan login: {status_codes}")
        assert rate_limited is True, f"Rate limiter tidak memblokir! Statuses: {status_codes}"
        print("  ✓ Rate Limiter SlowAPI (5/minute) Terbukti Aktif & Memblokir!")

        await engine.dispose()

        print("\n=======================================================")
        print("  >>> SELURUH 4 PENGUJIAN FASE 2 LULUS 100%! <<<")
        print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(test_fase2_complete_verification())
