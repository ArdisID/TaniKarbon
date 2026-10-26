import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Layers, 
  Edit3, 
  Trees, 
  Users, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ExternalLink,
  ShieldCheck,
  Compass,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import ClusterNameEditorModal from './ClusterNameEditorModal';

export default function ClusterGeoManagementView({ onToast }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

  const [selectedClusterForEdit, setSelectedClusterForEdit] = useState(null);
  const [selectedFarmerPolygon, setSelectedFarmerPolygon] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Clusters Data
  const [clusters, setClusters] = useState([
    {
      id: 'CLU-WNSB-001',
      name: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      rawName: 'Klaster Agro - Kec. Kejajar / Garung',
      centroid: [-7.3639, 109.9886],
      region: 'Wonosobo, Jawa Tengah',
      farmersCount: 48,
      hectares: 34.5,
      currentQuota: 520,
      targetQuota: 500,
      status: 'ready', // 'ready' | 'verified' | 'collecting'
      statusLabel: 'Siap Audit (104%)',
      description: 'Klaster perkebunan rakyat berbasis agroforestri alpukat mentega dan kopi arabika di lereng Dieng, menjaga resapan air hulu dan mensejahterakan 48 petani lokal.'
    },
    {
      id: 'CLU-SNDR-002',
      name: 'Klaster Konservasi Lereng Sindoro Utara',
      rawName: 'Klaster Lereng Sindoro - Kec. Kledung',
      centroid: [-7.3000, 110.0100],
      region: 'Temanggung, Jawa Tengah',
      farmersCount: 36,
      hectares: 28.0,
      currentQuota: 500,
      targetQuota: 500,
      status: 'ready',
      statusLabel: 'Siap Audit (100%)',
      description: 'Konservasi lereng gunung vulkanik Sindoro dengan kombinasi tanaman keras sengon dan alpukat mentega.'
    },
    {
      id: 'CLU-DMK-003',
      name: 'Klaster Sabuk Pesisir Demak (Mangrove)',
      rawName: 'Klaster Pesisir Demak - Kec. Sayung',
      centroid: [-6.8944, 110.6386],
      region: 'Demak, Jawa Tengah',
      farmersCount: 52,
      hectares: 45.2,
      currentQuota: 750,
      targetQuota: 500,
      status: 'verified',
      statusLabel: 'Lulus Audit / Terbit Bursa',
      description: 'Restorasi ekosistem blue carbon sabuk hijau mangrove Rhizophora penahan abrasi pesisir laut Jawa.'
    },
    {
      id: 'CLU-HLM-004',
      name: 'Klaster Hutan Rempah Halmahera',
      rawName: 'Klaster Hutan - Halmahera Utara',
      centroid: [0.5000, 127.8000],
      region: 'Halmahera, Maluku Utara',
      farmersCount: 64,
      hectares: 58.0,
      currentQuota: 620,
      targetQuota: 500,
      status: 'verified',
      statusLabel: 'Lulus Audit / Terbit Bursa',
      description: 'Agroforestri endemik rempah cengkeh dan pala hutan lindung Halmahera.'
    },
    {
      id: 'CLU-SKM-005',
      name: 'Klaster Agro Sukamaju Selatan',
      rawName: 'Klaster Agro - Kec. Sukamaju',
      centroid: [-7.4500, 109.8500],
      region: 'Banjarnegara, Jawa Tengah',
      farmersCount: 22,
      hectares: 16.4,
      currentQuota: 280,
      targetQuota: 500,
      status: 'collecting',
      statusLabel: 'Mengumpulkan Kuota (56%)',
      description: 'Inisiasi baru agroforestri kopi rakyat di Sukamaju Selatan.'
    }
  ]);

  // Leaflet initialization for PostGisClusterCanvas
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

        // Centered on Garung Wonosobo
        const map = L.map(mapContainerRef.current, {
          center: [-7.3639, 109.9886],
          zoom: 14,
          zoomControl: true,
          attributionControl: false
        });

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        // Circle Radius 10 km PostGIS ST_DWithin
        L.circle([-7.3639, 109.9886], {
          radius: 10000,
          color: '#3B82F6',
          weight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          dashArray: '6, 6'
        }).addTo(map);

        // Farmer Polygon 1: Pak Joko Widodo (#TK-WNSB-042)
        const polyPakJoko = L.polygon([
          [-7.3634, 109.9881],
          [-7.3633, 109.9891],
          [-7.3643, 109.9893],
          [-7.3645, 109.9882]
        ], {
          color: '#10B981',
          weight: 3,
          fillColor: '#10B981',
          fillOpacity: 0.35
        }).addTo(map);

        polyPakJoko.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;">
            <b style="color:#14382C;">Pak Joko Widodo (#TK-WNSB-042)</b><br>
            Lahan 1 - Pekarangan Garung (4.520 m²)<br>
            Klaim: 100 Pohon | Validasi: 95 Pohon (+1.94 tCO2e)<br>
            <span style="color:#059669;font-weight:bold;">Status: Pre-Verified</span>
          </div>
        `);

        // Farmer Polygon 2: Pak Hendra Wijaya
        L.polygon([
          [-7.3610, 109.9910],
          [-7.3605, 109.9925],
          [-7.3620, 109.9930],
          [-7.3625, 109.9915]
        ], {
          color: '#3B82F6',
          weight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.3
        }).addTo(map).bindPopup('<b>Pak Hendra Wijaya</b><br>Luas: 6.800 m² (140 Pohon)');

        leafletMapRef.current = map;
      } catch (err) {
        console.error('Failed to init PostGIS Canvas', err);
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

  const handleSaveCluster = (clusterId, updatedData) => {
    setClusters(prev => prev.map(c => {
      if (c.id === clusterId) {
        return { ...c, ...updatedData };
      }
      return c;
    }));
  };

  const filteredClusters = clusters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-16 font-sans">
      
      {/* Top Banner Context */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              POSTGIS GEOSPATIAL ENGINE
            </span>
            <span className="text-xs text-slate-500 font-sans">ST_Centroid &amp; ST_DWithin (10 km Radius)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1 font-sans">
            Manajemen Klaster Geospasial &amp; Agregasi Kuota
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Pengelompokan otomatis poligon kebun petani ke dalam klaster 500 tCO2e untuk memangkas biaya audit manual.
          </p>
        </div>
      </div>

      {/* A. PostGisClusterCanvas (Kanvas Peta Radius & Poligon Klaster) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden relative font-sans">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#14382C] text-sm sm:text-base font-sans">
              Kanvas PostGIS Radius 10 km &amp; Kumpulan Poligon Petani (PostGisClusterCanvas)
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Klik pada poligon kebun untuk melihat detail kadastral petani (termasuk petak Pak Joko Widodo).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-sans">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>Radius ST_DWithin: 10 km</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" />
              <span>Poligon Petani Pre-Verified</span>
            </span>
          </div>
        </div>

        <div 
          ref={mapContainerRef} 
          className="w-full h-[400px]"
        />
      </div>

      {/* B. ClusterDirectoryTable (Tabel & Editor Identitas Klaster) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden font-sans">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#14382C] text-base font-sans">
              Direktori Klaster &amp; Pelacak Kuota Minimum (ClusterDirectoryTable)
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Total {clusters.length} klaster terbentuk oleh algoritma PostGIS.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama klaster atau wilayah..."
              className="pl-8 pr-3 py-1.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition w-56"
            />
          </div>
        </div>

        {/* Table Content (Rapi, Standar Linear/Stripe, whitespace-nowrap) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-sans text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 min-w-[220px]">Identitas &amp; Wilayah Klaster</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Centroid PostGIS</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Metrik Komunitas</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Progres Kuota Minimum (tCO2e)</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Status Audit</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-right">Aksi Editor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredClusters.map((cluster) => {
                const percent = Math.round((cluster.currentQuota / cluster.targetQuota) * 100);

                return (
                  <tr key={cluster.id} className="hover:bg-slate-50/70 transition">
                    {/* Identitas Klaster */}
                    <td className="px-5 py-4 min-w-[220px]">
                      <span className="font-bold text-stone-900 block font-sans text-xs sm:text-sm">
                        {cluster.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{cluster.region}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {cluster.id}
                        </span>
                      </div>
                    </td>

                    {/* Centroid PostGIS */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-slate-600">
                      {cluster.centroid[0].toFixed(4)}, {cluster.centroid[1].toFixed(4)}
                    </td>

                    {/* Metrik Komunitas */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700">
                      <strong>{cluster.farmersCount} Petani</strong> • {cluster.hectares} Ha
                    </td>

                    {/* Progres Kuota (ClusterQuotaProgressCol) */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-1 w-44">
                        <div className="flex justify-between text-xs font-sans">
                          <span className="font-mono font-bold text-stone-800">
                            {cluster.currentQuota} / {cluster.targetQuota} tCO2e
                          </span>
                          <span className="font-bold text-emerald-700">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent >= 100 ? 'bg-blue-600' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Audit */}
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-semibold ${
                        cluster.status === 'ready'
                          ? 'bg-blue-50 text-blue-900 border border-blue-300'
                          : cluster.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border border-amber-300'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{cluster.statusLabel}</span>
                      </span>
                    </td>

                    {/* Aksi Editor */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedClusterForEdit(cluster)}
                        className="border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Profil Klaster</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ClusterNameEditorModal */}
      {selectedClusterForEdit && (
        <ClusterNameEditorModal
          cluster={selectedClusterForEdit}
          onClose={() => setSelectedClusterForEdit(null)}
          onSave={handleSaveCluster}
          onToast={onToast}
        />
      )}

    </div>
  );
}
