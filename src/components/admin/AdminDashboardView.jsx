import React, { useEffect, useRef } from 'react';
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
  Landmark, 
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
  Clock
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function AdminDashboardView({ onNavigateTab }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

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
            status: 'ready', // Biru Pulse: Siap Audit
            color: '#3B82F6'
          },
          {
            name: 'Klaster Konservasi Lereng Sindoro',
            lat: -7.3000,
            lng: 110.0100,
            quota: 500,
            target: 500,
            status: 'ready', // Biru Pulse: Siap Audit
            color: '#3B82F6'
          },
          {
            name: 'Klaster Pesisir Demak (Mangrove)',
            lat: -6.8944,
            lng: 110.6386,
            quota: 750,
            target: 500,
            status: 'verified', // Hijau: Lulus Audit / Available
            color: '#10B981'
          },
          {
            name: 'Klaster Hutan Rempah Halmahera',
            lat: 0.5000,
            lng: 127.8000,
            quota: 620,
            target: 500,
            status: 'verified', // Hijau: Lulus Audit
            color: '#10B981'
          },
          {
            name: 'Klaster Agro Sukamaju Selatan',
            lat: -7.4500,
            lng: 109.8500,
            quota: 280,
            target: 500,
            status: 'collecting', // Kuning: Sedang Mengumpul (< 100%)
            color: '#F59E0B'
          },
          {
            name: 'Klaster Ciliwung Hulu - Bogor',
            lat: -6.6500,
            lng: 106.9500,
            quota: 340,
            target: 500,
            status: 'collecting', // Kuning: Sedang Mengumpul (< 100%)
            color: '#F59E0B'
          }
        ];

        mapClusters.forEach((c) => {
          // Circle radius 10 km
          L.circle([c.lat, c.lng], {
            radius: 10000,
            color: c.color,
            weight: 2,
            fillColor: c.color,
            fillOpacity: c.status === 'ready' ? 0.4 : 0.2
          }).addTo(map);

          // Marker Point
          const icon = L.divIcon({
            className: 'custom-cluster-dot',
            html: `<div style="background:${c.color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>`,
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
    <div className="space-y-6 animate-fade-in pb-16 font-sans">
      
      {/* Top Banner Context */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-[#14382C] text-emerald-300 uppercase">
              EXECUTIVE COMMAND CENTER
            </span>
            <span className="text-xs text-slate-500 font-sans">Otoritas Registri Karbon Nasional</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1 font-sans">
            Pusat Kendali Ekosistem TaniKarbon
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Pemantauan hulu ke hilir: pasokan karbon petani, audit eksternal, brankas escrow, dan integrasi bursa.
          </p>
        </div>
      </div>

      {/* A. PlatformKpiGrid (3 Kelompok Kartu Eksekutif Nasional) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Card 1: CarbonSupplyPipelineCard */}
        <div className="bg-[#14382C] text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] uppercase font-sans font-bold text-emerald-300 tracking-wider">
                PIPELINE PASOKAN KARBON
              </span>
              <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                Total: 10.790 tCO2e
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-300 font-sans block">Draft / Antrean Survei</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">420 tCO2e</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-amber-300 font-sans block">Pre-Verified Klaster</span>
                <span className="text-lg font-bold font-mono text-amber-300 mt-0.5 block">1.850 tCO2e</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-emerald-300 font-sans block">Available for Sale</span>
                <span className="text-lg font-bold font-mono text-emerald-300 mt-0.5 block">3.400 tCO2e</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-300 font-sans block">Retired (Telah Ditebus)</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">5.120 tCO2e</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-emerald-200/80 pt-3 border-t border-white/10 font-sans mt-3">
            ✓ 100% tersertifikasi alometrik Chave Tier-3 &amp; terkunci di SRN-PPI KLHK.
          </p>
        </div>

        {/* Card 2: PlatformRevenueCard */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[10px] uppercase font-sans font-bold text-slate-400 tracking-wider">
                KESEHATAN KAS &amp; COST RECOVERY
              </span>
              <span className="text-xs font-sans font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Audit Ready
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-sans block">Gross Merchandise Value (GMV):</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#14382C] mt-0.5 block">
                {formatRupiah(819200000)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">Talangan Audit Kembali:</span>
                <span className="text-sm font-bold font-mono text-blue-900 mt-0.5 block">
                  {formatRupiah(60000000)}
                </span>
                <span className="text-[9px] text-slate-400 font-sans">Cost Recovery 100%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">Profit Bersih Platform:</span>
                <span className="text-sm font-bold font-mono text-emerald-800 mt-0.5 block">
                  {formatRupiah(113880000)}
                </span>
                <span className="text-[9px] text-emerald-700 font-sans">Take-Rate 15%</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 font-sans mt-3">
            Sisa dana (Rp 645.320.000 / ~79%) cair langsung ke dompet digital petani.
          </p>
        </div>

        {/* Card 3: ActiveEntitiesCard */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[10px] uppercase font-sans font-bold text-slate-400 tracking-wider">
                ENTITAS EKOSISTEM AKTIF
              </span>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Live Data
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <span className="text-2xl font-black font-sans text-[#14382C] block">12</span>
                <span className="text-[11px] font-semibold text-emerald-900 mt-0.5 block">Klaster Terbentuk</span>
                <span className="text-[10px] text-slate-500">PostGIS ST_DWithin</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <span className="text-2xl font-black font-sans text-[#14382C] block">420</span>
                <span className="text-[11px] font-semibold text-emerald-900 mt-0.5 block">Petani Terdaftar</span>
                <span className="text-[10px] text-slate-500">Jawa &amp; Maluku</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black font-sans text-slate-800 block">18</span>
                <span className="text-[11px] font-semibold text-slate-700 mt-0.5 block">Surveyor Aktif</span>
                <span className="text-[10px] text-slate-500">Geofencing Valid</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black font-sans text-slate-800 block">9</span>
                <span className="text-[11px] font-semibold text-slate-700 mt-0.5 block">Perusahaan B2B</span>
                <span className="text-[10px] text-slate-500">Verified Buyer</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 font-sans mt-3">
            Seluruh data tersinkronisasi via PostgreSQL &amp; PostGIS spatial indices.
          </p>
        </div>

      </div>

      {/* C. AdminActionRequiredQueue (Panel Antrean Tindakan Mendesak) */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 sm:p-6 shadow-2xs font-sans">
        <div className="flex items-center gap-2.5 pb-3 border-b border-amber-200/60">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
            !
          </div>
          <div>
            <h3 className="font-bold text-amber-950 text-sm sm:text-base font-sans">
              Antrean Tindakan Mendesak Membutuhkan Otorisasi Admin
            </h3>
            <p className="text-xs text-amber-800/80 font-sans">
              Tindakan ini langsung memperbarui status stepper Petani dan membuka transaksi Korporat.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4">
          {/* Action 1: Cluster Ready for Audit */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 inline-block">
                KUOTA 100% TERCAPAI
              </span>
              <h4 className="font-bold text-xs text-slate-900 mt-1.5 leading-snug">
                2 Klaster mencapai kuota 100% (Siap Audit Eksternal)
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Garung Wonosobo (520 tCO2e) &amp; Lereng Sindoro (500 tCO2e).
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Proses Audit Eksternal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 2: Withdrawal Requests */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 inline-block">
                PERMINTAAN PENCAIRAN
              </span>
              <h4 className="font-bold text-xs text-slate-900 mt-1.5 leading-snug">
                5 Permintaan Penarikan Dana (Withdrawal) Petani
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Termasuk pencairan Rp 3.250.000 ke rekening BRI Pak Joko Widodo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('finance')}
              className="w-full py-2 bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Verifikasi Payout Petani</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 3: Corporate Deposit Top-Up */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 inline-block">
                DEPOSIT B2B MASUK
              </span>
              <h4 className="font-bold text-xs text-slate-900 mt-1.5 leading-snug">
                1 Bukti Top-Up Deposit B2B Menunggu Konfirmasi
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                PT Industri Hijau Nusantara (Tbk) — Rp 100.000.000 via Mandiri VA.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('finance')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Cek Mutasi &amp; Terbitkan Faktur</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* B. GlobalEcosystemMap (Peta Geospasial Ekosistem Nasional) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#14382C] text-base font-sans">
              Peta Geospasial Sebaran Klaster Nasional (GlobalEcosystemMap)
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Visualisasi radius PostGIS klaster aktif di seluruh Indonesia berdasarkan status kuota.
            </p>
          </div>

          {/* Map Status Legend */}
          <div className="flex items-center gap-3 text-xs font-sans flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="text-slate-600">Pre-Verified (&lt; 100%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block animate-ping" />
              <span className="text-blue-700 font-semibold">Siap Audit Eksternal (100%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-emerald-800 font-semibold">Available for Sale</span>
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
