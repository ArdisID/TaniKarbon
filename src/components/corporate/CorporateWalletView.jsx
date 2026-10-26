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
  Landmark, 
  FileText, 
  CreditCard, 
  Clock, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Building2,
  Save
} from 'lucide-react';
import { formatRupiah } from '../../data';

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
      onToast(`Pengaturan Low Balance Alert (${formatRupiah(parseInt(lowBalanceThreshold || '0', 10))}) tersimpan.`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-[#14382C] text-emerald-300">
              ESCROW &amp; BILLING
            </span>
            <span className="text-xs text-slate-500 font-sans">
              Virtual Account ID: <span className="font-mono font-medium text-slate-700">ID-MDR-992140</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1 tracking-tight font-sans">
            Dompet Korporat &amp; Pembukuan Faktur Pajak
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Kelola deposit instan untuk kelancaran eksekusi Auto-Buy API dan pembukuan resmi B2B.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTopUpModal}
            className="px-5 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-semibold rounded-2xl transition shadow-xs flex items-center gap-2 cursor-pointer font-sans"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Top-Up Saldo Deposit</span>
          </button>
        </div>
      </div>

      {/* Grid: PreFundedDepositCard + LowBalanceAlertCard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* A. PreFundedDepositCard (2 Kolom di Desktop) */}
        <div className="lg:col-span-2 bg-[#14382C] text-white rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-md flex flex-col justify-between">
          {/* Subtle geometric background */}
          <div className="absolute -right-8 -top-8 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-12 bottom-6 opacity-10 pointer-events-none">
            <Landmark className="w-36 h-36 text-white" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-emerald-300 block">
                    Pre-Funded Escrow Account
                  </span>
                  <h3 className="text-sm font-semibold text-white font-sans">
                    Saldo Dana Siap Pakai (Auto-Buy Ready)
                  </h3>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-medium bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Koneksi Real-Time API: Aktif</span>
              </span>
            </div>

            <div className="py-2">
              <span className="text-xs text-slate-300 font-sans block">Total Saldo Efektif:</span>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white mt-1">
                {formatRupiah(depositBalance)}
              </div>
              <p className="text-[11px] text-emerald-200/80 mt-1 flex items-center gap-1.5 font-sans">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Dana mengendap terproteksi rekening penampung kustodian bank rekanan resmi TaniKarbon.</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="relative z-10 pt-5 mt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-sans">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-300 font-sans uppercase block">Total Top-Up Bulan Ini</span>
              <span className="text-sm font-bold font-mono text-emerald-300 mt-0.5 block">
                {formatRupiah(totalCredit)}
              </span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-300 font-sans uppercase block">Total Debet Offset Bulan Ini</span>
              <span className="text-sm font-bold font-mono text-amber-300 mt-0.5 block">
                {formatRupiah(totalDebit)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between sm:block">
              <div>
                <span className="text-[10px] text-slate-300 font-sans uppercase block">Status Pajak</span>
                <span className="text-sm font-semibold text-white mt-0.5 block font-sans">Bebas PPN Karbon</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-sans">PMK No. 34/2024</span>
            </div>
          </div>
        </div>

        {/* LowBalanceAlertCard (1 Kolom di Desktop) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between font-sans">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-[#14382C] text-sm font-sans">Low Balance Alert</h3>
                <p className="text-[11px] text-slate-400 font-sans">Otomasi Notifikasi Saldo Minimum</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Kirim peringatan darurat otomatis ke tim keuangan jika saldo pra-pendanaan menyentuh ambang batas agar webhook API tidak tertahan (HTTP 402).
            </p>

            <form onSubmit={handleSaveAlert} className="space-y-3 font-sans">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Ambang Batas Minimum (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={lowBalanceThreshold}
                    onChange={(e) => setLowBalanceThreshold(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition"
                    placeholder="25000000"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Email PIC Keuangan / Treasury
                </label>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition"
                  placeholder="finance@company.co.id"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                {isAlertSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    <span>Simpan Pengaturan Alert</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 font-sans">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Terintegrasi via SMTP &amp; Webhook Telegram Tim Finance</span>
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
            <h3 className="font-bold text-[#14382C] text-lg mt-0.5 font-sans">
              Riwayat Mutasi Transaksi &amp; Faktur Pajak
            </h3>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600 font-sans">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterType === 'all' ? 'bg-white text-[#14382C] shadow-2xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Semua ({transactions.length})
              </button>
              <button
                onClick={() => setFilterType('credit')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterType === 'credit' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'hover:text-slate-900'
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
                className="pl-8 pr-3 py-1.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table Content (Rapi, Responsif, Lebar Minimum & Whitespace Terjaga) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Header Kolom: font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-400 */}
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
                    <span className="font-mono font-bold text-xs text-[#14382C] block">
                      {item.id}
                    </span>
                    <span className="text-xs text-stone-500 font-sans flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {item.date}
                    </span>
                  </td>

                  {/* 2. Keterangan / Aktivitas (min-w-[260px], vertikal flex-col gap-1, badge utuh) */}
                  <td className="px-5 py-4 min-w-[260px]">
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-sm font-medium text-stone-800 leading-snug">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-400 font-sans">Ref:</span>
                        <span className="inline-flex items-center whitespace-nowrap font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
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

                  {/* 4. Nominal Arus Kas (Wajib Rata Kanan text-right) */}
                  <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-sm">
                    {item.type === 'credit' ? (
                      <span className="text-emerald-700 inline-flex items-center justify-end gap-1">
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

                  {/* 5. Sisa Saldo (Wajib Rata Kanan text-right) */}
                  <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-semibold text-xs text-stone-500">
                    {formatRupiah(item.balanceAfter)}
                  </td>

                  {/* 6. Status (Rata Tengah text-center) */}
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <span className="font-sans text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.status}</span>
                    </span>
                  </td>

                  {/* 7. Dokumen Pajak (Tombol Elegan Standar Linear/Stripe) */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDownloadInvoice(item)}
                      className="border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-mono inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      title={`Unduh Faktur ${item.invoiceNumber}`}
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
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
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
