import math
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
from fastapi import FastAPI, Depends, HTTPException, Security, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import User, CompanyProfile, Wallet, Cluster, Transaction, Certificate, TreeBlock, WalletTransaction, TreeSpecies
from schemas import (
    AutoBuyRequest, AutoBuyResponse, LandPlotRequest, TreeBlockRequest,
    WithdrawRequest, DistributeRevenueRequest, FarmerDashboardSummary,
    TokenResponse, UserLoginRequest, UserRegisterRequest, UserResponse,
    DISPOSABLE_EMAIL_DOMAINS, TreeBlockDetail, LandPlotDetail, WalletResponse,
    UpcomingInspectionItem, RecentWalletActivityItem, WalletTransactionResponse,
    TreeSpeciesResponse
)
from security import (
    limiter, hash_password, verify_password,
    create_access_token, decode_access_token,
    get_current_user, require_roles
)

app = FastAPI(title="TaniKarbon API - Interoperabilitas UINIC 8.0")

# ------------------------------------------------------------------------------
# 0. Integrasi Rate Limiter (slowapi) Anti Brute-Force
# ------------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def on_startup():
    from database import engine
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                amount NUMERIC(15, 2) NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                description VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'completed',
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tree_species (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                local_name VARCHAR(150) UNIQUE NOT NULL,
                latin_name VARCHAR(150),
                wood_density NUMERIC(5, 3) NOT NULL
            )
        """))
        for col_ddl in [
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Dikotil (Umum)'",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS formula_type VARCHAR(50) DEFAULT 'ketterings'",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS coeff_a NUMERIC(10, 5)",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS exp_b NUMERIC(10, 5)",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS requires_height BOOLEAN DEFAULT FALSE",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS formula_display VARCHAR(255)",
            "ALTER TABLE tree_species ADD COLUMN IF NOT EXISTS reference_source VARCHAR(150)"
        ]:
            await conn.execute(text(col_ddl))

        # Bersihkan duplikat/spesies usang lama agar master data dropdown presisi 13 spesies standar + 1 Lainnya
        await conn.execute(text("""
            DELETE FROM tree_species WHERE local_name IN (
                'Alpukat Mentega', 'Kopi Arabika', 'Sengon Buto', 'Sengon Laut', 'Akasia', 'Karet'
            );
        """))

        # Inisialisasi seeding 13 Spesies Resmi ICRAF/KLHK + 1 Fallback Lainnya
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
                "local_name": loc,
                "latin_name": lat,
                "category": cat,
                "wood_density": wd,
                "formula_type": ftype,
                "coeff_a": ca,
                "exp_b": eb,
                "requires_height": req_h,
                "formula_display": fdisp,
                "reference_source": ref
            })


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"], # Port standar Vite & React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Alias Identifier Frontend (Sinkronisasi Form UI ke Akun Database)
# ------------------------------------------------------------------------------
IDENTIFIER_ALIASES = {
    "adm-root-01": "admin@tanikarbon.com",
    "srv-budi-09": "surveyor@tanikarbon.com",
    "0812-9847-1920": "petani@tanikarbon.com",
    "081298471920": "petani@tanikarbon.com",
    "+6281298471920": "petani@tanikarbon.com",
    "esg-team@industrihijau.co.id": "esg@korporathijau.com",
}

# ------------------------------------------------------------------------------
# 0b. Master Data Spesies Pohon & Kerapatan Kayu (Wood Density)
# ------------------------------------------------------------------------------
@app.get("/api/v1/tree-species", response_model=List[TreeSpeciesResponse])
async def get_tree_species(db: AsyncSession = Depends(get_db)):
    """
    Mengembalikan seluruh 13 master data spesies pohon resmi + 1 Opsi Lainnya
    lengkap dengan parameter alometrik ICRAF/KLHK.
    Diurutkan berdasarkan local_name secara alfabetis, dengan opsi 'Lainnya' berada di urutan terbawah.
    """
    query = text("""
        SELECT id, local_name, latin_name, category, wood_density,
               formula_type, coeff_a, exp_b, requires_height, formula_display, reference_source
        FROM tree_species
        ORDER BY 
            CASE WHEN local_name ILIKE 'Lainnya%' THEN 1 ELSE 0 END ASC,
            local_name ASC
    """)
    result = await db.execute(query)
    rows = result.fetchall()
    return [
        TreeSpeciesResponse(
            id=row.id,
            local_name=row.local_name,
            latin_name=row.latin_name,
            category=row.category,
            wood_density=float(row.wood_density),
            formula_type=row.formula_type,
            coeff_a=float(row.coeff_a) if row.coeff_a is not None else None,
            exp_b=float(row.exp_b) if row.exp_b is not None else None,
            requires_height=bool(row.requires_height),
            formula_display=row.formula_display,
            reference_source=row.reference_source
        )
        for row in rows
    ]


# ------------------------------------------------------------------------------
# 1. Endpoint Autentikasi & Otorisasi JWT (Fase 2)
# ------------------------------------------------------------------------------
@app.post("/api/v1/auth/register", response_model=TokenResponse)
@limiter.limit("3/minute")
async def register(
    request: Request,
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Pendaftaran user baru dengan proteksi Honeypot anti-bot, 
    pemblokiran domain disposable email, hashing password bcrypt, 
    pembuatan Wallet default otomatis (relasi database), 
    serta penerbitan token JWT.
    """
    # 0. Anti-bot honeypot check
    if payload.website_url and payload.website_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aktivitas bot terdeteksi."
        )

    clean_email = payload.email.lower().strip()

    # 1. Anti-spam disposable email check
    email_domain = clean_email.split("@")[-1]
    if email_domain in DISPOSABLE_EMAIL_DOMAINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Domain email '{email_domain}' tidak diizinkan (disposable/temporary email)."
        )

    # 2. Validasi panjang kata sandi minimal 8 karakter
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kata sandi harus minimal 8 karakter."
        )
    
    # 3. Cek duplikasi email
    existing_result = await db.execute(select(User).where(User.email == clean_email))
    if existing_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar dalam sistem."
        )
    
    # 4. Hashing password via bcrypt
    hashed = hash_password(payload.password)
    
    # 3. Normalisasi role
    target_role = payload.role.lower().strip()
    if target_role == "corporate":
        target_role = "company"
    if target_role not in ["farmer", "company", "surveyor", "admin"]:
        target_role = "farmer"
        
    # 4. Buat entitas User baru
    new_user = User(
        full_name=payload.full_name.strip(),
        email=clean_email,
        password_hash=hashed,
        role=target_role,
        is_active=True
    )
    db.add(new_user)
    await db.flush()
    
    # 5. Inisiatif Relasi Database: Inisialisasi Wallet baru otomatis
    new_wallet = Wallet(
        user_id=new_user.id,
        available_balance=0.00,
        escrow_balance=0.00
    )
    db.add(new_wallet)
    
    # 6. Jika role corporate / company, inisialisasi CompanyProfile default
    if target_role in ["company", "corporate"]:
        new_company = CompanyProfile(
            user_id=new_user.id,
            company_name=payload.full_name.strip(),
            industry_type="Korporat Hijau",
            api_key=f"tk_live_{uuid.uuid4().hex[:16]}"
        )
        db.add(new_company)
        
    await db.commit()
    await db.refresh(new_user)
    
    # 7. Terbitkan token JWT
    token = create_access_token({
        "sub": str(new_user.id),
        "email": new_user.email,
        "role": new_user.role
    })
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role
    )


