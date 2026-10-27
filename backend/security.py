import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Union
from uuid import UUID

import bcrypt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import User

# ==============================================================================
# 1. KONFIGURASI KEAMANAN & JWT
# ==============================================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tanikarbon_super_secure_jwt_secret_key_2026_uinic_8")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Inisialisasi HTTPBearer untuk ekstraksi token dari Header: Authorization: Bearer <token>
http_bearer = HTTPBearer(auto_error=True)

# Inisialisasi Rate Limiter dari slowapi (Anti Brute-Force)
limiter = Limiter(key_func=get_remote_address)


# ==============================================================================
# 2. FUNGSI HASHING & VERIFIKASI PASSWORD (BCRYPT MURNI)
# ==============================================================================
def hash_password(password: str) -> str:
    """
    Menghasilkan hash password aman menggunakan bcrypt.
    Menerapkan pemotongan batas aman 72 byte (batasan internal algoritma bcrypt).
    """
    if not password:
        raise ValueError("Password tidak boleh kosong")
    
    # Pengamanan batas 72 bytes dalam encoding UTF-8
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Memverifikasi kecocokan plain password terhadap hash bcrypt.
    Mengamankan batas 72 byte dan menangani potensi error secara aman.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        plain_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


# ==============================================================================
# 3. GENERASI & DEKODE TOKEN JWT
# ==============================================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Membuat token JWT terenkripsi dengan masa kedaluwarsa (default 60 menit).
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Memvalidasi dan mendekode payload dari token JWT.
    Melemparkan HTTP 401 jika token kedaluwarsa atau tandatangan tidak valid.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi tidak valid atau sudah kedaluwarsa.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ==============================================================================
# 4. DEPENDENCY FASTAPI: GET CURRENT USER
# ==============================================================================
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(http_bearer),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency FastAPI untuk mengambil pengguna yang sedang login berdasarkan Bearer Token.
    Memverifikasi keberadaan user di database serta memeriksa apakah akun aktif (is_active).
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak memuat identitas subjek pengguna (user ID).",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_uuid = UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Format User ID di dalam payload token tidak valid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    query = select(User).where(User.id == user_uuid)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Pengguna tidak ditemukan dalam sistem.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun pengguna dinonaktifkan. Hubungi administrator.",
        )
    
    return user


# ==============================================================================
# 5. DEPENDENCY ROLE GUARD: REQUIRE ROLES
# ==============================================================================
def require_roles(allowed_roles: List[str]):
    """
    Dependency factory untuk otorisasi berbasis Role (RBAC).
    Mendukung role: farmer, corporate (atau company), admin, surveyor.
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = str(current_user.role).lower()
        normalized_allowed = [r.lower() for r in allowed_roles]
        
        # Penanganan sinonim role korporat ('company' vs 'corporate')
        is_allowed = (
            user_role in normalized_allowed or
            (user_role == "company" and "corporate" in normalized_allowed) or
            (user_role == "corporate" and "company" in normalized_allowed)
        )
        
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak: role '{current_user.role}' tidak memiliki izin (diperlukan: {', '.join(allowed_roles)}).",
            )
        return current_user

    return role_checker
