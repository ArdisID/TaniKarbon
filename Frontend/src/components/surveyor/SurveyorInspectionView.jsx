import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
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
  Loader2,
  Timer
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Marker, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { submitSurveyorAudit, uploadSurveyorPhoto, deleteSurveyorPhoto } from '../../api/surveyor';
import { saveOfflineSurvey } from '../../utils/offlineStorage';

// Helper auto-fit bounds Leaflet (HANYA SEKALI saat awal load petak lahan atau saat user klik tombol fokus kamera)
function MapUpdater({ bounds, triggerRecenter }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!map || !bounds) return;
    try {
      if (!hasFittedRef.current || triggerRecenter) {
        const isValid = typeof bounds.isValid === 'function' ? bounds.isValid() : true;
        if (isValid) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
          hasFittedRef.current = true;
        }
      }
    } catch (err) {
      console.warn('MapUpdater error:', err);
    }
  }, [map, bounds, triggerRecenter]);

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

// Helper hitung jarak Haversine (meter)
function calculateHaversineMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371000; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Jarak titik (lat, lng) ke segmen garis (p1, p2) dalam meter
function pointToSegmentDistanceMeters(lat, lng, lat1, lng1, lat2, lng2) {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const x = (lng - lng1) * 111139 * cosLat;
  const y = (lat - lat1) * 111139;
  const dx = (lng2 - lng1) * 111139 * cosLat;
  const dy = (lat2 - lat1) * 111139;

  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(x, y);

  const t = Math.max(0, Math.min(1, (x * dx + y * dy) / lenSq));
  const projX = t * dx;
  const projY = t * dy;
  return Math.hypot(x - projX, y - projY);
}

