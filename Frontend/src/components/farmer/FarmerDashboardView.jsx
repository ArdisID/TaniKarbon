import React from 'react';
import { 
  Leaf, 
  Menu, 
  Plus, 
  Wallet, 
  Lock, 
  Trees, 
  Gauge, 
  Ruler, 
  MapPinned, 
  Frame, 
  Check, 
  Clock, 
  ArrowRight, 
  Info, 
  ScanLine, 
  ClipboardList,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function FarmerDashboardView({ 
  farmerSummary = null,
  realLands = [],
  onNavigateTab, 
  onOpenSatelliteModal,
  onOpenWithdrawal,
  onOpenMobileNav,
  availableBalance = 0,
  escrowBalance = 0
}) {
  // Real data normalization from backend summary
  const displayName = farmerSummary?.farmer_name || 'Petani Mitra';
  
  const rawArea = (farmerSummary?.total_land_area_sqm !== undefined && farmerSummary?.total_land_area_sqm !== null)
    ? Number(farmerSummary.total_land_area_sqm)
    : 0;
  const totalAreaHa = (rawArea / 10000).toFixed(2);
  const totalAreaM2 = rawArea.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  
  const totalTrees = (farmerSummary?.total_all_trees !== undefined && farmerSummary?.total_all_trees !== null)
    ? Number(farmerSummary.total_all_trees)
    : 0;
  
  const totalCarbon = (farmerSummary?.total_all_carbon_tco2e !== undefined && farmerSummary?.total_all_carbon_tco2e !== null)
    ? Number(farmerSummary.total_all_carbon_tco2e).toFixed(2)
    : '0.00';
  
  const activeAvailable = (farmerSummary?.available_balance !== undefined && farmerSummary?.available_balance !== null)
    ? Number(farmerSummary.available_balance)
    : (availableBalance !== undefined && availableBalance !== null ? Number(availableBalance) : 0);
  
  const activeEscrow = (farmerSummary?.escrow_balance !== undefined && farmerSummary?.escrow_balance !== null)
    ? Number(farmerSummary.escrow_balance)
    : (escrowBalance !== undefined && escrowBalance !== null ? Number(escrowBalance) : 0);
  
  const totalPlots = (farmerSummary?.total_land_plots !== undefined && farmerSummary?.total_land_plots !== null)
    ? Number(farmerSummary.total_land_plots)
    : (Array.isArray(realLands) ? realLands.length : 0);

  // Species breakdown list - Strictly real from backend, no Sengon Laut fallback!
  const speciesList = Array.isArray(farmerSummary?.species_breakdown)
    ? farmerSummary.species_breakdown
    : [];

  // Land plots list - Strictly realLands, no fallbackPlots!
  const plotList = Array.isArray(realLands) ? realLands : [];
  const verifiedCount = plotList.filter(p => p.status === 'verified' || p.status === 'active').length;
  const pendingCount = plotList.filter(p => p.status === 'draft' || p.status === 'pending' || p.status === 'pending_survey').length;

  // 1. Upcoming Inspections - Strictly dynamic from backend, no fallbackInspections!
  const inspections = Array.isArray(farmerSummary?.upcoming_inspections)
    ? farmerSummary.upcoming_inspections
    : [];

  // 2. Recent Wallet Activities - Strictly dynamic from backend, no fallbackActivities!
  const activities = Array.isArray(farmerSummary?.recent_wallet_activities)
    ? farmerSummary.recent_wallet_activities
    : [];

  // 3. Cluster Info - Real cluster aggregation from PostgreSQL clusters table
  const clusterInfo = farmerSummary?.cluster_info || null;

  const formatDate = (ts) => {
    if (!ts) return '-';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return String(ts);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return String(ts);
    }
  };

  return (
    <div className="space-y-6">

      {/* ================= SECTION A · PAGE HEADER ================= */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <Leaf className="h-3 w-3" />
            AgroPulse Petani Binaan
          </span>

          <h1 className="mt-2.5 text-[26px] font-extrabold leading-tight tracking-tight text-pine sm:text-3xl">
            Dashboard Ringkasan
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-500">
            Selamat datang kembali, <span className="font-semibold text-stone-700">{displayName}</span>
            <span className="mx-1 text-stone-300">•</span>
            Pantau serapan karbon dan bagi hasil kebun Anda.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Mobile-only drawer trigger (no top navbar) */}
          <button 
            type="button" 
            onClick={onOpenMobileNav}
            aria-label="Buka navigasi"
            className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 lg:hidden cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Single primary CTA */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('wizard')}
            className="inline-flex items-center gap-2 rounded-xl bg-pine px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-pine-900 active:scale-[0.99] cursor-pointer"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            Daftarkan Lahan Baru
          </button>
        </div>
      </header>

      {/* ================= KOMPONEN 1 · ACTIONABLE WIDGET: JADWAL KUNJUNGAN SURVEYOR ================= */}
      {inspections.length > 0 && (
        <section 
          className="overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-emerald-50/30 to-white p-4 sm:p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
          aria-label="Jadwal Kunjungan Surveyor"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            
            {/* Left: Info & Badges */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Calendar className="h-5 w-5" />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200/80">
                    Audit Lapangan Terjadwal
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    </span>
                    Tahap Pra-Verifikasi
                  </span>
                </div>

                <h3 className="mt-1 text-base font-bold text-pine truncate">
                  {inspections[0].land_plot_name}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    <span>Petugas: <strong className="text-stone-800">{inspections[0].surveyor_name}</strong></span>
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {inspections[0].surveyor_code}
                    </span>
                  </span>
                  <span className="text-stone-300 hidden sm:inline">•</span>
                  <span className="text-[11px] text-stone-500 truncate">{inspections[0].status_note}</span>
                </div>
              </div>
            </div>

            {/* Right: Date Badge & Action Button */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-amber-200/50 pt-3 md:border-0 md:pt-0">
              <div className="text-left md:text-right">
                <span className="block font-mono text-[10px] uppercase font-semibold text-stone-400">Rencana Kunjungan</span>
                <span className="font-mono text-sm font-bold text-pine">{inspections[0].scheduled_date}</span>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('timeline')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition active:scale-[0.98] cursor-pointer"
              >
                <span>Lacak Verifikasi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </section>
      )}

      {/* ================= SECTION B · 4 CORE KPI BENTO CARDS ================= */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4" aria-label="Metrik utama">

        {/* KPI 1 · Saldo Siap Ditarik (PRIMARY / DARK) */}
        <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-pine p-5 text-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
          <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl"></span>

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100/60">Saldo Siap Ditarik</p>
              {/* available_balance */}
              <p className="tnum mt-2 font-mono text-[28px] font-bold leading-none tracking-tight text-white">
                {formatRupiah(activeAvailable)}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-100/70">
                <Wallet className="h-3 w-3" /> Dompet Mitra Terverifikasi
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
              Bagi Hasil 90%
            </span>
          </div>

          <div className="relative mt-5 border-t border-white/10 pt-3">
            <button 
              type="button"
              onClick={() => {
                if (onOpenWithdrawal) onOpenWithdrawal();
                else if (onNavigateTab) onNavigateTab('wallet');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 transition hover:text-emerald-300 cursor-pointer"
            >
              <span>Tarik Dana</span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </article>

        {/* KPI 2 · Saldo Escrow */}
        <article className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Saldo Escrow (Tertahan)</p>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <Lock className="h-4 w-4" />
            </span>
          </div>
          {/* escrow_balance */}
          <p className="tnum mt-3 font-mono text-[28px] font-bold leading-none tracking-tight text-amber-600">
            {formatRupiah(activeEscrow)}
          </p>
          <p className="mt-2.5 text-[11px] leading-relaxed text-stone-500">
            Menunggu pencairan transaksi klaster berikutnya.
          </p>
        </article>

        {/* KPI 3 · Total Serapan Karbon Aktif */}
        <article className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Total Serapan Aktif</p>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <Trees className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            {/* total_all_carbon_tco2e */}
            <span className="tnum font-mono text-[28px] font-bold leading-none tracking-tight text-pine">{totalCarbon}</span>
            <span className="font-mono text-xs font-medium text-stone-400">tCO2e/thn</span>
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-stone-500">
            <Gauge className="h-3 w-3 text-emerald-600" />
            Kalkulasi Alometrik Chave Tier-3
          </p>
        </article>

        {/* KPI 4 · Total Luas & Populasi */}
        <article className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Total Luas Lahan</p>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-500">
              <Ruler className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tnum font-mono text-[28px] font-bold leading-none tracking-tight text-pine">{totalAreaHa} Ha</span>
            {/* total_land_area_sqm */}
            <span className="tnum font-mono text-[11px] font-medium text-stone-400">({totalAreaM2} m²)</span>
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-stone-500">
            <MapPinned className="h-3 w-3 text-emerald-600" />
            {/* total_land_plots & total_all_trees */}
            <span className="tnum font-mono">{totalPlots} Petak Kebun • {totalTrees} Pohon Terdata</span>
          </p>
        </article>
      </section>

      {/* ================= SECTION C · OPERATIONAL DETAIL CARDS ================= */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Detail operasional">

        {/* LEFT (7/12) · Komposisi Spesies & Daftar Petak */}
        <article className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card lg:col-span-7 lg:p-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold leading-tight tracking-tight text-pine">Komposisi Blok Tanaman &amp; Petak Kebun</h2>
              <p className="mt-1 text-[11px] text-stone-500">Rincian spesies dominan dan status petak terdaftar.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Trees className="h-3 w-3" /> {totalTrees} Pohon Terdata
            </span>
          </header>

          {/* Part 1 · Species breakdown */}
          <div className="mt-5 space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Spesies &amp; Yield Karbon</p>

            {speciesList.length > 0 ? (
              speciesList.map((item, idx) => {
                const count = item.total_trees || item.tree_count || 0;
                const carbon = Number(item.total_carbon_tco2e || 0).toFixed(2);

                return (
                  <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/60 px-3.5 py-3 transition hover:border-emerald-100 hover:bg-emerald-50/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Trees className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-800">{item.species_name}</p>
                        <p className="tnum mt-0.5 truncate font-mono text-[11px] text-stone-500">{count} Batang</p>
                      </div>
                    </div>
                    <span className="tnum shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                      {carbon} tCO2e/thn
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 py-5 px-4 text-center">
                <Leaf className="h-6 w-6 text-stone-300" />
                <p className="mt-1.5 text-xs font-medium text-stone-500">Belum ada data pohon terdata</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Spesies pohon akan muncul setelah Anda menambahkan data blok tanaman.</p>
              </div>
            )}
          </div>

          {/* Part 2 · Registered land plots */}
          <div className="mt-5 border-t border-stone-100 pt-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Petak Lahan Terdaftar</p>

            {plotList.length > 0 ? (
              <ul className="mt-2.5 divide-y divide-stone-100">
                {plotList.map((plot, idx) => {
                  const areaFormatted = Number(plot.area_sqm || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                  const isVerified = plot.status === 'verified' || plot.status === 'active';

                  return (
                    <li key={plot.id || idx} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-500">
                          <Frame className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-stone-800">{plot.name}</p>
                          <p className="tnum font-mono text-[11px] text-stone-500">{areaFormatted} m²</p>
                        </div>
                      </div>
                      {isVerified ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                          <Check className="h-3 w-3" /> Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
                          <Clock className="h-3 w-3" /> Draft / Menunggu Audit
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-2.5 flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-5 text-center">
                <Leaf className="h-7 w-7 text-stone-300" />
                <p className="mt-2 text-xs font-semibold text-stone-600">Belum ada lahan terdaftar</p>
                <p className="mt-0.5 text-[11px] text-stone-400">Petakan batas poligon kebun Anda untuk mulai verifikasi serapan karbon.</p>
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('wizard')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-pine-900 active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>+ Daftarkan Lahan Baru</span>
                </button>
              </div>
            )}
          </div>

          <footer className="mt-auto pt-5">
            <button 
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('land')}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 cursor-pointer"
            >
              <span>Kelola Semua Petak &amp; Blok Pohon</span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </footer>
        </article>

        {/* RIGHT (5/12) · Status Verifikasi & Kuota Klaster */}
        <article className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card lg:col-span-5 lg:p-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold leading-tight tracking-tight text-pine">Status Audit &amp; Progres Klaster</h2>
              <p className="mt-1 text-[11px] text-stone-500">Agregasi klaster menuju transaksi offset korporasi.</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold ring-1 ring-inset ${
              clusterInfo 
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' 
                : 'bg-amber-50 text-amber-700 ring-amber-200'
            }`}>
              <span className="relative flex h-1.5 w-1.5">
                {clusterInfo && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${clusterInfo ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              {clusterInfo ? 'Siklus Klaster Aktif' : 'Menunggu Alokasi Klaster'}
            </span>
          </header>

          {/* Part 1 · Cluster quota progress */}
          <div className="mt-5 rounded-xl border border-stone-100 bg-stone-50/60 p-4">
            {clusterInfo ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-pine truncate">{clusterInfo.cluster_name}</p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <p className="tnum font-mono text-2xl font-bold leading-none tracking-tight text-pine">
                        {clusterInfo.percentage}%
                      </p>
                      <p className="text-[11px] text-stone-500">Kuota Terpenuhi</p>
                    </div>
                  </div>
                  <p className="tnum font-mono text-[11px] font-medium text-stone-500 shrink-0">
                    {clusterInfo.current_carbon_tco2e} / {clusterInfo.target_tco2e} tCO2e
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-stone-200/70">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-[width] duration-700" 
                    style={{ width: `${Math.min(100, Math.max(2, clusterInfo.percentage))}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex justify-between font-mono text-[9px] text-stone-400">
                  <span>0</span>
                  <span>{Math.round(clusterInfo.target_tco2e / 2)}</span>
                  <span>{clusterInfo.target_tco2e} tCO2e</span>
                </div>
              </>
            ) : (
              <div className="py-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700">Kontribusi Serapan Mandiri</span>
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    {totalCarbon} tCO2e/thn
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-500">
                  Kebun terverifikasi Anda sedang dalam antrean pengelompokan klaster regional oleh Surveyor/Admin sebelum ditawarkan ke korporasi pembeli offset.
                </p>
              </div>
            )}

            <p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-stone-500 border-t border-stone-100 pt-3">
              <Info className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>
                Dana bagi hasil didistribusikan otomatis lewat <strong className="font-semibold text-stone-700">Smart Escrow</strong> setelah transaksi offset korporasi pada klaster terpenuhi.
              </span>
            </p>
          </div>

          {/* Part 2 · Verification checklist */}
          <div className="mt-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Checklist Verifikasi</p>

            <ul className="mt-2.5 space-y-2">
              <li className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ScanLine className="h-4 w-4" />
                  </span>
                  <p className="truncate text-[13px] font-semibold text-stone-800">Geofencing &amp; Poligon PostGIS</p>
                </div>
                <span className="tnum shrink-0 font-mono text-[11px] font-semibold text-emerald-700">
                  {plotList.length} Petak Terpetakan
                </span>
              </li>

              <li className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <p className="truncate text-[13px] font-semibold text-stone-800">Inspeksi Surveyor Lapangan</p>
                </div>
                <span className="tnum shrink-0 text-right font-mono text-[11px] font-semibold leading-tight text-stone-600">
                  <span className="text-emerald-700">{verifiedCount} Terverifikasi</span>,<br />
                  {pendingCount} Menunggu Kunjungan
                </span>
              </li>
            </ul>
          </div>

          <footer className="mt-auto pt-5">
            <button 
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('timeline')}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 cursor-pointer"
            >
              <span>Lihat Detail Lacak Verifikasi</span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </footer>
        </article>
      </section>

      {/* ================= KOMPONEN 2 · MINI-FEED MUTASI DOMPET TERAKHIR ================= */}
      <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card lg:p-6" aria-label="Mutasi Dompet Terakhir">
        <header className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <Wallet className="h-4 w-4" />
              </span>
              <h2 className="text-[15px] font-bold leading-tight tracking-tight text-pine">
                Riwayat Mutasi Dompet Terakhir
              </h2>
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              Transparansi dana masuk bagi hasil klaster korporat dan pencairan ke rekening terdaftar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('wallet')}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
          >
            <span>Lihat Semua Mutasi di Dompet Karbon</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </button>
        </header>

        {/* Activity List */}
        {activities.length > 0 ? (
          <div className="divide-y divide-stone-100 mt-1">
            {activities.map((act, idx) => {
              const isCredit = act.transaction_type === 'credit_payout';
              const isCompleted = act.status === 'completed';

              return (
                <div key={act.id || idx} className="flex items-center justify-between gap-3 py-3 transition hover:bg-stone-50/60 rounded-xl px-2.5 -mx-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-800">
                        {act.title || act.description}
                      </p>
                      <p className="tnum mt-0.5 truncate font-mono text-[11px] text-stone-400">
                        {formatDate(act.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`tnum font-mono text-sm font-bold leading-tight ${
                      isCredit ? 'text-emerald-700' : 'text-stone-800'
                    }`}>
                      {isCredit ? '+' : '-'}{formatRupiah(act.amount)}
                    </p>
                    <span className={`inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {isCompleted ? 'Selesai' : 'Diproses'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-stone-400">Belum ada aktivitas mutasi dompet.</p>
          </div>
        )}

        <footer className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-stone-400">
            Saldo Siap Ditarik: <strong className="text-pine font-mono font-bold">{formatRupiah(activeAvailable)}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              if (onOpenWithdrawal) onOpenWithdrawal();
              else if (onNavigateTab) onNavigateTab('wallet');
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            <span>Tarik Saldo</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </footer>
      </section>

      <p className="pt-1 text-center font-mono text-[10px] text-stone-400">
        TaniKarbon · Portal Mitra Petani — data metrik tersinkron dengan basis data spasial PostGIS
      </p>
    </div>
  );
}
