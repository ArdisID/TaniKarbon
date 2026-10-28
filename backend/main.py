import math
import uuid
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
from fastapi import FastAPI, Depends, HTTPException, Security, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import (
    User, CompanyProfile, Wallet, Cluster, Transaction, Certificate,
    TreeBlock, WalletTransaction, TreeSpecies, FarmerProfile, BankAccount, BankAccounts
)
from schemas import (
    AutoBuyRequest, AutoBuyResponse, LandPlotRequest, TreeBlockRequest,
    WithdrawRequest, DistributeRevenueRequest, FarmerDashboardSummary,
    TokenResponse, UserLoginRequest, UserRegisterRequest, UserResponse,
    DISPOSABLE_EMAIL_DOMAINS, TreeBlockDetail, LandPlotDetail, WalletResponse,
    WalletInfoResponse,
    UpcomingInspectionItem, RecentWalletActivityItem, WalletTransactionResponse,
    TreeSpeciesResponse, LandRevisionRequest, PolygonValidationRequest,
    PolygonValidationResponse, SpatialConflictItem, SpatialOverlayItem,
    AdminScheduleSurveyRequest,
    FarmerProfileUpdateRequest, FarmerProfileResponse, ProfileUpdateRequest, ProfileResponse,
    BankAccountCreateRequest, BankAccountResponse, SurveyorAuditRequest
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
            CREATE TABLE IF NOT EXISTS farmer_profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                nik VARCHAR(20),
                phone_number VARCHAR(30),
                address VARCHAR(255),
                village VARCHAR(100),
                regency VARCHAR(100),
                province VARCHAR(100),
                gapoktan_name VARCHAR(150),
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS bank_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                bank_code VARCHAR(50) NOT NULL,
                bank_name VARCHAR(100) NOT NULL,
                account_number VARCHAR(50) NOT NULL,
                account_holder_name VARCHAR(150) NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

        # Pastikan kolom surveyor_id di survey_logs nullable agar pengajuan revisi/catatan petani bisa tersimpan
        try:
            await conn.execute(text("ALTER TABLE survey_logs ALTER COLUMN surveyor_id DROP NOT NULL;"))
            await conn.execute(text("ALTER TABLE land_plots ADD COLUMN IF NOT EXISTS scheduled_survey_date TIMESTAMP WITHOUT TIME ZONE;"))
            await conn.execute(text("ALTER TYPE land_status ADD VALUE IF NOT EXISTS 'rejected';"))
        except Exception:
            pass

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
# 4a. Guardrail Spasial & Anti-Griefing Pendaftaran Lahan Petani
# ------------------------------------------------------------------------------
MIN_LAND_AREA_SQM = 100.0          # 0,01 Ha
MAX_LAND_AREA_SQM = 150000.0       # 15,00 Ha per petak pendaftaran mandiri
MAX_ACTIVE_DRAFT_PLOTS = 5         # Kuota draft aktif per petani
DOCUMENT_REQUIRED_AREA_SQM = 20000.0  # Di atas 2,00 Ha wajib dokumen/surat desa
DOCUMENT_REQUIRED_OWNERSHIPS = {
    "milik sendiri (shm)",
    "hgu / perkebunan",
}


def _format_hectares(area_sqm: float) -> str:
    """Format luas ke satuan Ha dengan pemisah desimal Indonesia."""
    hectares = max(0.0, float(area_sqm)) / 10000.0
    if 0 < hectares < 0.01:
        return f"{hectares:.4f}".replace(".", ",")
    return f"{hectares:.2f}".replace(".", ",")


def _geoJSON_to_string(value) -> str:
    """Normalisasi payload GeoJSON (dict/str) menjadi string untuk PostGIS."""
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data poligon GeoJSON wajib dikirimkan."
        )
    if isinstance(value, str):
        clean = value.strip()
        if not clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Data poligon GeoJSON tidak boleh kosong."
            )
        return clean
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format GeoJSON poligon tidak dapat dibaca."
        )


def _masked_plot_name(plot_id) -> str:
    """Samarkan identitas petak milik petani lain (privasi lintas-akun)."""
    return f"Zona Terdaftar #{str(plot_id).split('-')[0].upper()}"


async def _inspect_polygon_geometry(db: AsyncSession, geojson_value: str) -> dict:
    """
    Periksa validitas geometri + tipe objek via PostGIS.
    Mengembalikan dict: valid, area_sqm, message.
    """
    try:
        row = (
            await db.execute(
                text("""
                    WITH input AS (
                        SELECT ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326) AS geom
                    )
                    SELECT
                        ST_IsValid(geom) AS is_valid,
                        ST_IsValidReason(geom) AS invalid_reason,
                        ST_GeometryType(geom) AS geometry_type,
                        ST_IsEmpty(geom) AS is_empty
                    FROM input
                """),
                {"geojson": geojson_value}
            )
        ).fetchone()
    except DBAPIError:
        return {
            "valid": False,
            "area_sqm": 0.0,
            "message": "Validasi gagal: GeoJSON poligon tidak dapat dibaca oleh PostGIS."
        }

    if row is None:
        return {
            "valid": False,
            "area_sqm": 0.0,
            "message": "Validasi gagal: geometri poligon tidak terbentuk."
        }

    geometry_type = str(row.geometry_type or "")
    if geometry_type not in ("ST_Polygon", "ST_MultiPolygon"):
        return {
            "valid": False,
            "area_sqm": 0.0,
            "message": "Validasi gagal: objek GeoJSON harus berupa Polygon atau MultiPolygon."
        }

    if row.is_empty:
        return {
            "valid": False,
            "area_sqm": 0.0,
            "message": "Validasi gagal: poligon tidak memiliki area (geometri kosong)."
        }

    if not row.is_valid:
        reason = str(row.invalid_reason or "garis batas menyilang atau tidak tertutup")
        return {
            "valid": False,
            "area_sqm": 0.0,
            "message": f"Geometri poligon tidak valid: {reason}."
        }

    try:
        area_row = (
            await db.execute(
                text("""
                    SELECT ST_Area(
                        ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography
                    ) AS area_sqm
                """),
                {"geojson": geojson_value}
            )
        ).fetchone()
        area_sqm = float(area_row.area_sqm) if area_row and area_row.area_sqm is not None else 0.0
    except DBAPIError:
        return {
            "valid": False,
            "area_sqm": 0.0,
            "message": "Validasi gagal: luas geometri tidak dapat dihitung oleh PostGIS."
        }

    return {"valid": True, "area_sqm": area_sqm, "message": "Geometri poligon valid."}


