import asyncio
import json
import uuid
from datetime import datetime, timedelta
from database import unpooled_engine as engine
from models import Base
from security import hash_password
from sqlalchemy import text

async def init_db():
    print("Memulai inisialisasi tabel dan master data TaniKarbon...")
    async with engine.begin() as conn:
        # 1. Pastikan ekstensi PostGIS aktif
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))

        # 2. Buat semua tabel SQLAlchemy ORM
        await conn.run_sync(Base.metadata.create_all)

        # 2b. Set DEFAULT gen_random_uuid() untuk semua kolom ID tabel ORM
        await conn.execute(text("""
            DO $$
            DECLARE
                t text;
                c text;
            BEGIN
                FOR t, c IN VALUES 
                    ('users', 'id'), ('wallets', 'id'), ('clusters', 'id'), 
                    ('tree_blocks', 'id'), ('tree_species', 'id'), ('wallet_transactions', 'id'), 
                    ('farmer_profiles', 'id'), ('bank_accounts', 'id'), ('transactions', 'id'), 
                    ('certificates', 'uuid'), ('tree_samples', 'id')
                LOOP
                    BEGIN
                        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET DEFAULT gen_random_uuid()', t, c);
                    EXCEPTION WHEN OTHERS THEN
                        NULL;
                    END;
                END LOOP;
            END
            $$;
        """))

        # 2c. Buat enum land_status jika belum ada
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'land_status') THEN
                    CREATE TYPE land_status AS ENUM ('draft', 'pending', 'pending_survey', 'verified', 'rejected', 'revision');
                END IF;
            END
            $$;
        """))
        try:
            await conn.execute(text("ALTER TYPE land_status ADD VALUE IF NOT EXISTS 'revision';"))
        except Exception:
            pass

        # 3. Buat tabel PostGIS & tabel spasial/log
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS land_plots (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,
                surveyor_id UUID REFERENCES users(id) ON DELETE SET NULL,
                name VARCHAR(200) NOT NULL,
                polygon_boundary geometry(Polygon, 4326),
                centroid geometry(Point, 4326),
                total_area_sqm NUMERIC(15, 2) DEFAULT 0.00,
                ownership VARCHAR(100),
                document_no VARCHAR(100),
                status land_status DEFAULT 'draft'::land_status,
                scheduled_survey_date TIMESTAMP WITHOUT TIME ZONE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))

        await conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'land_plots' AND column_name = 'status' AND udt_name != 'land_status'
                ) THEN
                    ALTER TABLE land_plots ALTER COLUMN status TYPE land_status USING status::land_status;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END
            $$;
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS survey_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                land_plot_id UUID NOT NULL REFERENCES land_plots(id) ON DELETE CASCADE,
                surveyor_id UUID REFERENCES users(id) ON DELETE SET NULL,
                notes TEXT,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tree_samples (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tree_block_id UUID NOT NULL REFERENCES tree_blocks(id) ON DELETE CASCADE,
                circumference_cm NUMERIC(10, 2) NOT NULL,
                height_m NUMERIC(10, 2),
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))

        # 4. Tambah kolom spesifik jika tabel sudah ada dari versi sebelumnya
        for col_ddl in [
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Dikotil (Umum)'",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS formula_type VARCHAR(50) DEFAULT 'ketterings'",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS coeff_a NUMERIC(10, 5)",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS exp_b NUMERIC(10, 5)",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS requires_height BOOLEAN DEFAULT FALSE",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS formula_display VARCHAR(255)",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS reference_source VARCHAR(150)",
            "ALTER TABLE tree_blocks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE clusters ADD COLUMN IF NOT EXISTS target_quota_tco2e NUMERIC(15, 4) DEFAULT 1000.0",
            "ALTER TABLE land_plots ADD COLUMN IF NOT EXISTS scheduled_survey_date TIMESTAMP WITHOUT TIME ZONE",
            "ALTER TABLE land_plots ADD COLUMN IF NOT EXISTS surveyor_id UUID REFERENCES users(id) ON DELETE SET NULL",
            "ALTER TABLE land_plots ADD COLUMN IF NOT EXISTS ownership VARCHAR(100)",
            "ALTER TABLE land_plots ADD COLUMN IF NOT EXISTS document_no VARCHAR(100)",
            "ALTER TABLE land_plots ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb",
            "ALTER TABLE land_plots ADD COLUMN IF NOT EXISTS audit_sampling JSONB DEFAULT '[]'::jsonb",
            "ALTER TABLE survey_logs ALTER COLUMN surveyor_id DROP NOT NULL"
        ]:
            try:
                await conn.execute(text(col_ddl))
            except Exception:
                pass

        # 5. Seeding Master Data 13 Spesies Pohon ICRAF/KLHK
        seed_species = [
            ("Mangga", "Mangifera indica", "Dikotil (Umum)", 0.58, "ketterings", 0.11, 2.62, False, "AGB = 0.11 × ρ × D^2.62", "Chave et al. (2005) / Ketterings"),
            ("Alpukat", "Persea americana", "Dikotil (Umum)", 0.43, "ketterings", 0.11, 2.62, False, "AGB = 0.11 × ρ × D^2.62", "Chave et al. (2005) / Ketterings"),
            ("Nangka", "Artocarpus heterophyllus", "Dikotil (Umum)", 0.60, "ketterings", 0.11, 2.62, False, "AGB = 0.11 × ρ × D^2.62", "Chave et al. (2005) / Ketterings"),
            ("Durian", "Durio zibethinus", "Dikotil (Umum)", 0.52, "ketterings", 0.11, 2.62, False, "AGB = 0.11 × ρ × D^2.62", "Chave et al. (2005) / Ketterings"),
            ("Sengon", "Falcataria moluccana", "Dikotil (Cepat)", 0.33, "power_law", 0.1127, 2.3983, False, "AGB = 0.1127 × D^2.3983", "Litbang LHK / Siregar et al."),
            ("Jati", "Tectona grandis", "Dikotil (Keras)", 0.67, "power_law", 0.153, 2.382, False, "AGB = 0.153 × D^2.382", "Purwanggono et al. / IPCC"),
            ("Mahoni", "Swietenia macrophylla", "Dikotil (Keras)", 0.56, "power_law", 0.086, 2.645, False, "AGB = 0.086 × D^2.645", "C.A.S.E (Agroforestry)"),
            ("Gamal", "Gliricidia sepium", "Dikotil (Legum)", 0.60, "power_law", 0.197, 2.21, False, "AGB = 0.197 × D^2.21", "Hairiah & Rahayu (ICRAF)"),
            ("Turi", "Sesbania grandiflora", "Dikotil (Legum)", 0.42, "power_law", 0.166, 2.31, False, "AGB = 0.166 × D^2.31", "Hairiah & Rahayu (ICRAF)"),
            ("Kopi", "Coffea canephora / arabica", "Agroforestri Spesifik", 0.55, "power_law", 0.281, 2.06, False, "AGB = 0.281 × D^2.06", "Arifin (2001) / ICRAF"),
            ("Kakao", "Theobroma cacao", "Agroforestri Spesifik", 0.43, "power_law", 0.120, 2.35, False, "AGB = 0.120 × D^2.35", "Yuliasmara et al. (Puslitkoka)"),
            ("Kelapa", "Cocos nucifera", "Monokotil", 0.73, "monocot_cylinder", 730.0, 2.0, True, "AGB = π × (D/200)^2 × H × 730", "Hairiah et al. (2001)"),
            ("Pisang", "Musa paradisiaca", "Non-Berkayu", 0.25, "power_law", 0.030, 2.34, False, "AGB = 0.030 × D^2.34", "Arifin (2001) / ICRAF"),
            ("Lainnya (Spesies Belum Terdaftar)", "Spesies Campuran", "Fallback", 0.48, "ketterings", 0.11, 2.62, False, "AGB = 0.11 × 0.48 × D^2.62", "Default Konservatif ICRAF")
        ]
        for loc, lat, cat, wd, ftype, ca, eb, req_h, fdisp, ref in seed_species:
            await conn.execute(text("""
                INSERT INTO tree_species (
                    local_name, latin_name, category, wood_density, formula_type,
                    coeff_a, exp_b, requires_height, formula_display, reference_source
                )
                VALUES (
                    :local_name, :latin_name, :category, :wood_density, :formula_type,
                    :coeff_a, :exp_b, :requires_height, :formula_display, :reference_source
                )
                ON CONFLICT (local_name) DO UPDATE 
                SET latin_name = EXCLUDED.latin_name,
                    category = EXCLUDED.category,
                    wood_density = EXCLUDED.wood_density,
                    formula_type = EXCLUDED.formula_type,
                    coeff_a = EXCLUDED.coeff_a,
                    exp_b = EXCLUDED.exp_b,
                    requires_height = EXCLUDED.requires_height,
                    formula_display = EXCLUDED.formula_display,
                    reference_source = EXCLUDED.reference_source;
            """), {
                "local_name": loc, "latin_name": lat, "category": cat,
                "wood_density": wd, "formula_type": ftype, "coeff_a": ca,
                "exp_b": eb, "requires_height": req_h, "formula_display": fdisp,
                "reference_source": ref
            })

        # 6. Seeding Akun Pengguna Default (Petani, Surveyor, Korporat, Admin)
        default_pwd_hash = hash_password("Password123!")

        # 6a. Admin
        admin_id = uuid.UUID("99999999-9999-4999-8999-999999999999")
        await conn.execute(text("""
            INSERT INTO users (id, full_name, email, password_hash, role, is_active)
            VALUES (:id, 'Admin Pusat TaniKarbon', 'admin@tanikarbon.com', :pwd, 'admin', TRUE)
            ON CONFLICT (email) DO NOTHING;
        """), {"id": admin_id, "pwd": default_pwd_hash})

        # 6b. Surveyor Lapangan
        surveyor_id = uuid.UUID("22222222-2222-4222-8222-222222222222")
        await conn.execute(text("""
            INSERT INTO users (id, full_name, email, password_hash, role, is_active)
            VALUES (:id, 'Budi Surveyor', 'surveyor@tanikarbon.com', :pwd, 'surveyor', TRUE)
            ON CONFLICT (email) DO NOTHING;
        """), {"id": surveyor_id, "pwd": default_pwd_hash})

        # 6c. Korporat B2B
        corp_id = uuid.UUID("33333333-3333-4333-8333-333333333333")
        await conn.execute(text("""
            INSERT INTO users (id, full_name, email, password_hash, role, is_active)
            VALUES (:id, 'PT Industri Hijau Nusantara', 'esg@korporathijau.com', :pwd, 'corporate', TRUE)
            ON CONFLICT (email) DO NOTHING;
        """), {"id": corp_id, "pwd": default_pwd_hash})

        await conn.execute(text("""
            INSERT INTO wallets (id, user_id, available_balance, escrow_balance)
            VALUES (gen_random_uuid(), :uid, 250000000.00, 0.00)
            ON CONFLICT DO NOTHING;
        """), {"uid": corp_id})

        await conn.execute(text("""
            INSERT INTO company_profiles (user_id, company_name, industry_type, api_key)
            VALUES (:uid, 'PT Industri Hijau Nusantara', 'Manufaktur & Energi', 'tk_live_corp_demo_key_2026')
            ON CONFLICT (user_id) DO NOTHING;
        """), {"uid": corp_id})

        # 6d. Petani Agro (FARMER_ID = 11111111-1111-4111-8111-111111111111)
        farmer_id = uuid.UUID("11111111-1111-4111-8111-111111111111")
        await conn.execute(text("""
            INSERT INTO users (id, full_name, email, password_hash, role, is_active)
            VALUES (:id, 'Petani Agro', 'petani@tanikarbon.com', :pwd, 'farmer', TRUE)
            ON CONFLICT (email) DO UPDATE SET full_name = 'Petani Agro';
        """), {"id": farmer_id, "pwd": default_pwd_hash})

        # 6e. Petani Tetangga / Lahan Lain (FARMER2_ID = 44444444-1111-4444-8444-444444444444)
        farmer2_id = uuid.UUID("44444444-1111-4444-8444-444444444444")
        await conn.execute(text("""
            INSERT INTO users (id, full_name, email, password_hash, role, is_active)
            VALUES (:id, 'Petani Tetangga', 'petani.tetangga@tanikarbon.com', :pwd, 'farmer', TRUE)
            ON CONFLICT (email) DO NOTHING;
        """), {"id": farmer2_id, "pwd": default_pwd_hash})

        # Wallet Petani
        wallet_check = (await conn.execute(text("SELECT id FROM wallets WHERE user_id = :uid"), {"uid": farmer_id})).fetchone()
        if not wallet_check:
            await conn.execute(text("""
                INSERT INTO wallets (id, user_id, available_balance, escrow_balance)
                VALUES (gen_random_uuid(), :uid, 15000000.00, 3500000.00);
            """), {"uid": farmer_id})

        # Profil Petani
        await conn.execute(text("""
            INSERT INTO farmer_profiles (id, user_id, nik, phone_number, address, village, regency, province, gapoktan_name)
            VALUES (gen_random_uuid(), :uid, '3201012345670001', '0812-9847-1920', 'Jl. Raya Kebun No. 42', 'Sukamaju', 'Bogor', 'Jawa Barat', 'Gapoktan Harapan Makmur')
            ON CONFLICT (user_id) DO NOTHING;
        """), {"uid": farmer_id})

        # Rekening Bank Petani
        bank_check = (await conn.execute(text("SELECT id FROM bank_accounts WHERE user_id = :uid"), {"uid": farmer_id})).fetchone()
        if not bank_check:
            await conn.execute(text("""
                INSERT INTO bank_accounts (id, user_id, bank_code, bank_name, account_number, account_holder_name, is_primary)
                VALUES (gen_random_uuid(), :uid, 'BRI', 'Bank BRI', '0142-01-084821-50-8', 'Joko Widodo', TRUE);
            """), {"uid": farmer_id})

        # 7. Seeding Klaster Karbon
        clusters_seed = [
            ("44444444-4444-4444-8444-444444444444", "Klaster Agroforestri Sukamaju", 2026, 5000.0, 10000.0, 85000.0, "available_for_sale"),
            ("44444444-4444-4444-8444-444444444445", "Klaster Agroforestri Wonosobo", 2026, 4200.0, 8000.0, 92000.0, "available_for_sale"),
            ("44444444-4444-4444-8444-444444444446", "Klaster Kopi Agroforestri Sindoro", 2026, 3800.0, 6000.0, 98000.0, "auditing"),
            ("44444444-4444-4444-8444-444444444447", "Klaster Hutan Rakyat Gunungkidul", 2026, 2100.0, 5000.0, 80000.0, "gathering"),
        ]
        for cid_str, cname, vint, avail, targ, price, stat in clusters_seed:
            await conn.execute(text("""
                INSERT INTO clusters (id, name, vintage_year, available_quota_tco2e, target_quota_tco2e, price_per_tco2e, status)
                VALUES (:id, :name, :vintage, :avail, :target, :price, CAST(:status AS cluster_status))
                ON CONFLICT (id) DO NOTHING;
            """), {
                "id": uuid.UUID(cid_str),
                "name": cname,
                "vintage": vint,
                "avail": avail,
                "target": targ,
                "price": price,
                "status": stat
            })
        cluster_id = uuid.UUID("44444444-4444-4444-8444-444444444444")

        # 8. Seeding Lahan & Blok Pohon Petani
        # Plot 1: Kebun Sengon Pertama (Verified, 500 m2)
        plot1_id = uuid.UUID("55555555-5555-4555-8555-555555555551")
        plot1_geojson = '{"type":"Polygon","coordinates":[[[106.833,-6.3685],[106.8332,-6.3685],[106.8332,-6.3687],[106.833,-6.3687],[106.833,-6.3685]]]}'
        plot1_check = (await conn.execute(text("SELECT id FROM land_plots WHERE id = :id"), {"id": plot1_id})).fetchone()
        if not plot1_check:
            await conn.execute(text("""
                INSERT INTO land_plots (
                    id, farmer_id, cluster_id, surveyor_id, name,
                    polygon_boundary, centroid, total_area_sqm,
                    ownership, document_no, status, scheduled_survey_date
                )
                VALUES (
                    :id, :farmer_id, :cluster_id, :surveyor_id, 'Kebun Sengon Pertama',
                    ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326),
                    ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)),
                    500.0, 'Milik Sendiri (SHM)', 'SHM-049281-BOGOR', 'verified',
                    NOW() + INTERVAL '2 days'
                );
            """), {
                "id": plot1_id,
                "farmer_id": farmer_id,
                "cluster_id": cluster_id,
                "surveyor_id": surveyor_id,
                "geojson": plot1_geojson
            })

            # Blok pohon 1 (Sengon Laut)
            tb1_id = uuid.UUID("66666666-6666-4666-8666-666666666661")
            await conn.execute(text("""
                INSERT INTO tree_blocks (id, land_plot_id, species_name, planting_year, total_population, estimated_tco2e_per_year)
                VALUES (:id, :plot_id, 'Sengon Laut', 2021, 100, 12.5000);
            """), {"id": tb1_id, "plot_id": plot1_id})

            # Sampel pohon untuk DBH rata-rata
            await conn.execute(text("""
                INSERT INTO tree_samples (tree_block_id, circumference_cm, height_m)
                VALUES (:tb_id, 78.54, 12.0);
            """), {"tb_id": tb1_id})

            # Blok pohon 2 (Mangga)
            tb2_id = uuid.UUID("66666666-6666-4666-8666-666666666662")
            await conn.execute(text("""
                INSERT INTO tree_blocks (id, land_plot_id, species_name, planting_year, total_population, estimated_tco2e_per_year)
                VALUES (:id, :plot_id, 'Mangga', 2020, 60, 18.2000);
            """), {"id": tb2_id, "plot_id": plot1_id})

            await conn.execute(text("""
                INSERT INTO tree_samples (tree_block_id, circumference_cm, height_m)
                VALUES (:tb_id, 85.00, 10.0);
            """), {"tb_id": tb2_id})
        else:
            await conn.execute(text("""
                UPDATE tree_blocks
                SET total_population = 60
                WHERE species_name = 'Mangga' AND land_plot_id = :plot_id;
            """), {"plot_id": plot1_id})

            # Log Survei jika belum ada
            survey_check = (await conn.execute(text("SELECT id FROM survey_logs WHERE land_plot_id = :plot_id"), {"plot_id": plot1_id})).fetchone()
            if not survey_check:
                await conn.execute(text("""
                    INSERT INTO survey_logs (id, land_plot_id, surveyor_id, notes)
                    VALUES (gen_random_uuid(), :plot_id, :surveyor_id, 'Inspeksi lapangan verifikasi DBH dan koordinat poligon telah disetujui.');
                """), {"plot_id": plot1_id, "surveyor_id": surveyor_id})

        # Plot 2: Kebun Uji Coba Swagger (Draft, 1200 m2)
        plot2_id = uuid.UUID("55555555-5555-4555-8555-555555555552")
        plot2_geojson = '{"type":"Polygon","coordinates":[[[106.840,-6.3700],[106.8405,-6.3700],[106.8405,-6.3705],[106.840,-6.3705],[106.840,-6.3700]]]}'
        plot2_check = (await conn.execute(text("SELECT id FROM land_plots WHERE id = :id"), {"id": plot2_id})).fetchone()
        if not plot2_check:
            await conn.execute(text("""
                INSERT INTO land_plots (
                    id, farmer_id, cluster_id, surveyor_id, name,
                    polygon_boundary, centroid, total_area_sqm,
                    ownership, document_no, status, scheduled_survey_date
                )
                VALUES (
                    :id, :farmer_id, :cluster_id, :surveyor_id, 'Kebun Uji Coba Swagger',
                    ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326),
                    ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)),
                    1200.0, 'Girik / Letter C', 'GIRIK-01928', 'draft',
                    NOW() + INTERVAL '3 days'
                );
            """), {
                "id": plot2_id,
                "farmer_id": farmer_id,
                "cluster_id": cluster_id,
                "surveyor_id": surveyor_id,
                "geojson": plot2_geojson
            })

            # Blok pohon pada Plot 2 (Jati)
            tb3_id = uuid.UUID("66666666-6666-4666-8666-666666666663")
            await conn.execute(text("""
                INSERT INTO tree_blocks (id, land_plot_id, species_name, planting_year, total_population, estimated_tco2e_per_year)
                VALUES (:id, :plot_id, 'Jati', 2019, 50, 8.7500);
            """), {"id": tb3_id, "plot_id": plot2_id})

            await conn.execute(text("""
                INSERT INTO tree_samples (tree_block_id, circumference_cm, height_m)
                VALUES (:tb_id, 65.00, 14.0);
            """), {"tb_id": tb3_id})

        # Riwayat Aktivitas Dompet Awal Petani
        await conn.execute(text("UPDATE wallet_transactions SET created_at = NOW() WHERE created_at IS NULL;"))
        act_check = (await conn.execute(text("SELECT id FROM wallet_transactions WHERE user_id = :uid"), {"uid": farmer_id})).fetchone()
        if not act_check:
            await conn.execute(text("""
                INSERT INTO wallet_transactions (id, user_id, amount, transaction_type, description, status, created_at)
                VALUES (gen_random_uuid(), :uid, 1500000.00, 'credit_payout', 'Bagi Hasil Bursa Karbon Vintage 2026', 'completed', NOW());
            """), {"uid": farmer_id})

    print("Inisialisasi tabel dan master data berhasil diselesaikan 100%!")

if __name__ == "__main__":
    asyncio.run(init_db())
