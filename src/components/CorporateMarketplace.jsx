import React, { useState, useEffect } from 'react';
import CorporateSidebar from './corporate/CorporateSidebar';
import CorporateTopBar from './corporate/CorporateTopBar';
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
  Building2, 
  X, 
  Download, 
  ShieldCheck, 
  ExternalLink,
  CheckCircle2,
  Bell,
  Sparkles
} from 'lucide-react';
import { formatRupiah } from '../data';

// ============================================================================
// MODAL: PROFIL ENTITAS PERUSAHAAN (PT Industri Hijau Nusantara Tbk)
// ============================================================================
function CorporateProfileModal({ onClose, onToast }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#14382C] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 text-emerald-300 font-bold font-mono">
              IHN
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest font-mono">
                SRN-PPI VERIFIED BUYER
              </span>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                PT Industri Hijau Nusantara (Tbk)
              </h3>
              <p className="text-xs text-emerald-200/80">Directorate of Sustainability &amp; ESG</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold font-mono">Kode Entitas IDX</span>
              <strong className="text-[#14382C] font-bold text-sm font-mono">IDX: IHN</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold font-mono">No. Akun SRN-PPI</span>
              <strong className="text-[#14382C] font-bold text-sm font-mono">ID-SRN-CORP-0182</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold font-mono">Target Net-Zero</span>
              <strong className="text-emerald-700 font-bold text-sm">Scope 1 &amp; 2 (2030)</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold font-mono">Kepatuhan Regulasi</span>
              <strong className="text-[#14382C] font-bold text-sm">POJK No. 51/2017</strong>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block font-mono">
              Pejabat Otorisasi Pelaporan ESG
            </span>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600">VP ESG &amp; Sustainability:</span>
              <strong className="text-slate-900">Ir. Budi Santoso, M.Env.</strong>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Email Verifikasi Audit:</span>
              <span className="font-mono text-emerald-800 font-semibold">esg-offset@industrihijau.co.id</span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => {
                if (onToast) onToast('Dokumen Kepatuhan POJK 51/2017 berhasil diunduh (PDF).');
                onClose();
              }}
              className="flex-1 py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh Dokumen Kepatuhan POJK 51</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: CorporateMarketplace (B2B ESG Portal Orchestrator)