def _assert_area_within_limits(area_sqm: float) -> None:
    """Tolak poligon mikroskopis maupun yang melebihi kuota 15 Ha per petak."""
    if area_sqm > MAX_LAND_AREA_SQM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Luas poligon ({_format_hectares(area_sqm)} Ha) melebihi batas maksimal "
                f"pendaftaran per petak (Maksimal 15,00 Ha)."
            )
        )
    if area_sqm < MIN_LAND_AREA_SQM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Luas poligon ({_format_hectares(area_sqm)} Ha) di bawah batas minimal "
                f"pendaftaran per petak (Minimal 0,01 Ha / 100 m²)."
            )
        )


def _assert_document_requirement(ownership: Optional[str], document_no: Optional[str], area_sqm: float) -> None:
    """Validasi dokumen hak berjenjang: SHM/HGU wajib, atau lahan > 2 Ha."""
    normalized_ownership = (ownership or "").strip().lower()
    has_document = bool((document_no or "").strip())

    if normalized_ownership in DOCUMENT_REQUIRED_OWNERSHIPS and not has_document:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Nomor Dokumen / Bukti Hak wajib diisi untuk status kepemilikan "
                f"'{ownership.strip()}'."
            )
        )

    if area_sqm > DOCUMENT_REQUIRED_AREA_SQM and not has_document:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Lahan dengan luas di atas 2,00 Ha wajib menyertakan Nomor Dokumen / "
                "Surat Keterangan Desa."
            )
        )


async def _find_overlapping_plot(db: AsyncSession, geojson_value: str):
    """Cari satu petak aktif yang beririsan dengan poligon kandidat."""
    return (
        await db.execute(
            text("""
                SELECT lp.id, lp.name, lp.farmer_id, CAST(lp.status AS TEXT) AS status
                FROM land_plots lp
                WHERE CAST(lp.status AS TEXT) != 'rejected'
                  AND lp.polygon_boundary IS NOT NULL
                  AND ST_Intersects(
                      lp.polygon_boundary,
                      ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)
                  )
                ORDER BY lp.created_at ASC
                LIMIT 1
            """),
            {"geojson": geojson_value}
        )
    ).fetchone()


def _build_conflict_payload(row, current_user: User) -> dict:
    is_own_land = row.farmer_id == current_user.id
    return {
        "id": row.id,
        "name": row.name if is_own_land else _masked_plot_name(row.id),
        "is_own_land": is_own_land,
        "status": str(row.status),
    }


