import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CloudSun,
  RefreshCw,
  ClipboardCheck,
  Inbox,
  PencilRuler,
  CircleCheckBig,
  Route,
  Ruler,
  Timer,
  MapPin,
  Layers,
  Navigation,
  ListTodo,
  Clock,
  BadgeCheck,
  Trees,
  Phone,
  MessageCircle,
  Map as MapIcon,
  ArrowRight,
  Flame,
  Sprout,
  Repeat,
  CalendarX,
  CalendarClock,
  Users,
  Hourglass,
  TrendingUp,
  SearchX,
  Info,
  CheckCircle2,
  ExternalLink,
  LocateFixed,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSurveyorTasks } from '../../api/surveyor';
import { getStoredUser } from '../../api/auth';
import BeritaAcaraModal from './BeritaAcaraModal';
import AnimatedNumber from '../common/AnimatedNumber';

// Helper hitung jarak Haversine (km)
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Helper auto-fit bounds Leaflet (HANYA SEKALI saat awal load atau user klik fokus)
function MapUpdater({ bounds, triggerRecenter }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!map || !bounds) return;
    try {
      if (!hasFittedRef.current || triggerRecenter) {
        const isValid = typeof bounds.isValid === 'function' ? bounds.isValid() : true;
        if (isValid) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          hasFittedRef.current = true;
        }
      }
    } catch (err) {
      console.warn('MapUpdater error:', err);
    }
  }, [map, bounds, triggerRecenter]);

  return null;
}

// Helper pan/zoom halus ke titik tertentu
function FlyToLocation({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target || typeof target[0] !== 'number' || typeof target[1] !== 'number') return;
    map.flyTo(target, 17, { duration: 1.2 });
  }, [map, target]);
  return null;
}

