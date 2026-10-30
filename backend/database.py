import os
from pathlib import Path
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Cari berkas environment (.env.local, .env) dari root maupun direktori backend
_current_dir = Path(__file__).resolve().parent
_root_dir = _current_dir.parent

for _env_path in [
    _root_dir / ".env.local",
    _root_dir / ".env",
    _current_dir / ".env.local",
    _current_dir / ".env",
]:
    if _env_path.is_file():
        load_dotenv(dotenv_path=_env_path, override=False)


def format_asyncpg_connection(raw_url: str):
    """
    Format string koneksi Postgres (misal dari Neon) untuk SQLAlchemy + asyncpg
    mengikuti panduan best practice Neon:
    1. Konversi skema ke postgresql+asyncpg://
    2. Bersihkan query params yang tidak kompatibel sebagai kwarg asyncpg.connect()
    3. Aktifkan SSL require untuk host cloud Neon
    4. Nonaktifkan statement cache jika menggunakan Neon connection pooler (PgBouncer)
    """
    if not raw_url:
        return raw_url, {}

    parsed = urlparse(raw_url)
    scheme = parsed.scheme
    if scheme in ("postgresql", "postgres"):
        scheme = "postgresql+asyncpg"

    # Asyncpg menangani ssl melalui connect_args, bukan query parameter kwarg
    clean_url = urlunparse(parsed._replace(scheme=scheme, query=""))
    connect_args = {}

    # Neon SSL configuration
    if "sslmode=require" in raw_url or "neon.tech" in parsed.netloc:
        connect_args["ssl"] = "require"

    # Best practice PgBouncer / Neon connection pooler:
    # Disable prepared statement caching untuk mencegah error 'prepared statement already exists'
    if "-pooler" in parsed.netloc:
        connect_args["statement_cache_size"] = 0
        connect_args["prepared_statement_cache_size"] = 0

    return clean_url, connect_args


# 1. Alamat database (Twelve-Factor App: membaca dari environment variable dengan fallback lokal)
# DATABASE_URL: Menggunakan connection pooler untuk request aplikasi
RAW_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/tanikarbon_db")
DATABASE_URL, app_connect_args = format_asyncpg_connection(RAW_DATABASE_URL)

# DATABASE_URL_UNPOOLED: Menggunakan koneksi langsung (unpooled) untuk migrasi & DDL
RAW_UNPOOLED_URL = os.getenv("DATABASE_URL_UNPOOLED", RAW_DATABASE_URL)
DATABASE_URL_UNPOOLED, unpooled_connect_args = format_asyncpg_connection(RAW_UNPOOLED_URL)

# 2. Engine aplikasi (Pooled, asyncpg)
engine = create_async_engine(DATABASE_URL, echo=False, connect_args=app_connect_args)

# 3. Engine migrasi & skema DDL (Direct / Unpooled, asyncpg)
unpooled_engine = create_async_engine(DATABASE_URL_UNPOOLED, echo=False, connect_args=unpooled_connect_args)

# 4. Pabrik sesi database untuk request aplikasi
AsyncSessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False
)

# 5. Dependency injeksi untuk endpoint FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
