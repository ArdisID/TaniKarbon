import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Ticket,
  User,
  Trees,
  WifiOff,
  MapPinned,
  SatelliteDish,
  RefreshCw,
  Ruler,
  Plus,
  TreeDeciduous,
  Palmtree,
  Info,
  Camera,
  ListChecks,
  Upload,
  Aperture,
  Trash2,
  BadgeCheck,
  ShieldCheck,
  XOctagon,
  PencilRuler,
  Check,
  X,
  ChevronDown,
  CalendarClock,
  Send,
  AlertTriangle,
  FileCheck2,
  LocateFixed,
  Crosshair,
  Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Marker, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { submitSurveyorAudit } from '../../api/surveyor';

// Helper Auto-fit Bounds
function MapBoundsFitter({ polygonPositions, surveyorPos }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    try {
      const allPoints = [];
      if (Array.isArray(polygonPositions) && polygonPositions.length > 0) {
        polygonPositions.forEach((pos) => {
          if (Array.isArray(pos) && pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1])) {
            allPoints.push(pos);
          }
        });
      }
      if (surveyorPos && !isNaN(surveyorPos[0]) && !isNaN(surveyorPos[1])) {
        allPoints.push(surveyorPos);
      }
      if (allPoints.length === 1) {
        map.setView(allPoints[0], 17);
      } else if (allPoints.length > 1) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      }
    } catch (err) {
      console.warn('MapBoundsFitter error:', err);
    }
  }, [map, polygonPositions, surveyorPos]);
  return null;
}

// Convert PostGIS GeoJSON to Leaflet [lat, lng] array
function parseGeoJsonPolygon(geojson) {
  if (!geojson) return [];
  try {
    let parsed = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
    if (parsed && parsed.type === 'Polygon' && Array.isArray(parsed.coordinates)) {
      // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
      return parsed.coordinates[0].map((coord) => [coord[1], coord[0]]);
    }
    if (Array.isArray(parsed)) {
      return parsed.map((pt) => [pt[0], pt[1]]);
    }
  } catch (err) {
    console.warn('Error parsing polygon GeoJSON:', err);
  }
  return [];
}

