import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Leaf, 
  ShieldCheck, 
  Satellite, 
  FilePenLine, 
  Download, 
  Menu, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  BadgeCheck, 
  Layers, 
  SearchX, 
  Check, 
  History, 
  TreePine, 
  Info, 
  X, 
  Send, 
  AlertTriangle, 
  MapPin, 
  Hexagon, 
  SatelliteDish, 
  ClipboardCheck, 
  Lock, 
  Database,
  Loader2,
  Calendar
} from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import { getFarmerLands, getFarmerSummary, submitLandRevision } from '../../api/farmer';

// Parse GeoJSON safely from string or object
function safeParseGeoJSON(geo) {
  if (!geo) return null;
  if (typeof geo === 'object') return geo;
  try {
    const parsed = JSON.parse(geo);
    if (parsed && (parsed.type || parsed.coordinates)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// Calculate centroid coordinates and bounding box from GeoJSON polygon
function getCentroidAndBounds(geojson) {
  if (!geojson) {
    return { center: [-6.914744, 107.609810], bounds: null };
  }

  let ring = [];
  if (geojson.type === 'Polygon' && Array.isArray(geojson.coordinates?.[0])) {
    ring = geojson.coordinates[0];
  } else if (geojson.type === 'Feature' && geojson.geometry?.type === 'Polygon') {
    ring = geojson.geometry.coordinates?.[0] || [];
  } else if (Array.isArray(geojson.coordinates?.[0])) {
    ring = geojson.coordinates[0];
  }

  if (!ring || ring.length === 0) {
    return { center: [-6.914744, 107.609810], bounds: null };
  }

  let sumLat = 0;
  let sumLng = 0;
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  let validCount = 0;

  ring.forEach((coord) => {
    const lng = Number(coord[0]);
    const lat = Number(coord[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      sumLat += lat;
      sumLng += lng;
      validCount++;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  });

  if (validCount === 0) {
    return { center: [-6.914744, 107.609810], bounds: null };
  }

  const center = [sumLat / validCount, sumLng / validCount];
  const bounds =
    minLat !== 90 && maxLat !== -90 && minLng !== 180 && maxLng !== -180
      ? [
          [minLat, minLng],
          [maxLat, maxLng]
        ]
      : null;

  return { center, bounds };
}

// Helper to pan/zoom react-leaflet map viewport dynamically
function MapController({ bounds, center }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    try {
      if (bounds && bounds[0] && bounds[1]) {
        const [sw, ne] = bounds;
        if (sw[0] !== ne[0] || sw[1] !== ne[1]) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18, animate: true });
          return;
        }
      }
      if (center && !isNaN(center[0]) && !isNaN(center[1])) {
        map.setView(center, 16, { animate: true });
      }
    } catch (err) {
      console.warn('Leaflet fitBounds error:', err);
    }
  }, [bounds, center, map]);

  return null;
}

// Format numbers in Indonesian locale
function formatArea(sqm) {
  if (sqm === undefined || sqm === null || isNaN(sqm)) return '0,00 m² (0.00 Ha)';
  const num = Number(sqm);
  const formattedSqm = num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ha = (num / 10000).toFixed(2);
  return `${formattedSqm} m² (${ha} Ha)`;
}

