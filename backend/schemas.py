from __future__ import annotations
from pydantic import BaseModel, Field, EmailStr
from typing import Any, Dict, Optional, List, Union
from uuid import UUID
from datetime import datetime

# Skema JSON yang masuk dari ERP Pabrik
class AutoBuyRequest(BaseModel):
    emission_period_year: int = Field(..., example=2026, description="Tahun buku peruntukan emisi")
    reporting_month: str = Field(..., example="2026-10", description="Bulan pelaporan sensor/ERP")
    emission_amount_tco2e: float = Field(..., gt=0, example=12.5, description="Jumlah emisi yang masuk (tCO2e)")
    source_system: str = Field(..., example="SAP_ERP_PABRIK_01", description="Nama sistem pengirim webhook")

# Skema JSON yang dikembalikan sistem TaniKarbon
class AutoBuyResponse(BaseModel):
    status: str
    message: str
    certificate_uuid: UUID
    tco2e_retired: float
    total_cost: float
    cluster_name: str

class LandPlotRequest(BaseModel):
    name: str = Field(..., example="Kebun Mangga Baru", description="Nama lahan")
    geojson_polygon: str = Field(..., example='{"type":"Polygon","coordinates":[[[106.835,-6.368],[106.836,-6.368],[106.836,-6.369],[106.835,-6.369],[106.835,-6.368]]]}', description="Koordinat poligon GeoJSON")
    document_no: Optional[str] = Field(None, description="Nomor dokumen kepemilikan opsional")
    ownership: Optional[str] = Field(None, description="Status kepemilikan")
    village: Optional[str] = Field(None, description="Desa / Kelurahan")
    regency: Optional[str] = Field(None, description="Kabupaten / Kota")
    status: Optional[str] = Field("draft", description="Status plot")

class PolygonValidationRequest(BaseModel):
    polygon_boundary: Union[Dict[str, Any], str] = Field(
        ...,
        description="GeoJSON Polygon/MultiPolygon yang akan divalidasi sebelum dikunci"
    )

class SpatialConflictItem(BaseModel):
    id: UUID
    name: str
    is_own_land: bool
    status: str

class PolygonValidationResponse(BaseModel):
    valid: bool
    area_sqm: float = 0.0
    message: str
    conflicting_plot: Optional[SpatialConflictItem] = None

class SpatialOverlayItem(BaseModel):
    id: UUID
    name: str
    is_own_land: bool
    status: str
    polygon_boundary: Dict[str, Any]

class TreeSampleInput(BaseModel):
    circumference_cm: float = Field(..., gt=0, example=45.5, description="Keliling batang (cm)")

class TreeBlockRequest(BaseModel):
    land_plot_id: UUID
    species_name: str = Field(..., example="Sengon Laut")
    planting_year: int = Field(..., example=2021)
    total_population: int = Field(..., gt=0, example=100)
    samples: List[TreeSampleInput] = Field(..., min_length=3, description="Minimal 3 sampel pohon")
    height_m: Optional[float] = Field(None, example=14.5, description="Tinggi rata-rata pohon (m) opsional")

class WithdrawRequest(BaseModel):
    amount: float = Field(..., gt=0, example=500000, description="Jumlah saldo yang ditarik (Rupiah)")
    bank_code: Optional[str] = Field(None, example="BRI", description="Kode bank (BRI, BCA, MANDIRI, DANA, GOPAY, SHOPEEPAY)")
    bank_name: Optional[str] = Field(None, example="Bank BRI", description="Nama bank alternatif")
    account_number: str = Field(..., example="0142-01-084821-50-8", description="Nomor rekening atau nomor HP e-wallet")

class DistributeRevenueRequest(BaseModel):
    transaction_id: UUID = Field(..., description="ID Transaksi dari pembelian korporat")

class WalletInfoResponse(BaseModel):
    available_balance: float
    escrow_balance: float
    recent_transactions: List[WalletTransactionResponse] = Field(default_factory=list)

class SpeciesSummary(BaseModel):
    species_name: str
    total_trees: int
    total_carbon_tco2e: float

