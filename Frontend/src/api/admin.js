import { getStoredToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

function getAuthHeaders() {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/**
 * Mengambil ringkasan statistik ekosistem untuk Command Center Admin
 */
export async function getAdminEcosystemStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Fallback getAdminEcosystemStats to local mock:', err);
  }
  return null;
}

/**
 * Mengambil daftar seluruh klaster terdaftar di sistem
 */
export async function getAdminClusters() {
  try {
    const res = await fetch(`${API_BASE}/admin/clusters`, {
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Fallback getAdminClusters to local mock:', err);
  }
  return null;
}

/**
 * Membuat klaster baru
 */
export async function createAdminCluster(payload) {
  const res = await fetch(`${API_BASE}/admin/clusters`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal membuat klaster');
  }
  return await res.json();
}

/**
 * Mengesahkan audit pihak ketiga & minting kuota bursa klaster
 */
export async function mintClusterQuota(clusterId, payload) {
  const res = await fetch(`${API_BASE}/admin/clusters/${clusterId}/mint`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal mengesahkan audit & minting');
  }
  return await res.json();
}

/**
 * Mengambil antrean permohonan penarikan dana (payout) petani
 */
export async function getAdminPayoutQueue() {
  try {
    const res = await fetch(`${API_BASE}/admin/payouts`, {
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Fallback getAdminPayoutQueue to local mock:', err);
  }
  return null;
}

/**
 * Menyetujui pencairan dana petani dengan nomor referensi transfer bank
 */
export async function approvePayout(payoutId, payload) {
  const res = await fetch(`${API_BASE}/admin/payouts/${payoutId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal menyetujui pencairan dana');
  }
  return await res.json();
}

/**
 * Menolak pencairan dana petani dan mengembalikan saldo ke dompet
 */
export async function rejectPayout(payoutId, payload) {
  const res = await fetch(`${API_BASE}/admin/payouts/${payoutId}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal menolak pencairan dana');
  }
  return await res.json();
}

/**
 * Mengambil master biometrik dan rumus alometrik spesies pohon
 */
export async function getAdminSpecies() {
  try {
    const res = await fetch(`${API_BASE}/admin/species`, {
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Fallback getAdminSpecies to local mock:', err);
  }
  return null;
}

/**
 * Mengambil daftar pengguna sistem
 */
export async function getAdminUsers() {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Fallback getAdminUsers to local mock:', err);
  }
  return null;
}

/**
 * Mengatur jadwal inspeksi dan menugaskan surveyor ke petak lahan
 */
export async function scheduleLandSurvey(landId, payload) {
  const res = await fetch(`${API_BASE}/admin/lands/${landId}/schedule`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal menjadwalkan survei');
  }
  return await res.json();
}
