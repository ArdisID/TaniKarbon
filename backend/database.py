import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Load environment variables from .env file if available
dotenv_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

# 1. Alamat database (Twelve-Factor App: membaca dari environment variable dengan fallback lokal)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/tanikarbon_db")

# 2. Membuat "mesin" penghubung ke database yang sifatnya asinkron (ngebut)
engine = create_async_engine(DATABASE_URL, echo=True)

# 3. Membuat "pabrik sesi". Setiap kali ada frontend nembak API lu, 
# pabrik ini bakal ngasih satu jalur koneksi sementara ke database.
AsyncSessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False
)

# 4. Fungsi bantuan untuk membuka dan menutup koneksi secara otomatis
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session