class UpcomingInspectionItem(BaseModel):
    land_plot_id: Optional[UUID] = None
    land_plot_name: str
    surveyor_id: Optional[UUID] = None
    surveyor_name: Optional[str] = None
    surveyor_code: Optional[str] = None
    scheduled_survey_date: Optional[datetime] = None
    scheduled_date: Optional[str] = None
    status_note: str = "Inspeksi Poligon GPS & Sampel DBH"

class RecentWalletActivityItem(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    amount: float
    transaction_type: str  # 'credit_payout' | 'debit_withdraw'
    status: str  # 'completed' | 'processing'
    timestamp: datetime

class ClusterInfo(BaseModel):
    cluster_id: UUID
    cluster_name: str
    cluster_status: Optional[str] = "gathering"
    target_tco2e: float
    current_carbon_tco2e: float
    percentage: Optional[float] = 0.0

class FarmerDashboardSummary(BaseModel):
    farmer_name: str
    farmer_email: str
    total_land_plots: int
    total_land_area_sqm: float
    total_all_trees: int
    total_all_carbon_tco2e: float
    available_balance: float
    escrow_balance: float
    species_breakdown: List[SpeciesSummary]
    upcoming_inspections: List[UpcomingInspectionItem] = []
    recent_wallet_activities: List[RecentWalletActivityItem] = []
    cluster_info: Optional[ClusterInfo] = None

class WalletTransactionResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: float
    transaction_type: str
    description: str
    status: str
    created_at: datetime


class SurveyLogItem(BaseModel):
    id: UUID
    notes: str
    created_at: Optional[datetime] = None
    surveyor_name: Optional[str] = None

class LandRevisionRequest(BaseModel):
    category: str = Field(..., example="Revisi Titik Poligon Batas")
    notes: Optional[str] = Field(None, example="Patok sisi utara bergeser...")
    reason: Optional[str] = Field(None, example="Patok sisi utara bergeser...")
    land_plot_id: Optional[UUID] = None

    @property
    def detail_notes(self) -> str:
        return (self.notes or self.reason or "").strip()

class TreeBlockDetail(BaseModel):
    id: UUID
    species_name: str
    planting_year: int
    total_population: int
    estimated_tco2e_per_year: float
    avg_dbh_cm: Optional[float] = None
    formula_display: Optional[str] = None

class LandPlotDetail(BaseModel):
    id: UUID
    name: str
    area_sqm: float
    status: str
    geojson_polygon: Optional[str] = None
    tree_blocks: List[TreeBlockDetail] = []
    created_at: Optional[datetime] = None
    surveyor_id: Optional[UUID] = None
    surveyor_name: Optional[str] = None
    surveyor_code: Optional[str] = None
    scheduled_survey_date: Optional[datetime] = None
    scheduled_date: Optional[str] = None
    survey_logs: Optional[List[SurveyLogItem]] = []

class AdminScheduleSurveyRequest(BaseModel):
    surveyor_id: Optional[UUID] = Field(None, description="ID User surveyor yang ditugaskan")
    scheduled_survey_date: datetime = Field(..., description="Waktu dan tanggal rencana inspeksi fisik oleh surveyor")
    notes: Optional[str] = Field(None, description="Catatan instruksi khusus penugasan audit dari Admin")

class WalletResponse(BaseModel):
    user_id: UUID
    available_balance: float
    escrow_balance: float

# Skema Autentikasi & JWT
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    email: str
    full_name: str
    role: str

class UserLoginRequest(BaseModel):
    email: Optional[str] = Field(None, example="petani@tanikarbon.com", description="Email atau nomor WhatsApp")
    identifier: Optional[str] = Field(None, example="0812-9847-1920", description="Identifier fleksibel dari UI")
    adminId: Optional[str] = Field(None, example="ADM-ROOT-01", description="Identifier portal admin")
    surveyorId: Optional[str] = Field(None, example="SRV-BUDI-09", description="Identifier portal surveyor")
    password: Optional[str] = Field(None, example="Password123!", description="Kata sandi")
    pin: Optional[str] = Field(None, example="847291", description="PIN surveyor")
    role: Optional[str] = Field(None, example="farmer", description="Role opsional untuk validasi preferensi UI")

    @property
    def login_identifier(self) -> str:
        return (self.email or self.identifier or self.adminId or self.surveyorId or "").strip()

    @property
    def login_password(self) -> str:
        return (self.password or self.pin or "").strip()

DISPOSABLE_EMAIL_DOMAINS = {
    "tempmail.com", "10minutemail.com", "mailinator.com",
    "guerrillamail.com", "yopmail.com", "trashmail.com",
    "sharklasers.com", "getnada.com"
}

class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., example="petani.baru@tanikarbon.com")
    full_name: str = Field(..., example="Pak Joko Widodo")
    password: str = Field(..., min_length=8, example="Password123!")
    role: str = Field("farmer", example="farmer", description="Pilihan: farmer, corporate/company, surveyor, admin")
    website_url: Optional[str] = Field(default=None, description="Honeypot anti-bot field — harus kosong")

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TreeSpeciesResponse(BaseModel):
    id: UUID
    local_name: str
    latin_name: Optional[str] = None
    category: Optional[str] = None
    wood_density: float
    formula_type: Optional[str] = "ketterings"
    coeff_a: Optional[float] = None
    exp_b: Optional[float] = None
    requires_height: bool = False
    formula_display: Optional[str] = None
    reference_source: Optional[str] = None

    class Config:
        from_attributes = True


