import asyncio
import os
import sys
import pytest
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.dirname(__file__))

from main import app
from database import engine, AsyncSessionLocal
from security import limiter
from sqlalchemy import text

@pytest.mark.asyncio
async def test_fase4_farmer_backend_verification():
    await engine.dispose()
    limiter.reset()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n=======================================================")
        print("  FASE 4 - TEST 1: DASHBOARD SUMMARY WITH WALLET & PROFILE")
        print("=======================================================")

        # 1. Login Petani Default
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "petani@tanikarbon.com",
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        petani_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {petani_token}"}

        # 2. Panggil GET /api/v1/farmer/dashboard/summary
        sum_res = await client.get("/api/v1/farmer/dashboard/summary", headers=headers)
        assert sum_res.status_code == 200
        data = sum_res.json()
        assert data["farmer_name"] == "Petani Agro"
        assert data["farmer_email"] == "petani@tanikarbon.com"
        assert data["total_land_plots"] >= 1
        assert data["total_land_area_sqm"] > 0
        assert data["total_all_trees"] >= 200
        assert data["total_all_carbon_tco2e"] > 0
        assert "available_balance" in data
        assert "escrow_balance" in data
        assert len(data["species_breakdown"]) >= 1
        assert data["species_breakdown"][0]["species_name"] == "Sengon Laut"
        assert "upcoming_inspections" in data
        assert len(data["upcoming_inspections"]) >= 1
        assert data["upcoming_inspections"][0]["surveyor_name"] == "Budi Surveyor"
        assert "recent_wallet_activities" in data
        assert len(data["recent_wallet_activities"]) >= 1
        print(f"  ✓ Farmer Name: {data['farmer_name']} ({data['farmer_email']})")
        print(f"  ✓ Total Plots: {data['total_land_plots']}, Area: {data['total_land_area_sqm']} sqm")
        print(f"  ✓ Trees: {data['total_all_trees']}, Carbon: {data['total_all_carbon_tco2e']} tCO2e")
        print(f"  ✓ Balances: Available Rp{data['available_balance']:,.2f}, Escrow Rp{data['escrow_balance']:,.2f}")
        print(f"  ✓ Upcoming Inspections: {len(data['upcoming_inspections'])} jadwal aktif ({data['upcoming_inspections'][0]['land_plot_name']})")
        print(f"  ✓ Recent Activities: {len(data['recent_wallet_activities'])} riwayat mutasi terdaftar")


        print("\n=======================================================")
        print("  FASE 4 - TEST 2: GET /api/v1/farmer/lands WITH TREE BLOCKS")
        print("=======================================================")

        lands_res = await client.get("/api/v1/farmer/lands", headers=headers)
        assert lands_res.status_code == 200
        lands = lands_res.json()
        assert len(lands) >= 1
        plot1 = next(p for p in lands if p["name"] == "Kebun Sengon Pertama")
        assert plot1["area_sqm"] == 500.0
        assert plot1["status"] == "verified"
        assert len(plot1["tree_blocks"]) == 2
        assert plot1["tree_blocks"][0]["species_name"] == "Sengon Laut"
        assert plot1["tree_blocks"][0]["total_population"] == 100

        plot2 = next((p for p in lands if p["name"] == "Kebun Uji Coba Swagger"), None)
        if not plot2:
            plot2 = next(p for p in lands if p["status"] == "draft")
        assert plot2["status"] == "draft"
        print(f"  ✓ Berhasil memuat {len(lands)} petak lahan beserta relasi blok pohon!")

        print("\n=======================================================")
        print("  FASE 4 - TEST 3: GET /api/v1/farmer/wallet & WITHDRAWAL")
        print("=======================================================")

        wallet_res = await client.get("/api/v1/farmer/wallet", headers=headers)
        assert wallet_res.status_code == 200
        wdata = wallet_res.json()
        assert wdata["available_balance"] >= 0.0
        assert wdata["escrow_balance"] >= 0.0
        initial_available = wdata["available_balance"]
        print(f"  ✓ Saldo Wallet Saat Ini: Rp{initial_available:,.2f}")

        # 3a. Penarikan melebihi saldo -> 400 Bad Request
        over_res = await client.post("/api/v1/farmer/wallet/withdraw", json={
            "amount": initial_available + 9999999,
            "bank_name": "Bank BRI",
            "account_number": "0142-01-084821-50-8"
        }, headers=headers)
        assert over_res.status_code == 400
        print("  ✓ Penarikan melebihi saldo berhasil dicegah (HTTP 400)")

        # 3b. Penarikan valid jika saldo > 10000
        if initial_available >= 10000:
            test_withdraw_amt = 10000
            wd_res = await client.post("/api/v1/farmer/wallet/withdraw", json={
                "amount": test_withdraw_amt,
                "bank_name": "Bank BRI",
                "account_number": "0142-01-084821-50-8"
            }, headers=headers)
            assert wd_res.status_code == 200
            assert wd_res.json()["remaining_balance"] == initial_available - test_withdraw_amt
            print(f"  ✓ Penarikan Rp{test_withdraw_amt:,.2f} berhasil diproses.")

            # Verifikasi mutasi baru tercatat di summary dan endpoint transactions
            sum_after = await client.get("/api/v1/farmer/dashboard/summary", headers=headers)
            recent_acts = sum_after.json()["recent_wallet_activities"]
            assert len(recent_acts) >= 1
            assert recent_acts[0]["transaction_type"] == "debit_withdraw"
            assert recent_acts[0]["amount"] == test_withdraw_amt
            print("  ✓ Mutasi penarikan baru terdaftar di posisi teratas recent_wallet_activities.")

            txs_res = await client.get("/api/v1/farmer/wallet/transactions", headers=headers)
            assert txs_res.status_code == 200
            assert len(txs_res.json()) >= 1
            print("  ✓ Endpoint GET /api/v1/farmer/wallet/transactions mengembalikan daftar mutasi valid.")

            # Kembalikan saldo awal agar data seed tetap konsisten
            async with engine.begin() as conn:
                await conn.execute(text("""
                    UPDATE wallets 
                    SET available_balance = :bal
                    WHERE user_id = '11111111-1111-4111-8111-111111111111'
                """), {"bal": initial_available})
            print(f"  ✓ Saldo awal Rp{initial_available:,.2f} direstorasi ke database.")

        print("\n=======================================================")
        print("  FASE 4 - TEST 4: RBAC ROUTE PROTECTION")
        print("=======================================================")

        # Login Korporat
        corp_login = await client.post("/api/v1/auth/login", json={
            "email": "esg@korporathijau.com",
            "password": "Password123!"
        })
        corp_token = corp_login.json()["access_token"]
        corp_headers = {"Authorization": f"Bearer {corp_token}"}

        # Korporat mencoba akses endpoint petani -> Harus ditolak 403 Forbidden
        forbidden_res = await client.get("/api/v1/farmer/dashboard/summary", headers=corp_headers)
        assert forbidden_res.status_code == 403
        print("  ✓ Role non-farmer ditolak saat mengakses endpoint petani (HTTP 403 Forbidden)")

        await engine.dispose()
        print("\n=======================================================")
        print("  >>> SELURUH PENGUJIAN FASE 4 BACKEND LULUS 100%! <<<")
        print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(test_fase4_farmer_backend_verification())