@app.post("/api/v1/auth/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    payload: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Autentikasi kredensial pengguna, mendukung login email & alias ID frontend,
    dilindungi oleh SlowAPI Rate Limiter anti brute-force (5/menit).
    """
    raw_identifier = payload.login_identifier.lower().strip()
    raw_password = payload.login_password
    
    if not raw_identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identifier atau email tidak boleh kosong."
        )
        
    # Resolusi alias ID dari UI frontend
    resolved_email = IDENTIFIER_ALIASES.get(raw_identifier, raw_identifier)
    
    # Cari pengguna berdasarkan email
    user_result = await db.execute(select(User).where(User.email == resolved_email))
    user = user_result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/identifier atau kata sandi tidak valid."
        )
        
    # Tangani placeholder bullet atau PIN demo
    test_password = raw_password
    if test_password in ["••••••••••••", "••••••••"]:
        test_password = "Password123!"
        
    is_valid = verify_password(test_password, user.password_hash)
    # Dukungan khusus PIN surveyor demo jika cocok
    if not is_valid and user.role == "surveyor" and test_password == "847291":
        is_valid = True
        
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/identifier atau kata sandi tidak valid."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun pengguna dinonaktifkan."
        )
        
    # Validasi role jika dispesifikasikan di request UI
    if payload.role:
        req_role = payload.role.lower().strip()
        u_role = str(user.role).lower()
        role_matches = (
            u_role == req_role or
            (u_role == "company" and req_role in ["corporate", "company"]) or
            (u_role == "corporate" and req_role in ["corporate", "company"])
        )
        if not role_matches:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Kredensial tidak cocok untuk role '{payload.role}'."
            )
            
    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )


@app.get("/api/v1/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Mengambil data profil pengguna yang sedang login berdasarkan Bearer Token.
    """
    return current_user


# ------------------------------------------------------------------------------
# 2. Konfigurasi Keamanan Header API Key (B2B ERP Auto-Buy)
# ------------------------------------------------------------------------------
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def get_company_by_api_key(api_key: str = Security(api_key_header), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CompanyProfile).where(CompanyProfile.api_key == api_key))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=403, detail="API Key tidak valid atau perusahaan tidak ditemukan.")
    return company