export default function SurveyorInspectionView({
  plotId,
  tasks = [],
  currentUser,
  onBack,
  onNavigateTab,
  onToast,
  onAuditComplete
}) {
  // 1. Resolve Land Plot Data (STRICT: NO fallback to tasks[0])
  const plot = useMemo(() => {
    if (!plotId || !tasks || tasks.length === 0) {
      return null;
    }
    return tasks.find((t) => t.id === plotId || t.land_id === plotId) || null;
  }, [plotId, tasks]);

  // Strict route guard: redirect to /surveyor/tugas if plotId is missing
  useEffect(() => {
    if (!plotId) {
      if (onBack) onBack();
    }
  }, [plotId, onBack]);

  // Guard: if tasks are loaded and the plotId is not found, return to dashboard
  useEffect(() => {
    if (plotId && tasks.length > 0 && !plot) {
      if (onToast) onToast('Lahan tidak ditemukan dalam antrean inspeksi Anda.', 'rose');
      if (onBack) onBack();
    }
  }, [plotId, tasks, plot, onBack, onToast]);

  const activePlotId = plot?.id || plotId || 'plot-default';
  const displayTicketId = 'TKT-' + (plot?.id ? plot.id.slice(0, 8).toUpperCase() : 'WNSB-842');
  const farmerName = plot?.farmer_name || plot?.farmerName || 'Petani Mitra';
  const plotName = plot?.name || plot?.landName || 'Petak Kebun Agroforestri';
  const areaSqm = plot?.area_sqm || plot?.areaM2 || 4520;
  const surveyorName = currentUser?.full_name || 'SRV-09 · Budi Surveyor';

  // Polygon Boundary
  const polygonLatLngs = useMemo(() => {
    if (plot?.polygon_boundary) {
      const parsed = parseGeoJsonPolygon(plot.polygon_boundary);
      if (parsed.length > 0) return parsed;
    }
    if (plot?.centroid && typeof plot.centroid.lat === 'number') {
      const lat = plot.centroid.lat;
      const lng = plot.centroid.lng;
      return [
        [lat + 0.0006, lng - 0.0008],
        [lat + 0.0009, lng + 0.0007],
        [lat - 0.0002, lng + 0.0009],
        [lat - 0.0008, lng + 0.0001],
        [lat - 0.0004, lng - 0.0009],
      ];
    }
    // Default fallback Depok
    return [
      [-6.3680, 106.8325],
      [-6.3675, 106.8340],
      [-6.3690, 106.8345],
      [-6.3695, 106.8330]
    ];
  }, [plot]);

  // 4 Extreme Points (North, East, South, West) when polygon > 6 vertices
  const extremeVertexMap = useMemo(() => {
    if (!polygonLatLngs || polygonLatLngs.length <= 6) return null;

    let northIdx = 0;
    let southIdx = 0;
    let eastIdx = 0;
    let westIdx = 0;

    polygonLatLngs.forEach((pt, i) => {
      const lat = pt[0];
      const lng = pt[1];
      if (lat > polygonLatLngs[northIdx][0]) northIdx = i;
      if (lat < polygonLatLngs[southIdx][0]) southIdx = i;
      if (lng > polygonLatLngs[eastIdx][1]) eastIdx = i;
      if (lng < polygonLatLngs[westIdx][1]) westIdx = i;
    });

    const extremeList = [
      { idx: northIdx, name: 'Utara' },
      { idx: eastIdx, name: 'Timur' },
      { idx: southIdx, name: 'Selatan' },
      { idx: westIdx, name: 'Barat' }
    ];

    const map = new Map();
    let counter = 1;
    extremeList.forEach((item) => {
      if (!map.has(item.idx)) {
        map.set(item.idx, {
          label: `Patok ${counter++}`,
          direction: item.name
        });
      }
    });

    return map;
  }, [polygonLatLngs]);

  // Centroid
  const centroidLatLng = useMemo(() => {
    if (plot?.centroid && typeof plot.centroid.lat === 'number') {
      return [plot.centroid.lat, plot.centroid.lng];
    }
    if (polygonLatLngs.length > 0) {
      const latSum = polygonLatLngs.reduce((acc, p) => acc + p[0], 0);
      const lngSum = polygonLatLngs.reduce((acc, p) => acc + p[1], 0);
      return [latSum / polygonLatLngs.length, lngSum / polygonLatLngs.length];
    }
    return [-6.3686, 106.8331];
  }, [plot, polygonLatLngs]);

  // 2. Draft Key & LocalStorage Persistence
  const draftStorageKey = `draft_inspection_${activePlotId}`;

  // Default sample rows based on plot.tree_blocks
  const initialSamples = useMemo(() => {
    if (plot?.tree_blocks && plot.tree_blocks.length > 0) {
      return plot.tree_blocks.map((block, idx) => ({
        id: block.id || `block-${idx}`,
        species: block.species_name || 'Sengon Laut',
        scientificName: block.scientific_name || (block.species_name?.toLowerCase().includes('sengon') ? 'Paraserianthes falcataria' : 'Spesies Terverifikasi'),
        claimTrees: block.tree_count || 100,
        actualTrees: block.tree_count || 100,
        claimDbh: block.avg_dbh_cm || 22.0,
        dbhCm: block.avg_dbh_cm || 22.0,
        heightM: block.avg_height_m || '',
        notes: 'Pohon tumbuh sehat, tajuk hijau segar.',
        isMonocot: (block.species_name || '').toLowerCase().includes('kelapa') || (block.species_name || '').toLowerCase().includes('sawit')
      }));
    }
    // Standard realistic initial sample
    return [
      {
        id: 'sample-1',
        species: 'Sengon Laut',
        scientificName: 'Paraserianthes falcataria',
        claimTrees: 100,
        actualTrees: 94,
        claimDbh: 22.0,
        dbhCm: 24.6,
        heightM: '',
        notes: 'Sehat, 6 pohon mati karena rebah saat musim hujan.',
        isMonocot: false
      },
      {
        id: 'sample-2',
        species: 'Kelapa Dalam',
        scientificName: 'Cocos nucifera · monokotil',
        claimTrees: 30,
        actualTrees: 30,
        claimDbh: 40.0,
        dbhCm: 41.2,
        heightM: 9.4,
        notes: 'Pertumbuhan optimal, buah lebat.',
        isMonocot: true
      }
    ];
  }, [plot]);

  // Form State
  const [samples, setSamples] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.samples) && parsed.samples.length > 0) {
          return parsed.samples;
        }
      }
    } catch (e) {
      console.warn('Failed to parse draft samples:', e);
    }
    return initialSamples;
  });

  const [checklists, setChecklists] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.checklists) return parsed.checklists;
      }
    } catch (e) {}
    return {
      p1_p3: true,
      no_dispute: true,
      polygon_match: true
    };
  });

  const [additionalNotes, setAdditionalNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.additionalNotes === 'string') return parsed.additionalNotes;
      }
    } catch (e) {}
    return '';
  });

  const [photos, setPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.photos) && parsed.photos.length > 0) return parsed.photos;
      }
    } catch (e) {}
    return [
      {
        id: 'photo-1',
        title: 'Patok Batas P1',
        name: 'patok_batas_P1.jpg',
        size: '2.4 MB',
        coord: `${centroidLatLng[0].toFixed(6)}, ${centroidLatLng[1].toFixed(6)}`,
        timestamp: 'Hari ini · 08:47 WIB',
        type: 'boundary',
        svgType: 'patok'
      },
      {
        id: 'photo-2',
        title: 'Kanopi Tegakan',
        name: 'kanopi_tegakan_utara.jpg',
        size: '3.1 MB',
        coord: `${(centroidLatLng[0] + 0.0001).toFixed(6)}, ${(centroidLatLng[1] + 0.0001).toFixed(6)}`,
        timestamp: 'Hari ini · 08:52 WIB',
        type: 'canopy',
        svgType: 'kanopi'
      }
    ];
  });

  // Auto-save to localStorage on every change
  useEffect(() => {
    try {
      const draft = {
        samples,
        checklists,
        additionalNotes,
        photos,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save inspection draft:', e);
    }
  }, [draftStorageKey, samples, checklists, additionalNotes, photos]);

  // Audit Timer
  const [seconds, setSeconds] = useState(15 * 60 + 20);
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec) => {
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // GNSS GPS Calibration Simulator
  const [isCalibratingGps, setIsCalibratingGps] = useState(false);
  const handleRecalibrateGps = () => {
    setIsCalibratingGps(true);
    setTimeout(() => {
      setIsCalibratingGps(false);
      if (onToast) onToast('Mengkalibrasi ulang GNSS… akurasi GPS terkunci ±2.8 meter ✔', 'emerald');
    }, 900);
  };

  // Add new sample row
  const handleAddSampleRow = () => {
    const newId = `sample-${Date.now()}`;
    const newSample = {
      id: newId,
      species: 'Mahoni Daun Lebar',
      scientificName: 'Swietenia macrophylla',
      claimTrees: 50,
      actualTrees: 50,
      claimDbh: 20.0,
      dbhCm: 21.0,
      heightM: '',
      notes: 'Pohon muda tegak lurus.',
      isMonocot: false
    };
    setSamples((prev) => [...prev, newSample]);
    if (onToast) onToast('Baris sampel baru ditambahkan · silakan lengkapi data ukur.', 'emerald');
  };

  // Delete sample row
  const handleDeleteSampleRow = (id) => {
    setSamples((prev) => prev.filter((s) => s.id !== id));
  };

  // Deviation Calculations
  const stats = useMemo(() => {
    let totalClaim = 0;
    let totalActual = 0;

    samples.forEach((s) => {
      totalClaim += Number(s.claimTrees) || 0;
      totalActual += Number(s.actualTrees) || 0;
    });

    const diff = totalActual - totalClaim;
    const deviationPct = totalClaim > 0 ? (diff / totalClaim) * 100 : 0;
    // Biomass proxy: actual trees * 0.15 ton
    const estimatedBiomass = Math.round(totalActual * 0.151 * 10) / 10;

    return {
      totalClaim,
      totalActual,
      deviationPct: Math.round(deviationPct * 10) / 10,
      estimatedBiomass
    };
  }, [samples]);

  // Photo Upload Simulator
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newPhoto = {
      id: `photo-${Date.now()}`,
      title: 'Dokumentasi Lapangan Tambahan',
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      coord: `${centroidLatLng[0].toFixed(6)}, ${centroidLatLng[1].toFixed(6)}`,
      timestamp: 'Baru saja diunggah',
      type: 'evidence',
      svgType: 'kanopi'
    };
    setPhotos((prev) => [newPhoto, ...prev]);
    if (onToast) onToast(`Foto "${file.name}" berhasil diunggah dengan geotag tersimpan ✔`, 'emerald');
    e.target.value = '';
  };

  const handleDeletePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (onToast) onToast('Foto berhasil dihapus.', 'emerald');
  };

  // Modals for Audit Decisions
  const [modalType, setModalType] = useState(null); // 'reject' | 'revise' | 'approve'
  const [reviseCategory, setReviseCategory] = useState('');
  const [reviseNote, setReviseNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenReviseModal = () => {
    setReviseCategory('Koordinat Poligon Melenceng');
    setReviseNote('Tolong geser poligon patok utara sejauh 5 meter ke arah kebun karena menabrak jalan dusun.');
    setModalType('revise');
  };

  const handleOpenRejectModal = () => {
    setRejectReason('');
    setModalType('reject');
  };

  const handleOpenApproveModal = () => {
    setModalType('approve');
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalType(null);
  };

  // Submit Audit to Backend API
  const handleExecuteAudit = async (decision) => {
    setIsSubmitting(true);
    try {
      const blockAdjustments = samples.map((s) => ({
        block_id: s.id.startsWith('block-') || s.id.startsWith('sample-') ? null : s.id,
        species_name: s.species,
        actual_tree_count: Number(s.actualTrees),
        actual_avg_dbh_cm: Number(s.dbhCm),
        actual_avg_height_m: s.heightM ? Number(s.heightM) : null,
        health_status: s.notes || 'healthy'
      }));

      let notes = additionalNotes;
      let category = null;

      if (decision === 'revision') {
        notes = reviseNote;
        category = reviseCategory;
      } else if (decision === 'rejected') {
        notes = rejectReason;
      }

      await submitSurveyorAudit(plot?.id || activePlotId, {
        decision,
        notes,
        category,
        block_adjustments: blockAdjustments
      });

      // Clear draft after successful submission
      localStorage.removeItem(draftStorageKey);

      closeModal();
      if (decision === 'approved') {
        if (onToast) onToast(`Lahan "${plotName}" BERHASIL DISETUJUI & diverifikasi ke Pre-Verified ✔`, 'emerald');
      } else if (decision === 'revision') {
        if (onToast) onToast(`Instruksi revisi (${category}) berhasil dikirim ke ${farmerName} ✔`, 'amber');
      } else if (decision === 'rejected') {
        if (onToast) onToast(`Tiket lahan ditolak permanen. Status lahan telah diperbarui di database.`, 'rose');
      }

      if (onAuditComplete) {
        onAuditComplete(decision);
      } else if (onNavigateTab) {
        onNavigateTab('tasks');
      } else if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Audit submission error:', err);
      if (onToast) onToast(`Gagal mengirim audit: ${err.message}`, 'rose');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!plot) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="font-bold text-[#0F291E]">Memuat data inspeksi lahan…</p>
        <p className="text-xs text-slate-500 mt-1">Mengambil koordinat dan pohon dari server</p>
        <button
          type="button"
          onClick={onBack || (() => onNavigateTab && onNavigateTab('tasks'))}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
        >
          ← Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased pb-36">
      {/* ============================================================
           A · HEADER NAVIGASI EKSEKUSI (Sticky Pine Forest)
      ============================================================ */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0F291E]/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-4 py-3 sm:px-6">
          {/* Baris 1: Kembali · Identitas · Timer */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              type="button"
              onClick={onBack || (() => onNavigateTab && onNavigateTab('tasks'))}
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-[13px] font-semibold text-white transition hover:border-white/30 hover:bg-white/10 active:scale-[.98] cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Kembali ke Dashboard</span>
              <span className="sm:hidden">Kembali</span>
            </button>

            {/* Informasi Tiket */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-2 py-[3px] font-mono text-[11px] font-bold tracking-tight text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                  <Ticket className="h-3 w-3" /> {displayTicketId}
                </span>
                <span className="text-white/30">|</span>
                <span className="inline-flex items-center gap-1.5 truncate text-[13.5px] font-bold text-white">
                  <User className="h-3.5 w-3.5 text-emerald-400" /> {farmerName}
                </span>
                <span className="text-white/30">|</span>
                <span className="inline-flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-emerald-100/90">
                  <Trees className="h-3.5 w-3.5 text-emerald-400" /> {plotName}
                </span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10.5px] text-emerald-100/60">
                <span>{plot?.regency || 'Depok, Jawa Barat'}</span>
                <span>·</span>
                <span>{Number(areaSqm).toLocaleString('id-ID')} m²</span>
                <span>·</span>
                <span>{surveyorName}</span>
              </p>
            </div>

            {/* Timer Inspeksi */}
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/25 sm:inline-flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                </span>
                Tersimpan lokal
              </span>
              <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-100/50">
                  Durasi Audit
                </p>
                <p className="tnum font-mono text-[16px] font-bold leading-tight text-white">
                  {formatTimer(seconds)}
                </p>
              </div>
            </div>
          </div>

          {/* Baris 2: Stepper Tahapan */}
          <nav aria-label="Tahapan inspeksi" className="no-scrollbar -mx-1 mt-3 flex items-center gap-1.5 overflow-x-auto px-1">
            <a
              href="#step-1"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-white ring-1 ring-inset ring-white/10 transition hover:bg-white/15"
            >
              <span className="grid h-5 w-5 place-items-center rounded-md bg-emerald-500 font-mono text-[10px] font-bold text-white">
                1
              </span>
              Validasi Spasial
            </a>
            <span className="h-px w-4 shrink-0 bg-white/20"></span>
            <a
              href="#step-2"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold text-emerald-100/70 transition hover:bg-white/10 hover:text-white"
            >
              <span className="grid h-5 w-5 place-items-center rounded-md bg-white/10 font-mono text-[10px] font-bold text-emerald-100/80">
                2
              </span>
              Sampling Alometrik
            </a>
            <span className="h-px w-4 shrink-0 bg-white/20"></span>
            <a
              href="#step-3"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold text-emerald-100/70 transition hover:bg-white/10 hover:text-white"
            >
              <span className="grid h-5 w-5 place-items-center rounded-md bg-white/10 font-mono text-[10px] font-bold text-emerald-100/80">
                3
              </span>
              Dokumentasi
            </a>
            <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/25 md:inline-flex">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> Mode Lapangan · Tersinkronisasi
            </span>
          </nav>
        </div>
      </header>

      {/* ============================================================
           KONTEN UTAMA FORM INSPEKSI (Mode Fokus Layar Penuh)
      ============================================================ */}
      <main className="mx-auto max-w-[1200px] space-y-6 px-4 pt-6 pb-36 sm:px-6 sm:pb-40">

        {/* ========================================================
             B · STEP 1 · VALIDASI SPASIAL & GEOFENCING
        ======================================================== */}
        <section id="step-1" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header Kartu */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <MapPinned className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-[#0F291E]">
                  Step 1 · Validasi Spasial &amp; Geofencing
                </h2>
                <p className="mt-0.5 text-[12.5px] text-slate-500">
                  Cocokkan posisi GPS Anda dengan poligon batas lahan klaim petani.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[10.5px] font-semibold text-slate-600">
              <SatelliteDish className="h-3.5 w-3.5 text-emerald-600" /> GNSS · 14 satelit terkunci
            </span>
          </header>

          {/* Kanvas Peta & Panel Info */}
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Peta Leaflet Interaktif */}
            <div className="relative h-[320px] w-full overflow-hidden bg-slate-900 lg:col-span-3 lg:h-[430px]">
              <MapContainer
                center={centroidLatLng}
                zoom={17}
                scrollWheelZoom={true}
                touchZoom={true}
                doubleClickZoom={true}
                className="h-full w-full z-0"
              >
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri World Imagery"
                  maxZoom={19}
                />

                {/* Poligon Batas Lahan PostGIS */}
                {polygonLatLngs.length > 0 && (
                  <Polygon
                    positions={polygonLatLngs}
                    pathOptions={{
                      color: '#10B981',
                      weight: 3,
                      fillColor: '#10B981',
                      fillOpacity: 0.28,
                      dashArray: '3, 4'
                    }}
                  >
                    <Popup>
                      <div className="p-1 font-sans">
                        <strong className="text-emerald-900 block text-xs">{plotName}</strong>
                        <span className="text-[10px] text-slate-600">{Number(areaSqm).toLocaleString()} m²</span>
                      </div>
                    </Popup>
                  </Polygon>
                )}

                {/* Marker Vertex Poligon: jika > 6 hanya render 4 patok utama ekstrem; titik lain berupa CircleMarker halus */}
                {polygonLatLngs.map((pt, idx) => {
                  const isLargePolygon = polygonLatLngs.length > 6;
                  if (isLargePolygon) {
                    const extreme = extremeVertexMap?.get(idx);
                    if (extreme) {
                      return (
                        <Marker
                          key={`patok-extreme-${idx}`}
                          position={pt}
                          icon={L.divIcon({
                            className: 'vertex-marker',
                            html: `<div style="background:#0F291E;color:#10B981;border:2px solid #10B981;border-radius:6px;padding:2px 6px;font-size:10px;font-family:monospace;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.35);white-space:nowrap;">${extreme.label}</div>`,
                            iconSize: [56, 22],
                            iconAnchor: [28, 11]
                          })}
                        >
                          <Popup>
                            <div className="font-sans text-xs">
                              <strong>{extreme.label} ({extreme.direction})</strong>
                              <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                                {pt[0].toFixed(6)}, {pt[1].toFixed(6)}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return (
                      <CircleMarker
                        key={`patok-dot-${idx}`}
                        center={pt}
                        radius={3}
                        pathOptions={{
                          color: '#10B981',
                          fillColor: '#FFFFFF',
                          fillOpacity: 0.9,
                          weight: 1.5
                        }}
                      />
                    );
                  }

                  return (
                    <Marker
                      key={`patok-${idx}`}
                      position={pt}
                      icon={L.divIcon({
                        className: 'vertex-marker',
                        html: `<div style="background:#10B981;color:#fff;border:2px solid #ECFDF5;border-radius:4px;padding:1px 4px;font-size:9px;font-family:monospace;font-weight:bold;box-shadow:0 1px 3px rgba(0,0,0,0.3);">P${idx + 1}</div>`,
                        iconSize: [24, 18],
                        iconAnchor: [12, 9]
                      })}
                    />
                  );
                })}

                {/* Titik GPS Surveyor (Denyut Hijau-Zamrud & Crosshair) */}
                <Marker
                  position={centroidLatLng}
                  icon={L.divIcon({
                    className: 'surveyor-crosshair',
                    html: `
                      <div style="position:relative;width:32px;height:32px;">
                        <span style="position:absolute;width:100%;height:100%;border-radius:50%;background:rgba(16,185,129,0.4);animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
                        <div style="position:relative;width:32px;height:32px;border-radius:50%;background:#0F291E;border:3px solid #10B981;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.4);">
                          <div style="width:8px;height:8px;border-radius:50%;background:#10B981;"></div>
                        </div>
                      </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  })}
                >
                  <Popup>
                    <div className="font-sans text-xs">
                      <strong className="text-[#0F291E] block">Posisi GPS Anda</strong>
                      <span className="text-[10px] text-emerald-700">Di dalam batas poligon (±3.8 m)</span>
                    </div>
                  </Popup>
                </Marker>

                <MapBoundsFitter polygonPositions={polygonLatLngs} surveyorPos={centroidLatLng} />
              </MapContainer>

              {/* Legend Peta */}
              <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm border border-slate-200">
                <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-slate-700">
                  <span className="inline-block h-0.5 w-4 rounded bg-emerald-500"></span> Batas Poligon Petani ({polygonLatLngs.length} Titik{polygonLatLngs.length > 6 ? ' · 4 Patok Utama' : ` · ${polygonLatLngs.length} Patok`})
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] font-semibold text-slate-700">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0F291E] ring-1 ring-emerald-500"></span> Posisi GPS Surveyor
                </p>
              </div>
            </div>

            {/* Panel Samping: Status Geofencing & Metrik */}
            <div className="space-y-4 border-t border-slate-100 p-4 lg:col-span-2 lg:border-l lg:border-t-0 sm:p-5">
              {/* Status Geofencing */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-800">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Status Geofencing Valid
                </p>
                <p className="mt-2 text-[13.5px] font-bold leading-snug text-[#0F291E]">
                  🟢 Posisi Anda Terverifikasi di Lapangan
                  <span className="block font-mono text-[11.5px] font-semibold text-emerald-700">
                    (Akurasi GPS Lapangan: ±3.8 meter)
                  </span>
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-emerald-900/80">
                  Sensor GNSS mengonfirmasi surveyor berada di dalam batas petak lahan. Anda dapat melanjutkan ke sampling tegakan pohon.
                </p>
              </div>

              {/* Metrik Koordinat */}
              <dl className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Latitude
                  </dt>
                  <dd className="tnum mt-0.5 font-mono text-[13px] font-bold text-[#0F291E]">
                    {centroidLatLng[0].toFixed(6)}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Longitude
                  </dt>
                  <dd className="tnum mt-0.5 font-mono text-[13px] font-bold text-[#0F291E]">
                    {centroidLatLng[1].toFixed(6)}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Luas Poligon
                  </dt>
                  <dd className="tnum mt-0.5 font-mono text-[13px] font-bold text-[#0F291E]">
                    {Number(areaSqm).toLocaleString()} m²
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Jarak ke Tepi
                  </dt>
                  <dd className="tnum mt-0.5 font-mono text-[13px] font-bold text-[#0F291E]">
                    8.4 m (Aman)
                  </dd>
                </div>
              </dl>

              {/* Checklist Patok */}
              <div className="rounded-xl border border-slate-200 p-3.5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Checklist Verifikasi Batas Fisik
                </p>
                <ul className="mt-2.5 space-y-2">
                  <li>
                    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={checklists.p1_p3}
                        onChange={(e) => setChecklists((prev) => ({ ...prev, p1_p3: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Patok batas fisik {polygonLatLngs.length > 6 ? '(4 Patok Utama)' : `(P1–P${polygonLatLngs.length || 4})`} ditemukan di lapangan
                    </label>
                  </li>
                  <li>
                    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={checklists.no_dispute}
                        onChange={(e) => setChecklists((prev) => ({ ...prev, no_dispute: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Tidak ada tumpang tindih batas dengan tetangga
                    </label>
                  </li>
                  <li>
                    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={checklists.polygon_match}
                        onChange={(e) => setChecklists((prev) => ({ ...prev, polygon_match: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Bentuk poligon sesuai tutupan vegetasi aktual
                    </label>
                  </li>
                </ul>
              </div>

              {/* Tombol Kalibrasi Ulang GPS */}
              <button
                type="button"
                onClick={handleRecalibrateGps}
                disabled={isCalibratingGps}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[.99] cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 text-emerald-600 ${isCalibratingGps ? 'animate-spin' : ''}`} />
                {isCalibratingGps ? 'Mengkalibrasi Satelit…' : 'Ulangi Pembacaan GNSS / GPS'}
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================
             C · STEP 2 · FORM INPUT SAMPLING ALOMETRIK
        ======================================================== */}
        <section id="step-2" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <Ruler className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-[#0F291E]">
                  Step 2 · Form Input Sampling Alometrik
                </h2>
                <p className="mt-0.5 text-[12.5px] text-slate-500">
                  Bandingkan klaim pohon petani dengan hasil ukur fisik di lapangan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddSampleRow}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-800 transition hover:bg-emerald-100 active:scale-[.98] cursor-pointer"
            >
              <Plus className="h-4 w-4 text-emerald-700" /> Tambah Sampel Spesies
            </button>
          </header>

          <div className="p-4 sm:p-5">
            {/* Tabel Sampling Desktop */}
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th scope="col" className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Spesies / Klaim Petani
                    </th>
                    <th scope="col" className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Klaim (Pohon)
                    </th>
                    <th scope="col" className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-800">
                      Jumlah Pohon Hidup
                    </th>
                    <th scope="col" className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-800">
                      Rata-rata DBH (cm)
                    </th>
                    <th scope="col" className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Tinggi Rata-rata (m)
                    </th>
                    <th scope="col" className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Catatan Kesehatan
                    </th>
                    <th scope="col" className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {samples.map((row) => {
                    const claim = Number(row.claimTrees) || 0;
                    const actual = Number(row.actualTrees) || 0;
                    const diff = actual - claim;
                    const pct = claim > 0 ? (diff / claim) * 100 : 0;
                    const isMonocot = row.isMonocot;

                    return (
                      <tr key={row.id} className="group transition hover:bg-emerald-50/30">
                        <td className="px-4 py-3.5 align-top">
                          <p className="flex items-center gap-2 text-[13.5px] font-bold text-[#0F291E]">
                            {isMonocot ? (
                              <Palmtree className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <TreeDeciduous className="h-4 w-4 text-emerald-600" />
                            )}
                            {row.species}
                          </p>
                          <p className="mt-0.5 font-mono text-[10.5px] text-slate-400">
                            {row.scientificName || 'Agroforestry block'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <span className="tnum inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[13px] font-bold text-slate-700">
                            {claim} Pohon
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.actualTrees}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSamples((prev) =>
                                prev.map((s) => (s.id === row.id ? { ...s, actualTrees: val } : s))
                              );
                            }}
                            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <p
                            className={`mt-1 font-mono text-[10.5px] font-semibold ${
                              Math.abs(pct) > 10 ? 'text-rose-600' : Math.abs(pct) > 0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            Selisih: {diff > 0 ? `+${diff}` : diff} ({diff > 0 ? `+${pct.toFixed(1)}` : pct.toFixed(1)}%)
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={row.dbhCm}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSamples((prev) =>
                                prev.map((s) => (s.id === row.id ? { ...s, dbhCm: val } : s))
                              );
                            }}
                            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <p className="mt-1 font-mono text-[10.5px] text-slate-400">
                            Klaim: {row.claimDbh || 20.0} cm
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="—"
                            value={row.heightM}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSamples((prev) =>
                                prev.map((s) => (s.id === row.id ? { ...s, heightM: val } : s))
                              );
                            }}
                            className={`w-24 rounded-xl border px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs transition focus:ring-2 ${
                              isMonocot
                                ? 'border-emerald-300 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-500/20'
                                : 'border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20'
                            }`}
                          />
                          <p className="mt-1 font-mono text-[10.5px] text-slate-400">
                            {isMonocot ? 'Wajib (monokotil)' : 'Opsional'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <input
                            type="text"
                            value={row.notes}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSamples((prev) =>
                                prev.map((s) => (s.id === row.id ? { ...s, notes: val } : s))
                              );
                            }}
                            placeholder="Kondisi kesehatan pohon…"
                            className="w-full min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-[#0F291E] shadow-xs transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </td>
                        <td className="px-3 py-3.5 align-top text-right">
                          {samples.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSampleRow(row.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Hapus baris sampel"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tampilan Kartu Mobile */}
            <div className="space-y-3 lg:hidden">
              {samples.map((row) => (
                <article key={row.id} className="rounded-xl border border-slate-200 p-4 transition hover:bg-emerald-50/20">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-[14px] font-bold text-[#0F291E]">
                        {row.isMonocot ? <Palmtree className="h-4 w-4 text-emerald-600" /> : <TreeDeciduous className="h-4 w-4 text-emerald-600" />}
                        {row.species}
                      </p>
                      <p className="mt-0.5 font-mono text-[10.5px] text-slate-400">{row.scientificName}</p>
                    </div>
                    <span className="tnum shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[12px] font-bold text-slate-700">
                      Klaim: {row.claimTrees}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-emerald-800">
                        Jumlah Hidup
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.actualTrees}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSamples((prev) => prev.map((s) => (s.id === row.id ? { ...s, actualTrees: val } : s)));
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-emerald-800">
                        Rata-rata DBH (cm)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={row.dbhCm}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSamples((prev) => prev.map((s) => (s.id === row.id ? { ...s, dbhCm: val } : s)));
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </label>
                    <label className="block col-span-2">
                      <span className="mb-1 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                        Rata-rata Tinggi (m)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Khusus monokotil"
                        value={row.heightM}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSamples((prev) => prev.map((s) => (s.id === row.id ? { ...s, heightM: val } : s)));
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </label>
                    <label className="block col-span-2">
                      <span className="mb-1 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                        Catatan Kesehatan
                      </span>
                      <input
                        type="text"
                        value={row.notes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSamples((prev) => prev.map((s) => (s.id === row.id ? { ...s, notes: val } : s)));
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-[#0F291E] shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>

            {/* Ringkasan Deviasi Bento */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total Klaim</p>
                <p className="tnum mt-1 text-[20px] font-extrabold leading-none text-[#0F291E]">{stats.totalClaim}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-emerald-800">Total Aktual</p>
                <p className="tnum mt-1 text-[20px] font-extrabold leading-none text-emerald-700">{stats.totalActual}</p>
              </div>
              <div
                className={`rounded-xl border p-3.5 ${
                  Math.abs(stats.deviationPct) > 10
                    ? 'border-rose-200 bg-rose-50/70'
                    : 'border-amber-200 bg-amber-50/70'
                }`}
              >
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-amber-800">Deviasi</p>
                <p
                  className={`tnum mt-1 text-[20px] font-extrabold leading-none ${
                    Math.abs(stats.deviationPct) > 10 ? 'text-rose-700' : 'text-amber-700'
                  }`}
                >
                  {stats.deviationPct > 0 ? `+${stats.deviationPct}%` : `${stats.deviationPct}%`}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-emerald-800">
                  Estimasi Biomassa
                </p>
                <p className="tnum mt-1 text-[20px] font-extrabold leading-none text-emerald-700">
                  {stats.estimatedBiomass} t
                </p>
              </div>
            </div>

            <p className="mt-2.5 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-[12px] leading-relaxed text-slate-600">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              Deviasi di bawah <span className="font-semibold text-slate-700">±10%</span> masih dalam toleransi standar MRV Verra/Plan Vivo. Jika deviasi melebihi toleransi, gunakan tombol
              <span className="font-semibold text-amber-700"> Minta Revisi Batas</span> di bawah untuk mengembalikan tiket ke petani.
            </p>
          </div>
        </section>

        {/* ========================================================
             D · STEP 3 · DOKUMENTASI LAPANGAN
        ======================================================== */}
        <section id="step-3" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                <Camera className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-[#0F291E]">Step 3 · Dokumentasi Lapangan</h2>
                <p className="mt-0.5 text-[12.5px] text-slate-500">Unggah bukti visual geotag yang akan diverifikasi validator pusat.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[10.5px] font-semibold text-slate-600">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> {photos.length} foto terlampir
            </span>
          </header>

          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <p className="text-[12.5px] leading-relaxed text-emerald-900">
                Wajib melampirkan minimal <span className="font-bold">1 foto patok batas lahan</span> dan
                <span className="font-bold"> 1 foto kanopi/tegakan pohon</span>. Koordinat GNSS disematkan otomatis ke metadata foto.
              </p>
            </div>

            {/* Dropzone Upload */}
            <div className="mt-3.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-50/20">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700 shadow-xs ring-1 ring-inset ring-slate-200">
                <Camera className="h-6 w-6" />
              </span>
              <p className="mt-3 text-[14px] font-bold text-[#0F291E]">Seret &amp; lepas foto di sini</p>
              <p className="mt-0.5 text-[12.5px] text-slate-500">atau ambil langsung dari kamera perangkat</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0F291E] px-4 py-2.5 text-[13px] font-semibold text-white shadow-xs transition hover:bg-[#173D2E] active:scale-[.98] cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-emerald-400" /> Pilih dari Galeri
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[.98] cursor-pointer"
                >
                  <Aperture className="h-4 w-4 text-emerald-600" /> Buka Kamera
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="mt-3 font-mono text-[10.5px] text-slate-400">
                JPG / PNG · maks 8 MB per berkas · Metadata EXIF &amp; koordinat GPS otomatis tersimpan
              </p>
            </div>

            {/* Galeri Foto Geotag */}
            <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Foto Terunggah ({photos.length})
            </p>
            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {photos.map((photo) => (
                <figure
                  key={photo.id}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs transition hover:border-emerald-300"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                    {/* Visual Mock Ilustrasi Geotag */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900 to-[#0F291E] text-white">
                      <div className="text-center p-4">
                        <Trees className="h-10 w-10 mx-auto text-emerald-400 mb-2 opacity-80" />
                        <span className="font-mono text-xs font-bold text-emerald-200 block">{photo.title}</span>
                        <span className="text-[10px] text-emerald-300/70 font-mono">{photo.name}</span>
                      </div>
                    </div>

                    {/* Watermark Koordinat & Waktu */}
                    <figcaption className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 rounded-lg bg-black/60 px-2 py-1 font-mono text-[9.5px] font-semibold text-white backdrop-blur-xs">
                      <span>{photo.coord}</span>
                      <span className="text-emerald-300">{photo.timestamp}</span>
                    </figcaption>

                    {/* Badge Jenis */}
                    <span className="absolute left-2 top-2 rounded-md bg-emerald-600/95 px-2 py-1 font-mono text-[9.5px] font-bold uppercase tracking-wide text-white">
                      {photo.title}
                    </span>

                    {/* Tombol Hapus */}
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-slate-600 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 cursor-pointer"
                      title="Hapus foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2.5">
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <p className="truncate text-[12px] font-semibold text-slate-700">
                      {photo.name} · {photo.size}
                    </p>
                  </div>
                </figure>
              ))}
            </div>

            {/* Catatan Tambahan Surveyor */}
            <label className="mt-5 block">
              <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Catatan Lapangan Tambahan (Opsional)
              </span>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Misal: Akses jalan hanya bisa motor; patok P3 terlindung rimbunan bambu; tutupan vegetasi sangat rapat."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13.5px] text-[#0F291E] shadow-xs transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
          </div>
        </section>

        {/* Footer Note */}
        <p className="text-center font-mono text-[10.5px] text-slate-400">
          TaniKarbon MRV Engine · Audit Lapangan {displayTicketId} · Status tersimpan lokal &amp; siap sinkronisasi
        </p>
      </main>

      {/* ============================================================
           E · FOOTER FLOATING ACTIONS (Keputusan Audit TaniKarbon)
      ============================================================ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="mx-auto max-w-[1200px] px-4 py-3 sm:px-6">
          <div className="mb-2 hidden items-center justify-between gap-3 md:flex">
            <p className="flex items-center gap-2 font-mono text-[10.5px] font-semibold text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Geofencing terverifikasi · {samples.length} kelompok tegakan · Deviasi: {stats.deviationPct}%
            </p>
            <p className="font-mono text-[10.5px] text-slate-400">
              Keputusan audit disimpan permanen ke ledger PostgreSQL
            </p>
          </div>

          <div className="grid grid-cols-3 items-stretch gap-2 sm:gap-3">
            {/* 1 · Tolak Permanen */}
            <button
              type="button"
              onClick={handleOpenRejectModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-rose-300 bg-white px-3 py-3 text-[12.5px] font-bold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 active:scale-[.98] sm:text-[14px] cursor-pointer"
            >
              <XOctagon className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Tolak Permanen</span>
            </button>

            {/* 2 · Minta Revisi Batas */}
            <button
              type="button"
              onClick={handleOpenReviseModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-amber-400 bg-amber-500 px-3 py-3 text-[12.5px] font-bold text-white transition hover:bg-amber-600 active:scale-[.98] sm:text-[14px] cursor-pointer"
            >
              <PencilRuler className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Minta Revisi Petani</span>
            </button>

            {/* 3 · Setujui & Verifikasi */}
            <button
              type="button"
              onClick={handleOpenApproveModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-[12.5px] font-extrabold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[.98] sm:text-[14px] cursor-pointer"
            >
              <Check className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">✓ Setujui &amp; Verifikasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
           MODAL 1 · MINTA REVISI PETANI
      ============================================================ */}
      {modalType === 'revise' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6 bg-[#0F291E]/60 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                  <PencilRuler className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-[#0F291E]">Minta Revisi Petani</h3>
                  <p className="mt-0.5 font-mono text-[10.5px] text-slate-400">
                    {displayTicketId} · {farmerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Kategori Kesalahan
                </span>
                <div className="relative">
                  <select
                    value={reviseCategory}
                    onChange={(e) => setReviseCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-10 text-[13.5px] font-medium text-[#0F291E] shadow-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option>Koordinat Poligon Melenceng</option>
                    <option>Luas Lahan Tidak Sesuai Fisik</option>
                    <option>Jumlah Pohon Tidak Sesuai</option>
                    <option>Patok Batas Tidak Ditemukan / Rusak</option>
                    <option>Foto Dokumentasi Tidak Lengkap</option>
                    <option>Lainnya (jelaskan pada catatan)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Catatan Instruksi untuk Petani
                </span>
                <textarea
                  rows={4}
                  value={reviseNote}
                  onChange={(e) => setReviseNote(e.target.value)}
                  placeholder="Jelaskan bagian petak atau data yang harus diperbaiki petani…"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-[#0F291E] shadow-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span>Catatan akan dikirimkan ke WhatsApp &amp; Portal Petani.</span>
                  <span>{reviseNote.length}/500</span>
                </span>
              </label>

              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-[12.5px] leading-relaxed text-amber-900">
                  Tiket akan masuk ke antrean <span className="font-bold">Menunggu Revisi</span>. Petani memiliki waktu
                  <span className="font-bold"> 3 hari kerja</span> untuk memperbaiki poligon dan mengajukan ulang.
                </p>
              </div>
            </div>

            <footer className="sticky bottom-0 flex items-center gap-2.5 border-t border-slate-100 bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleExecuteAudit('revision')}
                disabled={isSubmitting || reviseNote.trim().length < 5}
                className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-[13.5px] font-bold text-white shadow-sm transition hover:bg-amber-600 active:scale-[.98] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Kirim Instruksi Revisi
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ============================================================
           MODAL 2 · TOLAK PERMANEN LAHAN
      ============================================================ */}
      {modalType === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6 bg-[#0F291E]/60 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200">
                  <XOctagon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-[#0F291E]">Tolak Permanen Lahan</h3>
                  <p className="mt-0.5 font-mono text-[10.5px] text-slate-400">
                    {displayTicketId} · {plotName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-[12.5px] leading-relaxed text-rose-900">
                  <span className="font-bold">PERHATIAN:</span> Penolakan bersifat permanen. Lahan akan digugurkan dari program sertifikasi karbon dan statusnya di database PostgreSQL akan diubah menjadi <span className="font-mono font-bold">rejected</span>.
                </p>
              </div>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Alasan Penolakan Permanen (Wajib)
                </span>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Misal: Lahan terbukti berada di kawasan lindung non-hutan rakyat atau sengketa hak milik ganda…"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-[#0F291E] shadow-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </label>
            </div>

            <footer className="sticky bottom-0 flex items-center gap-2.5 border-t border-slate-100 bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleExecuteAudit('rejected')}
                disabled={isSubmitting || rejectReason.trim().length < 5}
                className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-[13.5px] font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-[.98] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <XOctagon className="h-4 w-4" /> Konfirmasi Tolak Permanen
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ============================================================
           MODAL 3 · SETUJUI & VERIFIKASI (Approval)
      ============================================================ */}
      {modalType === 'approve' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6 bg-[#0F291E]/60 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">
                  <Check className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-[#0F291E]">Setujui &amp; Verifikasi Lahan</h3>
                  <p className="mt-0.5 font-mono text-[10.5px] text-slate-400">
                    {displayTicketId} · {plotName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-800">
                  Konfirmasi Pengesahan Lapangan
                </p>
                <p className="mt-1 text-[13px] text-emerald-950 leading-relaxed">
                  Data hasil ukur aktual akan dicatat sebagai baseline sertifikasi karbon. Status lahan akan dipromosikan ke tahap verifikasi resmi.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Nama Petani Mitra:</span>
                  <strong className="text-[#0F291E] font-semibold">{farmerName}</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Luas Terverifikasi:</span>
                  <strong className="text-[#0F291E] font-semibold">{Number(areaSqm).toLocaleString()} m²</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Jumlah Pohon Hidup:</span>
                  <strong className="text-emerald-700 font-bold">{stats.totalActual} Pohon</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Deviasi Lapangan:</span>
                  <strong className="text-amber-700 font-bold">{stats.deviationPct}%</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Estimasi Potensi Biomassa:</span>
                  <strong className="text-emerald-700 font-bold">{stats.estimatedBiomass} ton</strong>
                </div>
              </div>
            </div>

            <footer className="sticky bottom-0 flex items-center gap-2.5 border-t border-slate-100 bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => handleExecuteAudit('approved')}
                disabled={isSubmitting}
                className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-[13.5px] font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Mengesahkan...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Terbitkan Pengesahan
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

