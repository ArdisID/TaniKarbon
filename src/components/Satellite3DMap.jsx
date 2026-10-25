import React, { useEffect, useRef, useState } from 'react';
import {
  Layers, Radio, ShieldCheck, MapPin, Calendar,
  RefreshCw, ChevronRight, Eye, Activity
} from 'lucide-react';

// Wonosobo agroforest coordinates
const WONOSOBO_CENTER = [-7.3639, 109.9000];

// Cadastral polygon points (Pak Joko's parcel - simulated)
const CADASTRAL_POLYGON = [
  [-7.3620, 109.8975],
  [-7.3608, 109.9015],
  [-7.3630, 109.9038],
  [-7.3658, 109.9025],
  [-7.3655, 109.8988],
  [-7.3640, 109.8972],
  [-7.3620, 109.8975],
];

// NDVI heatmap grid cells (simulated biomass density)
const NDVI_CELLS = [
  { pos: [-7.362, 109.899], ndvi: 0.91, color: '#059669' },
  { pos: [-7.363, 109.900], ndvi: 0.88, color: '#10b981' },
  { pos: [-7.364, 109.901], ndvi: 0.85, color: '#34d399' },
  { pos: [-7.362, 109.902], ndvi: 0.92, color: '#059669' },
  { pos: [-7.365, 109.899], ndvi: 0.79, color: '#6ee7b7' },
  { pos: [-7.363, 109.898], ndvi: 0.88, color: '#10b981' },
  { pos: [-7.361, 109.901], ndvi: 0.93, color: '#047857' },
];

// Tree markers (sample from TREES_DATA coordinates)
const TREE_MARKERS = [
  { pos: [-7.3629, 109.8992], id: 'TK-WNS-001', species: 'Alpukat Mentega', ndvi: 0.91 },
  { pos: [-7.3641, 109.9008], id: 'TK-WNS-002', species: 'Sengon Laut', ndvi: 0.85 },
  { pos: [-7.3618, 109.9018], id: 'TK-WNS-003', species: 'Durian Musang King', ndvi: 0.92 },
  { pos: [-7.3652, 109.8985], id: 'TK-WNS-004', species: 'Kopi Robusta', ndvi: 0.78 },
  { pos: [-7.3635, 109.8972], id: 'TK-WNS-005', species: 'Jati Putih', ndvi: 0.88 },
];

// Layer toggle button config
const LAYERS = [
  { id: 'rgb', label: 'RGB Asli', icon: Eye },
  { id: 'ndvi', label: 'NDVI Klorofil', icon: Layers },
  { id: 'cadastral', label: 'Batas Kadastral', icon: MapPin },
];