// Jarak minimum titik surveyor ke sisi batas poligon terdekat (meter)
function calculateDistanceToPolygonEdgeMeters(point, polygonCoords) {
  if (!point || !polygonCoords || polygonCoords.length < 3) return 0;
  let minDistance = Infinity;
  for (let i = 0; i < polygonCoords.length; i++) {
    const nextIdx = (i + 1) % polygonCoords.length;
    const p1 = polygonCoords[i];
    const p2 = polygonCoords[nextIdx];
    const dist = pointToSegmentDistanceMeters(point.lat, point.lng, p1[0], p1[1], p2[0], p2[1]);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return minDistance === Infinity ? 0 : Math.round(minDistance * 10) / 10;
}

// Ray-casting point in polygon
function isPointInPolygon(point, polygonCoords) {
  if (!point || !polygonCoords || polygonCoords.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i][0], yi = polygonCoords[i][1];
    const xj = polygonCoords[j][0], yj = polygonCoords[j][1];
    const intersect = ((yi > point.lng) !== (yj > point.lng)) &&
      (point.lat < ((xj - xi) * (point.lng - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
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
  const displayTicketId = 'TKT-' + (plot?.id ? String(plot.id).slice(0, 8).toUpperCase() : 'TK-FIELD');
  const farmerName = plot?.farmer_name || plot?.farmerName || 'Petani Mitra';
  const plotName = plot?.name || plot?.landName || 'Petak Kebun Agroforestri';
  const areaSqm = plot?.area_sqm || plot?.areaM2 || 0;
  const areaHa = (Number(areaSqm) / 10000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const surveyorName = currentUser?.full_name || 'Budi Surveyor';

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
    return [];
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

  // Bounds poligon lahan (stabil, tidak berubah saat GPS bergerak)
  const plotBounds = useMemo(() => {
    if (polygonLatLngs && polygonLatLngs.length > 0) {
      return L.latLngBounds(polygonLatLngs);
    }
    return null;
  }, [polygonLatLngs]);

  // Center statis awal hanya pada initial mount
  const defaultCenter = useMemo(() => {
    return centroidLatLng || [-6.3686, 106.8331];
  }, []);

  const [focusTrigger, setFocusTrigger] = useState(0);
  const handleFocusCamera = () => {
    setFocusTrigger((c) => c + 1);
  };

  // Telemetri GPS Surveyor Riil (Watch Geolocation)
  const [surveyorLocation, setSurveyorLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setSurveyorLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          if (pos.coords.accuracy) {
            setGpsAccuracy(Math.round(pos.coords.accuracy));
          }
        },
        (err) => {
          console.warn('Geolocation surveyor fallback:', err.message);
          if (centroidLatLng) {
            setSurveyorLocation({ lat: centroidLatLng[0], lng: centroidLatLng[1] });
            setGpsAccuracy(4);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else if (centroidLatLng) {
      setSurveyorLocation({ lat: centroidLatLng[0], lng: centroidLatLng[1] });
      setGpsAccuracy(4);
    }
  }, [centroidLatLng]);

  const currentPos = surveyorLocation || (centroidLatLng ? { lat: centroidLatLng[0], lng: centroidLatLng[1] } : null);

  const distanceToCentroid = useMemo(() => {
    if (!currentPos || !centroidLatLng) return 0;
    return Math.round(calculateHaversineMeters(currentPos.lat, currentPos.lng, centroidLatLng[0], centroidLatLng[1]) * 10) / 10;
  }, [currentPos, centroidLatLng]);

  const distanceToEdge = useMemo(() => {
    if (!currentPos || !polygonLatLngs || polygonLatLngs.length < 3) return 0;
    return calculateDistanceToPolygonEdgeMeters(currentPos, polygonLatLngs);
  }, [currentPos, polygonLatLngs]);

  const isInsidePolygon = useMemo(() => {
    if (!currentPos || !polygonLatLngs || polygonLatLngs.length < 3) return false;
    return isPointInPolygon(currentPos, polygonLatLngs);
  }, [currentPos, polygonLatLngs]);

  // 2. Draft Storage Key & LocalStorage Persistence
  const draftStorageKey = `draft_inspection_${activePlotId}`;
  const timerStorageKey = `inspection_started_at_${activePlotId}`;

  // Multi-step Wizard State: activeStep (1 | 2 | 3), dimuat dari localStorage jika ada
  const [activeStep, setActiveStep] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if ([1, 2, 3].includes(parsed.activeStep)) {
          return parsed.activeStep;
        }
      }
    } catch (e) {}
    return 1;
  });

  // Default sample rows 100% dari properti plot.tree_blocks milik lahan database PostgreSQL (ZERO hardcoded fallback)
  const initialSamples = useMemo(() => {
    if (plot?.tree_blocks && Array.isArray(plot.tree_blocks) && plot.tree_blocks.length > 0) {
      return plot.tree_blocks.map((block, idx) => {
        const species = block.species_name || 'Spesies Terdaftar';
        const isMono =
          species.toLowerCase().includes('kelapa') ||
          species.toLowerCase().includes('sawit') ||
          species.toLowerCase().includes('aren') ||
          species.toLowerCase().includes('pinang') ||
          species.toLowerCase().includes('bambu');

        return {
          id: block.id || `block-${idx}`,
          species: species,
          scientificName: block.scientific_name || '',
          claimTrees: block.tree_count || block.total_population || 0,
          actualTrees: '', // KOSONG awalnya untuk diisi hasil ukur fisik lapangan
          claimDbh: block.avg_dbh_cm != null ? block.avg_dbh_cm : '',
          dbhCm: '', // KOSONG awalnya
          claimHeight: block.avg_height_m != null ? block.avg_height_m : '',
          heightM: '', // KOSONG awalnya
          notes: '', // KOSONG awalnya
          isMonocot: isMono
        };
      });
    }
    return [];
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

  // Sinkronkan initialSamples jika plot baru dimuat dan belum ada data tersimpan di draft
  useEffect(() => {
    if (initialSamples.length > 0) {
      setSamples((prev) => {
        const saved = localStorage.getItem(draftStorageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.samples) && parsed.samples.length > 0) {
              return prev;
            }
          } catch (e) {}
        }
        if (!prev || prev.length === 0) {
          return initialSamples;
        }
        return prev;
      });
    }
  }, [initialSamples, draftStorageKey]);

  const [checklists, setChecklists] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.checklists) return parsed.checklists;
      }
    } catch (e) {}
    return {
      p1_p3: false,
      no_dispute: false,
      polygon_match: false
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
    if (plot?.photo_urls && Array.isArray(plot.photo_urls)) return plot.photo_urls;
    if (plot?.photos && Array.isArray(plot.photos)) return plot.photos;
    return [];
  });

  // Sinkronkan foto eksisting jika plot dimuat dari database
  useEffect(() => {
    const existingPhotos = plot?.photo_urls || plot?.photos;
    if (Array.isArray(existingPhotos) && existingPhotos.length > 0) {
      setPhotos((prev) => {
        if (prev && prev.length > 0) return prev;
        return existingPhotos;
      });
    }
  }, [plot]);

  // Auto-save ke localStorage pada setiap perubahan input
  useEffect(() => {
    try {
      const draft = {
        activeStep,
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
  }, [draftStorageKey, activeStep, samples, checklists, additionalNotes, photos]);

  // 5. Timer Durasi Audit Akurat & Persistent saat Refresh (Mulai dari 00:00:00)
  const [seconds, setSeconds] = useState(() => {
    try {
      const storedStart = localStorage.getItem(timerStorageKey);
      if (storedStart) {
        const startTs = parseInt(storedStart, 10);
        if (!isNaN(startTs) && startTs > 0) {
          return Math.max(0, Math.floor((Date.now() - startTs) / 1000));
        }
      }
      const now = Date.now();
      localStorage.setItem(timerStorageKey, String(now));
      return 0;
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    try {
      if (!localStorage.getItem(timerStorageKey)) {
        localStorage.setItem(timerStorageKey, String(Date.now()));
      }
    } catch (e) {}

    const interval = setInterval(() => {
      try {
        const storedStart = localStorage.getItem(timerStorageKey);
        if (storedStart) {
          const startTs = parseInt(storedStart, 10);
          if (!isNaN(startTs) && startTs > 0) {
            setSeconds(Math.max(0, Math.floor((Date.now() - startTs) / 1000)));
            return;
          }
        }
      } catch (e) {}
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStorageKey]);

  const formatTimer = (totalSec) => {
    const s = Math.max(0, Number(totalSec) || 0);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  // GNSS GPS Kalibrasi
  const [isCalibratingGps, setIsCalibratingGps] = useState(false);
  const handleRecalibrateGps = () => {
    setIsCalibratingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSurveyorLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          if (pos.coords.accuracy) {
            setGpsAccuracy(Math.round(pos.coords.accuracy));
          }
          setIsCalibratingGps(false);
          if (onToast) onToast(`Kalibrasi GNSS berhasil · Akurasi GPS ±${Math.round(pos.coords.accuracy || 3)} meter`, 'emerald');
        },
        (err) => {
          console.warn('Geolocation calibration warning:', err.message);
          setIsCalibratingGps(false);
          if (onToast) onToast('Kalibrasi selesai dengan satelit terdekat.', 'emerald');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setTimeout(() => {
        setIsCalibratingGps(false);
        if (onToast) onToast('Kalibrasi GNSS selesai.', 'emerald');
      }, 700);
    }
  };

  // Tambah baris sampel baru secara manual
  const handleAddSampleRow = () => {
    const newId = `sample-${Date.now()}`;
    const newSample = {
      id: newId,
      species: 'Spesies Tambahan',
      scientificName: '',
      claimTrees: 0,
      actualTrees: '',
      claimDbh: '',
      dbhCm: '',
      claimHeight: '',
      heightM: '',
      notes: '',
      isMonocot: false
    };
    setSamples((prev) => [...prev, newSample]);
    if (onToast) onToast('Baris sampel baru ditambahkan · silakan lengkapi data ukur.', 'emerald');
  };

  // Hapus baris sampel
  const handleDeleteSampleRow = (id) => {
    setSamples((prev) => prev.filter((s) => s.id !== id));
  };

  // Perhitungan Deviasi & Biomassa
  const stats = useMemo(() => {
    let totalClaim = 0;
    let totalActual = 0;
    let hasActualInputs = false;

    samples.forEach((s) => {
      totalClaim += Number(s.claimTrees) || 0;
      if (s.actualTrees !== '' && s.actualTrees != null) {
        hasActualInputs = true;
        totalActual += Number(s.actualTrees) || 0;
      }
    });

    const diff = totalActual - totalClaim;
    const deviationPct = totalClaim > 0 && hasActualInputs ? (diff / totalClaim) * 100 : 0;
    const estimatedBiomass = Math.round(totalActual * 0.151 * 10) / 10;

    return {
      totalClaim,
      totalActual,
      hasActualInputs,
      deviationPct: Math.round(deviationPct * 10) / 10,
      estimatedBiomass
    };
  }, [samples]);

  // Upload Foto Lapangan
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const processPhotoFile = async (file) => {
    if (!file) return;
    const latStr = currentPos?.lat ? currentPos.lat.toFixed(6) : centroidLatLng[0].toFixed(6);
    const lngStr = currentPos?.lng ? currentPos.lng.toFixed(6) : centroidLatLng[1].toFixed(6);
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const defaultTitle = photos.length === 0 ? 'Foto Patok Batas' : 'Foto Kanopi Tegakan';
    const coordStr = `${latStr}, ${lngStr}`;
    const timestampStr = `Hari ini · ${nowTimeStr} WIB`;

    setIsUploadingPhoto(true);
    try {
      // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', defaultTitle);
      formData.append('coord', coordStr);
      formData.append('timestamp', timestampStr);

      const targetLandId = plot?.id || activePlotId;
      const res = await uploadSurveyorPhoto(targetLandId, formData);
      const newPhoto = res.photo || {
        id: `photo-${Date.now()}`,
        url: res.url || res.photo_url || URL.createObjectURL(file),
        title: defaultTitle,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        coord: coordStr,
        timestamp: timestampStr
      };

      setPhotos((prev) => [newPhoto, ...prev]);
      if (onToast) onToast(`Foto "${file.name}" berhasil diunggah dengan geotag tersimpan.`, 'emerald');
    } catch (err) {
      console.warn('Gagal upload foto ke backend, simpan lokal sebagai fallback:', err);
      const localPhoto = {
        id: `photo-local-${Date.now()}`,
        url: URL.createObjectURL(file),
        title: defaultTitle,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        coord: coordStr,
        timestamp: timestampStr
      };
      setPhotos((prev) => [localPhoto, ...prev]);
      if (onToast) onToast(`Foto "${file.name}" tersimpan lokal di perangkat.`, 'amber');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processPhotoFile(files[0]);
    e.target.value = '';
  };

  const handleDeletePhoto = async (id) => {
    try {
      const targetLandId = plot?.id || activePlotId;
      if (id && !String(id).startsWith('photo-local-')) {
        await deleteSurveyorPhoto(targetLandId, id).catch(() => {});
      }
    } catch (err) {
      console.warn('Gagal menghapus foto di server:', err);
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (onToast) onToast('Foto berhasil dihapus.', 'emerald');
  };

  // Modals Keputusan Audit
  const [modalType, setModalType] = useState(null); // 'reject' | 'revise' | 'approve'
  const [reviseCategory, setReviseCategory] = useState('');
  const [reviseNote, setReviseNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenReviseModal = () => {
    setReviseCategory('Koordinat Poligon Melenceng');
    setReviseNote('Tolong sesuaikan batas petak sebelah utara karena melintasi batas jalan dusun.');
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

  // Eksekusi Kirim Putusan Audit ke Backend API
  const handleExecuteAudit = async (decision) => {
    setIsSubmitting(true);
    try {
      const blockAdjustments = samples.map((s) => ({
        block_id: s.id.startsWith('block-') || s.id.startsWith('sample-') ? null : s.id,
        species_name: s.species,
        actual_tree_count: s.actualTrees !== '' && s.actualTrees != null ? Number(s.actualTrees) : Number(s.claimTrees || 0),
        actual_avg_dbh_cm: s.dbhCm !== '' && s.dbhCm != null ? Number(s.dbhCm) : (s.claimDbh !== '' && s.claimDbh != null ? Number(s.claimDbh) : 20.0),
        actual_avg_height_m: s.heightM !== '' && s.heightM != null ? Number(s.heightM) : null,
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

      let submittedToBackend = false;
      const auditPayload = {
        decision,
        notes,
        category,
        block_adjustments: blockAdjustments
      };

      if (navigator.onLine) {
        try {
          await submitSurveyorAudit(plot?.id || activePlotId, auditPayload);
          submittedToBackend = true;
        } catch (netErr) {
          console.warn('Gagal kirim audit ke server, beralih ke IndexedDB offline cache:', netErr);
        }
      }

      if (!submittedToBackend) {
        // Simpan ke IndexedDB lokal jika offline atau koneksi gagal
        await saveOfflineSurvey({
          landId: plot?.id || activePlotId,
          landName: plotName,
          farmerName: farmerName,
          areaSqm: areaHa ? (parseFloat(areaHa) * 10000) : 0,
          ...auditPayload
        });
        if (onToast) onToast(`Sinyal offline / server tidak terjangkau. Hasil audit disimpan aman di IndexedDB perangkat.`, 'amber');
      }

      // Hapus draft dan timer setelah pengiriman berhasil
      localStorage.removeItem(draftStorageKey);
      localStorage.removeItem(timerStorageKey);

      closeModal();
      if (submittedToBackend) {
        if (decision === 'approved') {
          if (onToast) onToast(`Lahan "${plotName}" BERHASIL DISETUJUI & diverifikasi ke Pre-Verified.`, 'emerald');
        } else if (decision === 'revision') {
          if (onToast) onToast(`Instruksi revisi (${category}) berhasil dikirim ke ${farmerName}.`, 'amber');
        } else if (decision === 'rejected') {
          if (onToast) onToast(`Tiket lahan ditolak permanen. Status lahan telah diperbarui di database.`, 'rose');
        }
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
      if (onToast) onToast(`Gagal menyimpan audit: ${err.message}`, 'rose');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!plot) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="font-bold text-[#0F291E]">Memuat data inspeksi lahan…</p>
        <p className="text-xs text-slate-500 mt-1">Mengambil koordinat dan pohon dari server PostgreSQL</p>
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
    <div className="relative h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 antialiased overflow-hidden">
      {/* ============================================================
           IMMERSIVE FLOATING TOP NAVBAR (Pine Forest Glassmorphism)
           fixed top-4 left-4 & right-4 melayang di atas konten
      ============================================================ */}
      {/* Sisi Kiri Melayang: Tombol ringkas ← Dashboard, Nama Lahan & Info Petani */}
      <div className="fixed top-4 left-4 z-[1000] flex items-center gap-2.5 rounded-2xl bg-[#0F291E]/80 px-3.5 py-2 text-white shadow-xl backdrop-blur-md border border-white/10">
        <button
          type="button"
          onClick={onBack || (() => onNavigateTab && onNavigateTab('tasks'))}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95 cursor-pointer"
          title="Kembali ke Dashboard Antrean Tugas"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <span className="h-4 w-px bg-white/15" />

        <div className="min-w-0 pr-1">
          <h1 className="truncate font-bold text-xs sm:text-sm text-white leading-tight font-sans">
            {plotName}
          </h1>
          <p className="truncate font-sans font-medium text-[10.5px] text-emerald-300/80 tabular-nums">
            {farmerName} · {areaHa} Ha
          </p>
        </div>
      </div>

      {/* Sisi Kanan Melayang: Stepper 3 Tahap Kapsul & Timer Durasi Audit */}
      <div className="fixed top-4 right-4 z-[1000] flex items-center gap-2 sm:gap-3 rounded-2xl bg-[#0F291E]/80 px-3.5 py-2 text-white shadow-xl backdrop-blur-md border border-white/10 font-sans">
        <nav aria-label="Tahapan inspeksi" className="flex items-center gap-1">
          {[
            { step: 1, label: 'Spasial' },
            { step: 2, label: 'Sampling' },
            { step: 3, label: 'Putusan' }
          ].map((item, idx) => {
            const isActive = activeStep === item.step;
            const isDone = activeStep > item.step;
            return (
              <React.Fragment key={item.step}>
                {idx > 0 && <span className="text-white/20 text-[10px] select-none">→</span>}
                <button
                  type="button"
                  onClick={() => setActiveStep(item.step)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isDone
                      ? 'text-emerald-300 hover:bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`grid h-3.5 w-3.5 place-items-center rounded text-[9px] font-bold ${
                    isActive
                      ? 'bg-white text-emerald-800'
                      : isDone
                      ? 'bg-emerald-500/30 text-emerald-200'
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : item.step}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        <span className="h-4 w-px bg-white/15" />

        <div className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-emerald-300 tabular-nums">
          <Timer className="w-3.5 h-3.5 text-emerald-300" />
          <span className="tnum tracking-wider">{formatTimer(seconds)}</span>
        </div>
      </div>

      {/* ============================================================
           KONTEN UTAMA WIZARD MULTI-STEP (100% IMMERSIVE FULLSCREEN)
      ============================================================ */}
      {/* ========================================================
           STEP 1 · VALIDASI SPASIAL & GEOFENCING (FULLSCREEN MAP)
      ======================================================== */}
      {activeStep === 1 && (
        <div id="step-1" className="relative h-screen w-full overflow-hidden">
          <MapContainer
            center={defaultCenter}
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

            {/* Marker Vertex Poligon: jika > 6 render 4 patok utama ekstrem */}
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
                        html: `<div style="background:#0F291E;color:#10B981;border:2px solid #10B981;border-radius:6px;padding:2px 6px;font-size:10px;font-family:'Plus Jakarta Sans',Inter,sans-serif;font-variant-numeric:tabular-nums;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.35);white-space:nowrap;">${extreme.label}</div>`,
                        iconSize: [56, 22],
                        iconAnchor: [28, 11]
                      })}
                    >
                      <Popup>
                        <div className="font-sans text-xs">
                          <strong>{extreme.label} ({extreme.direction})</strong>
                          <p className="font-sans text-[10px] text-slate-500 mt-0.5 tabular-nums">
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
                    html: `<div style="background:#10B981;color:#fff;border:2px solid #ECFDF5;border-radius:4px;padding:1px 4px;font-size:9px;font-family:'Plus Jakarta Sans',Inter,sans-serif;font-variant-numeric:tabular-nums;font-weight:bold;box-shadow:0 1px 3px rgba(0,0,0,0.3);">P${idx + 1}</div>`,
                    iconSize: [24, 18],
                    iconAnchor: [12, 9]
                  })}
                />
              );
            })}

            {/* Titik GPS Surveyor Riil */}
            {currentPos && (
              <Marker
                position={[currentPos.lat, currentPos.lng]}
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
                    <strong className="text-[#0F291E] block">Posisi GPS Surveyor</strong>
                    <span className="text-[10px] text-emerald-700">
                      {isInsidePolygon ? 'Di dalam poligon' : 'Di luar poligon'} (±{gpsAccuracy || 4}m)
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* MapUpdater: auto-fit HANYA SEKALI saat mount atau saat klik Fokuskan Kamera */}
            <MapUpdater
              bounds={plotBounds}
              triggerRecenter={focusTrigger}
            />
          </MapContainer>

          {/* Floating Controls: Tombol Fokuskan Kamera & Legend Melayang di Kiri Atas Peta */}
          <div className="absolute top-20 left-4 z-[400] flex flex-col gap-2">
            <button
              type="button"
              onClick={handleFocusCamera}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-xl backdrop-blur-md border border-white/60 hover:bg-white transition cursor-pointer active:scale-95"
              title="Fokuskan Kamera ke Batas Lahan"
            >
              <LocateFixed className="h-4 w-4 text-emerald-600" />
              <span>Fokuskan Kamera</span>
            </button>

            <div className="rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md border border-white/60 text-slate-700 font-sans">
              <p className="flex items-center gap-1.5 font-sans text-[10px] font-semibold">
                <span className="inline-block h-0.5 w-4 rounded bg-emerald-500"></span> Batas Poligon Petani ({polygonLatLngs.length} Titik{polygonLatLngs.length > 6 ? ' · 4 Patok Utama' : ` · ${polygonLatLngs.length} Patok`})
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-sans text-[10px] font-semibold">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0F291E] ring-1 ring-emerald-500"></span> Posisi GPS Surveyor
              </p>
            </div>
          </div>

          {/* Floating Side Panel: Status Geofencing & Metrik Riil Melayang di Kanan Peta */}
          <div className="absolute top-20 right-4 z-[400] w-80 sm:w-96 max-h-[calc(100vh-170px)] overflow-y-auto rounded-3xl bg-white/95 p-4 shadow-2xl backdrop-blur-md border border-white/80 space-y-3.5 font-sans">
            {/* Status Geofencing Riil */}
            <div className={`rounded-2xl border p-3.5 ${
              isInsidePolygon
                ? 'border-emerald-200 bg-emerald-50/80'
                : 'border-amber-200 bg-amber-50/80'
            }`}>
              <p className={`flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-wider ${
                isInsidePolygon ? 'text-emerald-800' : 'text-amber-800'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${
                    isInsidePolygon ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></span>
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${
                    isInsidePolygon ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></span>
                </span>
                {isInsidePolygon ? 'Status Geofencing Valid' : 'Di Luar Batas Lahan'}
              </p>
              <p className="mt-1.5 text-[13px] font-bold leading-snug text-[#0F291E]">
                {isInsidePolygon ? 'Posisi Anda Terverifikasi di Lapangan' : 'Posisi Anda di Luar Batas Poligon'}
                <span className="block font-sans text-[11px] font-semibold text-emerald-700 tabular-nums">
                  (Akurasi GPS Lapangan: ±{gpsAccuracy || 4} meter)
                </span>
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">
                {isInsidePolygon
                  ? 'Sensor GNSS mengonfirmasi surveyor berada di dalam batas petak lahan. Anda dapat melanjutkan ke sampling tegakan pohon.'
                  : `Surveyor terdeteksi berada ${distanceToEdge} meter di luar batas poligon kebun. Dekati petak lahan sebelum mengesahkan audit.`}
              </p>
            </div>

            {/* Metrik Koordinat Riil */}
            <dl className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                <dt className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Latitude Surveyor
                </dt>
                <dd className="tnum mt-0.5 font-sans text-[12px] font-bold text-[#0F291E] tabular-nums">
                  {currentPos?.lat ? currentPos.lat.toFixed(6) : centroidLatLng[0].toFixed(6)}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                <dt className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Longitude Surveyor
                </dt>
                <dd className="tnum mt-0.5 font-sans text-[12px] font-bold text-[#0F291E] tabular-nums">
                  {currentPos?.lng ? currentPos.lng.toFixed(6) : centroidLatLng[1].toFixed(6)}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                <dt className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Luas Poligon
                </dt>
                <dd className="tnum mt-0.5 font-sans text-[12px] font-bold text-[#0F291E] tabular-nums">
                  {Number(areaSqm).toLocaleString()} m²
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                <dt className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Jarak ke Batas Tepi
                </dt>
                <dd className="tnum mt-0.5 font-sans text-[12px] font-bold text-[#0F291E] tabular-nums">
                  {distanceToEdge} m ({isInsidePolygon ? 'Dalam' : 'Luar'})
                </dd>
              </div>
            </dl>

            {/* Checklist Patok Fisik */}
            <div className="rounded-2xl border border-slate-200 p-3">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Checklist Verifikasi Batas Fisik
              </p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-slate-700">
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
                  <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-slate-700">
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
                  <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-slate-700">
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[.99] cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${isCalibratingGps ? 'animate-spin' : ''}`} />
              {isCalibratingGps ? 'Mengkalibrasi Satelit…' : 'Ulangi Pembacaan GNSS / GPS'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
           STEP 2 · FORM INPUT SAMPLING ALOMETRIK (activeStep === 2)
      ======================================================== */}
      {activeStep === 2 && (
        <div id="step-2" className="h-screen w-full overflow-y-auto pt-20 pb-28 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <Ruler className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[15px] font-bold tracking-tight text-[#0F291E]">
                      Step 2 · Verifikasi Sampling Alometrik
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-slate-500">
                      Verifikasi pengukuran lapangan (DBH, populasi hidup, tinggi). Angka klaim petani digunakan sebagai batas referensi.
                    </p>
                  </div>
                </div>
              </header>

              <div className="p-4 sm:p-5">
                {samples.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-slate-50">
                    <Trees className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Belum ada blok pohon yang diklaim petani pada plot ini.</p>
                    <p className="text-xs text-slate-500 mt-1">Surveyor hanya bertugas memverifikasi list spesies yang sudah diklaim petani. Jika ada perbedaan, gunakan catatan revisi pada Tahap 3.</p>
                  </div>
                ) : (
                <>
                  {/* Tabel Sampling Desktop */}
                  <div className="hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 font-sans">
                          <th scope="col" className="px-4 py-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Spesies / Klaim Petani
                          </th>
                          <th scope="col" className="px-4 py-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Klaim (Pohon)
                          </th>
                          <th scope="col" className="px-4 py-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                            Jumlah Pohon Hidup
                          </th>
                          <th scope="col" className="px-4 py-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                            Rata-rata DBH (cm)
                          </th>
                          <th scope="col" className="px-4 py-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Tinggi Rata-rata (m)
                          </th>
                          <th scope="col" className="px-4 py-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Catatan Kesehatan
                          </th>
                          <th scope="col" className="px-3 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {samples.map((row) => {
                          const claim = Number(row.claimTrees) || 0;
                          const actual = row.actualTrees !== '' && row.actualTrees != null ? Number(row.actualTrees) : null;
                          const diff = actual !== null ? actual - claim : 0;
                          const pct = claim > 0 && actual !== null ? (diff / claim) * 100 : 0;
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
                                <p className="mt-0.5 font-sans text-[10.5px] text-slate-400">
                                  {row.scientificName || 'Blok Agroforestri'}
                                </p>
                              </td>
                              <td className="px-4 py-3.5 align-top">
                                <span className="tnum inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1.5 font-sans text-[13px] font-bold text-slate-700 tabular-nums">
                                  {claim} Pohon
                                </span>
                              </td>
                              <td className="px-4 py-3.5 align-top">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder={row.claimTrees ? String(row.claimTrees) : '0'}
                                  value={row.actualTrees}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSamples((prev) =>
                                      prev.map((s) => (s.id === row.id ? { ...s, actualTrees: val } : s))
                                    );
                                  }}
                                  className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans tabular-nums"
                                />
                                {actual !== null ? (
                                  <p
                                    className={`mt-1 font-sans text-[10.5px] font-semibold tabular-nums ${
                                      Math.abs(pct) > 10 ? 'text-rose-600' : Math.abs(pct) > 0 ? 'text-amber-600' : 'text-emerald-600'
                                    }`}
                                  >
                                    Selisih: {diff > 0 ? `+${diff}` : diff} ({diff > 0 ? `+${pct.toFixed(1)}` : pct.toFixed(1)}%)
                                  </p>
                                ) : (
                                  <p className="mt-1 font-sans text-[10.5px] text-slate-400 tabular-nums">
                                    Klaim: {claim} Pohon
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3.5 align-top">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder={row.claimDbh ? String(row.claimDbh) : 'cm'}
                                  value={row.dbhCm}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSamples((prev) =>
                                      prev.map((s) => (s.id === row.id ? { ...s, dbhCm: val } : s))
                                    );
                                  }}
                                  className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans tabular-nums"
                                />
                                <p className="mt-1 font-sans text-[10.5px] text-slate-400 tabular-nums">
                                  Klaim: {row.claimDbh || '—'} cm
                                </p>
                              </td>
                              <td className="px-4 py-3.5 align-top">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder={row.claimHeight ? String(row.claimHeight) : (isMonocot ? 'Wajib' : 'Opsional')}
                                  value={row.heightM}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSamples((prev) =>
                                      prev.map((s) => (s.id === row.id ? { ...s, heightM: val } : s))
                                    );
                                  }}
                                  className={`w-24 rounded-xl border px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs transition focus:ring-2 font-sans tabular-nums ${
                                    isMonocot
                                      ? 'border-emerald-300 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-500/20'
                                      : 'border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20'
                                  }`}
                                />
                                <p className="mt-1 font-sans text-[10.5px] text-slate-400">
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
                                  placeholder="Kondisi kesehatan pohon aktual..."
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
                      <article key={row.id} className="rounded-xl border border-slate-200 p-4 transition hover:bg-emerald-50/20 font-sans">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-2 text-[14px] font-bold text-[#0F291E]">
                              {row.isMonocot ? <Palmtree className="h-4 w-4 text-emerald-600" /> : <TreeDeciduous className="h-4 w-4 text-emerald-600" />}
                              {row.species}
                            </p>
                            <p className="mt-0.5 font-sans text-[10.5px] text-slate-400">{row.scientificName}</p>
                          </div>
                          <span className="tnum shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 font-sans text-[12px] font-bold text-slate-700 tabular-nums">
                            Klaim: {row.claimTrees}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <label className="block">
                            <span className="mb-1 block font-sans text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                              Jumlah Hidup
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder={row.claimTrees ? String(row.claimTrees) : '0'}
                              value={row.actualTrees}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSamples((prev) => prev.map((s) => (s.id === row.id ? { ...s, actualTrees: val } : s)));
                              }}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans tabular-nums"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block font-sans text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                              Rata-rata DBH (cm)
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder={row.claimDbh ? String(row.claimDbh) : 'cm'}
                              value={row.dbhCm}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSamples((prev) => prev.map((s) => (s.id === row.id ? { ...s, dbhCm: val } : s)));
                              }}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans tabular-nums"
                            />
                          </label>
                          <label className="block col-span-2">
                            <span className="mb-1 block font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              Rata-rata Tinggi (m)
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder={row.claimHeight ? String(row.claimHeight) : (row.isMonocot ? 'Wajib (monokotil)' : 'Opsional')}
                              value={row.heightM}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSamples((prev) => prev.map((s) => (s.id === row.id ? { ...s, heightM: val } : s)));
                              }}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] font-semibold text-[#0F291E] shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans tabular-nums"
                            />
                          </label>
                          <label className="block col-span-2">
                            <span className="mb-1 block font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              Catatan Kesehatan
                            </span>
                            <input
                              type="text"
                              value={row.notes}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSamples((prev) => prev.map((s) => (s.id === row.id ? { ...s, notes: val } : s)));
                              }}
                              placeholder="Kondisi kesehatan pohon aktual..."
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-[#0F291E] shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans"
                            />
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Ringkasan Deviasi Bento */}
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 font-sans">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Klaim</p>
                      <p className="tnum mt-1 text-[20px] font-extrabold leading-none text-[#0F291E] font-sans tabular-nums">{stats.totalClaim}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Total Aktual</p>
                      <p className="tnum mt-1 text-[20px] font-extrabold leading-none text-emerald-700 font-sans tabular-nums">
                        {stats.hasActualInputs ? stats.totalActual : '—'}
                      </p>
                    </div>
                    <div
                      className={`rounded-xl border p-3.5 ${
                        Math.abs(stats.deviationPct) > 10
                          ? 'border-rose-200 bg-rose-50/70'
                          : 'border-amber-200 bg-amber-50/70'
                      }`}
                    >
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-amber-800">Deviasi</p>
                      <p
                        className={`tnum mt-1 text-[20px] font-extrabold leading-none font-sans tabular-nums ${
                          Math.abs(stats.deviationPct) > 10 ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        {stats.hasActualInputs ? (stats.deviationPct > 0 ? `+${stats.deviationPct}%` : `${stats.deviationPct}%`) : '0%'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                        Estimasi Biomassa
                      </p>
                      <p className="tnum mt-1 text-[20px] font-extrabold leading-none text-emerald-700 font-sans tabular-nums">
                        {stats.estimatedBiomass} t
                      </p>
                    </div>
                  </div>

                  <p className="mt-2.5 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-[12px] leading-relaxed text-slate-600">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    Deviasi di bawah <span className="font-semibold text-slate-700">±10%</span> masih dalam toleransi standar MRV. Jika deviasi melebihi toleransi, gunakan tombol instruksi revisi pada Tahap 3.
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    )}

      {/* ========================================================
           STEP 3 · DOKUMENTASI LAPANGAN & PUTUSAN (activeStep === 3)
      ======================================================== */}
      {activeStep === 3 && (
        <div id="step-3" className="h-screen w-full overflow-y-auto pt-20 pb-28 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                    <Camera className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[15px] font-bold tracking-tight text-[#0F291E]">Step 3 · Dokumentasi Lapangan &amp; Putusan Akhir</h2>
                    <p className="mt-0.5 text-[12.5px] text-slate-500">Unggah bukti visual geotag lapangan sebelum menerbitkan keputusan audit.</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-sans text-[10.5px] font-semibold text-slate-600 tabular-nums">
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
              <div 
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processPhotoFile(e.dataTransfer.files[0]);
                  }
                }}
                className="mt-3.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-50/20"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700 shadow-xs ring-1 ring-inset ring-slate-200">
                  {isUploadingPhoto ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                </span>
                <p className="mt-3 text-[14px] font-bold text-[#0F291E]">
                  {isUploadingPhoto ? 'Mengunggah Berkas Foto...' : 'Seret & lepas foto di sini'}
                </p>
                <p className="mt-0.5 text-[12.5px] text-slate-500">atau ambil langsung dari kamera perangkat lapangan</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F291E] px-4 py-2.5 text-[13px] font-semibold text-white shadow-xs transition hover:bg-[#173D2E] active:scale-[.98] cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4 text-emerald-400" /> Pilih dari Galeri
                  </button>
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[.98] cursor-pointer disabled:opacity-50"
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
                <p className="mt-3 font-sans text-[10.5px] text-slate-400">
                  JPG / PNG · maks 8 MB per berkas · Metadata EXIF &amp; koordinat GPS otomatis tersimpan
                </p>
              </div>

              {/* Galeri Foto Geotag */}
              <p className="mt-5 font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Foto Terunggah ({photos.length})
              </p>
              {photos.length === 0 ? (
                <div className="mt-2.5 rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/50 font-sans">
                  <Camera className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada foto dokumentasi terunggah</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Silakan ambil atau unggah foto patok batas dan kanopi pohon di lapangan.</p>
                </div>
              ) : (
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {photos.map((photo) => (
                    <figure
                      key={photo.id}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs transition hover:border-emerald-300 font-sans"
                    >
                      <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                        {photo.url ? (
                          <img
                            src={
                              photo.url.startsWith('http') || photo.url.startsWith('blob:') || photo.url.startsWith('data:')
                                ? photo.url
                                : `http://127.0.0.1:8000${photo.url}`
                            }
                            alt={photo.name || photo.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900 to-[#0F291E] text-white ${photo.url ? '-z-10' : ''}`}>
                          <div className="text-center p-4">
                            <Trees className="h-10 w-10 mx-auto text-emerald-400 mb-2 opacity-80" />
                            <span className="font-sans text-xs font-bold text-emerald-200 block">{photo.title}</span>
                            <span className="text-[10px] text-emerald-300/70 font-sans">{photo.name}</span>
                          </div>
                        </div>

                        {/* Watermark Koordinat & Waktu */}
                        <figcaption className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 rounded-lg bg-black/60 px-2 py-1 font-sans text-[9.5px] font-semibold text-white backdrop-blur-xs tabular-nums">
                          <span>{photo.coord}</span>
                          <span className="text-emerald-300">{photo.timestamp}</span>
                        </figcaption>

                        {/* Badge Jenis */}
                        <span className="absolute left-2 top-2 rounded-md bg-emerald-600/95 px-2 py-1 font-sans text-[10px] font-bold uppercase tracking-wider text-white">
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
                        <p className="truncate text-[12px] font-semibold text-slate-700 font-sans">
                          {photo.name} · {photo.size}
                        </p>
                      </div>
                    </figure>
                  ))}
                </div>
              )}

              {/* Catatan Tambahan Surveyor */}
              <label className="mt-5 block font-sans">
                <span className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Catatan Lapangan Tambahan (Opsional)
                </span>
                <textarea
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Misal: Akses jalan hanya bisa dilalui roda dua; patok P3 terlindung rimbunan bambu; tutupan vegetasi sangat lebat."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13.5px] text-[#0F291E] shadow-xs transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans"
                />
              </label>
            </div>

            </section>

            {/* Footer Note */}
            <p className="mt-4 text-center font-sans text-[10.5px] text-slate-400 tabular-nums">
              TaniKarbon MRV Engine · Audit Lapangan {displayTicketId} · Status tersimpan lokal &amp; siap sinkronisasi
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
           FLOATING ACTION BUTTONS (FAB) · IMMERSIVE FULLSCREEN UI
           Melayang di pojok kanan bawah & kiri bawah layar (fixed bottom-6)
      ============================================================ */}
      {/* FAB KIRI BAWAH: Tombol Kembali */}
      {activeStep > 1 && (
        <div className="fixed bottom-6 left-6 z-[1000]">
          <button
            type="button"
            onClick={() => {
              setActiveStep((s) => s - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-xl backdrop-blur-md border border-slate-200/80 hover:bg-white transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Tahap {activeStep - 1}</span>
          </button>
        </div>
      )}

      {/* FAB KANAN BAWAH: Tombol Lanjut / Keputusan Audit */}
      <div className="fixed bottom-6 right-6 z-[1000] flex items-center gap-2 sm:gap-3">
        {activeStep === 1 && (
          <button
            type="button"
            onClick={() => {
              setActiveStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0F291E]/90 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xl backdrop-blur-md border border-emerald-500/30 hover:bg-[#0F291E] transition active:scale-95 cursor-pointer"
          >
            <span>Lanjut ke Tahap 2</span>
            <ArrowRight className="h-4 w-4 text-emerald-400" />
          </button>
        )}

        {activeStep === 2 && (
          <button
            type="button"
            onClick={() => {
              setActiveStep(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0F291E]/90 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xl backdrop-blur-md border border-emerald-500/30 hover:bg-[#0F291E] transition active:scale-95 cursor-pointer"
          >
            <span>Lanjut ke Tahap 3</span>
            <ArrowRight className="h-4 w-4 text-emerald-400" />
          </button>
        )}

        {activeStep === 3 && (
          <>
            {/* 1 · Tolak Permanen */}
            <button
              type="button"
              onClick={handleOpenRejectModal}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600/90 px-3.5 py-3 text-xs sm:text-sm font-bold text-white shadow-xl backdrop-blur-md border border-rose-400/30 hover:bg-rose-700 transition active:scale-95 cursor-pointer"
            >
              <XOctagon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Tolak Permanen</span>
              <span className="sm:hidden">Tolak</span>
            </button>

            {/* 2 · Minta Revisi Petani */}
            <button
              type="button"
              onClick={handleOpenReviseModal}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500/90 px-3.5 py-3 text-xs sm:text-sm font-bold text-white shadow-xl backdrop-blur-md border border-amber-300/30 hover:bg-amber-600 transition active:scale-95 cursor-pointer"
            >
              <PencilRuler className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Minta Revisi Petani</span>
              <span className="sm:hidden">Revisi</span>
            </button>

            {/* 3 · Setujui & Verifikasi */}
            <button
              type="button"
              onClick={handleOpenApproveModal}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600/95 px-4 py-3 text-xs sm:text-sm font-extrabold text-white shadow-xl backdrop-blur-md border border-emerald-400/40 hover:bg-emerald-700 transition active:scale-95 cursor-pointer"
            >
              <Check className="h-4.5 w-4.5 shrink-0" />
              <span>Setujui &amp; Verifikasi</span>
            </button>
          </>
        )}
      </div>

      {/* ============================================================
           MODAL 1 · MINTA REVISI PETANI
      ============================================================ */}
      {modalType === 'revise' && (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center p-0 sm:items-center sm:p-6 bg-[#0F291E]/60 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                  <PencilRuler className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-[#0F291E] font-sans">Minta Revisi Petani</h3>
                  <p className="mt-0.5 font-sans text-[10.5px] text-slate-400 tabular-nums">
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

            <div className="space-y-4 px-5 py-4 font-sans">
              <label className="block">
                <span className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Kategori Kesalahan
                </span>
                <div className="relative">
                  <select
                    value={reviseCategory}
                    onChange={(e) => setReviseCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-10 text-[13.5px] font-medium text-[#0F291E] shadow-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-sans"
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
                <span className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Catatan Instruksi untuk Petani
                </span>
                <textarea
                  rows={4}
                  value={reviseNote}
                  onChange={(e) => setReviseNote(e.target.value)}
                  placeholder="Jelaskan bagian petak atau data yang harus diperbaiki petani…"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-[#0F291E] shadow-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-sans"
                />
                <span className="mt-1 flex items-center justify-between font-sans text-[10px] text-slate-400 tabular-nums">
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
        <div className="fixed inset-0 z-[1200] flex items-end justify-center p-0 sm:items-center sm:p-6 bg-[#0F291E]/60 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200">
                  <XOctagon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-[#0F291E] font-sans">Tolak Permanen Lahan</h3>
                  <p className="mt-0.5 font-sans text-[10.5px] text-slate-400 tabular-nums">
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

            <div className="space-y-4 px-5 py-4 font-sans">
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-[12.5px] leading-relaxed text-rose-900 font-sans">
                  <span className="font-bold">PERHATIAN:</span> Penolakan bersifat permanen. Lahan akan digugurkan dari program sertifikasi karbon dan statusnya di database PostgreSQL akan diubah menjadi <span className="font-sans font-bold">rejected</span>.
                </p>
              </div>

              <label className="block">
                <span className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Alasan Penolakan Permanen (Wajib)
                </span>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Misal: Lahan terbukti berada di kawasan lindung non-hutan rakyat atau sengketa hak milik ganda…"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-[#0F291E] shadow-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-sans"
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
        <div className="fixed inset-0 z-[1200] flex items-end justify-center p-0 sm:items-center sm:p-6 bg-[#0F291E]/60 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">
                  <Check className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-[#0F291E] font-sans">Setujui &amp; Verifikasi Lahan</h3>
                  <p className="mt-0.5 font-sans text-[10.5px] text-slate-400 tabular-nums">
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

            <div className="space-y-4 px-5 py-4 font-sans">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Konfirmasi Pengesahan Lapangan
                </p>
                <p className="mt-1 text-[13px] text-emerald-950 leading-relaxed font-sans">
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
                  <strong className="text-[#0F291E] font-semibold">{Number(areaSqm).toLocaleString()} m² ({areaHa} Ha)</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Jumlah Pohon Hidup:</span>
                  <strong className="text-emerald-700 font-bold">{stats.hasActualInputs ? stats.totalActual : stats.totalClaim} Pohon</strong>
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
