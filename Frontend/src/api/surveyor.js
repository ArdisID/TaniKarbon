// ==============================================================================
// TaniKarbon Frontend - Modul API Integrasi Portal Surveyor
// ==============================================================================

import { getStoredToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Mengambil antrean tiket tugas inspeksi lapangan untuk surveyor yang sedang login.
 */
export async function getSurveyorTasks() {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/surveyor/tasks`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.detail || 'Gagal memuat daftar tugas surveyor';
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Mengambil riwayat arsip lahan yang telah selesai diaudit (verified / rejected / revision).
 */
export async function getSurveyorHistory() {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/surveyor/history`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.detail || 'Gagal memuat riwayat audit surveyor';
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Mengirim keputusan audit lapangan (approved, revision, rejected) beserta catatan dan penyesuaian pohon.
 * // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
 */
export async function submitSurveyorAudit(landId, { decision, notes, category, block_adjustments }) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/surveyor/lands/${landId}/audit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      decision,
      notes,
      category,
      block_adjustments
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.detail || 'Gagal mengirim keputusan audit lapangan';
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Mengunggah berkas foto dokumentasi lapangan ber-geotag ke server FastAPI.
 * Menggunakan multipart/form-data via FormData.
 * // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
 */
export async function uploadSurveyorPhoto(landId, formData) {
  const token = getStoredToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Catatan: JANGAN set 'Content-Type' saat mengirim FormData agar boundary multipart otomatis diset browser.

  const response = await fetch(`${API_BASE}/surveyor/lands/${landId}/photos`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.detail || 'Gagal mengunggah foto dokumentasi lapangan';
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Mengambil daftar foto dokumentasi lapangan untuk petak lahan tertentu.
 */
export async function getSurveyorLandPhotos(landId) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/surveyor/lands/${landId}/photos`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.detail || 'Gagal memuat galeri foto survei';
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Menghapus foto dokumentasi lapangan dari server.
 */
export async function deleteSurveyorPhoto(landId, photoId) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/surveyor/lands/${landId}/photos/${photoId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.detail || 'Gagal menghapus foto survei';
    throw new Error(errorMsg);
  }

  return await response.json();
}
