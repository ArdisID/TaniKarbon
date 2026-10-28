import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, Enum, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('farmer', 'surveyor', 'company', 'corporate', 'admin', name='user_role'), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False)
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False)
    bank_accounts = relationship("BankAccount", back_populates="user", cascade="all, delete-orphan")

class CompanyProfile(Base):
    __tablename__ = "company_profiles"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    company_name = Column(String(150), nullable=False)
    industry_type = Column(String(100), nullable=True)
    api_key = Column(String(255), unique=True)
    webhook_url = Column(String(255), nullable=True)
    
    user = relationship("User", back_populates="company_profile")

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    escrow_balance = Column(Numeric(15, 2), default=0.00)
    available_balance = Column(Numeric(15, 2), default=0.00)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="wallet")

class Cluster(Base):
    __tablename__ = "clusters"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    vintage_year = Column(Integer, nullable=False)
    available_quota_tco2e = Column(Numeric(15, 4), default=0.0000)
    price_per_tco2e = Column(Numeric(15, 2), nullable=False)
    status = Column(Enum('gathering', 'auditing', 'available_for_sale', 'sold_out', name='cluster_status'), default="gathering")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("clusters.id"))
    tco2e_purchased = Column(Numeric(15, 4), nullable=False)
    total_price = Column(Numeric(15, 2), nullable=False)
    transaction_type = Column(Enum('manual_checkout', 'api_auto_buy', name='transaction_type'), nullable=False)
    target_emission_year = Column(Integer, nullable=False)

class Certificate(Base):
    __tablename__ = "certificates"
    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"))
    company_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("clusters.id"))
    tco2e_retired = Column(Numeric(15, 4), nullable=False)
    vintage_year = Column(Integer, nullable=False)

class TreeBlock(Base):
    __tablename__ = "tree_blocks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    land_plot_id = Column(UUID(as_uuid=True), nullable=False)
    species_name = Column(String(100), nullable=False)
    planting_year = Column(Integer, nullable=False)
    total_population = Column(Integer, nullable=False)
    estimated_tco2e_per_year = Column(Numeric(15, 4), nullable=False)

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    transaction_type = Column(String(50), nullable=False)  # 'credit_payout', 'debit_withdraw'
    description = Column(String(255), nullable=False)
    status = Column(String(50), default="completed", nullable=False)  # 'completed', 'processing'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class TreeSpecies(Base):
    __tablename__ = "tree_species"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    local_name = Column(String(150), unique=True, nullable=False)
    latin_name = Column(String(150), nullable=True)
    category = Column(String(100), nullable=False, default="Dikotil (Umum)")
    wood_density = Column(Numeric(5, 3), nullable=False)
    formula_type = Column(String(50), nullable=False, default="ketterings")  # 'ketterings', 'power_law', 'monocot_cylinder'
    coeff_a = Column(Numeric(10, 5), nullable=True)
    exp_b = Column(Numeric(10, 5), nullable=True)
    requires_height = Column(Boolean, default=False, nullable=False)
    formula_display = Column(String(255), nullable=True)
    reference_source = Column(String(150), nullable=True)

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    nik = Column(String(20), nullable=True)
    phone_number = Column(String(30), nullable=True)
    address = Column(String(255), nullable=True)
    village = Column(String(100), nullable=True)
    regency = Column(String(100), nullable=True)
    province = Column(String(100), nullable=True)
    gapoktan_name = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="farmer_profile")

class BankAccount(Base):
    __tablename__ = "bank_accounts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    bank_code = Column(String(50), nullable=False)
    bank_name = Column(String(100), nullable=False)
    account_number = Column(String(50), nullable=False)
    account_holder_name = Column(String(150), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="bank_accounts")

# Alias penamaan konvensi jamak (BankAccounts)
BankAccounts = BankAccount
