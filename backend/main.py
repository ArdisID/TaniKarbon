import math
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import CompanyProfile, Wallet, Cluster, Transaction, Certificate, TreeBlock
from schemas import AutoBuyRequest, AutoBuyResponse, LandPlotRequest, TreeBlockRequest, WithdrawRequest, DistributeRevenueRequest, FarmerDashboardSummary

app = FastAPI(title="TaniKarbon API - Interoperabilitas UINIC 8.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"], # Port standar Vite & React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Konfigurasi Keamanan Header API Key
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

# 2. Fungsi Validasi Otorisasi Perusahaan
async def get_company_by_api_key(api_key: str = Security(api_key_header), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CompanyProfile).where(CompanyProfile.api_key == api_key))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=403, detail="API Key tidak valid atau perusahaan tidak ditemukan.")
    return company

# 3. Endpoint Inti: Auto-Buy dari ERP Pabrik
@app.post("/api/v1/offset/auto-buy", response_model=AutoBuyResponse)
async def auto_buy_offset(
    request: AutoBuyRequest,
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
                Cluster.available_quota_tco2e >= request.emission_amount_tco2e
            )
        )
        cluster = cluster_result.scalars().first()
        
        if not cluster:
            raise HTTPException(status_code=400, detail="Gagal: Tidak ada klaster dengan sisa stok karbon yang mencukupi.")

        # C. Kalkulasi Biaya (Jumlah tonase x Harga per tonase)
        total_cost = request.emission_amount_tco2e * float(cluster.price_per_tco2e)

        # D. Validasi Kecukupan Saldo
        if float(wallet.available_balance) < total_cost:
            raise HTTPException(status_code=402, detail=f"Saldo tidak cukup. Butuh Rp{total_cost:,.2f}, saldo tersisa Rp{wallet.available_balance:,.2f}")

        # E. Eksekusi Pemotongan
        wallet.available_balance = float(wallet.available_balance) - total_cost
        cluster.available_quota_tco2e = float(cluster.available_quota_tco2e) - request.emission_amount_tco2e

        # F. Catat Riwayat Transaksi
        new_trx = Transaction(
            company_id=company.user_id,
            cluster_id=cluster.id,
            tco2e_purchased=request.emission_amount_tco2e,
            total_price=total_cost,
            transaction_type="api_auto_buy",
            target_emission_year=request.emission_period_year
        )
        db.add(new_trx)
        await db.flush()

        # G. Terbitkan Sertifikat
        new_cert = Certificate(
            transaction_id=new_trx.id,
            company_id=company.user_id,
            cluster_id=cluster.id,
            tco2e_retired=request.emission_amount_tco2e,
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
            tco2e_retired=request.emission_amount_tco2e,
            total_cost=total_cost,
            cluster_name=cluster.name
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        # Mencetak error asli ke terminal untuk mempermudah debugging
        print(f"CRITICAL SYSTEM ERROR: {str(e)}") 
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan sistem: {str(e)}")


# Hardcode ID Petani & Klaster dari mock data untuk kemudahan demonstrasi
FARMER_ID = "11111111-1111-4111-8111-111111111111"
CLUSTER_ID = "44444444-4444-4444-8444-444444444444"

@app.post("/api/v1/farmer/lands")
async def register_land_plot(request: LandPlotRequest, db: AsyncSession = Depends(get_db)):
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
        "farmer_id": FARMER_ID, "cluster_id": CLUSTER_ID,
        "name": request.name, "geojson": request.geojson_polygon
    })
    await db.commit()
    
    row = result.fetchone()
    return {
        "id": row.id, "name": row.name, 
        "area_sqm": row.total_area_sqm, "geojson_polygon": row.geojson_result
    }

@app.get("/api/v1/farmer/lands")
async def get_land_plots(db: AsyncSession = Depends(get_db)):
    query = text("""
        SELECT id, name, total_area_sqm, ST_AsGeoJSON(polygon_boundary) as geojson
        FROM land_plots WHERE farmer_id = :farmer_id
    """)
    result = await db.execute(query, {"farmer_id": FARMER_ID})
    
    return [
        {"id": row.id, "name": row.name, "area_sqm": row.total_area_sqm, "geojson_polygon": row.geojson} 
        for row in result.fetchall()
    ]


