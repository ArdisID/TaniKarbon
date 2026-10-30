import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Landmark, 
  CheckCircle2, 
  Info, 
  Receipt, 
  AlertCircle,
  Building2,
  Smartphone,
  TrendingUp,
  Search,
  Download,
  Copy,
  Check,
  Calendar,
  MessageCircle,
  Plus,
  HelpCircle,
  ExternalLink,
  Leaf,
  X,
  CreditCard
} from 'lucide-react';
import { formatRupiah, formatNumber } from '../../data';
import { 
  getFarmerWallet,
  getFarmerBankAccounts,
  addFarmerBankAccount,
  deleteFarmerBankAccount,
  setPrimaryFarmerBankAccount,
  getFarmerWalletTransactions
} from '../../api/farmer';

// Helper hook for smooth animated number counting
function useAnimatedCounter(endValue, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(easeProgress * endValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);

  return count;
}

export default function FarmerWalletView({ 
  availableBalance = 0, 
  escrowBalance = 0,
  transactions = [],
  onOpenWithdrawal,
  onOpenReceipt,
  onToast 
}) {
  // [INTEGRATION-HOOK: ROLE_ADMIN (FINANCE & ESCROW PAYOUT) & ROLE_CORPORATE (CARBON BUYER)]
  const [walletData, setWalletData] = useState({
    available_balance: availableBalance || 0,
    escrow_balance: escrowBalance || 0,
    recent_transactions: transactions || []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(true);

  // New interactive states for the 5 requested wallet features
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'credit' | 'debit'
  const [copiedAccountId, setCopiedAccountId] = useState(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // Saved Payout Accounts dari PostgreSQL
  const [savedAccounts, setSavedAccounts] = useState([]);

  // Form state for adding new account
  const [newAccount, setNewAccount] = useState({
    bankName: 'Bank Mandiri',
    accountNumber: '',
    accountHolder: 'JOKO WIDODO',
    type: 'bank'
  });

  const displayAvailableBalance = Number(availableBalance ?? walletData.available_balance ?? 0);
  const displayEscrowBalance = Number(escrowBalance ?? walletData.escrow_balance ?? 0);
  const animatedAvailable = useAnimatedCounter(displayAvailableBalance, 1400);
  const animatedEscrow = useAnimatedCounter(displayEscrowBalance, 1400);

  const rawTransactions = (walletData?.recent_transactions && walletData.recent_transactions.length > 0)
    ? walletData.recent_transactions
    : (transactions && transactions.length > 0 ? transactions : []);

  const allTransactions = useMemo(() => {
    return rawTransactions.map((tx) => {
      const isCompleted = tx.status === 'completed' || tx.status === 'Dana Terkirim' || String(tx.statusText || '').includes('Berhasil');
      const isPending = tx.status === 'pending' || tx.status === 'Diproses Admin';
      const isFailed = tx.status === 'failed' || tx.status === 'Gagal';

      return {
        ...tx,
        title: tx.title || tx.description || 'Transaksi Dompet',
        method: tx.method || (tx.recipient && tx.recipient.toLowerCase().includes('gopay') ? 'GoPay' : 'Bank BRI'),
        recipient: tx.recipient || (tx.transaction_type === 'credit_payout' ? 'Dompet TaniKarbon (Bagi Hasil)' : 'Rekening Bank Terdaftar'),
        amount: Number(tx.amount || 0),
        date: tx.date || (tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : '—'),
        statusText: isCompleted ? '• Berhasil Ditransfer' : isFailed ? '• Gagal' : '• Diproses Admin',
        statusColor: isCompleted 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
          : isFailed 
          ? 'bg-rose-50 text-rose-700 border-rose-200' 
          : 'bg-amber-50 text-amber-800 border-amber-200',
        refNumber: tx.refNumber || `TRX-${String(tx.id).slice(0, 8).toUpperCase()}`
      };
    });
  }, [rawTransactions]);

  const lifetimeEarnings = useMemo(() => {
    const fromCredits = allTransactions
      .filter(t => t.transaction_type === 'credit_payout' || t.transaction_type === 'credit_deposit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return fromCredits > 0 ? fromCredits : (displayAvailableBalance + displayEscrowBalance);
  }, [allTransactions, displayAvailableBalance, displayEscrowBalance]);

  const animatedLifetime = useAnimatedCounter(lifetimeEarnings, 1500);

  // Filtered transactions based on search query and filter tabs
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      const matchesSearch = 
        tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.refNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.method.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = 
        filterType === 'all' ? true :
        filterType === 'credit' ? tx.transaction_type === 'credit_payout' :
        tx.transaction_type === 'debit_withdrawal';

      return matchesSearch && matchesType;
    });
  }, [allTransactions, searchQuery, filterType]);

  // Handler: Copy Account Number
  const handleCopyAccount = (accNumber, accId) => {
    navigator.clipboard.writeText(accNumber.replace(/[^0-9]/g, ''));
    setCopiedAccountId(accId);
    setTimeout(() => setCopiedAccountId(null), 2000);
    if (onToast) {
      onToast(`Nomor rekening ${accNumber} berhasil disalin!`);
    }
  };

  // Handler: Download Statement Report (CSV)
  const handleDownloadReport = () => {
    try {
      const headers = ['ID Transaksi', 'Tanggal', 'Judul Transaksi', 'Metode Pembayaran', 'Tipe Mutasi', 'Nominal (Rp)', 'Status'];
      const rows = filteredTransactions.map(t => [
        t.refNumber,
        `"${t.date}"`,
        `"${t.title}"`,
        t.method,
        t.transaction_type === 'credit_payout' ? 'Dividen Masuk' : 'Penarikan Keluar',
        t.amount,
        t.statusText.replace('• ', '')
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rekening_Koran_TaniKarbon_Petani_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (onToast) {
        onToast('Rekening koran digital berhasil diunduh (format CSV siap cetak).');
      }
    } catch (err) {
      console.error('Download report error:', err);
    }
  };

  const fetchBankAccounts = useCallback(async () => {
    try {
      const data = await getFarmerBankAccounts();
      if (Array.isArray(data) && data.length > 0) {
        setSavedAccounts(data.map(acc => ({
          id: acc.id,
          bankName: acc.bank_name,
          accountNumber: acc.account_number,
          accountHolder: acc.account_holder_name,
          isPrimary: acc.is_primary,
          isKycVerified: true,
          type: (acc.bank_name || '').toLowerCase().includes('gopay') || (acc.bank_name || '').toLowerCase().includes('dana') ? 'ewallet' : 'bank'
        })));
      } else {
        setSavedAccounts([]);
      }
    } catch (e) {
      console.warn('Gagal memuat bank accounts:', e);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  // Handler: Add New Payout Account via API
  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    if (!newAccount.accountNumber.trim()) return;

    try {
      await addFarmerBankAccount({
        bank_code: newAccount.bankName.slice(0, 4).toUpperCase(),
        bank_name: newAccount.bankName,
        account_number: newAccount.accountNumber.trim(),
        account_holder_name: newAccount.accountHolder.trim() || 'JOKO WIDODO',
        is_primary: savedAccounts.length === 0
      });
      setShowAddAccountModal(false);
      setNewAccount({
        bankName: 'Bank Mandiri',
        accountNumber: '',
        accountHolder: 'JOKO WIDODO',
        type: 'bank'
      });
      await fetchBankAccounts();
      if (onToast) {
        onToast(`Rekening ${newAccount.bankName} berhasil ditambahkan!`);
      }
    } catch (err) {
      if (onToast) {
        onToast(err.message || 'Gagal menambahkan rekening', 'error');
      }
    }
  };

  const handleDeleteAccount = async (accId) => {
    try {
      await deleteFarmerBankAccount(accId);
      await fetchBankAccounts();
      if (onToast) onToast('Rekening bank berhasil dihapus.');
    } catch (err) {
      if (onToast) onToast(err.message || 'Gagal menghapus rekening', 'error');
    }
  };

  const handleSetPrimaryAccount = async (accId) => {
    try {
      await setPrimaryFarmerBankAccount(accId);
      await fetchBankAccounts();
      if (onToast) onToast('Rekening utama berhasil diperbarui.');
    } catch (err) {
      if (onToast) onToast(err.message || 'Gagal mengatur rekening utama', 'error');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchWalletData = async () => {
      setIsLoading(true);
      try {
        const [wData, txData] = await Promise.all([
          getFarmerWallet().catch(() => null),
          getFarmerWalletTransactions().catch(() => [])
        ]);

        if (isMounted) {
          setWalletData({
            available_balance: Number(wData?.available_balance ?? availableBalance ?? 0),
            escrow_balance: Number(wData?.escrow_balance ?? escrowBalance ?? 0),
            recent_transactions: Array.isArray(txData) ? txData : []
          });
          setFetchError(null);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWalletData();
    return () => {
      isMounted = false;
    };
  }, [availableBalance, escrowBalance]);

  useEffect(() => {
    if (availableBalance !== undefined || escrowBalance !== undefined || (transactions && transactions.length > 0)) {
      setWalletData(prev => ({
        available_balance: availableBalance ?? prev.available_balance,
        escrow_balance: escrowBalance ?? prev.escrow_balance,
        recent_transactions: (transactions && transactions.length > 0) ? transactions : prev.recent_transactions
      }));
    }
  }, [availableBalance, escrowBalance, transactions]);

  const handleWithdraw = () => {
    if (onOpenWithdrawal) {
      onOpenWithdrawal();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Fetch Error Banner (jika ada) */}
      {fetchError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Informasi: Menggunakan cadangan data offline dompet mitra ({fetchError})</span>
        </div>
      )}

      {/* Header Halaman */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
              Dompet Karbon &amp; Keuangan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Bagi Hasil 88% Petani
            </span>
          </div>
          <p className="mt-1 text-xs lg:text-sm text-stone-500 font-medium">
            Kelola pencairan dividen kredit karbon, dana escrow klaster, dan riwayat mutasi perbankan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200/80 text-xs font-semibold text-stone-700 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Rekening Terverifikasi: BRI (a.n. Joko Widodo)
          </span>
        </div>
      </header>

      {/* =========================================================================
          FITUR 3: QUICK STATS RIBBON (LIFETIME TOTAL EARNINGS & ON-TIME PAYOUTS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Lifetime Earnings */}
        <div className="relative overflow-hidden rounded-[22px] p-4 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/40 border border-white/80 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-700 shrink-0 shadow-inner">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
              Total Dividen Akumulasi
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <div className="flex items-baseline">
                <span className="text-sm font-bold text-stone-600 mr-1 font-sans">Rp</span>
                <span className="text-lg font-extrabold text-stone-900 tracking-tight font-sans tabular-nums">
                  {formatNumber(animatedLifetime)}
                </span>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold font-sans bg-emerald-100/70 text-emerald-800">
                +18.4% YoY
              </span>
            </div>
          </div>
        </div>

        {/* Stat 2: Payout Success Rate */}
        <div className="relative overflow-hidden rounded-[22px] p-4 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-teal-50/40 border border-white/80 shadow-[0_10px_25px_-5px_rgba(20,184,166,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-400/30 flex items-center justify-center text-teal-700 shrink-0 shadow-inner">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
              Riwayat Pencairan
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-stone-900 font-sans tabular-nums">
                8x Penarikan
              </span>
              <span className="text-[10px] font-medium font-sans text-stone-500">
                100% Bebas Biaya
              </span>
            </div>
          </div>
        </div>

        {/* Stat 3: Escrow Target Countdown */}
        <div className="relative overflow-hidden rounded-[22px] p-4 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-amber-50/40 border border-white/80 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-700 shrink-0 shadow-inner">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
              Jadwal Audit Klaster
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-stone-900 font-sans tabular-nums">
                30 Nov 2026
              </span>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold font-sans bg-amber-100/70 text-amber-800">
                ±32 Hari Lagi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BARIS ATAS: DUAL BALANCE PANEL (2 KARTU SALDO BERDAMPINGAN)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* KARTU 1: SALDO SIAP DITARIK (BESPOKE LIQUID GLASS & GLASSMORPHISM) */}
        <article className="relative overflow-hidden rounded-[28px] p-6 sm:p-7 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/40 border border-white/80 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.16),0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-12px_rgba(16,185,129,0.25),inset_0_1px_2px_rgba(255,255,255,1)] transition-all duration-300 group flex flex-col justify-between">
          {/* Ambient Liquid Light Blobs (Backdrop) */}
          <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-300/15 blur-2xl group-hover:scale-125 transition-transform duration-700 ease-out" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-gradient-to-tr from-teal-400/20 to-emerald-500/10 blur-2xl group-hover:scale-110 transition-transform duration-700 ease-out" />
          {/* Specular Top Hairline Rim */}
          <div className="pointer-events-none absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <div className="relative z-10">
            {/* Header: Tactile Glass Squircle Icon + Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-100/90 to-emerald-50/50 border border-emerald-400/30 backdrop-blur-md flex items-center justify-center text-emerald-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(16,185,129,0.15)] group-hover:rotate-6 transition-transform duration-300">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight font-sans">
                    Saldo Tersedia (Siap Tarik)
                  </h3>
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Dividen Bersih 88%</span>
                </div>
              </div>
            </div>

            {/* Subtitle / Description */}
            <p className="text-xs text-stone-500 mt-2 leading-relaxed font-normal">
              Nominal bersih dividen kredit karbon setelah bagi hasil 88% bursa karbon, bebas biaya transfer mitra.
            </p>

            {/* Big Hero Number & Glassmorphic Pill Badge */}
            <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
              <div className="flex items-baseline">
                <span className="text-xl lg:text-2xl font-bold text-stone-600 mr-1.5 font-sans">Rp</span>
                <span className="text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight font-sans tabular-nums">
                  {formatNumber(animatedAvailable)}
                </span>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-2.5 py-0.5 text-xs font-semibold font-sans">
                Siap Dicairkan
              </span>
            </div>

            {/* Nested Frosted Glass Container */}
            <div className="mt-5 rounded-[22px] bg-white/60 backdrop-blur-md border border-white/90 p-4 space-y-2.5 text-xs shadow-[0_4px_16px_rgba(0,0,0,0.02),inset_0_1px_2px_rgba(255,255,255,0.85)]">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Batas Penarikan Harian</span>
                <span className="font-sans font-bold text-stone-800 tabular-nums">Rp 50.000.000 / hari</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Biaya Admin Transfer</span>
                <span className="font-sans font-bold text-emerald-700 tabular-nums">Rp 0 (Gratis)</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="relative z-10 mt-5 pt-4 border-t border-stone-200/50 flex items-center justify-between gap-3">
            <span className="text-[11px] text-stone-500 font-medium font-sans tabular-nums">
              Batas Harian: Rp 50.000.000 / hari
            </span>
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={displayAvailableBalance <= 0}
              className="px-5 py-2.5 rounded-full bg-[#14382C] hover:bg-[#1C4E3D] disabled:opacity-50 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:scale-98"
            >
              <span>Tarik Dana Sekarang</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </article>

        {/* KARTU 2: SALDO ESCROW / TERTAHAN DENGAN COUNTDOWN TIMELINE (FEATURE 2) */}
        <article className="relative overflow-hidden rounded-[28px] p-6 sm:p-7 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-amber-50/30 border border-white/80 shadow-[0_20px_50px_-15px_rgba(245,158,11,0.12),0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-12px_rgba(245,158,11,0.2),inset_0_1px_2px_rgba(255,255,255,1)] transition-all duration-300 group flex flex-col justify-between">
          {/* Ambient Liquid Light Blobs (Backdrop) */}
          <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-300/10 blur-2xl group-hover:scale-125 transition-transform duration-700 ease-out" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-gradient-to-tr from-teal-400/15 to-emerald-400/10 blur-2xl group-hover:scale-110 transition-transform duration-700 ease-out" />
          {/* Specular Top Hairline Rim */}
          <div className="pointer-events-none absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          <div className="relative z-10">
            {/* Header: Tactile Glass Squircle Icon + Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-100/90 to-amber-50/50 border border-amber-400/30 backdrop-blur-md flex items-center justify-center text-amber-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(245,158,11,0.15)] group-hover:rotate-6 transition-transform duration-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight font-sans">
                    Saldo Escrow (Tertahan)
                  </h3>
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-700">SRN-PPI Vault Klaster</span>
                </div>
              </div>
            </div>

            {/* Subtitle / Description */}
            <p className="text-xs text-stone-500 mt-2 leading-relaxed font-normal">
              Dana penampungan aman audit MRV klaster sebelum dividen karbon resmi dialihkan ke saldo tersedia.
            </p>

            {/* Big Hero Number & Countdown Pill */}
            <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
              <div className="flex items-baseline">
                <span className="text-xl lg:text-2xl font-bold text-stone-600 mr-1.5 font-sans">Rp</span>
                <span className="text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight font-sans tabular-nums">
                  {formatNumber(animatedEscrow)}
                </span>
              </div>
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 px-2.5 py-0.5 text-xs font-semibold font-sans">
                ±32 Hari Menuju Audit
              </span>
            </div>

            {/* Nested Frosted Glass Container with Progress Bar & Milestones */}
            <div className="mt-5 rounded-[22px] bg-white/60 backdrop-blur-md border border-white/90 p-4 space-y-3 text-xs shadow-[0_4px_16px_rgba(0,0,0,0.02),inset_0_1px_2px_rgba(255,255,255,0.85)]">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Progres Kuota Klaster Sukamaju</span>
                <span className="font-sans font-bold text-emerald-700 tabular-nums">76% (380 / 500 tCO2e)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-stone-200/80 overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full bg-emerald-600 transition-all duration-1000" 
                  style={{ width: '76%' }} 
                />
              </div>

              {/* 3-Step Release Milestone */}
              <div className="pt-2 border-t border-stone-200/50 grid grid-cols-3 gap-1 text-[10px] text-center">
                <div className="bg-emerald-50 rounded-lg p-1.5 border border-emerald-200/60 text-emerald-800 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>1. Validasi DBH</span>
                </div>
                <div className="bg-amber-50 rounded-lg p-1.5 border border-amber-200/60 text-amber-800 font-bold">
                  <span>2. Kuota 76% (Aktif)</span>
                </div>
                <div className="bg-stone-50 rounded-lg p-1.5 border border-stone-200/60 text-stone-500 font-medium">
                  <span>3. Cair: 30 Nov</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="relative z-10 mt-5 pt-4 border-t border-stone-200/50 flex items-center justify-between text-xs">
            <span className="text-stone-500 font-medium">Status Pengamanan:</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tersertifikasi SRN-PPI
            </span>
          </div>
        </article>

      </div>

      {/* =========================================================================
          BARIS TENGAH: REKENING TERDAFTAR (FITUR 1) & TRANSPARANSI BAGI HASIL
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        
        {/* KOLOM KIRI (6/12): KARTU REKENING BANK & E-WALLET TERDAFTAR (FITUR 1) */}
        <div className="lg:col-span-6 bg-white rounded-[26px] border border-stone-100 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight font-sans">
                  Rekening &amp; E-Wallet Terdaftar
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Tujuan resmi pencairan dividen yang terverifikasi KYC
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddAccountModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition border border-emerald-200/80 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {/* List of Saved Accounts */}
          <div className="space-y-3">
            {savedAccounts.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-stone-200 text-center text-xs text-stone-400">
                Belum ada rekening bank atau e-wallet terdaftar. Klik "+ Tambah" di atas untuk menambahkan rekening pencairan.
              </div>
            ) : (
              savedAccounts.map((acc) => (
                <div 
                  key={acc.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    acc.isPrimary 
                      ? 'bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-emerald-200/80 shadow-xs' 
                      : 'bg-stone-50/60 border-stone-200/70 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        acc.type === 'bank' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {acc.type === 'bank' ? <Landmark className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-xs sm:text-sm">{acc.bankName}</span>
                          {acc.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Utama
                            </span>
                          )}
                          {acc.isKycVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              KYC Valid
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-sans font-bold text-xs text-stone-700 tabular-nums">{acc.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount(acc.accountNumber, acc.id)}
                            className="p-1 text-stone-400 hover:text-stone-700 transition rounded"
                            title="Salin nomor rekening"
                          >
                            {copiedAccountId === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="text-[11px] text-stone-400 block mt-0.5">a.n. {acc.accountHolder}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!acc.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryAccount(acc.id)}
                          className="text-[11px] font-bold text-stone-500 hover:text-emerald-700 hover:underline cursor-pointer"
                        >
                          Jadikan Utama
                        </button>
                      )}
                      {savedAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 transition"
                          title="Hapus rekening"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 text-[11px] text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Nama pemilik rekening bank <strong>wajib sesuai</strong> dengan identitas KTP mitra tani yang terdaftar untuk mencegah penolakan transfer otomatis klaster.
            </span>
          </div>
        </div>

        {/* KOLOM KANAN (6/12): RINCIAN TRANSPARANSI POTONGAN (PAYOUT BREAKDOWN ACCORDION) */}
        <div className="lg:col-span-6 bg-white rounded-[26px] border border-stone-100 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight font-sans">
                  Transparansi Bagi Hasil
                </h2>
                <span className="text-[11px] text-stone-400">Formula Matematika Terbuka</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBreakdownOpen(prev => !prev)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition cursor-pointer"
            >
              {breakdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-stone-500 leading-relaxed mb-4">
            Struktur potongan biaya pada penjualan kredit karbon eceran (fractional buying) oleh korporasi.
          </p>

          {breakdownOpen && (
            <div className="space-y-2.5 text-xs">
              {/* Kapsul 1: Total Nilai Penjualan Klaster */}
              <div className="rounded-xl bg-[#F4F7F5] border border-stone-200/50 p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-800 block">Penjualan Klaster (Gross)</span>
                  <span className="text-[10px] text-stone-500">Batch 100 tCO2e terjual</span>
                </div>
                <span className="font-sans font-bold text-stone-900 text-sm tabular-nums">
                  Rp 12.000.000
                </span>
              </div>

              {/* Kapsul 2: Porsi Petani (88%) */}
              <div className="rounded-xl bg-emerald-50/50 border border-emerald-200/60 p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-emerald-950 block">Porsi Kontribusi Petani</span>
                  <span className="text-[10px] text-emerald-800">Formula kuota proporsional 10%</span>
                </div>
                <span className="font-sans font-bold text-emerald-800 text-sm tabular-nums">
                  Rp 1.200.000
                </span>
              </div>

              {/* Kapsul 3: Potongan Subsidi Audit */}
              <div className="rounded-xl bg-[#F4F7F5] border border-stone-200/50 p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-stone-700 block">Subsidi Audit (Cost Recovery)</span>
                  <span className="text-[10px] text-stone-400">Auditor eksternal ISO 14064-2</span>
                </div>
                <span className="font-sans font-bold text-amber-700 text-sm tabular-nums">
                  - Rp 150.000
                </span>
              </div>

              {/* Kapsul 4: Potongan Fee Platform */}
              <div className="rounded-xl bg-[#F4F7F5] border border-stone-200/50 p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-stone-700 block">Biaya Jasa Platform (12%)</span>
                  <span className="text-[10px] text-stone-400">Operasional server Sentinel-2</span>
                </div>
                <span className="font-sans font-bold text-amber-700 text-sm tabular-nums">
                  - Rp 157.500
                </span>
              </div>

              {/* Kapsul 5: Pendapatan Bersih Diterima Petani */}
              <div className="rounded-xl bg-[#14382C] text-white p-4 flex items-center justify-between shadow-xs">
                <div>
                  <span className="font-bold text-xs text-white block">Pendapatan Bersih Petani</span>
                  <span className="text-[10px] text-emerald-200">Langsung ke Saldo Tersedia</span>
                </div>
                <span className="font-sans font-bold text-base text-emerald-300 tabular-nums">
                  Rp 892.500
                </span>
              </div>

              <div className="mt-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Jaminan Anti-Calo:</strong> Perhitungan matematis ini terkunci di kontrak pintar bursa karbon untuk mencegah pengurangan sepihak oleh perantara.
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* =========================================================================
          FITUR 4: TABEL RIWAYAT MUTASI DENGAN FILTER, PENCARIAN & UNDUH LAPORAN
          ========================================================================= */}
      <div className="bg-white rounded-[26px] border border-stone-100 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 ease-out space-y-4">
        
        {/* Header Action Bar: Title, Search, Filters, & Download Report */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight font-sans">
              Riwayat Mutasi &amp; Pencairan
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Daftar dividen karbon masuk dan transfer penarikan ke rekening mitra
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi, referensi..."
                className="w-full rounded-full bg-stone-50 border border-stone-200 pl-8 pr-7 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-stone-100 p-1 rounded-full text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-full transition cursor-pointer text-xs ${
                  filterType === 'all' ? 'bg-[#14382C] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Semua ({allTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('credit')}
                className={`px-3 py-1 rounded-full transition cursor-pointer text-xs ${
                  filterType === 'credit' ? 'bg-[#14382C] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Dividen (+)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('debit')}
                className={`px-3 py-1 rounded-full transition cursor-pointer text-xs ${
                  filterType === 'debit' ? 'bg-[#14382C] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Penarikan (-)
              </button>
            </div>

            {/* Download Statement Button */}
            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition border border-stone-200 cursor-pointer active:scale-95"
              title="Unduh rekening koran digital (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 font-medium text-[11px]">
                <th className="pb-3 font-semibold">Transaksi &amp; Penerima</th>
                <th className="pb-3 font-semibold">Metode</th>
                <th className="pb-3 font-semibold">Nominal</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-stone-400 text-xs">
                    Tidak ada transaksi yang sesuai dengan filter atau kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 pr-3">
                      <div className="font-bold text-stone-900 text-xs">{tx.title}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5 font-sans tabular-nums">
                        {tx.date} • {tx.refNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-semibold text-stone-700">
                        {tx.method === 'GoPay' ? (
                          <Smartphone className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Building2 className="w-3 h-3 text-blue-600" />
                        )}
                        <span>{tx.method}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`font-sans font-bold text-xs tabular-nums ${
                        tx.transaction_type === 'credit_payout' ? 'text-emerald-700' : 'text-stone-800'
                      }`}>
                        {tx.transaction_type === 'credit_payout' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tx.statusColor}`}>
                        <span>{tx.statusText}</span>
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      {onOpenReceipt && (
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(tx)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Bukti</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          FITUR 5: PENDAMPING LAPANGAN / WHATSAPP KLASTER & FAQ PANDUAN PENCAIRAN
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-[26px] p-5 sm:p-6 backdrop-blur-2xl bg-gradient-to-br from-white/95 via-white/85 to-emerald-50/40 border border-white/80 shadow-[0_16px_36px_-8px_rgba(16,185,129,0.1),inset_0_1px_2px_rgba(255,255,255,0.95)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Sisi Kiri (7/12): Kontak Pendamping Klaster */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Pusat Bantuan &amp; Pendampingan
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 font-medium">Klaster Wonosobo &amp; Sukamaju</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 tracking-tight">
              Butuh Bantuan Pencairan Dividen atau Validasi Rekening?
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Jika mengalami kendala transfer atau perubahan buku tabungan, hubungi pendamping lapangan resmi kelompok tani Anda secara langsung.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Pak%20Agus,%20saya%20petani%20TaniKarbon%20Klaster%20Sukamaju%20ingin%20tanya%20seputar%20pencairan%20dompet."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#14382C] hover:bg-[#1C4E3D] text-white text-xs font-semibold transition shadow-xs cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Pendamping via WhatsApp</span>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>

              <div className="text-xs text-stone-500 font-medium">
                Koordinator: <strong className="text-stone-800">Bpk. Agus Santoso, S.P.</strong>
              </div>
            </div>
          </div>

          {/* Sisi Kanan (5/12): Mini FAQ Accordion */}
          <div className="lg:col-span-5 space-y-2 text-xs">
            <div 
              onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
              className="p-3 rounded-xl bg-white/80 border border-stone-200/60 cursor-pointer hover:bg-white transition"
            >
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span>Berapa lama dana masuk ke rekening?</span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${activeFaq === 1 ? 'rotate-180' : ''}`} />
              </div>
              {activeFaq === 1 && (
                <p className="mt-2 text-stone-500 text-[11px] leading-relaxed pt-2 border-t border-stone-100">
                  Proses otomatis berlangsung instan s.d. maksimal 1x24 jam kerja untuk transfer bank (BRI/BCA/Mandiri) dan seketika untuk e-wallet GoPay/DANA.
                </p>
              )}
            </div>

            <div 
              onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
              className="p-3 rounded-xl bg-white/80 border border-stone-200/60 cursor-pointer hover:bg-white transition"
            >
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span>Apakah ada potongan biaya transfer?</span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${activeFaq === 2 ? 'rotate-180' : ''}`} />
              </div>
              {activeFaq === 2 && (
                <p className="mt-2 text-stone-500 text-[11px] leading-relaxed pt-2 border-t border-stone-100">
                  Rp 0 alias Gratis! Seluruh biaya transfer perbankan ke rekening mitra tani disubsidi penuh oleh sistem TaniKarbon.
                </p>
              )}
            </div>

            <div 
              onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}
              className="p-3 rounded-xl bg-white/80 border border-stone-200/60 cursor-pointer hover:bg-white transition"
            >
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span>Kapan saldo escrow klaster dicairkan?</span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${activeFaq === 3 ? 'rotate-180' : ''}`} />
              </div>
              {activeFaq === 3 && (
                <p className="mt-2 text-stone-500 text-[11px] leading-relaxed pt-2 border-t border-stone-100">
                  Saldo escrow dicairkan otomatis ke Saldo Tersedia setelah audit klaster Sukamaju (76% kuota) disahkan oleh auditor independen pada akhir siklus November 2026.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          MODAL: TAMBAH REKENING BANK / E-WALLET BARU (FITUR 1)
          ========================================================================= */}
      {showAddAccountModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowAddAccountModal(false)}
        >
          <div 
            className="bg-white rounded-[26px] max-w-md w-full border border-stone-100 shadow-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-stone-900 font-sans">
                  Tambah Rekening Pencairan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Bank / Dompet Digital
                </label>
                <select
                  value={newAccount.bankName}
                  onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                  className="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-xs text-stone-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="Bank BRI">Bank BRI (Rekomendasi Petani)</option>
                  <option value="Bank BCA">Bank BCA</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Bank BNI">Bank BNI</option>
                  <option value="Bank Jateng">Bank Jateng</option>
                  <option value="GoPay Petani">GoPay Petani</option>
                  <option value="DANA Dompet Digital">DANA</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Nomor Rekening / No. HP E-Wallet
                </label>
                <input
                  type="text"
                  required
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  placeholder="Contoh: 0142-01-084821-50-8"
                  className="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-xs font-sans font-bold text-stone-800 tabular-nums placeholder-stone-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Nama Pemilik Rekening (Sesuai Buku Tabungan)
                </label>
                <input
                  type="text"
                  required
                  value={newAccount.accountHolder}
                  onChange={(e) => setNewAccount({ ...newAccount, accountHolder: e.target.value })}
                  placeholder="Nama Lengkap KTP"
                  className="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-500 focus:bg-white uppercase"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-tight flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Pastikan nomor rekening aktif dan atas nama sendiri untuk kelancaran verifikasi sistem.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 rounded-full text-stone-600 font-bold hover:bg-stone-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#14382C] hover:bg-[#1C4E3D] text-white font-semibold transition shadow-xs cursor-pointer active:scale-98"
                >
                  Simpan &amp; Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
