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
  ShoppingBag
} from 'lucide-react';
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

  // Dual-State Cluster Quota Progress Bar: 'state1' (Sebelum Lulus Audit) vs 'state2' (Setelah Lulus Audit / Penjualan Bursa)
  const [clusterState, setClusterState] = useState('state1');

  const alerts = [
    {
      type: 'warning', // Amber / Kuning
      title: 'Jadwal Verifikasi Satelit & Lapangan',
      message: 'Jadwal verifikasi satelit berkala: 2 hari lagi. Pastikan tidak ada penebangan pohon di Lahan 1.',
      actionText: 'Lihat Telemetri Sentinel-2',
      badge: 'Jadwal Surveyor',
      colorClass: 'bg-amber-50 border-amber-200 text-amber-900',
      badgeClass: 'bg-amber-200/80 text-amber-900'
    },
    {
      type: 'danger', // Merah untuk Revisi
      title: 'Peringatan Revisi Sampel Pohon Lapangan',
      message: 'Foto meteran kain pada Sampel #2 di Lahan Lereng Sindoro terdeteksi buram oleh verifikator AI. Harap foto ulang sebelum tanggal 28 Okt 2026.',
      actionText: 'Buka Form Revisi Foto',
      badge: 'Perlu Revisi (Urgent)',
      colorClass: 'bg-red-50 border-red-200 text-red-900',
      badgeClass: 'bg-red-200 text-red-900'
    },
    {
      type: 'info', // Biru/Kuning pembaruan tahunan
      title: 'Peringatan Siklus Tahunan (Annual Vintage)',
      message: 'Pohon Anda telah aktif menyerap karbon selama 11 bulan. Siapkan jadwal pengukuran lingkar batang baru untuk menaikkan dividen tahun 2027.',
      actionText: 'Lihat Siklus Tahunan',
      badge: 'Vintage Renewal',
      colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-950',
      badgeClass: 'bg-emerald-200 text-emerald-900'
    }
  ];

  const currentAlert = alerts[activeAlertIndex];

  return (
    <div className="space-y-5 animate-fade-in pb-20 md:pb-8">
      {/* 1. Papan Notifikasi & Peringatan Tugas (ActionAlertBanner) */}
      {!alertsDismissed && (
        <div className={`border rounded-2xl p-4 mb-4 shadow-xs relative transition-all ${currentAlert.colorClass}`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
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
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${currentAlert.badgeClass}`}>
                  {currentAlert.badge}
                </span>
                {/* Switcher alerts selector */}
                <div className="flex items-center gap-1 ml-auto text-[10px] font-bold">
                  {alerts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveAlertIndex(idx)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                        activeAlertIndex === idx 
                          ? 'bg-[#14382C] text-white' 
                          : 'bg-stone-200/60 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm font-semibold mt-1.5 leading-relaxed">
                {currentAlert.message}
              </p>

              <div className="flex items-center gap-3 mt-2">
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
                  className="text-xs font-bold underline hover:opacity-80 flex items-center gap-1"
                >
                  <span>{currentAlert.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setAlertsDismissed(true)}
              className="absolute top-3 right-3 text-stone-500 hover:text-stone-900 p-1 rounded-lg transition"
              aria-label="Tutup banner peringatan"
            >
              <span className="text-xs font-bold font-mono">✕</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-[#14382C] to-[#1c4d3d] rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none">
          <img 
            src="/hero-agroforest.jpg" 
            alt="Agroforestri Dusun Garung" 
            className="w-full h-full object-cover" 
          />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Dusun Garung, Kejajar, Kab. Wonosobo (920 mdpl)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Sugeng Rawuh, Pak Joko Widodo
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
              Ketua Regu Petani Karbon Garung • Kelompok Tani Gapoktan Wono Subur (#TK-WNSB-042). Seluruh pohon produktif terhubung otomatis ke satelit Sentinel-2.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('wizard')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-2 transition shadow-md"
            >
              <TreePine className="w-4 h-4" />
              <span>+ Tambah Lahan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid Kartu Statistik Utama (SummaryStatsGrid) - 3 KARTU SESUAI BLUEPRINT TERBARU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kartu 1: ActiveSequestrationCard (Kapasitas Serapan) */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Kapasitas Serapan Aktif
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>+18.4% YoY</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-[#14382C] font-mono tracking-tight">
                14.2
              </span>
              <span className="text-sm font-bold text-emerald-700">
                tCO2e / tahun
              </span>
            </div>

            <p className="text-xs text-stone-500 mt-2 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>(Setara netralisir asap 35.000 km motor)</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-400">Model Alometrik:</span>
            <strong className="text-[#14382C] font-bold">Tier-3 Chave et al.</strong>
          </div>
        </div>

        {/* Kartu 2: TotalLandAssetCard (Total Aset Lahan & Pohon) */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Total Aset Terdaftar
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                <span>2 Titik Lahan</span>
              </span>
            </div>

            <div className="mt-1">
              <h3 className="text-lg sm:text-xl font-black text-[#14382C] leading-snug">
                1.2 Ha (12.000 m²)
              </h3>
              <p className="text-xs text-stone-600 font-bold mt-1">
                24 Batang Pohon Produktif Hidup
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Alpukat Mentega (8), Sengon (10), Kopi (6)
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateTab('land')}
              className="text-emerald-800 font-bold hover:text-emerald-900 flex items-center gap-1"
            >
              <span>Rincian Blok Lahan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-stone-400 font-mono text-[11px]">SHM 418 &amp; 422</span>
          </div>
        </div>

        {/* Kartu 3: QuickWalletSummaryCard (Dompet Ringkas) - BARU SESUAI SPEC! */}
        <div className="bg-gradient-to-br from-[#14382C] to-[#1c4d3d] text-white rounded-3xl p-5 border border-emerald-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dompet Ringkas Petani</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                Bagi Hasil 88%
              </span>
            </div>

            {/* Dua indikator saldo berdampingan */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-stone-300 uppercase font-bold block">Saldo Escrow</span>
                <strong className="text-sm sm:text-base font-black text-amber-300 font-mono block mt-0.5">
                  {formatRupiah(escrowBalance)}
                </strong>
                <span className="text-[9px] text-stone-300 block">Tertahan Klaster</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30">
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">Saldo Siap Cair</span>
                <strong className="text-sm sm:text-base font-black text-white font-mono block mt-0.5">
                  {formatRupiah(availableBalance)}
                </strong>
                <span className="text-[9px] text-emerald-300 block">Siap Ditarik</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateTab('wallet')}
              className="text-emerald-300 hover:text-white font-bold flex items-center gap-1 text-xs transition"
            >
              <span>Buka Dompet Karbon</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-stone-300">Bank BRI ****4821</span>
          </div>
        </div>
      </div>

      {/* 3. Kartu Komunitas & Progres Klaster (ClusterProgressCard) dengan DUAL-STATE PROGRESS BAR */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Transparansi Kelompok Tani (Reverse Geocoding)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#14382C] mt-1">
              Klaster Agroforestri - Kecamatan Kejajar (Dusun Garung)
            </h2>
            <p className="text-xs text-stone-500">
              Gapoktan Wono Subur • 185 Petani Anggota Terdaftar
            </p>
          </div>

          {/* State Switcher Pills: State 1 (Sebelum Audit) vs State 2 (Penjualan Bursa) */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200 self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setClusterState('state1')}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-[11px] ${
                clusterState === 'state1'
                  ? 'bg-white text-[#14382C] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Fase 1: Kuota Audit
            </button>
            <button
              type="button"
              onClick={() => setClusterState('state2')}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-[11px] ${
                clusterState === 'state2'
                  ? 'bg-white text-[#14382C] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Fase 2: Penjualan Bursa
            </button>
          </div>
        </div>

        {/* Dual-State Progress Bar (ClusterQuotaBar) */}
        {clusterState === 'state1' ? (
          /* STATE 1: Fase Pengumpulan Kuota Audit (Sebelum Lulus Audit) */
          <div className="space-y-2.5 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-stone-700 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Akumulasi Menuju Syarat Batas Minimum Auditor Eksternal:</span>
              </span>
              <span className="font-mono text-emerald-800 font-black">
                Terkumpul 380 / 500 tCO2e (76%)
              </span>
            </div>

            <div className="w-full bg-stone-200 rounded-full h-4 overflow-hidden p-0.5 border border-stone-300">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-700 relative flex items-center justify-end"
                style={{ width: '76%' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white mr-1 shadow-xs"></div>
              </div>
            </div>

            <p className="text-xs text-stone-600 font-medium pt-0.5">
              Tinggal <strong className="text-emerald-700 font-bold">120 tCO2e</strong> lagi agar kuota audit satelit klaster ini cair serentak ke bursa karbon.
            </p>
          </div>
        ) : (
          /* STATE 2: Fase Penjualan Bursa (Setelah Lulus Audit / Available for Sale) */
          <div className="space-y-2.5 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-950 font-bold flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                <span>Status Penjualan Bursa Karbon (Vintage Year 2026):</span>
              </span>
              <span className="font-mono text-emerald-900 font-black">
                Terjual 80% ke Korporat
              </span>
            </div>

            <div className="w-full bg-stone-200 rounded-full h-4 overflow-hidden p-0.5 border border-emerald-300">
              <div 
                className="bg-emerald-700 h-full rounded-full transition-all duration-700 relative flex items-center justify-end"
                style={{ width: '80%' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white mr-1 shadow-xs"></div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-emerald-900 font-medium">
                Pembeli ESG Utama: PT Telkom Indonesia, Pertamina, Bank BRI.
              </span>
              <strong className="text-emerald-800 font-mono">
                Sisa Kuota Klaster: 100 tCO2e
              </strong>
            </div>
          </div>
        )}

        {/* Cluster detail metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-stone-100 text-xs">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <span className="text-stone-400 text-[10px] uppercase font-bold block">Target Batch Audit</span>
            <strong className="text-[#14382C] font-bold block text-xs mt-0.5">30 November 2026</strong>
            <span className="text-[10px] text-stone-500">Penutupan Buku Q4</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <span className="text-stone-400 text-[10px] uppercase font-bold block">Taksiran Nilai Klaster</span>
            <strong className="text-emerald-700 font-bold block text-xs mt-0.5">Rp 80.000.000</strong>
            <span className="text-[10px] text-stone-500">Estimasi total dividen</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <span className="text-stone-400 text-[10px] uppercase font-bold block">Status Verifikator</span>
            <strong className="text-blue-900 font-bold block text-xs mt-0.5">Sertifikasi SRN-PPI</strong>
            <span className="text-[10px] text-stone-500">Tier-3 Alometrik KLHK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