# ------------------------------------------------------------------------------
# 4b. Pre-Check Spasial Real-Time (Step 2 Wizard) & Layer Referensi Peta
# ------------------------------------------------------------------------------
@app.post("/api/v1/farmer/lands/validate-polygon", response_model=PolygonValidationResponse)
async def validate_land_polygon(
    payload: PolygonValidationRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Validasi pre-flight sebelum poligon dikunci di Step 2:
    - ST_IsValid (geometri tidak menyilang)
    - ST_Area dalam rentang 100 m² s/d 150.000 m²
    - ST_Intersects terhadap seluruh petak aktif (anti-overlap)
    """
    geojson_value = _geoJSON_to_string(payload.polygon_boundary)
    inspection = await _inspect_polygon_geometry(db, geojson_value)

    if not inspection["valid"]:
        return PolygonValidationResponse(
            valid=False,
            area_sqm=float(inspection.get("area_sqm") or 0.0),
            message=inspection["message"],
            conflicting_plot=None
        )

    area_sqm = float(inspection["area_sqm"])
    if area_sqm > MAX_LAND_AREA_SQM:
        return PolygonValidationResponse(
            valid=False,
            area_sqm=area_sqm,
            message=(
                f"Luas poligon ({_format_hectares(area_sqm)} Ha) melebihi batas maksimal "
                f"pendaftaran per petak (Maksimal 15,00 Ha)."
            )
        )
    if area_sqm < MIN_LAND_AREA_SQM:
        return PolygonValidationResponse(
            valid=False,
            area_sqm=area_sqm,
            message=(
                f"Luas poligon ({_format_hectares(area_sqm)} Ha) di bawah batas minimal "
                f"pendaftaran per petak (Minimal 0,01 Ha / 100 m²)."
            )
        )

    overlapping_plot = await _find_overlapping_plot(db, geojson_value)
    if overlapping_plot:
        conflict = _build_conflict_payload(overlapping_plot, current_user)
        label = (
            f"lahan Anda '{conflict['name']}'"
            if conflict["is_own_land"]
            else f"{conflict['name']}"
        )
        return PolygonValidationResponse(
            valid=False,
            area_sqm=area_sqm,
            message=(
                f"Poligon tumpang-tindih dengan {label} yang sudah terdaftar. "
                "Sesuaikan batas lahan Anda agar tidak menimpa zona terproteksi."
            ),
            conflicting_plot=conflict
        )

    return PolygonValidationResponse(
        valid=True,
        area_sqm=area_sqm,
        message=(
            f"Poligon valid ({_format_hectares(area_sqm)} Ha) dan bebas tumpang-tindih "
            "dengan lahan terdaftar."
        ),
        conflicting_plot=None
    )


@app.get("/api/v1/farmer/lands/spatial-overlay", response_model=List[SpatialOverlayItem])
async def get_land_spatial_overlay(
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Layer referensi seluruh poligon aktif untuk peta Step 2.
    Nama petak milik petani lain disamarkan demi privasi (anti-klaim/anti-mafia lahan).
    """
    rows = (
        await db.execute(
            text("""
                SELECT
                    lp.id,
                    lp.name,
                    lp.farmer_id,
                    CAST(lp.status AS TEXT) AS status,
                    ST_AsGeoJSON(lp.polygon_boundary) AS geojson
                FROM land_plots lp
                WHERE CAST(lp.status AS TEXT) != 'rejected'
                  AND lp.polygon_boundary IS NOT NULL
                ORDER BY lp.created_at ASC
            """)
        )
    ).fetchall()

    overlay = []
    for row in rows:
        try:
            polygon_boundary = json.loads(row.geojson) if isinstance(row.geojson, str) else row.geojson
        except (TypeError, ValueError):
            continue
        if not polygon_boundary:
            continue

        is_own_land = row.farmer_id == current_user.id
        overlay.append(
            SpatialOverlayItem(
                id=row.id,
                name=row.name if is_own_land else _masked_plot_name(row.id),
                is_own_land=is_own_land,
                status=str(row.status),
                polygon_boundary=polygon_boundary
            )
        )
    return overlay


# ------------------------------------------------------------------------------
# 4c. Endpoint Mitra Tani (Terproteksi RBAC 'farmer')
# ------------------------------------------------------------------------------
@app.post("/api/v1/farmer/lands", status_code=status.HTTP_201_CREATED)
async def register_land_plot(
    payload: LandPlotRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    geojson_value = _geoJSON_to_string(payload.geojson_polygon)

    # 1. Validasi geometri & batas luas (min 100 m², maks 150.000 m² / 15 Ha)
    inspection = await _inspect_polygon_geometry(db, geojson_value)
    if not inspection["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=inspection["message"]
        )

    area_sqm = float(inspection["area_sqm"])
    _assert_area_within_limits(area_sqm)

    # 2. Validasi dokumen hak berjenjang (SHM/HGU wajib; > 2 Ha wajib surat desa)
    _assert_document_requirement(payload.ownership, payload.document_no, area_sqm)

    # 3. Batas kuota 5 petak draft aktif per petani (anti-griefing/anti-klaim massal)
    draft_count_row = (
        await db.execute(
            text("""
                SELECT COUNT(*) AS total
                FROM land_plots
                WHERE farmer_id = :farmer_id
                  AND CAST(status AS TEXT) = 'draft'
            """),
            {"farmer_id": current_user.id}
        )
    ).fetchone()
    draft_count = int(draft_count_row.total) if draft_count_row else 0
    if draft_count >= MAX_ACTIVE_DRAFT_PLOTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Kuota {MAX_ACTIVE_DRAFT_PLOTS} petak draft aktif sudah tercapai. "
                "Selesaikan verifikasi atau hapus petak draft sebelumnya sebelum "
                "mendaftarkan lahan baru."
            )
        )

    # 4. Validasi Geometri Spasial Anti-Overlap PostGIS (ST_Intersects)
    overlapping_plot = await _find_overlapping_plot(db, geojson_value)
    if overlapping_plot:
        conflict = _build_conflict_payload(overlapping_plot, current_user)
        label = (
            f"lahan Anda '{conflict['name']}'"
            if conflict["is_own_land"]
            else conflict["name"]
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Gagal menyimpan. Batas poligon yang Anda gambar tumpang-tindih "
                f"(overlap) dengan {label} yang sudah terdaftar di sistem."
            )
        )

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
        "name": payload.name, "geojson": geojson_value
    })
    await db.commit()
    
    row = result.fetchone()
    return {
        "id": row.id, "name": row.name,
        "area_sqm": float(row.total_area_sqm), "geojson_polygon": row.geojson_result,
        "status": "draft"
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
        SELECT lp.id, lp.name, lp.total_area_sqm, CAST(lp.status AS TEXT) as status,
               ST_AsGeoJSON(lp.polygon_boundary) as geojson,
               lp.created_at, lp.surveyor_id, lp.scheduled_survey_date,
               u.full_name as surveyor_name
        FROM land_plots lp
        LEFT JOIN users u ON lp.surveyor_id = u.id
        WHERE lp.farmer_id = :farmer_id
        ORDER BY lp.created_at ASC
    """)
    result = await db.execute(query, {"farmer_id": current_user.id})
    land_rows = result.fetchall()
    
    surveyor_query = text("SELECT full_name FROM users WHERE role = 'surveyor' LIMIT 1")
    s_res = await db.execute(surveyor_query)
    default_srv_row = s_res.fetchone()
    default_surveyor_name = default_srv_row.full_name if default_srv_row else "Budi Surveyor"

    lands_data = []
    for row in land_rows:
        tb_query = text("""
            SELECT tb.id, tb.species_name, tb.planting_year, tb.total_population, tb.estimated_tco2e_per_year,
                   ts_spec.formula_display,
                   (
                       SELECT ROUND(AVG(ts.circumference_cm / 3.14159265)::numeric, 1)
                       FROM tree_samples ts
                       WHERE ts.tree_block_id = tb.id
                   ) as avg_dbh_cm
            FROM tree_blocks tb
            LEFT JOIN tree_species ts_spec ON LOWER(tb.species_name) = LOWER(ts_spec.local_name)
            WHERE tb.land_plot_id = :plot_id
            ORDER BY tb.created_at ASC
        """)
        tb_result = await db.execute(tb_query, {"plot_id": row.id})
        tree_blocks = [
            {
                "id": tb.id,
                "species_name": tb.species_name,
                "planting_year": tb.planting_year,
                "total_population": tb.total_population,
                "estimated_tco2e_per_year": float(tb.estimated_tco2e_per_year),
                "avg_dbh_cm": float(tb.avg_dbh_cm) if tb.avg_dbh_cm is not None else None,
                "formula_display": tb.formula_display or "AGB = 0.11 × ρ × D^2.62"
            }
            for tb in tb_result.fetchall()
        ]

        sl_query = text("""
            SELECT sl.id, sl.notes, sl.created_at, u.full_name as surveyor_name
            FROM survey_logs sl
            LEFT JOIN users u ON sl.surveyor_id = u.id
            WHERE sl.land_plot_id = :plot_id
            ORDER BY sl.created_at ASC
        """)
        sl_result = await db.execute(sl_query, {"plot_id": row.id})
        survey_logs = [
            {
                "id": sl.id,
                "notes": sl.notes,
                "created_at": sl.created_at,
                "surveyor_name": sl.surveyor_name
            }
            for sl in sl_result.fetchall()
        ]

        # Dinamisasi surveyor: baca dari relasi jika ada, jangan hardcode default jika surveyor_id null
        if row.surveyor_name:
            srv_name = row.surveyor_name
            first_word = srv_name.split()[0].upper()[:4] if srv_name else "SRV"
            srv_code = f"SRV-{first_word}-09"
        else:
            srv_name = None
            srv_code = None

        # Penjadwalan survei diatur oleh Admin (jika belum diatur admin, return None)
        if row.scheduled_survey_date:
            scheduled_dt = row.scheduled_survey_date
            month_names_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
            month_str = month_names_id[scheduled_dt.month - 1]
            formatted_sched_date = f"{scheduled_dt.day} {month_str} {scheduled_dt.year}"
        else:
            formatted_sched_date = None

        lands_data.append({
            "id": row.id,
            "name": row.name,
            "area_sqm": float(row.total_area_sqm),
            "status": str(row.status),
            "geojson_polygon": row.geojson,
            "created_at": row.created_at,
            "surveyor_id": row.surveyor_id,
            "surveyor_name": srv_name,
            "surveyor_code": srv_code,
            "scheduled_survey_date": row.scheduled_survey_date,
            "scheduled_date": formatted_sched_date,
            "tree_blocks": tree_blocks,
            "survey_logs": survey_logs
        })
    return lands_data


@app.post("/api/v1/farmer/lands/{land_id}/revisions", status_code=status.HTTP_201_CREATED)
async def submit_land_revision(
    land_id: uuid.UUID,
    payload: LandRevisionRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    check_query = text("SELECT id, name, farmer_id FROM land_plots WHERE id = :land_id")
    res = await db.execute(check_query, {"land_id": land_id})
    plot = res.fetchone()
    if not plot:
        raise HTTPException(status_code=404, detail="Petak lahan tidak ditemukan")
    if plot.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak: Anda bukan pemilik petak lahan ini")

    note_text = payload.detail_notes
    if len(note_text) < 5:
        raise HTTPException(status_code=400, detail="Rincian pengajuan minimal 5 karakter")

    ticket_id = f"REV-{uuid.uuid4().hex[:6].upper()}"
    log_content = f"[{ticket_id} - {payload.category}] {note_text}"

    surveyor_query = text("SELECT id FROM users WHERE role = 'surveyor' LIMIT 1")
    s_res = await db.execute(surveyor_query)
    s_row = s_res.fetchone()
    surveyor_id = s_row.id if s_row else None

    if surveyor_id:
        await db.execute(
            text("""
                INSERT INTO survey_logs (id, land_plot_id, surveyor_id, notes, created_at)
                VALUES (gen_random_uuid(), :plot_id, :srv_id, :notes, CURRENT_TIMESTAMP)
            """),
            {"plot_id": land_id, "srv_id": surveyor_id, "notes": log_content}
        )
    else:
        await db.execute(
            text("""
                INSERT INTO survey_logs (id, land_plot_id, notes, created_at)
                VALUES (gen_random_uuid(), :plot_id, :notes, CURRENT_TIMESTAMP)
            """),
            {"plot_id": land_id, "notes": log_content}
        )

    await db.commit()

    return {
        "status": "success",
        "ticket": ticket_id,
        "message": f"Pengajuan {ticket_id} berhasil diteruskan ke surveyor.",
        "land_plot_id": str(land_id),
        "category": payload.category
    }


@app.post("/api/v1/farmer/verification-revisions", status_code=status.HTTP_201_CREATED)
async def submit_verification_revision(
    payload: LandRevisionRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    if not payload.land_plot_id:
        raise HTTPException(status_code=400, detail="land_plot_id harus dicantumkan")
    return await submit_land_revision(payload.land_plot_id, payload, current_user, db)


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
    # Validasi ketat nominal penarikan: harus > 0, bukan NaN/Infinity
    if payload.amount <= 0 or math.isnan(payload.amount) or math.isinf(payload.amount):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nominal penarikan harus lebih besar dari Rp 0 dan berupa angka valid."
        )

    try:
        # 1. Kunci baris dompet petani (Pessimistic Row Lock: SELECT ... FOR UPDATE)
        # Mencegah Race Condition / Double Spending saat spam klik / concurrent request
        wallet_result = await db.execute(
            select(Wallet)
            .where(Wallet.user_id == current_user.id)
            .with_for_update()
        )
        wallet = wallet_result.scalars().first()
        if not wallet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dompet petani tidak ditemukan.")
        
        current_balance = float(wallet.available_balance)
        if current_balance < payload.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Saldo tidak mencukupi. Saldo saat ini: Rp{current_balance:,.2f}"
            )
        
        # 2. Kurangi saldo tersedia & perbarui timestamp
        wallet.available_balance = current_balance - payload.amount
        wallet.updated_at = datetime.utcnow()
        
        bank_dest = payload.bank_name or payload.bank_code or "Bank Terdaftar"
        acc_num = payload.account_number or "Rekening Terdaftar"

        # 3. Catat transaksi withdrawal ke ledger
        new_tx = WalletTransaction(
            user_id=current_user.id,
            amount=abs(payload.amount),  # simpan positif
            transaction_type="debit_withdraw",
            description=f"Penarikan dana ke {bank_dest} ({acc_num})",
            status="completed",
            created_at=datetime.utcnow()
        )
        db.add(new_tx)
        
        # 4. Atomic Commit
        await db.commit()
        await db.refresh(new_tx)
        
        return {
            "status": "success",
            "message": f"Penarikan dana sebesar Rp{payload.amount:,.2f} ke {bank_dest} berhasil diproses.",
            "remaining_balance": float(wallet.available_balance),
            "transaction_id": new_tx.id
        }
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memproses penarikan saldo: {str(e)}"
        )

@app.get("/api/v1/farmer/wallet", response_model=WalletInfoResponse)
async def get_farmer_wallet(
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = wallet_result.scalars().first()
    if not wallet:
        # Auto-create wallet jika belum ada
        wallet = Wallet(
            user_id=current_user.id,
            available_balance=0.0,
            escrow_balance=0.0
        )
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)
    
    # Ambil recent transactions terbaru (max 10)
    tx_result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.user_id == current_user.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(10)
    )
    recent_txs = tx_result.scalars().all()
    
    return {
        "available_balance": float(wallet.available_balance),
        "escrow_balance": float(wallet.escrow_balance),
        "recent_transactions": [
            {
                "id": tx.id,
                "user_id": tx.user_id,
                "amount": float(tx.amount),
                "transaction_type": tx.transaction_type,
                "description": tx.description,
                "status": tx.status,
                "created_at": tx.created_at
            }
            for tx in recent_txs
        ]
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
# 4e. Profil Mitra Tani & Manajemen Rekening Bank (CRUD Handoff Ready)
# ------------------------------------------------------------------------------
@app.get("/api/v1/farmer/profile", response_model=FarmerProfileResponse)
async def get_farmer_profile(
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FarmerProfile).where(FarmerProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        profile = FarmerProfile(
            user_id=current_user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return FarmerProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        nik=profile.nik,
        phone_number=profile.phone_number,
        address=profile.address,
        village=profile.village,
        regency=profile.regency,
        province=profile.province,
        gapoktan_name=profile.gapoktan_name,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@app.patch("/api/v1/farmer/profile", response_model=FarmerProfileResponse)
@app.put("/api/v1/farmer/profile", response_model=FarmerProfileResponse)
async def update_farmer_profile(
    payload: FarmerProfileUpdateRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FarmerProfile).where(FarmerProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        profile = FarmerProfile(user_id=current_user.id)
        db.add(profile)

    if payload.full_name is not None and payload.full_name.strip():
        current_user.full_name = payload.full_name.strip()

    if payload.nik is not None:
        profile.nik = payload.nik.strip()
    if payload.phone_number is not None:
        profile.phone_number = payload.phone_number.strip()
    if payload.address is not None:
        profile.address = payload.address.strip()
    if payload.village is not None:
        profile.village = payload.village.strip()
    if payload.regency is not None:
        profile.regency = payload.regency.strip()
    if payload.province is not None:
        profile.province = payload.province.strip()
    if payload.gapoktan_name is not None:
        profile.gapoktan_name = payload.gapoktan_name.strip()

    profile.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(profile)

    return FarmerProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        nik=profile.nik,
        phone_number=profile.phone_number,
        address=profile.address,
        village=profile.village,
        regency=profile.regency,
        province=profile.province,
        gapoktan_name=profile.gapoktan_name,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@app.get("/api/v1/farmer/bank-accounts", response_model=List[BankAccountResponse])
async def get_farmer_bank_accounts(
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BankAccount)
        .where(BankAccount.user_id == current_user.id)
        .order_by(BankAccount.is_primary.desc(), BankAccount.created_at.asc())
    )
    accounts = result.scalars().all()
    return accounts


@app.post("/api/v1/farmer/bank-accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_farmer_bank_account(
    payload: BankAccountCreateRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    # Cek apakah ini rekening pertama petani
    existing_result = await db.execute(
        select(BankAccount).where(BankAccount.user_id == current_user.id)
    )
    existing_accounts = existing_result.scalars().all()

    should_be_primary = bool(payload.is_primary or len(existing_accounts) == 0)

    if should_be_primary and len(existing_accounts) > 0:
        for acc in existing_accounts:
            acc.is_primary = False

    new_acc = BankAccount(
        user_id=current_user.id,
        bank_code=payload.bank_code.strip().upper(),
        bank_name=payload.bank_name.strip(),
        account_number=payload.account_number.strip(),
        account_holder_name=payload.account_holder_name.strip(),
        is_primary=should_be_primary,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_acc)
    await db.commit()
    await db.refresh(new_acc)
    return new_acc


@app.delete("/api/v1/farmer/bank-accounts/{account_id}")
async def delete_farmer_bank_account(
    account_id: uuid.UUID,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BankAccount)
        .where(BankAccount.id == account_id, BankAccount.user_id == current_user.id)
    )
    acc = result.scalars().first()
    if not acc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rekening bank tidak ditemukan."
        )

    was_primary = acc.is_primary
    await db.delete(acc)

    # Jika yang dihapus adalah rekening primer, angkat rekening tertua yang tersisa jadi primer
    if was_primary:
        remaining_result = await db.execute(
            select(BankAccount)
            .where(BankAccount.user_id == current_user.id, BankAccount.id != account_id)
            .order_by(BankAccount.created_at.asc())
        )
        remaining_acc = remaining_result.scalars().first()
        if remaining_acc:
            remaining_acc.is_primary = True

    await db.commit()
    return {
        "status": "success",
        "message": "Rekening bank berhasil dihapus."
    }



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

@app.patch("/api/v1/admin/lands/{land_id}/schedule", status_code=status.HTTP_200_OK)
async def admin_schedule_land_survey(
    land_id: uuid.UUID,
    payload: AdminScheduleSurveyRequest,
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint Manajemen Admin:
    Mengatur alokasi surveyor dan waktu tanggal rencana inspeksi fisik untuk petak lahan tertentu.
    """
    check_query = text("SELECT id, name, CAST(status AS TEXT) as status, farmer_id FROM land_plots WHERE id = :land_id")
    check_res = await db.execute(check_query, {"land_id": land_id})
    plot = check_res.fetchone()
    if not plot:
        raise HTTPException(status_code=404, detail="Petak lahan tidak ditemukan")

    surveyor_name = None
    if payload.surveyor_id:
        srv_query = text("SELECT id, full_name, role FROM users WHERE id = :surveyor_id")
        srv_res = await db.execute(srv_query, {"surveyor_id": payload.surveyor_id})
        srv = srv_res.fetchone()
        if not srv or srv.role != "surveyor":
            raise HTTPException(status_code=400, detail="User yang dipilih bukan seorang surveyor resmi.")
        surveyor_name = srv.full_name

    update_query = text("""
        UPDATE land_plots
        SET surveyor_id = :surveyor_id,
            scheduled_survey_date = :scheduled_date
        WHERE id = :land_id
    """)
    await db.execute(update_query, {
        "land_id": land_id,
        "surveyor_id": payload.surveyor_id,
        "scheduled_date": payload.scheduled_survey_date
    })

    if payload.notes:
        log_query = text("""
            INSERT INTO survey_logs (land_plot_id, surveyor_id, notes, created_at)
            VALUES (:land_id, :surveyor_id, :notes, CURRENT_TIMESTAMP)
        """)
        await db.execute(log_query, {
            "land_id": land_id,
            "surveyor_id": payload.surveyor_id,
            "notes": f"[Penjadwalan Admin] {payload.notes}"
        })

    await db.commit()

    month_names_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    dt = payload.scheduled_survey_date
    formatted_date = f"{dt.day} {month_names_id[dt.month - 1]} {dt.year}"

    return {
        "status": "success",
        "message": f"Jadwal inspeksi untuk petak '{plot.name}' berhasil ditentukan oleh Admin.",
        "land_id": str(land_id),
        "surveyor_id": str(payload.surveyor_id) if payload.surveyor_id else None,
        "surveyor_name": surveyor_name,
        "scheduled_survey_date": payload.scheduled_survey_date.isoformat(),
        "scheduled_date": formatted_date
    }


@app.get("/api/v1/surveyor/tasks")
async def get_surveyor_tasks(
    current_user: User = Depends(require_roles(["surveyor", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengambil seluruh land_plots di database PostgreSQL di mana
    surveyor_id == current_user.id ATAU surveyor_id IS NULL.
    Sertakan data lengkap: id, name, farmer_name, area_sqm, area_ha, status,
    scheduled_survey_date, polygon_boundary, centroid, tree_blocks, dan survey_logs.
    """
    query = text("""
        SELECT lp.id, lp.name, lp.total_area_sqm, CAST(lp.status AS TEXT) as status,
               ST_AsGeoJSON(lp.polygon_boundary) as geojson_polygon,
               ST_Y(lp.centroid) as lat,
               ST_X(lp.centroid) as lng,
               lp.created_at, lp.surveyor_id, lp.scheduled_survey_date,
               u_farmer.id as farmer_id,
               u_farmer.full_name as farmer_name,
               u_farmer.email as farmer_email,
               fp.phone_number as farmer_phone,
               u_surveyor.full_name as surveyor_name
        FROM land_plots lp
        JOIN users u_farmer ON lp.farmer_id = u_farmer.id
        LEFT JOIN farmer_profiles fp ON u_farmer.id = fp.user_id
        LEFT JOIN users u_surveyor ON lp.surveyor_id = u_surveyor.id
        WHERE (lp.surveyor_id = :surveyor_id OR lp.surveyor_id IS NULL)
        ORDER BY 
            CASE WHEN lp.scheduled_survey_date IS NOT NULL THEN 0 ELSE 1 END,
            lp.scheduled_survey_date ASC,
            lp.created_at DESC
    """)
    res = await db.execute(query, {"surveyor_id": current_user.id})
    rows = res.fetchall()

    tasks = []
    month_names_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    today_date = datetime.utcnow().date()

    for row in rows:
        tb_query = text("""
            SELECT tb.id, tb.species_name, tb.planting_year, tb.total_population,
                   tb.estimated_tco2e_per_year,
                   (
                       SELECT ROUND(AVG(ts.circumference_cm / 3.14159265)::numeric, 1)
                       FROM tree_samples ts
                       WHERE ts.tree_block_id = tb.id
                   ) as avg_dbh_cm,
                   (
                       SELECT ROUND(AVG(ts.height_m)::numeric, 1)
                       FROM tree_samples ts
                       WHERE ts.tree_block_id = tb.id
                   ) as avg_height_m
            FROM tree_blocks tb
            WHERE tb.land_plot_id = :plot_id
            ORDER BY tb.created_at ASC
        """)
        tb_res = await db.execute(tb_query, {"plot_id": row.id})
        tbs = tb_res.fetchall()
        
        tree_blocks_list = []
        total_trees = 0
        species_list = []
        for tb in tbs:
            total_trees += (tb.total_population or 0)
            species_list.append(tb.species_name)
            tree_blocks_list.append({
                "id": str(tb.id),
                "species_name": tb.species_name,
                "planting_year": tb.planting_year,
                "total_population": tb.total_population,
                "avg_dbh_cm": float(tb.avg_dbh_cm) if tb.avg_dbh_cm is not None else 25.0,
                "avg_height_m": float(tb.avg_height_m) if tb.avg_height_m is not None else 12.0,
                "estimated_tco2e_per_year": float(tb.estimated_tco2e_per_year) if tb.estimated_tco2e_per_year is not None else 0.0
            })

        species_summary = " & ".join(species_list[:2]) if species_list else "Pohon Agroforestri"

        sl_query = text("""
            SELECT sl.id, sl.notes, sl.created_at, u.full_name as surveyor_name
            FROM survey_logs sl
            LEFT JOIN users u ON sl.surveyor_id = u.id
            WHERE sl.land_plot_id = :plot_id
            ORDER BY sl.created_at DESC
        """)
        sl_res = await db.execute(sl_query, {"plot_id": row.id})
        sl_rows = sl_res.fetchall()
        survey_logs_list = [
            {
                "id": str(sl.id),
                "notes": sl.notes,
                "created_at": sl.created_at.isoformat() if sl.created_at else None,
                "surveyor_name": sl.surveyor_name
            }
            for sl in sl_rows
        ]
        latest_notes = sl_rows[0].notes if sl_rows else "Menunggu verifikasi fisik & sampel DBH."

        polygon_rings = []
        if row.geojson_polygon:
            try:
                geom = json.loads(row.geojson_polygon)
                if geom.get("type") == "Polygon" and geom.get("coordinates"):
                    polygon_rings = [[pt[1], pt[0]] for pt in geom["coordinates"][0]]
                elif geom.get("type") == "MultiPolygon" and geom.get("coordinates"):
                    polygon_rings = [[pt[1], pt[0]] for pt in geom["coordinates"][0][0]]
            except Exception:
                polygon_rings = []

        is_today = False
        formatted_sched_date = None
        formatted_sched_time = None
        if row.scheduled_survey_date:
            s_dt = row.scheduled_survey_date
            is_today = (s_dt.date() == today_date)
            formatted_sched_date = f"{s_dt.day} {month_names_id[s_dt.month - 1]} {s_dt.year}"
            formatted_sched_time = f"{s_dt.strftime('%H:%M')} WIB"

        raw_uuid = str(row.id).replace("-", "")
        ticket_code = f"TKT-{raw_uuid[:4].upper()}"

        area_sqm = float(row.total_area_sqm) if row.total_area_sqm else 0.0
        area_ha = round(area_sqm / 10000, 2)

        # Default fallback koordinat jika centroid null: area Depok/Jakarta (-6.3686, 106.8331)
        plot_lat = float(row.lat) if row.lat is not None else -6.3686
        plot_lng = float(row.lng) if row.lng is not None else 106.8331

        tasks.append({
            "id": str(row.id),
            "plot_id": str(row.id),
            "land_plot_id": str(row.id),
            "ticket_code": ticket_code,
            "code": ticket_code,
            "name": row.name,
            "landName": row.name,
            "farmer_id": str(row.farmer_id),
            "farmer_name": row.farmer_name or "Petani TaniKarbon",
            "farmerName": row.farmer_name or "Petani TaniKarbon",
            "farmer_phone": row.farmer_phone or "0812-3456-7890",
            "farmerPhone": row.farmer_phone or "0812-3456-7890",
            "farmer_email": row.farmer_email,
            "area_sqm": area_sqm,
            "areaM2": area_sqm,
            "area_ha": area_ha,
            "status": row.status,
            "tree_blocks": tree_blocks_list,
            "treeCount": total_trees,
            "species": species_summary,
            "survey_logs": survey_logs_list,
            "scheduledDate": formatted_sched_date,
            "scheduledTime": formatted_sched_time or "09:00 WIB",
            "scheduled_survey_date": row.scheduled_survey_date.isoformat() if row.scheduled_survey_date else None,
            "isToday": is_today,
            "is_today": is_today,
            "isScheduled": bool(row.scheduled_survey_date),
            "is_scheduled": bool(row.scheduled_survey_date),
            "notes": latest_notes,
            "lat": plot_lat,
            "lng": plot_lng,
            "centroid": [plot_lat, plot_lng],
            "polygon": polygon_rings,
            "polygon_boundary": polygon_rings,
            "geojson": row.geojson_polygon,
            "geojson_polygon": row.geojson_polygon
        })

    return tasks


@app.post("/api/v1/surveyor/lands/{land_id}/audit")
async def audit_land_plot(
    land_id: uuid.UUID,
    payload: SurveyorAuditRequest,
    current_user: User = Depends(require_roles(["surveyor", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Mencatat keputusan audit lapangan dari surveyor:
    - approved: Ubah status menjadi 'verified', catat berita acara.
    - revision: Kembalikan status menjadi 'draft', catat kategori & catatan revisi di survey_logs.
    - rejected: Ubah status menjadi 'rejected', catat alasan penolakan di survey_logs.
    """
    decision = payload.decision.lower().strip()
    if decision not in ["approved", "revision", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Keputusan audit tidak valid. Pilihan: 'approved', 'revision', 'rejected'"
        )

    check_query = text("SELECT id, name, CAST(status AS TEXT) as status, farmer_id FROM land_plots WHERE id = :land_id")
    check_res = await db.execute(check_query, {"land_id": land_id})
    plot = check_res.fetchone()
    if not plot:
        raise HTTPException(status_code=404, detail="Petak lahan tidak ditemukan")

    ticket_code = f"AUD-{uuid.uuid4().hex[:6].upper()}"

    if decision == "approved":
        new_status = "verified"
        log_content = f"[{ticket_code} - BERITA ACARA VERIFIKASI SURVEYOR] Disetujui oleh {current_user.full_name}: {payload.notes}"
        
        # Jika ada penyesuaian blok pohon aktual dari surveyor
        if payload.block_adjustments:
            for adj in payload.block_adjustments:
                block_id = adj.get("block_id") or adj.get("id")
                act_pop = adj.get("actual_population")
                if block_id and act_pop is not None:
                    try:
                        b_uuid = uuid.UUID(str(block_id))
                        await db.execute(
                            text("UPDATE tree_blocks SET total_population = :pop WHERE id = :bid AND land_plot_id = :lid"),
                            {"pop": int(act_pop), "bid": b_uuid, "lid": land_id}
                        )
                    except Exception:
                        pass
    elif decision == "revision":
        new_status = "draft"
        category = payload.category or "Revisi Batas / Data Lapangan"
        log_content = f"[{ticket_code} - REVISI LAPANGAN: {category}] {payload.notes}"
    else:  # rejected
        new_status = "rejected"
        log_content = f"[{ticket_code} - PENOLAKAN INSPEKSI LAPANGAN] Ditolak oleh {current_user.full_name}: {payload.notes}"

    # Update status lahan dan surveyor_id penanggung jawab
    update_query = text("""
        UPDATE land_plots
        SET status = CAST(:status AS land_status),
            surveyor_id = :surveyor_id
        WHERE id = :land_id
    """)
    await db.execute(update_query, {
        "status": new_status,
        "surveyor_id": current_user.id,
        "land_id": land_id
    })

    # Catat ke survey_logs
    insert_log = text("""
        INSERT INTO survey_logs (id, land_plot_id, surveyor_id, notes, created_at)
        VALUES (gen_random_uuid(), :land_id, :surveyor_id, :notes, CURRENT_TIMESTAMP)
    """)
    await db.execute(insert_log, {
        "land_id": land_id,
        "surveyor_id": current_user.id,
        "notes": log_content
    })

    await db.commit()

    return {
        "status": "success",
        "ticket": ticket_code,
        "land_id": str(land_id),
        "decision": decision,
        "new_status": new_status,
        "message": f"Keputusan audit ({decision}) untuk petak '{plot.name}' berhasil dicatat."
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
        ORDER BY SUM(tb.total_population) DESC, tb.species_name ASC
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

    # 5. Query Jadwal Inspeksi Aktif (hanya draft/pending yang SUDAH punya blok pohon)
    # Selaras dengan aturan UI: petak tanpa blok pohon belum masuk antrean surveyor.
    draft_plots_query = text("""
        SELECT lp.id, lp.name, CAST(lp.status AS TEXT) as status, lp.created_at,
               lp.surveyor_id, lp.scheduled_survey_date, u.full_name as surveyor_name
        FROM land_plots lp
        LEFT JOIN users u ON lp.surveyor_id = u.id
        WHERE lp.farmer_id = :farmer_id
          AND CAST(lp.status AS TEXT) IN ('draft', 'pending', 'pending_survey')
          AND EXISTS (
              SELECT 1 FROM tree_blocks tb WHERE tb.land_plot_id = lp.id
          )
        ORDER BY lp.created_at ASC
    """)
    draft_result = await db.execute(draft_plots_query, {"farmer_id": current_user.id})
    draft_rows = draft_result.fetchall()

    month_names_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

    upcoming_inspections = []
    for row in draft_rows:
        # Penjadwalan survei diatur oleh Admin (bukan otomatis backend)
        if row.scheduled_survey_date:
            scheduled_dt = row.scheduled_survey_date
            month_str = month_names_id[scheduled_dt.month - 1]
            formatted_date = f"{scheduled_dt.day} {month_str} {scheduled_dt.year}"
        else:
            formatted_date = None

        if row.surveyor_name:
            srv_name = row.surveyor_name
            first_word = srv_name.split()[0].upper()[:4] if srv_name else "SRV"
            srv_code = f"SRV-{first_word}-09"
        else:
            srv_name = None
            srv_code = None

        upcoming_inspections.append({
            "land_plot_id": row.id,
            "land_plot_name": row.name,
            "surveyor_id": row.surveyor_id,
            "surveyor_name": srv_name,
            "surveyor_code": srv_code,
            "scheduled_survey_date": row.scheduled_survey_date,
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

    # 7. Query Klaster Aktif yang Terhubung ke Petak Lahan Petani
    cluster_query = text("""
        SELECT 
            c.id as cluster_id,
            c.name as cluster_name,
            CAST(c.status AS TEXT) as cluster_status,
            COALESCE(c.target_quota_tco2e, 1000.0) as target_tco2e,
            (
                SELECT COALESCE(SUM(tb.estimated_tco2e_per_year), 0)
                FROM land_plots lp2
                JOIN tree_blocks tb ON lp2.id = tb.land_plot_id
                WHERE lp2.cluster_id = c.id
            ) as current_carbon_tco2e
        FROM land_plots lp
        JOIN clusters c ON lp.cluster_id = c.id
        WHERE lp.farmer_id = :farmer_id AND lp.cluster_id IS NOT NULL
        ORDER BY lp.created_at DESC
        LIMIT 1
    """)
    cluster_result = await db.execute(cluster_query, {"farmer_id": current_user.id})
    cluster_row = cluster_result.fetchone()

    cluster_info = None
    if cluster_row:
        target_val = float(cluster_row.target_tco2e)
        current_val = round(float(cluster_row.current_carbon_tco2e), 2)
        pct = round((current_val / target_val) * 100.0, 1) if target_val > 0 else 0.0
        cluster_info = {
            "cluster_id": cluster_row.cluster_id,
            "cluster_name": cluster_row.cluster_name,
            "cluster_status": cluster_row.cluster_status,
            "target_tco2e": target_val,
            "current_carbon_tco2e": current_val,
            "percentage": min(100.0, pct)
        }

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
        "recent_wallet_activities": recent_wallet_activities,
        "cluster_info": cluster_info
    }