// ============================================================================
export default function CorporateMarketplace({
  totalRetired = 1200,
  onRetire,
  onBack,
  onNavigateRole
}) {
  // 1. Navigation state (5 primary enterprise menus)
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 2. Financial & emission balance state
  const [depositBalance, setDepositBalance] = useState(250000000);
  const [retiredCarbon, setRetiredCarbon] = useState(totalRetired || 1200);

  // 3. Certificates state
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

  // 4. Ledger mutations history
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

  // 5. Modals & Drawer state
  const [selectedClusterForDrawer, setSelectedClusterForDrawer] = useState(null);
  const [selectedClusterForCheckout, setSelectedClusterForCheckout] = useState(null);
  const [selectedCertificateForPreview, setSelectedCertificateForPreview] = useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 6. Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // 7. Actions & Handlers
  const handleCheckoutSuccess = (newPurchase) => {
    // If paid with wallet, deduct deposit
    if (newPurchase.paymentMethod === 'Pre-funded Wallet') {
      setDepositBalance(prev => Math.max(0, prev - newPurchase.totalCost));
    }
    // Increment retired carbon
    setRetiredCarbon(prev => prev + newPurchase.quantity);
    if (onRetire) onRetire(newPurchase.quantity);

    // Prepend certificate
    const certRecord = {
      uuid: newPurchase.uuid,
      companyName: newPurchase.companyName,
      clusterName: newPurchase.clusterName,
      vintage: newPurchase.vintage,
      quantity: newPurchase.quantity,
      totalCost: newPurchase.totalCost,
      status: `RETIRED • Terkunci Tahun Buku ${newPurchase.vintage}`,
      source: newPurchase.source,
      date: newPurchase.date,
      srnRef: `ID-SRN-${newPurchase.vintage}-${Math.floor(10000 + Math.random() * 90000)}`
    };
    setCertificates(prev => [certRecord, ...prev]);

    // Prepend ledger record
    const ledgerRecord = {
      id: `TXN-${Date.now().toString().slice(-8)}`,
      date: `${newPurchase.date}, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      description: `Manual Checkout: ${newPurchase.quantity} tCO2e ${newPurchase.clusterName}`,
      referenceId: newPurchase.uuid,
      type: 'debit',
      amount: newPurchase.totalCost,
      balanceAfter: depositBalance - (newPurchase.paymentMethod === 'Pre-funded Wallet' ? newPurchase.totalCost : 0),
      status: 'Berhasil Didebet',
      method: newPurchase.paymentMethod,
      invoiceNumber: `INV/2026/TK/${Math.floor(1000 + Math.random() * 9000)}`
    };
    setLedgerTransactions(prev => [ledgerRecord, ...prev]);
  };

  const handleSimulateWebhookHit = (tonnage, cost, newUuid) => {
    // Deduct from deposit
    setDepositBalance(prev => Math.max(0, prev - cost));
    // Increment retired carbon
    setRetiredCarbon(prev => prev + tonnage);
    if (onRetire) onRetire(tonnage);

    // Create certificate
    const certRecord = {
      uuid: newUuid,
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: 'Klaster Dusun Garung - Wonosobo',
      vintage: '2026',
      quantity: tonnage,
      totalCost: cost,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Auto-Buy API',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      srnRef: `ID-SRN-2026-${Math.floor(10000 + Math.random() * 90000)}`
    };
    setCertificates(prev => [certRecord, ...prev]);

    // Record ledger
    const ledgerRecord = {
      id: `TXN-${Date.now().toString().slice(-8)}`,
      date: `Hari Ini, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      description: `Auto-Buy API: Penebusan ${tonnage} tCO2e Klaster Garung Wonosobo`,
      referenceId: newUuid,
      type: 'debit',
      amount: cost,
      balanceAfter: depositBalance - cost,
      status: 'Berhasil Didebet',
      method: 'Auto-Buy API Payload',
      invoiceNumber: `INV/2026/TK/API/${Math.floor(1000 + Math.random() * 9000)}`
    };
    setLedgerTransactions(prev => [ledgerRecord, ...prev]);
  };

  const handleTopUpSuccess = (amount, bank) => {
    setDepositBalance(prev => prev + amount);

    const bankNameMap = {
      mandiri: 'Bank Mandiri Corporate VA',
      bri: 'BRI Corporate VA',
      bca: 'BCA KlikBisnis VA'
    };

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

  const handleRoleSwitch = (targetRole) => {
    if (onNavigateRole) {
      onNavigateRole(targetRole);
    } else if (targetRole === 'landing' && onBack) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#14382C] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/30 flex items-center gap-3 animate-slide-in-right max-w-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* 1. Left Sidebar Navigation (Desktop-First Enterprise Sidebar) */}
      <CorporateSidebar
        currentTab={currentTab}
        onSelectTab={(tabId) => setCurrentTab(tabId)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenCompanyProfile={() => setShowProfileModal(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* 2. Topbar Kontekstual */}
        <CorporateTopBar
          onNavigateRole={handleRoleSwitch}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setMobileMenuOpen(prev => !prev)}
          apiConnected={true}
        />

        {/* 3. Dynamic Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* HALAMAN 1: Overview & Neraca Emisi */}
          {currentTab === 'dashboard' && (
            <CompanyDashboardView
              onNavigateTab={(tab) => setCurrentTab(tab)}
              depositBalance={depositBalance}
              retiredCarbon={retiredCarbon}
              onOpenTopUpModal={() => setShowTopUpModal(true)}
            />
          )}

          {/* HALAMAN 2: Bursa Katalog Klaster */}
          {currentTab === 'marketplace' && (
            <CarbonMarketplaceView
              onSelectClusterForDetail={(cluster) => setSelectedClusterForDrawer(cluster)}
              onSelectClusterForCheckout={(cluster) => setSelectedClusterForCheckout(cluster)}
            />
          )}

          {/* HALAMAN 3: Repositori Sertifikat & Audit ESG */}
          {currentTab === 'certificates' && (
            <CertificateRegistryView
              certificates={certificates}
              onViewCertificate={(cert) => setSelectedCertificateForPreview(cert)}
              onToast={showToast}
            />
          )}

          {/* HALAMAN 4: Integrasi ERP & Developer API */}
          {currentTab === 'integrations' && (
            <ErpIntegrationView
              depositBalance={depositBalance}
              onSimulateWebhookHit={handleSimulateWebhookHit}
              onToast={showToast}
            />
          )}

          {/* HALAMAN 5: Dompet Korporat & Billing */}
          {currentTab === 'wallet' && (
            <CorporateWalletView
              depositBalance={depositBalance}
              onOpenTopUpModal={() => setShowTopUpModal(true)}
              ledgerTransactions={ledgerTransactions}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* 
        ========================================================================
        MODALS & SLIDE-OVERS (ENTERPRISE-GRADE, INTERACTIVE & FUNCTIONAL)
        ========================================================================
      */}

      {/* Drawer: Detail Klaster & Transparansi 88% */}
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

      {/* Modal: Checkout Pembelian Karbon Eceran (Fractional) */}
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

      {/* Modal: Profil Entitas Perusahaan (PT Industri Hijau Nusantara Tbk) */}
      {showProfileModal && (
        <CorporateProfileModal
          onClose={() => setShowProfileModal(false)}
          onToast={showToast}
        />
      )}
    </div>
  );
}
