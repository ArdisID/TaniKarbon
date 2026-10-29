// ==============================================================================
// TaniKarbon Frontend - Modul Utilitas Autentikasi JWT End-to-End
// ==============================================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Mengirim kredensial login ke backend FastAPI (dengan rate limit anti-brute force).
 */
export async function loginUser({ identifier, password, role }) {
  const payload = {
    identifier: identifier ? identifier.trim() : '',
    password: password || '',
    role: role || undefined,
  };

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.detail || data.error || (typeof data === 'string' ? data : 'Autentikasi gagal.');
    throw new Error(errorMsg);
  }

  saveAuthSession(data);
  return data;
}

/**
 * Mendaftarkan akun baru ke backend FastAPI (dengan Honeypot & verifikasi anti-spam).
 */
export async function registerUser({ email, full_name, password, role, website_url }) {
  const payload = {
    email: email ? email.trim() : '',
    full_name: full_name ? full_name.trim() : '',
    password: password || '',
    role: role || 'farmer',
    website_url: website_url || undefined,
  };

  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.detail || data.error || (typeof data === 'string' ? data : 'Pendaftaran gagal.');
    throw new Error(errorMsg);
  }

  saveAuthSession(data);
  return data;
}

/**
 * Mengambil profil user yang sedang aktif berdasarkan token JWT yang tersimpan.
 */
export async function getMe() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      clearAuthSession();
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying auth session:', error);
    return null;
  }
}

/**
 * Menyimpan token JWT dan metadata user ke localStorage.
 */
export function saveAuthSession(tokenData) {
  if (tokenData?.access_token) {
    localStorage.setItem('tanikarbon_token', tokenData.access_token);
    const normalizedRole = tokenData.role === 'company' ? 'corporate' : tokenData.role;
    localStorage.setItem('tanikarbon_user', JSON.stringify({
      id: tokenData.user_id,
      email: tokenData.email,
      full_name: tokenData.full_name,
      role: normalizedRole,
    }));
  }
}

export function getStoredToken() {
  return localStorage.getItem('tanikarbon_token');
}

export function getStoredUser() {
  const userStr = localStorage.getItem('tanikarbon_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  const authKeys = [
    'tanikarbon_token',
    'tanikarbon_user',
    'token',
    'auth_token',
    'user_token',
    'access_token',
    'user_role',
    'user_data',
    'user',
    'role',
    'currentUser',
    'farmer_token',
    'surveyor_token',
  ];
  authKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore localStorage errors
    }
  });
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn('Gagal membersihkan sessionStorage:', e);
  }
}

/**
 * Hard redirect logout: membersihkan semua sesi autentikasi dan mereload ke halaman /login
 */
export function logoutUser(redirectTo = '/login') {
  clearAuthSession();
  window.location.replace(redirectTo);
}
