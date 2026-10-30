import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  ShieldCheck, 
  Trees, 
  Users, 
  Leaf, 
  ArrowRight, 
  Info, 
  ExternalLink,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function CarbonMarketplaceView({ 
  onSelectClusterForDetail, 
  onSelectClusterForCheckout 
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

  // Filters state
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedVintage, setSelectedVintage] = useState('2026');
  const [minQuota, setMinQuota] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Clusters inventory data
  const clusters = [
    {
      id: 'CLU-WNSB-001',
      name: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      location: 'Kec. Kejajar, Kab. Wonosobo, Jawa Tengah',
      region: 'Jawa Tengah',
      primarySpecies: 'Alpukat Mentega, Sengon, Kopi',
      speciesTag: 'Alpukat',
      vintage: '2026',
      totalQuota: 500,
      availableQuota: 380,
      pricePerTon: 160000,
      farmers: 185,
      trees: 4200,
      hectares: 240,
      ndviScore: 0.88,
      lat: -7.3639,
      lng: 109.9886,
      featured: true,
      image: '/hero-agroforest.jpg',
      farmerHeroNote: 'Mencakup petak kebun Pak Joko Widodo (#TK-WNSB-042)'
    },
    {
      id: 'CLU-SNDR-002',
      name: 'Klaster Konservasi Lereng Sindoro Utara',
      location: 'Lereng Gunung Sindoro, Jawa Tengah',
      region: 'Jawa Tengah',
      primarySpecies: 'Durian Montong, Sengon Laut, Kopi',
      speciesTag: 'Durian',
      vintage: '2026',
      totalQuota: 350,
      availableQuota: 210,
      pricePerTon: 160000,
      farmers: 94,
      trees: 2800,
      hectares: 160,
      ndviScore: 0.85,
      lat: -7.3512,
      lng: 109.9921,
      featured: false,
      image: '/hero-landscape.png',
      farmerHeroNote: 'Sabuk hijau penahan longsor & aliran sungai Progo'
    },
    {
      id: 'CLU-DMK-003',
      name: 'Klaster Sabuk Pesisir Demak (Mangrove Blue Carbon)',
      location: 'Sayung, Kab. Demak, Jawa Tengah',
      region: 'Jawa Tengah',
      primarySpecies: 'Mangrove Rhizophora, Avicennia',
      speciesTag: 'Mangrove',
      vintage: '2026',
      totalQuota: 600,
      availableQuota: 450,
      pricePerTon: 175000,
      farmers: 140,
      trees: 12000,
      hectares: 180,
      ndviScore: 0.91,
      lat: -6.8943,
      lng: 110.5127,
      featured: false,
      image: '/auth-bg.jpg',
      farmerHeroNote: 'Restorasi abrasi laut pantai utara Jawa'
    },
    {
      id: 'CLU-HLMH-004',
      name: 'Klaster Agroforestri Rempah Halmahera',
      location: 'Halmahera Barat, Maluku Utara',
      region: 'Luar Jawa',
      primarySpecies: 'Pala, Cengkeh, Kelapa Dalam',
      speciesTag: 'Pala',
      vintage: '2025',
      totalQuota: 400,
      availableQuota: 180,
      pricePerTon: 165000,
      farmers: 112,
      trees: 3400,
      hectares: 210,
      ndviScore: 0.89,
      lat: 1.0540,
      lng: 127.9567,
      featured: false,
      image: '/canopy-tree.jpg',
      farmerHeroNote: 'Penyangga kawasan hutan lindung Maluku'
    }
  ];

  // Filter logic
  const filteredClusters = clusters.filter(c => {
    if (selectedRegion !== 'all' && c.region !== selectedRegion) return false;
    if (selectedSpecies !== 'all' && !c.primarySpecies.toLowerCase().includes(selectedSpecies.toLowerCase())) return false;
    if (selectedVintage !== 'all' && c.vintage !== selectedVintage) return false;
    if (c.availableQuota < minQuota) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // React-Leaflet Map initialization for ClusterGeoMap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map = leafletMapRef.current;
    if (!map && window.L) {
      map = window.L.map(mapContainerRef.current, {
        center: [-7.3639, 109.9886],
        zoom: 8,
        zoomControl: false,
      });

      window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri Satellite &copy; Maxar, Earthstar Geographics',
        maxZoom: 19,
      }).addTo(map);

      window.L.control.zoom({ position: 'bottomright' }).addTo(map);
      leafletMapRef.current = map;
    }

    if (map && window.L) {
      // Clear old markers if any
      map.eachLayer((layer) => {
        if (layer instanceof window.L.Marker) {
          map.removeLayer(layer);
        }
      });

      clusters.forEach((c) => {
        const markerIcon = window.L.divIcon({
          className: 'custom-cluster-pin',
          html: `
            <div style="background-color: #0F1E2E; color: #38BDF8; border: 2.5px solid #0284C7; border-radius: 12px; padding: 4px 8px; font-weight: bold; font-family: 'Plus Jakarta Sans', Inter, sans-serif; font-variant-numeric: tabular-nums; font-size: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
              <span>${c.name.split(' ')[1] || 'Klaster'}</span>
              <span style="background: #0284C7; color: #FFFFFF; padding: 1px 4px; border-radius: 4px;">${c.availableQuota}t</span>
            </div>
          `,
          iconSize: [120, 28],
          iconAnchor: [60, 14]
        });

        const marker = window.L.marker([c.lat, c.lng], { icon: markerIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', Inter, sans-serif; font-size: 12px; padding: 4px;">
            <strong style="color: #0F1E2E; display: block; font-size: 13px;">${c.name}</strong>
            <p style="color: #64748B; font-size: 11px; margin: 4px 0;">${c.location}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 6px; font-family: 'Plus Jakarta Sans', Inter, sans-serif; font-variant-numeric: tabular-nums; font-size: 11px;">
              <span>Sisa Kuota: <strong>${c.availableQuota} tCO2e</strong></span>
              <span style="color: #0284C7; font-weight: bold;">NDVI ${c.ndviScore}</span>
            </div>
          </div>
        `);
      });
    }
  }, [clusters]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div>
          <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            Katalog Karbon Terverifikasi Audit (Available for Sale)
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F1E2E] mt-1.5 tracking-tight font-sans">
            Bursa &amp; Katalog Klaster Agroforestri
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Pilih dan beli kuota karbon bersertifikat langsung dari kelompok tani binaan tanpa perantara.
          </p>
        </div>
      </div>

      {/* A. Peta Sebaran Klaster Interaktif (ClusterGeoMap) */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs font-sans">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-extrabold text-[#0F1E2E] font-sans">
              Peta Sebaran Klaster Petani Interaktif
            </h2>
          </div>
          <span className="text-xs font-sans text-slate-400">
            Klik pin klaster untuk melihat telemetri klorofil &amp; stok real-time
          </span>
        </div>

        <div className="relative w-full h-72 sm:h-80 bg-slate-900">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </div>

      {/* B. Bilah Pencarian & Filter (MarketplaceFilterBar) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3 font-sans">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
          <Filter className="w-4 h-4 text-emerald-700" />
          <span>Filter &amp; Pencarian Klaster Agroforestri</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search by text */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama klaster atau kabupaten..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] font-sans"
            />
          </div>

          {/* Filter Region */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F1E2E]"
            >
              <option value="all">Semua Wilayah</option>
              <option value="Jawa Tengah">Jawa Tengah</option>
              <option value="Luar Jawa">Luar Jawa</option>
            </select>
          </div>

          {/* Filter Species */}
          <div>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F1E2E]"
            >
              <option value="all">Semua Spesies</option>
              <option value="Alpukat">Alpukat Mentega</option>
              <option value="Durian">Durian Montong</option>
              <option value="Mangrove">Mangrove Pesisir</option>
              <option value="Pala">Pala &amp; Cengkeh</option>
            </select>
          </div>

          {/* Filter Vintage */}
          <div>
            <select
              value={selectedVintage}
              onChange={(e) => setSelectedVintage(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F1E2E]"
            >
              <option value="all">Semua Vintage</option>
              <option value="2026">Vintage 2026</option>
              <option value="2025">Vintage 2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* C. Katalog Kartu Klaster (ClusterInventoryCard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredClusters.map((cluster) => {
          const quotaPercentage = Math.round((cluster.availableQuota / cluster.totalQuota) * 100);

          return (
            <div
              key={cluster.id}
              className={`bg-white rounded-3xl border overflow-hidden shadow-2xs flex flex-col justify-between transition hover:shadow-card-hover ${
                cluster.featured ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
              }`}
            >
              {/* Card Image Banner */}
              <div className="relative h-44 overflow-hidden bg-slate-900 group">
                <img
                  src={cluster.image}
                  alt={cluster.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold bg-[#0F1E2E]/90 backdrop-blur-md text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified by External Auditor &amp; Sentinel-2</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold font-sans bg-white/90 text-[#0F1E2E] tabular-nums">
                    Vintage {cluster.vintage}
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs font-sans font-semibold text-sky-300 block tabular-nums">{cluster.id}</span>
                  <h3 className="font-extrabold text-sm sm:text-base leading-snug truncate font-sans">
                    {cluster.name}
                  </h3>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5 font-sans">{cluster.location}</p>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="p-5 space-y-4 text-xs font-sans">
                {/* Farmer hero connection note */}
                {cluster.farmerHeroNote && (
                  <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-sky-950 text-[11px] flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-sky-700 shrink-0" />
                    <span className="font-medium font-sans">
                      <strong>Hubungan Petani:</strong> {cluster.farmerHeroNote}
                    </span>
                  </div>
                )}

                {/* Indikator Sisa Kuota (InventoryPoolBar) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-sans text-xs">
                    <span className="text-slate-600 font-bold">Indikator Sisa Kuota:</span>
                    <strong className="text-sky-800 tabular-nums">
                      Tersedia: {cluster.availableQuota} tCO2e / {cluster.totalQuota} tCO2e ({quotaPercentage}%)
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                    <div 
                      className="bg-sky-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${quotaPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Metrik Komunitas & Biometrik */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center font-sans">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans">Petani</span>
                    <strong className="text-[#0F1E2E] text-xs font-black tabular-nums font-sans">{cluster.farmers} Jiwa</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans">Luas Poligon</span>
                    <strong className="text-[#0F1E2E] text-xs font-black tabular-nums font-sans">{cluster.hectares} Ha</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans">Klorofil Satelit</span>
                    <strong className="text-sky-700 text-xs font-black tabular-nums font-sans">NDVI {cluster.ndviScore}</strong>
                  </div>
                </div>

                {/* FixedPriceTag & Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 uppercase font-sans font-semibold">Harga Katalog Tetap:</span>
                      <Info className="w-3 h-3 text-slate-400" title="Mengacu batas bawah IDXCarbon + Premi Dampak Sosial Petani" />
                    </div>
                    <strong className="text-base font-extrabold text-[#0F1E2E] font-sans tabular-nums">
                      {formatRupiah(cluster.pricePerTon)}
                      <span className="text-xs text-slate-500 font-normal"> / tCO2e</span>
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectClusterForDetail(cluster)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      Detail Klaster
                    </button>
                    <button
                      onClick={() => onSelectClusterForCheckout(cluster)}
                      className="px-4 py-2 rounded-xl bg-[#0F1E2E] hover:bg-[#1E293B] text-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                      <span>Beli &amp; Pensiunkan</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
