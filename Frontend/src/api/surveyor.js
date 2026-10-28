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
 * Mengirim keputusan audit lapangan (approved, revision, rejected) beserta catatan dan penyesuaian pohon.
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
