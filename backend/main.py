import os
import shutil
import math
import uuid
import json
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, cast
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
dotenv_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=dotenv_path)
from fastapi import FastAPI, Depends, HTTPException, Security, Request, status, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text, func
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import (
    User, CompanyProfile, Wallet, Cluster, Transaction, Certificate,
    TreeBlock, TreeSample, WalletTransaction, TreeSpecies, FarmerProfile, BankAccount, BankAccounts
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

# Setup direktori penyimpanan upload foto dokumentasi lapangan surveyor
UPLOAD_ROOT = os.path.join(os.path.dirname(__file__), "uploads")
SURVEY_PHOTOS_DIR = os.path.join(UPLOAD_ROOT, "survey_photos")
os.makedirs(SURVEY_PHOTOS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

# ------------------------------------------------------------------------------
# 0. Integrasi Rate Limiter (slowapi) Anti Brute-Force
# ------------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, cast(Any, _rate_limit_exceeded_handler))

@app.on_event("startup")
async def on_startup():
    from init_db import init_db
    await init_db()


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
@app.get("/api/v1/species", response_model=List[TreeSpeciesResponse])
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
                f"'{(ownership or '').strip()}'."
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


SPECIES_ALIASES = {
    # Sengon
    "sengon laut": "Sengon",
    "sengon buto": "Sengon",
    "paraserianthes falcataria": "Sengon",
    "falcataria moluccana": "Sengon",
    # Jati
    "jati emas": "Jati",
    "jati putih": "Jati",
    "tectona grandis": "Jati",
    # Alpukat
    "alpukat mentega": "Alpukat",
    "alpukat aligator": "Alpukat",
    "persea americana": "Alpukat",
    # Mangga
    "mangga arumanis": "Mangga",
    "mangga manalagi": "Mangga",
    "mangifera indica": "Mangga",
    # Durian
    "durian montong": "Durian",
    "durian musang king": "Durian",
    "durio zibethinus": "Durian",
    # Kopi
    "kopi arabika / robusta": "Kopi",
    "kopi arabika": "Kopi",
    "kopi robusta": "Kopi",
    "coffea arabica": "Kopi",
    "coffea canephora": "Kopi",
    # Kelapa
    "kelapa dalam": "Kelapa",
    "kelapa hibrida": "Kelapa",
    "kelapa sawit": "Kelapa",
    "cocos nucifera": "Kelapa",
    # Kakao
    "kakao cokelat": "Kakao",
    "theobroma cacao": "Kakao",
    # Pisang
    "pisang ambon": "Pisang",
    "pisang kepok": "Pisang",
    "musa paradisiaca": "Pisang",
    # Mahoni
    "mahoni daun lebar": "Mahoni",
    "swietenia macrophylla": "Mahoni",
}


async def _save_tree_block_calculation(
    db: AsyncSession,
    land_plot_id: uuid.UUID,
    payload: TreeBlockRequest
) -> dict:
    clean_species_name = payload.species_name.strip()
    alias_target = SPECIES_ALIASES.get(clean_species_name.lower(), clean_species_name)

    # 1. Query Spesies Pohon dari Master Data tree_species (Dukung nama lokal, latin, alias, dan kata kunci awal)
    first_word = clean_species_name.split()[0] if clean_species_name else ""
    species_query = select(TreeSpecies).where(
        (TreeSpecies.local_name.ilike(alias_target)) |
        (TreeSpecies.local_name.ilike(clean_species_name)) |
        (TreeSpecies.latin_name.ilike(clean_species_name)) |
        (TreeSpecies.local_name.ilike(f"{first_word}%"))
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

    # Validasi dan agregasi tinggi pohon dari level blok maupun sampel individual
    sample_heights = [float(s.height_m) for s in payload.samples if s.height_m is not None and float(s.height_m) > 0]
    avg_sample_height = (sum(sample_heights) / len(sample_heights)) if sample_heights else None
    effective_height = float(payload.height_m) if (payload.height_m is not None and float(payload.height_m) > 0) else (avg_sample_height or 0.0)

    # Validasi bahwa tanaman Monokotil (Kelapa) WAJIB menyertakan tinggi batang pohon H > 0 meter
    if formula_type == "monocot_cylinder" or requires_height:
        if effective_height <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Spesies Monokotil (Kelapa) wajib menyertakan parameter rata-rata tinggi batang pohon (H > 0 meter) untuk rumus silinder alometrik ICRAF."
            )

    # 2. Buat record blok pohon terlebih dahulu
    new_block = TreeBlock(
        land_plot_id=land_plot_id,
        species_name=clean_species_name,
        planting_year=payload.planting_year,
        total_population=payload.total_population,
        estimated_tco2e_per_year=0.0
    )
    db.add(new_block)
    await db.flush()

    # 3. Hitung AGB untuk setiap sampel pohon & simpan setiap sampel ke tabel tree_samples
    sample_agb_list = []
    dbh_list = []

    for s in payload.samples:
        d_cm = s.circumference_cm / math.pi
        dbh_list.append(d_cm)
        s_height = float(s.height_m) if (s.height_m is not None and float(s.height_m) > 0) else (effective_height if effective_height > 0 else None)

        if formula_type == "ketterings":
            agb_i = 0.11 * wood_density * (d_cm ** 2.62)
        elif formula_type == "power_law":
            agb_i = coeff_a * (d_cm ** exp_b)
        elif formula_type == "monocot_cylinder":
            radius_m = d_cm / 200.0
            h_used = s_height or effective_height
            agb_i = math.pi * (radius_m ** 2) * h_used * 730.0
        else:
            agb_i = 0.11 * wood_density * (d_cm ** 2.62)

        sample_agb_list.append(agb_i)

        # Simpan record sensus ke tabel tree_samples (terhubung ke surveyor & audit)
        sample_record = TreeSample(
            tree_block_id=new_block.id,
            circumference_cm=round(s.circumference_cm, 2),
            height_m=round(s_height, 2) if s_height is not None else None
        )
        db.add(sample_record)

    avg_agb_kg = sum(sample_agb_list) / len(sample_agb_list)
    avg_dbh_cm = sum(dbh_list) / len(dbh_list)

    current_year = datetime.utcnow().year
    stand_age = max(1, current_year - payload.planting_year)
    annual_co2_per_tree = (avg_agb_kg * 0.47 * (44.0 / 12.0)) / (1000.0 * stand_age)
    total_estimated_tco2e = annual_co2_per_tree * payload.total_population

    new_block.estimated_tco2e_per_year = total_estimated_tco2e
    await db.flush()

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
        "avg_height_m": round(effective_height, 2) if effective_height > 0 else None,
        "avg_agb_kg": round(avg_agb_kg, 2),
        "estimated_tco2e_per_year": round(total_estimated_tco2e, 4)
    }


# ------------------------------------------------------------------------------
# 4c. Endpoint Mitra Tani (Terproteksi RBAC 'farmer')
# ------------------------------------------------------------------------------
# // [INTEGRATION-HOOK: ROLE_ADMIN (DISPATCHER)]
@app.post("/api/v1/farmer/lands", status_code=status.HTTP_201_CREATED)
async def register_land_plot(
    payload: LandPlotRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    geojson_value = _geoJSON_to_string(payload.geojson_polygon or payload.polygon_boundary)

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
    
    row = result.fetchone()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal menyimpan petak lahan."
        )

    created_blocks = []
    if payload.tree_blocks:
        for tb in payload.tree_blocks:
            tb_res = await _save_tree_block_calculation(db, row.id, tb)
            created_blocks.append(tb_res)

    await db.commit()

    return {
        "id": row.id,
        "name": row.name,
        "area_sqm": float(row.total_area_sqm),
        "geojson_polygon": row.geojson_result,
        "status": "draft",
        "tree_blocks": created_blocks
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
               u.full_name as surveyor_name,
               lp.cluster_id, c.name as cluster_name, CAST(c.status AS TEXT) as cluster_status,
               (
                   SELECT COALESCE(SUM(tb2.estimated_tco2e_per_year), 0)
                   FROM land_plots lp2
                   JOIN tree_blocks tb2 ON lp2.id = tb2.land_plot_id
                   WHERE lp2.cluster_id = c.id
               ) as cluster_tonnage,
               lp.photo_urls, lp.audit_sampling
        FROM land_plots lp
        LEFT JOIN users u ON lp.surveyor_id = u.id
        LEFT JOIN clusters c ON lp.cluster_id = c.id
        WHERE lp.farmer_id = :farmer_id
        ORDER BY lp.created_at ASC
    """)
    result = await db.execute(query, {"farmer_id": current_user.id})
    land_rows = result.fetchall()
    
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
            ORDER BY tb.created_at ASC NULLS LAST, tb.id ASC
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

        if row.surveyor_name:
            srv_name = row.surveyor_name
            first_word = srv_name.split()[0].upper()[:4] if srv_name else "SRV"
            srv_code = f"SRV-{first_word}-09"
        else:
            srv_name = None
            srv_code = None

        if row.scheduled_survey_date:
            scheduled_dt = row.scheduled_survey_date
            month_names_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
            month_str = month_names_id[scheduled_dt.month - 1]
            formatted_sched_date = f"{scheduled_dt.day} {month_str} {scheduled_dt.year}"
        else:
            formatted_sched_date = None

        photos_list = []
        if row.photo_urls:
            if isinstance(row.photo_urls, list):
                photos_list = row.photo_urls
            elif isinstance(row.photo_urls, str):
                try:
                    photos_list = json.loads(row.photo_urls)
                except Exception:
                    photos_list = []

        audit_samples = []
        if row.audit_sampling:
            if isinstance(row.audit_sampling, list):
                audit_samples = row.audit_sampling
            elif isinstance(row.audit_sampling, str):
                try:
                    audit_samples = json.loads(row.audit_sampling)
                except Exception:
                    audit_samples = []

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
            "survey_logs": survey_logs,
            "cluster_id": row.cluster_id,
            "cluster_name": row.cluster_name,
            "cluster_status": row.cluster_status,
            "cluster_tonnage": float(row.cluster_tonnage) if row.cluster_tonnage is not None else 0.0,
            "photos": photos_list,
            "photo_urls": photos_list,
            "audit_sampling": audit_samples
        })
    return lands_data


# // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
@app.put("/api/v1/farmer/lands/{land_id}/revise", status_code=status.HTTP_200_OK)
@app.post("/api/v1/farmer/lands/{land_id}/revise", status_code=status.HTTP_200_OK)
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


@app.post("/api/v1/farmer/lands/{land_id}/blocks", status_code=status.HTTP_201_CREATED)
async def add_tree_block_to_land(
    land_id: uuid.UUID,
    payload: TreeBlockRequest,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Menambahkan blok tegakan pohon baru langsung ke petak lahan yang sudah ada.
    """
    check_query = text("SELECT id, farmer_id, name FROM land_plots WHERE id = :land_id")
    res = await db.execute(check_query, {"land_id": land_id})
    plot = res.fetchone()
    if not plot:
        raise HTTPException(status_code=404, detail="Petak lahan tidak ditemukan")
    if plot.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak: Anda bukan pemilik petak lahan ini")

    payload.land_plot_id = land_id
    result = await _save_tree_block_calculation(db, land_id, payload)
    await db.commit()
    return result


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
    if not payload.land_plot_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="land_plot_id wajib dicantumkan."
        )
    result = await _save_tree_block_calculation(db, payload.land_plot_id, payload)
    await db.commit()
    return result

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
            created_at=datetime.now()
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


@app.post("/api/v1/farmer/wallet/accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
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


@app.patch("/api/v1/farmer/bank-accounts/{account_id}/primary")
async def set_primary_farmer_bank_account(
    account_id: uuid.UUID,
    current_user: User = Depends(require_roles(["farmer"])),
    db: AsyncSession = Depends(get_db)
):
    acc_res = await db.execute(
        select(BankAccount).where(BankAccount.id == account_id, BankAccount.user_id == current_user.id)
    )
    acc = acc_res.scalars().first()
    if not acc:
        raise HTTPException(status_code=404, detail="Rekening bank tidak ditemukan")

    await db.execute(
        text("UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = :uid"),
        {"uid": current_user.id}
    )
    acc.is_primary = True
    await db.commit()
    await db.refresh(acc)
    return acc


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
# 4f. Profil Entitas Korporat (B2B ESG Buyer Profile)
# ------------------------------------------------------------------------------
class CorporateProfileUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    industry_type: Optional[str] = None
    idx_code: Optional[str] = None
    srn_id: Optional[str] = None
    net_zero_target: Optional[str] = None
    pic_name: Optional[str] = None
    pic_phone: Optional[str] = None
    address: Optional[str] = None
    webhook_url: Optional[str] = None

class CorporateProfileResponse(BaseModel):
    user_id: uuid.UUID
    company_name: str
    email: str
    industry_type: Optional[str] = None
    idx_code: Optional[str] = None
    srn_id: Optional[str] = None
    net_zero_target: Optional[str] = None
    pic_name: Optional[str] = None
    pic_phone: Optional[str] = None
    address: Optional[str] = None
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None

@app.get("/api/v1/corporate/profile", response_model=CorporateProfileResponse)
async def get_corporate_profile(
    current_user: User = Depends(require_roles(["company", "corporate", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        profile = CompanyProfile(
            user_id=current_user.id,
            company_name=current_user.full_name or "PT Industri Hijau Nusantara (Tbk)",
            industry_type="Manufaktur & Energi",
            api_key=f"tk_live_{uuid.uuid4().hex[:24]}"
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return CorporateProfileResponse(
        user_id=current_user.id,
        company_name=profile.company_name or current_user.full_name,
        email=current_user.email,
        industry_type=profile.industry_type or "Manufaktur & Energi",
        idx_code="IDX: IHN",
        srn_id="ID-SRN-CORP-0182",
        net_zero_target="Scope 1 & 2 (2030)",
        pic_name="Ir. Budi Santoso, M.Env.",
        pic_phone="+62 21-5290-8800",
        address="SCBD Lot 28, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan",
        api_key=profile.api_key or "tk_live_89a1f4c290be471b8219003847ac",
        webhook_url=profile.webhook_url
    )

@app.put("/api/v1/corporate/profile", response_model=CorporateProfileResponse)
@app.patch("/api/v1/corporate/profile", response_model=CorporateProfileResponse)
async def update_corporate_profile(
    payload: CorporateProfileUpdateRequest,
    current_user: User = Depends(require_roles(["company", "corporate", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        profile = CompanyProfile(
            user_id=current_user.id,
            company_name=current_user.full_name or "PT Industri Hijau Nusantara (Tbk)",
            api_key=f"tk_live_{uuid.uuid4().hex[:24]}"
        )
        db.add(profile)

    if payload.company_name and payload.company_name.strip():
        profile.company_name = payload.company_name.strip()
        current_user.full_name = payload.company_name.strip()

    if payload.industry_type is not None:
        profile.industry_type = payload.industry_type.strip()
    if payload.webhook_url is not None:
        profile.webhook_url = payload.webhook_url.strip()

    await db.commit()
    await db.refresh(profile)

    return CorporateProfileResponse(
        user_id=current_user.id,
        company_name=profile.company_name or current_user.full_name,
        email=current_user.email,
        industry_type=profile.industry_type or "Manufaktur & Energi",
        idx_code=payload.idx_code or "IDX: IHN",
        srn_id=payload.srn_id or "ID-SRN-CORP-0182",
        net_zero_target=payload.net_zero_target or "Scope 1 & 2 (2030)",
        pic_name=payload.pic_name or "Ir. Budi Santoso, M.Env.",
        pic_phone=payload.pic_phone or "+62 21-5290-8800",
        address=payload.address or "SCBD Lot 28, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan",
        api_key=profile.api_key or "tk_live_89a1f4c290be471b8219003847ac",
        webhook_url=profile.webhook_url
    )


# ------------------------------------------------------------------------------
# 4g. Bursa & Transaksi Korporat (B2B Carbon Marketplace & Escrow Wallet)
# ------------------------------------------------------------------------------

@app.get("/api/v1/corporate/clusters")
async def get_corporate_clusters(
    db: AsyncSession = Depends(get_db)
):
    """
    Katalog klaster bursa karbon yang tersedia untuk korporat.
    """
    result = await db.execute(
        select(Cluster).order_by(Cluster.status.asc(), Cluster.vintage_year.desc())
    )
    clusters = result.scalars().all()

    output = []
    for c in clusters:
        lp_query = text("""
            SELECT COUNT(DISTINCT farmer_id) as total_farmers,
                   COALESCE(SUM(total_area_sqm), 0) / 10000.0 as total_ha
            FROM land_plots
            WHERE cluster_id = :cid
        """)
        lp_res = (await db.execute(lp_query, {"cid": c.id})).fetchone()
        output.append({
            "id": str(c.id),
            "name": c.name,
            "vintage_year": c.vintage_year,
            "available_quota_tco2e": float(c.available_quota_tco2e),
            "target_quota_tco2e": float(c.target_quota_tco2e or 1000.0),
            "price_per_tco2e": float(c.price_per_tco2e),
            "status": str(c.status),
            "total_farmers": int(lp_res.total_farmers or 0) if lp_res else 0,
            "total_area_ha": round(float(lp_res.total_ha or 0.0), 2) if lp_res else 0.0,
            "srn_id": f"ID-SRN-CL-{str(c.id)[:6].upper()}",
            "certification": "SRN-PPI / Sucofindo"
        })
    return output

class CorporateTopUpRequest(BaseModel):
    amount: float
    bank_method: str = "Mandiri Corporate VA"

@app.get("/api/v1/corporate/wallet")
async def get_corporate_wallet(
    current_user: User = Depends(require_roles(["company", "corporate", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Cek saldo pre-funded deposit dan mutasi kas korporat.
    """
    wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = wallet_res.scalars().first()
    if not wallet:
        wallet = Wallet(user_id=current_user.id, available_balance=250000000.0, escrow_balance=0.0)
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)

    tx_query = text("""
        SELECT id, amount, transaction_type, description, status, created_at
        FROM wallet_transactions
        WHERE user_id = :uid
        ORDER BY created_at DESC
        LIMIT 50
    """)
    tx_res = await db.execute(tx_query, {"uid": current_user.id})
    tx_rows = tx_res.fetchall()

    transactions = [
        {
            "id": str(row.id),
            "date": row.created_at.strftime("%d %b %Y, %H:%M WIB") if row.created_at else "Hari Ini",
            "description": row.description,
            "type": "credit" if "top-up" in row.description.lower() or "deposit" in row.description.lower() else "debit",
            "amount": float(row.amount),
            "status": "Terverifikasi Bank" if row.status == "completed" else "Diproses",
            "method": "Virtual Account" if "top-up" in row.description.lower() else "Pre-funded Escrow"
        }
        for row in tx_rows
    ]

    return {
        "available_balance": float(wallet.available_balance),
        "escrow_balance": float(wallet.escrow_balance),
        "currency": "IDR",
        "transactions": transactions
    }

@app.post("/api/v1/corporate/wallet/topup")
async def topup_corporate_wallet(
    payload: CorporateTopUpRequest,
    current_user: User = Depends(require_roles(["company", "corporate", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Nominal deposit harus lebih dari 0.")

    wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = wallet_res.scalars().first()
    if not wallet:
        wallet = Wallet(user_id=current_user.id, available_balance=payload.amount, escrow_balance=0.0)
        db.add(wallet)
    else:
        wallet.available_balance = float(wallet.available_balance) + payload.amount
        wallet.updated_at = datetime.utcnow()

    tx = WalletTransaction(
        id=uuid.uuid4(),
        user_id=current_user.id,
        amount=payload.amount,
        transaction_type="credit_deposit",
        description=f"Top-Up Pre-Funded Deposit via {payload.bank_method}",
        status="completed",
        created_at=datetime.utcnow()
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)

    return {
        "success": True,
        "message": f"Berhasil menambahkan deposit sebesar Rp {payload.amount:,.0f}",
        "new_balance": float(wallet.available_balance),
        "transaction_id": str(tx.id)
    }

class CorporateCheckoutRequest(BaseModel):
    cluster_id: uuid.UUID
    quantity_tco2e: float
    target_emission_year: int = 2026
    notes: Optional[str] = None

@app.post("/api/v1/corporate/checkout")
async def corporate_checkout(
    payload: CorporateCheckoutRequest,
    current_user: User = Depends(require_roles(["company", "corporate", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    if payload.quantity_tco2e <= 0:
        raise HTTPException(status_code=400, detail="Jumlah pembelian harus lebih dari 0 tCO2e.")

    c_res = await db.execute(select(Cluster).where(Cluster.id == payload.cluster_id))
    cluster = c_res.scalars().first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Klaster karbon tidak ditemukan.")

    if float(cluster.available_quota_tco2e) < payload.quantity_tco2e:
        raise HTTPException(status_code=400, detail=f"Sisa kuota klaster tidak mencukupi (Tersedia: {cluster.available_quota_tco2e} tCO2e).")

    w_res = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = w_res.scalars().first()
    total_cost = payload.quantity_tco2e * float(cluster.price_per_tco2e)

    if not wallet or float(wallet.available_balance) < total_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Saldo deposit tidak mencukupi. Diperlukan Rp {total_cost:,.0f}, saldo Anda Rp {float(wallet.available_balance if wallet else 0):,.0f}."
        )

    cluster.available_quota_tco2e = float(cluster.available_quota_tco2e) - payload.quantity_tco2e
    if cluster.available_quota_tco2e <= 0.0001:
        cluster.status = "sold_out"

    wallet.available_balance = float(wallet.available_balance) - total_cost
    wallet.updated_at = datetime.utcnow()

    trx = Transaction(
        id=uuid.uuid4(),
        company_id=current_user.id,
        cluster_id=cluster.id,
        tco2e_purchased=payload.quantity_tco2e,
        total_price=total_cost,
        transaction_type="manual_checkout",
        target_emission_year=payload.target_emission_year
    )
    db.add(trx)

    cert = Certificate(
        uuid=uuid.uuid4(),
        transaction_id=trx.id,
        company_id=current_user.id,
        cluster_id=cluster.id,
        tco2e_retired=payload.quantity_tco2e,
        vintage_year=cluster.vintage_year
    )
    db.add(cert)

    wt = WalletTransaction(
        id=uuid.uuid4(),
        user_id=current_user.id,
        amount=total_cost,
        transaction_type="debit_purchase",
        description=f"Manual Checkout: {payload.quantity_tco2e} tCO2e {cluster.name}",
        status="completed",
        created_at=datetime.utcnow()
    )
    db.add(wt)

    await db.commit()

    return {
        "success": True,
        "message": f"Berhasil membeli dan memensiunkan {payload.quantity_tco2e} tCO2e dari {cluster.name}.",
        "certificate": {
            "uuid": str(cert.uuid),
            "serialNumber": f"SRN-ID-2026-{str(cert.uuid)[:8].upper()}",
            "clusterId": str(cluster.id),
            "clusterName": cluster.name,
            "quantity": payload.quantity_tco2e,
            "totalCost": total_cost,
            "retiredAt": datetime.utcnow().strftime("%d %b %Y, %H:%M WIB"),
            "beneficiary": current_user.full_name or "PT Industri Hijau Nusantara",
            "vintageYear": cluster.vintage_year,
            "status": "RETIRED",
            "registry": "SRN-PPI KLHK & ISO 14064-2"
        },
        "new_balance": float(wallet.available_balance)
    }

@app.get("/api/v1/corporate/certificates")
async def get_corporate_certificates(
    current_user: User = Depends(require_roles(["company", "corporate", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Daftar buku besar sertifikat pensiun milik perusahaan.
    """
    query = text("""
        SELECT cert.uuid, cert.tco2e_retired, cert.vintage_year,
               c.id as cluster_id, c.name as cluster_name, c.price_per_tco2e,
               t.total_price, t.target_emission_year,
               u.full_name as company_name
        FROM certificates cert
        JOIN clusters c ON cert.cluster_id = c.id
        LEFT JOIN transactions t ON cert.transaction_id = t.id
        JOIN users u ON cert.company_id = u.id
        WHERE cert.company_id = :uid
        ORDER BY cert.uuid DESC
    """)
    res = await db.execute(query, {"uid": current_user.id})
    rows = res.fetchall()

    certificates = [
        {
            "uuid": str(r.uuid),
            "serialNumber": f"SRN-ID-2026-{str(r.uuid)[:8].upper()}",
            "clusterId": str(r.cluster_id),
            "clusterName": r.cluster_name,
            "quantity": float(r.tco2e_retired),
            "totalCost": float(r.total_price or (float(r.tco2e_retired) * float(r.price_per_tco2e))),
            "retiredAt": datetime.utcnow().strftime("%d %b %Y"),
            "beneficiary": r.company_name or "PT Industri Hijau Nusantara",
            "vintageYear": r.vintage_year,
            "status": "RETIRED",
            "registry": "SRN-PPI KLHK & ISO 14064-2"
        }
        for r in rows
    ]
    return certificates



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

# // [INTEGRATION-HOOK: ROLE_ADMIN (DISPATCHER)]
# ------------------------------------------------------------------------------
# 5b. Endpoint Portal Authority Admin (Dispatcher & Manajemen Lahan)
# ------------------------------------------------------------------------------
@app.get("/api/v1/admin/lands")
async def get_admin_lands(
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengambil seluruh data land_plots untuk Meja Kerja Operasional Admin (Dispatcher).
    Join dengan users (petani), users (surveyor), farmer_profiles, serta relasi tree_blocks dan survey_logs.
    """
    query = text("""
        SELECT lp.id, lp.name, lp.total_area_sqm, CAST(lp.status AS TEXT) as status,
               ST_AsGeoJSON(lp.polygon_boundary) as geojson_polygon,
               lp.created_at, lp.surveyor_id, lp.scheduled_survey_date,
               lp.photo_urls, lp.audit_sampling,
               u_farmer.id as farmer_id,
               u_farmer.full_name as farmer_name,
               u_farmer.email as farmer_email,
               fp.phone_number as farmer_phone,
               u_surveyor.full_name as surveyor_name,
               u_surveyor.email as surveyor_email
        FROM land_plots lp
        JOIN users u_farmer ON lp.farmer_id = u_farmer.id
        LEFT JOIN farmer_profiles fp ON u_farmer.id = fp.user_id
        LEFT JOIN users u_surveyor ON lp.surveyor_id = u_surveyor.id
        ORDER BY lp.created_at DESC
    """)
    res = await db.execute(query)
    rows = res.fetchall()

    month_names_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

    lands = []
    for row in rows:
        tb_query = text("""
            SELECT tb.id, tb.species_name, tb.planting_year, tb.total_population,
                   tb.estimated_tco2e_per_year,
                   (
                       SELECT ROUND(AVG(ts.circumference_cm / 3.14159265)::numeric, 1)
                       FROM tree_samples ts
                       WHERE ts.tree_block_id = tb.id
                   ) as avg_dbh_cm
            FROM tree_blocks tb
            WHERE tb.land_plot_id = :plot_id
            ORDER BY tb.created_at ASC
        """)
        tb_res = await db.execute(tb_query, {"plot_id": row.id})
        tbs = tb_res.fetchall()

        tree_blocks_list = []
        total_trees = 0
        total_carbon = 0.0
        species_names = []
        for tb in tbs:
            pop = tb.total_population or 0
            total_trees += pop
            carbon = float(tb.estimated_tco2e_per_year or 0.0)
            total_carbon += carbon
            species_names.append(tb.species_name)
            tree_blocks_list.append({
                "id": str(tb.id),
                "species_name": tb.species_name,
                "planting_year": tb.planting_year,
                "total_population": pop,
                "estimated_tco2e_per_year": carbon,
                "avg_dbh_cm": float(tb.avg_dbh_cm) if tb.avg_dbh_cm is not None else None
            })

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

        raw_uuid = str(row.id).replace("-", "")
        ticket_code = f"TKT-{raw_uuid[:8].upper()}"

        created_dt = row.created_at
        created_date_str = f"{created_dt.day} {month_names_id[created_dt.month - 1]} {created_dt.year}" if created_dt else "-"

        sched_dt = row.scheduled_survey_date
        sched_date_str = f"{sched_dt.day} {month_names_id[sched_dt.month - 1]} {sched_dt.year}" if sched_dt else None

        area_sqm = float(row.total_area_sqm) if row.total_area_sqm else 0.0
        area_ha = round(area_sqm / 10000.0, 2)

        raw_photos = getattr(row, "photo_urls", None)
        if isinstance(raw_photos, str):
            try:
                photos_list = json.loads(raw_photos)
            except Exception:
                photos_list = []
        elif isinstance(raw_photos, list):
            photos_list = raw_photos
        else:
            photos_list = []

        raw_sampling = getattr(row, "audit_sampling", None)
        if isinstance(raw_sampling, str):
            try:
                audit_sampling_list = json.loads(raw_sampling)
            except Exception:
                audit_sampling_list = []
        elif isinstance(raw_sampling, list):
            audit_sampling_list = raw_sampling
        else:
            audit_sampling_list = []

        lands.append({
            "id": str(row.id),
            "ticket_code": ticket_code,
            "name": row.name,
            "status": row.status,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "created_date": created_date_str,
            "farmer_id": str(row.farmer_id),
            "farmer_name": row.farmer_name,
            "farmer_email": row.farmer_email,
            "farmer_phone": row.farmer_phone,
            "total_area_sqm": area_sqm,
            "area_sqm": area_sqm,
            "area_ha": area_ha,
            "tree_count": total_trees,
            "block_count": len(tbs),
            "species_summary": ", ".join(dict.fromkeys(species_names)) if species_names else "-",
            "estimated_carbon": round(total_carbon, 2),
            "surveyor_id": str(row.surveyor_id) if row.surveyor_id else None,
            "surveyor_name": row.surveyor_name,
            "surveyor_email": row.surveyor_email,
            "scheduled_survey_date": row.scheduled_survey_date.isoformat() if row.scheduled_survey_date else None,
            "scheduled_date": sched_date_str,
            "tree_blocks": tree_blocks_list,
            "survey_logs": survey_logs_list,
            "photos": photos_list,
            "photo_urls": photos_list,
            "audit_sampling": audit_sampling_list,
            "geojson": row.geojson_polygon
        })

    return lands


@app.get("/api/v1/admin/surveyors")
async def get_admin_surveyors(
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint ringan untuk dropdown modal penugasan surveyor dan monitor beban kerja.
    Mengambil seluruh user yang memiliki role == 'surveyor'.
    """
    query = text("""
        SELECT u.id, u.full_name, u.email,
               (
                   SELECT COUNT(*)
                   FROM land_plots lp
                   WHERE lp.surveyor_id = u.id AND CAST(lp.status AS TEXT) IN ('pending_survey', 'draft', 'submitted')
               ) as active_tasks
        FROM users u
        WHERE u.role = 'surveyor' AND u.is_active = true
        ORDER BY u.full_name ASC
    """)
    res = await db.execute(query)
    rows = res.fetchall()
    return [
        {
            "id": str(r.id),
            "full_name": r.full_name,
            "name": r.full_name,
            "email": r.email,
            "active_tasks": int(r.active_tasks or 0)
        }
        for r in rows
    ]


# // [INTEGRATION-HOOK: ROLE_ADMIN (DISPATCHER)]
@app.patch("/api/v1/admin/lands/{land_id}/schedule", status_code=status.HTTP_200_OK)
async def admin_schedule_land_survey(
    land_id: uuid.UUID,
    payload: AdminScheduleSurveyRequest,
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    // [INTEGRATION-HOOK: ROLE_ADMIN (DISPATCHER)]
    Endpoint Manajemen Admin (Jantung Dispatcher):
    Mengatur alokasi surveyor dan waktu tanggal rencana inspeksi fisik untuk petak lahan tertentu.
    Jika status lahan saat ini 'draft' atau 'submitted', ubah status menjadi 'pending_survey'.
    Seluruh proses dijalankan dalam satu transaksi DB dan instruksi admin dicatat ke survey_logs.
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

    # Parse tanggal dan waktu inspeksi
    raw_date = payload.scheduled_survey_date
    if isinstance(raw_date, str):
        try:
            parsed_date = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
        except Exception:
            parsed_date = datetime.strptime(raw_date[:10], "%Y-%m-%d")
    elif isinstance(raw_date, date) and not isinstance(raw_date, datetime):
        parsed_date = datetime.combine(raw_date, datetime.min.time().replace(hour=8, minute=0))
    else:
        parsed_date = raw_date

    # State Transition: Jika status 'draft' atau 'submitted', ubah menjadi 'pending_survey'
    current_status = str(plot.status).lower() if plot.status else "draft"
    new_status = current_status
    if current_status in ["draft", "submitted"]:
        new_status = "pending_survey"

    update_query = text("""
        UPDATE land_plots
        SET surveyor_id = :surveyor_id,
            scheduled_survey_date = :scheduled_date,
            status = CAST(:status AS land_status)
        WHERE id = :land_id
    """)
    await db.execute(update_query, {
        "land_id": land_id,
        "surveyor_id": payload.surveyor_id,
        "scheduled_date": parsed_date,
        "status": new_status
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
    dt = parsed_date
    formatted_date = f"{dt.day} {month_names_id[dt.month - 1]} {dt.year}"

    return {
        "status": "success",
        "message": f"Jadwal inspeksi untuk petak '{plot.name}' berhasil ditentukan oleh Admin.",
        "land_id": str(land_id),
        "surveyor_id": str(payload.surveyor_id) if payload.surveyor_id else None,
        "surveyor_name": surveyor_name,
        "scheduled_survey_date": parsed_date.isoformat(),
        "scheduled_date": formatted_date
    }


# ------------------------------------------------------------------------------
# 5b. Modul API Manajemen Admin Authority (Full Ecosystem Monitoring & Control)
# ------------------------------------------------------------------------------

@app.get("/api/v1/admin/stats")
async def get_admin_ecosystem_stats(
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Ringkasan metrik ekosistem untuk Command Center Admin.
    """
    farmers_count = (await db.execute(select(func.count(User.id)).where(User.role == "farmer"))).scalar() or 0
    surveyors_count = (await db.execute(select(func.count(User.id)).where(User.role == "surveyor"))).scalar() or 0
    corporates_count = (await db.execute(select(func.count(User.id)).where(User.role.in_(["corporate", "company"])))).scalar() or 0

    tree_res = (await db.execute(select(func.coalesce(func.sum(TreeBlock.estimated_tco2e_per_year), 0.0)))).scalar() or 0.0
    quota_res = (await db.execute(select(func.coalesce(func.sum(Cluster.available_quota_tco2e), 0.0)))).scalar() or 0.0
    gmv_res = (await db.execute(select(func.coalesce(func.sum(Transaction.total_price), 0.0)))).scalar() or 0.0

    pending_survey_lands = (await db.execute(
        text("SELECT COUNT(*) FROM land_plots WHERE status IN ('pending', 'pending_survey')")
    )).scalar() or 0

    pending_payouts = (await db.execute(
        text("SELECT COUNT(*) FROM wallet_transactions WHERE transaction_type = 'debit_withdraw' AND status IN ('processing', 'pending')")
    )).scalar() or 0

    clusters_count = (await db.execute(select(func.count(Cluster.id)))).scalar() or 0

    return {
        "pipeline_tco2e": round(float(tree_res), 2),
        "available_quota_tco2e": round(float(quota_res), 2),
        "gmv_idr": float(gmv_res),
        "total_farmers": farmers_count,
        "total_surveyors": surveyors_count,
        "total_corporates": corporates_count,
        "active_clusters": clusters_count,
        "pending_inspections": pending_survey_lands,
        "pending_payouts": pending_payouts
    }

@app.get("/api/v1/admin/clusters")
async def get_admin_clusters(
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Cluster).order_by(Cluster.vintage_year.desc()))
    clusters = result.scalars().all()

    items = []
    for c in clusters:
        lp_query = text("""
            SELECT COUNT(id) as plot_count,
                   COUNT(DISTINCT farmer_id) as farmer_count,
                   COALESCE(SUM(total_area_sqm), 0) / 10000.0 as total_ha
            FROM land_plots WHERE cluster_id = :cid
        """)
        lp_res = (await db.execute(lp_query, {"cid": c.id})).fetchone()

        items.append({
            "id": str(c.id),
            "name": c.name,
            "vintage_year": c.vintage_year,
            "available_quota_tco2e": float(c.available_quota_tco2e),
            "target_quota_tco2e": float(c.target_quota_tco2e or 1000.0),
            "price_per_tco2e": float(c.price_per_tco2e),
            "status": str(c.status),
            "total_plots": int(lp_res.plot_count or 0) if lp_res else 0,
            "total_farmers": int(lp_res.farmer_count or 0) if lp_res else 0,
            "total_area_ha": round(float(lp_res.total_ha or 0.0), 2) if lp_res else 0.0
        })
    return items

class AdminCreateClusterRequest(BaseModel):
    name: str
    vintage_year: int = 2026
    target_quota_tco2e: float = 1000.0
    price_per_tco2e: float = 85000.0
    status: str = "gathering"

@app.post("/api/v1/admin/clusters")
async def create_admin_cluster(
    payload: AdminCreateClusterRequest,
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    new_c = Cluster(
        id=uuid.uuid4(),
        name=payload.name,
        vintage_year=payload.vintage_year,
        available_quota_tco2e=0.0,
        target_quota_tco2e=payload.target_quota_tco2e,
        price_per_tco2e=payload.price_per_tco2e,
        status=payload.status
    )
    db.add(new_c)
    await db.commit()
    await db.refresh(new_c)
    return {"success": True, "cluster_id": str(new_c.id), "message": f"Klaster '{new_c.name}' berhasil dibuat."}

class AdminMintClusterRequest(BaseModel):
    auditor_organization: str = "PT Sucofindo (Persero)"
    audit_report_no: str = "BAP-SUCOFINDO-2026-091"
    approved_quota_tco2e: float
    cost_recovery_idr: float = 25000000.0

# // [INTEGRATION-HOOK: ROLE_ADMIN (CLUSTERING & EXTERNAL AUDIT)]
@app.patch("/api/v1/admin/clusters/{cluster_id}/approve-audit")
@app.post("/api/v1/admin/clusters/{cluster_id}/approve-audit")
@app.post("/api/v1/admin/clusters/{cluster_id}/mint")
async def admin_mint_cluster_quota(
    cluster_id: uuid.UUID,
    payload: Optional[AdminMintClusterRequest] = None,
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    c_res = await db.execute(select(Cluster).where(Cluster.id == cluster_id))
    cluster = c_res.scalars().first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Klaster tidak ditemukan.")

    auditor_org = payload.auditor_organization if payload and payload.auditor_organization else "PT Sucofindo (Persero)"
    approved_quota = payload.approved_quota_tco2e if payload and payload.approved_quota_tco2e else float(cluster.target_quota_tco2e or 1000.0)

    cluster.available_quota_tco2e = approved_quota
    cluster.status = "available_for_sale"

    await db.execute(text("""
        UPDATE land_plots
        SET status = 'verified'
        WHERE cluster_id = :cid AND status IN ('pending', 'pending_survey')
    """), {"cid": cluster.id})

    await db.commit()
    return {
        "success": True,
        "message": f"Audit {auditor_org} disahkan! Kuota {approved_quota} tCO2e berhasil diminting ke Bursa Karbon.",
        "cluster_id": str(cluster.id),
        "status": cluster.status,
        "available_quota": float(cluster.available_quota_tco2e)
    }

@app.get("/api/v1/admin/payouts")
async def get_admin_payout_queue(
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Daftar antrean pencairan dana petani untuk diverifikasi admin.
    """
    query = text("""
        SELECT wt.id, wt.user_id, wt.amount, wt.description, wt.status, wt.created_at,
               u.full_name as farmer_name, u.email as farmer_email,
               fp.phone_number, fp.village, fp.regency,
               ba.bank_name, ba.account_number, ba.account_holder_name
        FROM wallet_transactions wt
        JOIN users u ON wt.user_id = u.id
        LEFT JOIN farmer_profiles fp ON u.id = fp.user_id
        LEFT JOIN bank_accounts ba ON u.id = ba.user_id AND ba.is_primary = TRUE
        WHERE wt.transaction_type = 'debit_withdraw'
        ORDER BY wt.created_at DESC
    """)
    res = await db.execute(query)
    rows = res.fetchall()

    payouts = [
        {
            "id": str(r.id),
            "farmer_id": str(r.user_id),
            "farmer_name": r.farmer_name,
            "farmer_phone": r.phone_number or "-",
            "location": f"{r.village or '-'}, {r.regency or '-'}",
            "amount": float(r.amount),
            "bank_name": r.bank_name or "BRI",
            "account_number": r.account_number or "-",
            "account_holder": r.account_holder_name or r.farmer_name,
            "status": r.status,
            "created_at": r.created_at.strftime("%d %b %Y, %H:%M WIB") if r.created_at else "-"
        }
        for r in rows
    ]
    return payouts

class AdminApprovePayoutRequest(BaseModel):
    bank_reference_no: str
    admin_notes: Optional[str] = None

# // [INTEGRATION-HOOK: ROLE_ADMIN (FINANCE & ESCROW PAYOUT) & ROLE_CORPORATE (CARBON BUYER)]
@app.patch("/api/v1/admin/withdrawals/{payout_id}")
@app.post("/api/v1/admin/withdrawals/{payout_id}/approve")
@app.post("/api/v1/admin/payouts/{payout_id}/approve")
async def approve_payout(
    payout_id: uuid.UUID,
    payload: Optional[AdminApprovePayoutRequest] = None,
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    wt_res = await db.execute(select(WalletTransaction).where(WalletTransaction.id == payout_id))
    wt = wt_res.scalars().first()
    if not wt:
        raise HTTPException(status_code=404, detail="Tiket penarikan tidak ditemukan.")

    ref_no = payload.bank_reference_no if payload and payload.bank_reference_no else f"REF-ADM-{uuid.uuid4().hex[:6].upper()}"
    wt.status = "completed"
    wt.description = f"{wt.description} [Disetujui Admin - Ref: {ref_no}]"
    await db.commit()
    return {"success": True, "message": f"Pencairan dana sebesar Rp {float(wt.amount):,.0f} telah disetujui & dibukukan."}

class AdminRejectPayoutRequest(BaseModel):
    rejection_reason: str

@app.post("/api/v1/admin/payouts/{payout_id}/reject")
async def reject_payout(
    payout_id: uuid.UUID,
    payload: AdminRejectPayoutRequest,
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    wt_res = await db.execute(select(WalletTransaction).where(WalletTransaction.id == payout_id))
    wt = wt_res.scalars().first()
    if not wt:
        raise HTTPException(status_code=404, detail="Tiket penarikan tidak ditemukan.")

    wt.status = "rejected"
    wt.description = f"{wt.description} [Ditolak: {payload.rejection_reason}]"

    w_res = await db.execute(select(Wallet).where(Wallet.user_id == wt.user_id))
    wallet = w_res.scalars().first()
    if wallet:
        wallet.available_balance = float(wallet.available_balance) + float(wt.amount)
        wallet.updated_at = datetime.utcnow()

    await db.commit()
    return {"success": True, "message": f"Penarikan dana ditolak. Saldo Rp {float(wt.amount):,.0f} telah dikembalikan ke dompet petani."}

@app.get("/api/v1/admin/species")
async def get_admin_species(
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(TreeSpecies).order_by(TreeSpecies.local_name.asc()))
    species = res.scalars().all()
    return [
        {
            "id": str(s.id),
            "local_name": s.local_name,
            "latin_name": s.latin_name,
            "category": s.category,
            "wood_density": float(s.wood_density),
            "formula_type": s.formula_type,
            "coeff_a": float(s.coeff_a) if s.coeff_a is not None else None,
            "exp_b": float(s.exp_b) if s.exp_b is not None else None,
            "requires_height": s.requires_height,
            "formula_display": s.formula_display,
            "reference_source": s.reference_source
        }
        for s in species
    ]

@app.get("/api/v1/admin/users")
async def get_admin_users(
    current_user: User = Depends(require_roles(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).order_by(User.created_at.desc()))
    users = res.scalars().all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.strftime("%d %b %Y") if u.created_at else "-"
        }
        for u in users
    ]


@app.get("/api/v1/surveyor/tasks")
async def get_surveyor_tasks(
    current_user: User = Depends(require_roles(["surveyor", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengambil seluruh land_plots di database PostgreSQL di mana
    surveyor_id == current_user.id.
    Sertakan data lengkap: id, name, farmer_name, area_sqm, area_ha, status,
    scheduled_survey_date, polygon_boundary, centroid, tree_blocks, dan survey_logs.
    """
    query = text("""
        SELECT lp.id, lp.name, lp.total_area_sqm, CAST(lp.status AS TEXT) as status,
               ST_AsGeoJSON(lp.polygon_boundary) as geojson_polygon,
               ST_Y(lp.centroid) as lat,
               ST_X(lp.centroid) as lng,
               lp.created_at, lp.surveyor_id, lp.scheduled_survey_date,
               lp.photo_urls,
               u_farmer.id as farmer_id,
               u_farmer.full_name as farmer_name,
               u_farmer.email as farmer_email,
               fp.phone_number as farmer_phone,
               u_surveyor.full_name as surveyor_name
        FROM land_plots lp
        JOIN users u_farmer ON lp.farmer_id = u_farmer.id
        LEFT JOIN farmer_profiles fp ON u_farmer.id = fp.user_id
        LEFT JOIN users u_surveyor ON lp.surveyor_id = u_surveyor.id
        WHERE lp.surveyor_id = :surveyor_id
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
            ORDER BY tb.created_at ASC NULLS LAST, tb.id ASC
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

        photos_list = []
        if getattr(row, "photo_urls", None):
            if isinstance(row.photo_urls, list):
                photos_list = row.photo_urls
            elif isinstance(row.photo_urls, str):
                try:
                    photos_list = json.loads(row.photo_urls)
                except Exception:
                    photos_list = []

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
            "geojson_polygon": row.geojson_polygon,
            "photos": photos_list,
            "photo_urls": photos_list
        })

    return tasks


# // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
@app.get("/api/v1/surveyor/history")
async def get_surveyor_history(
    current_user: User = Depends(require_roles(["surveyor", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
    Mengambil riwayat petak lahan yang telah selesai diaudit (status: 'verified', 'rejected', 'revision')
    oleh surveyor ini atau yang ditugaskan ke surveyor ini.
    """
    query = text("""
        SELECT lp.id, lp.name, lp.total_area_sqm, CAST(lp.status AS TEXT) as status,
               ST_AsGeoJSON(lp.polygon_boundary) as geojson_polygon,
               ST_Y(lp.centroid) as lat,
               ST_X(lp.centroid) as lng,
               lp.created_at, lp.updated_at, lp.surveyor_id, lp.scheduled_survey_date,
               lp.photo_urls,
               u_farmer.id as farmer_id,
               u_farmer.full_name as farmer_name,
               u_farmer.email as farmer_email,
               fp.phone_number as farmer_phone,
               u_surveyor.full_name as surveyor_name
        FROM land_plots lp
        JOIN users u_farmer ON lp.farmer_id = u_farmer.id
        LEFT JOIN farmer_profiles fp ON u_farmer.id = fp.user_id
        LEFT JOIN users u_surveyor ON lp.surveyor_id = u_surveyor.id
        WHERE (lp.surveyor_id = :surveyor_id OR EXISTS (
            SELECT 1 FROM survey_logs sl WHERE sl.land_plot_id = lp.id AND sl.surveyor_id = :surveyor_id
        ))
        AND CAST(lp.status AS TEXT) IN ('verified', 'rejected', 'revision')
        ORDER BY lp.updated_at DESC, lp.created_at DESC
    """)
    res = await db.execute(query, {"surveyor_id": current_user.id})
    rows = res.fetchall()

    history = []
    for row in rows:
        tb_query = text("""
            SELECT tb.id, tb.species_name, tb.planting_year, tb.total_population,
                   tb.estimated_tco2e_per_year
            FROM tree_blocks tb
            WHERE tb.land_plot_id = :plot_id
            ORDER BY tb.created_at ASC NULLS LAST, tb.id ASC
        """)
        tb_res = await db.execute(tb_query, {"plot_id": row.id})
        tbs = tb_res.fetchall()
        tree_blocks = []
        total_carbon = 0.0
        total_trees = 0
        for tb in tbs:
            total_carbon += float(tb.estimated_tco2e_per_year or 0.0)
            total_trees += int(tb.total_population or 0)
            tree_blocks.append({
                "id": str(tb.id),
                "species_name": tb.species_name,
                "planting_year": tb.planting_year,
                "total_population": tb.total_population,
                "estimated_tco2e_per_year": float(tb.estimated_tco2e_per_year or 0.0)
            })

        sl_query = text("""
            SELECT sl.id, sl.notes, sl.created_at, u.full_name as surveyor_name
            FROM survey_logs sl
            LEFT JOIN users u ON sl.surveyor_id = u.id
            WHERE sl.land_plot_id = :plot_id
            ORDER BY sl.created_at DESC
        """)
        sl_res = await db.execute(sl_query, {"plot_id": row.id})
        sl_rows = sl_res.fetchall()
        survey_logs = [
            {
                "id": str(sl.id),
                "notes": sl.notes,
                "created_at": sl.created_at.isoformat() if sl.created_at else None,
                "surveyor_name": sl.surveyor_name
            }
            for sl in sl_rows
        ]
        latest_log = sl_rows[0] if sl_rows else None

        photos_list = []
        if row.photo_urls:
            if isinstance(row.photo_urls, list):
                photos_list = row.photo_urls
            elif isinstance(row.photo_urls, str):
                try:
                    photos_list = json.loads(row.photo_urls)
                except Exception:
                    photos_list = []

        raw_uuid = str(row.id).replace("-", "")
        ticket_id = f"TKT-{raw_uuid[:4].upper()}"
        is_verified = (row.status == "verified")
        is_revision = (row.status == "revision")

        if is_verified:
            decision_text = "Disahkan (Pre-Verified)"
            cluster_status = "Selesai Lapangan"
        elif is_revision:
            decision_text = "Perlu Revisi"
            cluster_status = "Menunggu Revisi Petani"
        else:
            decision_text = "Ditolak"
            cluster_status = "Audit Ditolak"

        lat = float(row.lat) if row.lat is not None else -6.3686
        lng = float(row.lng) if row.lng is not None else 106.8331
        area_sqm = float(row.total_area_sqm or 0.0)

        check_in_time_str = "Tercatat di Ledger"
        if latest_log and latest_log.created_at:
            month_names_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
            c_dt = latest_log.created_at
            check_in_time_str = f"{c_dt.day} {month_names_id[c_dt.month - 1]} {c_dt.year}, {c_dt.strftime('%H:%M')} WIB"

        history.append({
            "id": str(row.id),
            "land_id": str(row.id),
            "ticketId": ticket_id,
            "ticket_code": ticket_id,
            "farmerName": row.farmer_name or "Petani Mitra",
            "farmer_name": row.farmer_name or "Petani Mitra",
            "farmerPhone": row.farmer_phone or "0812-3456-7890",
            "farmer_phone": row.farmer_phone or "0812-3456-7890",
            "farmer_email": row.farmer_email,
            "landName": row.name,
            "name": row.name,
            "areaSqm": area_sqm,
            "area_sqm": area_sqm,
            "area_ha": round(area_sqm / 10000, 2),
            "treeBlocks": tree_blocks,
            "tree_blocks": tree_blocks,
            "treeCount": total_trees,
            "tree_count": total_trees,
            "status": row.status,
            "decision": decision_text,
            "isVerified": is_verified,
            "is_verified": is_verified,
            "validatedCarbon": f"{total_carbon:.1f} tCO2e/thn" if is_verified else "0 tCO2e",
            "validated_carbon": total_carbon,
            "checkInTime": check_in_time_str,
            "gpsCoord": f"{lat:.4f}, {lng:.4f}",
            "lat": lat,
            "lng": lng,
            "clusterStatus": cluster_status,
            "surveyLogs": survey_logs,
            "survey_logs": survey_logs,
            "notes": latest_log.notes if latest_log else (
                "Telah memenuhi standar alometrik & geofencing lapangan." if is_verified else "Audit selesai."
            ),
            "photos": photos_list,
            "photo_urls": photos_list
        })

    return history


# // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
@app.post("/api/v1/surveyor/lands/{land_id}/audit")
@app.patch("/api/v1/surveyor/lands/{land_id}/audit")
async def audit_land_plot(
    land_id: uuid.UUID,
    payload: SurveyorAuditRequest,
    current_user: User = Depends(require_roles(["surveyor", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
    Mencatat keputusan audit lapangan dari surveyor:
    - approved: Ubah status menjadi 'verified', catat berita acara.
    - revision: Kembalikan status menjadi 'revision' / 'draft', catat kategori & catatan revisi di survey_logs.
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
        new_status = "revision"
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


# ==============================================================================
# // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
# ENDPOINT DOKUMENTASI FOTO SURVEI LAPANGAN (SURVEYOR & ADMIN)
# ==============================================================================

@app.post("/api/v1/surveyor/lands/{land_id}/photos")
async def upload_surveyor_photo(
    land_id: uuid.UUID,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    coord: Optional[str] = Form(None),
    timestamp: Optional[str] = Form(None),
    current_user: User = Depends(require_roles(["surveyor", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
    Mengunggah berkas foto dokumentasi lapangan (patok batas, kanopi pohon, dll) oleh surveyor.
    Menyimpan file ke direktori backend/uploads/survey_photos/ dan menyimpan metadata di land_plots.photo_urls.
    """
    check_query = text("SELECT id, name, photo_urls FROM land_plots WHERE id = :land_id")
    res = await db.execute(check_query, {"land_id": land_id})
    plot = res.fetchone()
    if not plot:
        raise HTTPException(status_code=404, detail="Petak lahan tidak ditemukan")

    os.makedirs(SURVEY_PHOTOS_DIR, exist_ok=True)
    orig_filename = file.filename or "survey_photo.jpg"
    ext = os.path.splitext(orig_filename)[1].lower()
    if not ext or ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        ext = ".jpg"

    photo_id = f"photo-{uuid.uuid4().hex[:10]}"
    safe_filename = f"{land_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(SURVEY_PHOTOS_DIR, safe_filename)

    try:
        content = await file.read()
        with open(dest_path, "wb") as f:
            f.write(content)
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan file foto ke server: {str(err)}")

    file_size_bytes = len(content)
    if file_size_bytes >= 1024 * 1024:
        size_str = f"{(file_size_bytes / (1024 * 1024)):.1f} MB"
    else:
        size_str = f"{max(1, round(file_size_bytes / 1024))} KB"

    relative_url = f"/uploads/survey_photos/{safe_filename}"

    existing_photos = plot.photo_urls
    if isinstance(existing_photos, str):
        try:
            existing_photos = json.loads(existing_photos)
        except Exception:
            existing_photos = []
    elif not isinstance(existing_photos, list):
        existing_photos = []

    default_title = "Foto Patok Batas" if len(existing_photos) == 0 else "Foto Kanopi Tegakan"
    now_dt = datetime.utcnow()
    time_str = now_dt.strftime("%H:%M")

    new_photo_entry = {
        "id": photo_id,
        "url": relative_url,
        "filename": safe_filename,
        "name": orig_filename,
        "size": size_str,
        "title": title or default_title,
        "coord": coord or "-6.3686, 106.8331",
        "timestamp": timestamp or f"Hari ini · {time_str} WIB",
        "created_at": now_dt.isoformat(),
        "uploaded_by": current_user.full_name
    }

    updated_photos = [new_photo_entry] + existing_photos

    await db.execute(
        text("UPDATE land_plots SET photo_urls = CAST(:photos AS JSONB) WHERE id = :land_id"),
        {"photos": json.dumps(updated_photos), "land_id": land_id}
    )
    await db.commit()

    return {
        "status": "success",
        "message": f"Foto '{orig_filename}' berhasil diunggah.",
        "photo": new_photo_entry,
        "photo_url": relative_url,
        "url": relative_url,
        "photos": updated_photos
    }


@app.get("/api/v1/surveyor/lands/{land_id}/photos")
@app.get("/api/v1/admin/lands/{land_id}/photos")
async def get_land_photos(
    land_id: uuid.UUID,
    current_user: User = Depends(require_roles(["surveyor", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
    Mengambil seluruh daftar foto dokumentasi lapangan untuk petak lahan tertentu.
    """
    check_query = text("SELECT id, name, photo_urls FROM land_plots WHERE id = :land_id")
    res = await db.execute(check_query, {"land_id": land_id})
    plot = res.fetchone()
    if not plot:
        raise HTTPException(status_code=404, detail="Petak lahan tidak ditemukan")

    photos = plot.photo_urls
    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except Exception:
            photos = []
    elif not isinstance(photos, list):
        photos = []

    return photos


@app.delete("/api/v1/surveyor/lands/{land_id}/photos/{photo_id}")
@app.delete("/api/v1/admin/lands/{land_id}/photos/{photo_id}")
async def delete_land_photo(
    land_id: uuid.UUID,
    photo_id: str,
    current_user: User = Depends(require_roles(["surveyor", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
    Menghapus foto survei dari database dan disk file lokal.
    """
    check_query = text("SELECT id, photo_urls FROM land_plots WHERE id = :land_id")
    res = await db.execute(check_query, {"land_id": land_id})
    plot = res.fetchone()
    if not plot:
        raise HTTPException(status_code=404, detail="Petak lahan tidak ditemukan")

    photos = plot.photo_urls
    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except Exception:
            photos = []
    elif not isinstance(photos, list):
        photos = []

    target_photo = next((p for p in photos if p.get("id") == photo_id or p.get("filename") == photo_id), None)
    if not target_photo:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")

    if target_photo.get("filename"):
        file_path = os.path.join(SURVEY_PHOTOS_DIR, target_photo["filename"])
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

    updated_photos = [p for p in photos if p.get("id") != target_photo.get("id")]
    await db.execute(
        text("UPDATE land_plots SET photo_urls = CAST(:photos AS JSONB) WHERE id = :land_id"),
        {"photos": json.dumps(updated_photos), "land_id": land_id}
    )
    await db.commit()

    return {"status": "success", "message": "Foto berhasil dihapus", "photos": updated_photos}



@app.get("/api/v1/farmer/dashboard", response_model=FarmerDashboardSummary)
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
            "timestamp": row.created_at or datetime.utcnow()
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
