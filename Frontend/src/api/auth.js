// ==============================================================================
// TaniKarbon Frontend - Modul Utilitas Autentikasi JWT End-to-End
// ==============================================================================

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Mengirim kredensial login ke backend FastAPI (dengan rate limit anti-brute force).
 */
export async function loginUser({ identifier, password, role }) {
  const payload = {
    identifier: identifier ? identifier.trim() : '',
    password: password || '',
    role: role || undefined,
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
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

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
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
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
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
  localStorage.removeItem('tanikarbon_token');
  localStorage.removeItem('tanikarbon_user');
}
