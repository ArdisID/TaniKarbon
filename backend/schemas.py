from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
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

class TreeSampleInput(BaseModel):
    circumference_cm: float = Field(..., gt=0, example=45.5, description="Keliling batang (cm)")

class TreeBlockRequest(BaseModel):
    land_plot_id: UUID
    species_name: str = Field(..., example="Sengon Laut")
    planting_year: int = Field(..., example=2021)
    total_population: int = Field(..., gt=0, example=100)
    samples: List[TreeSampleInput] = Field(..., min_length=3, description="Minimal 3 sampel pohon")

class WithdrawRequest(BaseModel):
    amount: float = Field(..., gt=0, example=500000, description="Jumlah saldo yang ditarik (Rupiah)")
    bank_name: str = Field(..., example="Bank Mandiri")
    account_number: str = Field(..., example="1234567890")

class DistributeRevenueRequest(BaseModel):
    transaction_id: UUID = Field(..., description="ID Transaksi dari pembelian korporat")

class SpeciesSummary(BaseModel):
    species_name: str
    total_trees: int
    total_carbon_tco2e: float

class FarmerDashboardSummary(BaseModel):
    total_land_area_sqm: float
    total_all_trees: int
    total_all_carbon_tco2e: float
    species_breakdown: List[SpeciesSummary]

# Skema Autentikasi & JWT
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    email: str
    full_name: str
    role: str

class UserLoginRequest(BaseModel):
    email: str = Field(..., example="petani@tanikarbon.com", description="Email atau nomor WhatsApp")
    password: str = Field(..., example="Password123!", description="Kata sandi")
    role: Optional[str] = Field(None, example="farmer", description="Role opsional untuk validasi preferensi UI")

class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., example="petani.baru@tanikarbon.com")
    full_name: str = Field(..., example="Pak Joko Widodo")
    password: str = Field(..., min_length=6, example="Password123!")
    role: str = Field("farmer", example="farmer", description="Pilihan: farmer, corporate/company, surveyor, admin")

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True