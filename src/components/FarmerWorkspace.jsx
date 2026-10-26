import React, { useState } from 'react';
import FarmerTopBar from './farmer/FarmerTopBar';
import FarmerSidebar from './farmer/FarmerSidebar';
import FarmerMobileNav from './farmer/FarmerMobileNav';
import FarmerDashboardView from './farmer/FarmerDashboardView';
import LandManagementView from './farmer/LandManagementView';
import LandRegistrationWizard from './farmer/LandRegistrationWizard';
import VerificationTimelineView from './farmer/VerificationTimelineView';
import FarmerWalletView from './farmer/FarmerWalletView';
import SamplePhotoModal from './farmer/SamplePhotoModal';
import ViewfinderModal from './farmer/ViewfinderModal';
import WithdrawalModal from './farmer/WithdrawalModal';
import TransferReceiptModal from './farmer/TransferReceiptModal';
import { 
  X, 
  Globe, 
  Leaf, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  Calendar 
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

// Compact Profile Modal for Pak Joko Widodo
function FarmerProfileModal({ onClose, onToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-emerald-400 shrink-0">
              <img src="/pak-joko.jpg" alt="Pak Joko Widodo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Profil Mitra Tani</span>
              <h3 className="font-extrabold text-white text-base">Pak Joko Widodo</h3>
              <p className="text-xs text-emerald-200/80">Ketua Regu Petani Karbon Garung</p>
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
              <strong className="text-[#14382C] text-sm font-bold">#TK-WNSB-042</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Kelompok Tani</span>
              <strong className="text-[#14382C] text-sm font-bold">Gapoktan Wono Subur</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Domisili Lahan</span>
              <strong className="text-[#14382C] text-sm font-bold">Dusun Garung, Wonosobo</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Total Lahan</span>
              <strong className="text-emerald-700 text-sm font-bold">1.2 Hektar (2 Petak)</strong>
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">Rekening Penarikan Terdaftar</span>
            <div className="flex items-center justify-between py-1 border-b border-stone-200/60">
              <span className="font-semibold text-blue-900">Bank BRI (Rek. ****4821)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-semibold text-sky-900">DANA e-Wallet (0812-****-7890)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span>
            </div>
          </div>

          <button
            onClick={() => {
              onToast('Data profil Pak Joko Widodo terverifikasi sesuai KTP & SHM.');
              onClose();
            }}
            className="w-full py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            Tutup Profil
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FarmerWorkspace({
  walletBalance = 3250000,
  onUpdateBalance,
  trees = [],
  onAddTree,
  onBack,
  onNavigateRole
}) {
  // Navigation tab state: 'dashboard' | 'land' | 'wizard' | 'timeline' | 'wallet'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Financial state
  const [currentAvailableBalance, setCurrentAvailableBalance] = useState(walletBalance || 3250000);
  const [escrowBalance, setEscrowBalance] = useState(1450000);
  const [transactions, setTransactions] = useState([]);

  // Modals state
  const [selectedSampleTree, setSelectedSampleTree] = useState(null);
  const [viewfinderConfig, setViewfinderConfig] = useState(null); // { index, photo, onSave }
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

  // Handle successful withdrawal from modal
  const handleWithdrawSuccess = (amount, newTx) => {
    const updatedBalance = currentAvailableBalance - amount;
    setCurrentAvailableBalance(updatedBalance);
    if (onUpdateBalance) onUpdateBalance(updatedBalance);
    setTransactions(prev => [newTx, ...prev]);
  };

  // Handle completion of wizard
  const handleWizardComplete = (newPlotData) => {
    // Add to custom plots in Land Management
    const newPlotEntry = {
      id: `plot-${Date.now()}`,
      name: newPlotData.name,
      areaHa: newPlotData.areaHa,
      areaM2: newPlotData.areaM2,
      coordinates: '-7.3640, 109.9888',
      elevation: '920 mdpl',
      status: 'pending',
      statusLabel: '● Menunggu Verifikasi',
      totalTrees: newPlotData.totalTrees,
      totalCarbon: newPlotData.estimatedAbsorption,
      annualRevenue: newPlotData.farmerNetRevenue,
      satelliteImage: '/canopy-tree.jpg',
      blocks: [
        {
          key: `block-${Date.now()}`,
          variety: `Blok ${newPlotData.species} (${newPlotData.totalTrees} Pohon)`,
          species: newPlotData.species,
          population: newPlotData.totalTrees,
          avgAge: `${2026 - parseInt(newPlotData.plantYear || '2020')} Tahun`,
          avgDbh: `${(newPlotData.samples.reduce((a, s) => a + (parseFloat(s.dbh) || 35), 0) / newPlotData.samples.length).toFixed(1)} cm`,
          carbonContribution: `${newPlotData.estimatedAbsorption} tCO2e/thn`,
          revenueContribution: `Rp ${newPlotData.farmerNetRevenue.toLocaleString('id-ID')}/thn`,
          treeData: {
            id: `TK-NEW-${Date.now().toString().slice(-4)}`,
            species: newPlotData.species,
            age: 2026 - parseInt(newPlotData.plantYear || '2020'),
            dbh: 38,
            co2PerYear: newPlotData.estimatedAbsorption,
            samplePhoto: newPlotData.samples[0]?.photo || '/tree-dbh-sample.jpg'
          }
        }
      ]
    };

    setCustomPlots(prev => [newPlotEntry, ...prev]);
    setNewlySubmittedPlot(newPlotData);
    showToast(`Lahan "${newPlotData.name}" berhasil diajukan untuk verifikasi satelit!`);
    // Automatically transition to Halaman 4: Lacak Verifikasi
    setActiveTab('timeline');
  };

  // Handle saving draft in wizard
  const handleWizardDraft = (draftData) => {
    showToast(`Draft lahan "${draftData.name}" berhasil disimpan lokal.`);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F2] text-[#173829] flex flex-col">
      {/* Global Topbar */}
      <FarmerTopBar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigateRole={(target) => {
          if (onNavigateRole) onNavigateRole(target);
          else if (onBack) onBack();
        }}
        activeTabTitle={activeTab}
      />

      <div className="flex-1 flex w-full">
        {/* Desktop Collapsible Left Sidebar (>= 768px) */}
        <FarmerSidebar
          currentTab={activeTab}
          onSelectTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenProfile={() => setShowProfileModal(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 w-full overflow-x-hidden">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed top-16 right-4 z-50 bg-[#14382C] text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-400/40 flex items-center gap-2.5 text-xs animate-slide-up max-w-md">
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
              onNavigateTab={setActiveTab}
              onOpenSatelliteModal={() => setShowSatelliteModal(true)}
              availableBalance={currentAvailableBalance}
              escrowBalance={escrowBalance}
            />
          )}

          {activeTab === 'land' && (
            <LandManagementView
              customPlots={customPlots}
              onNavigateTab={setActiveTab}
              onOpenSamplePhoto={(tree) => setSelectedSampleTree(tree)}
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
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation Bar (< 768px) */}
      <FarmerMobileNav
        currentTab={activeTab}
        onSelectTab={setActiveTab}
      />

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
