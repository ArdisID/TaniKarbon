import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Leaf, 
  Plus, 
  Wallet, 
  Trees, 
  MapPinned, 
  ArrowUpRight, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Globe, 
  Bell, 
  Calendar,
  ChevronDown,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { formatRupiah } from '../../data';

// Helper hook for smooth animated number counting
function useAnimatedCounter(endValue, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
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

export default function FarmerDashboardView({ 
  farmerSummary = null,
  realLands = [],
  onNavigateTab, 
  onOpenSatelliteModal, 
  onOpenWithdrawal,
  availableBalance = 3250000,
  escrowBalance = 1450000
}) {
  // ---------------------------------------------------------------------------
  // 1. Permanent Vibrant TaniKarbon Green Theme
  // ---------------------------------------------------------------------------
  const theme = {
    primary: '#10B981',
    primaryHover: '#059669',
    gradientStart: '#10B981',
    gradientEnd: '#059669',
    activePillBg: 'bg-[#14382C]',
    activePillText: 'text-white',
    cardBadgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    chartFill: '#10B981',
    accentRing: 'focus:border-[#10B981] focus:ring-[#10B981]/20',
    tagBg: 'bg-emerald-50 text-emerald-700',
    buttonGradient: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)]'
  };

  // ---------------------------------------------------------------------------
  // 2. Data Metrics Dinamis dari PostgreSQL/PostGIS
  // ---------------------------------------------------------------------------
  const displayName = farmerSummary?.farmer_name || 'Mitra Tani';
  const rawBalance = Number(farmerSummary?.available_balance ?? availableBalance ?? 0);
  const rawCarbon = Number(
    farmerSummary?.total_all_carbon_tco2e ?? 
    realLands.reduce((acc, l) => acc + (l.tree_blocks || []).reduce((bAcc, b) => bAcc + Number(b.estimated_tco2e_per_year || 0), 0), 0)
  );
  const rawTrees = Number(
    farmerSummary?.total_all_trees ?? 
    realLands.reduce((acc, l) => acc + (l.tree_blocks || []).reduce((bAcc, b) => bAcc + Number(b.total_population || 0), 0), 0)
  );
  const rawAreaSqm = Number(
    farmerSummary?.total_land_area_sqm ?? 
    realLands.reduce((acc, l) => acc + Number(l.area_sqm || 0), 0)
  );
  const rawAreaHa = (rawAreaSqm / 10000).toFixed(2);
  const totalPlotsCount = Number(farmerSummary?.total_land_plots ?? realLands.length);

  // Estimasi dividen bersih 88% jika saldo tersedia belum ada pencairan
  const totalDividenValue = rawBalance > 0 
    ? rawBalance 
    : (rawCarbon > 0 ? Math.round(rawCarbon * 85000 * 0.88) : 0);
  const animatedBalance = useAnimatedCounter(totalDividenValue, 1400);

  // State timeframe chart
  const [timeframe, setTimeframe] = useState('monthly'); // 'monthly' | 'quarterly' | 'annual'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'verified' | 'pending'

  // Dynamic Monthly Chart Data (Jan - Des) based on real carbon accumulation
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentMonthIdx = new Date().getMonth();
    const peakCarbon = rawCarbon > 0 ? rawCarbon : 0;
    const estTotalDividen = Math.round(peakCarbon * 85000 * 0.88);

    return months.map((m, idx) => {
      const factor = idx <= currentMonthIdx ? ((idx + 1) / (currentMonthIdx + 1)) : 1;
      const cVal = parseFloat((peakCarbon * factor).toFixed(2));
      const rVal = Math.round(estTotalDividen * factor);
      return {
        month: m,
        carbon: cVal,
        revenue: rVal
      };
    });
  }, [rawCarbon]);

  // Dynamic Category Donut Chart Data (Spesies Pohon) from real tree blocks / DB breakdown
  const categoryData = useMemo(() => {
    const list = farmerSummary?.species_breakdown || [];
    const palette = ['#10B981', '#14382C', '#059669', '#34D399', '#047857', '#6EE7B7'];

    if (list && list.length > 0) {
      const total = list.reduce((s, item) => s + Number(item.total_carbon_tco2e || 0), 0) || 1;
      return list.map((item, idx) => ({
        name: item.species_name,
        value: Math.max(1, Math.round((Number(item.total_carbon_tco2e || 0) / total) * 100)),
        carbon: `${Number(item.total_carbon_tco2e || 0).toFixed(1)} tCO2e`,
        color: palette[idx % palette.length]
      }));
    }

    // Fallback: agregasi langsung dari realLands
    const map = {};
    realLands.forEach((l) => {
      (l.tree_blocks || []).forEach((tb) => {
        const sp = tb.species_name || 'Lainnya';
        map[sp] = (map[sp] || 0) + Number(tb.estimated_tco2e_per_year || 0);
      });
    });

    const entries = Object.entries(map);
    if (entries.length === 0) {
      return [{ name: 'Belum Ada Tegakan', value: 100, carbon: '0 tCO2e', color: '#E2E8F0' }];
    }

    const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
    return entries.map(([name, carb], idx) => ({
      name,
      value: Math.max(1, Math.round((carb / total) * 100)),
      carbon: `${carb.toFixed(1)} tCO2e`,
      color: palette[idx % palette.length]
    }));
  }, [farmerSummary, realLands]);

  // Recent Activity Table Data mapped directly from real lands & tree blocks
  const recentOrders = useMemo(() => {
    if (!realLands || realLands.length === 0) return [];
    const rows = [];
    const defaultPhotos = [
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=120&q=80',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=120&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=120&q=80'
    ];

    realLands.forEach((land, landIdx) => {
      const plotCode = `#LHN-${String(landIdx + 1).padStart(2, '0')}`;
      const tbs = land.tree_blocks || [];
      const photoUrl = (land.photos && land.photos.length > 0 && land.photos[0]?.photo_url)
        ? (land.photos[0].photo_url.startsWith('http') ? land.photos[0].photo_url : `http://127.0.0.1:8000${land.photos[0].photo_url}`)
        : defaultPhotos[landIdx % defaultPhotos.length];

      const createdDt = land.created_at ? new Date(land.created_at) : new Date();
      const dateStr = createdDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

      if (tbs.length === 0) {
        rows.push({
          id: `${plotCode}-00`,
          landId: land.id,
          plotCode,
          plotName: land.name,
          product: 'Belum Ada Blok Tegakan',
          amount: 'Rp 0',
          carbon: '0.0 tCO2e',
          status: land.status,
          statusLabel: land.status === 'verified' ? 'Terverifikasi' : (land.status === 'pending_survey' ? 'Dijadwalkan' : (land.status === 'revision' ? 'Perlu Revisi' : 'Draft')),
          date: dateStr,
          avatar: photoUrl
        });
      } else {
        tbs.forEach((tb, tbIdx) => {
          const carb = Number(tb.estimated_tco2e_per_year || 0);
          const estDividen = Math.round(carb * 85000 * 0.88);
          rows.push({
            id: `${plotCode}-${String(tbIdx + 1).padStart(2, '0')}`,
            landId: land.id,
            plotCode,
            plotName: land.name,
            product: `Blok ${tb.species_name} (${tb.total_population} Pohon)`,
            amount: formatRupiah(estDividen),
            carbon: `${carb.toFixed(1)} tCO2e`,
            status: land.status,
            statusLabel: land.status === 'verified' ? 'Terverifikasi' : (land.status === 'pending_survey' ? 'Dijadwalkan' : (land.status === 'revision' ? 'Perlu Revisi' : 'Draft')),
            date: dateStr,
            avatar: photoUrl
          });
        });
      }
    });
    return rows;
  }, [realLands]);

  // Filtered orders based on Search & Tabs (all | verified | pending)
  const filteredOrders = useMemo(() => {
    return recentOrders.filter(order => {
      const isVerified = order.status === 'verified' || order.status === 'clustered';
      if (activeTabFilter === 'verified' && !isVerified) return false;
      if (activeTabFilter === 'pending' && isVerified) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          order.id.toLowerCase().includes(q) ||
          order.product.toLowerCase().includes(q) ||
          order.plotName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [recentOrders, activeTabFilter, searchQuery]);

  // Top Performing Tree Blocks from Real Data
  const topProducts = useMemo(() => {
    const allBlocks = [];
    const defaultPhotos = [
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=160&q=80',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=160&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=160&q=80',
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=160&q=80'
    ];

    realLands.forEach((land, lIdx) => {
      (land.tree_blocks || []).forEach((tb, bIdx) => {
        const carb = Number(tb.estimated_tco2e_per_year || 0);
        const estRev = Math.round(carb * 85000 * 0.88);
        allBlocks.push({
          id: `${land.id}-${tb.id || bIdx}`,
          title: `${tb.species_name} - ${land.name}`,
          subtitle: `${tb.total_population} Pohon • DBH ${tb.avg_dbh_cm || '-'} cm`,
          sales: `${carb.toFixed(1)} tCO2e`,
          revenue: formatRupiah(estRev),
          carbonVal: carb,
          image: (land.photos && land.photos.length > 0 && land.photos[0]?.photo_url)
            ? (land.photos[0].photo_url.startsWith('http') ? land.photos[0].photo_url : `http://127.0.0.1:8000${land.photos[0].photo_url}`)
            : defaultPhotos[(lIdx + bIdx) % defaultPhotos.length]
        });
      });
    });

    allBlocks.sort((a, b) => b.carbonVal - a.carbonVal);
    return allBlocks.slice(0, 4);
  }, [realLands]);

  return (
    <div className="space-y-6 font-sans">
      {/* =========================================================================
          TOP ACTION BAR: SEARCH, SATELLITE, & DAFTARKAN LAHAN
          ========================================================================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-1">
        {/* Left: Brand Welcome */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              Klaster Wonosobo • Sukamaju
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">Bagi Hasil 88% Petani</span>
          </div>
          <h1 className="mt-1.5 text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight font-sans">
            Halo, {displayName}
          </h1>
          <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
            Pantau arus pendapatan dividen karbon, status telemetri satelit Sentinel-2, dan biometri tegakan pohon.
          </p>
        </div>

        {/* Center/Right: Rounded Search Bar & Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Rounded Search Bar */}
          <div className="relative w-full sm:w-64 lg:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari petak, pohon, ID..."
              className="w-full rounded-full bg-white border border-stone-200/80 pl-9 pr-8 py-2 text-xs text-stone-800 placeholder-stone-400 shadow-xs transition focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-2">
            {/* Satellite Telemetry Modal Trigger */}
            <button
              type="button"
              onClick={onOpenSatelliteModal}
              title="Pratinjau Telemetri Satelit Sentinel-2"
              className="w-10 h-10 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-600 hover:text-emerald-700 hover:bg-stone-50 transition shadow-xs cursor-pointer active:scale-95"
            >
              <Globe className="w-4 h-4 text-emerald-600" />
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              title="Notifikasi Sistem"
              className="w-10 h-10 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition shadow-xs relative cursor-pointer active:scale-95"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action Button: Deep Pine Minimalist */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('wizard')}
            className="rounded-full px-5 py-2.5 font-semibold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer bg-[#14382C] hover:bg-[#1C4E3D] text-white shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>Daftarkan Lahan</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          TOP ROW: 4 BENTO ANALYTICS CARDS (METRIK OPERASIONAL PETANI)
          ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" aria-label="Ringkasan Metrik">
        
        {/* Card 1: Total Dividen Karbon (Siap Tarik) */}
        <article 
          onClick={onOpenWithdrawal}
          className="relative overflow-hidden rounded-[26px] p-5 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/40 border border-white/80 shadow-[0_16px_36px_-8px_rgba(16,185,129,0.12),0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1.5 hover:shadow-[0_22px_45px_-8px_rgba(16,185,129,0.22),inset_0_1px_2px_rgba(255,255,255,1)] transition-all duration-300 relative group cursor-pointer"
        >
          {/* Ambient Liquid Glow */}
          <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl group-hover:scale-125 transition-transform duration-500 ease-out" />
          <div className="pointer-events-none absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Total Dividen Karbon
                </p>
                <div className="mt-2 flex items-baseline">
                  <span className="text-lg lg:text-xl font-bold text-stone-600 mr-1.5 font-sans">Rp</span>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight font-sans tabular-nums">
                    {animatedBalance.toLocaleString('id-ID')}
                  </h2>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition group-hover:scale-110 bg-gradient-to-br from-emerald-100/90 to-emerald-50/50 border border-emerald-400/30 text-emerald-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(16,185,129,0.15)]">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-500/10 backdrop-blur-md border border-emerald-400/30 rounded-full px-2.5 py-0.5 text-xs font-sans shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                +14.8%
              </span>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">Bagi Hasil 88%</span>
            </div>
          </div>
        </article>

        {/* Card 2: Akumulasi Serapan Karbon */}
        <article 
          onClick={() => onNavigateTab && onNavigateTab('land')}
          className="relative overflow-hidden rounded-[26px] p-5 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-teal-50/40 border border-white/80 shadow-[0_16px_36px_-8px_rgba(20,184,166,0.12),0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1.5 hover:shadow-[0_22px_45px_-8px_rgba(20,184,166,0.22),inset_0_1px_2px_rgba(255,255,255,1)] transition-all duration-300 relative group cursor-pointer"
        >
          {/* Ambient Liquid Glow */}
          <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-teal-400/20 blur-xl group-hover:scale-125 transition-transform duration-500 ease-out" />
          <div className="pointer-events-none absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Akumulasi Serapan
                </p>
                <h2 className="mt-2 text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight font-sans tabular-nums">
                  {rawCarbon} <span className="text-base font-semibold text-stone-500 font-sans">tCO2e</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition group-hover:scale-110 bg-gradient-to-br from-teal-100/90 to-teal-50/50 border border-teal-400/30 text-teal-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(20,184,166,0.15)]">
                <Leaf className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-500/10 backdrop-blur-md border border-teal-400/30 rounded-full px-2.5 py-0.5 text-xs font-sans shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                <ArrowUpRight className="w-3.5 h-3.5 text-teal-600" />
                +8.4%
              </span>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">Chave Tier-3 KLHK</span>
            </div>
          </div>
        </article>

        {/* Card 3: Total Luas Lahan Terdaftar */}
        <article 
          onClick={() => onNavigateTab && onNavigateTab('land')}
          className="relative overflow-hidden rounded-[26px] p-5 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/40 border border-white/80 shadow-[0_16px_36px_-8px_rgba(16,185,129,0.12),0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1.5 hover:shadow-[0_22px_45px_-8px_rgba(16,185,129,0.22),inset_0_1px_2px_rgba(255,255,255,1)] transition-all duration-300 relative group cursor-pointer"
        >
          {/* Ambient Liquid Glow */}
          <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl group-hover:scale-125 transition-transform duration-500 ease-out" />
          <div className="pointer-events-none absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Total Luas Lahan
                </p>
                <h2 className="mt-2 text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight font-sans tabular-nums">
                  {rawAreaHa} <span className="text-base font-semibold text-stone-500 font-sans">Ha</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition group-hover:scale-110 bg-gradient-to-br from-emerald-100/90 to-emerald-50/50 border border-emerald-400/30 text-emerald-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(16,185,129,0.15)]">
                <MapPinned className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-500/10 backdrop-blur-md border border-emerald-400/30 rounded-full px-2.5 py-0.5 text-xs font-sans shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                +18.2%
              </span>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">{totalPlotsCount} Petak Terdaftar</span>
            </div>
          </div>
        </article>

        {/* Card 4: Populasi Tegakan Pohon */}
        <article 
          onClick={() => onNavigateTab && onNavigateTab('land')}
          className="relative overflow-hidden rounded-[26px] p-5 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/40 border border-white/80 shadow-[0_16px_36px_-8px_rgba(16,185,129,0.12),0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1.5 hover:shadow-[0_22px_45px_-8px_rgba(16,185,129,0.22),inset_0_1px_2px_rgba(255,255,255,1)] transition-all duration-300 relative group cursor-pointer"
        >
          {/* Ambient Liquid Glow */}
          <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl group-hover:scale-125 transition-transform duration-500 ease-out" />
          <div className="pointer-events-none absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Populasi Pohon
                </p>
                <h2 className="mt-2 text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight font-sans tabular-nums">
                  {rawTrees} <span className="text-base font-semibold text-stone-500 font-sans">Btg</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition group-hover:scale-110 bg-gradient-to-br from-emerald-100/90 to-emerald-50/50 border border-emerald-400/30 text-emerald-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(16,185,129,0.15)]">
                <Trees className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-500/10 backdrop-blur-md border border-emerald-400/30 rounded-full px-2.5 py-0.5 text-xs font-sans shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                +5.1%
              </span>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">{rawTrees > 0 ? `${rawTrees} Pohon Terdata` : 'Belum Ada Sensus'}</span>
            </div>
          </div>
        </article>

      </section>

      {/* =========================================================================
          MIDDLE ROW: DUAL INTERACTIVE CHARTS (REVENUE OVERVIEW + SALES BY CATEGORY)
          ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" aria-label="Visualisasi Grafik Analitik">
        
        {/* Left Chart (Col-span-7 or 8): Revenue Overview Area Chart */}
        <div className="lg:col-span-8 bg-white rounded-[24px] border border-stone-100 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight font-sans">
                Tren Serapan Karbon &amp; Dividen
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Pertumbuhan serapan biomassa tegakan pohon dan estimasi bagi hasil dividen berjalan
              </p>
            </div>

            {/* Timeframe Switcher Pills */}
            <div className="flex items-center bg-stone-100 p-1 rounded-full text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  timeframe === 'monthly' ? 'bg-[#14382C] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('quarterly')}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  timeframe === 'quarterly' ? 'bg-[#14382C] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Triwulan
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('annual')}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  timeframe === 'annual' ? 'bg-[#14382C] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tahunan
              </button>
            </div>
          </div>

          {/* Interactive Recharts Area Chart */}
          <div className="mt-6 h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.chartFill} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={theme.chartFill} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  stroke="#A8A29E" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#A8A29E" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val} t`} 
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-stone-200 bg-white/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-stone-900 font-sans">{label} 2026</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-stone-500">Serapan:</span>
                            <span className="font-sans font-bold text-emerald-700 tabular-nums">{data.carbon} tCO2e</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-stone-500">Dividen:</span>
                            <span className="font-sans font-bold text-stone-900 tabular-nums">Rp {data.revenue.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="carbon" 
                  stroke={theme.chartFill} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, fill: theme.chartFill, stroke: '#FFFFFF', strokeWidth: 3 }}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Under-Chart Quick Insight Strip */}
          <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-bold">Rata-rata Bulanan</p>
              <p className="font-sans font-bold text-stone-800 mt-0.5 tabular-nums">+1,18 tCO2e</p>
            </div>
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-bold">Puncak Serapan</p>
              <p className="font-sans font-bold mt-0.5 text-emerald-700 tabular-nums">
                14,2 tCO2e (Okt)
              </p>
            </div>
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-bold">Target Klaster</p>
              <p className="font-sans font-bold text-stone-800 mt-0.5 tabular-nums">16,0 tCO2e (89%)</p>
            </div>
          </div>
        </div>

        {/* Right Chart (Col-span-5 or 4): Sales by Category Donut Chart */}
        <div className="lg:col-span-4 bg-white rounded-[24px] border border-stone-100 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight font-sans">
                  Sales by Category
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Distribusi biomassa per spesies pohon
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => onNavigateTab && onNavigateTab('land')}
                className="text-stone-400 hover:text-stone-700 cursor-pointer text-xs font-semibold"
              >
                Detail
              </button>
            </div>

            {/* Donut Chart with Centered Metric */}
            <div className="relative h-60 w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="88%"
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={6}
                    isAnimationActive={true}
                    animationDuration={1400}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-stone-200 bg-white p-2 text-xs shadow-md">
                            <p className="font-bold text-stone-900">{d.name}</p>
                            <p className="font-sans text-stone-600 font-semibold tabular-nums">{d.value}% ({d.carbon})</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Statistic Inside Donut Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Total
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-sans text-stone-900 leading-tight tabular-nums">
                  {rawCarbon > 0 ? `${rawCarbon.toFixed(1)} t` : '0 t'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {rawTrees > 0 ? `${rawTrees} Pohon` : '0 Pohon'}
                </span>
              </div>
            </div>
          </div>

          {/* Category Legend List */}
          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-stone-700 font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-stone-400 text-[11px] tabular-nums">{cat.carbon}</span>
                  <span className="font-sans font-bold text-stone-900 tabular-nums">{cat.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* =========================================================================
          BOTTOM ROW: TABEL VERIFIKASI & TEGAKAN UNGGULAN
          ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" aria-label="Tabel Aktivitas dan Tegakan Unggulan">
        
        {/* Left (Col-span-7 or 8): Riwayat Verifikasi & Sensus */}
        <div className="lg:col-span-8 bg-white rounded-[24px] border border-stone-100 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
          
          {/* Header with "Lihat Semua" */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight font-sans">
                Riwayat Verifikasi &amp; Sensus Pohon
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Status sensus mandiri, validasi petugas lapangan, dan dividen karbon
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Pills */}
              <div className="flex items-center bg-stone-100 p-1 rounded-full text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('all')}
                  className={`px-3 py-1 rounded-full transition cursor-pointer ${
                    activeTabFilter === 'all' ? 'bg-[#14382C] text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('verified')}
                  className={`px-3 py-1 rounded-full transition cursor-pointer ${
                    activeTabFilter === 'verified' ? 'bg-[#14382C] text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Terverifikasi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('pending')}
                  className={`px-3 py-1 rounded-full transition cursor-pointer ${
                    activeTabFilter === 'pending' ? 'bg-[#14382C] text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Antrean
                </button>
              </div>

              {/* View All link */}
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('land')}
                className="text-xs font-bold transition flex items-center gap-1 cursor-pointer hover:underline text-emerald-700"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Clean Modern Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold text-stone-400 pb-2.5">
                  <th className="py-2.5 pl-2 pr-3"># ID</th>
                  <th className="py-2.5 px-3">Petak Kebun</th>
                  <th className="py-2.5 px-3">Jenis Tegakan</th>
                  <th className="py-2.5 px-3">Estimasi Dividen</th>
                  <th className="py-2.5 px-3">Status Verifikasi</th>
                  <th className="py-2.5 pr-2 pl-3">Tanggal Pembaruan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-stone-400">
                      Tidak ada aktivitas yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F9FBFA] transition group">
                      {/* # ID */}
                      <td className="py-3.5 pl-2 pr-3 font-sans font-semibold text-stone-500 whitespace-nowrap tabular-nums">
                        {row.id}
                      </td>

                      {/* Petak Kebun */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={row.avatar} 
                            alt={row.plotName} 
                            className="w-7 h-7 rounded-full object-cover border border-stone-200 shrink-0" 
                          />
                          <div>
                            <p className="font-bold text-stone-900 leading-tight">{row.plotName}</p>
                            <p className="text-[10px] font-sans text-stone-400 tabular-nums">{row.plotCode}</p>
                          </div>
                        </div>
                      </td>

                      {/* Jenis Tegakan */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-stone-700">
                        {row.product}
                      </td>

                      {/* Estimasi Dividen */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-sans font-bold text-stone-900 tabular-nums">{row.amount}</span>
                        <span className="block text-[10px] font-sans font-semibold text-emerald-700 tabular-nums">({row.carbon})</span>
                      </td>

                      {/* Status Soft Pill Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {row.status === 'verified' && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-sans bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            Terverifikasi
                          </span>
                        )}
                        {row.status === 'pending' && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-sans bg-amber-50 text-amber-800 border border-amber-200/80">
                            Menunggu Survei
                          </span>
                        )}
                        {row.status === 'scheduled' && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-sans bg-blue-50 text-blue-800 border border-blue-200/80">
                            Jadwal Audit
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 pr-2 pl-3 whitespace-nowrap font-sans text-stone-500 text-xs tabular-nums">
                        {row.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (Col-span-5 or 4): Tegakan Karbon Tertinggi */}
        <div className="lg:col-span-4 bg-white rounded-[24px] border border-stone-100 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight font-sans">
                  Tegakan Karbon Tertinggi
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Petak pohon dengan produktivitas serapan biomassa tertinggi
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('land')}
                className="text-xs font-bold transition flex items-center gap-1 cursor-pointer hover:underline text-emerald-700"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Top Products */}
            <div className="divide-y divide-stone-100 mt-2">
              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  Belum ada data tegakan pohon terdaftar.
                </div>
              ) : (
                topProducts.map((prod, idx) => (
                <div key={prod.id} className="py-3 flex items-center justify-between gap-3 group hover:bg-stone-50/70 p-2 rounded-xl transition cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-stone-200">
                      <img src={prod.image} alt={prod.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-md text-[9px] font-bold flex items-center justify-center font-sans ${
                        idx === 0 
                          ? 'bg-amber-400 text-stone-900' 
                          : 'bg-black/60 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 text-xs truncate leading-snug">
                        {prod.title}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {prod.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-sans font-bold text-xs text-stone-900 tabular-nums">
                      {prod.sales}
                    </p>
                    <p className="text-[10px] font-sans font-semibold text-emerald-700 tabular-nums">
                      {prod.revenue}
                    </p>
                  </div>
                </div>
              )))}
            </div>
          </div>

          {/* Kuota Klaster Progress Capsule (Frosted Glass & Ambient Glow) */}
          <div className="mt-4 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.02),inset_0_1px_2px_rgba(255,255,255,0.85)] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800">
                {farmerSummary?.cluster_info?.cluster_name || 'Klaster Belum Ditetapkan'}
              </span>
              <span className="font-sans font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs border border-emerald-400/20 tabular-nums">
                {farmerSummary?.cluster_info ? `${farmerSummary.cluster_info.percentage}% Tercapai` : '0%'}
              </span>
            </div>
            <div className="w-full bg-stone-200/80 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div 
                className="h-full rounded-full transition-all duration-1000 bg-emerald-600" 
                style={{ width: `${farmerSummary?.cluster_info ? Math.min(100, Math.max(0, farmerSummary.cluster_info.percentage)) : 0}%` }} 
              />
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              {farmerSummary?.cluster_info 
                ? `${farmerSummary.cluster_info.current_carbon_tco2e} / ${farmerSummary.cluster_info.target_tco2e} tCO2e terkumpul • Status: ${farmerSummary.cluster_info.cluster_status}`
                : 'Daftarkan petak lahan untuk bergabung dalam kuota klaster agregasi desa.'}
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}