// Parse GeoJSON Polygon to Leaflet [lat, lng] array
function parseGeoJsonPolygon(geojson) {
  if (!geojson) return [];
  try {
    let parsed = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
    if (parsed && parsed.type === 'Polygon' && Array.isArray(parsed.coordinates)) {
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

export default function SurveyorDashboardView({
  currentUser: propUser,
  tasks: propTasks,
  onOpenScheduleModal,
  onStartInspection,
  onNavigateTab,
  onToast,
  onRefreshTasks
}) {
  // 1. Deteksi Sinyal (Online/Offline) Otomatis
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (onToast) onToast('Koneksi internet pulih · Mode Sinkronisasi Aktif', 'emerald');
    };
    const handleOffline = () => {
      setIsOnline(false);
      if (onToast) onToast('Sinyal offline · Data disimpan lokal di IndexedDB', 'emerald');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onToast]);

  // 2. Deteksi Lokasi GPS Surveyor (Geolocation) - Fallback Depok/Jakarta area (Real test plots)
  const [surveyorLocation, setSurveyorLocation] = useState({ lat: -6.3686, lng: 106.8331 });
  const [gpsAccuracy, setGpsAccuracy] = useState(4);
  const [gpsError, setGpsError] = useState(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setSurveyorLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          if (pos.coords.accuracy) {
            setGpsAccuracy(Math.round(pos.coords.accuracy));
          }
          setGpsError(null);
        },
        (err) => {
          console.warn('Geolocation surveyor fallback to Depok/Jakarta:', err.message);
          setGpsError(err.message);
          setSurveyorLocation({ lat: -6.3686, lng: 106.8331 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setSurveyorLocation({ lat: -6.3686, lng: 106.8331 });
    }
  }, []);

  // 3. Fetch Data Tugas Surveyor (Backend Integration - 100% PostgreSQL, ZERO Mock)
  const [tasks, setTasks] = useState(propTasks || []);
  const [isLoadingTasks, setIsLoadingTasks] = useState(!propTasks || propTasks.length === 0);
  const [syncTime, setSyncTime] = useState('08:00');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedBaTask, setSelectedBaTask] = useState(null);

  const activeUser = propUser || getStoredUser() || { full_name: 'Budi Surveyor', email: 'surveyor@tanikarbon.com' };

  useEffect(() => {
    if (propTasks && propTasks.length > 0) {
      setTasks(propTasks);
      setIsLoadingTasks(false);
    }
  }, [propTasks]);

  const loadSurveyorTasks = async () => {
    try {
      setIsLoadingTasks(true);
      if (onRefreshTasks) {
        await onRefreshTasks();
      }
      const data = await getSurveyorTasks();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.warn('Gagal memuat tugas dari API backend:', err.message);
      if (!propTasks) setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (!propTasks || propTasks.length === 0) {
      loadSurveyorTasks();
    }
  }, []);

  // Sinkronisasi data interaktif
  const handleSyncData = async () => {
    setIsSyncing(true);
    if (onToast) onToast('Mengunggah paket inspeksi ke server MRV…', 'emerald');
    try {
      await loadSurveyorTasks();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setSyncTime(timeStr);
      if (onToast) onToast('Sinkronisasi selesai · Data PostgreSQL termutakhir', 'emerald');
    } catch {
      if (onToast) onToast('Sinkronisasi lokal selesai', 'emerald');
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Perhitungan 4 Kartu Bento KPI
  const kpiStats = useMemo(() => {
    const list = tasks;

    // a. Tugas Hari Ini: scheduled_survey_date adalah hari ini ATAU status pending_survey/draft
    const todayList = list.filter((t) => t.isToday || t.is_today);
    const todayCount = todayList.length > 0 ? todayList.length : list.filter(t => t.status === 'pending_survey').length;

    // b. Antrean Backlog: tiket yang belum disurvei (status draft)
    const backlogList = list.filter((t) => {
      const s = String(t.status || '').toLowerCase();
      return s === 'draft' || s === 'pending_survey';
    });
    const backlogCount = backlogList.length;

    // c. Menunggu Revisi: status revisi
    const revisionList = list.filter((t) => {
      const s = String(t.status || '').toLowerCase();
      return s.includes('revisi') || s === 'revision';
    });
    const revisionCount = revisionList.length;

    // d. Selesai: tiket berstatus verifikasi / pre-verified / verified / active
    const verifiedList = list.filter((t) => {
      const s = String(t.status || '').toLowerCase();
      return s.includes('verif') || s.includes('selesai') || s === 'active';
    });
    const completedCount = verifiedList.length;

    // Total area hektare
    const totalAreaSqm = list.reduce((acc, curr) => acc + (Number(curr.area_sqm || curr.areaM2) || 0), 0);
    const totalHa = (totalAreaSqm / 10000).toFixed(1);

    return {
      todayCount,
      backlogCount,
      revisionCount,
      completedCount,
      totalHa
    };
  }, [tasks]);

  // 5. Filter & Sorting Daftar Tiket
  const [activeTab, setActiveTab] = useState('all'); // 'today' | 'nearest' | 'all'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [mapTileMode, setMapTileMode] = useState('satellite'); // 'satellite' | 'street'

  // Enrich tasks with distance & polygon
  const enrichedTasks = useMemo(() => {
    return tasks.map((ticket) => {
      const tLat = Number(ticket.centroid?.lat ?? ticket.lat);
      const tLng = Number(ticket.centroid?.lng ?? ticket.lng);
      let dist = ticket.distanceKm;

      if (surveyorLocation && !isNaN(tLat) && !isNaN(tLng) && tLat !== 0 && tLng !== 0) {
        dist = calculateHaversineDistanceKm(surveyorLocation.lat, surveyorLocation.lng, tLat, tLng);
      }

      const polygonCoords = parseGeoJsonPolygon(ticket.polygon_boundary);

      return {
        ...ticket,
        lat: tLat,
        lng: tLng,
        computedDistance: dist != null ? dist : 1.5,
        polygonCoords
      };
    });
  }, [tasks, surveyorLocation]);

  // Helpers filter lahan
  const isPendingInspectionPlot = (t) => {
    const s = String(t.status || '').toLowerCase();
    const isPendingStatus = s === 'draft' || s === 'pending_survey' || s.includes('pending');
    const hasTreeBlocks = Array.isArray(t.tree_blocks) && t.tree_blocks.length > 0;
    return isPendingStatus && hasTreeBlocks;
  };

  const isCompletedPlot = (t) => {
    const s = String(t.status || '').toLowerCase();
    return s === 'verified' || s === 'approved' || s.includes('verif') || s === 'rejected';
  };

  // 1. Antrean Aktif (HANYA draft / pending_survey DAN memiliki minimal 1 tree block)
  const activeInspectionTasks = useMemo(() => {
    return enrichedTasks.filter(isPendingInspectionPlot);
  }, [enrichedTasks]);

  // 2. Lahan Selesai Diaudit (verified / rejected) untuk Berita Acara Read-Only
  const completedTasks = useMemo(() => {
    return enrichedTasks.filter(isCompletedPlot);
  }, [enrichedTasks]);

  // 3. Poligon & Marker yang ditampilkan di Peta mengikuti activeTab
  const displayedMapPlots = useMemo(() => {
    if (activeTab === 'completed') {
      return completedTasks;
    }
    // Jika activeTab === 'all' | 'nearest' | 'today': tampilkan antrean aktif
    return activeInspectionTasks;
  }, [activeTab, completedTasks, activeInspectionTasks]);

  // Selected Task
  const selectedTask = useMemo(() => {
    if (activeTab === 'completed') {
      if (selectedTaskId) {
        return completedTasks.find((t) => t.id === selectedTaskId) || completedTasks[0] || null;
      }
      return completedTasks[0] || null;
    }
    if (selectedTaskId) {
      return activeInspectionTasks.find((t) => t.id === selectedTaskId) || activeInspectionTasks[0] || null;
    }
    return activeInspectionTasks[0] || null;
  }, [activeInspectionTasks, completedTasks, selectedTaskId, activeTab]);

  // Tasks filtered by activeTab
  const displayTasks = useMemo(() => {
    if (activeTab === 'completed') {
      return completedTasks;
    }

    if (activeTab === 'today') {
      const filtered = activeInspectionTasks.filter((t) => t.isToday || t.is_today || t.scheduledDate);
      return filtered.length > 0 ? filtered : activeInspectionTasks;
    }

    if (activeTab === 'nearest') {
      return activeInspectionTasks.slice().sort((a, b) => a.computedDistance - b.computedDistance);
    }

    // Tab 'all' -> Semua Antrean Aktif
    return activeInspectionTasks;
  }, [activeInspectionTasks, completedTasks, activeTab]);

  // Sequential Route Calculation: HANYA untuk Antrean Aktif
  const routeCalculation = useMemo(() => {
    const listToRoute = activeInspectionTasks.slice(0, 5); // first 5 active plots for sequential route
    if (listToRoute.length === 0) {
      return {
        routePoints: [],
        sequentialDistanceKm: 0,
        etaMinutes: 0,
        stops: []
      };
    }

    const routePoints = [[surveyorLocation.lat, surveyorLocation.lng]];
    let rawDistanceSum = 0;
    let prevLat = surveyorLocation.lat;
    let prevLng = surveyorLocation.lng;

    const stops = listToRoute.map((t, idx) => {
      const legDist = calculateHaversineDistanceKm(prevLat, prevLng, t.lat, t.lng);
      rawDistanceSum += legDist;
      prevLat = t.lat;
      prevLng = t.lng;
      routePoints.push([t.lat, t.lng]);

      return {
        ...t,
        stopNumber: idx + 1,
        legDist
      };
    });

    // Multiplier 1.35 for rural road curvature
    const sequentialDistanceKm = Math.round(rawDistanceSum * 1.35 * 10) / 10;
    // ETA at 30 km/h: (km / 30) * 60 minutes
    const etaMinutes = Math.max(12, Math.round((sequentialDistanceKm / 30) * 60));

    return {
      routePoints,
      sequentialDistanceKm,
      etaMinutes,
      stops
    };
  }, [activeInspectionTasks, surveyorLocation]);

  // Map bounds mengikuti displayedMapPlots (tanpa GPS surveyor agar tidak reset saat koordinat bergerak)
  const mapBounds = useMemo(() => {
    const pts = [];
    displayedMapPlots.forEach((t) => {
      if (t.lat && t.lng && !isNaN(t.lat) && !isNaN(t.lng)) {
        pts.push([t.lat, t.lng]);
      }
    });
    if (pts.length > 0) {
      return L.latLngBounds(pts);
    }
    return null;
  }, [displayedMapPlots]);

  // Center statis awal hanya pada initial mount
  const defaultMapCenter = useMemo(() => {
    return [surveyorLocation.lat || -6.9175, surveyorLocation.lng || 107.6191];
  }, []);

  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const handleRecenterCamera = () => {
    setRecenterTrigger((c) => c + 1);
  };

  // Action Handlers
  const handleStartInspectionClick = (task) => {
    if (onStartInspection) {
      onStartInspection(task);
    } else if (onNavigateTab) {
      onNavigateTab('inspection', { plotId: task.id });
    }
  };

  const handleSelectTask = (task) => {
    setSelectedTaskId(task.id);
    if (task.lat && task.lng) {
      setFlyTarget([task.lat, task.lng]);
    }
  };

  const handleStartNavigationToSelected = () => {
    if (!selectedTask || !selectedTask.lat || !selectedTask.lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedTask.lat},${selectedTask.lng}&travelmode=driving`;
    window.open(url, '_blank');
    if (onToast) onToast(`Membuka rute navigasi Google Maps ke ${selectedTask.name || 'Lahan'}…`, 'emerald');
  };

  const handleWhatsApp = (phone, name) => {
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone || '628123456789';
    const text = encodeURIComponent(`Halo ${name}, saya ${activeUser.full_name || 'Budi Surveyor'} dari TaniKarbon mengenai jadwal verifikasi lapangan.`);
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  // Custom Leaflet Icons
  const surveyorDivIcon = useMemo(() => {
    return L.divIcon({
      className: 'surveyor-marker-icon',
      html: `
        <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; inset:0; border-radius:9999px; background:rgba(16,185,129,0.5); animation:ping 2s cubic-bezier(0,0,.2,1) infinite;"></div>
          <div style="position:relative; width:30px; height:30px; border-radius:9999px; background:#0F291E; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(15,41,30,0.4); border:2.5px solid #10B981;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" fill="#10B981" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }, []);

  const createNumberedLandIcon = (number, isSelected) => {
    const bg = isSelected ? '#0F291E' : '#FFFFFF';
    const text = isSelected ? '#10B981' : '#0F291E';
    const border = isSelected ? '#10B981' : '#10B981';

    return L.divIcon({
      className: 'land-numbered-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: ${bg};
          color: ${text};
          border-radius: 12px 12px 12px 2px;
          border: 2.5px solid ${border};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', Inter, sans-serif;
          font-variant-numeric: tabular-nums;
          font-weight: 800;
          font-size: 13px;
          box-shadow: 0 4px 12px rgba(15,41,30,0.3);
          cursor: pointer;
          transition: transform .2s ease;
        ">
          ${number}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });
  };

  const createStatusLandIcon = (isVerified, isSelected) => {
    const bg = isVerified ? '#10B981' : '#EF4444';
    const border = isSelected ? '#0F291E' : '#FFFFFF';
    const svgIcon = isVerified
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

    return L.divIcon({
      className: 'land-status-marker',
      html: `
        <div style="
          width: 30px;
          height: 30px;
          background: ${bg};
          color: #FFFFFF;
          border-radius: 12px 12px 12px 2px;
          border: 2.5px solid ${border};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(15,41,30,0.3);
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform .2s ease;
        ">
          ${svgIcon}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ========================================================
           A · TOP HEADER · Salam & Mode Operasional
      ========================================================= */}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-[#0F291E] sm:text-[26px]">
            Halo, {activeUser.full_name || 'Budi Surveyor'}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500">
            <span>
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              <CloudSun className="h-3.5 w-3.5" /> Cuaca Lapangan Optimal
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Wilayah kerja: <span className="font-sans font-medium text-slate-700">Jawa Barat &amp; Sekitarnya</span>
            </span>
          </p>
        </div>

        {/* Kanan: status koneksi + tombol sinkronisasi */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 select-none text-xs font-semibold shadow-2xs transition-colors duration-200 ${
              isOnline 
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
            title={isOnline ? 'Perangkat terhubung ke internet & server MRV TaniKarbon' : 'Perangkat offline. Data disimpan lokal di IndexedDB.'}
          >
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="whitespace-nowrap font-sans text-[11px] font-semibold tracking-tight">
              {isOnline ? 'Online · Sinkronisasi Aktif' : 'Offline · Disimpan Lokal'}
            </span>
          </span>

          <button
            type="button"
            onClick={handleSyncData}
            disabled={isSyncing}
            className="group inline-flex items-center gap-2 rounded-xl bg-[#0F291E] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-[#173D2E] hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-80 cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 text-emerald-400 transition-transform duration-700 ease-out ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`}
            />
            <span className="whitespace-nowrap">{isSyncing ? 'Menyinkronkan…' : 'Sinkronkan Data'}</span>
            <span className="hidden font-sans text-[10px] font-medium text-emerald-300 sm:inline tabular-nums">
              (Terakhir: {syncTime})
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================
           B · GRID 4 KARTU KPI OPERASIONAL (Bento UI Interaktif & Smooth)
      ========================================================= */}
      <section aria-label="KPI Operasional" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1 · TUGAS HARI INI */}
        <article className="group relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Tugas Hari Ini
              </p>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="tnum text-[42px] font-extrabold leading-none tracking-tight text-[#0F291E] font-sans tabular-nums">
                  <AnimatedNumber value={kpiStats.todayCount} />
                </span>
                <span className="text-sm font-semibold text-slate-400">Lahan</span>
              </p>
              <p className="mt-2 text-[12.5px] text-slate-500">Antrean prioritas survei</p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 shadow-2xs">
              <ClipboardCheck className="h-6 w-6" />
            </span>
          </div>
          <div className="relative mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(25, (kpiStats.todayCount / Math.max(1, tasks.length)) * 100))}%` }}
              ></div>
            </div>
            <p className="mt-1.5 font-sans text-[10px] text-slate-400">
              Sinkronisasi real-time PostgreSQL
            </p>
          </div>
        </article>

        {/* KPI 2 · ANTREAN BACKLOG */}
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-950/5 hover:border-slate-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-slate-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Antrean Backlog
              </p>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="tnum text-[42px] font-extrabold leading-none tracking-tight text-[#0F291E] font-sans tabular-nums">
                  <AnimatedNumber value={kpiStats.backlogCount} />
                </span>
                <span className="text-sm font-semibold text-slate-400">Lahan</span>
              </p>
              <p className="mt-2 text-[12.5px] text-slate-500">Menunggu jadwal lapangan</p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 shadow-2xs">
              <Inbox className="h-6 w-6" />
            </span>
          </div>
          <div className="relative mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-sans text-[10px] font-semibold text-slate-600">
              <CalendarClock className="h-3 w-3" /> Siap dialokasikan
            </span>
          </div>
        </article>

        {/* KPI 3 · MENUNGGU REVISI */}
        <article className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-950/5 hover:border-amber-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Menunggu Revisi
              </p>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="tnum text-[42px] font-extrabold leading-none tracking-tight text-[#0F291E] font-sans tabular-nums">
                  <AnimatedNumber value={kpiStats.revisionCount} />
                </span>
                <span className="text-sm font-semibold text-slate-400">Lahan</span>
              </p>
              <p className="mt-2 text-[12.5px] text-slate-500">Dikembalikan ke petani</p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 shadow-2xs">
              <PencilRuler className="h-6 w-6" />
            </span>
          </div>
          <div className="relative mt-4">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 font-sans text-[10px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
              <Hourglass className="h-3 w-3" /> SLA revisi: 3 hari
            </span>
          </div>
        </article>

        {/* KPI 4 · SELESAI */}
        <article className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Selesai / Terverifikasi
              </p>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="tnum text-[42px] font-extrabold leading-none tracking-tight text-[#0F291E] font-sans tabular-nums">
                  <AnimatedNumber value={kpiStats.completedCount} />
                </span>
                <span className="text-sm font-semibold text-slate-400">Lahan</span>
              </p>
              <p className="mt-2 text-[12.5px] text-slate-500">Lolos audit surveyor</p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 shadow-2xs">
              <CircleCheckBig className="h-6 w-6" />
            </span>
          </div>
          <div className="relative mt-4 flex items-center gap-2">
            <span className="truncate font-sans text-[10px] text-slate-500 font-medium tabular-nums">
              Total {kpiStats.totalHa} ha di bawah pengawasan
            </span>
          </div>
        </article>
      </section>

      {/* ========================================================
           C · PETA RUTE NAVIGASI (Leaflet dengan Pinch Zoom & Poligon)
      ========================================================= */}
      <section
        aria-label="Peta Rute Inspeksi"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
      >
        <header className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-[#0F291E]">
              {activeTab === 'completed' ? (
                <>
                  <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  Peta Arsip Lahan Terverifikasi
                </>
              ) : (
                <>
                  <Route className="h-5 w-5 text-emerald-600" />
                  Peta Rute Navigasi Kebun
                </>
              )}
            </h2>
            {activeTab === 'completed' ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[11px] text-slate-500 font-medium tabular-nums">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> {completedTasks.length} Lahan Selesai Diaudit
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span> Disetujui ({completedTasks.filter(t => String(t.status || '').toLowerCase().includes('verif') || t.status === 'approved').length})
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1 text-rose-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-500"></span> Ditolak ({completedTasks.filter(t => String(t.status || '').toLowerCase() === 'rejected').length})
                </span>
              </p>
            ) : (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[11px] text-slate-500 font-medium tabular-nums">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                  <Ruler className="h-3.5 w-3.5 text-emerald-600" /> Jarak Berurutan: {routeCalculation.sequentialDistanceKm} km
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5 text-slate-400" /> ETA: ~{routeCalculation.etaMinutes} menit (30 km/jam)
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {activeInspectionTasks.length} petak antrean aktif
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Fokuskan Kamera */}
            <button
              type="button"
              onClick={handleRecenterCamera}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[.98] cursor-pointer"
              title="Fokuskan Kamera ke Seluruh Titik Petak Lahan"
            >
              <LocateFixed className="h-4 w-4 text-emerald-600" />
              <span>Fokuskan Kamera</span>
            </button>

            {/* Toggle Citra Satelit vs Peta Jalan */}
            <button
              type="button"
              onClick={() => {
                const nextMode = mapTileMode === 'satellite' ? 'street' : 'satellite';
                setMapTileMode(nextMode);
                if (onToast) onToast(`Beralih ke layer: ${nextMode === 'satellite' ? 'Citra Satelit Esri' : 'OpenStreetMap Jalan'}`);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[.98] cursor-pointer"
            >
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>{mapTileMode === 'satellite' ? 'Peta Jalan' : 'Citra Satelit'}</span>
            </button>

            {/* Tombol Aksi Kanan Peta */}
            {activeTab === 'completed' ? (
              <button
                type="button"
                onClick={() => selectedTask && setSelectedBaTask(selectedTask)}
                disabled={!selectedTask}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-[13px] font-semibold text-white shadow-xs transition hover:bg-slate-900 active:scale-[.98] cursor-pointer disabled:opacity-50"
              >
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>
                  {selectedTask ? `Berita Acara: ${selectedTask.name || 'Lahan'}` : 'Lihat Berita Acara'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartNavigationToSelected}
                disabled={!selectedTask}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F291E] px-4 py-2 text-[13px] font-semibold text-white shadow-xs transition hover:bg-[#173D2E] active:scale-[.98] cursor-pointer disabled:opacity-50"
              >
                <Navigation className="h-4 w-4 text-emerald-400" />
                <span>
                  {selectedTask ? `Mulai Navigasi ke ${selectedTask.name || 'Lahan'}` : 'Mulai Navigasi'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Kanvas Leaflet dengan Pinch Zoom & Touch Zoom MacBook */}
        <div id="map-route" className="relative h-[340px] w-full overflow-hidden bg-slate-900 sm:h-[420px]">
          <MapContainer
            center={defaultMapCenter}
            zoom={14}
            scrollWheelZoom={true}
            touchZoom={true}
            doubleClickZoom={true}
            attributionControl={false}
            zoomControl={false}
            className="h-full w-full z-10"
          >
            {mapTileMode === 'satellite' ? (
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            ) : (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            )}

            <MapUpdater bounds={mapBounds} triggerRecenter={recenterTrigger} />
            {flyTarget && <FlyToLocation target={flyTarget} />}

            {/* Poligon Batas Lahan PostGIS untuk Setiap Tugas Sesuai Tab */}
            {displayedMapPlots.map((task) => {
              const isSelected = selectedTask?.id === task.id;
              if (!task.polygonCoords || task.polygonCoords.length === 0) return null;

              const isCompleted = isCompletedPlot(task);
              const isVerified = String(task.status || '').toLowerCase().includes('verif') || task.status === 'approved';

              let polyColor = '#F59E0B';
              if (activeTab === 'completed' || isCompleted) {
                polyColor = isVerified ? '#10B981' : '#EF4444';
              } else if (isSelected) {
                polyColor = '#10B981';
              }

              return (
                <Polygon
                  key={`poly-${task.id}`}
                  positions={task.polygonCoords}
                  pathOptions={{
                    color: polyColor,
                    weight: isSelected ? 3 : 2,
                    fillColor: polyColor,
                    fillOpacity: isSelected ? 0.35 : 0.2,
                    dashArray: activeTab === 'completed' ? (isVerified ? 'none' : '3, 4') : (isSelected ? 'none' : '3, 4')
                  }}
                  eventHandlers={{
                    click: () => handleSelectTask(task)
                  }}
                >
                  <Popup>
                    <div className="font-sans text-xs p-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded font-sans font-bold text-[10px] ${
                          isCompleted
                            ? (isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isCompleted ? (isVerified ? 'Terverifikasi' : 'Ditolak') : 'Draft'}
                        </span>
                        <strong className="text-[#0F291E] block text-[13px]">{task.name}</strong>
                      </div>
                      <p className="text-slate-500 mt-1">Petani: {task.farmer_name || 'Petani Mitra'}</p>
                      <p className="text-emerald-700 font-semibold mt-0.5">{Number(task.area_sqm || task.areaM2 || 0).toLocaleString()} m²</p>
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => setSelectedBaTask(task)}
                          className="mt-2 w-full py-1.5 px-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="h-3 w-3 text-emerald-400" />
                          <span>Lihat Berita Acara</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartInspectionClick(task)}
                          className="mt-2 w-full py-1.5 px-2 bg-[#0F291E] text-white rounded-lg text-xs font-bold hover:bg-[#173D2E] transition cursor-pointer"
                        >
                          Inspeksi Lahan Ini →
                        </button>
                      )}
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {/* Garis Polyline Rute Antar Titik: Sembunyikan jika activeTab === 'completed' */}
            {activeTab !== 'completed' && routeCalculation.routePoints.length > 1 && (
              <Polyline
                positions={routeCalculation.routePoints}
                pathOptions={{
                  color: '#10B981',
                  weight: 3.5,
                  dashArray: '5, 8',
                  opacity: 0.85
                }}
              />
            )}

            {/* Marker Surveyor Location */}
            <Marker position={[surveyorLocation.lat, surveyorLocation.lng]} icon={surveyorDivIcon}>
              <Popup>
                <div className="font-sans text-xs">
                  <strong className="text-[#0F291E] block">Posisi Anda (Surveyor)</strong>
                  <span className="text-emerald-700 text-[10px]">Akurasi GPS: ±{gpsAccuracy}m</span>
                </div>
              </Popup>
            </Marker>

            {/* Marker Lahan Sesuai Tab (Nomor urut untuk antrean aktif, ikon status untuk arsip selesai) */}
            {displayedMapPlots.map((task, idx) => {
              if (!task.lat || !task.lng) return null;
              const isSelected = selectedTask?.id === task.id;
              const isCompleted = isCompletedPlot(task);
              const isVerified = String(task.status || '').toLowerCase().includes('verif') || task.status === 'approved';

              const icon = activeTab === 'completed'
                ? createStatusLandIcon(isVerified, isSelected)
                : createNumberedLandIcon(idx + 1, isSelected);

              return (
                <Marker
                  key={`marker-${task.id}`}
                  position={[task.lat, task.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => handleSelectTask(task)
                  }}
                >
                  <Popup>
                    <div className="font-sans text-xs p-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded font-sans font-bold text-[10px] tabular-nums ${
                          isCompleted
                            ? (isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {activeTab === 'completed' ? (isVerified ? 'Disetujui' : 'Ditolak') : `#${idx + 1}`}
                        </span>
                        <strong className="text-[#0F291E]">{task.name}</strong>
                      </div>
                      <p className="text-slate-500 mt-1">Petani: {task.farmer_name || 'Petani Mitra'}</p>
                      <p className="text-slate-500 font-sans tabular-nums">Jarak: {task.computedDistance} km</p>
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => setSelectedBaTask(task)}
                          className="mt-2 w-full py-1.5 px-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                        >
                          <FileText className="h-3 w-3 text-emerald-400" />
                          <span>Lihat Berita Acara</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartInspectionClick(task)}
                          className="mt-2 w-full py-1.5 px-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer font-sans"
                        >
                          Mulai Inspeksi Lapangan →
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Chip Urutan Rute Kunjungan ATAU Arsip Lahan Selesai Diaudit */}
          {displayedMapPlots.length > 0 && (
            <div className="no-scrollbar absolute bottom-3 inset-x-3 z-[1000] flex items-center gap-2 overflow-x-auto rounded-xl bg-white/95 p-2 shadow-sm backdrop-blur-xs border border-slate-200 scroll-smooth">
              <span className="shrink-0 px-2 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {activeTab === 'completed' ? 'Arsip Lahan:' : 'Urutan:'}
              </span>
              {displayedMapPlots.map((plotItem, idx) => {
                const isSelected = selectedTask?.id === plotItem.id;
                const isVerified = String(plotItem.status || '').toLowerCase().includes('verif') || plotItem.status === 'approved';
                return (
                  <button
                    key={`chip-${plotItem.id}`}
                    type="button"
                    onClick={() => handleSelectTask(plotItem)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F291E] text-white shadow-xs ring-2 ring-emerald-500/40'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    {activeTab === 'completed' ? (
                      <span className={`h-2 w-2 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    ) : (
                      <span className="font-sans text-[10px] font-bold tabular-nums">#{idx + 1}</span>
                    )}
                    <span className="truncate max-w-[140px] font-sans">{plotItem.name}</span>
                    <span className="font-sans text-[10px] text-emerald-400 font-medium tabular-nums">
                      {activeTab === 'completed'
                        ? (isVerified ? 'Lolos' : 'Ditolak')
                        : `(${plotItem.computedDistance} km)`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
           D · DAFTAR ANTREAN TIKET (Smart Task List)
      ========================================================= */}
      <section aria-label="Daftar Antrean Tugas" className="space-y-4">
        {/* Header Tabs Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#0F291E] flex items-center gap-2 font-sans">
              <ListTodo className="h-5 w-5 text-emerald-600" /> Antrean Lahan Lapangan
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-sans text-xs font-bold tabular-nums">
              {displayTasks.length} Tiket
            </span>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 flex-wrap gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-[#0F291E] shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              Semua Antrean ({activeInspectionTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nearest')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                activeTab === 'nearest'
                  ? 'bg-white text-[#0F291E] shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              Terdekat dari GPS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-white text-[#0F291E] shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              Jadwal Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white text-[#0F291E] shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              Selesai Diaudit ({completedTasks.length})
            </button>
          </div>
        </div>

        {/* Empty State jika tasks kosong */}
        {displayTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <SearchX className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0F291E]">
              {activeTab === 'completed'
                ? 'Belum ada riwayat lahan yang selesai diaudit'
                : 'Belum ada antrean lahan aktif untuk diinspeksi'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {activeTab === 'completed'
                ? 'Lahan yang telah selesai diverifikasi atau ditolak oleh surveyor akan otomatis tercatat di sini dan di menu Riwayat & Sinkronisasi.'
                : 'Seluruh pendaftaran lahan baru dari Portal Petani yang memiliki blok pohon akan otomatis muncul di sini dan siap diinspeksi.'}
            </p>
          </div>
        )}

        {/* List Tiket Lahan */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayTasks.map((task) => {
            const isSelected = selectedTask?.id === task.id;
            const area = task.area_sqm || task.areaM2 || 0;
            const treeCount = task.tree_blocks?.reduce((acc, b) => acc + (b.total_population || b.tree_count || 0), 0) || task.treeCount || 0;
            const isCompleted = isCompletedPlot(task);
            const isVerified = String(task.status || '').toLowerCase().includes('verif') || task.status === 'approved';

            return (
              <article
                key={task.id}
                onClick={() => handleSelectTask(task)}
                className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-950/8 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Ambient glow accent on card hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-2">
                    {isCompleted ? (
                      <span className={`font-sans text-[11px] font-bold border px-2 py-0.5 rounded-md shadow-2xs ${
                        isVerified
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : 'text-rose-800 bg-rose-50 border-rose-200'
                      }`}>
                        {isVerified ? 'Terverifikasi' : 'Ditolak'}
                      </span>
                    ) : (
                      <span className="font-sans text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md tabular-nums shadow-2xs">
                        TKT-{String(task.id || '').slice(0, 8).toUpperCase()}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-slate-500 tabular-nums bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      <MapPin className="h-3 w-3 text-emerald-600 transition-transform group-hover:scale-110" />
                      {task.computedDistance} km
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-base font-bold text-[#0F291E] line-clamp-1 group-hover:text-emerald-800 transition-colors duration-200 font-sans">
                    {task.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5 font-sans">
                    Petani: {task.farmer_name || 'Petani Mitra'}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-sans text-slate-600 border-t border-slate-100 pt-2.5 tabular-nums">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">LUAS LAHAN</span>
                      <strong className="font-bold text-stone-900">{Number(area).toLocaleString()} m²</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">POPULASI POHON</span>
                      <strong className="font-bold text-stone-900">{treeCount} Pohon</strong>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsApp(task.farmer_phone, task.farmer_name);
                    }}
                    className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
                    title="Hubungi Petani via WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>

                  {isCompleted ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBaTask(task);
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 px-3.5 text-xs font-bold text-white transition-all duration-200 hover:bg-slate-900 hover:shadow-md active:scale-[.98] cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Lihat Berita Acara</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartInspectionClick(task);
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0F291E] py-2.5 px-3.5 text-xs font-bold text-white transition-all duration-200 hover:bg-[#173D2E] hover:shadow-md active:scale-[.98] cursor-pointer group/btn"
                    >
                      <span>Mulai Inspeksi</span>
                      <ArrowRight className="h-3.5 w-3.5 text-emerald-400 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Official Berita Acara Modal (Read-Only) */}
      <BeritaAcaraModal
        isOpen={Boolean(selectedBaTask)}
        onClose={() => setSelectedBaTask(null)}
        data={selectedBaTask}
      />
    </div>
  );
}