# ------------------------------------------------------------------------------
# 3. Endpoint B2B: Auto-Buy dari ERP Pabrik
# ------------------------------------------------------------------------------
@app.post("/api/v1/offset/auto-buy", response_model=AutoBuyResponse)
async def auto_buy_offset(
    payload: AutoBuyRequest,
    company: CompanyProfile = Depends(get_company_by_api_key),
    db: AsyncSession = Depends(get_db)
):
    try:
        # A. Cari dompet perusahaan
        wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == company.user_id))
        wallet = wallet_result.scalars().first()
        
        if not wallet:
            raise HTTPException(status_code=404, detail="Dompet deposit perusahaan tidak ditemukan.")

        # B. Cari klaster yang siap jual dan kuotanya masih cukup
        cluster_result = await db.execute(
            select(Cluster).where(
                Cluster.status == "available_for_sale",
                Cluster.available_quota_tco2e >= payload.emission_amount_tco2e
            )
        )
        cluster = cluster_result.scalars().first()
        
        if not cluster:
            raise HTTPException(status_code=400, detail="Gagal: Tidak ada klaster dengan sisa stok karbon yang mencukupi.")

        # C. Kalkulasi Biaya (Jumlah tonase x Harga per tonase)
        total_cost = payload.emission_amount_tco2e * float(cluster.price_per_tco2e)

        # D. Validasi Kecukupan Saldo
        if float(wallet.available_balance) < total_cost:
            raise HTTPException(status_code=402, detail=f"Saldo tidak cukup. Butuh Rp{total_cost:,.2f}, saldo tersisa Rp{wallet.available_balance:,.2f}")

        # E. Eksekusi Pemotongan
        wallet.available_balance = float(wallet.available_balance) - total_cost
        cluster.available_quota_tco2e = float(cluster.available_quota_tco2e) - payload.emission_amount_tco2e

        # F. Catat Riwayat Transaksi
        new_trx = Transaction(
            company_id=company.user_id,
            cluster_id=cluster.id,
            tco2e_purchased=payload.emission_amount_tco2e,
            total_price=total_cost,
            transaction_type="api_auto_buy",
            target_emission_year=payload.emission_period_year
        )
        db.add(new_trx)
        await db.flush()

        # G. Terbitkan Sertifikat
        new_cert = Certificate(
            transaction_id=new_trx.id,
            company_id=company.user_id,
            cluster_id=cluster.id,
            tco2e_retired=payload.emission_amount_tco2e,
            vintage_year=cluster.vintage_year
        )
        db.add(new_cert)
        
        # H. Kunci Semua Perubahan
        await db.commit()
        await db.refresh(new_cert)

        return AutoBuyResponse(
            status="success",
            message=f"Berhasil menebus offset karbon dari {cluster.name}.",
            certificate_uuid=new_cert.uuid,
            tco2e_retired=payload.emission_amount_tco2e,
            total_cost=total_cost,
            cluster_name=cluster.name
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"CRITICAL SYSTEM ERROR: {str(e)}") 
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan sistem: {str(e)}")


