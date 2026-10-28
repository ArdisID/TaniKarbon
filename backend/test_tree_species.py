import asyncio
import math
import os
import sys
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.dirname(__file__))

from main import app, on_startup
from database import engine
from sqlalchemy import text

@pytest.mark.asyncio
async def test_tree_species_master_and_allometric_calculation():
    await on_startup()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n=======================================================")
        print("  TEST 13 SPESIES RESMI & MESIN ALOMETRIK ICRAF / KLHK")
        print("=======================================================")

        # 1. Test GET /api/v1/tree-species
        species_res = await client.get("/api/v1/tree-species")
        assert species_res.status_code == 200
        species_list = species_res.json()
        assert len(species_list) >= 14, f"Diharapkan minimal 14 spesies, diperoleh {len(species_list)}"

        # Verifikasi urutan: harus alfabetis, dan opsi Lainnya ditaruh paling bawah
        names = [s["local_name"] for s in species_list]
        assert names[-1].startswith("Lainnya"), f"Opsi 'Lainnya' harus di urutan terbawah: {names[-1]}"
        non_other = [n for n in names if not n.startswith("Lainnya")]
        assert non_other == sorted(non_other), "Daftar non-Lainnya harus terurut secara alfabetis"
        print(f"  ✓ GET /api/v1/tree-species sukses mengembalikan {len(species_list)} spesies terurut alfabetis dengan 'Lainnya' di posisi terbawah.")

        # Verifikasi ke-13 spesies standar dan parameternya
        species_map = {s["local_name"]: s for s in species_list}

        expected_official = [
            "Mangga", "Alpukat", "Nangka", "Durian",
            "Sengon", "Jati", "Mahoni", "Gamal", "Turi",
            "Kopi", "Kakao", "Kelapa", "Pisang"
        ]
        for sp in expected_official:
            assert sp in species_map, f"Spesies {sp} tidak ditemukan dalam daftar master data!"

        # Verifikasi tidak ada nama duplikat lama
        obsolete_names = ["Alpukat Mentega", "Kopi Arabika", "Sengon Buto", "Akasia", "Karet"]
        for obs in obsolete_names:
            assert obs not in species_map, f"Spesies duplikat lama '{obs}' masih ada di database!"
        print("  ✓ Verifikasi 13 Spesies Resmi lengkap dan data duplikat lama telah dibersihkan.")

        # Verifikasi parameter spesifik ICRAF/KLHK
        kelapa = species_map["Kelapa"]
        assert kelapa["formula_type"] == "monocot_cylinder"
        assert kelapa["requires_height"] is True
        assert float(kelapa["wood_density"]) == 0.73

        sengon = species_map["Sengon"]
        assert sengon["formula_type"] == "power_law"
        assert float(sengon["coeff_a"]) == 0.1127
        assert float(sengon["exp_b"]) == 2.3983
        assert sengon["requires_height"] is False

        mangga = species_map["Mangga"]
        assert mangga["formula_type"] == "ketterings"
        assert float(mangga["wood_density"]) == 0.58
        assert mangga["requires_height"] is False
        print("  ✓ Parameter formula (Ketterings, Power-law, Monocot-cylinder) diverifikasi valid.")

        # 2. Login Farmer untuk menguji kalkulasi alometrik POST /api/v1/farmer/tree-blocks
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "petani@tanikarbon.com",
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        petani_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {petani_token}"}

        # Ambil lahan petani untuk pengetesan blok pohon
        lands_res = await client.get("/api/v1/farmer/lands", headers=headers)
        assert lands_res.status_code == 200
        lands = lands_res.json()
        assert len(lands) > 0, "Harus ada minimal 1 lahan untuk pengujian."
        test_plot_id = lands[0]["id"]

        # Sampel keliling batang (circumference in cm)
        # c = 78.54 cm -> D = 78.54 / pi = ~25.0 cm
        sample_circumferences = [
            {"circumference_cm": 78.5398},
            {"circumference_cm": 78.5398},
            {"circumference_cm": 78.5398}
        ]
        created_block_ids = []

        # 3. Test Power-law: Sengon (dengan alias 'Sengon Laut')
        # D = 25 cm -> AGB = 0.1127 * (25 ** 2.3983) = ~248.87 kg
        sengon_req = {
            "land_plot_id": test_plot_id,
            "species_name": "Sengon Laut",
            "planting_year": 2021,
            "total_population": 100,
            "samples": sample_circumferences
        }
        res_sengon = await client.post("/api/v1/farmer/tree-blocks", json=sengon_req, headers=headers)
        assert res_sengon.status_code == 200
        sengon_data = res_sengon.json()
        assert sengon_data["formula_type"] == "power_law"
        assert sengon_data["matched_species"] == "Sengon"
        created_block_ids.append(sengon_data["tree_block_id"])

        expected_agb_sengon = 0.1127 * (25.0 ** 2.3983)
        assert abs(sengon_data["avg_agb_kg"] - expected_agb_sengon) < 1.0
        print(f"  ✓ Power-Law Sengon Laut (matched to Sengon): avg_agb_kg={sengon_data['avg_agb_kg']} kg (Expected ~{expected_agb_sengon:.2f} kg)")

        # 4. Test Ketterings: Mangga
        # D = 25 cm, rho = 0.58 -> AGB = 0.11 * 0.58 * (25 ** 2.62) = ~303.49 kg
        mangga_req = {
            "land_plot_id": test_plot_id,
            "species_name": "Mangga",
            "planting_year": 2021,
            "total_population": 100,
            "samples": sample_circumferences
        }
        res_mangga = await client.post("/api/v1/farmer/tree-blocks", json=mangga_req, headers=headers)
        assert res_mangga.status_code == 200
        mangga_data = res_mangga.json()
        assert mangga_data["formula_type"] == "ketterings"
        created_block_ids.append(mangga_data["tree_block_id"])

        expected_agb_mangga = 0.11 * 0.58 * (25.0 ** 2.62)
        assert abs(mangga_data["avg_agb_kg"] - expected_agb_mangga) < 1.5
        print(f"  ✓ Ketterings Mangga (rho=0.58): avg_agb_kg={mangga_data['avg_agb_kg']} kg (Expected ~{expected_agb_mangga:.2f} kg)")

        # 5. Test Monocot-Cylinder: Kelapa Tanpa Tinggi Batang (Harus ditolak 400 Bad Request)
        kelapa_no_height = {
            "land_plot_id": test_plot_id,
            "species_name": "Kelapa",
            "planting_year": 2020,
            "total_population": 50,
            "samples": sample_circumferences
        }
        res_kelapa_fail = await client.post("/api/v1/farmer/tree-blocks", json=kelapa_no_height, headers=headers)
        assert res_kelapa_fail.status_code == 400, "Kelapa tanpa tinggi batang harus ditolak 400 Bad Request!"
        assert "Kelapa" in res_kelapa_fail.json()["detail"]
        print("  ✓ Monocot-Cylinder Kelapa tanpa tinggi batang berhasil ditolak dengan HTTP 400!")

        # 6. Test Monocot-Cylinder: Kelapa Dengan Tinggi Batang (H = 10.0 m)
        # D = 25 cm -> radius = 25 / 200 = 0.125 m
        # AGB = pi * (0.125 ** 2) * 10 * 730 = pi * 0.015625 * 7300 = ~358.34 kg
        kelapa_valid = {
            "land_plot_id": test_plot_id,
            "species_name": "Kelapa",
            "planting_year": 2020,
            "total_population": 50,
            "samples": sample_circumferences,
            "height_m": 10.0
        }
        res_kelapa_ok = await client.post("/api/v1/farmer/tree-blocks", json=kelapa_valid, headers=headers)
        assert res_kelapa_ok.status_code == 200
        kelapa_data = res_kelapa_ok.json()
        assert kelapa_data["formula_type"] == "monocot_cylinder"
        created_block_ids.append(kelapa_data["tree_block_id"])

        expected_agb_kelapa = math.pi * ((25.0 / 200.0) ** 2) * 10.0 * 730.0
        assert abs(kelapa_data["avg_agb_kg"] - expected_agb_kelapa) < 2.0
        print(f"  ✓ Monocot-Cylinder Kelapa (H=10m): avg_agb_kg={kelapa_data['avg_agb_kg']} kg (Expected ~{expected_agb_kelapa:.2f} kg)")

        # 7. Test Fallback Konservatif: Nama tidak dikenal
        custom_req = {
            "land_plot_id": test_plot_id,
            "species_name": "Pohon Sukun Liar Pegunungan",
            "planting_year": 2021,
            "total_population": 100,
            "samples": sample_circumferences
        }
        res_custom = await client.post("/api/v1/farmer/tree-blocks", json=custom_req, headers=headers)
        assert res_custom.status_code == 200
        custom_data = res_custom.json()
        assert custom_data["wood_density"] == 0.48
        assert custom_data["formula_type"] == "ketterings"
        created_block_ids.append(custom_data["tree_block_id"])
        print(f"  ✓ Spesies Baru Tidak Terdaftar menggunakan fallback ketterings default WD 0.48: {custom_data['estimated_tco2e_per_year']} tCO2e/tahun")

        # 8. Cleanup data uji coba
        async with engine.begin() as conn:
            for b_id in created_block_ids:
                await conn.execute(text("DELETE FROM tree_blocks WHERE id = :id"), {"id": b_id})
        print(f"  ✓ Cleanup: {len(created_block_ids)} dummy tree_blocks dari pengujian berhasil dibersihkan.")

        print("\n=======================================================")
        print("  >>> PENGUJIAN 13 SPESIES & ALOMETRIK LULUS 100%! <<<")
        print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(test_tree_species_master_and_allometric_calculation())
