from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID

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