# Klaster default jika petak lahan belum mengikat klaster spesifik
DEFAULT_CLUSTER_ID = "44444444-4444-4444-8444-444444444444"

# ------------------------------------------------------------------------------
# 4. Endpoint Mitra Tani (Terproteksi RBAC 'farmer')
# ------------------------------------------------------------------------------
@app.post("/api/v1/farmer/lands", status_code=status.HTTP_201_CREATED)
async def register_land_plot(
    payload: LandPlotRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    query = text("""
        INSERT INTO land_plots (farmer_id, cluster_id, name, polygon_boundary, centroid, total_area_sqm, status)
        VALUES (
            :farmer_id, :cluster_id, :name,
            ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326),
            ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)),
            ST_Area(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography),
            'draft'
        )
        RETURNING id, name, total_area_sqm, ST_AsGeoJSON(polygon_boundary) as geojson_result
    """)
    
    result = await db.execute(query, {
        "farmer_id": current_user.id, "cluster_id": DEFAULT_CLUSTER_ID,
        "name": payload.name, "geojson": payload.geojson_polygon
    })
    await db.commit()
    
    row = result.fetchone()
    return {
        "id": row.id, "name": row.name, 
        "area_sqm": row.total_area_sqm, "geojson_polygon": row.geojson_result
    }

@app.delete("/api/v1/farmer/lands/{land_id}")
async def delete_land_plot(
    land_id: uuid.UUID,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    # 1. Cek keberadaan petak lahan
    check_query = text("""
        SELECT id, farmer_id, status, name
        FROM land_plots
        WHERE id = :land_id
    """)
    check_result = await db.execute(check_query, {"land_id": land_id})
    plot = check_result.fetchone()

    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Petak lahan tidak ditemukan"
        )

    # 2. Verifikasi kepemilikan oleh current_user
    if plot.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Anda tidak memiliki wewenang atas petak lahan ini"
        )

    # 3. Verifikasi status harus masih 'draft'
    if str(plot.status).lower() != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hanya lahan berstatus 'draft' yang dapat dihapus. Status saat ini: '{plot.status}'"
        )

    # 4. Hapus relasi tree_blocks terlebih dahulu
    await db.execute(
        text("DELETE FROM tree_blocks WHERE land_plot_id = :land_id"),
        {"land_id": land_id}
    )

    # 5. Hapus data lahan dari database
    await db.execute(
        text("DELETE FROM land_plots WHERE id = :land_id"),
        {"land_id": land_id}
    )
    await db.commit()

    return {
        "status": "success",
        "message": f"Petak lahan '{plot.name}' berhasil dihapus.",
        "deleted_id": str(land_id)
    }

