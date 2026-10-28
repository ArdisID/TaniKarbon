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
 * Fetch ringkasan dashboard petani:
 * total_land_area_sqm, total_all_trees, total_all_carbon_tco2e, species_breakdown,
 * farmer_name, farmer_email, total_land_plots, available_balance, escrow_balance
 */
export async function getFarmerSummary() {
  const response = await fetch(`${API_BASE}/farmer/dashboard/summary`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memuat ringkasan dasbor petani');
  }

  return response.json();
}

/**
 * Fetch daftar petak lahan milik petani beserta tree_blocks
 */
export async function getFarmerLands() {
  const response = await fetch(`${API_BASE}/farmer/lands`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memuat data petak lahan');
  }

  return response.json();
}

/**
 * Registrasi petak lahan baru
 */
export async function registerLandPlot({
  name,
  geojson_polygon,
  status = 'draft',
  polygon_boundary,
  ownership,
  document_no,
  village,
  regency
}) {
  const finalGeojson = typeof geojson_polygon === 'string' 
    ? geojson_polygon 
    : JSON.stringify(geojson_polygon || polygon_boundary);

  const response = await fetch(`${API_BASE}/farmer/lands`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ 
      name, 
      geojson_polygon: finalGeojson,
      status,
      ownership: ownership || null,
      document_no: document_no || null,
      village: village || null,
      regency: regency || null,
      polygon_boundary: polygon_boundary || (geojson_polygon ? (typeof geojson_polygon === 'string' ? JSON.parse(geojson_polygon) : geojson_polygon) : null)
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal mendaftarkan petak lahan');
  }

  return response.json();
}

/**
 * Validasi pre-flight poligon sebelum dikunci di Step 2 wizard.
 * Backend menjadi otoritas untuk ST_IsValid, luas, dan anti-overlap PostGIS.
 */
export async function validateLandPolygon(polygon_boundary) {
  const response = await fetch(`${API_BASE}/farmer/lands/validate-polygon`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ polygon_boundary })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memvalidasi poligon lahan');
  }

  return response.json();
}

/**
 * Layer referensi seluruh poligon aktif. Nama petani lain disamarkan oleh backend.
 */
export async function getSpatialOverlay() {
  const response = await fetch(`${API_BASE}/farmer/lands/spatial-overlay`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memuat layer referensi spasial');
  }

  return response.json();
}

/**
 * Hapus petak lahan berstatus draft
 */
export async function deleteLandPlot(landId) {
  const response = await fetch(`${API_BASE}/farmer/lands/${landId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal menghapus petak lahan');
  }

  return response.json();
}

/**
 * Registrasi blok pohon & kalkulasi smart sampling
 */
export async function addTreeBlock({ land_plot_id, species_name, planting_year, total_population, samples }) {
  const response = await fetch(`${API_BASE}/farmer/tree-blocks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      land_plot_id,
      species_name,
      planting_year,
      total_population,
      samples
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal mendaftarkan blok pohon');
  }

  return response.json();
}

/**
 * Fetch saldo dompet petani
 */
export async function getFarmerWallet() {
  const response = await fetch(`${API_BASE}/farmer/wallet`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memuat saldo dompet');
  }

  return response.json();
}

/**
 * Tarik saldo dompet petani
 */
export async function withdrawFarmerBalance({ amount, bank_name, account_number }) {
  const response = await fetch(`${API_BASE}/farmer/wallet/withdraw`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      amount: parseFloat(amount),
      bank_name,
      account_number
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memproses penarikan saldo');
  }

  return response.json();
}

/**
 * Fetch daftar riwayat mutasi dompet petani
 */
export async function getFarmerWalletTransactions() {
  const response = await fetch(`${API_BASE}/farmer/wallet/transactions`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memuat riwayat mutasi dompet');
  }

  return response.json();
}

/**
 * Fetch daftar master data spesies pohon beserta kerapatan kayu (wood density)
 */
export async function getTreeSpecies() {
  const response = await fetch(`${API_BASE}/tree-species`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memuat master data spesies pohon');
  }

  return response.json();
}

/**
 * Kirim pengajuan revisi batas petak / catatan ke surveyor
 */
export async function submitLandRevision({ land_id, category, notes, reason }) {
  const finalNotes = notes || reason || '';
  const response = await fetch(`${API_BASE}/farmer/lands/${land_id}/revisions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      category,
      notes: finalNotes,
      reason: finalNotes,
      land_plot_id: land_id
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal mengirim pengajuan revisi ke surveyor');
  }

  return response.json();
}
