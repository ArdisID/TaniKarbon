import uuid
from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), nullable=False)
    
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False)

class CompanyProfile(Base):
    __tablename__ = "company_profiles"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    company_name = Column(String(150), nullable=False)
    api_key = Column(String(255), unique=True)
    
    user = relationship("User", back_populates="company_profile")

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    available_balance = Column(Numeric(15, 2), default=0.00)
    
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