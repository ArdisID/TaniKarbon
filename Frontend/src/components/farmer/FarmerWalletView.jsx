import React, { useState } from 'react';
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
  Smartphone, 
  Download, 
  FileText,
  HelpCircle,
  TrendingUp,
  Receipt,
  Layers,
  PieChart,
  Eye,
  AlertCircle
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function FarmerWalletView({ 
  availableBalance = 3250000, 
  escrowBalance = 1450000,
  transactions = [],
  onOpenWithdrawal,
  onOpenReceipt,
  onToast 
}) {
  const [breakdownOpen, setBreakdownOpen] = useState(true);

  // Default transactions list with 3 status badges: Dana Terkirim, Diproses Admin, Gagal
  const initialTransactions = [
    {
      id: 'WD-084219',
      title: 'Pencairan Dana Dividen Karbon (Batch Q3)',
      recipient: 'Bank BRI Rekening ****4821',
      recipientFull: 'Bank BRI - 0142-01-084821-50-8 (a.n. JOKO WIDODO)',
      amount: 892500,
      date: '24 Okt 2026, 14:20 WIB',
      status: 'Dana Terkirim',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      refNumber: 'TRX-BRI-99281726'
    },
    {
      id: 'WD-083102',
      title: 'Pencairan Saldo via DANA e-Wallet',
      recipient: 'DANA 0812-****-7890',
      recipientFull: 'DANA e-Wallet - 0812-4921-7890 (a.n. JOKO WIDODO)',
      amount: 500000,
      date: '20 Okt 2026, 09:15 WIB',
      status: 'Diproses Admin',
      statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
      refNumber: 'TRX-DNA-88192031'
    },
    {
      id: 'WD-071192',
      title: 'Pencairan Dana Dividen Karbon (Batch Q2)',
      recipient: 'Bank BRI Rekening ****4821',
      recipientFull: 'Bank BRI - 0142-01-084821-50-8 (a.n. JOKO WIDODO)',
      amount: 1250000,
      date: '15 Jul 2026, 14:05 WIB',
      status: 'Dana Terkirim',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      refNumber: 'TRX-BRI-88192031'
    },
    {
      id: 'WD-062831',
      title: 'Penarikan Bank Mandiri (Nomor Salah)',
      recipient: 'Bank Mandiri ****1928',
      recipientFull: 'Bank Mandiri - 137-00-1928374-1 (a.n. JOKO WIDODO)',
      amount: 600000,
      date: '10 Mei 2026, 11:30 WIB',
      status: 'Gagal',
      statusColor: 'bg-red-100 text-red-800 border-red-300',
      refNumber: 'TRX-MDR-FAILED'
    }
  ];

  const allTransactions = (transactions && transactions.length > 0) ? transactions : initialTransactions;

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Alur Finansial Petani (Asset Owner)
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1">
            Dompet Karbon &amp; Transparansi Bagi Hasil
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Mengelola seluruh alur finansial petani, mulai dari dana yang ditahan sementara hingga rincian potongan komisi dan pencairan ke rekening.
          </p>
        </div>

        <button
          onClick={onOpenWithdrawal}
          disabled={availableBalance <= 0}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-md self-start sm:self-auto"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Tarik Dana ke Rekening</span>
        </button>
      </div>

      {/* A. Panel Saldo Dua Lapis (DualBalancePanel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kotak Saldo Escrow (Tertahan) */}
        <div className="bg-stone-50 rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Kotak Saldo Escrow (Tertahan)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Terkunci di Escrow
              </span>
            </div>

            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-stone-800 font-mono tracking-tight">
                {formatRupiah(escrowBalance)}
              </span>
            </div>

            <p className="text-xs text-stone-500 mt-2 font-medium leading-relaxed">
              Nominal uang hasil penjualan kredit karbon yang sudah dibayar perusahaan pembeli, namun masih dikunci sementara menunggu penyelesaian administrasi klaster.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-stone-200/70 flex items-center justify-between text-xs text-stone-500">
            <span>Rilis Penutupan Klaster:</span>
            <strong className="text-stone-700">30 November 2026</strong>
          </div>
        </div>

        {/* Kotak Saldo Tersedia (Siap Tarik - Rp) */}
        <div className="bg-[#14382C] text-white rounded-3xl p-5 sm:p-6 border border-emerald-500/30 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kotak Saldo Tersedia (Siap Tarik)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Siap Cair Kapan Saja
              </span>
            </div>

            <div className="mt-2">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {formatRupiah(availableBalance)}
              </span>
            </div>

            <p className="text-xs text-emerald-100/80 mt-2 leading-relaxed">
              Nominal bersih yang sudah melewati pemotongan biaya dan siap dicairkan kapan saja langsung ke rekening bank atau e-wallet petani.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-emerald-600/40 flex items-center justify-between">
            <span className="text-xs text-emerald-300">Bebas biaya transfer mitra</span>
            <button
              onClick={onOpenWithdrawal}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition shadow-sm"
            >
              Tarik Dana Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* B. Rincian Transparansi Potongan & Pembelian Bertahap (PayoutBreakdownAccordion) */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setBreakdownOpen(!breakdownOpen)}
          className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-3 hover:bg-stone-50/70 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#14382C]">
                  Rincian Transparansi Potongan &amp; Pembelian Bertahap (Fractional Buying)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hidden sm:inline-block">
                  Formula Matematika Terbuka
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Rincian matematis proporsional saat perusahaan membeli kuota klaster secara bertahap/eceran.
              </p>
            </div>
          </div>
          {breakdownOpen ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {breakdownOpen && (
          <div className="p-5 sm:p-6 bg-stone-50/60 border-t border-stone-100 space-y-4 text-xs">
            {/* Info Batch Transaksi Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Info Batch Transaksi Terakhir</span>
                <strong className="text-sm font-bold text-[#14382C]">PT Telkom Indonesia Tbk (ESG Offset)</strong>
                <span className="text-[11px] text-stone-500 block">Tanggal: 20 Oktober 2026 • Batch Tonase: 100 tCO2e Terjual</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-xl font-mono font-bold border border-emerald-200">
                Batch Klaster #CLU-WNSB-B3
              </span>
            </div>

            {/* Structured Mathematical Table */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs divide-y divide-stone-100">
              <div className="p-3.5 flex items-center justify-between bg-stone-50 font-bold text-stone-700 text-xs">
                <span>Komponen Perhitungan Matematis</span>
                <span>Nilai Nominal</span>
              </div>

              {/* Row 1: Total Nilai Penjualan Klaster (Gross Revenue) */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <strong className="text-stone-900 block font-bold">
                    Total Nilai Penjualan Klaster (Gross Revenue)
                  </strong>
                  <span className="text-[11px] text-stone-400">100 tCO2e terjual pada batch tersebut</span>
                </div>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  Rp 12.000.000
                </span>
              </div>

              {/* Row 2: Porsi Kontribusi Petani (Proportional Share) */}
              <div className="p-3.5 flex items-center justify-between bg-emerald-50/30">
                <div>
                  <strong className="text-emerald-950 block font-bold">
                    Porsi Kontribusi Petani (Proportional Share)
                  </strong>
                  <span className="text-[11px] text-emerald-800">
                    Formula: (Tonase Lahan Petani / Total Tonase Klaster) × 100% = (10 tCO2e / 100 tCO2e) = 10%
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  10% (Rp 1.200.000)
                </span>
              </div>

              {/* Row 3: Potongan Subsidi Audit (Cost Recovery) */}
              <div className="p-3.5 flex items-center justify-between bg-amber-50/20 text-stone-700">
                <div>
                  <strong className="block font-semibold">
                    Potongan Subsidi Audit (Cost Recovery)
                  </strong>
                  <span className="text-[11px] text-stone-400">
                    Pemotongan proporsional mengganti biaya auditor eksternal yang ditalangi platform di awal
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-800 text-sm">
                  - Rp 150.000
                </span>
              </div>

              {/* Row 4: Potongan Jasa Platform (Take-Rate Fee) */}
              <div className="p-3.5 flex items-center justify-between bg-amber-50/20 text-stone-700">
                <div>
                  <strong className="block font-semibold">
                    Potongan Jasa Platform (Take-Rate Fee)
                  </strong>
                  <span className="text-[11px] text-stone-400">
                    Komisi operasional server satelit Sentinel-2 dan profit platform
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-800 text-sm">
                  - Rp 157.500
                </span>
              </div>

              {/* Row 5: Pendapatan Bersih Diterima (Net Payout) */}
              <div className="p-4 flex items-center justify-between bg-[#14382C] text-white">
                <div>
                  <strong className="block font-black text-sm text-white">
                    Pendapatan Bersih Diterima (Net Payout)
                  </strong>
                  <span className="text-[11px] text-emerald-200">
                    Langsung berpindah ke Saldo Tersedia (Dapat ditarik ke rekening tanpa perantara)
                  </span>
                </div>
                <span className="font-mono font-black text-lg text-emerald-300">
                  Rp 892.500
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Jaminan Anti-Calo:</strong> Perhitungan matematis ini transparan dan terkunci pada kontrak pintar bursa, mencegah pengurangan sepihak oleh pengurus koperasi maupun tengkulak.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* C. Tabel Riwayat Mutasi (TransactionHistoryTable) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#14382C]">
              Tabel Riwayat Mutasi Pencairan (TransactionHistoryTable)
            </h2>
            <p className="text-xs text-stone-500">
              Daftar mutasi penarikan dana dengan status verifikasi dan bukti transfer perbankan.
            </p>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {allTransactions.length} Mutasi
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {allTransactions.map((tx) => (
            <div 
              key={tx.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 -mx-3 px-3 rounded-2xl transition"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#14382C] truncate">
                    {tx.title}
                  </h4>
                  
                  {/* Badge Status: Diproses Admin, Dana Terkirim, atau Gagal */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tx.statusColor}`}>
                      {tx.status === 'Dana Terkirim' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                      {tx.status === 'Diproses Admin' && <Clock className="w-3 h-3 text-amber-700" />}
                      {tx.status === 'Gagal' && <AlertCircle className="w-3 h-3 text-red-700" />}
                      <span>{tx.status}</span>
                    </span>
                    <span className="text-[10px] text-stone-600 font-medium">
                      {tx.recipient}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Ref: {tx.refNumber || tx.id}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">{tx.date}</p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0 pl-13 sm:pl-0 flex flex-col sm:items-end">
                <span className="font-mono font-bold text-sm sm:text-base text-emerald-800 block">
                  +{formatRupiah(tx.amount)}
                </span>
                
                {/* Tombol Lihat Bukti Transfer (Menampilkan gambar struk bukti transfer) */}
                {tx.status === 'Dana Terkirim' && (
                  <button
                    type="button"
                    onClick={() => onOpenReceipt(tx)}
                    className="text-[11px] text-emerald-800 hover:text-emerald-900 font-bold underline mt-1 flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Lihat Bukti Transfer</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
