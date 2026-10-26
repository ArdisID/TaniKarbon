import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Wallet, 
  Users, 
  Trees, 
  Leaf, 
  ShieldCheck, 
  Info,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function CompanyDashboardView({ 
  onNavigateTab, 
  depositBalance = 250000000,
  retiredCarbon = 1200,
  onOpenTopUpModal 
}) {
  // A. Header Konteks: EmissionPeriodSelector state (2026 vs 2027)
  const [vintageYear, setVintageYear] = useState('2026');

  // Simulation state: Toggle Defisit vs Net-Zero Achieved
  const [isNetZeroSimulated, setIsNetZeroSimulated] = useState(false);

  // Dynamic calculations based on vintage year & simulation
  const grossEmissions = vintageYear === '2026' ? 1500 : 1850;
  const currentRetired = isNetZeroSimulated 
    ? grossEmissions 
    : (vintageYear === '2026' ? retiredCarbon : 450);
  const netDeficit = Math.max(0, grossEmissions - currentRetired);

  // Monthly data for EmissionVsOffsetChart (Jan - Dec)
  const monthlyData2026 = [
    { month: 'Jan', emission: 95, offset: 90 },
    { month: 'Feb', emission: 110, offset: 105 },
    { month: 'Mar', emission: 125, offset: 120 },
    { month: 'Apr', emission: 130, offset: 130 },
    { month: 'Mei', emission: 140, offset: 110 },
    { month: 'Jun', emission: 135, offset: 135 },
    { month: 'Jul', emission: 145, offset: 100 },
    { month: 'Agu', emission: 120, offset: 120 },
    { month: 'Sep', emission: 125, offset: 125 },
    { month: 'Okt', emission: 130, offset: 115 },
    { month: 'Nov', emission: 125, offset: isNetZeroSimulated ? 150 : 25 },
    { month: 'Des', emission: 120, offset: isNetZeroSimulated ? 145 : 25 },
  ];

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#14382C] text-white p-3 rounded-2xl shadow-xl border border-emerald-500/30 text-xs font-mono">
          <p className="font-bold text-emerald-300 font-sans">{label} 2026</p>
          <div className="mt-1 space-y-1">
            <p className="text-slate-200">
              Output Emisi Pabrik: <strong className="text-amber-300">{payload[0]?.value} tCO2e</strong>
            </p>
            <p className="text-slate-200">
              Penebusan (Retired Offset): <strong className="text-emerald-400">{payload[1]?.value} tCO2e</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* A. Header Konteks Tahun Buku & Tenggat Audit (AnnualCycleBanner) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Neraca Emisi Perusahaan (Scope 1 &amp; 2)
            </span>
            <span className="text-xs font-mono text-slate-400">Akun: PT Industri Hijau Nusantara (Tbk)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1.5 tracking-tight">
            Overview &amp; Neraca Emisi Karbon Tahunan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat kendali (Command Center) pemantauan selisih output emisi fasilitas industri terhadap kredit karbon yang telah ditebus di bursa TaniKarbon.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* EmissionPeriodSelector Dropdown */}
          <div className="relative">
            <select
              value={vintageYear}
              onChange={(e) => {
                setVintageYear(e.target.value);
                setIsNetZeroSimulated(false);
              }}
              className="appearance-none px-4 py-2.5 pr-9 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-2xl text-xs font-mono font-bold text-[#14382C] focus:outline-none focus:ring-2 focus:ring-[#14382C] transition cursor-pointer"
            >
              <option value="2026">Tahun Buku Emisi 2026</option>
              <option value="2027">Tahun Buku Emisi 2027</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* AuditDeadlineBadge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium shadow-2xs">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-mono text-[11px]">
              Tenggat Pelaporan GRK KLHK ({vintageYear}): <strong>30 April {parseInt(vintageYear) + 1}</strong> — Sisa 186 Hari
            </span>
          </div>
        </div>
      </div>

      {/* B. Kartu Metrik Neraca Karbon (EmissionBalanceGrid) - 4 Kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartu 1: Total Emisi Berjalan (GrossEmissionCard) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Emisi Berjalan
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                Gross Emisi
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black text-[#14382C] font-mono tracking-tight">
                {grossEmissions.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">tCO2e</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Akumulasi sensor IoT/ERP pabrik &amp; input manual fasilitas industri.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Tahun Buku: {vintageYear}</span>
            <span className="text-emerald-700 font-bold">Scope 1 &amp; 2</span>
          </div>
        </div>

        {/* Kartu 2: Total Karbon Ditebus (RetiredCarbonCard) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Karbon Ditebus
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                RETIRED
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black text-emerald-700 font-mono tracking-tight">
                {currentRetired.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">tCO2e</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Status resmi: <strong>RETIRED &amp; Terkunci di SRN-PPI</strong> KLHK.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Progress: {((currentRetired / grossEmissions) * 100).toFixed(0)}% Selesai</span>
            <button
              onClick={() => onNavigateTab('certificates')}
              className="text-emerald-700 hover:text-emerald-800 font-sans font-bold underline"
            >
              Lihat Sertifikat
            </button>
          </div>
        </div>

        {/* Kartu 3: Defisit / Sisa Kewajiban Emisi (NetEmissionGapCard) */}
        <div className={`rounded-3xl p-5 border shadow-2xs flex flex-col justify-between transition-all ${
          netDeficit === 0
            ? 'bg-emerald-50/80 border-emerald-300'
            : 'bg-amber-50/60 border-amber-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Defisit / Sisa Kewajiban
              </span>
              {netDeficit === 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-600 text-white shadow-2xs">
                  NET-ZERO ACHIEVED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900">
                  Gap Emisi
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-3xl font-black font-mono tracking-tight ${
                netDeficit === 0 ? 'text-emerald-700' : 'text-amber-900'
              }`}>
                {netDeficit.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-mono font-bold text-slate-600">tCO2e</span>
            </div>

            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              {netDeficit === 0
                ? 'Seluruh output emisi telah seimbang 100% dengan kredit karbon terverifikasi.'
                : 'Kekurangan kuota penebusan untuk memenuhi audit kepatuhan tahunan.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            {netDeficit > 0 ? (
              <button
                onClick={() => onNavigateTab('marketplace')}
                className="w-full py-2 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>Tebus Kekurangan Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Kepatuhan 100% Terpenuhi</span>
              </span>
            )}
          </div>
        </div>

        {/* Kartu 4: Saldo Deposit Aktif (QuickWalletCard) */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saldo Deposit Aktif</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-emerald-300">
                Pre-funded
              </span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-black text-white font-mono tracking-tight block">
                {formatRupiah(depositBalance)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Saldo siap pakai untuk pemotongan transaksi instan &amp; integrasi Auto-Buy API.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateTab('wallet')}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline text-[11px]"
            >
              Kelola Billing
            </button>
            <button
              onClick={onOpenTopUpModal}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition"
            >
              Top-Up Deposit
            </button>
          </div>
        </div>
      </div>

      {/* Demo Simulation Bar */}
      <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-600 font-medium">
          💡 <strong>Simulator Presentasi:</strong> Uji visualisasi kondisi saat perusahaan mencapai target Net-Zero 100%.
        </span>
        <button
          onClick={() => setIsNetZeroSimulated(!isNetZeroSimulated)}
          className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs transition border ${
            isNetZeroSimulated
              ? 'bg-emerald-700 text-white border-emerald-800'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {isNetZeroSimulated ? '✓ Mode Net-Zero Aktif (Klik untuk Reset)' : 'Simulasikan Neraca Net-Zero (0 tCO2e Gap)'}
        </button>
      </div>

      {/* C. Grafik Tren Akumulasi & Top-Up Bulanan (EmissionVsOffsetChart) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#14382C]">
              Grafik Komparasi Output Emisi Pabrik vs Penebusan Karbon (EmissionVsOffsetChart)
            </h2>
            <p className="text-xs text-slate-500">
              Perbandingan tren bulanan antara kurva kenaikan emisi pabrik vs batang penebusan kredit karbon (offset top-up).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block"></span>
              <span className="text-slate-600">Emisi Pabrik (tCO2e)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
              <span className="text-slate-600">Offset Ditebus (tCO2e)</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyData2026}
              margin={{ top: 10, right: 20, bottom: 0, left: -10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis unit=" t" tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip content={<CustomChartTooltip />} />
              <Area 
                type="monotone" 
                dataKey="emission" 
                fill="#FEF3C7" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Output Emisi"
              />
              <Bar 
                dataKey="offset" 
                barSize={18} 
                fill="#10B981" 
                radius={[6, 6, 0, 0]} 
                name="Offset Ditebus"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* D. Widget Ringkasan Dampak Sosial ESG (SocialImpactSummaryCard) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-extrabold text-[#14382C] text-sm sm:text-base">
                Ringkasan Dampak Sosial &amp; Konservasi ESG (SocialImpactSummaryCard)
              </h3>
              <p className="text-xs text-slate-500">
                Metrik terukur kontribusi sosial pemberdayaan masyarakat adat &amp; petani untuk Laporan Keberlanjutan Investor (POJK 51).
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-mono font-bold hidden sm:inline-block">
            GRI 305 Standards
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Total Petani Mikro Terbantu
            </span>
            <strong className="text-lg font-black text-[#14382C] block mt-1 font-sans">
              420 Petani Lokal
            </strong>
            <span className="text-[11px] text-slate-500">
              Jawa Tengah (Wonosobo &amp; Sindoro) &amp; Jawa Barat
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Total Luas Konservasi Agroforestri
            </span>
            <strong className="text-lg font-black text-emerald-700 block mt-1 font-mono">
              85,4 Hektare
            </strong>
            <span className="text-[11px] text-slate-500">
              Kawasan Lindung &amp; Terasering Rawan Longsor
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Komposisi Spesies Pohon Penyerap
            </span>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                45% Alpukat &amp; Durian
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                35% Sengon &amp; Jati
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900">
                20% Kopi &amp; Mangrove
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
