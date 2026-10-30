import { getStoredToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export function extractErrorMessage(errorData, fallbackMessage) {
  if (!errorData) return fallbackMessage;
  if (typeof errorData === 'string') return errorData;
  if (typeof errorData.detail === 'string') return errorData.detail;
  if (Array.isArray(errorData.detail)) {
    return errorData.detail.map(err => {
      const field = err.loc ? err.loc.filter(l => l !== 'body').join('.') : '';
      return field ? `${field}: ${err.msg}` : err.msg;
    }).join('; ') || fallbackMessage;
  }
  if (errorData.message) return errorData.message;
  return fallbackMessage;
}

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
  const response = await fetch(`${API_BASE}/farmer/dashboard`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memuat ringkasan dasbor petani');
  }

  return response.json();
}

export const getFarmerDashboard = getFarmerSummary;

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
  regency,
  tree_blocks
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
      polygon_boundary: polygon_boundary || (geojson_polygon ? (typeof geojson_polygon === 'string' ? JSON.parse(geojson_polygon) : geojson_polygon) : null),
      tree_blocks: tree_blocks || null
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Gagal mendaftarkan petak lahan'));
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
    throw new Error(extractErrorMessage(errorData, 'Gagal memvalidasi poligon lahan'));
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
    throw new Error(extractErrorMessage(errorData, 'Gagal memuat layer referensi spasial'));
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
    throw new Error(extractErrorMessage(errorData, 'Gagal menghapus petak lahan'));
  }

  return response.json();
}

/**
 * Registrasi blok pohon & kalkulasi smart sampling
 */
export async function addTreeBlock({ land_plot_id, species_name, planting_year, total_population, samples, height_m }) {
  const formattedSamples = (samples || []).map((s) => {
    const dbh = parseFloat(s.dbh_cm || s.dbh || 0);
    const circ = s.circumference_cm 
      ? parseFloat(s.circumference_cm) 
      : (dbh > 0 ? parseFloat((dbh * Math.PI).toFixed(4)) : 0);
    return {
      circumference_cm: circ,
      dbh_cm: dbh > 0 ? dbh : parseFloat((circ / Math.PI).toFixed(2)),
      height_m: s.height_m ? parseFloat(s.height_m) : undefined,
      sample_index: s.sample_index
    };
  });

  const response = await fetch(`${API_BASE}/farmer/tree-blocks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      land_plot_id,
      species_name,
      planting_year: parseInt(planting_year, 10),
      total_population: parseInt(total_population, 10),
      samples: formattedSamples,
      height_m: height_m ? parseFloat(height_m) : undefined
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Gagal mendaftarkan blok pohon'));
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

/**
 * Fetch detail profil mitra tani (NIK, phone, domisili, gapoktan)
 */
export async function getFarmerProfile() {
  const response = await fetch(`${API_BASE}/farmer/profile`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memuat profil mitra tani');
  }

  return response.json();
}

/**
 * Perbarui profil mitra tani
 */
export async function updateFarmerProfile(payload) {
  const response = await fetch(`${API_BASE}/farmer/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal menyimpan perubahan profil');
  }

  return response.json();
}

/**
 * Fetch daftar rekening bank & e-wallet mitra tani
 */
export async function getFarmerBankAccounts() {
  const response = await fetch(`${API_BASE}/farmer/bank-accounts`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal memuat daftar rekening bank');
  }

  return response.json();
}

/**
 * Tambah rekening bank atau e-wallet mitra tani baru
 */
export async function addFarmerBankAccount(accountData) {
  const response = await fetch(`${API_BASE}/farmer/bank-accounts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(accountData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Gagal menambahkan rekening bank'));
  }

  return response.json();
}

/**
 * Hapus rekening bank atau e-wallet mitra tani
 */
export async function deleteFarmerBankAccount(accountId) {
  const response = await fetch(`${API_BASE}/farmer/bank-accounts/${accountId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Gagal menghapus rekening bank'));
  }

  return response.json();
}

/**
 * Jadikan rekening bank mitra tani sebagai rekening utama (primer)
 */
export async function setPrimaryFarmerBankAccount(accountId) {
  const response = await fetch(`${API_BASE}/farmer/bank-accounts/${accountId}/primary`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Gagal mengatur rekening utama'));
  }

  return response.json();
}

/**
 * Tambah blok pohon baru langsung ke petak lahan yang sudah ada
 */
export async function addTreeBlockToLand(landId, blockData) {
  const formattedSamples = (blockData.samples || []).map((s) => {
    const dbh = parseFloat(s.dbh_cm || s.dbh || 0);
    const circ = s.circumference_cm 
      ? parseFloat(s.circumference_cm) 
      : (dbh > 0 ? parseFloat((dbh * Math.PI).toFixed(4)) : 0);
    return {
      circumference_cm: circ,
      dbh_cm: dbh > 0 ? dbh : parseFloat((circ / Math.PI).toFixed(2)),
      height_m: s.height_m ? parseFloat(s.height_m) : undefined,
      sample_index: s.sample_index
    };
  });

  const response = await fetch(`${API_BASE}/farmer/lands/${landId}/blocks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      land_plot_id: landId,
      species_name: blockData.species_name,
      planting_year: parseInt(blockData.planting_year, 10),
      total_population: parseInt(blockData.total_population, 10),
      samples: formattedSamples,
      height_m: blockData.height_m ? parseFloat(blockData.height_m) : undefined
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Gagal menambahkan blok pohon'));
  }

  return response.json();
}

// [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
export async function reviseLandPlot(landId, data) {
  return submitLandRevision({
    land_id: landId,
    category: data.category || 'Revisi Batas / Sampel Pohon',
    notes: data.detail_notes || data.notes || data.reason || 'Permintaan revisi petak oleh petani'
  });
}