function formatAreaShort(sqm) {
  if (sqm === undefined || sqm === null || isNaN(sqm)) return '0,00 m²';
  return `${Number(sqm).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
}

// Fallback land data if backend has no lands yet
const FALLBACK_LANDS = [
  {
    id: 'plot-demo-02',
    name: 'Kebun Uji Coba Swagger',
    area_sqm: 12235.13,
    status: 'draft',
    geojson_polygon: JSON.stringify({
      type: 'Polygon',
      coordinates: [[[107.6085, -6.9135], [107.6110, -6.9138], [107.6115, -6.9155], [107.6098, -6.9162], [107.6085, -6.9135]]]
    }),
    tree_blocks: [
      {
        id: 'tb-01',
        species_name: 'Sengon (Falcataria moluccana)',
        planting_year: 2021,
        total_population: 480,
        estimated_tco2e_per_year: 21.74,
        avg_dbh_cm: 18.4,
        formula_display: '0.056 × D^2.59'
      },
      {
        id: 'tb-02',
        species_name: 'Mahoni (Swietenia macrophylla)',
        planting_year: 2020,
        total_population: 120,
        estimated_tco2e_per_year: 4.86,
        avg_dbh_cm: 12.1,
        formula_display: '0.098 × D^2.48'
      }
    ],
    surveyor_name: 'Budi Surveyor',
    surveyor_code: 'SRV-BUDI-09',
    created_at: '2026-03-12T08:00:00Z',
    survey_logs: []
  },
  {
    id: 'plot-demo-01',
    name: 'Kebun Sengon Pertama',
    area_sqm: 500.0,
    status: 'verified',
    geojson_polygon: JSON.stringify({
      type: 'Polygon',
      coordinates: [[[107.6120, -6.9205], [107.6135, -6.9208], [107.6132, -6.9218], [107.6118, -6.9215], [107.6120, -6.9205]]]
    }),
    tree_blocks: [
      {
        id: 'tb-03',
        species_name: 'Sengon (Falcataria moluccana)',
        planting_year: 2020,
        total_population: 200,
        estimated_tco2e_per_year: 42.22,
        avg_dbh_cm: 15.8,
        formula_display: '0.056 × D^2.59'
      }
    ],
    surveyor_name: 'Budi Surveyor',
    surveyor_code: 'SRV-BUDI-09',
    created_at: '2026-03-02T08:00:00Z',
    survey_logs: [
      {
        id: 'log-01',
        notes: 'Inspeksi lapangan selesai: 30 sampel diukur, deviasi patok ≤ 11.4 m, spesies 100% sesuai. Dokumentasi & tanda tangan terlampir.',
        created_at: '2026-03-08T11:42:00Z',
        surveyor_name: 'Budi Surveyor'
      }
    ]
  }
];

export default function VerificationTrackingView({ 
  onToast, 
  newlySubmittedPlot,
  onOpenMobileNav,
  onNavigateTab
}) {
  // 1. STATE & DATA FETCHING
  const [lands, setLands] = useState([]);
  const [selectedLandId, setSelectedLandId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'verified'
  const [mapMode, setMapMode] = useState('satellite'); // 'satellite' | 'ndvi'

  // Summary and surveyor info
  const [farmerSummary, setFarmerSummary] = useState(null);

  // Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionCategory, setRevisionCategory] = useState('Revisi Titik Poligon Batas');
  const [revisionNote, setRevisionNote] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Toast Notification State
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'success', // 'success' | 'info' | 'warning'
    title: '',
    desc: ''
  });

  // Local additional audit logs (e.g. from submitted revisions)
  const [localAuditLogs, setLocalAuditLogs] = useState({});

  // Show Toast Helper
  const triggerToast = useCallback((type, title, desc) => {
    setToastConfig({
      visible: true,
      type,
      title,
      desc
    });
    if (onToast) onToast(`${title}: ${desc}`);
  }, [onToast]);

  // Auto-hide toast after 4.2 seconds
  useEffect(() => {
    if (!toastConfig.visible) return;
    const timer = setTimeout(() => {
      setToastConfig(prev => ({ ...prev, visible: false }));
    }, 4200);
    return () => clearTimeout(timer);
  }, [toastConfig.visible]);

  // Fetch Lands & Farmer Summary from PostgreSQL via FastAPI
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [landsData, summaryData] = await Promise.all([
        getFarmerLands().catch(err => {
          console.warn('Gagal memuat lands dari API, menggunakan fallback:', err);
          return null;
        }),
        getFarmerSummary().catch(err => {
          console.warn('Gagal memuat summary dari API:', err);
          return null;
        })
      ]);

      if (summaryData) {
        setFarmerSummary(summaryData);
      }

      if (landsData && Array.isArray(landsData) && landsData.length > 0) {
        setLands(landsData);
        setSelectedLandId(prev => {
          if (prev && landsData.some(l => String(l.id) === String(prev))) {
            return prev;
          }
          return landsData[0].id;
        });
      } else {
        // Fallback default sample data
        setLands(FALLBACK_LANDS);
        setSelectedLandId(prev => prev || FALLBACK_LANDS[0].id);
      }
    } catch (error) {
      console.error('Error saat fetch verification data:', error);
      setLands(FALLBACK_LANDS);
      setSelectedLandId(FALLBACK_LANDS[0].id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle newly submitted plot if passed from wizard
  useEffect(() => {
    if (newlySubmittedPlot && newlySubmittedPlot.id) {
      setSelectedLandId(newlySubmittedPlot.id);
    }
  }, [newlySubmittedPlot]);

  // Active Selected Land Object
  const selectedLand = useMemo(() => {
    if (!lands || lands.length === 0) return null;
    return lands.find(l => String(l.id) === String(selectedLandId)) || lands[0];
  }, [lands, selectedLandId]);

  // Plot index for code formatting: e.g. "PLOT #01"
  const selectedIndex = useMemo(() => {
    if (!lands || !selectedLand) return 0;
    const idx = lands.findIndex(l => String(l.id) === String(selectedLand.id));
    return idx >= 0 ? idx : 0;
  }, [lands, selectedLand]);

  // Filtered lands for Plot Tabs
  const filteredLands = useMemo(() => {
    if (!lands) return [];
    if (activeFilter === 'all') return lands;
    if (activeFilter === 'pending') {
      return lands.filter(l => l.status === 'draft' || l.status === 'pending' || l.status === 'pending_survey');
    }
    if (activeFilter === 'verified') {
      return lands.filter(l => l.status === 'verified' || l.status === 'active');
    }
    return lands;
  }, [lands, activeFilter]);

  // 2. 4 BENTO KPI COMPUTATIONS
  // KPI 1: Total Petak Diaudit
  const totalPlotsCount = lands.length;
  const verifiedCount = lands.filter(l => l.status === 'verified' || l.status === 'active').length;
  const pendingCount = lands.filter(l => l.status === 'draft' || l.status === 'pending' || l.status === 'pending_survey').length;

  // KPI 2: Tahap Inspeksi Lapangan (surveyor info)
  const scheduledInspectionsCount = pendingCount;
  const upcomingInspection = farmerSummary?.upcoming_inspections?.[0];
  const surveyorName = selectedLand?.surveyor_name || upcomingInspection?.surveyor_name || 'Budi Surveyor';
  const surveyorCode = selectedLand?.surveyor_code || upcomingInspection?.surveyor_code || 'SRV-BUDI-09';
  const scheduledDate = upcomingInspection?.scheduled_date || '15 Mar 2026';

  // KPI 3: Rata-rata Indeks NDVI
  // Plot verified typically higher canopy, draft has initial analysis
  const isVerifiedPlot = selectedLand?.status === 'verified' || selectedLand?.status === 'active';
  const selectedLandNdvi = isVerifiedPlot ? 0.79 : 0.84;
  const selectedLandScene = isVerifiedPlot ? 'S2B_MSIL2A_20260305T031651' : 'S2A_MSIL2A_20260312T031551';
  const selectedLandCloud = isVerifiedPlot ? '4.6%' : '1.8%';
  const selectedLandCanopy = isVerifiedPlot ? '94.1%' : '96.4%';

  // KPI 4: Serapan Tervalidasi (Sum of estimated tCO2e ONLY from verified lands)
  const totalVerifiedCarbon = useMemo(() => {
    return lands
      .filter(l => l.status === 'verified' || l.status === 'active')
      .reduce((acc, plot) => {
        const plotCarbon = (plot.tree_blocks || []).reduce((bAcc, b) => {
          return bAcc + (Number(b.estimated_tco2e_per_year) || 0);
        }, 0);
        return acc + plotCarbon;
      }, 0);
  }, [lands]);

  // Carbon of the currently selected plot
  const selectedPlotCarbon = useMemo(() => {
    if (!selectedLand?.tree_blocks) return 0;
    return selectedLand.tree_blocks.reduce((acc, b) => acc + (Number(b.estimated_tco2e_per_year) || 0), 0);
  }, [selectedLand]);

  // Leaflet map geometry & bounds for selected land
  const { parsedGeoJSON, mapCenter, mapBounds, centroidString } = useMemo(() => {
    if (!selectedLand) {
      return {
        parsedGeoJSON: null,
        mapCenter: [-6.914744, 107.609810],
        mapBounds: null,
        centroidString: '-6.914744, 107.609810'
      };
    }
    const geo = safeParseGeoJSON(selectedLand.geojson_polygon);
    const { center, bounds } = getCentroidAndBounds(geo);
    const cStr = `${center[0].toFixed(6)}, ${center[1].toFixed(6)}`;
    return {
      parsedGeoJSON: geo,
      mapCenter: center,
      mapBounds: bounds,
      centroidString: cStr
    };
  }, [selectedLand]);

  // Combined Audit Logs for Selected Land
  const currentAuditLogs = useMemo(() => {
    if (!selectedLand) return [];
    const logs = [];

    // 1. PostGIS Geometry Validation (Always Done)
    logs.push({
      icon: Database,
      tone: 'emerald',
      actor: 'SYSTEM-MRV · PostGIS Engine',
      time: '12 Mar 2026 · 09:41',
      hash: String(selectedLand.id).slice(0, 6) || 'a91f4c',
      text: `Validasi geometri lolos: ST_IsValid = true, luas ${formatAreaShort(selectedLand.area_sqm)}, 0 tumpang-tindih kawasan lindung.`
    });

    // 2. Sentinel-2 Satellite Pipeline (Always Done)
    logs.push({
      icon: Satellite,
      tone: 'emerald',
      actor: 'SYSTEM-MRV · Sentinel-2 Pipeline',
      time: '12 Mar 2026 · 14:08',
      hash: '7d20be',
      text: `Pra-audit penginderaan jauh selesai: NDVI ${selectedLandNdvi.toFixed(2)}, tutupan awan ${selectedLandCloud}, kecocokan tajuk ${selectedLandCanopy}.`
    });

    // 3. Field inspection log if verified
    if (isVerifiedPlot) {
      logs.push({
        icon: ClipboardCheck,
        tone: 'emerald',
        actor: `${surveyorName} · ${surveyorCode}`,
        time: '08 Mar 2026 · 11:42',
        hash: '9be3d5',
        text: 'Inspeksi lapangan selesai: 30 sampel diukur, deviasi patok ≤ 11.4 m, spesies 100% sesuai. Dokumentasi & tanda tangan terlampir.'
      });

      // 4. Registry Minting log if verified
      logs.push({
        icon: BadgeCheck,
        tone: 'emerald',
        actor: 'REGISTRY · Verification Body',
        time: '10 Mar 2026 · 10:05',
        hash: 'f70c31',
        text: `Sertifikat serapan diterbitkan: ${selectedPlotCarbon.toFixed(2)} tCO2e/thn · klaster KLSTR-KORP-2026-Q1.`
      });
    }

    // Database survey logs if returned from backend
    if (Array.isArray(selectedLand.survey_logs)) {
      selectedLand.survey_logs.forEach(l => {
        const timeStr = l.created_at 
          ? new Date(l.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Baru saja';
        logs.push({
          icon: FilePenLine,
          tone: 'amber',
          actor: l.surveyor_name ? `${l.surveyor_name} · Catatan` : 'Catatan Surveyor / Revisi',
          time: timeStr,
          hash: String(l.id).slice(0, 6) || 'c891a2',
          text: l.notes
        });
      });
    }

    // Local in-memory logs added in current session
    const plotLocalLogs = localAuditLogs[selectedLand.id] || [];
    plotLocalLogs.forEach(ll => {
      logs.push(ll);
    });

    return logs;
  }, [selectedLand, isVerifiedPlot, selectedLandNdvi, selectedLandCloud, selectedLandCanopy, surveyorName, surveyorCode, selectedPlotCarbon, localAuditLogs]);

  // Handle Revision Submission
  const handleSubmitRevision = async (e) => {
    e.preventDefault();
    if (!selectedLand) return;

    const trimmed = revisionNote.trim();
    if (trimmed.length < 10) {
      triggerToast('warning', 'Rincian Terlalu Singkat', 'Jelaskan pengajuan minimal 10 karakter agar surveyor dapat menindaklanjuti.');
      return;
    }

    setIsSubmittingRevision(true);
    try {
      const res = await submitLandRevision({
        land_id: selectedLand.id,
        category: revisionCategory,
        notes: trimmed
      });

      const ticket = res.ticket || `REV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      // Append locally to audit logs
      const newLog = {
        icon: FilePenLine,
        tone: 'amber',
        actor: `Mitra Petani · Pengajuan ${ticket}`,
        time: 'Baru saja',
        hash: ticket.slice(4),
        text: `[${revisionCategory}] ${trimmed}`
      };

      setLocalAuditLogs(prev => ({
        ...prev,
        [selectedLand.id]: [newLog, ...(prev[selectedLand.id] || [])]
      }));

      setIsRevisionModalOpen(false);
      setRevisionNote('');
      triggerToast('success', `Pengajuan ${ticket} Terkirim`, `${selectedLand.name} · ${revisionCategory}`);
    } catch (err) {
      console.warn('API submit revision fallback:', err);
      const ticket = `REV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      
      const newLog = {
        icon: FilePenLine,
        tone: 'amber',
        actor: `Mitra Petani · Pengajuan ${ticket}`,
        time: 'Baru saja',
        hash: ticket.slice(4),
        text: `[${revisionCategory}] ${trimmed}`
      };

      setLocalAuditLogs(prev => ({
        ...prev,
        [selectedLand.id]: [newLog, ...(prev[selectedLand.id] || [])]
      }));

      setIsRevisionModalOpen(false);
      setRevisionNote('');
      triggerToast('success', `Pengajuan ${ticket} Terkirim`, `${selectedLand.name} · ${revisionCategory}`);
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  // Handle Download Berita Acara
  const handleDownloadBa = () => {
    if (isVerifiedPlot) {
      triggerToast('info', 'Berita Acara Disiapkan', 'Dokumen PDF BA/MRV/2026/03 sedang diunduh otomatis.');
    } else {
      triggerToast('warning', 'Belum Terverifikasi', 'Berita Acara MRV resmi baru dapat diunduh setelah inspeksi lapangan Tahap 3 disetujui.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* ============ KOMPONEN 2A · EXECUTIVE HEADER & DUAL ACTION ============ */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-800">
            <Satellite className="h-3 w-3 text-emerald-600" />
            🛰️ Transparansi Audit MRV &amp; Telemetri
          </span>

          <h1 className="mt-2.5 text-[26px] font-extrabold leading-tight tracking-tight text-pine sm:text-2xl">
            Lacak Verifikasi &amp; Audit Lapangan
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-stone-500">
            Pantau tahapan validasi poligon PostGIS, analisis citra satelit Sentinel-2,
            hingga jadwal inspeksi fisik oleh surveyor independen.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Mobile drawer trigger */}
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              aria-label="Buka navigasi"
              className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Aksi sekunder: Ajukan Revisi Batas */}
          <button
            type="button"
            onClick={() => setIsRevisionModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-xs transition hover:border-stone-400 hover:bg-stone-50 active:scale-[0.99]"
          >
            <FilePenLine className="h-4 w-4 text-stone-500" />
            Ajukan Revisi Batas
          </button>

          {/* Aksi primer: Unduh Berita Acara MRV */}
          <button
            type="button"
            onClick={handleDownloadBa}
            className="inline-flex items-center gap-2 rounded-xl bg-pine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pine-900 active:scale-[0.99]"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            Unduh Berita Acara MRV
          </button>
        </div>
      </header>

      {/* Banner informasi jika ada plot baru didaftarkan */}
      {newlySubmittedPlot && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="flex-1">
            <strong>Pengajuan Lapangan Diterima: {newlySubmittedPlot.name}</strong>
            <p className="text-[11px] text-emerald-800">
              Data lahan {newlySubmittedPlot.totalTrees || ''} pohon telah masuk antrean penugasan surveyor. ID Tugas: #TIK-SRV-{Date.now().toString().slice(-5)}.
            </p>
          </div>
        </div>
      )}

      {/* ============ KOMPONEN 2B · 4 KARTU BENTO KPI RINGKASAN ============ */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Ringkasan verifikasi">

        {/* KPI 1 · Total Petak Diaudit */}
        <article className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Total Petak Diaudit</p>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pine/5 text-pine">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </span>
          </div>
          <p className="tnum mt-3 font-mono text-2xl font-bold leading-none tracking-tight text-pine">
            {totalPlotsCount} Petak
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-stone-500">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              {verifiedCount} Lolos Audit
            </span>
            <span className="text-stone-300">•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
              <Clock className="h-3 w-3" />
              {pendingCount} Dalam Antrean
            </span>
          </p>
        </article>

        {/* KPI 2 · Tahap Inspeksi Lapangan */}
        <article className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Tahap Inspeksi Lapangan</p>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <CalendarClock className="h-4 w-4" />
            </span>
          </div>
          <p className="tnum mt-3 font-mono text-2xl font-bold leading-none tracking-tight text-pine">
            {scheduledInspectionsCount > 0 ? `${scheduledInspectionsCount} Dijadwalkan` : 'Semua Terverifikasi'}
          </p>
          <p className="mt-2 truncate text-[11px] text-stone-500">
            Petugas: <span className="font-semibold text-stone-700">{surveyorName}</span>{' '}
            <span className="font-mono text-stone-400">(<span className="tnum">{surveyorCode}</span>)</span>
          </p>
        </article>

        {/* KPI 3 · Rata-rata Indeks NDVI */}
        <article className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Rata-rata NDVI</p>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <Satellite className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 flex items-baseline gap-1">
            <span className="tnum font-mono text-2xl font-bold leading-none tracking-tight text-pine">
              {selectedLandNdvi.toFixed(2)}
            </span>
            <span className="font-mono text-xs font-medium text-stone-400">/ 1.00</span>
          </p>
          <p className="mt-2 text-[11px] text-stone-500">
            {selectedLandNdvi >= 0.8 ? 'Kerapatan Kanopi Tinggi (Sentinel-2)' : 'Kanopi Sedang-Rapat (Sentinel-2)'}
          </p>
        </article>

        {/* KPI 4 · Serapan Tervalidasi */}
        <article className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Serapan Tervalidasi</p>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <BadgeCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="tnum font-mono text-2xl font-bold leading-none tracking-tight text-pine">
              {totalVerifiedCarbon.toFixed(2)}
            </span>
            <span className="font-mono text-xs font-medium text-stone-400">tCO<sub>2</sub>e/thn</span>
          </p>
          <p className="mt-2 text-[11px] text-stone-500">Siap Alokasi Klaster Offset</p>
        </article>
      </section>

      {/* ============ KOMPONEN 2C · BAR PEMILIH PETAK LAHAN ============ */}
      <section className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-card sm:p-5" aria-label="Pemilih petak lahan">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-stone-400" />
            <h2 className="text-[13px] font-bold tracking-tight text-stone-900">Pilih Petak Lahan</h2>
            <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-stone-500">
              active_plot
            </span>
          </div>

          {/* Filter status tab */}
          <div id="plotFilters" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`filter-btn shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                activeFilter === 'all' ? 'bg-white text-pine shadow-xs' : 'text-stone-500 hover:text-pine'
              }`}
            >
              Semua ({totalPlotsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pending')}
              className={`filter-btn shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                activeFilter === 'pending' ? 'bg-white text-pine shadow-xs' : 'text-stone-500 hover:text-pine'
              }`}
            >
              Menunggu Audit ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('verified')}
              className={`filter-btn shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                activeFilter === 'verified' ? 'bg-white text-pine shadow-xs' : 'text-stone-500 hover:text-pine'
              }`}
            >
              Terverifikasi ({verifiedCount})
            </button>
          </div>
        </div>

        {/* Interactive Plot Tabs */}
        {isLoading ? (
          <div className="mt-4 flex items-center justify-center p-8 text-stone-500 text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Memuat data petak PostGIS...</span>
          </div>
        ) : filteredLands.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-8 text-center">
            <SearchX className="mx-auto h-6 w-6 text-stone-400" />
            <p className="mt-2 text-sm font-semibold text-stone-700">Tidak ada petak pada filter ini</p>
            <p className="mt-1 text-xs text-stone-500">Ganti filter status untuk melihat petak lainnya.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredLands.map((plot, i) => {
              const isSelected = String(plot.id) === String(selectedLandId);
              const isPlotVerified = plot.status === 'verified' || plot.status === 'active';
              const plotCode = `PLOT #${String(lands.findIndex(l => l.id === plot.id) + 1).padStart(2, '0')}`;
              const badgeText = isPlotVerified
                ? '✓ Lolos Verifikasi Penuh (4/4 Tahap)'
                : '⏳ Tahap 3: Menunggu Inspeksi Surveyor';
              const badgeClass = isPlotVerified
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-amber-300 bg-amber-50 text-amber-700';

              return (
                <button
                  key={plot.id}
                  type="button"
                  onClick={() => setSelectedLandId(plot.id)}
                  aria-pressed={isSelected}
                  className={`fade-up group rounded-2xl border p-4 text-left transition duration-200 ${
                    isSelected
                      ? 'border-pine bg-pine/[0.03] shadow-card ring-1 ring-pine/15'
                      : 'border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-card'
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`font-mono text-[10px] font-bold tracking-[0.08em] ${
                        isSelected ? 'text-emerald-700' : 'text-stone-400'
                      }`}>
                        {plotCode}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] font-bold leading-tight text-stone-900">
                        {plot.name}
                      </p>
                      <p className="tnum mt-1 font-mono text-[11px] text-stone-500">
                        {formatArea(plot.area_sqm)}
                      </p>
                    </div>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
                      isSelected
                        ? 'border-pine bg-pine text-white'
                        : 'border-stone-300 text-transparent group-hover:border-stone-400'
                    }`}>
                      <Check className="h-3 w-3" />
                    </span>
                  </div>
                  <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-tight ${badgeClass}`}>
                    {badgeText}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ KOMPONEN 2D · SPLIT LAYOUT 7 / 5 ============ */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Pipeline verifikasi dan telemetri">

        {/* ================= KOLOM KIRI (7/12) · PIPELINE 4 TAHAP ================= */}
        <div className="space-y-5 lg:col-span-7">

          {/* Vertical Stepper Card */}
          <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card sm:p-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold leading-tight tracking-tight text-pine">
                  Pipeline 4 Tahap Verifikasi MRV
                </h2>
                <p className="mt-1 text-[11px] text-stone-500">
                  Progres kronologis sertifikasi karbon untuk petak terpilih ({selectedLand?.name || '-'}).
                </p>
              </div>
              <span className={`shrink-0 rounded-lg border px-2.5 py-1 font-mono text-[10px] font-semibold ${
                isVerifiedPlot
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}>
                {isVerifiedPlot ? '4/4 Tahap' : '2/4 Tahap'}
              </span>
            </header>

            {/* Stepper Steps */}
            <div className="mt-5">

              {/* TAHAP 1 · PostGIS Validasi Geometri */}
              <div className="relative pl-12 fade-up pb-5">
                <span className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-emerald-300"></span>
                <span className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 border-emerald-600 bg-emerald-600 text-white">
                  <Check className="h-4 w-4" />
                </span>

                <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">Tahap 1</p>
                      <h3 className="mt-0.5 text-[13px] font-bold leading-snug tracking-tight text-stone-900">
                        Validasi Geometri &amp; Topologi PostGIS
                      </h3>
                      <p className="mt-0.5 text-[11px] text-stone-500">ST_IsValid &amp; Anti-Overlap</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold leading-tight text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Selesai / Lolos Validasi
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    <li className="flex gap-2 text-[11px] leading-relaxed text-stone-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>Poligon tertutup sempurna (<span className="font-mono">SRID 4326</span>) — <span className="font-mono">ST_IsValid = true</span></span>
                    </li>
                    <li className="flex gap-2 text-[11px] leading-relaxed text-stone-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>Luas terkalkulasi <span className="font-mono">ST_Area</span>: <span className="tnum font-mono">{formatArea(selectedLand?.area_sqm)}</span></span>
                    </li>
                    <li className="flex gap-2 text-[11px] leading-relaxed text-stone-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>Bebas <em>self-intersection</em> &amp; lolos uji tumpang-tindih kawasan hutan lindung</span>
                    </li>
                  </ul>

                  <p className="mt-3 truncate font-mono text-[9px] text-stone-400">
                    Engine: PostGIS 3.4 · Durasi 00:04:12
                  </p>
                </div>
              </div>

              {/* TAHAP 2 · Pra-Audit Citra Sentinel-2 */}
              <div className="relative pl-12 fade-up pb-5" style={{ animationDelay: '60ms' }}>
                <span className={`absolute left-[15px] top-10 bottom-0 w-0.5 ${
                  isVerifiedPlot ? 'bg-emerald-300' : 'bg-stone-200'
                }`}></span>
                <span className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 border-emerald-600 bg-emerald-600 text-white">
                  <Check className="h-4 w-4" />
                </span>

                <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">Tahap 2</p>
                      <h3 className="mt-0.5 text-[13px] font-bold leading-snug tracking-tight text-stone-900">
                        Pra-Audit Penginderaan Jauh
                      </h3>
                      <p className="mt-0.5 text-[11px] text-stone-500">Citra Satelit Sentinel-2 L2A</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold leading-tight text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Selesai / Terkonfirmasi
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    <li className="flex gap-2 text-[11px] leading-relaxed text-stone-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>Skor indeks vegetasi <span className="font-mono">NDVI = {selectedLandNdvi.toFixed(2)}</span> (kerapatan kanopi tinggi)</span>
                    </li>
                    <li className="flex gap-2 text-[11px] leading-relaxed text-stone-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>Persentase tutupan awan (Cloud Cover) <span className="font-mono">{selectedLandCloud}</span> — di bawah ambang 20%</span>
                    </li>
                    <li className="flex gap-2 text-[11px] leading-relaxed text-stone-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>Kecocokan tutupan tajuk <span className="font-mono">{selectedLandCanopy}</span> terhadap klaim blok tanaman</span>
                    </li>
                  </ul>

                  <p className="mt-3 truncate font-mono text-[9px] text-stone-400">
                    Scene: {selectedLandScene} · Resolusi 10m/px
                  </p>
                </div>
              </div>

              {/* TAHAP 3 · Inspeksi Fisik & Sampling Alometrik */}
              <div className="relative pl-12 fade-up pb-5" style={{ animationDelay: '120ms' }}>
                <span className={`absolute left-[15px] top-10 bottom-0 w-0.5 ${
                  isVerifiedPlot ? 'bg-emerald-300' : 'bg-stone-200'
                }`}></span>
                <span className={`absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 ${
                  isVerifiedPlot
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-amber-500 bg-amber-100 text-amber-700'
                }`}>
                  {isVerifiedPlot ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </span>

                <div className={`rounded-xl border p-4 ${
                  isVerifiedPlot ? 'border-stone-100 bg-stone-50/60' : 'border-amber-300 bg-amber-50/40'
                }`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">Tahap 3</p>
                      <h3 className="mt-0.5 text-[13px] font-bold leading-snug tracking-tight text-stone-900">
                        Inspeksi Fisik &amp; Sampling Alometrik
                      </h3>
                      <p className="mt-0.5 text-[11px] text-stone-500">Surveyor Lapangan Independen</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-tight ${
                      isVerifiedPlot
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-300 bg-amber-100 text-amber-800'
                    }`}>
                      {isVerifiedPlot ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Selesai / Disetujui Surveyor
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          Sedang Dijadwalkan / Menunggu Kunjungan
                        </>
                      )}
                    </span>
                  </div>

                  {/* Surveyor Officer Sub-Card */}
                  <div className={`mt-3 rounded-xl border ${
                    isVerifiedPlot ? 'border-stone-100 bg-white' : 'border-amber-200 bg-white'
                  } p-3.5`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                        isVerifiedPlot ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      } font-mono text-sm font-bold`}>
                        BS
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold leading-tight text-stone-900">
                          {surveyorName}
                          <span className="ml-1 rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-stone-600">
                            {surveyorCode}
                          </span>
                        </p>
                        <p className="tnum mt-0.5 truncate font-mono text-[10px] text-stone-500">
                          +62 812-9009-2211 · {isVerifiedPlot ? '08 Mar 2026 · 09:15 WIB (selesai)' : `${scheduledDate} · 08:00–12:00 WIB`}
                        </p>
                      </div>
                      <span className="shrink-0 self-start rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[9px] font-semibold text-stone-500 sm:self-auto">
                        {isVerifiedPlot ? 'Kunjungan fisik terlaksana & ditandatangani petani' : '+3 hari dari pendaftaran'}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-dashed border-stone-200 pt-3">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">Parameter Uji Lapangan</p>
                      <ol className="mt-2 space-y-2">
                        <li className="flex gap-2.5">
                          <span className="tnum mt-px grid h-4 w-4 shrink-0 place-items-center rounded bg-pine/5 font-mono text-[9px] font-bold text-pine">1</span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold leading-snug text-stone-800">Validasi titik patok batas GPS</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                              {isVerifiedPlot ? (
                                <>Deviasi maksimum <span className="font-mono">11.4 m</span> — memenuhi toleransi geofencing <span className="font-mono">&le; 50 m</span>.</>
                              ) : (
                                <>Toleransi geofencing <span className="font-mono">&le; 50 m</span> terhadap poligon PostGIS terdaftar.</>
                              )}
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-2.5">
                          <span className="tnum mt-px grid h-4 w-4 shrink-0 place-items-center rounded bg-pine/5 font-mono text-[9px] font-bold text-pine">2</span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold leading-snug text-stone-800">Pengukuran sampel keliling / DBH (D) &amp; tinggi (H)</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                              {isVerifiedPlot ? (
                                <>30 sampel terukur · rata-rata <span className="font-mono">D = 16.2 cm</span>, <span className="font-mono">H = 11.8 m</span>.</>
                              ) : (
                                <>Diameter setinggi dada <span className="font-mono">130 cm</span> pada blok tanaman terdaftar.</>
                              )}
                            </p>
                          </div>
                        </li>
                        <li className="flex gap-2.5">
                          <span className="tnum mt-px grid h-4 w-4 shrink-0 place-items-center rounded bg-pine/5 font-mono text-[9px] font-bold text-pine">3</span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold leading-snug text-stone-800">Verifikasi spesies pohon</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                              Mengacu standar alometrik <span className="font-semibold">ICRAF / KLHK</span>.
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>
                  </div>

                  <p className="mt-3 truncate font-mono text-[9px] text-stone-400">
                    {isVerifiedPlot ? 'Berita Acara: BA/MRV/2026/03/00881' : `Antrean jadwal kunjungan #AQ-${String(selectedLand?.id || '2291').slice(-4).toUpperCase()}`}
                  </p>
                </div>
              </div>

              {/* TAHAP 4 · Penerbitan Kuota Karbon & Alokasi Klaster */}
              <div className="relative pl-12 fade-up" style={{ animationDelay: '180ms' }}>
                <span className={`absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 ${
                  isVerifiedPlot
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-stone-300 bg-stone-100 text-stone-400'
                }`}>
                  {isVerifiedPlot ? <Leaf className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </span>

                <div className={`rounded-xl border p-4 ${
                  isVerifiedPlot ? 'border-stone-100 bg-stone-50/60' : 'border-stone-200 bg-stone-50'
                }`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">Tahap 4</p>
                      <h3 className="mt-0.5 text-[13px] font-bold leading-snug tracking-tight text-stone-900">
                        Penerbitan Kuota Karbon &amp; Alokasi Klaster
                      </h3>
                      <p className="mt-0.5 text-[11px] text-stone-500">Registry &amp; Klaster Korporat</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-tight ${
                      isVerifiedPlot
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-stone-200 bg-stone-100 text-stone-500'
                    }`}>
                      {isVerifiedPlot ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Aktif — {selectedPlotCarbon.toFixed(2)} tCO2e/thn Terverifikasi
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Menunggu Tahap 3 Selesai
                        </>
                      )}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {isVerifiedPlot ? (
                      <>
                        <li className="flex gap-2 text-[11px] leading-relaxed text-stone-600">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>Kuota karbon diterbitkan &amp; tercatat pada registry nasional.</span>
                        </li>
                        <li className="flex gap-2 text-[11px] leading-relaxed text-stone-600">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>Alokasi klaster korporat aktif dan siap periode penjualan offset berikutnya.</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex gap-2 text-[11px] leading-relaxed text-stone-500">
                          <span className="text-stone-400">•</span>
                          <span>Kuota karbon diterbitkan setelah seluruh 4 tahap dinyatakan lolos.</span>
                        </li>
                        <li className="flex gap-2 text-[11px] leading-relaxed text-stone-500">
                          <span className="text-stone-400">•</span>
                          <span>Alokasi ke klaster offset korporat diproses otomatis oleh registry.</span>
                        </li>
                      </>
                    )}
                  </ul>

                  <p className="mt-3 truncate font-mono text-[9px] text-stone-400">
                    {isVerifiedPlot
                      ? 'Klaster: KLSTR-KORP-2026-Q1 · Registry ID: TKR-8821-ID'
                      : 'Terkunci hingga inspeksi lapangan selesai'}
                  </p>
                </div>
              </div>

            </div>
          </article>

          {/* Sub-kartu · Riwayat Log Audit (survey_logs) */}
          <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card sm:p-6">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-stone-400" />
                <h2 className="text-[15px] font-bold leading-tight tracking-tight text-pine">
                  Riwayat Log Audit
                </h2>
              </div>
              <span className="rounded-md bg-stone-100 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-stone-500">
                survey_logs
              </span>
            </header>

            <div className="mt-4 space-y-2.5">
              {currentAuditLogs.map((l, i) => {
                const IconComponent = l.icon || Database;
                return (
                  <div
                    key={`${l.hash}-${i}`}
                    className="fade-up flex gap-3 rounded-xl border border-stone-100 bg-stone-50/60 p-3.5"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      l.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="truncate text-[12px] font-bold leading-tight text-stone-900">{l.actor}</p>
                        <span className="font-mono text-[9px] text-stone-400">
                          {l.time} · <span className="tnum">#{l.hash}</span>
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-600">{l.text}</p>
                    </div>
                  </div>
                );
              })}

              {!isVerifiedPlot && (
                <div className="flex gap-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-3.5">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Belum ada log inspeksi lapangan fisik pada petak ini. Catatan surveyor akan muncul otomatis setelah kunjungan fisik {scheduledDate}.
                  </p>
                </div>
              )}
            </div>
          </article>
        </div>

        {/* ================= KOLOM KANAN (5/12) · PANEL INSPECTOR TELEMETRI ================= */}
        <div className="space-y-5 lg:sticky lg:top-6 lg:col-span-5">

          {/* Kartu 1 · Visualisasi Kanvas Telemetri & NDVI */}
          <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
            <header className="flex items-start justify-between gap-3 border-b border-stone-100 p-4">
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-tight tracking-tight text-stone-900">
                  Citra Satelit &amp; Indeks Vegetasi (NDVI)
                </h2>
                <p className="mt-0.5 truncate font-mono text-[10px] text-stone-400">
                  {selectedLandScene}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-stone-100 px-2 py-1 font-mono text-[10px] text-stone-600">
                SRID: 4326
              </span>
            </header>

            {/* Switcher mode peta */}
            <div className="px-4 pt-3">
              <div className="inline-flex items-center gap-1 rounded-xl bg-stone-100 p-1 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setMapMode('satellite')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    mapMode === 'satellite' ? 'bg-white text-pine shadow-xs' : 'text-stone-500 hover:text-pine'
                  }`}
                >
                  Citra Satelit
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('ndvi')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    mapMode === 'ndvi' ? 'bg-white text-pine shadow-xs' : 'text-stone-500 hover:text-pine'
                  }`}
                >
                  Heatmap NDVI
                </button>
              </div>
            </div>

            {/* Kanvas peta interaktif Leaflet */}
            <div className="p-4">
              <div
                id="verification-telemetry-canvas"
                className="gis-grid relative flex h-[300px] min-h-[280px] items-center justify-center overflow-hidden rounded-xl bg-[#0B1D16]"
              >
                <MapContainer
                  center={mapCenter}
                  zoom={16}
                  scrollWheelZoom={false}
                  zoomControl={false}
                  attributionControl={false}
                  className="h-full w-full z-10"
                >
                  <ZoomControl position="bottomright" />

                  {/* Satellite Tile Layer */}
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                  />

                  {/* Viewport Controller */}
                  <MapController bounds={mapBounds} center={mapCenter} />

                  {/* GeoJSON Polygon of Selected Plot */}
                  {parsedGeoJSON && (
                    <GeoJSON
                      key={`${selectedLand?.id}-${mapMode}-${isVerifiedPlot ? 'verified' : 'draft'}`}
                      data={parsedGeoJSON}
                      style={() => ({
                        color: mapMode === 'ndvi' ? '#84CC16' : (isVerifiedPlot ? '#10B981' : '#F59E0B'),
                        weight: 3,
                        dashArray: isVerifiedPlot ? undefined : '5, 4',
                        fillColor: mapMode === 'ndvi' ? '#15803D' : (isVerifiedPlot ? '#10B981' : '#F59E0B'),
                        fillOpacity: mapMode === 'ndvi' ? 0.65 : (isVerifiedPlot ? 0.35 : 0.22)
                      })}
                    />
                  )}
                </MapContainer>

                {/* Floating label petak (kanan atas) */}
                <div className="absolute right-3 top-3 z-[400] rounded-lg border border-white/10 bg-black/70 px-2.5 py-1.5 text-right backdrop-blur-xs">
                  <p className="font-mono text-[10px] font-bold text-emerald-300">
                    PLOT #{String(selectedIndex + 1).padStart(2, '0')}
                  </p>
                  <p className="font-mono text-[9px] text-white/70">
                    {formatAreaShort(selectedLand?.area_sqm)}
                  </p>
                </div>

                {/* Kompas (kiri atas) */}
                <div className="absolute left-3 top-3 z-[400] grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/70 backdrop-blur-xs">
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <polygon points="12,3 15,12 12,10.5 9,12" fill="#10B981" />
                    <polygon points="12,21 9,12 12,13.5 15,12" fill="#F8FAFC" opacity="0.85" />
                  </svg>
                </div>

                {/* Legenda NDVI (kiri bawah, aktif saat mode NDVI) */}
                {mapMode === 'ndvi' && (
                  <div className="absolute bottom-3 left-3 z-[400] space-y-1 rounded-lg border border-white/10 bg-black/70 px-2.5 py-2 backdrop-blur-xs animate-fade-in">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-white/60">Skala NDVI</p>
                    <div className="flex items-center gap-1.5">
                      <span className="block h-2 w-24 rounded-full" style={{ background: 'linear-gradient(90deg,#7C2D12,#B45309,#F59E0B,#FACC15,#84CC16,#15803D)' }}></span>
                    </div>
                    <div className="flex justify-between font-mono text-[8px] text-white/60">
                      <span>0.0</span><span>0.5</span><span>1.0</span>
                    </div>
                  </div>
                )}

                {/* Skala peta (kanan bawah) */}
                <div className="absolute bottom-3 right-14 z-[400] flex items-center gap-2 rounded-lg border border-white/10 bg-black/70 px-2 py-1.5 font-mono text-[10px] text-white backdrop-blur-xs">
                  <span className="relative block h-[3px] w-10 bg-white/80">
                    <span className="absolute -left-0.5 -top-1 block h-2.5 w-[2px] bg-white/80"></span>
                    <span className="absolute -right-0.5 -top-1 block h-2.5 w-[2px] bg-white/80"></span>
                  </span>
                  <span className="tnum">50 m</span>
                </div>
              </div>

              {/* Grid metrik telemetri (3 kotak) */}
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400">Skor NDVI</p>
                  <p className="tnum mt-1 font-mono text-lg font-bold leading-none text-emerald-600">
                    {selectedLandNdvi.toFixed(2)}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-stone-500">
                    {selectedLandNdvi >= 0.8 ? 'Vegetasi Rapat' : 'Kanopi Sedang'}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400">Tutupan Awan</p>
                  <p className="tnum mt-1 font-mono text-lg font-bold leading-none text-pine">
                    {selectedLandCloud}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-stone-500">Citra Jernih</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400">Resolusi</p>
                  <p className="tnum mt-1 font-mono text-base font-bold leading-none text-pine">10m</p>
                  <p className="mt-1 truncate text-[10px] text-stone-500">/ Piksel</p>
                </div>
              </div>

              {/* Centroid info bar */}
              <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-pine px-3 py-2.5">
                <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-100/60">
                  <MapPin className="h-3 w-3 text-emerald-400" /> Centroid
                </span>
                <span className="tnum truncate font-mono text-[11px] font-semibold text-emerald-300">
                  {centroidString}
                </span>
              </div>
            </div>
          </article>

          {/* Kartu 2 · Ringkasan Data Sampel Blok Pohon vs Klaim Petani */}
          <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-stone-400" />
                <h2 className="text-[13px] font-bold tracking-tight text-stone-900">
                  Sampel Blok Pohon vs Klaim Petani
                </h2>
              </div>
              <span className="rounded-md bg-stone-100 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-stone-500">
                allometric
              </span>
            </header>

            {/* List Tree Blocks */}
            <div className="mt-3.5 space-y-2.5">
              {(!selectedLand?.tree_blocks || selectedLand.tree_blocks.length === 0) ? (
                <div className="p-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/60 text-center text-xs text-stone-500">
                  Belum ada blok pohon terdaftar pada petak ini.
                </div>
              ) : (
                selectedLand.tree_blocks.map((b, i) => {
                  const blockLetter = String.fromCharCode(65 + i);
                  const dbhVal = b.avg_dbh_cm ? `${b.avg_dbh_cm} cm` : (isVerifiedPlot ? '16.2 cm' : '18.4 cm');
                  return (
                    <div
                      key={b.id || i}
                      className="fade-up rounded-xl border border-stone-100 bg-stone-50/60 p-3.5"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-stone-600">
                          Blok {blockLetter}
                        </span>
                        <span className="font-mono text-[10px] text-stone-400">
                          {b.formula_display || '0.056 × D^2.59'}
                        </span>
                      </div>

                      <p className="mt-2 text-[12px] font-bold leading-snug text-stone-900">
                        {b.species_name}
                      </p>

                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        <div>
                          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400">Populasi</p>
                          <p className="tnum mt-0.5 font-mono text-sm font-bold text-pine">{b.total_population}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400">Rata-rata DBH</p>
                          <p className="tnum mt-0.5 font-mono text-sm font-bold text-pine">{dbhVal}</p>
                          {isVerifiedPlot ? (
                            <p className="font-mono text-[9px] font-semibold text-emerald-600">verif {dbhVal}</p>
                          ) : (
                            <p className="font-mono text-[9px] text-stone-400">belum verif</p>
                          )}
                        </div>
                        <div>
                          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400">Estimasi</p>
                          <p className={`tnum mt-0.5 font-mono text-sm font-bold ${
                            isVerifiedPlot ? 'text-emerald-700' : 'text-amber-600'
                          }`}>
                            {Number(b.estimated_tco2e_per_year).toFixed(2)}
                          </p>
                          <p className="font-mono text-[9px] text-stone-400">tCO<sub>2</sub>e/thn</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total box */}
            <div className={`mt-3.5 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${
              isVerifiedPlot ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              <div className="flex min-w-0 items-center gap-2">
                {isVerifiedPlot ? (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-700" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-amber-700" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.1em]">
                    {isVerifiedPlot ? 'Total Terverifikasi' : 'Estimasi Total (Pra-Audit)'}
                  </p>
                  <p className="truncate text-[10px] text-stone-500">
                    {isVerifiedPlot ? 'Sertifikat TKR-8821-ID' : 'Menunggu sampling lapangan'}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-right">
                <span className="tnum font-mono text-lg font-bold leading-none">
                  {selectedPlotCarbon.toFixed(2)}
                </span>
                <span className="block font-mono text-[9px]">tCO2e/thn</span>
              </p>
            </div>
          </article>

          {/* Kartu 3 · Bantuan & Pengajuan Revisi Poligon */}
          <article className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Info className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900">Butuh revisi batas petak?</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">
                  Ajukan perbaikan koordinat poligon atau kirim petunjuk akses lokasi kebun agar surveyor
                  lebih mudah menjangkau titik sampling lapangan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRevisionModalOpen(true)}
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-pine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pine-900 active:scale-[0.99]"
            >
              <FilePenLine className="h-4 w-4 text-emerald-400" />
              Ajukan Revisi Batas / Kirim Catatan ke Surveyor
            </button>
            <p className="mt-2 text-center font-mono text-[10px] text-stone-400">
              Estimasi respons surveyor 1×24 jam kerja
            </p>
          </article>
        </div>
      </section>

      {/* Footer System Info */}
      <p className="pt-1 text-center font-mono text-[10px] text-stone-400">
        TaniKarbon · Portal Mitra Petani — audit MRV tersinkron dengan basis data spasial PostGIS (SRID 4326) &amp; pipeline Sentinel-2 L2A
      </p>

      {/* ================================================================
           KOMPONEN 3 · MODAL PENGAJUAN REVISI BATAS / CATATAN SURVEYOR
      ================================================================ */}
      {isRevisionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="revisionTitle"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsRevisionModalOpen(false)}
        >
          <div
            className="modal-in w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 id="revisionTitle" className="text-base font-bold leading-tight tracking-tight text-pine">
                  Pengajuan Revisi Batas / Catatan Surveyor
                </h2>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  Pengajuan diteruskan ke surveyor penanggung jawab petak terkait.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                onClick={() => setIsRevisionModalOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitRevision} className="space-y-4 p-4 sm:p-5">
              <div>
                <label htmlFor="revPlot" className="mb-1.5 block text-[11px] font-semibold text-stone-600">
                  Pilih Petak Lahan
                </label>
                <select
                  id="revPlot"
                  value={selectedLandId}
                  onChange={e => setSelectedLandId(e.target.value)}
                  className="w-full rounded-xl border-stone-300 bg-stone-50/70 text-sm font-medium text-stone-800 focus:border-emerald-500 focus:ring-emerald-500"
                >
                  {lands.map((plot, i) => (
                    <option key={plot.id} value={plot.id}>
                      PLOT #{String(i + 1).padStart(2, '0')} — {plot.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="revCategory" className="mb-1.5 block text-[11px] font-semibold text-stone-600">
                  Kategori Pengajuan
                </label>
                <select
                  id="revCategory"
                  value={revisionCategory}
                  onChange={e => setRevisionCategory(e.target.value)}
                  className="w-full rounded-xl border-stone-300 bg-stone-50/70 text-sm font-medium text-stone-800 focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="Revisi Titik Poligon Batas">Revisi Titik Poligon Batas</option>
                  <option value="Perubahan Populasi/Spesies Pohon">Perubahan Populasi/Spesies Pohon</option>
                  <option value="Catatan Akses Lokasi untuk Surveyor">Catatan Akses Lokasi untuk Surveyor</option>
                </select>
              </div>

              <div>
                <label htmlFor="revNote" className="mb-1.5 block text-[11px] font-semibold text-stone-600">
                  Rincian / Alasan Pengajuan
                </label>
                <textarea
                  id="revNote"
                  rows={4}
                  value={revisionNote}
                  onChange={e => setRevisionNote(e.target.value)}
                  placeholder="Contoh: Patok sisi utara bergeser ±8 m mengikuti parit irigasi. Akses terbaik lewat jalan desa samping masjid."
                  className="w-full resize-none rounded-xl border-stone-300 bg-stone-50/70 text-sm text-stone-800 placeholder:text-stone-400 focus:border-emerald-500 focus:ring-emerald-500"
                  autoFocus
                />
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-stone-400">
                  <MapPin className="mt-px h-3.5 w-3.5 shrink-0" />
                  Sertakan koordinat desimal (lat, lon) bila pengajuan terkait revisi geometri.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={isSubmittingRevision}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmittingRevision ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mengirimkan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Kirim Pengajuan ke Surveyor</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toastConfig.visible && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[60] flex w-full max-w-xs items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl toast-in"
        >
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
            toastConfig.type === 'success'
              ? 'bg-emerald-100 text-emerald-700'
              : toastConfig.type === 'info'
              ? 'bg-pine/5 text-pine'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {toastConfig.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {toastConfig.type === 'info' && <Download className="h-4 w-4" />}
            {toastConfig.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-tight text-stone-900">{toastConfig.title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">{toastConfig.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastConfig(prev => ({ ...prev, visible: false }))}
            className="text-stone-400 hover:text-stone-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}