@app.post("/api/v1/farmer/tree-blocks")
async def calculate_smart_sampling(request: TreeBlockRequest, db: AsyncSession = Depends(get_db)):
    # 1. Hitung rata-rata keliling batang (cm)
    avg_circumference = sum(s.circumference_cm for s in request.samples) / len(request.samples)
    
    # 2. Konversi ke Diameter (DBH) dalam cm
    dbh_cm = avg_circumference / math.pi
    
    # 3. Rumus Alometrik Sederhana (Untuk Demo UINIC)
    # Asumsi: Serapan berbanding lurus dengan diameter dikali populasi
    tco2e_per_tree = dbh_cm * 0.015 
    total_estimated_tco2e = tco2e_per_tree * request.total_population
    
    # 4. Simpan hasil kalkulasi ke Database
    new_block = TreeBlock(
        land_plot_id=request.land_plot_id,
        species_name=request.species_name,
        planting_year=request.planting_year,
        total_population=request.total_population,
        estimated_tco2e_per_year=total_estimated_tco2e
    )
    db.add(new_block)
    await db.commit()
    await db.refresh(new_block)
    
    return {
        "status": "success",
        "message": "Estimasi karbon berhasil dihitung dan disimpan.",
        "tree_block_id": new_block.id,
        "avg_dbh_cm": round(dbh_cm, 2),
        "estimated_tco2e_per_year": round(total_estimated_tco2e, 4)
    }

@app.post("/api/v1/farmer/wallet/withdraw")
async def withdraw_balance(request: WithdrawRequest, db: AsyncSession = Depends(get_db)):
    # Mencari dompet petani berdasarkan FARMER_ID
    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == FARMER_ID))
    wallet = wallet_result.scalars().first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Dompet petani tidak ditemukan.")
        
    if float(wallet.available_balance) < request.amount:
        raise HTTPException(status_code=400, detail=f"Saldo tidak mencukupi. Saldo saat ini: Rp{wallet.available_balance:,.2f}")
        
    # Eksekusi pemotongan saldo penarikan
    wallet.available_balance = float(wallet.available_balance) - request.amount
    await db.commit()
    
    return {
        "status": "success",
        "message": f"Penarikan dana sebesar Rp{request.amount:,.2f} ke {request.bank_name} berhasil diproses.",
        "remaining_balance": float(wallet.available_balance)
    }


@app.post("/api/v1/admin/distribute-revenue")
async def distribute_revenue(request: DistributeRevenueRequest, db: AsyncSession = Depends(get_db)):
    # 1. Cari data transaksi korporat
    trx_result = await db.execute(select(Transaction).where(Transaction.id == request.transaction_id))
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
    
    # 3. Suntikkan dana ke dompet masing-masing petani (Smart Escrow)
    for row in farmer_rows:
        wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == row.farmer_id))
        wallet = wallet_result.scalars().first()
        if wallet:
            wallet.available_balance = float(wallet.available_balance) + split_amount
            
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
async def get_farmer_dashboard_summary(db: AsyncSession = Depends(get_db)):
    # Query Agregasi Total
    total_query = text("""
        SELECT 
            COALESCE(SUM(lp.total_area_sqm), 0) as total_area,
            COALESCE(SUM(tb.total_population), 0) as total_trees,
            COALESCE(SUM(tb.estimated_tco2e_per_year), 0) as total_carbon
        FROM land_plots lp
        LEFT JOIN tree_blocks tb ON lp.id = tb.land_plot_id
        WHERE lp.farmer_id = :farmer_id
    """)
    total_result = await db.execute(total_query, {"farmer_id": FARMER_ID})
    totals = total_result.fetchone()
    
    # Query Agregasi per Spesies (Group By)
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
    species_result = await db.execute(species_query, {"farmer_id": FARMER_ID})
    
    breakdown = [
        {"species_name": row.species_name, "total_trees": row.total_trees, "total_carbon_tco2e": row.total_carbon}
        for row in species_result.fetchall()
    ]
    
    return {
        "total_land_area_sqm": totals.total_area,
        "total_all_trees": totals.total_trees,
        "total_all_carbon_tco2e": totals.total_carbon,
        "species_breakdown": breakdown
    }