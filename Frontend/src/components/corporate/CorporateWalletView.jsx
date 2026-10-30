import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Search, 
  Filter, 
  Bell, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  CreditCard, 
  Clock, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Building2,
  Save,
  Copy,
  Check
} from 'lucide-react';
import { formatRupiah, formatNumber } from '../../data';
import AnimatedNumber from '../common/AnimatedNumber';

export default function CorporateWalletView({ 
  depositBalance = 250000000, 
  onOpenTopUpModal,
  ledgerTransactions = [],
  onToast 
}) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'credit' | 'debit'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Low balance alert configuration state
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('25000000');
  const [alertEmail, setAlertEmail] = useState('finance@industrihijau.co.id');
  const [isAlertSaved, setIsAlertSaved] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);

  const virtualAccountNo = '8921 4402 1920 42';

  const handleCopyVA = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('89214402192042');
    }
    setCopiedVA(true);
    setTimeout(() => setCopiedVA(false), 2000);
    if (onToast) onToast('Nomor Virtual Account Mandiri berhasil disalin.');
  };

  // Default transactions if none passed
  const defaultLedger = [
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
      description: 'Penebusan Manual Klaster Wonosobo (Tahun Buku 2026)',
      referenceId: 'CERT-2026-TK-9941A',
      type: 'debit',
      amount: 80000000,
      balanceAfter: 152000000,
      status: 'Berhasil Didebet',
      method: 'Pre-funded Wallet',
      invoiceNumber: 'INV/2026/TK/10/0812'
    },
    {
      id: 'TXN-2026-1012-01',
      date: '12 Okt 2026, 16:40 WIB',
      description: 'Auto-Buy API: Offset Emisi Pabrik Klaster Sindoro',
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
  ];

  const transactions = ledgerTransactions.length > 0 ? ledgerTransactions : defaultLedger;

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleSaveAlert = (e) => {
    e.preventDefault();
    setIsAlertSaved(true);
    setTimeout(() => setIsAlertSaved(false), 2500);
    if (onToast) {
      onToast(`Notifikasi saldo minimum (${formatRupiah(parseInt(lowBalanceThreshold || '0', 10))}) berhasil disimpan.`);
    }
  };

  const handleDownloadInvoice = (item) => {
    if (onToast) {
      onToast(`Mengunduh Faktur Pajak & Invoice Resmi ${item.invoiceNumber} (PDF)...`);
    }
  };

  const totalCredit = transactions
    .filter(t => t.type === 'credit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDebit = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Top Banner Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 bg-white rounded-[24px] border border-slate-200/90 shadow-[0_4px_24px_rgba(15,30,46,0.03)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-sky-50 text-sky-800 border border-sky-200 uppercase tracking-wider">
              Rekening &amp; Billing
            </span>
            <span className="text-xs text-slate-500 font-sans">
              Mandiri Corporate VA: <span className="font-sans font-bold text-slate-800 tabular-nums">8921 4402 1920 42</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F1E2E] mt-1 tracking-tight font-sans">
            Dompet Korporat &amp; Pembukuan Faktur Pajak
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Kelola deposit instan untuk penebusan kredit karbon bursa dan pembukuan resmi B2B.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTopUpModal}
            className="px-5 py-2.5 bg-[#0F1E2E] hover:bg-[#1A2E44] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer font-sans"
          >
            <Wallet className="w-4 h-4 text-sky-400" />
            <span>Top-Up Saldo Deposit</span>
          </button>
        </div>
      </div>

      {/* Grid: PreFundedDepositCard + LowBalanceAlertCard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* A. PreFundedDepositCard (2 Kolom di Desktop) - Bersih, Mewah, Zero AI-Slop */}
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 sm:p-7 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,30,46,0.03)] flex flex-col justify-between card-interactive">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-sans font-bold tracking-wider text-sky-800 block">
                    Rekening Pra-Pendanaan Korporat
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-slate-600">Bank Mandiri VA:</span>
                    <button
                      type="button"
                      onClick={handleCopyVA}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 tabular-nums transition cursor-pointer"
                      title="Salin Nomor VA"
                    >
                      <span>{virtualAccountNo}</span>
                      {copiedVA ? (
                        <Check className="w-3.5 h-3.5 text-sky-700" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                    {copiedVA && (
                      <span className="text-[11px] font-bold text-sky-700 animate-fade-in">Tersalin!</span>
                    )}
                  </div>
                </div>
              </div>

              <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Terhubung Real-Time</span>
              </span>
            </div>

            <div className="py-2">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Saldo Deposit Efektif
              </span>
              <div className="flex items-baseline mt-1 font-sans">
                <span className="text-xl sm:text-2xl font-bold text-slate-400 mr-2 font-sans">Rp</span>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F1E2E] font-sans tabular-nums">
                  <AnimatedNumber value={depositBalance} />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-2 font-sans">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Dana siap digunakan untuk penebusan kredit karbon instan dan eksekusi otomatis API.</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar - Clean White/Slate with Blue Accents */}
          <div className="pt-5 mt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
            <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Top-Up Masuk Bulan Ini
              </span>
              <span className="text-base font-extrabold font-sans text-sky-800 mt-1 block tabular-nums">
                +{formatRupiah(totalCredit)}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Penebusan Keluar Bulan Ini
              </span>
              <span className="text-base font-extrabold font-sans text-slate-800 mt-1 block tabular-nums">
                -{formatRupiah(totalDebit)}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Ketentuan Perpajakan
                </span>
                <span className="text-xs font-bold text-[#0F1E2E] mt-1 block font-sans">
                  Bebas PPN Karbon
                </span>
              </div>
              <span className="text-[10px] text-sky-700 font-semibold font-sans mt-0.5">PMK No. 34/2024</span>
            </div>
          </div>
        </div>

        {/* B. LowBalanceAlertCard (1 Kolom di Desktop) - Bersih, Humanis, No Buzzwords */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,30,46,0.03)] flex flex-col justify-between font-sans">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0F1E2E] text-sm font-sans">Notifikasi Saldo Minimum</h3>
                <p className="text-[11px] text-slate-500 font-sans">Peringatan otomatis saat saldo menipis</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Kirim email pemberitahuan ke tim keuangan apabila saldo berada di bawah batas minimum agar proses penebusan karbon tidak tertunda.
            </p>

            <form onSubmit={handleSaveAlert} className="space-y-3 font-sans">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ambang Batas Minimum
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-sans font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={lowBalanceThreshold}
                    onChange={(e) => setLowBalanceThreshold(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-sans font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F1E2E] focus:bg-white transition tabular-nums"
                    placeholder="25000000"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Preset:</span>
                  {['10000000', '25000000', '50000000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setLowBalanceThreshold(val)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        lowBalanceThreshold === val
                          ? 'bg-[#0F1E2E] text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {val === '10000000' ? '10 Jt' : val === '25000000' ? '25 Jt' : '50 Jt'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Email PIC Keuangan / Treasury
                </label>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-sans font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F1E2E] focus:bg-white transition"
                  placeholder="finance@industrihijau.co.id"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0F1E2E] hover:bg-[#1A2E44] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer font-sans shadow-xs active:scale-98"
              >
                {isAlertSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Pengaturan Tersimpan</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-slate-300" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-sans">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Notifikasi dikirim melalui email resmi saat saldo di bawah batas.</span>
          </div>
        </div>

      </div>

      {/* B. CorporateLedgerTable (Tabel Mutasi & Riwayat Invoice Pajak) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-100 text-slate-700 uppercase">
                MUTASI ESCROW
              </span>
              <span className="text-xs text-stone-500 font-sans">Buku Besar Digital &amp; Rekonsiliasi</span>
            </div>
            <h3 className="font-bold text-[#0F1E2E] text-lg mt-0.5 font-sans">
              Riwayat Mutasi Transaksi &amp; Faktur Pajak
            </h3>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600 font-sans">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterType === 'all' ? 'bg-white text-[#0F1E2E] shadow-2xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Semua ({transactions.length})
              </button>
              <button
                onClick={() => setFilterType('credit')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterType === 'credit' ? 'bg-white text-sky-700 shadow-2xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Top-Up Masuk
              </button>
              <button
                onClick={() => setFilterType('debit')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterType === 'debit' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Penebusan Keluar
              </button>
            </div>

            {/* Search Input */}
            <div className="relative font-sans">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari referensi atau invoice..."
                className="pl-8 pr-3 py-1.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F1E2E] focus:bg-white transition w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table Content (Rapi, Responsif, Lebar Minimum & Whitespace Terjaga) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-sans text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Waktu &amp; ID Transaksi</th>
                <th className="px-5 py-3.5 min-w-[260px]">Keterangan / Aktivitas</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Metode Eksekusi</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-right">Nominal Arus Kas</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-right">Sisa Saldo</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Status</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-right">Dokumen Pajak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredTransactions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition group">
                  {/* 1. Waktu & ID Transaksi */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-sans font-bold text-xs text-[#0F1E2E] block tabular-nums">
                      {item.id}
                    </span>
                    <span className="text-xs text-stone-500 font-sans flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {item.date}
                    </span>
                  </td>

                  {/* 2. Keterangan / Aktivitas */}
                  <td className="px-5 py-4 min-w-[260px]">
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-sm font-medium text-stone-800 leading-snug">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-400 font-sans">Ref:</span>
                        <span className="inline-flex items-center whitespace-nowrap font-sans text-[11px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-medium tabular-nums">
                          {item.referenceId}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 3. Metode Eksekusi */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-sans text-xs font-medium text-stone-700 bg-stone-100 border border-stone-200/80 px-2.5 py-1 rounded-md inline-block">
                      {item.method}
                    </span>
                  </td>

                  {/* 4. Nominal Arus Kas */}
                  <td className="px-5 py-4 whitespace-nowrap text-right font-sans font-bold text-sm tabular-nums">
                    {item.type === 'credit' ? (
                      <span className="text-sky-700 inline-flex items-center justify-end gap-1">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        +{formatRupiah(item.amount)}
                      </span>
                    ) : (
                      <span className="text-stone-800 inline-flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
                        -{formatRupiah(item.amount)}
                      </span>
                    )}
                  </td>

                  {/* 5. Sisa Saldo */}
                  <td className="px-5 py-4 whitespace-nowrap text-right font-sans font-semibold text-xs text-stone-500 tabular-nums">
                    {formatRupiah(item.balanceAfter)}
                  </td>

                  {/* 6. Status */}
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <span className="font-sans text-xs font-medium text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>{item.status}</span>
                    </span>
                  </td>

                  {/* 7. Dokumen Pajak */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDownloadInvoice(item)}
                      className="border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-sans font-medium inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer tabular-nums"
                      title={`Unduh Faktur ${item.invoiceNumber}`}
                    >
                      <Download className="w-3.5 h-3.5 text-sky-600" />
                      <span>{item.invoiceNumber}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 font-sans gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Faktur Pajak Elektronik divalidasi sesuai PMK No. 34/PMK.03/2024 terkait PPN Perdagangan Karbon.</span>
          </div>
          <span className="font-sans text-xs text-stone-400 font-medium">
            Total {filteredTransactions.length} transaksi tercatat
          </span>
        </div>
      </div>
    </div>
  );
}
