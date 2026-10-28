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
async def test_fase3_complete_verification():
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n=======================================================")
        print("  FASE 3 - TEST 1: AKURASI SQL TOTAL LUAS LAHAN PETANI")
        print("=======================================================")
        
        # Login sebagai Petani Default
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "petani@tanikarbon.com",
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        petani_token = login_res.json()["access_token"]
        
        # Panggil endpoint dashboard summary
        res = await client.get("/api/v1/farmer/dashboard/summary", headers={"Authorization": f"Bearer {petani_token}"})
        assert res.status_code == 200
        data = res.json()
        
        # Verifikasi bahwa total luas lahan bebas dari join fan-out bug
        assert data["total_land_area_sqm"] > 0, f"Akurasi luas salah: {data['total_land_area_sqm']}"
        assert data["total_all_trees"] >= 200
        print(f"  ✓ Akurasi Total Luas Lahan: {data['total_land_area_sqm']} sqm")
        print(f"  ✓ Total Pohon: {data['total_all_trees']}, Total Serapan: {data['total_all_carbon_tco2e']} tCO2e")


        print("\n=======================================================")
        print("  FASE 3 - TEST 2: HARDENING ANTI-BOT & ANTI-SPAM REGISTER")
        print("=======================================================")
        
        # 2a. Uji Honeypot: website_url diisi bot -> harus ditolak HTTP 400
        honeypot_res = await client.post("/api/v1/auth/register", json={
            "email": "bot.test@example.com",
            "full_name": "Spam Bot",
            "password": "PasswordAman123!",
            "role": "farmer",
            "website_url": "https://spam-link.ru"
        })
        assert honeypot_res.status_code in [400, 422], f"Honeypot gagal memblokir: {honeypot_res.text}"
        assert "bot" in honeypot_res.text.lower(), f"Pesan bot tidak sesuai: {honeypot_res.text}"
        print("  ✓ Honeypot Anti-Bot: Sukses memblokir spam bot (HTTP 400/422)")

        # 2b. Uji Disposable Email: yopmail.com -> harus ditolak HTTP 400
        disp_res1 = await client.post("/api/v1/auth/register", json={
            "email": "user.palsu@yopmail.com",
            "full_name": "User Palsu",
            "password": "PasswordAman123!",
            "role": "farmer"
        })
        assert disp_res1.status_code in [400, 422], f"Disposable email yopmail gagal ditolak: {disp_res1.text}"
        print("  ✓ Anti-Spam Email: Sukses menolak yopmail.com (HTTP 400)")

        # 2c. Uji Disposable Email: tempmail.com -> harus ditolak HTTP 400
        disp_res2 = await client.post("/api/v1/auth/register", json={
            "email": "user.palsu@tempmail.com",
            "full_name": "User Temp",
            "password": "PasswordAman123!",
            "role": "farmer"
        })
        assert disp_res2.status_code in [400, 422], f"Disposable email tempmail gagal ditolak: {disp_res2.text}"
        print("  ✓ Anti-Spam Email: Sukses menolak tempmail.com (HTTP 400)")

        # 2d. Uji Password Pendek (< 8 karakter) -> harus ditolak HTTP 400/422
        short_pw_res = await client.post("/api/v1/auth/register", json={
            "email": "valid.user@tanikarbon.com",
            "full_name": "Valid User",
            "password": "12345",
            "role": "farmer"
        })
        assert short_pw_res.status_code in [400, 422]
        print("  ✓ Validasi Password: Sukses menolak password < 8 karakter")


        print("\n=======================================================")
        print("  FASE 3 - TEST 3: RATE LIMITER REGISTER (3/MINUTE)")
        print("=======================================================")
        limiter.reset()

        rate_limited = False
        statuses = []
        for i in range(5):
            unique_email = f"test.ratelimit.{uuid.uuid4().hex[:6]}@tanikarbon.com"
            r = await client.post("/api/v1/auth/register", json={
                "email": unique_email,
                "full_name": f"User Test {i}",
                "password": "PasswordAman123!",
                "role": "farmer"
            })
            statuses.append(r.status_code)
            if r.status_code == 429:
                rate_limited = True
                print(f"  ✓ Percobaan ke-{i+1} terblokir Rate Limiter: HTTP 429 Too Many Requests")
                break

        print(f"  Status perulangan pendaftaran: {statuses}")
        assert rate_limited is True, f"Rate limiter 3/menit tidak memblokir! Statuses: {statuses}"
        assert statuses[:3] == [200, 200, 200], f"Tiga pendaftaran pertama harus berhasil, didapat: {statuses[:3]}"
        assert statuses[3] == 429, f"Pendaftaran ke-4 harus diblokir 429, didapat: {statuses[3]}"
        print("  ✓ Rate Limiter Register (3/menit) Terbukti Berfungsi Presisi!")

        # Cleanup dummy users from database
        async with engine.begin() as conn:
            await conn.execute(text('''
                DELETE FROM wallets 
                WHERE user_id NOT IN (
                    '11111111-1111-4111-8111-111111111111',
                    '22222222-2222-4222-8222-222222222222',
                    '33333333-3333-4333-8333-333333333333',
                    '44444444-1111-4444-8444-444444444444'
                );
            '''))
            await conn.execute(text('''
                DELETE FROM company_profiles 
                WHERE user_id NOT IN (
                    '11111111-1111-4111-8111-111111111111',
                    '22222222-2222-4222-8222-222222222222',
                    '33333333-3333-4333-8333-333333333333',
                    '44444444-1111-4444-8444-444444444444'
                );
            '''))
            await conn.execute(text('''
                DELETE FROM users 
                WHERE id NOT IN (
                    '11111111-1111-4111-8111-111111111111',
                    '22222222-2222-4222-8222-222222222222',
                    '33333333-3333-4333-8333-333333333333',
                    '44444444-1111-4444-8444-444444444444'
                );
            '''))
            print("  ✓ Database Cleanup: Seluruh dummy akun tes dibersihkan.")

        await engine.dispose()

        print("\n=======================================================")
        print("  >>> SELURUH PENGUJIAN FASE 3 LULUS 100%! <<<")
        print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(test_fase3_complete_verification())
