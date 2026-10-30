import React, { useEffect, useRef, useState } from 'react';
import { 
  TrendingUp, 
  Trees, 
  DollarSign, 
  Users, 
  MapPin, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Award, 
  ExternalLink,
  ShieldCheck,
  Layers,
  Clock,
  Sparkles,
  Building2,
  Activity,
  ChevronRight
} from 'lucide-react';
import { formatRupiah, formatNumber } from '../../data';
import AnimatedNumber from '../common/AnimatedNumber';
import { getAdminEcosystemStats } from '../../api/admin';

export default function AdminDashboardView({ onNavigateTab }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const data = await getAdminEcosystemStats();
        if (isMounted && data) {
          setStats(data);
        }
      } catch (err) {
        console.warn('Backend admin stats fallback to mock:', err);
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, []);

  // Initialize Leaflet Map for GlobalEcosystemMap
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        if (!isMounted || !mapContainerRef.current) return;

        // Centered on Java - Indonesia archipelago
        const map = L.map(mapContainerRef.current, {
          center: [-7.2, 110.4],
          zoom: 7,
          zoomControl: true,
          attributionControl: false
        });

        // Topo/Satellite layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 18
        }).addTo(map);

        // Clusters Data for Map
        const mapClusters = [
          {
            name: 'Klaster Dusun Garung - Wonosobo',
            lat: -7.3639,
            lng: 109.9886,
            quota: 520,
            target: 500,
            status: 'ready', // Orange/Yellow Pulse: Siap Audit
            color: '#F59E0B'
          },
          {
            name: 'Klaster Konservasi Lereng Sindoro',
            lat: -7.3000,
            lng: 110.0100,
            quota: 500,
            target: 500,
            status: 'ready', // Orange/Yellow Pulse: Siap Audit
            color: '#EA580C'
          },
          {
            name: 'Klaster Pesisir Demak (Mangrove)',
            lat: -6.8944,
            lng: 110.6386,
            quota: 750,
            target: 500,
            status: 'verified', // Lulus Audit / Available
            color: '#10B981'
          },
          {
            name: 'Klaster Hutan Rempah Halmahera',
            lat: 0.5000,
            lng: 127.8000,
            quota: 620,
            target: 500,
            status: 'verified', // Lulus Audit
            color: '#10B981'
          },
          {
            name: 'Klaster Agro Sukamaju Selatan',
            lat: -7.4500,
            lng: 109.8500,
            quota: 280,
            target: 500,
            status: 'collecting', // Sedang Mengumpul (< 100%)
            color: '#FBBF24'
          },
          {
            name: 'Klaster Ciliwung Hulu - Bogor',
            lat: -6.6500,
            lng: 106.9500,
            quota: 340,
            target: 500,
            status: 'collecting', // Sedang Mengumpul (< 100%)
            color: '#FBBF24'
          }
        ];

        mapClusters.forEach((c) => {
          // Circle radius 10 km
          L.circle([c.lat, c.lng], {
            radius: 10000,
            color: c.color,
            weight: 2,
            fillColor: c.color,
            fillOpacity: c.status === 'ready' ? 0.45 : 0.2
          }).addTo(map);

          // Marker Point
          const icon = L.divIcon({
            className: 'custom-cluster-dot',
            html: `<div style="background:${c.color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          L.marker([c.lat, c.lng], { icon })
            .addTo(map)
            .bindPopup(`<b>${c.name}</b><br>Terkumpul: ${c.quota} / ${c.target} tCO2e<br>Status: ${
              c.status === 'ready' ? 'Siap Diajukan Audit Eksternal (100% Kuota)' : 
              c.status === 'verified' ? 'Lulus Audit Eksternal / Available for Sale' : 
              'Mengumpulkan Kuota Pre-Verified'
            }`);
        });

        leafletMapRef.current = map;
      } catch (err) {
        console.error('Failed to init Leaflet Map', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6 sm:space-y-7 animate-fade-in pb-16 font-sans">
      
      {/* 
        ========================================================================
        1. BANNER OVERVIEW EKSEKUTIF ADMIN (TEMA GRADIENT ORANGE & KUNING TERANG)
        Pola terstruktur identik dengan UI Petani & Korporat
        ========================================================================
      */}
      <div className="bg-white rounded-[24px] sm:rounded-[30px] p-6 sm:p-7 lg:p-8 border border-amber-200/90 shadow-[0_4px_24px_rgba(234,88,12,0.04)] relative overflow-hidden">
        {/* Radiant Orange & Yellow Aura */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-amber-100/70 via-orange-50/40 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-[11px] font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>Executive Command Center</span>
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Otoritas Registri Karbon Nasional (SRN-PPI)</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans truncate">
              Pusat Kendali Ekosistem TaniKarbon
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed max-w-2xl">
              Pemantauan terpadu hulu ke hilir: pasokan tegakan petani mitra, verifikasi audit validator, brankas escrow transaksi, dan bursa IDXCarbon.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-950/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-white" />
              <span>Verifikasi Audit Eksternal</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('finance')}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Brankas Escrow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. PLATFORM KPI GRID (3 KARTU EKSEKUTIF NASIONAL - GAYA BENTO)
        ========================================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Card 1: Pipeline Pasokan Karbon (Executive Warm Obsidian Card) */}
        <div className="bg-[#18130C] text-white rounded-[24px] p-6 sm:p-7 shadow-lg border border-amber-500/30 flex flex-col justify-between font-sans relative overflow-hidden card-interactive">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Pipeline Pasokan Karbon Nasional
              </span>
              <span className="text-xs font-sans font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 rounded-full shadow-xs tabular-nums">
                10.790 tCO2e
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Draft / Antrean</span>
                <span className="text-lg font-black font-sans text-white mt-1 block tabular-nums">420 tCO2e</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Pre-Verified</span>
                <span className="text-lg font-black font-sans text-amber-300 mt-1 block tabular-nums">1.850 tCO2e</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Available Sale</span>
                <span className="text-lg font-black font-sans text-amber-400 mt-1 block tabular-nums">3.400 tCO2e</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Telah Ditebus</span>
                <span className="text-lg font-black font-sans text-white mt-1 block tabular-nums">5.120 tCO2e</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-amber-200/80 pt-3 border-t border-white/10 font-sans mt-4 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>100% tersertifikasi alometrik Chave Tier-3 &amp; terdaftar SRN-PPI KLHK.</span>
          </p>
        </div>

        {/* Card 2: Kesehatan Kas & Cost Recovery (GMV) */}
        <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-amber-200/90 shadow-[0_4px_24px_rgba(234,88,12,0.03)] flex flex-col justify-between font-sans card-interactive">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kesehatan Kas &amp; Cost Recovery
              </span>
              <span className="text-xs font-sans font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Audit Ready
              </span>
            </div>

            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Gross Merchandise Value (GMV):
              </span>
              <div className="flex items-baseline mt-1 font-sans">
                <span className="text-xl sm:text-2xl font-bold text-slate-400 mr-2 font-sans">Rp</span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-sans tracking-tight tabular-nums">
                  <AnimatedNumber value={819200000} />
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                <span className="text-[10px] text-amber-900 font-bold uppercase block">Talangan Kembali:</span>
                <span className="text-sm font-extrabold font-sans text-amber-900 mt-0.5 block tabular-nums">
                  {formatRupiah(60000000)}
                </span>
                <span className="text-[9px] text-amber-700 font-semibold font-sans">Cost Recovery 100%</span>
              </div>
              <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-200/80">
                <span className="text-[10px] text-orange-950 font-bold uppercase block">Take-Rate Platform:</span>
                <span className="text-sm font-extrabold font-sans text-orange-900 mt-0.5 block tabular-nums">
                  {formatRupiah(113880000)}
                </span>
                <span className="text-[9px] text-orange-700 font-semibold font-sans">Platform Fee 15%</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 font-sans mt-4">
            Sisa dana (Rp 645.320.000 / ~85%) cair langsung ke dompet petani mitra.
          </p>
        </div>

        {/* Card 3: Entitas Ekosistem Aktif */}
        <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-amber-200/90 shadow-[0_4px_24px_rgba(234,88,12,0.03)] flex flex-col justify-between font-sans card-interactive">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Entitas Ekosistem Terverifikasi
              </span>
              <span className="text-xs font-sans font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300">
                Live PostGIS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3.5 bg-gradient-to-br from-amber-50/80 to-orange-50/40 rounded-2xl border border-amber-200/80 text-center">
                <span className="text-2xl font-black font-sans text-amber-900 block tabular-nums">12</span>
                <span className="text-[11px] font-bold text-amber-900 mt-0.5 block">Klaster Terbentuk</span>
                <span className="text-[10px] text-slate-400">Radius 10 km</span>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-amber-50/80 to-orange-50/40 rounded-2xl border border-amber-200/80 text-center">
                <span className="text-2xl font-black font-sans text-amber-900 block tabular-nums">420</span>
                <span className="text-[11px] font-bold text-amber-900 mt-0.5 block">Petani Mitra</span>
                <span className="text-[10px] text-slate-400">Jawa &amp; Maluku</span>
              </div>
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black font-sans text-slate-800 block tabular-nums">18</span>
                <span className="text-[11px] font-bold text-slate-700 mt-0.5 block">Surveyor Lapangan</span>
                <span className="text-[10px] text-slate-400">MRV Geofence</span>
              </div>
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black font-sans text-slate-800 block tabular-nums">9</span>
                <span className="text-[11px] font-bold text-slate-700 mt-0.5 block">Perusahaan B2B</span>
                <span className="text-[10px] text-slate-400">Pembeli Sah</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 font-sans mt-4">
            Seluruh data tersinkronisasi via PostgreSQL &amp; PostGIS spatial indices.
          </p>
        </div>

      </div>

      {/* 
        ========================================================================
        3. ANTREAN TINDAKAN MENDESAK (OTORISASI ADMIN)
        ========================================================================
      */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50/30 to-white border border-amber-200/90 rounded-[24px] p-6 sm:p-7 shadow-[0_4px_24px_rgba(234,88,12,0.03)] font-sans">
        <div className="flex items-center gap-3 pb-4 border-b border-amber-200/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
            !
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base font-sans">
              Antrean Tindakan Mendesak Membutuhkan Otorisasi Admin
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Persetujuan di bawah ini langsung memperbarui status sertifikat dan membuka transfer dividen petani.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          {/* Action 1: Cluster Ready for Audit */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-block uppercase">
                Kuota 100% Tercapai
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 mt-2 leading-snug font-sans">
                2 Klaster siap diajukan audit eksternal
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Garung Wonosobo (520 tCO2e) &amp; Konservasi Sindoro (500 tCO2e).
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <span>Proses Audit Eksternal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 2: Withdrawal Requests */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-950 border border-orange-300 inline-block uppercase">
                Permintaan Pencairan
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 mt-2 leading-snug font-sans">
                5 Pengajuan Payout Dividen Petani
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Termasuk pencairan Rp 3.250.000 ke rekening BRI Pak Joko Widodo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('finance')}
              className="w-full py-2.5 bg-[#18130C] hover:bg-[#2A2014] text-amber-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <span>Verifikasi Payout Petani</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 3: Corporate Deposit Top-Up */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 inline-block uppercase">
                Deposit B2B Masuk
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 mt-2 leading-snug font-sans">
                1 Bukti Top-Up Saldo Korporat
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                PT Industri Hijau Nusantara (Tbk) — Rp 100.000.000 via Mandiri VA.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('finance')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <span>Cek Mutasi &amp; Terbitkan Faktur</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        4. PETA GEOSPASIAL SEBARAN KLASTER NASIONAL
        ========================================================================
      */}
      <div className="bg-white rounded-[24px] border border-amber-200/90 shadow-[0_4px_24px_rgba(234,88,12,0.03)] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base font-sans">
              Peta Sebaran Klaster &amp; Geofencing MRV Nasional
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Visualisasi koordinat PostGIS klaster aktif berdasarkan status sertifikasi kuota karbon.
            </p>
          </div>

          {/* Map Status Legend */}
          <div className="flex items-center gap-3 text-xs font-sans flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="text-slate-600">Pre-Verified (&lt; 100%)</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              <span className="text-orange-700">Siap Audit Eksternal (100%)</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-emerald-700">Available for Sale</span>
            </span>
          </div>
        </div>

        <div 
          ref={mapContainerRef}
          className="w-full h-[450px]"
        />
      </div>

    </div>
  );
}
