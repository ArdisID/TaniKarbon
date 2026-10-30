import React, { useState, useEffect } from 'react';
import CorporateSidebar from './corporate/CorporateSidebar';
import CorporateMobileNav from './corporate/CorporateMobileNav';
import CompanyDashboardView from './corporate/CompanyDashboardView';
import CarbonMarketplaceView from './corporate/CarbonMarketplaceView';
import CertificateRegistryView from './corporate/CertificateRegistryView';
import ErpIntegrationView from './corporate/ErpIntegrationView';
import CorporateWalletView from './corporate/CorporateWalletView';
import ClusterDetailDrawer from './corporate/ClusterDetailDrawer';
import CarbonCheckoutModal from './corporate/CarbonCheckoutModal';
import CertificatePreviewModal from './corporate/CertificatePreviewModal';
import TopUpDepositModal from './corporate/TopUpDepositModal';
import { 
  getCorporateProfile, 
  updateCorporateProfile,
  getCorporateClusters,
  getCorporateWallet,
  topUpCorporateDeposit,
  checkoutCarbonOffset,
  getCorporateCertificates
} from '../api/corporate';
import { 
  Building2, 
  X, 
  Download, 
  ShieldCheck, 
  CheckCircle2,
  Edit3,
  User,
  Phone,
  Check,
  Loader2,
  MapPin,
  Menu,
  LogOut
} from 'lucide-react';
import { formatRupiah } from '../data';

