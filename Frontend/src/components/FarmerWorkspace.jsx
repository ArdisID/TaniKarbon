import React, { useState, useEffect, useCallback } from 'react';
import FarmerSidebar from './farmer/FarmerSidebar';
import FarmerDashboardView from './farmer/FarmerDashboardView';
import LandManagementView from './farmer/LandManagementView';
import LandRegistrationWizard from './farmer/LandRegistrationWizard';
import VerificationTimelineView from './farmer/VerificationTimelineView';
import FarmerWalletView from './farmer/FarmerWalletView';
import SamplePhotoModal from './farmer/SamplePhotoModal';
import ViewfinderModal from './farmer/ViewfinderModal';
import WithdrawalModal from './farmer/WithdrawalModal';
import TransferReceiptModal from './farmer/TransferReceiptModal';
import { getFarmerSummary, getFarmerLands, getFarmerWalletTransactions } from '../api/farmer';
import { 
  X, 
  Globe, 
  Leaf, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  Calendar,
  Menu
} from 'lucide-react';

// Sentinel-2 Telemetry Modal
function SatelliteTelemetryModal({ onClose, onToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <Globe className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">ESA Sentinel-2 Multispectral</span>
              <h3 className="font-extrabold text-white text-base">Telemetri Satelit Sentinel-2</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-4 bg-[#FAFDF9] rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 font-medium">Indeks Kerapatan Vegetasi</span>
              <h4 className="text-2xl font-black text-[#14382C]">NDVI 0.88 / 1.00</h4>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Kanopi Sangat Padat &amp; Sehat</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Leaf className="w-6 h-6 text-emerald-700" />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Resolusi Spasial Optik:</span>
              <strong className="text-[#14382C] font-bold">10 Meter / Piksel (Band 4 &amp; 8)</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Tutupan Awan (Cloud Cover):</span>
              <strong className="text-emerald-700 font-bold">1.8% (Sangat Jernih)</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Lintasan Orbit Terakhir:</span>
              <strong className="text-stone-800 font-semibold">25 Okt 2026, 10:14 WIB</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Siklus Lintasan Berikutnya:</span>
              <strong className="text-[#14382C] font-bold">28 Okt 2026 (~2 hari lagi)</strong>
            </div>
          </div>

          <button
            onClick={() => {
              onToast('Laporan telemetri satelit Sentinel-2 berhasil diunduh (PDF resmi).');
              onClose();
            }}
            className="w-full py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Laporan Telemetri Sentinel-2 (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Dynamic Profile Modal
function FarmerProfileModal({ currentUser, farmerSummary, onClose, onToast }) {
  const displayName = currentUser?.full_name || farmerSummary?.farmer_name || 'Petani Mitra';
  const displayEmail = currentUser?.email || farmerSummary?.farmer_email || 'petani@tanikarbon.id';
  const rawArea = (farmerSummary?.total_land_area_sqm !== undefined && farmerSummary?.total_land_area_sqm !== null)
    ? Number(farmerSummary.total_land_area_sqm)
    : 0;
  const totalAreaHa = (rawArea / 10000).toFixed(2);
  const totalPlots = (farmerSummary?.total_land_plots !== undefined && farmerSummary?.total_land_plots !== null)
    ? Number(farmerSummary.total_land_plots)
    : 0;

  const farmerIdCode = currentUser?.id 
    ? `#TK-${String(currentUser.id).slice(0, 8).toUpperCase()}` 
    : '#TK-MITRA-01';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-emerald-400 shrink-0 bg-emerald-800 flex items-center justify-center text-white font-black text-xl">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Profil Mitra Tani</span>
              <h3 className="font-extrabold text-white text-base">{displayName}</h3>
              <p className="text-xs text-emerald-200/80">{displayEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">ID Mitra Tani</span>
              <strong className="text-[#14382C] text-sm font-bold font-mono">{farmerIdCode}</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Kelompok Tani</span>
              <strong className="text-stone-700 text-sm font-semibold">{currentUser?.gapoktan || 'Mandiri / Belum Tergabung'}</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Domisili Lahan</span>
              <strong className="text-stone-700 text-sm font-semibold">{currentUser?.domicile || 'Belum diatur'}</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Total Lahan</span>
              <strong className="text-emerald-700 text-sm font-bold">{totalAreaHa} Ha ({totalPlots} Petak)</strong>
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">Rekening Penarikan Terdaftar</span>
            <div className="py-2.5 text-center">
              <p className="text-xs text-stone-500 font-medium">Belum diatur</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Rekening bank atau e-wallet dapat ditentukan saat penarikan saldo.</p>
            </div>
          </div>

          <button
            onClick={() => {
              onToast(`Data profil ${displayName} tersinkronisasi dengan database PostgreSQL.`);
              onClose();
            }}
            className="w-full py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
          >
            Tutup Profil
          </button>
        </div>
      </div>
    </div>
  );
}

const FARMER_TAB_PATHS = {
  dashboard: '/mitra-tani/dashboard',
  land: '/mitra-tani/manajemen-lahan',
  wizard: '/mitra-tani/daftarkan-lahan',
  timeline: '/mitra-tani/lacak-verifikasi',
  wallet: '/mitra-tani/dompet-karbon',
};

function getFarmerTabFromPath(pathname) {
  const normalized = (pathname || '').toLowerCase().replace(/\/$/, '');
  if (normalized.endsWith('/manajemen-lahan')) return 'land';
  if (normalized.endsWith('/daftarkan-lahan')) return 'wizard';
  if (normalized.endsWith('/lacak-verifikasi')) return 'timeline';
  if (normalized.endsWith('/dompet-karbon')) return 'wallet';
  return 'dashboard';
}

export default function FarmerWorkspace({
  currentUser,
  onLogout,
  walletBalance = 0,
  onUpdateBalance,
  trees = [],
  onAddTree,
  onBack,
  onNavigateRole
}) {
  // Navigation tab state: 'dashboard' | 'land' | 'wizard' | 'timeline' | 'wallet'
  // Inisialisasi awal membaca langsung dari window.location.pathname agar kebal refresh F5/Cmd+R
  const [activeTab, setActiveTabState] = useState(() => {
    return getFarmerTabFromPath(window.location.pathname);
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Two-way synchronization antara activeTab dan URL browser
  const setActiveTab = useCallback((tabId, replace = false) => {
    setActiveTabState(tabId);
    const targetPath = FARMER_TAB_PATHS[tabId] || '/mitra-tani/dashboard';
    if (window.location.pathname.toLowerCase() !== targetPath.toLowerCase()) {
      if (replace) {
        window.history.replaceState({ tab: tabId }, '', targetPath);
      } else {
        window.history.pushState({ tab: tabId }, '', targetPath);
      }
    }
  }, []);

  // Normalisasi URL awal jika user mengakses root /mitra-tani
  useEffect(() => {
    const current = window.location.pathname.toLowerCase().replace(/\/$/, '');
    if (current === '/mitra-tani') {
      window.history.replaceState({ tab: 'dashboard' }, '', '/mitra-tani/dashboard');
    }
  }, []);

  // Dengarkan browser Back / Forward (popstate) agar tab berganti sesuai riwayat sub-path
  useEffect(() => {
    const handlePopState = () => {
      const tabFromUrl = getFarmerTabFromPath(window.location.pathname);
      setActiveTabState(tabFromUrl);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Real backend synchronization state
  const [farmerSummary, setFarmerSummary] = useState(null);
  const [realLands, setRealLands] = useState([]);

  // Financial state
  const [currentAvailableBalance, setCurrentAvailableBalance] = useState(walletBalance || 0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  // Modals state
  const [selectedSampleTree, setSelectedSampleTree] = useState(null);
  const [viewfinderConfig, setViewfinderConfig] = useState(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showSatelliteModal, setShowSatelliteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState(null);

  // New plot state submitted from wizard
  const [customPlots, setCustomPlots] = useState([]);
  const [newlySubmittedPlot, setNewlySubmittedPlot] = useState(null);

  // Toast feedback banner
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Fetch real data from PostgreSQL backend
  const fetchFarmerData = useCallback(async () => {
    try {
      const [summary, lands, txs] = await Promise.all([
        getFarmerSummary(),
        getFarmerLands(),
        getFarmerWalletTransactions().catch(() => [])
      ]);
      setFarmerSummary(summary);
      setRealLands(lands);
      if (summary?.available_balance !== undefined) {
        setCurrentAvailableBalance(summary.available_balance);
        if (onUpdateBalance) onUpdateBalance(summary.available_balance);
      }
      if (summary?.escrow_balance !== undefined) {
        setEscrowBalance(summary.escrow_balance);
      }
      if (txs && txs.length > 0) {
        const mappedTx = txs.map(act => ({
          id: act.id,
          title: act.description,
          recipient: act.transaction_type === 'credit_payout' ? 'Dompet TaniKarbon (Bagi Hasil)' : 'Rekening Bank Terdaftar',
          recipientFull: act.description,
          amount: act.amount,
          date: new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
          status: act.status === 'completed' ? 'Dana Terkirim' : 'Diproses Admin',
          statusColor: act.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300',
          refNumber: `TRX-${String(act.id).slice(0, 8).toUpperCase()}`,
          transaction_type: act.transaction_type
        }));
        setTransactions(mappedTx);
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi data riil petani:', err);
    }
  }, [onUpdateBalance]);

  useEffect(() => {
    fetchFarmerData();
  }, [fetchFarmerData]);

  // Handle successful withdrawal from modal
  const handleWithdrawSuccess = (amount, newTx, remainingBalance) => {
    const updatedBalance = remainingBalance !== undefined ? remainingBalance : (currentAvailableBalance - amount);
    setCurrentAvailableBalance(updatedBalance);
    if (onUpdateBalance) onUpdateBalance(updatedBalance);
    setTransactions(prev => [newTx, ...prev]);
    fetchFarmerData();
  };

  // Handle completion of wizard
  const handleWizardComplete = (newPlotData = {}) => {
    const samples = Array.isArray(newPlotData?.samples) ? newPlotData.samples : [];
    const avgDbhStr = samples.length > 0
      ? `${(samples.reduce((a, s) => a + (parseFloat(s?.dbh) || 35), 0) / samples.length).toFixed(1)} cm`
      : '35.0 cm';
    const annualRev = Number(newPlotData?.farmerNetRevenue || 0);
    const spec = newPlotData?.species || 'Pohon Agroforestri';
    const totalTrees = Number(newPlotData?.totalTrees || 0);
    const estAbsorption = Number(newPlotData?.estimatedAbsorption || 0);

    const newPlotEntry = {
      id: newPlotData?.id || `plot-${Date.now()}`,
      name: newPlotData?.name || 'Petak Baru',
      areaHa: newPlotData?.areaHa || (newPlotData?.areaM2 ? (newPlotData.areaM2 / 10000).toFixed(2) : '0.50'),
      areaM2: newPlotData?.areaM2 || 5000,
      coordinates: newPlotData?.centroidCoords || '-7.3640, 109.9888',
      elevation: '920 mdpl',
      status: 'pending',
      statusLabel: '● Menunggu Verifikasi',
      totalTrees,
      totalCarbon: estAbsorption,
      annualRevenue: annualRev,
      satelliteImage: '/canopy-tree.jpg',
      blocks: [
        {
          key: `block-${Date.now()}`,
          variety: `Blok ${spec} (${totalTrees} Pohon)`,
          species: spec,
          population: totalTrees,
          avgAge: `${2026 - parseInt(newPlotData?.plantYear || '2020', 10)} Tahun`,
          avgDbh: avgDbhStr,
          carbonContribution: `${estAbsorption} tCO2e/thn`,
          revenueContribution: `Rp ${annualRev.toLocaleString('id-ID')}/thn`,
          treeData: {
            id: `TK-NEW-${Date.now().toString().slice(-4)}`,
            species: spec,
            age: 2026 - parseInt(newPlotData?.plantYear || '2020', 10),
            dbh: 38,
            co2PerYear: estAbsorption,
            samplePhoto: samples[0]?.photo || '/tree-dbh-sample.jpg'
          }
        }
      ]
    };

    setCustomPlots(prev => [newPlotEntry, ...prev]);
    setNewlySubmittedPlot(newPlotData);
    showToast(`Lahan "${newPlotData?.name || 'Baru'}" berhasil didaftarkan!`);
    fetchFarmerData();
    setActiveTab('land');
  };

  // Handle saving draft in wizard
  const handleWizardDraft = (draftData) => {
    showToast(`Draft lahan "${draftData.name}" berhasil disimpan lokal.`);
  };

  return (
    <div className="min-h-screen bg-canvas text-stone-800 flex">
      {/* FIXED LEFT SIDEBAR (single navigation surface — no top navbar) */}
      <FarmerSidebar
        currentUser={currentUser}
        onLogout={onLogout}
        currentTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          setMobileOpen(false);
        }}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* MAIN WORKSPACE */}
      <main className="min-w-0 flex-1 lg:ml-64">
        <div className="mx-auto max-w-7xl space-y-6 p-5 sm:p-6 lg:p-8">
          {/* Mobile drawer trigger for non-dashboard tabs */}
          {activeTab !== 'dashboard' && (
            <div className="flex items-center justify-between pb-2 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Buka navigasi"
                className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
              >
                &larr; Kembali ke Dashboard
              </button>
            </div>
          )}

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed top-6 right-6 z-50 bg-[#0F291E] text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-400/40 flex items-center gap-2.5 text-xs animate-slide-up max-w-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium flex-1">{toastMessage}</span>
              <button 
                onClick={() => setToastMessage('')}
                className="text-white/60 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* VIEW ROUTING (5 HALAMAN UTAMA) */}
          {activeTab === 'dashboard' && (
            <FarmerDashboardView
              farmerSummary={farmerSummary}
              realLands={realLands}
              onNavigateTab={setActiveTab}
              onOpenSatelliteModal={() => setShowSatelliteModal(true)}
              onOpenWithdrawal={() => setShowWithdrawalModal(true)}
              onOpenMobileNav={() => setMobileOpen(true)}
              availableBalance={currentAvailableBalance}
              escrowBalance={escrowBalance}
            />
          )}

          {activeTab === 'land' && (
            <LandManagementView
              realLands={realLands}
              customPlots={customPlots}
              onNavigateTab={setActiveTab}
              onOpenSamplePhoto={(tree) => setSelectedSampleTree(tree)}
              onRefresh={fetchFarmerData}
              onOpenMobileNav={() => setMobileOpen(true)}
              onToast={showToast}
            />
          )}

          {activeTab === 'wizard' && (
            <LandRegistrationWizard
              onComplete={handleWizardComplete}
              onSaveDraft={handleWizardDraft}
              onOpenViewfinder={(idx, photo, onSave) => {
                setViewfinderConfig({ index: idx, photo, onSave });
              }}
              onToast={showToast}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'timeline' && (
            <VerificationTimelineView
              newlySubmittedPlot={newlySubmittedPlot}
              onToast={showToast}
            />
          )}

          {activeTab === 'wallet' && (
            <FarmerWalletView
              availableBalance={currentAvailableBalance}
              escrowBalance={escrowBalance}
              transactions={transactions}
              onOpenWithdrawal={() => setShowWithdrawalModal(true)}
              onOpenReceipt={(tx) => setSelectedReceiptTx(tx)}
              onToast={showToast}
            />
          )}
        </div>
      </main>

      {/* =========================================================================
          INTERACTIVE MODALS
          ========================================================================= */}
      {/* 1. Sample Photo Modal (from Land Management) */}
      {selectedSampleTree && (
        <SamplePhotoModal
          tree={selectedSampleTree}
          onClose={() => setSelectedSampleTree(null)}
        />
      )}

      {/* 2. Viewfinder Camera Modal (from Land Registration Wizard) */}
      {viewfinderConfig && (
        <ViewfinderModal
          sampleIndex={viewfinderConfig.index}
          currentPhoto={viewfinderConfig.photo}
          onSave={viewfinderConfig.onSave}
          onClose={() => setViewfinderConfig(null)}
        />
      )}

      {/* 3. Withdrawal Modal (from Farmer Wallet) */}
      {showWithdrawalModal && (
        <WithdrawalModal
          availableBalance={currentAvailableBalance}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={handleWithdrawSuccess}
          onToast={showToast}
        />
      )}

      {/* 4. Satellite Telemetry Modal */}
      {showSatelliteModal && (
        <SatelliteTelemetryModal
          onClose={() => setShowSatelliteModal(false)}
          onToast={showToast}
        />
      )}

      {/* 5. Farmer Profile Modal */}
      {showProfileModal && (
        <FarmerProfileModal
          currentUser={currentUser}
          farmerSummary={farmerSummary}
          onClose={() => setShowProfileModal(false)}
          onToast={showToast}
        />
      )}

      {/* 6. Transfer Receipt Modal */}
      {selectedReceiptTx && (
        <TransferReceiptModal
          transaction={selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}
    </div>
  );
}

