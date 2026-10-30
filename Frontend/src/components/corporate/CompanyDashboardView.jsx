import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Wallet, 
  Users, 
  Trees, 
  ShieldCheck, 
  ChevronDown,
  Activity,
  Award,
  Building2,
  ExternalLink,
  Layers,
  FileCheck,
  Download,
  Scale
} from 'lucide-react';
import { formatNumber } from '../../data';
import AnimatedNumber from '../common/AnimatedNumber';

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

  // Timeframe filter for analytics chart ('all' | 'sem1' | 'sem2')
  const [chartTimeframe, setChartTimeframe] = useState('all');

  // Dynamic calculations based on vintage year & simulation
  const grossEmissions = vintageYear === '2026' ? 1500 : 1850;
  const currentRetired = isNetZeroSimulated 
    ? grossEmissions 
    : (vintageYear === '2026' ? retiredCarbon : 450);
  const netDeficit = Math.max(0, grossEmissions - currentRetired);
  const completionPercentage = Math.min(100, Math.round((currentRetired / grossEmissions) * 100));

  // Monthly data for EmissionVsOffsetChart (Jan - Des)
  const allMonthlyData = useMemo(() => [
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
  ], [isNetZeroSimulated]);

  // Filtered chart data based on timeframe
  const displayedMonthlyData = useMemo(() => {
    if (chartTimeframe === 'sem1') return allMonthlyData.slice(0, 6);
    if (chartTimeframe === 'sem2') return allMonthlyData.slice(6, 12);
    return allMonthlyData;
  }, [allMonthlyData, chartTimeframe]);

  // Executive Tooltip Mewah & Bersih (Gaya Linear & Health Dashboard)
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const emissionVal = payload[0]?.value || 0;
      const offsetVal = payload[1]?.value || 0;
      const netMonthly = Math.max(0, emissionVal - offsetVal);

      return (
        <div className="bg-[#0F1E2E]/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-sky-500/30 text-xs font-sans min-w-[210px] animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-700/70 pb-2 mb-2.5">
            <span className="font-extrabold text-sky-300 text-sm">{label} {vintageYear}</span>
            <span className="text-[10px] font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
              Scope 1 &amp; 2
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>Output Pabrik:</span>
              </span>
              <strong className="text-white font-bold tabular-nums">{emissionVal} tCO2e</strong>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>Offset Ditebus:</span>
              </span>
              <strong className="text-sky-300 font-bold tabular-nums">{offsetVal} tCO2e</strong>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Selisih Bersih:</span>
              <span className={`font-extrabold tabular-nums ${netMonthly === 0 ? 'text-sky-300' : 'text-amber-300'}`}>
                {netMonthly === 0 ? 'Net-Zero Seimbang' : `Defisit ${netMonthly} tCO2e`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-fade-in pb-16 font-sans">
      {/* 
        ========================================================================
        1. BANNER OVERVIEW EKSEKUTIF KORPORAT (100% PALET BIRU PROFESIONAL)
        Header tanpa AI slop, responsif di mobile & desktop, bebas teks tumpah
        ========================================================================
      */}
      <div className="bg-white rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 lg:p-8 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,30,46,0.03)] relative overflow-hidden">
        {/* Subtle executive blue gradient aura */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-sky-50 via-sky-50/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-sky-900 bg-sky-100/80 px-3 py-1 rounded-full border border-sky-300/80 flex items-center gap-1.5 shrink-0">
                <Building2 className="w-3.5 h-3.5 text-sky-700" />
                <span>Portal ESG &amp; Emisi Industri</span>
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Buku Emisi Terdaftar SRN-PPI KLHK</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0F1E2E] tracking-tight font-sans truncate">
              PT Industri Hijau Nusantara (Tbk)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed max-w-2xl">
              Neraca kepatuhan dekarbonisasi fasilitas manufaktur terhadap kredit karbon terverifikasi bursa TaniKarbon (POJK No. 51 &amp; ISO 14064-2).
            </p>
          </div>

          {/* Controls: Vintage Year Switcher & Audit Countdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* EmissionPeriodSelector */}
            <div className="relative">
              <select
                value={vintageYear}
                onChange={(e) => {
                  setVintageYear(e.target.value);
                  setIsNetZeroSimulated(false);
                }}
                className="w-full sm:w-auto appearance-none pl-4 pr-10 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-2xl text-xs font-sans font-bold text-[#0F1E2E] focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition cursor-pointer shadow-2xs"
              >
                <option value="2026">Tahun Buku Emisi 2026</option>
                <option value="2027">Tahun Buku Emisi 2027</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* AuditDeadlineBadge (100% Blue Themed) */}
            <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-sky-50/80 text-sky-950 border border-sky-200/90 text-xs shadow-2xs">
              <Clock className="w-4 h-4 text-sky-700 shrink-0" />
              <div className="text-left font-sans min-w-0">
                <span className="block text-[10px] text-sky-700 uppercase tracking-wider font-extrabold">Tenggat Audit KLHK</span>
                <span className="font-sans text-xs font-bold text-sky-950 truncate block">
                  30 April {parseInt(vintageYear) + 1} · <strong className="tabular-nums font-black text-[#0F1E2E]">186 Hari Sisa</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. KARTU METRIK UTAMA (4 KPI KORPORAT BIRU)
        - Tata letak responsif: 1 col (mobile), 2 col (tablet/laptop), 4 col (layar lebar)
        - Tidak ada teks yang keluar/tumpah dari kartu!
        - 100% fokus tema biru, tanpa simbol AI slop
        ========================================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KARTU 1: Gross Factory Emissions (Total Emisi) */}
        <div className="bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_20px_rgba(15,30,46,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-w-0 group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                <Activity className="w-5 h-5 text-sky-600" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-sans bg-slate-100 text-slate-700 truncate">
                Gross Emisi
              </span>
            </div>

            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Total Emisi Berjalan
            </span>

            <div className="flex items-baseline gap-1.5 mt-1.5 min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F1E2E] tracking-tight font-sans tabular-nums truncate">
                <AnimatedNumber value={grossEmissions} />
              </span>
              <span className="text-xs font-bold text-slate-500 font-sans shrink-0">tCO2e</span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-sans line-clamp-2">
              Agregasi sensor IoT cerobong &amp; log energi fasilitas kuartal berjalan.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>Tahun Buku: <strong className="tabular-nums text-slate-800 font-bold">{vintageYear}</strong></span>
            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200/60">
              Scope 1 &amp; 2
            </span>
          </div>
        </div>

        {/* KARTU 2: Carbon Offsets Retired (Kredit Karbon Ditebus) */}
        <div className="bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_20px_rgba(15,30,46,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-w-0 group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-sans bg-blue-50 text-blue-900 border border-blue-200/80 truncate">
                RETIRED &amp; TERKUNCI
              </span>
            </div>

            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Total Karbon Ditebus
            </span>

            <div className="flex items-baseline gap-1.5 mt-1.5 min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight font-sans tabular-nums truncate">
                <AnimatedNumber value={currentRetired} />
              </span>
              <span className="text-xs font-bold text-blue-700 font-sans shrink-0">tCO2e</span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-sans line-clamp-2">
              Status resmi: Terkunci permanen di Registry SRN-PPI KLHK.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
            <span className="text-slate-600 tabular-nums font-semibold">{completionPercentage}% Terpenuhi</span>
            <button
              onClick={() => onNavigateTab('certificates')}
              className="text-blue-700 hover:text-blue-900 font-bold underline text-xs cursor-pointer inline-flex items-center gap-1"
            >
              <span>Sertifikat</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KARTU 3: Target Ketercapaian Net-Zero & Defisit Emisi */}
        <div className="bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_20px_rgba(15,30,46,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-w-0 group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-100/70 text-sky-800 border border-sky-200 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                <Scale className="w-5 h-5 text-sky-700" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-sans truncate ${
                netDeficit === 0
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-sky-100 text-sky-900 border border-sky-300/80'
              }`}>
                {netDeficit === 0 ? 'NET-ZERO 100%' : 'DEFISIT KUOTA'}
              </span>
            </div>

            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Sisa Defisit Emisi
            </span>

            <div className="flex items-baseline gap-1.5 mt-1.5 min-w-0">
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-sans tabular-nums truncate ${
                netDeficit === 0 ? 'text-blue-700' : 'text-[#0F1E2E]'
              }`}>
                <AnimatedNumber value={netDeficit} />
              </span>
              <span className="text-xs font-bold text-slate-500 font-sans shrink-0">tCO2e Gap</span>
            </div>

            {/* Linear Progress Bar (Tidak memakan tempat dan tidak membuat teks tumpah) */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>Rasio Penebusan</span>
                <span className="font-extrabold text-blue-700 tabular-nums">{completionPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70">
                <div 
                  style={{ width: `${completionPercentage}%` }} 
                  className="h-full bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 rounded-full transition-all duration-700 ease-out" 
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100">
            {netDeficit > 0 ? (
              <button
                onClick={() => onNavigateTab('marketplace')}
                className="w-full py-2.5 px-3 bg-[#0F1E2E] hover:bg-[#1A3147] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <span>Tebus Sisa Defisit</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
              </button>
            ) : (
              <div className="w-full py-2 px-3 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Target Net-Zero Terpenuhi</span>
              </div>
            )}
          </div>
        </div>

        {/* KARTU 4: Pre-Funded Escrow Account (Saldo Dompet) */}
        <div className="bg-[#0F1E2E] text-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border border-slate-800 shadow-[0_4px_24px_rgba(15,30,46,0.14)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-w-0 group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 text-sky-300 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                <Wallet className="w-5 h-5 text-sky-400" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-sans bg-sky-500/20 text-sky-200 border border-sky-400/30 truncate">
                Pre-funded Escrow
              </span>
            </div>

            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Saldo Deposit Aktif
            </span>

            <div className="flex items-baseline mt-1.5 min-w-0">
              <span className="text-lg sm:text-xl font-bold text-slate-300 mr-1.5 font-sans shrink-0">Rp</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight tabular-nums truncate">
                <AnimatedNumber value={depositBalance} />
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-sans line-clamp-2">
              Saldo siap pakai untuk pemotongan bursa instan &amp; integrasi API.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('wallet')}
              className="text-sky-300 hover:text-white font-bold underline text-[11px] cursor-pointer"
            >
              Billing
            </button>
            <button
              onClick={onOpenTopUpModal}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
            >
              Top-Up Dana
            </button>
          </div>
        </div>

      </div>

      {/* 
        ========================================================================
        3. TINJAUAN SKENARIO AUDIT (BERSIH DARI EMOJI & AI SLOP)
        Bar minimalis interaktif untuk uji dewan direksi
        ========================================================================
      */}
      <div className="p-4 px-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-600 font-medium">
          <Layers className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            <strong>Simulasi Kepatuhan Dewan Direksi:</strong> Uji visualisasi neraca saat seluruh gap emisi pabrik telah ditebus 100%.
          </span>
        </div>
        <button
          onClick={() => setIsNetZeroSimulated(!isNetZeroSimulated)}
          className={`px-4 py-2 rounded-xl font-bold font-sans text-xs transition border cursor-pointer shrink-0 flex items-center gap-1.5 ${
            isNetZeroSimulated
              ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
              : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
          }`}
        >
          {isNetZeroSimulated ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
              <span>Mode Net-Zero Aktif (Klik Reset)</span>
            </>
          ) : (
            <span>Simulasikan Neraca Net-Zero (0 Defisit)</span>
          )}
        </button>
      </div>

      {/* 
        ========================================================================
        4. GRAFIK ANALITIK MEWAH: TREN EMISI PABRIK VS PENEBUSAN KARBON
        - Menggunakan palet biru korporat eksklusif dengan gradient area & rounded bar
        - Ringkasan KPI mini langsung di atas grafik
        - Filter rentang waktu interaktif (Semua / Semester 1 / Semester 2)
        - Tooltip mewah berkaca gelap
        ========================================================================
      */}
      <div className="bg-white rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 lg:p-8 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,30,46,0.03)] font-sans">
        
        {/* Header Grafik & Filter Waktu */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-sky-900 bg-sky-100/70 px-3 py-0.5 rounded-full border border-sky-200/80">
                Data Analitik Bulanan
              </span>
              <span className="text-xs text-slate-400 font-medium">Kuartal I - IV {vintageYear}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F1E2E] font-sans tracking-tight mt-1.5">
              Tren Output Emisi Manufaktur vs Kredit Karbon Ditebus
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5 max-w-xl">
              Komparasi neraca output fasilitas industri terhadap kuota sertifikat kredit karbon yang telah ditebus di bursa.
            </p>
          </div>

          {/* Timeframe & Legend Strip */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartTimeframe('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartTimeframe === 'all'
                    ? 'bg-white text-blue-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Tahun
              </button>
              <button
                type="button"
                onClick={() => setChartTimeframe('sem1')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartTimeframe === 'sem1'
                    ? 'bg-white text-blue-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semester 1
              </button>
              <button
                type="button"
                onClick={() => setChartTimeframe('sem2')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartTimeframe === 'sem2'
                    ? 'bg-white text-blue-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semester 2
              </button>
            </div>

            {/* Custom Modern Legend */}
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                <span className="text-slate-700 font-semibold">Emisi Pabrik</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                <span className="text-slate-700 font-semibold">Offset Ditebus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Micro-Metrics Insight Strip (Sleek High-End Executive Data Bar) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 mb-6 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rata-Rata Emisi</span>
            <strong className="text-sm font-extrabold text-[#0F1E2E] tabular-nums">122,5 tCO2e / bln</strong>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Puncak Emisi Tertinggi</span>
            <strong className="text-sm font-extrabold text-[#0F1E2E] tabular-nums">145 tCO2e (Juli)</strong>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Penebusan Berjalan</span>
            <strong className="text-sm font-extrabold text-blue-700 tabular-nums">{currentRetired} tCO2e</strong>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rasio Kepatuhan Buku</span>
            <strong className="text-sm font-extrabold text-blue-700 tabular-nums">{completionPercentage}% Terpenuhi</strong>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 sm:h-84 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayedMonthlyData}
              margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
            >
              {/* Definisi Gradient Warna Biru Mewah */}
              <defs>
                <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="barSkyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} 
                axisLine={{ stroke: '#E2E8F0' }} 
                tickLine={false} 
              />
              <YAxis 
                unit=" t" 
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Area 
                type="monotone" 
                dataKey="emission" 
                fill="url(#blueAreaGrad)" 
                stroke="#64748B" 
                strokeWidth={2.5}
                name="Output Emisi"
              />
              <Bar 
                dataKey="offset" 
                barSize={20} 
                fill="url(#barSkyGrad)" 
                radius={[8, 8, 0, 0]} 
                name="Offset Ditebus"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 
        ========================================================================
        5. BENTO GRID: DAMPAK SOSIAL & KONSERVASI ESG (100% TEMA BIRU KORPORAT)
        - Standar GRI 305 & POJK No. 51
        - Bebas dari warna hijau yang bertabrakan, menggunakan cyan/blue/navy
        ========================================================================
      */}
      <div className="bg-white rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 lg:p-8 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,30,46,0.03)] font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center border border-sky-100 shrink-0">
              <Users className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0F1E2E] text-base font-sans tracking-tight">
                Ringkasan Dampak Sosial &amp; Konservasi ESG
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Metrik terukur kontribusi sosial pemberdayaan masyarakat adat &amp; petani untuk Laporan Keberlanjutan Investor.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-sans font-bold self-start sm:self-auto border border-slate-200">
            GRI 305 &amp; POJK 51 Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
          
          {/* Card A: Petani Mikro Terbantu */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Petani Binaan
              </span>
              <strong className="text-2xl font-black text-[#0F1E2E] block mt-1.5 font-sans tabular-nums">
                420 Petani Mikro
              </strong>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Mitra tani agroforestri di lereng Gunung Sindoro (Wonosobo) &amp; Pegunungan Kendeng.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-blue-900 font-bold">
              <span>Bagi Hasil Tunai: 88% Langsung</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>

          {/* Card B: Luas Konservasi */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Area Konservasi Aktif
              </span>
              <strong className="text-2xl font-black text-blue-700 block mt-1.5 font-sans tabular-nums">
                85,4 Hektare
              </strong>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Kawasan lindung &amp; terasering curam rawan erosi yang kini terlindungi vegetasi tegakan pohon abadi.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span>Verifikasi: Citra Sentinel-2 (NDVI 0.88)</span>
            </div>
          </div>

          {/* Card C: Komposisi Spesies (Pohon Multi-Strata) */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Komposisi Pohon Penyerap
              </span>
              
              {/* Stacked Progress Bar (100% Biru / Cyan / Navy) */}
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex mt-3 shadow-inner">
                <div style={{ width: '45%' }} className="bg-blue-600 h-full" title="Alpukat & Durian: 45%" />
                <div style={{ width: '35%' }} className="bg-sky-500 h-full" title="Sengon & Jati: 35%" />
                <div style={{ width: '20%' }} className="bg-slate-700 h-full" title="Kopi & Mangrove: 20%" />
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3.5 font-sans">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                  45% Alpukat &amp; Durian
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-900 border border-sky-200">
                  35% Sengon &amp; Jati
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  20% Kopi &amp; Mangrove
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
              Formula Alometrik: BSN SNI 7724:2019
            </div>
          </div>

        </div>
      </div>

      {/* 
        ========================================================================
        6. WIDGET RIWAYAT PENEBUSAN TERAKHIR (RECENT CERTIFICATES SETTLEMENT)
        Eksekutif dapat langsung melihat bukti transaksi terbaru tanpa buka tab lain
        ========================================================================
      */}
      <div className="bg-white rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,30,46,0.03)] font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-extrabold text-[#0F1E2E] text-base font-sans tracking-tight">
              Penebusan &amp; Settlement Sertifikat Terakhir
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Daftar kredit karbon yang baru saja didebet dan dikunci ke Tahun Buku {vintageYear}.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('certificates')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Buka Registry Sertifikat Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden text-xs">
          <div className="p-3.5 sm:p-4 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-sky-50/40 transition">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                <FileCheck className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-sm">Klaster Agroforestri Wonosobo Sindoro</p>
                <p className="text-[11px] text-slate-500 font-medium">Vintage {vintageYear} · Ref: ID-SRN-TK-8812B · Diperoleh via Auto-Buy API</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                12,5 tCO2e
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900">
                Terkunci SRN-PPI
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-sky-50/40 transition">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                <FileCheck className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-sm">Klaster Kemitraan Tani Garung Wonosobo</p>
                <p className="text-[11px] text-slate-500 font-medium">Vintage {vintageYear} · Ref: ID-SRN-TK-9941A · Penebusan Manual</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                500,0 tCO2e
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900">
                Terkunci SRN-PPI
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-sky-50/40 transition">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                <FileCheck className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-sm">Klaster Hutan Rakyat Kendeng Lestari</p>
                <p className="text-[11px] text-slate-500 font-medium">Vintage {vintageYear} · Ref: ID-SRN-TK-7703C · Diperoleh via Auto-Buy API</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                350,0 tCO2e
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900">
                Terkunci SRN-PPI
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