// ============================================================================
// MODAL: PROFIL ENTITAS PERUSAHAAN (Interactive View & Edit Mode)
// ============================================================================
function CorporateProfileModal({ currentUser, onClose, onToast, onProfileUpdated, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    company_name: currentUser?.full_name || 'PT Industri Hijau Nusantara (Tbk)',
    idx_code: 'IDX: IHN',
    srn_id: 'ID-SRN-CORP-0182',
    net_zero_target: 'Scope 1 & 2 (2030)',
    industry_type: 'Manufaktur & Energi',
    pic_name: 'Ir. Budi Santoso, M.Env.',
    email: currentUser?.email || 'esg@korporathijau.com',
    pic_phone: '+62 21-5290-8800',
    address: 'SCBD Lot 28, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan'
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingProfile(true);
      try {
        const data = await getCorporateProfile();
        if (isMounted && data) {
          setProfile(data);
          setFormData({
            company_name: data.company_name || currentUser?.full_name || 'PT Industri Hijau Nusantara (Tbk)',
            idx_code: data.idx_code || 'IDX: IHN',
            srn_id: data.srn_id || 'ID-SRN-CORP-0182',
            net_zero_target: data.net_zero_target || 'Scope 1 & 2 (2030)',
            industry_type: data.industry_type || 'Manufaktur & Energi',
            pic_name: data.pic_name || 'Ir. Budi Santoso, M.Env.',
            email: data.email || currentUser?.email || 'esg@korporathijau.com',
            pic_phone: data.pic_phone || '+62 21-5290-8800',
            address: data.address || 'SCBD Lot 28, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan'
          });
        }
      } catch (err) {
        console.warn('Gagal memuat profil korporat:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [currentUser]);

  const displayName = profile?.company_name || formData.company_name;
  const displayEmail = profile?.email || formData.email;
  const monogram = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'IHN';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      onToast('Nama resmi perusahaan tidak boleh kosong.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateCorporateProfile(formData);
      setProfile(updated);
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      setIsEditing(false);
      onToast('Profil entitas korporat berhasil diperbarui.');
    } catch (err) {
      console.error('Gagal memperbarui profil korporat:', err);
      onToast('Gagal menyimpan pembaruan profil korporat.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F1E2E] p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-sky-400 font-bold font-sans text-base flex items-center justify-center shrink-0">
              {monogram}
            </div>
            <div>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-sky-300 block">
                {isEditing ? 'Pembaruan Entitas' : 'SRN-PPI VERIFIED BUYER'}
              </span>
              <h3 className="font-extrabold text-white text-base sm:text-lg leading-tight font-sans">
                {isEditing ? 'Edit Profil Korporat' : displayName}
              </h3>
              <p className="text-xs text-slate-300 leading-tight mt-0.5 font-sans">{displayEmail}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {isLoadingProfile ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0F1E2E]" />
              <p className="text-xs font-medium">Memuat data profil korporat...</p>
            </div>
          ) : isEditing ? (
            /* ================= EDIT MODE ================= */
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Nama Resmi Entitas / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Contoh: PT Industri Hijau Nusantara (Tbk)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] focus:bg-white text-xs transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Kode Entitas IDX (Bila Tbk)
                  </label>
                  <input
                    type="text"
                    value={formData.idx_code}
                    onChange={(e) => handleInputChange('idx_code', e.target.value)}
                    placeholder="IDX: IHN"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] focus:bg-white transition tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block font-sans">
                    No. Akun SRN-PPI KLHK
                  </label>
                  <input
                    type="text"
                    value={formData.srn_id}
                    onChange={(e) => handleInputChange('srn_id', e.target.value)}
                    placeholder="ID-SRN-CORP-0182"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] focus:bg-white transition tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Target Net-Zero Scope &amp; Tahun
                  </label>
                  <input
                    type="text"
                    value={formData.net_zero_target}
                    onChange={(e) => handleInputChange('net_zero_target', e.target.value)}
                    placeholder="Scope 1 & 2 (2030)"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Sektor Industri
                  </label>
                  <input
                    type="text"
                    value={formData.industry_type}
                    onChange={(e) => handleInputChange('industry_type', e.target.value)}
                    placeholder="Manufaktur & Energi"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Pejabat Otorisasi ESG (PIC)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.pic_name}
                      onChange={(e) => handleInputChange('pic_name', e.target.value)}
                      placeholder="Ir. Budi Santoso, M.Env."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    No. Telepon / Hotline PIC
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.pic_phone}
                      onChange={(e) => handleInputChange('pic_phone', e.target.value)}
                      placeholder="+62 21-5290-8800"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Alamat Kantor Pusat
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="SCBD Lot 28, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#0F1E2E] hover:bg-[#1E293B] text-white font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-400" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <>
              {/* 6 Bento Grid Information Cards */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-sans">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold font-sans tracking-wider">
                    Kode Entitas IDX
                  </span>
                  <strong className="text-[#0F1E2E] text-sm font-bold font-sans tabular-nums">
                    {profile?.idx_code || 'IDX: IHN'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold font-sans tracking-wider">
                    No. Akun SRN-PPI
                  </span>
                  <strong className="text-[#0F1E2E] text-sm font-bold font-sans tabular-nums">
                    {profile?.srn_id || 'ID-SRN-CORP-0182'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold font-sans tracking-wider">
                    Target Net-Zero
                  </span>
                  <strong className="text-emerald-700 text-xs font-bold block truncate font-sans">
                    {profile?.net_zero_target || 'Scope 1 & 2 (2030)'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Sektor Industri
                  </span>
                  <strong className="text-slate-800 text-xs font-semibold block truncate">
                    {profile?.industry_type || 'Manufaktur & Energi'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Pejabat Otorisasi ESG (PIC)
                  </span>
                  <strong className="text-slate-800 text-xs font-semibold block truncate">
                    {profile?.pic_name || 'Ir. Budi Santoso, M.Env.'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    No. Kontak / Hotline
                  </span>
                  <strong className="text-slate-800 text-xs font-semibold block truncate">
                    {profile?.pic_phone || '+62 21-5290-8800'}
                  </strong>
                </div>
              </div>

              {/* Alamat & Regulasi Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Alamat Kantor Pusat &amp; Kepatuhan
                  </span>
                  <span className="text-[10px] text-sky-800 font-bold bg-sky-100 px-2 py-0.5 rounded-full">
                    POJK No. 51 / 2017
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {profile?.address || 'SCBD Lot 28, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan'}
                </p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Standar Verifikasi:</span>
                  <strong className="text-slate-800 font-semibold">ISO 14064 &amp; SRN-PPI KLHK</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 bg-[#0F1E2E] hover:bg-[#1E293B] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-sky-400" />
                  <span>Edit Profil Perusahaan</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {onLogout && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Keluar dari Akun Korporat</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: CorporateMarketplace (B2B ESG Portal Orchestrator)
// ============================================================================
export default function CorporateMarketplace({
  currentUser,
  onLogout,
  totalRetired = 1200,
  onRetire,
  onBack,
  onNavigateRole
}) {
  // Navigation state (5 primary enterprise menus)
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(currentUser);

  useEffect(() => {
    if (currentUser) {
      setActiveUser(currentUser);
    }
  }, [currentUser]);

  // Financial & emission balance state
  const [depositBalance, setDepositBalance] = useState(250000000);
  const [retiredCarbon, setRetiredCarbon] = useState(totalRetired || 1200);

  // Certificates state (unique list)
  const [certificates, setCertificates] = useState([
    {
      uuid: 'CERT-2026-TK-9941A',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      vintage: '2026',
      quantity: 500,
      totalCost: 80000000,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Manual Checkout',
      date: '18 Okt 2026',
      srnRef: 'ID-SRN-2026-00418'
    },
    {
      uuid: 'CERT-2026-TK-8812B',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: 'Klaster Konservasi Lereng Sindoro Utara',
      vintage: '2026',
      quantity: 350,
      totalCost: 56000000,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Auto-Buy API',
      date: '12 Okt 2026',
      srnRef: 'ID-SRN-2026-00392'
    },
    {
      uuid: 'CERT-2026-TK-7703C',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: 'Klaster Sabuk Pesisir Demak (Mangrove)',
      vintage: '2026',
      quantity: 200,
      totalCost: 35000000,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Auto-Buy API',
      date: '08 Okt 2026',
      srnRef: 'ID-SRN-2026-00310'
    },
    {
      uuid: 'CERT-2026-TK-6624D',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: 'Klaster Hutan Rempah Halmahera',
      vintage: '2026',
      quantity: 150,
      totalCost: 27000000,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Manual Checkout',
      date: '02 Okt 2026',
      srnRef: 'ID-SRN-2026-00275'
    }
  ]);

  // Ledger mutations history
  const [ledgerTransactions, setLedgerTransactions] = useState([
    {
      id: 'TXN-2026-1025-01',
      date: '25 Okt 2026, 14:10 WIB',
      description: 'Auto-Buy API: Penebusan 12.5 tCO2e Klaster Wonosobo',
      referenceId: 'CERT-2026-TK-8812B',
      type: 'debit',
      amount: 2000000,
      balanceAfter: 250000000,
      status: 'Berhasil Didebet',
      method: 'Auto-Buy API Payload',
      invoiceNumber: 'INV/2026/TK/10/0942'
    },
    {
      id: 'TXN-2026-1020-04',
      date: '20 Okt 2026, 09:30 WIB',
      description: 'Top-Up Pre-Funded Deposit via Mandiri Corporate VA',
      referenceId: 'DEP-MDR-992140',
      type: 'credit',
      amount: 100000000,
      balanceAfter: 252000000,
      status: 'Terverifikasi Bank',
      method: 'Mandiri Virtual Account',
      invoiceNumber: 'RCP/2026/TK/10/0188'
    },
    {
      id: 'TXN-2026-1018-02',
      date: '18 Okt 2026, 11:15 WIB',
      description: 'Manual Checkout: 500 tCO2e Dusun Garung (Tahun Buku 2026)',
      referenceId: 'CERT-2026-TK-9941A',
      type: 'debit',
      amount: 80000000,
      balanceAfter: 152000000,
      status: 'Berhasil Didebet',
      method: 'Manual Portal Checkout',
      invoiceNumber: 'INV/2026/TK/10/0812'
    },
    {
      id: 'TXN-2026-1012-01',
      date: '12 Okt 2026, 16:40 WIB',
      description: 'Auto-Buy API: Penebusan 350 tCO2e Klaster Sindoro',
      referenceId: 'CERT-2026-TK-7703C',
      type: 'debit',
      amount: 56000000,
      balanceAfter: 232000000,
      status: 'Berhasil Didebet',
      method: 'Auto-Buy API Payload',
      invoiceNumber: 'INV/2026/TK/10/0671'
    },
    {
      id: 'TXN-2026-1001-01',
      date: '01 Okt 2026, 08:00 WIB',
      description: 'Top-Up Saldo Awal Kuartal IV 2026 via Mandiri VA',
      referenceId: 'DEP-MDR-881023',
      type: 'credit',
      amount: 288000000,
      balanceAfter: 288000000,
      status: 'Terverifikasi Bank',
      method: 'Mandiri Virtual Account',
      invoiceNumber: 'RCP/2026/TK/10/0012'
    }
  ]);

  // Load backend clusters, wallet, & certificates
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      // 1. Clusters
      try {
        const clusterData = await getCorporateClusters();
        if (isMounted && clusterData && clusterData.length > 0) {
          // Merge with default presentation cards
          setClusters(prev => {
            return prev.map(defaultC => {
              const matched = clusterData.find(c => c.name.toLowerCase().includes(defaultC.name.toLowerCase().slice(0, 8)));
              if (matched) {
                return {
                  ...defaultC,
                  id: matched.id,
                  availableCarbon: matched.available_quota_tco2e,
                  pricePerTon: matched.price_per_tco2e,
                  status: matched.status === 'available_for_sale' ? 'Tersedia' : matched.status
                };
              }
              return defaultC;
            });
          });
        }
      } catch (e) {
        console.warn('Backend clusters sync fallback to mock:', e);
      }

      // 2. Wallet & Ledger
      try {
        const walletData = await getCorporateWallet();
        if (isMounted && walletData) {
          if (typeof walletData.available_balance === 'number') {
            setDepositBalance(walletData.available_balance);
          }
          if (Array.isArray(walletData.transactions) && walletData.transactions.length > 0) {
            setLedgerTransactions(walletData.transactions);
          }
        }
      } catch (e) {
        console.warn('Backend corporate wallet sync fallback to mock:', e);
      }

      // 3. Certificates
      try {
        const certData = await getCorporateCertificates();
        if (isMounted && Array.isArray(certData) && certData.length > 0) {
          setCertificates(certData);
          const totalTons = certData.reduce((acc, c) => acc + (c.quantity || 0), 0);
          if (totalTons > 0) setRetiredCarbon(totalTons);
        }
      } catch (e) {
        console.warn('Backend corporate certs sync fallback to mock:', e);
      }
    }

    loadBackendData();
    return () => { isMounted = false; };
  }, []);

  // Modals state
  const [selectedClusterForDrawer, setSelectedClusterForDrawer] = useState(null);
  const [selectedClusterForCheckout, setSelectedClusterForCheckout] = useState(null);
  const [selectedCertificateForPreview, setSelectedCertificateForPreview] = useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Toast feedback banner
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle checkout purchase with real Backend persistence
  const handleCheckoutSuccess = async (newPurchase) => {
    try {
      // Hit backend checkout API
      if (newPurchase.clusterId && newPurchase.quantity) {
        const backendRes = await checkoutCarbonOffset({
          cluster_id: newPurchase.clusterId,
          quantity_tco2e: newPurchase.quantity,
          target_emission_year: 2026
        });
        if (backendRes && backendRes.new_balance !== undefined) {
          setDepositBalance(backendRes.new_balance);
        }
        showToast(`Pembelian & Pensiun ${newPurchase.quantity} tCO2e BERHASIL dibukukan ke Ledger Pusat!`);
      }
    } catch (apiErr) {
      console.warn('Checkout backend fallback to local state:', apiErr);
      setDepositBalance(prev => prev - newPurchase.totalCost);
      showToast(`Transaksi diproses lokal (Server offline): ${newPurchase.quantity} tCO2e`);
    }

    setRetiredCarbon(prev => prev + newPurchase.quantity);
    if (onRetire) onRetire(newPurchase.quantity);

    setCertificates(prev => [newPurchase, ...prev]);

    const newLedger = {
      id: `TXN-${Date.now().toString().slice(-8)}`,
      date: `Hari Ini, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      description: `Manual Checkout: ${newPurchase.quantity} tCO2e ${newPurchase.clusterName}`,
      referenceId: newPurchase.uuid,
      type: 'debit',
      amount: newPurchase.totalCost,
      balanceAfter: depositBalance - newPurchase.totalCost,
      status: 'Berhasil Didebet',
      method: 'Pre-funded Escrow',
      invoiceNumber: `INV/2026/TK/${Math.floor(1000 + Math.random() * 9000)}`
    };
    setLedgerTransactions(prev => [newLedger, ...prev]);
  };

  // Handle simulated API hit
  const handleSimulateWebhookHit = ({ tons, cost, cluster, uuid }) => {
    setDepositBalance(prev => Math.max(0, prev - cost));
    setRetiredCarbon(prev => prev + tons);

    if (onRetire) {
      onRetire(tons);
    }

    const autoCert = {
      uuid: uuid,
      companyName: activeUser?.company_name || activeUser?.full_name || 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: cluster,
      vintage: '2026',
      quantity: tons,
      totalCost: cost,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Auto-Buy API',
      date: 'Hari Ini',
      srnRef: `ID-SRN-${Math.floor(10000 + Math.random() * 90000)}`
    };
    setCertificates(prev => [autoCert, ...prev]);

    const autoLedger = {
      id: `TXN-${Date.now().toString().slice(-8)}`,
      date: `Hari Ini, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      description: `Auto-Buy API: Penebusan ${tons} tCO2e ${cluster}`,
      referenceId: uuid,
      type: 'debit',
      amount: cost,
      balanceAfter: depositBalance - cost,
      status: 'Berhasil Didebet',
      method: 'Auto-Buy API Payload',
      invoiceNumber: `INV/2026/TK/${Math.floor(1000 + Math.random() * 9000)}`
    };
    setLedgerTransactions(prev => [autoLedger, ...prev]);
  };

  // Handle topup deposit with real Backend persistence
  const handleTopUpSuccess = async (amount, bank) => {
    const bankNameMap = {
      mandiri: 'Bank Mandiri Corporate VA',
      bri: 'Bank BRI Corporate VA',
      bca: 'BCA KlikBisnis VA'
    };
    const bankDesc = bankNameMap[bank] || 'Bank Virtual Account';

    try {
      const topupRes = await topUpCorporateDeposit(amount, bankDesc);
      if (topupRes && topupRes.new_balance !== undefined) {
        setDepositBalance(topupRes.new_balance);
      } else {
        setDepositBalance(prev => prev + amount);
      }
      showToast(`Deposit Rp ${amount.toLocaleString('id-ID')} berhasil diverifikasi sistem!`);
    } catch (topupErr) {
      console.warn('Topup backend fallback to local state:', topupErr);
      setDepositBalance(prev => prev + amount);
      showToast(`Deposit Rp ${amount.toLocaleString('id-ID')} dicatat secara lokal.`);
    }

    const ledgerRecord = {
      id: `DEP-${Date.now().toString().slice(-8)}`,
      date: `Hari Ini, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      description: `Top-Up Pre-Funded Deposit via ${bankNameMap[bank] || 'Virtual Account'}`,
      referenceId: `DEP-${bank.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'credit',
      amount: amount,
      balanceAfter: depositBalance + amount,
      status: 'Terverifikasi Bank',
      method: bankNameMap[bank] || 'Bank Virtual Account',
      invoiceNumber: `RCP/2026/TK/${Math.floor(1000 + Math.random() * 9000)}`
    };
    setLedgerTransactions(prev => [ledgerRecord, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#ECEFF3] text-slate-800 flex font-sans antialiased">
      {/* 1. FIXED LEFT SIDEBAR (Identik dengan format layout FarmerSidebar) */}
      <CorporateSidebar
        currentUser={activeUser}
        onLogout={onLogout}
        currentTab={currentTab}
        onSelectTab={(tabId) => setCurrentTab(tabId)}
        onOpenCompanyProfile={() => setShowProfileModal(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. MAIN WORKSPACE WRAPPER (Framed Bento Container Identik dengan Petani) */}
      <main className="min-w-0 flex-1 lg:ml-64 p-2.5 sm:p-4 lg:p-6 pb-28 lg:pb-8">
        <div className="bg-[#F8FAFC] rounded-[24px] sm:rounded-[28px] border border-white/90 shadow-xs p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-3rem)]">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed top-6 right-6 z-50 bg-[#0F1E2E] text-white px-4 py-3 rounded-2xl shadow-xl border border-sky-400/30 flex items-center gap-2.5 text-xs animate-slide-up max-w-md">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-medium flex-1">{toastMessage}</span>
              <button 
                onClick={() => setToastMessage(null)}
                className="text-white/60 hover:text-white p-1 rounded-md transition cursor-pointer"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* DYNAMIC PAGE ROUTING (5 HALAMAN UTAMA) WITH SMOOTH TRANSITION */}
          <div key={currentTab} className="page-enter">
            {currentTab === 'dashboard' && (
              <CompanyDashboardView
                onNavigateTab={(tab) => setCurrentTab(tab)}
                depositBalance={depositBalance}
                retiredCarbon={retiredCarbon}
                onOpenTopUpModal={() => setShowTopUpModal(true)}
              />
            )}

            {currentTab === 'marketplace' && (
              <CarbonMarketplaceView
                onSelectClusterForDetail={(cluster) => setSelectedClusterForDrawer(cluster)}
                onSelectClusterForCheckout={(cluster) => setSelectedClusterForCheckout(cluster)}
              />
            )}

            {currentTab === 'certificates' && (
              <CertificateRegistryView
                certificates={certificates}
                onViewCertificate={(cert) => setSelectedCertificateForPreview(cert)}
                onToast={showToast}
              />
            )}

            {currentTab === 'integrations' && (
              <ErpIntegrationView
                depositBalance={depositBalance}
                onSimulateWebhookHit={handleSimulateWebhookHit}
                onToast={showToast}
              />
            )}

            {currentTab === 'wallet' && (
              <CorporateWalletView
                depositBalance={depositBalance}
                onOpenTopUpModal={() => setShowTopUpModal(true)}
                ledgerTransactions={ledgerTransactions}
                onToast={showToast}
              />
            )}
          </div>
        </div>
      </main>

      {/* 
        ========================================================================
        MODALS & SLIDE-OVERS (ENTERPRISE-GRADE, INTERACTIVE & FUNCTIONAL)
        ========================================================================
      */}

      {/* Drawer: Detail Klaster */}
      {selectedClusterForDrawer && (
        <ClusterDetailDrawer
          cluster={selectedClusterForDrawer}
          onClose={() => setSelectedClusterForDrawer(null)}
          onBuyClick={(cluster) => {
            setSelectedClusterForDrawer(null);
            setSelectedClusterForCheckout(cluster);
          }}
        />
      )}

      {/* Modal: Checkout Pembelian Karbon Eceran */}
      {selectedClusterForCheckout && (
        <CarbonCheckoutModal
          cluster={selectedClusterForCheckout}
          depositBalance={depositBalance}
          onClose={() => setSelectedClusterForCheckout(null)}
          onSuccess={handleCheckoutSuccess}
          onToast={showToast}
        />
      )}

      {/* Modal: Pratinjau Sertifikat Resmi & Validasi QR */}
      {selectedCertificateForPreview && (
        <CertificatePreviewModal
          certificate={selectedCertificateForPreview}
          onClose={() => setSelectedCertificateForPreview(null)}
          onToast={showToast}
        />
      )}

      {/* Modal: Top-Up Saldo Pre-Funded Deposit */}
      {showTopUpModal && (
        <TopUpDepositModal
          onClose={() => setShowTopUpModal(false)}
          onTopUpSuccess={handleTopUpSuccess}
          onToast={showToast}
        />
      )}

      {/* Modal: Profil Entitas Korporat (Interactive View & Edit Mode) */}
      {showProfileModal && (
        <CorporateProfileModal
          currentUser={activeUser}
          onLogout={onLogout}
          onClose={() => setShowProfileModal(false)}
          onToast={showToast}
          onProfileUpdated={(updated) => {
            setActiveUser(prev => ({ ...prev, ...updated }));
          }}
        />
      )}

      {/* 4. Floating Mobile Bottom Bar (Auto hidden when any modal is open) */}
      {!showProfileModal && !selectedClusterForDrawer && !selectedClusterForCheckout && !selectedCertificateForPreview && !showTopUpModal && (
        <CorporateMobileNav 
          currentTab={currentTab} 
          onSelectTab={(tabId) => setCurrentTab(tabId)} 
          onLogout={onLogout}
        />
      )}
    </div>
  );
}