@app.get("/api/v1/farmer/lands", response_model=List[LandPlotDetail])
async def get_land_plots(
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    query = text("""
        SELECT id, name, total_area_sqm, status, ST_AsGeoJSON(polygon_boundary) as geojson
        FROM land_plots WHERE farmer_id = :farmer_id
        ORDER BY created_at ASC
    """)
    result = await db.execute(query, {"farmer_id": current_user.id})
    land_rows = result.fetchall()
    
    lands_data = []
    for row in land_rows:
        tb_query = text("""
            SELECT id, species_name, planting_year, total_population, estimated_tco2e_per_year
            FROM tree_blocks
            WHERE land_plot_id = :plot_id
            ORDER BY created_at ASC
        """)
        tb_result = await db.execute(tb_query, {"plot_id": row.id})
        tree_blocks = [
            {
                "id": tb.id,
                "species_name": tb.species_name,
                "planting_year": tb.planting_year,
                "total_population": tb.total_population,
                "estimated_tco2e_per_year": float(tb.estimated_tco2e_per_year)
            }
            for tb in tb_result.fetchall()
        ]
        lands_data.append({
            "id": row.id,
            "name": row.name,
            "area_sqm": float(row.total_area_sqm),
            "status": str(row.status),
            "geojson_polygon": row.geojson,
            "tree_blocks": tree_blocks
        })
    return lands_data


SPECIES_ALIASES = {
    "sengon laut": "Sengon",
    "sengon buto": "Sengon",
    "paraserianthes falcataria": "Sengon",
    "falcataria moluccana": "Sengon",
    "kopi arabika": "Kopi",
    "kopi robusta": "Kopi",
    "coffea arabica": "Kopi",
    "coffea canephora": "Kopi",
    "alpukat mentega": "Alpukat",
    "kelapa dalam": "Kelapa",
    "kelapa hibrida": "Kelapa",
    "kelapa sawit": "Kelapa",
    "kakao cokelat": "Kakao",
    "pisang ambon": "Pisang",
    "mangga manalagi": "Mangga",
}

@app.post("/api/v1/farmer/tree-blocks")
async def calculate_smart_sampling(
    payload: TreeBlockRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghitung estimasi Above Ground Biomass (AGB) dan serapan karbon (tCO2e/tahun)
    menggunakan mesin rumus alometrik spesifik per spesies (ICRAF / KLHK / Litbang LHK):
    1) ketterings: AGB = 0.11 * wood_density * (D ** 2.62)
    2) power_law: AGB = coeff_a * (D ** exp_b)
    3) monocot_cylinder (Kelapa): AGB = pi * ((D / 200.0) ** 2) * H * 730.0 (Wajib H > 0)
    """
    clean_species_name = payload.species_name.strip()
    alias_target = SPECIES_ALIASES.get(clean_species_name.lower(), clean_species_name)

    # 1. Query Spesies Pohon dari Master Data tree_species (Dukung nama lokal, latin, dan alias)
    species_query = select(TreeSpecies).where(
        (TreeSpecies.local_name.ilike(alias_target)) |
        (TreeSpecies.local_name.ilike(clean_species_name)) |
        (TreeSpecies.latin_name.ilike(clean_species_name))
    )
    species_result = await db.execute(species_query)
    matched_species = species_result.scalars().first()

    # Fallback ke opsi 'Lainnya' jika nama tidak dikenal di master data
    if not matched_species:
        fallback_query = select(TreeSpecies).where(TreeSpecies.local_name.ilike("Lainnya%"))
        fb_res = await db.execute(fallback_query)
        matched_species = fb_res.scalars().first()

    formula_type = matched_species.formula_type if matched_species else "ketterings"
    wood_density = float(matched_species.wood_density) if (matched_species and matched_species.wood_density is not None) else 0.48
    coeff_a = float(matched_species.coeff_a) if (matched_species and matched_species.coeff_a is not None) else 0.11
    exp_b = float(matched_species.exp_b) if (matched_species and matched_species.exp_b is not None) else 2.62
    requires_height = bool(matched_species.requires_height) if matched_species else False

    # Validasi bahwa tanaman Monokotil (Kelapa) WAJIB menyertakan tinggi batang pohon H > 0 meter
    if formula_type == "monocot_cylinder" or requires_height:
        if payload.height_m is None or payload.height_m <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Spesies Monokotil (Kelapa) wajib menyertakan parameter rata-rata tinggi batang pohon (H > 0 meter) untuk rumus silinder alometrik ICRAF."
            )

    # 2. Hitung AGB untuk setiap sampel pohon
    sample_agb_list = []
    dbh_list = []
    height_m = float(payload.height_m) if payload.height_m else 0.0

    for s in payload.samples:
        d_cm = s.circumference_cm / math.pi
        dbh_list.append(d_cm)

        if formula_type == "ketterings":
            agb_i = 0.11 * wood_density * (d_cm ** 2.62)
        elif formula_type == "power_law":
            agb_i = coeff_a * (d_cm ** exp_b)
        elif formula_type == "monocot_cylinder":
            # AGB = pi * (D / 200)^2 * H * 730
            radius_m = d_cm / 200.0
            agb_i = math.pi * (radius_m ** 2) * height_m * 730.0
        else:
            # Fallback konservatif ketterings
            agb_i = 0.11 * wood_density * (d_cm ** 2.62)

        sample_agb_list.append(agb_i)

    avg_agb_kg = sum(sample_agb_list) / len(sample_agb_list)
    avg_dbh_cm = sum(dbh_list) / len(dbh_list)

    # 3. Konversi rata-rata AGB menjadi estimasi serapan tahunan (estimated_tco2e_per_year):
    # - Fraksi karbon IPCC: 0.47
    # - Rasio stoikiometri CO2 / C: 44.0 / 12.0
    # - Umur tegakan stand_age = max(1, current_year - planting_year)
    # - estimated_tco2e_per_year = ((avg_agb_kg * 0.47 * (44.0 / 12.0)) / (1000.0 * stand_age)) * total_population
    current_year = datetime.utcnow().year
    stand_age = max(1, current_year - payload.planting_year)
    annual_co2_per_tree = (avg_agb_kg * 0.47 * (44.0 / 12.0)) / (1000.0 * stand_age)
    total_estimated_tco2e = annual_co2_per_tree * payload.total_population

    # 4. Simpan hasil kalkulasi ke Database tree_blocks
    new_block = TreeBlock(
        land_plot_id=payload.land_plot_id,
        species_name=clean_species_name,
        planting_year=payload.planting_year,
        total_population=payload.total_population,
        estimated_tco2e_per_year=total_estimated_tco2e
    )
    db.add(new_block)
    await db.commit()
    await db.refresh(new_block)

    return {
        "status": "success",
        "message": f"Estimasi alometrik spesies {matched_species.local_name if matched_species else clean_species_name} ({formula_type}) berhasil dihitung dan disimpan.",
        "tree_block_id": new_block.id,
        "species_name": clean_species_name,
        "matched_species": matched_species.local_name if matched_species else "Lainnya",
        "category": matched_species.category if matched_species else "Fallback",
        "formula_type": formula_type,
        "wood_density": wood_density,
        "avg_dbh_cm": round(avg_dbh_cm, 2),
        "avg_agb_kg": round(avg_agb_kg, 2),
        "estimated_tco2e_per_year": round(total_estimated_tco2e, 4)
    }

@app.post("/api/v1/farmer/wallet/withdraw")
async def withdraw_balance(
    payload: WithdrawRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    # Mencari dompet petani terautentikasi berdasarkan current_user.id
    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = wallet_result.scalars().first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Dompet petani tidak ditemukan.")
        
    if float(wallet.available_balance) < payload.amount:
        raise HTTPException(status_code=400, detail=f"Saldo tidak mencukupi. Saldo saat ini: Rp{wallet.available_balance:,.2f}")
        
    # Eksekusi pemotongan saldo penarikan
    wallet.available_balance = float(wallet.available_balance) - payload.amount

    # Catat transaksi mutasi penarikan ke database
    new_tx = WalletTransaction(
        user_id=current_user.id,
        amount=payload.amount,
        transaction_type="debit_withdraw",
        description=f"Penarikan dana ke rekening {payload.bank_name} ({payload.account_number})",
        status="completed"
    )
    db.add(new_tx)
    await db.commit()
    await db.refresh(new_tx)
    
    return {
        "status": "success",
        "message": f"Penarikan dana sebesar Rp{payload.amount:,.2f} ke {payload.bank_name} berhasil diproses.",
        "remaining_balance": float(wallet.available_balance),
        "transaction_id": new_tx.id
    }

@app.get("/api/v1/farmer/wallet", response_model=WalletResponse)
async def get_farmer_wallet(
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = wallet_result.scalars().first()
    if not wallet:
        return {
            "user_id": current_user.id,
            "available_balance": 0.0,
            "escrow_balance": 0.0
        }
    return {
        "user_id": current_user.id,
        "available_balance": float(wallet.available_balance),
        "escrow_balance": float(wallet.escrow_balance)
    }

@app.get("/api/v1/farmer/wallet/transactions", response_model=List[WalletTransactionResponse])
async def get_farmer_wallet_transactions(
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.user_id == current_user.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(20)
    )
    txs = result.scalars().all()
    return [
        {
            "id": tx.id,
            "user_id": tx.user_id,
            "amount": float(tx.amount),
            "transaction_type": tx.transaction_type,
            "description": tx.description,
            "status": tx.status,
            "created_at": tx.created_at
        }
        for tx in txs
    ]


# ------------------------------------------------------------------------------
# 5. Endpoint Admin Authority (Terproteksi RBAC 'admin')
# ------------------------------------------------------------------------------
@app.post("/api/v1/admin/distribute-revenue")
async def distribute_revenue(
    payload: DistributeRevenueRequest,
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    # 1. Cari data transaksi korporat
    trx_result = await db.execute(select(Transaction).where(Transaction.id == payload.transaction_id))
    trx = trx_result.scalars().first()
    if not trx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
        
    total_revenue = float(trx.total_price)
    platform_fee = total_revenue * 0.10
    net_for_farmers = total_revenue * 0.90
    
    # 2. Cari daftar petani di klaster tersebut menggunakan Raw SQL (karena tabel land_plots berbasis PostGIS)
    query = text("SELECT DISTINCT farmer_id FROM land_plots WHERE cluster_id = :cluster_id")
    result = await db.execute(query, {"cluster_id": trx.cluster_id})
    farmer_rows = result.fetchall()
    
    if not farmer_rows:
        raise HTTPException(status_code=400, detail="Tidak ada petani yang terdaftar di klaster ini.")
        
    split_amount = net_for_farmers / len(farmer_rows)
    
    # 3. Suntikkan dana ke dompet masing-masing petani (Smart Escrow) & catat mutasi
    for row in farmer_rows:
        wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == row.farmer_id))
        wallet = wallet_result.scalars().first()
        if wallet:
            wallet.available_balance = float(wallet.available_balance) + split_amount
            new_tx = WalletTransaction(
                user_id=row.farmer_id,
                amount=split_amount,
                transaction_type="credit_payout",
                description=f"Bagi hasil klaster #{str(trx.cluster_id)[:8]} (Offset Korporasi)",
                status="completed"
            )
            db.add(new_tx)
            
    await db.commit()
    
    return {
        "status": "success",
        "message": "Dana otomatis dibagikan (Smart Escrow).",
        "total_revenue": total_revenue,
        "platform_fee": platform_fee,
        "net_distributed_per_farmer": split_amount,
        "total_farmers_received": len(farmer_rows)
    }


@app.get("/api/v1/farmer/dashboard/summary", response_model=FarmerDashboardSummary)
async def get_farmer_dashboard_summary(
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    # 1. Query Total Luas Lahan & Jumlah Petak Terisolasi (Mencegah Join Fan-out bug)
    area_query = text("""
        SELECT 
            COALESCE(SUM(total_area_sqm), 0) as total_area,
            COUNT(*) as total_plots
        FROM land_plots
        WHERE farmer_id = :farmer_id
    """)
    area_result = await db.execute(area_query, {"farmer_id": current_user.id})
    area_row = area_result.fetchone()
    total_area_val = area_row.total_area if area_row else 0.0
    total_plots = area_row.total_plots if area_row else 0

    # 2. Query Agregasi Total Pohon & Estimasi Karbon
    trees_total_query = text("""
        SELECT 
            COALESCE(SUM(tb.total_population), 0) as total_trees,
            COALESCE(SUM(tb.estimated_tco2e_per_year), 0) as total_carbon
        FROM land_plots lp
        JOIN tree_blocks tb ON lp.id = tb.land_plot_id
        WHERE lp.farmer_id = :farmer_id
    """)
    trees_total_result = await db.execute(trees_total_query, {"farmer_id": current_user.id})
    totals = trees_total_result.fetchone()

    # 3. Query Agregasi per Spesies (Group By)
    species_query = text("""
        SELECT 
            tb.species_name,
            SUM(tb.total_population) as total_trees,
            SUM(tb.estimated_tco2e_per_year) as total_carbon
        FROM land_plots lp
        JOIN tree_blocks tb ON lp.id = tb.land_plot_id
        WHERE lp.farmer_id = :farmer_id
        GROUP BY tb.species_name
    """)
    species_result = await db.execute(species_query, {"farmer_id": current_user.id})

    breakdown = [
        {"species_name": row.species_name, "total_trees": row.total_trees, "total_carbon_tco2e": float(row.total_carbon)}
        for row in species_result.fetchall()
    ]

    # 4. Ambil saldo dompet
    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = wallet_result.scalars().first()
    avail_bal = float(wallet.available_balance) if wallet else 0.0
    escrow_bal = float(wallet.escrow_balance) if wallet else 0.0

    # 5. Query Jadwal Inspeksi Aktif (Lahan status draft/pending)
    draft_plots_query = text("""
        SELECT lp.id, lp.name, CAST(lp.status AS TEXT) as status, lp.created_at
        FROM land_plots lp
        WHERE lp.farmer_id = :farmer_id AND CAST(lp.status AS TEXT) IN ('draft', 'pending', 'pending_survey')
        ORDER BY lp.created_at ASC
    """)
    draft_result = await db.execute(draft_plots_query, {"farmer_id": current_user.id})
    draft_rows = draft_result.fetchall()
    
    surveyor_query = text("SELECT full_name, email FROM users WHERE role = 'surveyor' LIMIT 1")
    surveyor_result = await db.execute(surveyor_query)
    surveyor_row = surveyor_result.fetchone()
    surveyor_name = surveyor_row.full_name if surveyor_row else "Petugas Surveyor"
    first_word = surveyor_name.split()[0].upper()[:4] if surveyor_name else "LAP"
    surveyor_code = f"SRV-{first_word}-01"

    month_names_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

    upcoming_inspections = []
    for row in draft_rows:
        created_dt = row.created_at if row.created_at else datetime.utcnow()
        scheduled_dt = created_dt + timedelta(days=3)
        month_str = month_names_id[scheduled_dt.month - 1]
        formatted_date = f"{scheduled_dt.day} {month_str} {scheduled_dt.year}"

        upcoming_inspections.append({
            "land_plot_id": row.id,
            "land_plot_name": row.name,
            "surveyor_name": surveyor_name,
            "surveyor_code": surveyor_code,
            "scheduled_date": formatted_date,
            "status_note": "Inspeksi Poligon GPS & Sampel DBH (Geofencing \u2264 50m)"
        })

    # 6. Query 3-5 Mutasi Dompet Terakhir
    tx_query = text("""
        SELECT id, amount, transaction_type, description, status, created_at
        FROM wallet_transactions
        WHERE user_id = :farmer_id
        ORDER BY created_at DESC
        LIMIT 5
    """)
    tx_result = await db.execute(tx_query, {"farmer_id": current_user.id})
    tx_rows = tx_result.fetchall()
    
    recent_wallet_activities = [
        {
            "id": row.id,
            "title": row.description,
            "description": row.description,
            "amount": float(row.amount),
            "transaction_type": str(row.transaction_type),
            "status": str(row.status),
            "timestamp": row.created_at
        }
        for row in tx_rows
    ]

    return {
        "farmer_name": current_user.full_name,
        "farmer_email": current_user.email,
        "total_land_plots": int(total_plots),
        "total_land_area_sqm": float(total_area_val),
        "total_all_trees": totals.total_trees if totals else 0,
        "total_all_carbon_tco2e": float(totals.total_carbon) if totals else 0.0,
        "available_balance": avail_bal,
        "escrow_balance": escrow_bal,
        "species_breakdown": breakdown,
        "upcoming_inspections": upcoming_inspections,
        "recent_wallet_activities": recent_wallet_activities
    }