# ==============================================================================
# Skema Profil Mitra Tani (Farmer Profile)
# ==============================================================================
class FarmerProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, example="Pak Joko Widodo", description="Nama lengkap mitra tani")
    nik: Optional[str] = Field(None, example="3307011234560001", description="16 digit NIK")
    phone_number: Optional[str] = Field(None, example="0812-3456-7890", description="Nomor HP / WhatsApp")
    address: Optional[str] = Field(None, example="Jl. Lereng Sindoro No. 12", description="Alamat tempat tinggal")
    village: Optional[str] = Field(None, example="Kecitran", description="Desa / Kelurahan")
    regency: Optional[str] = Field(None, example="Wonosobo", description="Kabupaten / Kota")
    province: Optional[str] = Field(None, example="Jawa Tengah", description="Provinsi")
    gapoktan_name: Optional[str] = Field(None, example="Gapoktan Sindoro Makmur", description="Nama kelompok tani")

ProfileUpdateRequest = FarmerProfileUpdateRequest

class FarmerProfileResponse(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    full_name: str
    email: str
    nik: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    regency: Optional[str] = None
    province: Optional[str] = None
    gapoktan_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

ProfileResponse = FarmerProfileResponse

# ==============================================================================
# Skema Rekening Bank & E-Wallet Mitra Tani (Bank Accounts)
# ==============================================================================
class BankAccountCreateRequest(BaseModel):
    bank_code: str = Field(..., example="BRI", min_length=2, max_length=50, description="Kode bank atau e-wallet (BRI, BCA, MANDIRI, DANA, dll)")
    bank_name: str = Field(..., example="Bank BRI", min_length=2, max_length=100, description="Nama resmi bank/e-wallet")
    account_number: str = Field(..., example="0142-01-084821-50-8", min_length=4, max_length=50, description="Nomor rekening atau nomor HP e-wallet")
    account_holder_name: str = Field(..., example="Joko Widodo", min_length=2, max_length=150, description="Nama pemilik rekening sesuai buku tabungan/KTP")
    is_primary: Optional[bool] = Field(False, description="Tandai sebagai rekening pencairan utama")

class BankAccountResponse(BaseModel):
    id: UUID
    user_id: UUID
    bank_code: str
    bank_name: str
    account_number: str
    account_holder_name: str
    is_primary: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SurveyorAuditRequest(BaseModel):
    decision: str = Field(..., description="'approved' | 'revision' | 'rejected'")
    notes: str = Field(..., min_length=3, description="Catatan hasil inspeksi lapangan")
    category: Optional[str] = Field(None, description="Kategori revisi jika ada")
    block_adjustments: Optional[List[Dict[str, Any]]] = Field(None, description="Penyesuaian blok pohon jika ada")

