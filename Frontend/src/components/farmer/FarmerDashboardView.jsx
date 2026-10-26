import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Leaf, 
  TreePine, 
  Users, 
  ArrowRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  TrendingUp,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Wallet,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Search,
  LayoutDashboard,
  Layers,
  Plus,
  SlidersHorizontal,
  Compass,
  ArrowUpRight,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { formatRupiah } from '../../data';

export default function FarmerDashboardView({ 
  onNavigateTab, 
  onOpenSatelliteModal,
  availableBalance = 3250000,
  escrowBalance = 1450000
}) {
  // Alert banner filter: 'all' | 'schedule' | 'revision'
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  // Dual-State Cluster Quota: 'state1' (Sebelum Lulus Audit) vs 'state2' (Setelah Lulus Audit / Penjualan Bursa)
  const [clusterState, setClusterState] = useState('state1');

  // Filter tabs state
  const [activeFilterTab, setActiveFilterTab] = useState('summary');
  const [searchQuery, setSearchQuery] = useState('');

  // Alerts data
  const alerts = [
    {
      type: 'warning',
      title: 'Jadwal Verifikasi Satelit & Lapangan',
      message: 'Jadwal verifikasi satelit berkala: 2 hari lagi. Pastikan tidak ada penebangan pohon di Lahan 1.',
      actionText: 'Lihat Telemetri Sentinel-2',
      badge: 'Jadwal Surveyor',
      colorClass: 'bg-amber-50/80 border-amber-200 text-amber-900',
      badgeClass: 'bg-amber-200/80 text-amber-900'
    },
    {
      type: 'danger',
      title: 'Peringatan Revisi Sampel Pohon Lapangan',
      message: 'Foto meteran kain pada Sampel #2 di Lahan Lereng Sindoro terdeteksi buram oleh verifikator AI. Harap foto ulang sebelum tanggal 28 Okt 2026.',
      actionText: 'Buka Form Revisi Foto',
      badge: 'Perlu Revisi (Urgent)',
      colorClass: 'bg-red-50/80 border-red-200 text-red-900',
      badgeClass: 'bg-red-200 text-red-900'
    },
    {
      type: 'info',
      title: 'Peringatan Siklus Tahunan (Annual Vintage)',
      message: 'Pohon Anda telah aktif menyerap karbon selama 11 bulan. Siapkan jadwal pengukuran lingkar batang baru untuk menaikkan dividen tahun 2027.',
      actionText: 'Lihat Siklus Tahunan',
      badge: 'Vintage Renewal',
      colorClass: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
      badgeClass: 'bg-emerald-200 text-emerald-900'
    }
  ];

  const currentAlert = alerts[activeAlertIndex];

  // Half-Donut Gauge Data (76% Kuota Terkumpul)
  const gaugeData = [
    { name: 'Terkumpul', value: 76, color: '#10B981' },
    { name: 'Sisa Kuota', value: 24, color: '#E2E8F0' }
  ];

  // Area Chart Data: Tren Akumulasi Serapan Karbon (type="natural")
  const areaData = [
    { month: 'Jan', carbon: 4.8 },
    { month: 'Mar', carbon: 6.9 },
    { month: 'Mei', carbon: 8.7 },
    { month: 'Jul', carbon: 10.9 },
    { month: 'Sep', carbon: 12.6 },
    { month: 'Nov', carbon: 14.2 }
  ];

  // Bar Chart Data: Komparasi Produksi Karbon per Petak Kebun
  const barData = [
    { name: 'Blok Sindoro', carbon: 5.8, trees: 8, species: 'Alpukat' },
    { name: 'Blok Garung', carbon: 5.4, trees: 10, species: 'Sengon' },
    { name: 'Pekarangan', carbon: 3.0, trees: 6, species: 'Kopi' }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-16 font-sans">
      
      {/* BARIS ATAS: HEADER, SEARCH BAR ROUNDED-FULL & TABS FILTER PILL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200 font-sans">
              AgroPulse Petani Binaan
            </span>
            <span className="text-xs text-stone-500 font-sans">
              Gapoktan Wono Subur #TK-WNSB-042
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1 font-sans">
            Dashboard
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-sans">
            Selamat datang kembali, Pak Joko Widodo • Dusun Garung, Kejajar, Wonosobo (920 mdpl)
          </p>
        </div>

        {/* Search bar & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input Rounded-Full */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari petak, jenis pohon..."
              className="pl-9 pr-4 py-2 bg-white rounded-full border border-stone-200/80 text-xs font-sans text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 shadow-[0_2px_8px_rgba(0,0,0,0.02)] w-48 sm:w-56"
            />
          </div>

          {/* Filter Tabs Pill */}
          <div className="p-1 bg-white rounded-full border border-stone-200/80 flex items-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xs font-semibold font-sans">
            <button
              type="button"
              onClick={() => setActiveFilterTab('summary')}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeFilterTab === 'summary'
                  ? 'bg-[#14382C] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Ringkasan
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('trees')}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeFilterTab === 'trees'
                  ? 'bg-[#14382C] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Per Pohon
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('annual')}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeFilterTab === 'annual'
                  ? 'bg-[#14382C] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tahunan
            </button>
          </div>

          {/* Date Range Selector Rounded-Full */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-full border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xs font-semibold text-stone-700 font-sans">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <span>Siklus 2026</span>
          </div>
        </div>
      </header>

      {/* ACTION ALERT BANNER (Preserved Full Functionality) */}
      {!alertsDismissed && (
        <div className={`rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border relative transition-all ${currentAlert.colorClass}`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              currentAlert.type === 'danger' ? 'bg-red-200 text-red-800' : 'bg-amber-200/70 text-amber-900'
            }`}>
              {currentAlert.type === 'danger' ? (
                <AlertCircle className="w-5 h-5 text-red-700" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${currentAlert.badgeClass}`}>
                  {currentAlert.badge}
                </span>
                
                {/* Switcher selector */}
                <div className="flex items-center gap-1 ml-auto text-[10px] font-bold">
                  {alerts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveAlertIndex(idx)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition cursor-pointer ${
                        activeAlertIndex === idx 
                          ? 'bg-[#14382C] text-white font-bold' 
                          : 'bg-stone-200/60 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm font-semibold mt-1 leading-relaxed font-sans">
                {currentAlert.message}
              </p>

              <div className="flex items-center gap-3 mt-1.5">
                <button
                  onClick={() => {
                    if (currentAlert.actionText.includes('Sentinel')) {
                      onOpenSatelliteModal();
                    } else if (currentAlert.actionText.includes('Revisi')) {
                      onNavigateTab('wizard');
                    } else {
                      onNavigateTab('timeline');
                    }
                  }}
                  className="text-xs font-bold underline hover:opacity-80 flex items-center gap-1 font-sans cursor-pointer"
                >
                  <span>{currentAlert.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setAlertsDismissed(true)}
              className="absolute top-3 right-3 text-stone-500 hover:text-stone-900 p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer"
              aria-label="Tutup banner peringatan"
            >
              <span className="text-xs font-bold font-sans">✕</span>
            </button>
          </div>
        </div>
      )}

      {/* BARIS 1 BENTO: 3 KARTU UTAMA ROUNDED-[28PX] */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Bento 1.1: Komposisi Blok Tanaman (Pastel Pills & Species Breakdown) */}
        <div className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-sans">
                Komposisi Blok Tanaman
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans">
                24 Pohon Terdata
              </span>
            </div>

            <h3 className="text-lg font-bold text-stone-900 font-sans leading-snug">
              1.2 Ha (12.000 m²)
            </h3>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              SHM 418 &amp; 422 • Lereng Dieng Wonosobo
            </p>

            {/* List Spesies dengan Pill Pastel */}
            <div className="space-y-2.5 mt-4">
              {/* Alpukat */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-200/80 text-emerald-900 flex items-center justify-center font-bold text-xs">
                    🥑
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 font-sans">Alpukat Mentega</div>
                    <div className="text-[11px] text-stone-500 font-sans">8 Batang • DBH 38 cm</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 shadow-2xs font-sans">
                  5.8 tCO2e/thn
                </span>
              </div>

              {/* Sengon */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-xs">
                    🌲
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 font-sans">Sengon Buto</div>
                    <div className="text-[11px] text-stone-500 font-sans">10 Batang • DBH 32 cm</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-amber-800 shadow-2xs font-sans">
                  5.4 tCO2e/thn
                </span>
              </div>

              {/* Kopi */}
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-200/80 text-purple-900 flex items-center justify-center font-bold text-xs">
                    ☕
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 font-sans">Kopi Arabika</div>
                    <div className="text-[11px] text-stone-500 font-sans">6 Rumpun • Naungan</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-purple-800 shadow-2xs font-sans">
                  3.0 tCO2e/thn
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateTab('land')}
              className="text-emerald-800 font-bold hover:text-emerald-900 flex items-center gap-1 font-sans cursor-pointer"
            >
              <span>Kelola Blok Pohon</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-stone-400 font-sans text-[11px]">2 Titik Koordinat GPS</span>
          </div>
        </div>

        {/* Bento 1.2: Progres Kuota Klaster (Recharts Half-Donut Gauge 76%) */}
        <div className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-sans">
                Progres Kuota Klaster
              </span>
              {/* State Switcher Pill */}
              <div className="flex p-0.5 bg-stone-100 rounded-full border border-stone-200 text-[10px] font-bold">
                <button
                  onClick={() => setClusterState('state1')}
                  className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                    clusterState === 'state1' ? 'bg-[#14382C] text-white' : 'text-stone-600'
                  }`}
                >
                  Fase 1
                </button>
                <button
                  onClick={() => setClusterState('state2')}
                  className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                    clusterState === 'state2' ? 'bg-[#14382C] text-white' : 'text-stone-600'
                  }`}
                >
                  Fase 2
                </button>
              </div>
            </div>

            <h3 className="text-base font-bold text-stone-900 font-sans">
              Klaster Dusun Garung - Kejajar
            </h3>
            <p className="text-xs text-stone-500 font-sans">
              185 Petani Anggota • Target Minimum 500 tCO2e
            </p>

            {/* Recharts Half-Donut Gauge */}
            <div className="relative flex flex-col items-center justify-center my-1">
              <div className="w-full h-[145px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="85%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Big Metric Inside Gauge Center */}
              <div className="absolute bottom-2 flex flex-col items-center">
                <span className="text-3xl font-extrabold text-stone-900 tracking-tight font-sans">
                  {clusterState === 'state1' ? '76%' : '80%'}
                </span>
                <span className="text-xs font-bold text-emerald-700 font-sans">
                  {clusterState === 'state1' ? '380 / 500 tCO2e' : 'Terjual ke Bursa'}
                </span>
              </div>
            </div>

            {/* Status explanation */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 font-sans">
              {clusterState === 'state1' ? (
                <p>
                  Tinggal <strong className="text-emerald-800">120 tCO2e</strong> lagi agar klaster ini cair serentak ke bursa karbon korporat.
                </p>
              ) : (
                <p>
                  Telah diverifikasi auditor SRN-PPI. Tersisa <strong className="text-emerald-800">100 tCO2e</strong> kuota live.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-sans">
            <span className="text-stone-400">Target Audit:</span>
            <strong className="text-stone-800">30 November 2026</strong>
          </div>
        </div>

        {/* Bento 1.3: Status & Jadwal Verifikasi (Kunjungan Surveyor & Satelit) */}
        <div className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-sans">
                Status &amp; Jadwal Verifikasi
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-sans">
                Audit Berlapis
              </span>
            </div>

            <h3 className="text-base font-bold text-stone-900 font-sans leading-snug">
              Inspeksi Lapangan &amp; Orbit
            </h3>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Sinkronisasi telemetri darat dengan citra satelit
            </p>

            {/* 3 Detail List Baris Ringkas */}
            <div className="space-y-3 mt-4 text-xs font-sans">
              {/* Item 1: Surveyor */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Compass className="w-4 h-4 text-teal-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-stone-900">Surveyor Lapangan</strong>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      28 Okt 2026
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Budi Santoso, S.Hut. (SRV-BUDI-09) • Geofencing &le; 50m
                  </p>
                </div>
              </div>

              {/* Item 2: Satellite */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-stone-900">Satelit Sentinel-2</strong>
                    <span className="text-[11px] text-emerald-700 font-bold">NDVI 0.88</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Siklus orbit 2 hari lagi • Kanopi Sangat Padat
                  </p>
                </div>
              </div>

              {/* Item 3: Standar Sertifikasi */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-stone-700 font-medium">Standar ISO 14064-2 &amp; SRN-PPI</span>
                </div>
                <span className="text-[11px] font-bold text-stone-900">Valid</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <button
              onClick={onOpenSatelliteModal}
              className="text-emerald-800 font-bold hover:text-emerald-900 flex items-center gap-1 font-sans cursor-pointer"
            >
              <span>Lihat Telemetri Sentinel-2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-stone-400 hover:text-stone-700 font-sans"
            >
              Lacak Tahapan &rarr;
            </button>
          </div>
        </div>

      </section>

      {/* BARIS 2 BENTO: 4 KARTU METRIK HORIZONTAL ROUNDED-2XL */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metrik 1: Serapan Aktif */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 flex flex-col justify-between">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-sans">
            Total Serapan Aktif
          </span>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14382C] font-sans">
              14.2 <span className="text-xs font-bold text-emerald-700">tCO2e/thn</span>
            </div>
            <p className="text-[11px] text-stone-500 font-sans mt-1">
              Tier-3 Chave et al. • +18.4% YoY
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-sans">
            Setara netralisir 35.000 km motor
          </div>
        </div>

        {/* Metrik 2: Luas Lahan */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 flex flex-col justify-between">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-sans">
            Total Luas Lahan
          </span>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14382C] font-sans">
              1.2 <span className="text-xs font-bold text-stone-600">Hektar</span>
            </div>
            <p className="text-[11px] text-stone-500 font-sans mt-1">
              2 Titik Petak Kebun Terpetakan GPS
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-sans">
            24 Pohon Produktif Hidup
          </div>
        </div>

        {/* Metrik 3: Saldo Escrow */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 flex flex-col justify-between">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-sans">
            Saldo Escrow (Tertahan)
          </span>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-sans">
              {formatRupiah(escrowBalance)}
            </div>
            <p className="text-[11px] text-stone-500 font-sans mt-1">
              Tertahan di brankas klaster
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-sans">
            Rilis saat kuota klaster tuntas
          </div>
        </div>

        {/* Metrik 4: Kontras Gelap Deep Pine (Saldo Siap Ditarik) */}
        <div className="bg-[#14382C] text-white rounded-2xl p-5 shadow-lg shadow-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-sans">
              Saldo Siap Ditarik
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 font-sans">
              Bagi Hasil 88%
            </span>
          </div>

          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
              {formatRupiah(availableBalance)}
            </div>
            <p className="text-[11px] text-emerald-200 font-sans mt-1">
              Bank BRI (Rek: ****4821)
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('wallet')}
              className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1 transition font-sans cursor-pointer"
            >
              <span>Tarik Dana</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-emerald-300/80 font-sans">Proses &le; 24 Jam</span>
          </div>
        </div>

      </section>

      {/* BARIS 3 BENTO: DUA GRAFIK BAWAH (AREACHART & BARCHART KAPSUL ROUNDED-[28PX]) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Grafik Kiri: Recharts AreaChart kurva natural halus (type="natural") */}
        <div className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-sans">
                  Analitik Pertumbuhan Biomassa
                </span>
                <h3 className="text-base font-bold text-stone-900 font-sans mt-0.5">
                  Tren Akumulasi Serapan Karbon (tCO2e)
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans">
                Kurva Natural Halus
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans mb-4">
              Proyeksi kenaikan tonase riil pohon agroforestri berdasarkan pertambahan lingkar batang (DBH).
            </p>

            {/* AreaChart Container */}
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid #E2E8F0', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value} tCO2e`, 'Serapan Karbon']}
                  />
                  <Area 
                    type="natural" 
                    dataKey="carbon" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#emeraldGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-sans">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Pertumbuhan Rata-Rata: <strong>+1.8 cm DBH / Tahun</strong></span>
            </span>
            <strong className="text-emerald-800">Target 2027: 18.0 tCO2e</strong>
          </div>
        </div>

        {/* Grafik Kanan: Recharts BarChart komparasi produksi karbon per petak (radius={[20, 20, 20, 20]}) */}
        <div className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-sans">
                  Komparasi Antar Petak Lahan
                </span>
                <h3 className="text-base font-bold text-stone-900 font-sans mt-0.5">
                  Distribusi Produksi Karbon per Petak Kebun
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200 font-sans">
                Kapsul Bulat Sempurna
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans mb-4">
              Perbandingan tonase serapan CO2e tahunan berdasarkan petak kebun terdaftar.
            </p>

            {/* BarChart Container */}
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid #E2E8F0', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '12px'
                    }}
                    formatter={(value, name, item) => [
                      `${value} tCO2e (${item.payload.trees} pohon ${item.payload.species})`, 
                      'Produksi'
                    ]}
                  />
                  <Bar 
                    dataKey="carbon" 
                    fill="#10B981" 
                    radius={[20, 20, 20, 20]} 
                    barSize={36}
                  >
                    {barData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#10B981' : index === 1 ? '#14382C' : '#8B5CF6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-sans">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Blok Tertinggi: <strong>Blok Sindoro (5.8 tCO2e)</strong></span>
            </span>
            <button
              onClick={() => onNavigateTab('land')}
              className="text-emerald-800 font-bold hover:underline font-sans cursor-pointer"
            >
              Lihat di Peta &rarr;
            </button>
          </div>
        </div>

      </section>

    </div>
  );
}