export default function SatelliteGISMap() {
  const [activeLayer, setActiveLayer] = useState('ndvi');
  const [selectedTree, setSelectedTree] = useState(null);
  const [scanPulse, setScanPulse] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const layersRef = useRef({});

  // Last scan date (simulate 3 days ago)
  const lastScan = new Date();
  lastScan.setDate(lastScan.getDate() - 3);
  const lastScanStr = lastScan.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    // Dynamically import leaflet to avoid SSR issues
    let L;
    let map;
    let cadastralLayer;
    let ndviLayer;
    let markerLayer;
    let isMounted = true;

    const initMap = async () => {
      try {
        L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        if (!isMounted || !mapRef.current || leafletMapRef.current) return;

        // Fix Leaflet default icon path
        delete L.default.Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Create map
        map = L.default.map(mapRef.current, {
          center: WONOSOBO_CENTER,
          zoom: 15,
          zoomControl: false,
          attributionControl: true,
        });

        leafletMapRef.current = map;

        // Base tile layer - satellite imagery from Esri
        const satLayer = L.default.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: '© Esri — Satellite Imagery', maxZoom: 19 }
        );
        satLayer.addTo(map);

        // Add zoom control top-right
        L.default.control.zoom({ position: 'topright' }).addTo(map);

        // --- NDVI overlay layer (SVG polygon cells) ---
        ndviLayer = L.default.layerGroup();
        NDVI_CELLS.forEach(cell => {
          const size = 0.003;
          const rect = L.default.polygon([
            [cell.pos[0] - size / 2, cell.pos[1] - size / 2],
            [cell.pos[0] + size / 2, cell.pos[1] - size / 2],
            [cell.pos[0] + size / 2, cell.pos[1] + size / 2],
            [cell.pos[0] - size / 2, cell.pos[1] + size / 2],
          ], {
            color: 'transparent',
            fillColor: cell.color,
            fillOpacity: 0.55,
            weight: 0,
          });
          rect.bindTooltip(`NDVI: ${cell.ndvi}`, { sticky: true, className: 'ndvi-tooltip' });
          ndviLayer.addLayer(rect);
        });

        // --- Cadastral layer ---
        cadastralLayer = L.default.layerGroup();
        const parcel = L.default.polygon(CADASTRAL_POLYGON, {
          color: '#f59e0b',
          fillColor: '#fbbf24',
          fillOpacity: 0.12,
          weight: 2.5,
          dashArray: '6 4',
        });
        parcel.bindPopup(
          `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; min-width: 180px;">
            <p style="font-weight: 800; color: #14382C; margin: 0 0 4px">Petak #TK-WNSB-042</p>
            <p style="color: #6b7280; margin: 2px 0">Pemilik: <strong>Pak Joko Widodo</strong></p>
            <p style="color: #6b7280; margin: 2px 0">Luas: 1.20 Ha · Polikultur</p>
            <p style="color: #059669; font-weight: 700; margin: 4px 0 0">Status: Terverifikasi Satelit</p>
          </div>`,
          { maxWidth: 220 }
        );
        cadastralLayer.addLayer(parcel);

        // Label centroid
        const centroidIcon = L.default.divIcon({
          html: `<div style="background:#fef3c7;border:1.5px solid #f59e0b;border-radius:6px;padding:2px 7px;font-size:10px;font-weight:700;color:#92400e;font-family:monospace;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15)">#TK-WNSB-042 · 1.20 Ha</div>`,
          iconAnchor: [55, 10],
          className: '',
        });
        L.default.marker([-7.3638, 109.9005], { icon: centroidIcon }).addTo(cadastralLayer);

        // --- Tree markers layer ---
        markerLayer = L.default.layerGroup();
        TREE_MARKERS.forEach(tree => {
          const ndviColor = tree.ndvi >= 0.88 ? '#059669' : tree.ndvi >= 0.80 ? '#10b981' : '#34d399';
          const treeIcon = L.default.divIcon({
            html: `<div style="
              width: 28px; height: 28px; border-radius: 50%;
              background: ${ndviColor};
              border: 2.5px solid white;
              box-shadow: 0 3px 10px rgba(0,0,0,0.3);
              display: flex; align-items: center; justify-content: center;
              font-size: 13px; cursor: pointer;
            ">🌳</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            className: '',
          });
          const marker = L.default.marker(tree.pos, { icon: treeIcon });
          marker.bindPopup(
            `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; min-width: 160px;">
              <p style="font-weight: 800; color: #14382C; margin: 0 0 3px">${tree.id}</p>
              <p style="color: #374151; margin: 1px 0"><em>${tree.species}</em></p>
              <p style="color: #059669; font-weight: 700; margin: 4px 0 0">NDVI: ${tree.ndvi} — Sehat</p>
            </div>`,
            { maxWidth: 200 }
          );
          markerLayer.addLayer(marker);
        });
        markerLayer.addTo(map);

        // Wonosobo center pin
        const centerIcon = L.default.divIcon({
          html: `<div style="
            background: #14382C; color: white; border-radius: 20px;
            padding: 4px 10px; font-size: 10px; font-weight: 700;
            font-family: monospace; box-shadow: 0 4px 12px rgba(20,56,44,0.4);
            white-space: nowrap; border: 1.5px solid rgba(255,255,255,0.3);
          ">📍 Klaster Wonosobo</div>`,
          iconAnchor: [60, 12],
          className: '',
        });
        L.default.marker(WONOSOBO_CENTER, { icon: centerIcon }).addTo(map);

        layersRef.current = { ndviLayer, cadastralLayer, markerLayer };
        setMapReady(true);

      } catch (err) {
        console.error('Leaflet init error:', err);
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

  // Update visible layers when activeLayer changes
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;
    const map = leafletMapRef.current;
    const { ndviLayer, cadastralLayer } = layersRef.current;

    if (activeLayer === 'ndvi') {
      if (ndviLayer && !map.hasLayer(ndviLayer)) ndviLayer.addTo(map);
      if (cadastralLayer && map.hasLayer(cadastralLayer)) map.removeLayer(cadastralLayer);
    } else if (activeLayer === 'cadastral') {
      if (ndviLayer && map.hasLayer(ndviLayer)) map.removeLayer(ndviLayer);
      if (cadastralLayer && !map.hasLayer(cadastralLayer)) cadastralLayer.addTo(map);
    } else {
      // rgb
      if (ndviLayer && map.hasLayer(ndviLayer)) map.removeLayer(ndviLayer);
      if (cadastralLayer && map.hasLayer(cadastralLayer)) map.removeLayer(cadastralLayer);
    }
  }, [activeLayer, mapReady]);

  // Scan pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanPulse(p => (p + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const telemetryData = [
    {
      label: 'Klaster Lahan',
      value: 'Wonosobo Agroforest',
      sub: '#TK-WNSB-042 · Jawa Tengah',
      icon: MapPin,
      color: 'text-emerald-700',
    },
    {
      label: 'Koordinat GPS',
      value: '7°21′50″S 109°54′00″E',
      sub: 'WGS 84 · Datum Universal',
      icon: Radio,
      color: 'text-stone-600',
    },
    {
      label: 'Indeks Klorofil NDVI',
      value: '0.88 / 1.00',
      sub: 'Kanopi Sehat · Bebas Penebangan',
      icon: Activity,
      color: 'text-emerald-600',
    },
    {
      label: 'Citra Sentinel-2 Terakhir',
      value: lastScanStr,
      sub: 'Siklus ulang 5 hari · Band NIR 842nm',
      icon: Calendar,
      color: 'text-stone-600',
    },
    {
      label: 'Status Verifikasi',
      value: 'Terverifikasi & Aktif',
      sub: 'KLHK SRN-PPI #REG-AGRO-2026',
      icon: ShieldCheck,
      color: 'text-emerald-700',
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Main Map Container */}
      <div className="bg-white rounded-[28px] border border-stone-200/80 shadow-sm overflow-hidden relative isolate">
        {/* Map header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-stone-700">ESA Sentinel-2 — Live</span>
            <span className="text-stone-300">|</span>
            <span className="text-xs font-mono text-stone-500">Zoom 15 · Wonosobo, Jawa Tengah</span>
          </div>

          {/* Layer toggle pills */}
          <div className="flex items-center gap-1.5 bg-stone-100/80 rounded-xl p-1">
            {LAYERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveLayer(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeLayer === id
                    ? 'bg-white text-[#14382C] shadow-sm border border-stone-200/80'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Icon className="w-3 h-3" strokeWidth={1.8} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Map area */}
        <div className="relative isolate" style={{ height: '480px' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* NDVI Legend Overlay */}
          {activeLayer === 'ndvi' && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/80 shadow-sm px-3.5 py-2.5">
              <p className="text-[10px] font-mono font-bold text-stone-500 mb-1.5 tracking-wider">INDEKS NDVI</p>
              <div className="flex items-center gap-1.5">
                <div className="flex h-2.5 w-24 rounded-full overflow-hidden">
                  <div className="flex-1 bg-[#6ee7b7]" title="0.70" />
                  <div className="flex-1 bg-[#34d399]" title="0.80" />
                  <div className="flex-1 bg-[#10b981]" title="0.85" />
                  <div className="flex-1 bg-[#059669]" title="0.90" />
                  <div className="flex-1 bg-[#047857]" title="0.95" />
                </div>
                <span className="text-[9px] text-stone-400 font-mono">0.70 → 1.00</span>
              </div>
              <p className="text-[9px] text-emerald-700 font-bold mt-1">Rata-rata klaster: <span className="font-mono">0.88</span></p>
            </div>
          )}

          {/* Cadastral legend */}
          {activeLayer === 'cadastral' && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/80 shadow-sm px-3.5 py-2.5">
              <p className="text-[10px] font-mono font-bold text-stone-500 mb-1.5 tracking-wider">LEGENDA KADASTRAL</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-0.5 border-t-2 border-dashed border-amber-400" />
                <span className="text-[10px] text-stone-600">Batas Petak Lahan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#fbbf24]/20 border border-amber-400" />
                <span className="text-[10px] text-stone-600">Area Polikultur 1.20 Ha</span>
              </div>
            </div>
          )}

          {/* Scan sweep overlay for NDVI */}
          {activeLayer === 'ndvi' && (
            <div
              className="absolute inset-0 pointer-events-none z-[5]"
              style={{
                background: `linear-gradient(to bottom, transparent ${scanPulse}%, rgba(16,185,129,0.04) ${scanPulse + 3}%, transparent ${scanPulse + 5}%)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Telemetry Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {telemetryData.map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-stone-200/80 shadow-sm px-4 py-3.5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.5} />
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase">{label}</span>
            </div>
            <p className="text-sm font-bold text-[#14382C] leading-tight">{value}</p>
            <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">{sub}</p>
          </div>
        ))}
      </div>

      {/* Compliance strip */}
      <div className="bg-[#F4F6F0] rounded-2xl border border-stone-200/60 px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
          <span className="text-xs text-stone-600 font-medium">
            Data spasial terverifikasi oleh <strong className="text-[#14382C]">SRN-PPI KLHK</strong> · POJK No. 51/2017 ESG Compliant
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
          <span>Sinkronisasi otomatis setiap 5 hari</span>
        </div>
      </div>
    </div>
  );
}
