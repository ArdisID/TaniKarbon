import { getStoredToken, updateStoredUser, getStoredUser } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

function getAuthHeaders() {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

const DEFAULT_CORPORATE_PROFILE = {
  company_name: 'PT Industri Hijau Nusantara (Tbk)',
  email: 'esg@korporathijau.com',
  idx_code: 'IDX: IHN',
  srn_id: 'ID-SRN-CORP-0182',
  net_zero_target: 'Scope 1 & 2 (2030)',
  industry_type: 'Manufaktur & Energi Terbarukan',
  pic_name: 'Ir. Budi Santoso, M.Env.',
  pic_phone: '+62 21-5290-8800',
  address: 'SCBD Lot 28, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
  compliance_standard: 'POJK No. 51/2017 & ISO 14064'
};

/**
 * Fetch profil entitas korporat
 */
export async function getCorporateProfile() {
  const storedUser = getStoredUser() || {};
  try {
    const response = await fetch(`${API_BASE}/corporate/profile`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      return {
        ...DEFAULT_CORPORATE_PROFILE,
        ...data,
        company_name: data.company_name || storedUser.full_name || DEFAULT_CORPORATE_PROFILE.company_name,
        email: data.email || storedUser.email || DEFAULT_CORPORATE_PROFILE.email
      };
    }
  } catch (err) {
    console.warn('Backend corporate profile fetch fallback to local:', err);
  }

  // Fallback to localStorage / defaults
  return {
    ...DEFAULT_CORPORATE_PROFILE,
    company_name: storedUser.full_name || storedUser.company_name || DEFAULT_CORPORATE_PROFILE.company_name,
    email: storedUser.email || DEFAULT_CORPORATE_PROFILE.email,
    pic_phone: storedUser.pic_phone || DEFAULT_CORPORATE_PROFILE.pic_phone,
    address: storedUser.address || DEFAULT_CORPORATE_PROFILE.address,
    idx_code: storedUser.idx_code || DEFAULT_CORPORATE_PROFILE.idx_code,
    srn_id: storedUser.srn_id || DEFAULT_CORPORATE_PROFILE.srn_id,
    net_zero_target: storedUser.net_zero_target || DEFAULT_CORPORATE_PROFILE.net_zero_target,
    pic_name: storedUser.pic_name || DEFAULT_CORPORATE_PROFILE.pic_name
  };
}

/**
 * Perbarui profil entitas korporat
 */
export async function updateCorporateProfile(payload) {
  let backendResult = null;
  try {
    const response = await fetch(`${API_BASE}/corporate/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      backendResult = await response.json();
    }
  } catch (err) {
    console.warn('Backend corporate profile update fallback to local:', err);
  }

  const updatedProfile = {
    ...DEFAULT_CORPORATE_PROFILE,
    ...(backendResult || {}),
    ...payload,
    full_name: payload.company_name || backendResult?.company_name
  };

  updateStoredUser({
    full_name: updatedProfile.company_name,
    company_name: updatedProfile.company_name,
    pic_name: updatedProfile.pic_name,
    pic_phone: updatedProfile.pic_phone,
    address: updatedProfile.address,
    idx_code: updatedProfile.idx_code,
    srn_id: updatedProfile.srn_id,
    net_zero_target: updatedProfile.net_zero_target
  });

  return updatedProfile;
}

/**
 * Mengambil daftar klaster karbon yang tersedia untuk dibeli
 */
export async function getCorporateClusters() {
  try {
    const response = await fetch(`${API_BASE}/corporate/clusters`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Fallback getCorporateClusters to local mock:', err);
  }
  return null;
}

/**
 * Mengambil saldo deposit pre-funded korporat dan riwayat ledger
 */
export async function getCorporateWallet() {
  try {
    const response = await fetch(`${API_BASE}/corporate/wallet`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Fallback getCorporateWallet to local mock:', err);
  }
  return null;
}

/**
 * Top up deposit pre-funded korporat
 */
export async function topUpCorporateDeposit(amount, bankMethod = 'Mandiri Corporate VA') {
  const response = await fetch(`${API_BASE}/corporate/wallet/topup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount, bank_method: bankMethod })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal melakukan top-up deposit');
  }
  return await response.json();
}

/**
 * Melakukan transaksi pembelian / pensiun karbon (Manual Checkout)
 */
export async function checkoutCarbonOffset(payload) {
  const response = await fetch(`${API_BASE}/corporate/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal memproses transaksi checkout karbon');
  }
  return await response.json();
}

/**
 * Mengambil daftar sertifikat pensiun karbon milik korporat
 */
export async function getCorporateCertificates() {
  try {
    const response = await fetch(`${API_BASE}/corporate/certificates`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Fallback getCorporateCertificates to local mock:', err);
  }
  return null;
}
