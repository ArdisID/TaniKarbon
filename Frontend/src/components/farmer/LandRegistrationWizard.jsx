import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as turf from '@turf/turf';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Satellite,
  Check,
  ClipboardList,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Plus,
  Minus,
  Crosshair,
  PenTool,
  Hand,
  Undo2,
  Trash2,
  Info,
  X,
  Loader2,
  Send,
  CheckCheck,
  Sparkles,
  LockOpen,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { registerLandPlot, validateLandPolygon, getSpatialOverlay } from '../../api/farmer';

// Contoh koordinat default (Jawa Barat / Agroforestri)
const DEFAULT_CENTER = [-6.3688, 106.8334];
// Area contoh sengaja berada di zona kosong agar tidak menabrak petak terverifikasi.
const SAMPLE_POLYGON_POINTS = [
  [-6.54990, 107.04990],
  [-6.54990, 107.05010],
  [-6.55010, 107.05010],
  [-6.55010, 107.04990]
];
const SAMPLE_POLYGON_CENTER = [-6.5500, 107.0500];
const MIN_AREA_SQM = 100;
const MAX_AREA_SQM = 150000;
const DOCUMENT_REQUIRED_AREA_SQM = 20000;
const DOCUMENT_REQUIRED_OWNERSHIPS = ['milik sendiri (shm)', 'hgu / perkebunan'];

const EMPTY_POLYGON_VALIDATION = {
  status: 'idle', // 'idle' | 'validating' | 'valid' | 'error'
  message: '',
  areaSqm: 0,
  conflict: null
};

function parseBoundaryToLeafletRings(boundary) {
  if (!boundary) return [];
  let geo = boundary;
  if (typeof geo === 'string') {
    try {
      geo = JSON.parse(geo);
    } catch {
      return [];
    }
  }
  if (!geo || typeof geo !== 'object') return [];

  const ringToLatLng = (ring) => (Array.isArray(ring) ? ring.map(([lng, lat]) => [lat, lng]) : []);
  if (geo.type === 'Polygon') {
    return [ringToLatLng(geo.coordinates?.[0])];
  }
  if (geo.type === 'MultiPolygon') {
    return (geo.coordinates || []).map((poly) => ringToLatLng(poly?.[0]));
  }
  if (geo.type === 'Feature' && geo.geometry) {
    return parseBoundaryToLeafletRings(geo.geometry);
  }
  return [];
}

// Helper Leaflet Map Controller
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Leaflet Click Event Handler untuk Menggambar Poligon
function MapDrawHandler({ tool, onAddPoint, onFirstPointClick, points, isClosed }) {
  useMapEvents({
    click(e) {
      if (tool !== 'draw') return;
      if (isClosed) return;

      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));

      // Jika sudah >= 3 titik dan klik dekat titik awal -> tutup poligon
      if (points.length >= 3) {
        const [firstLat, firstLng] = points[0];
        const dist = Math.hypot(lat - firstLat, lng - firstLng);
        if (dist < 0.0006) {
          onFirstPointClick();
          return;
        }
      }

      onAddPoint([lat, lng]);
    }
  });
  return null;
}

export default function LandRegistrationWizard({
  onComplete,
  onSaveDraft,
  onToast,
  onNavigateTab
}) {
  const navigate = useNavigate();

  // Helper untuk membaca draft tersimpan secara sinkron saat mount
  const getInitialDraft = () => {
    try {
      const saved = localStorage.getItem('draft_land_registration');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn('Gagal membaca draft_land_registration dari localStorage:', e);
    }
    return null;
  };

  // Wizard Step State (1, 2, 3) - Sinkron langsung dari localStorage agar kebal refresh
  const [currentStep, setCurrentStep] = useState(() => {
    const d = getInitialDraft();
    return (d?.currentStep && d.currentStep >= 1 && d.currentStep <= 3) ? d.currentStep : 1;
  });

  // Form Data State
  const [formData, setFormData] = useState(() => {
    const d = getInitialDraft();
    return {
      name: d?.name || '',
      ownership: d?.ownership || '',
      document_no: d?.document_no || '',
      village: d?.village || '',
      regency: d?.regency || '',
      geojson: d?.geojson || null,
      calculated_area_sqm: d?.calculated_area_sqm || 0
    };
  });

  // Step 2 (GIS) States
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite' | 'vector'
  const [activeTool, setActiveTool] = useState('draw'); // 'draw' | 'pan'
  const [vertices, setVertices] = useState(() => {
    const d = getInitialDraft();
    return Array.isArray(d?.vertices) ? d.vertices : [];
  });
  const [isPolygonClosed, setIsPolygonClosed] = useState(() => {
    const d = getInitialDraft();
    return Boolean(d?.isPolygonClosed && d?.polygonValidation?.status === 'valid');
  });
  const [mapCenter, setMapCenter] = useState(() => {
    const d = getInitialDraft();
    return (Array.isArray(d?.vertices) && d.vertices[0]) ? d.vertices[0] : DEFAULT_CENTER;
  });
  const [mapZoom, setMapZoom] = useState(17);
  const [isLocating, setIsLocating] = useState(false);
  const [isClosingPolygon, setIsClosingPolygon] = useState(false);

  // Validasi pre-flight backend (ST_IsValid, luas, anti-overlap PostGIS)
  const [polygonValidation, setPolygonValidation] = useState(() => {
    const d = getInitialDraft();
    if (d?.polygonValidation?.status === 'valid') {
      return {
        ...EMPTY_POLYGON_VALIDATION,
        ...d.polygonValidation
      };
    }
    return EMPTY_POLYGON_VALIDATION;
  });

  // Layer referensi petak aktif (nama petani lain disamarkan backend)
  const [overlayZones, setOverlayZones] = useState([]);
  const [isOverlayLoading, setIsOverlayLoading] = useState(false);

  // Step 3 (Confirmation & MRV) States
  const [agreePhysical, setAgreePhysical] = useState(false);
  const [agreeMrv, setAgreeMrv] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local Toast notification (success | error | warning)
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);
  const showLocalToast = (title, subtitle = '', type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ title, subtitle, type });
    if (onToast) onToast(subtitle ? `${title}: ${subtitle}` : title, type);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, type === 'error' ? 5500 : 4000);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // Simpan Draft ke LocalStorage setiap kali ada perubahan formData/vertices/step
  useEffect(() => {
    const isTouched = formData.name || formData.ownership || formData.document_no || formData.village || vertices.length > 0;
    if (!isTouched) return;

    try {
      const draftPayload = {
        ...formData,
        vertices,
        isPolygonClosed,
        polygonValidation,
        currentStep
      };
      localStorage.setItem('draft_land_registration', JSON.stringify(draftPayload));
    } catch (err) {
      console.warn('Gagal menyimpan draft_land_registration ke localStorage:', err);
    }
  }, [formData, vertices, isPolygonClosed, polygonValidation, currentStep]);

  // Muat layer referensi petak aktif saat masuk Step 2 (anti-overlap visual)
  useEffect(() => {
    if (currentStep !== 2) return undefined;

    let cancelled = false;
    setIsOverlayLoading(true);
    getSpatialOverlay()
      .then((data) => {
        if (!cancelled) {
          setOverlayZones(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Gagal memuat layer referensi spasial:', err);
          setOverlayZones([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsOverlayLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentStep]);

  // Kalkulasi Geometri via Turf.js
  const spatialMetrics = useMemo(() => {
    if (vertices.length < 3) {
      return {
        areaSqm: 0,
        areaHa: '0,00',
        perimeterM: '0,00',
        centroid: '—',
        isValidClosed: false
      };
    }

    try {
      const ringCoords = vertices.map(([lat, lon]) => [lon, lat]);
      const [firstLng, firstLat] = ringCoords[0];
      const [lastLng, lastLat] = ringCoords[ringCoords.length - 1];

      if (firstLng !== lastLng || firstLat !== lastLat) {
        ringCoords.push([firstLng, firstLat]);
      }

      const poly = turf.polygon([ringCoords]);
      const area = turf.area(poly);
      const perimeter = turf.length(poly, { units: 'meters' });
      const centroid = turf.centroid(poly);
      const cLon = centroid.geometry.coordinates[0].toFixed(5);
      const cLat = centroid.geometry.coordinates[1].toFixed(5);

      return {
        areaSqm: Math.round(area * 100) / 100,
        areaHa: (area / 10000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        perimeterM: perimeter.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        centroid: `${cLat}, ${cLon}`,
        isValidClosed: isPolygonClosed || vertices.length >= 4,
        ringCoords
      };
    } catch (err) {
      console.warn('Turf calculation warning:', err);
      return {
        areaSqm: 0,
        areaHa: '0,00',
        perimeterM: '0,00',
        centroid: '—',
        isValidClosed: false
      };
    }
  }, [vertices, isPolygonClosed]);

  // Sinkronisasi otomatis ke formData saat poligon terbentuk
  useEffect(() => {
    if (vertices.length >= 3 && spatialMetrics.areaSqm > 0) {
      const ring = vertices.map(([lat, lon]) => [lon, lat]);
      ring.push([vertices[0][1], vertices[0][0]]);

      const geojsonObj = {
        type: 'Polygon',
        coordinates: [ring]
      };

      setFormData(prev => ({
        ...prev,
        geojson: geojsonObj,
        calculated_area_sqm: spatialMetrics.areaSqm
      }));
    } else if (vertices.length < 3) {
      setFormData(prev => ({
        ...prev,
        geojson: null,
        calculated_area_sqm: 0
      }));
    }
  }, [vertices, spatialMetrics.areaSqm]);

  const buildPolygonGeoJSON = (points = vertices) => {
    const ring = points.map(([lat, lng]) => [lng, lat]);
    if (ring.length > 0) {
      ring.push([ring[0][0], ring[0][1]]);
    }
    return { type: 'Polygon', coordinates: [ring] };
  };

  // Setiap perubahan geometri membatalkan validasi & membuka kunci poligon
  const invalidatePolygonValidation = () => {
    setPolygonValidation(EMPTY_POLYGON_VALIDATION);
    setIsPolygonClosed(false);
  };

  const rejectPolygon = (message, conflict = null, areaSqm = 0) => {
    setPolygonValidation({
      status: 'error',
      message,
      areaSqm,
      conflict
    });
    setIsPolygonClosed(false);
    showLocalToast('Poligon Ditolak', message, 'error');
  };

  // Menambahkan titik ke poligon (unlimited, minimal 3 titik)
  const handleAddPoint = (point) => {
    if (isPolygonClosed) return;
    invalidatePolygonValidation();
    setVertices(prev => [...prev, point]);
  };

  // Menutup poligon: cek turf (kinks + luas) lalu validasi backend PostGIS
  const handleClosePolygon = async () => {
    if (isClosingPolygon) return;
    if (vertices.length < 3) {
      showLocalToast('Titik kurang', 'Minimal 3 titik sudut untuk membentuk bidang poligon.', 'error');
      return;
    }

    const geojson = buildPolygonGeoJSON();
    let localArea = 0;
    try {
      const polygonFeature = turf.polygon(geojson.coordinates);
      const kinks = turf.kinks(polygonFeature);
      if (kinks?.features?.length > 0) {
        rejectPolygon(
          'Garis batas poligon saling menyilang (self-intersection). Perbaiki titik sudut sebelum mengunci poligon.',
          null,
          localArea
        );
        return;
      }

      localArea = turf.area(polygonFeature);
      if (localArea < MIN_AREA_SQM) {
        rejectPolygon(
          `Luas poligon (${localArea.toFixed(2)} m²) di bawah batas minimal pendaftaran per petak (Minimal 0,01 Ha / 100 m²).`,
          null,
          localArea
        );
        return;
      }
      if (localArea > MAX_AREA_SQM) {
        rejectPolygon(
          `Luas poligon (${(localArea / 10000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ha) melebihi batas maksimal pendaftaran per petak (Maksimal 15,00 Ha).`,
          null,
          localArea
        );
        return;
      }
    } catch (geometryError) {
      console.warn('Pemeriksaan geometri turf gagal:', geometryError);
      rejectPolygon('Geometri poligon tidak dapat dihitung. Periksa kembali titik batas lahan.', null, localArea);
      return;
    }

    setIsClosingPolygon(true);
    setPolygonValidation({ ...EMPTY_POLYGON_VALIDATION, status: 'validating' });

    try {
      const result = await validateLandPolygon(geojson);
      if (!result?.valid) {
        rejectPolygon(
          result?.message || 'Poligon ditolak oleh validasi spasial backend.',
          result?.conflicting_plot || null,
          Number(result?.area_sqm) || localArea
        );
        return;
      }

      const verifiedArea = Number(result.area_sqm) || localArea;
      setPolygonValidation({
        status: 'valid',
        message: result.message || 'Poligon valid dan bebas tumpang-tindih.',
        areaSqm: verifiedArea,
        conflict: null
      });
      setIsPolygonClosed(true);
      setActiveTool('pan');
      setFormData(prev => ({
        ...prev,
        geojson,
        calculated_area_sqm: verifiedArea
      }));
      showLocalToast(
        'Poligon terkunci & valid',
        `Luas ${(verifiedArea / 10000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ha, bebas tumpang-tindih.`
      );
    } catch (validationError) {
      console.warn('Validasi poligon backend gagal:', validationError);
      rejectPolygon(
        validationError.message || 'Gagal menghubungi validasi spasial backend. Periksa koneksi lalu coba lagi.',
        null,
        localArea
      );
    } finally {
      setIsClosingPolygon(false);
    }
  };

  // Hapus titik terakhir
  const handleUndoVertex = () => {
    if (vertices.length === 0) return;
    invalidatePolygonValidation();
    setVertices(prev => prev.slice(0, -1));
  };

  // Reset semua titik
  const handleResetVertices = () => {
    invalidatePolygonValidation();
    setVertices([]);
    setFormData(prev => ({ ...prev, geojson: null, calculated_area_sqm: 0 }));
    showLocalToast('Atur ulang', 'Seluruh titik poligon telah dihapus.', 'warning');
  };

  // Hapus titik tertentu
  const handleRemoveSpecificVertex = (index) => {
    invalidatePolygonValidation();
    setVertices(prev => prev.filter((_, i) => i !== index));
  };

  // Geser titik saat poligon tidak terkunci
  const handleMoveVertex = (index, lat, lng) => {
    if (isPolygonClosed) return;
    invalidatePolygonValidation();
    setVertices(prev => prev.map((point, i) => (i === index ? [lat, lng] : point)));
  };

  // Buka kunci poligon untuk edit ulang titik
  const handleUnlockPolygon = () => {
    invalidatePolygonValidation();
    setActiveTool('draw');
    showLocalToast(
      'Buka Kunci Poligon',
      'Titik batas dapat digeser atau diedit. Klik "Tutup & Kunci Poligon" untuk validasi ulang.',
      'warning'
    );
  };

  // Muat poligon contoh (1-klik untuk kemudahan pengujian QA)
  const handleLoadSamplePolygon = () => {
    invalidatePolygonValidation();
    setVertices(SAMPLE_POLYGON_POINTS);
    setMapCenter(SAMPLE_POLYGON_CENTER);
    setMapZoom(18);
    setActiveTool('draw');
    showLocalToast(
      'Contoh dimuat',
      'Poligon contoh berada di area kosong. Klik "Tutup & Kunci Poligon" untuk validasi PostGIS.',
      'warning'
    );
  };

  // GPS Lokasi Petani
  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const current = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(current);
          setMapZoom(18);
          showLocalToast('GPS Terkunci', `${current[0].toFixed(5)}, ${current[1].toFixed(5)}`);
        },
        () => {
          setIsLocating(false);
          setMapCenter(DEFAULT_CENTER);
          showLocalToast('GPS Diarahkan', 'Menggunakan titik koordinat demo.');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLocating(false);
      setMapCenter(DEFAULT_CENTER);
    }
  };

  // Validasi Step Navigasi & dokumen hak berjenjang
  const requiresDocumentByOwnership = DOCUMENT_REQUIRED_OWNERSHIPS.includes(
    formData.ownership.trim().toLowerCase()
  );
  const hasDocumentNumber = formData.document_no.trim().length > 0;
  const requiresDocumentByArea =
    formData.calculated_area_sqm > DOCUMENT_REQUIRED_AREA_SQM && !hasDocumentNumber;
  const isStep1Valid =
    formData.name.trim().length > 0 &&
    formData.ownership.trim().length > 0 &&
    (!requiresDocumentByOwnership || hasDocumentNumber);
  const isStep2Valid =
    isPolygonClosed &&
    polygonValidation.status === 'valid' &&
    vertices.length >= 3 &&
    formData.geojson !== null &&
    !requiresDocumentByArea;
  const isStep3Valid = agreePhysical && agreeMrv;

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.ownership.trim()) {
        showLocalToast('Lengkapi Data', 'Nama petak kebun dan status kepemilikan wajib diisi.', 'error');
        return;
      }
      if (requiresDocumentByOwnership && !hasDocumentNumber) {
        showLocalToast(
          'Dokumen Wajib',
          `Nomor Dokumen / Bukti Hak wajib diisi untuk status kepemilikan "${formData.ownership}".`,
          'error'
        );
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!isPolygonClosed || vertices.length < 3 || polygonValidation.status !== 'valid') {
        showLocalToast(
          'Tutup & Validasi Poligon Wajib',
          'Silakan klik tombol "⚡ Tutup & Kunci Poligon" hingga status poligon valid sebelum melanjutkan.',
          'error'
        );
        return;
      }
      if (requiresDocumentByArea) {
        showLocalToast(
          'Dokumen Wajib',
          'Luas lahan di atas 2,00 Ha wajib menyertakan Nomor Dokumen / Surat Keterangan Desa. Lengkapi di Step 1.',
          'error'
        );
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 3: Submission ke API POST /api/v1/farmer/lands
  const handleSubmitRegistration = async () => {
    if (!isStep3Valid) {
      showLocalToast('Persetujuan Wajib', 'Centang kedua kotak persetujuan MRV terlebih dahulu.', 'error');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        ownership: formData.ownership,
        document_no: formData.document_no || null,
        village: formData.village || null,
        regency: formData.regency || null,
        status: 'draft',
        polygon_boundary: formData.geojson,
        geojson_polygon: JSON.stringify(formData.geojson)
      };

      let apiResponse = null;
      try {
        apiResponse = await registerLandPlot(payload);
      } catch (err) {
        console.error('Gagal menyimpan pendaftaran lahan:', err);
        const errMsg = err.message || 'Gagal mendaftarkan petak lahan ke sistem.';
        showLocalToast('Pendaftaran Lahan Ditolak', errMsg, 'error');
        setIsSubmitting(false);
        return;
      }

      // Hapus localStorage HANYA jika proses submit ke API berhasil
      localStorage.removeItem('draft_land_registration');

      showLocalToast('Lahan berhasil didaftarkan', 'Poligon tersimpan di PostGIS dan masuk antrean audit.');

      // Bentuk data lengkap dengan nilai default yang aman agar tidak memicu bug "reduce undefined"
      const completedPlot = {
        id: apiResponse?.id || 'land-' + Date.now(),
        name: formData.name,
        ownership: formData.ownership,
        village: formData.village || 'Sukamaju',
        regency: formData.regency || 'Bogor',
        document_no: formData.document_no || '-',
        areaM2: formData.calculated_area_sqm,
        areaHa: parseFloat((formData.calculated_area_sqm / 10000).toFixed(2)),
        centroidCoords: spatialMetrics.centroid,
        species: 'Pohon Agroforestri',
        totalTrees: 0,
        estimatedAbsorption: parseFloat(((formData.calculated_area_sqm * 0.0018)).toFixed(2)),
        farmerNetRevenue: Math.round(formData.calculated_area_sqm * 0.0018 * 160000 * 0.88),
        status: 'draft',
        samples: [],
        treeBlocks: [],
        submittedDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      // Reset form state setelah submit sukses
      setFormData({
        name: '',
        ownership: '',
        document_no: '',
        village: '',
        regency: '',
        geojson: null,
        calculated_area_sqm: 0
      });
      setVertices([]);
      setIsPolygonClosed(false);
      setPolygonValidation(EMPTY_POLYGON_VALIDATION);

      if (onComplete) {
        try {
          onComplete(completedPlot);
        } catch (e) {
          console.warn('Peringatan onComplete handler:', e);
        }
      }

      if (onNavigateTab) {
        try {
          onNavigateTab('land');
        } catch (e) {
          console.warn('Peringatan onNavigateTab handler:', e);
        }
      }

      // Eksekusi navigasi mulus ke Manajemen Lahan
      navigate('/mitra-tani/manajemen-lahan');
      window.history.pushState({}, '', '/mitra-tani/manajemen-lahan');

    } catch (error) {
      console.error('Error saat pendaftaran lahan:', error);
      showLocalToast('Kesalahan Sistem', error.message || 'Gagal mengirim pendaftaran.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom Div Icons untuk Marker Vertex
  const createVertexIcon = (index, isFirst, isCloser) => {
    if (isFirst) {
      return L.divIcon({
        className: 'custom-vertex-first',
        html: `<div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                 <span style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(16, 185, 129, 0.45); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                 <span style="position: relative; width: 16px; height: 16px; border-radius: 9999px; background: #0F291E; border: 2px solid #10B981; color: white; font-family: monospace; font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">1</span>
               </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
    }

    return L.divIcon({
      className: 'custom-vertex-marker',
      html: `<div style="width: 15px; height: 15px; border-radius: 9999px; background: ${isCloser ? '#10B981' : '#0B1D16'}; border: 2px solid #10B981; color: ${isCloser ? '#0F291E' : '#6EE7B7'}; font-family: monospace; font-size: 8px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.4);">${index + 1}</div>`,
      iconSize: [15, 15],
      iconAnchor: [7.5, 7.5]
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 font-sans text-stone-800 antialiased">
      
      {/* ============================================================
           HEADER & STEPPER INDICATOR
         ============================================================ */}
      <header className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Satellite className="h-3 w-3" />
              Wizard Pendaftaran · 3 Langkah
            </span>

            <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-stone-900 sm:text-3xl">
              Daftarkan Lahan &amp; Geofencing
            </h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-500">
              Lengkapi identitas kebun dan petakan batas poligon menggunakan citra satelit PostGIS.
            </p>
          </div>
        </div>

        {/* Stepper Bar (3 Node Progress) */}
        <div className="mt-6 mb-2 flex items-center justify-between" aria-label="Progres pendaftaran lahan">
          {/* Node 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex min-w-0 flex-col items-center gap-1.5 text-center transition group focus:outline-none"
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-mono text-xs font-bold transition shadow-xs ${
                currentStep > 1
                  ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50'
                  : currentStep === 1
                  ? 'bg-[#0F291E] text-white ring-4 ring-emerald-50'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              {currentStep > 1 ? <Check className="h-5 w-5" /> : '1'}
            </span>
            <span
              className={`truncate text-[11px] transition ${
                currentStep === 1
                  ? 'font-bold text-stone-900'
                  : currentStep > 1
                  ? 'font-medium text-emerald-700'
                  : 'font-medium text-stone-400'
              }`}
            >
              Informasi Dasar
            </span>
          </button>

          {/* Garis progres 1 -> 2 */}
          <div
            className={`mx-2 h-1 flex-1 rounded-full transition-colors duration-300 ${
              currentStep >= 2 ? 'bg-[#0F291E]' : 'bg-stone-200'
            }`}
          />

          {/* Node 2 */}
          <button
            type="button"
            onClick={() => {
              if (isStep1Valid) setCurrentStep(2);
            }}
            className="flex min-w-0 flex-col items-center gap-1.5 text-center transition group focus:outline-none"
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-mono text-xs font-bold transition shadow-xs ${
                currentStep > 2
                  ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50'
                  : currentStep === 2
                  ? 'bg-[#0F291E] text-white ring-4 ring-emerald-50'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              {currentStep > 2 ? <Check className="h-5 w-5" /> : '2'}
            </span>
            <span
              className={`truncate text-[11px] transition ${
                currentStep === 2
                  ? 'font-bold text-stone-900'
                  : currentStep > 2
                  ? 'font-medium text-emerald-700'
                  : 'font-medium text-stone-400'
              }`}
            >
              Pemetaan Spasial
            </span>
          </button>

          {/* Garis progres 2 -> 3 */}
          <div
            className={`mx-2 h-1 flex-1 rounded-full transition-colors duration-300 ${
              currentStep >= 3 ? 'bg-[#0F291E]' : 'bg-stone-200'
            }`}
          />

          {/* Node 3 */}
          <button
            type="button"
            onClick={() => {
              if (isStep1Valid && isStep2Valid) setCurrentStep(3);
            }}
            className="flex min-w-0 flex-col items-center gap-1.5 text-center transition group focus:outline-none"
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-mono text-xs font-bold transition shadow-xs ${
                currentStep === 3
                  ? 'bg-[#0F291E] text-white ring-4 ring-emerald-50'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              3
            </span>
            <span
              className={`truncate text-[11px] transition ${
                currentStep === 3 ? 'font-bold text-stone-900' : 'font-medium text-stone-400'
              }`}
            >
              Konfirmasi &amp; MRV
            </span>
          </button>
        </div>
      </header>

      {/* ============================================================
           STEP 1: INFORMASI DASAR LAHAN
         ============================================================ */}
      {currentStep === 1 && (
        <section className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs sm:p-6 space-y-6 animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight text-stone-900">Informasi Dasar Lahan</h2>
              <p className="mt-0.5 text-xs text-stone-500">Nama petak, alamat/lokasi administratif, dan status kepemilikan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="s1-name" className="mb-1.5 block text-xs font-semibold text-stone-700">
                Nama Petak Kebun <span className="text-red-500">*</span>
              </label>
              <input
                id="s1-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mis. Kebun Sengon Blok Timur"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 transition focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
              />
            </div>

            <div>
              <label htmlFor="s1-village" className="mb-1.5 block text-xs font-semibold text-stone-700">
                Desa / Kelurahan
              </label>
              <input
                id="s1-village"
                name="village"
                type="text"
                value={formData.village}
                onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                placeholder="Mis. Sukamaju"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 transition focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
              />
            </div>

            <div>
              <label htmlFor="s1-regency" className="mb-1.5 block text-xs font-semibold text-stone-700">
                Kabupaten / Kota
              </label>
              <input
                id="s1-regency"
                name="regency"
                type="text"
                value={formData.regency}
                onChange={(e) => setFormData(prev => ({ ...prev, regency: e.target.value }))}
                placeholder="Mis. Bogor"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 transition focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
              />
            </div>

            <div>
              <label htmlFor="s1-ownership" className="mb-1.5 block text-xs font-semibold text-stone-700">
                Status Kepemilikan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="s1-ownership"
                  name="ownership"
                  value={formData.ownership}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownership: e.target.value }))}
                  className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-3.5 pr-9 text-sm text-stone-800 transition focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
                >
                  <option value="">Pilih Status Kepemilikan</option>
                  <option value="Milik Sendiri (SHM)">Milik Sendiri (SHM)</option>
                  <option value="Sewa / Bagi Hasil">Sewa / Bagi Hasil</option>
                  <option value="Lahan Adat / Komunal">Lahan Adat / Komunal</option>
                  <option value="HGU / Perkebunan">HGU / Perkebunan</option>
                  <option value="Girik / Letter C">Girik / Letter C</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              </div>
            </div>

            <div>
              <label htmlFor="s1-document" className="mb-1.5 block text-xs font-semibold text-stone-700">
                Nomor Dokumen / Bukti Hak{' '}
                {requiresDocumentByOwnership ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-stone-400 font-normal">(Opsional)</span>
                )}
              </label>
              <input
                id="s1-document"
                name="document_no"
                type="text"
                required={requiresDocumentByOwnership}
                value={formData.document_no}
                onChange={(e) => setFormData(prev => ({ ...prev, document_no: e.target.value }))}
                placeholder={requiresDocumentByOwnership ? 'Wajib: mis. SHM No. 0412' : 'Mis. SHM No. 0412 / SPPT PBB (Opsional)'}
                className={`w-full rounded-xl border bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 transition focus:bg-white focus:outline-none focus:ring-1 ${
                  requiresDocumentByOwnership && !hasDocumentNumber
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-stone-200 focus:border-emerald-600 focus:ring-emerald-600/30'
                }`}
              />
              {requiresDocumentByOwnership && (
                <p className="mt-1 text-[10px] font-medium text-rose-600">
                  Wajib untuk status kepemilikan {formData.ownership}. Lahan &gt; 2,00 Ha juga wajib dokumen.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              disabled={!isStep1Valid}
              onClick={nextStep}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F291E] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#14382C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              <span>Lanjut ke Pemetaan</span>
              <ArrowRight className="h-4 w-4 text-emerald-400" />
            </button>
          </div>
        </section>
      )}

      {/* ============================================================
           STEP 2: PEMETAAN SPASIAL (GIS Canvas & Leaflet Draw)
         ============================================================ */}
      {currentStep === 2 && (
        <section className="space-y-6 animate-fade-in" aria-label="Langkah 2 · Pemetaan Spasial">
          
          {/* ---- KARTU A: KANVAS PETA INTERAKTIF ---- */}
          <article className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-xs">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight text-stone-900">Petak Batas Poligon</h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Klik pada citra satelit untuk menambahkan titik batas. Minimal 3 titik, klik titik awal untuk menutup poligon.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSamplePolygon}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 cursor-pointer shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Muat Poligon Contoh</span>
                </button>
                <span className="shrink-0 rounded-md bg-stone-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-stone-600">
                  SRID: 4326
                </span>
              </div>
            </header>

            {/* Viewport Peta Leaflet */}
            <div className="relative h-[400px] w-full overflow-hidden bg-[#0B1D16] sm:h-[460px]">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                zoomControl={false}
                className="h-full w-full"
                style={{ cursor: activeTool === 'draw' ? 'crosshair' : 'grab' }}
              >
                <MapViewController center={mapCenter} zoom={mapZoom} />

                {/* Layer Satelit / Vektor */}
                {mapLayer === 'satellite' ? (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Esri World Imagery"
                    maxZoom={19}
                  />
                ) : (
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                    maxZoom={19}
                  />
                )}

                {/* Layer referensi petak aktif (privacy-safe dari backend) */}
                {overlayZones.map((zone) =>
                  parseBoundaryToLeafletRings(zone.polygon_boundary).map((ring, ringIndex) =>
                    ring.length >= 3 ? (
                      <Polygon
                        key={`overlay-${zone.id}-${ringIndex}`}
                        positions={ring}
                        pathOptions={{
                          color: zone.is_own_land ? '#38BDF8' : '#FB7185',
                          weight: 2,
                          dashArray: zone.is_own_land ? '6 4' : '3 5',
                          fillColor: zone.is_own_land ? '#38BDF8' : '#FB7185',
                          fillOpacity: 0.12,
                          interactive: false
                        }}
                      />
                    ) : null
                  )
                )}

                {/* Drawing Event Handler */}
                <MapDrawHandler
                  tool={activeTool}
                  onAddPoint={handleAddPoint}
                  onFirstPointClick={handleClosePolygon}
                  points={vertices}
                  isClosed={isPolygonClosed}
                />

                {/* Poligon yang digambar */}
                {vertices.length >= 3 && (
                  <Polygon
                    positions={vertices}
                    pathOptions={{
                      color: '#10B981',
                      weight: 2.5,
                      fillColor: '#10B981',
                      fillOpacity: isPolygonClosed ? 0.35 : 0.2
                    }}
                  />
                )}

                {/* Garis bantu saat titik masih < 3 atau belum tertutup */}
                {vertices.length >= 2 && !isPolygonClosed && (
                  <Polyline
                    positions={vertices}
                    pathOptions={{
                      color: '#10B981',
                      weight: 2,
                      dashArray: '5, 5'
                    }}
                  />
                )}

                {/* Marker Vertex Titik-titik Poligon */}
                {vertices.map((pt, idx) => {
                  const isFirst = idx === 0;
                  const isCloser = idx === vertices.length - 1 && isPolygonClosed;
                  return (
                    <Marker
                      key={`v-${idx}-${pt[0]}-${pt[1]}`}
                      position={pt}
                      icon={createVertexIcon(idx, isFirst, isCloser)}
                      draggable={!isPolygonClosed}
                      eventHandlers={{
                        click: () => {
                          if (isFirst && !isPolygonClosed && vertices.length >= 3) {
                            handleClosePolygon();
                          }
                        },
                        dragend: (event) => {
                          const next = event?.target?.getLatLng?.();
                          if (next) {
                            handleMoveVertex(
                              idx,
                              parseFloat(next.lat.toFixed(5)),
                              parseFloat(next.lng.toFixed(5))
                            );
                          }
                        }
                      }}
                    />
                  );
                })}
              </MapContainer>

              {/* Floating control: Layer Switcher (Kiri Atas) */}
              <div className="absolute left-3 top-3 z-[400] flex items-center gap-1 rounded-xl bg-black/60 p-1 text-[11px] text-white backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setMapLayer('satellite')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    mapLayer === 'satellite' ? 'bg-emerald-600 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Satelit
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayer('vector')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    mapLayer === 'vector' ? 'bg-emerald-600 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Vektor GIS
                </button>
              </div>

              {/* Legend layer referensi */}
              <div className="pointer-events-none absolute left-3 top-14 z-[400] rounded-xl bg-black/65 px-2.5 py-2 text-[10px] text-white shadow-md backdrop-blur-md space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-t-2 border-dashed border-sky-400" />
                  <span>Petak Anda</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-t-2 border-dashed border-rose-400" />
                  <span>Zona Terdaftar (petani lain)</span>
                </div>
                {isOverlayLoading && <p className="text-white/60">Memuat referensi…</p>}
              </div>

              {/* Floating control: Status Badge / Action Button (Tengah Atas) */}
              {vertices.length >= 3 && !isPolygonClosed ? (
                <button
                  type="button"
                  onClick={handleClosePolygon}
                  disabled={isClosingPolygon}
                  className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2 z-[400] inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-70 disabled:cursor-wait px-4 py-1.5 font-sans text-xs font-bold text-white shadow-lg ring-4 ring-amber-400/40 animate-pulse transition cursor-pointer"
                >
                  {isClosingPolygon ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  )}
                  <span>
                    {isClosingPolygon
                      ? 'Memvalidasi PostGIS…'
                      : '⚡ Klik untuk Tutup & Kunci Poligon (Wajib)'}
                  </span>
                </button>
              ) : isPolygonClosed ? (
                <button
                  type="button"
                  onClick={handleUnlockPolygon}
                  className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2 z-[400] inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 font-sans text-xs font-bold text-white shadow-lg ring-4 ring-emerald-400/30 transition cursor-pointer"
                >
                  <LockOpen className="h-3.5 w-3.5" />
                  <span>🔓 Buka Kunci / Edit Ulang Titik</span>
                </button>
              ) : (
                <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 z-[400] rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-md">
                  {activeTool === 'draw' ? 'Mode Gambar Aktif' : 'Mode Navigasi Peta'}
                </div>
              )}

              {/* Floating control: Zoom & GPS (Kanan Atas) */}
              <div className="absolute right-3 top-3 z-[400] flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-md shadow-md">
                <button
                  type="button"
                  onClick={() => setMapZoom(prev => Math.min(prev + 1, 19))}
                  aria-label="Perbesar"
                  className="grid h-8 w-8 place-items-center text-white transition hover:bg-white/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="h-px w-full bg-white/10" />
                <button
                  type="button"
                  onClick={() => setMapZoom(prev => Math.max(prev - 1, 12))}
                  aria-label="Perkecil"
                  className="grid h-8 w-8 place-items-center text-white transition hover:bg-white/10 cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="h-px w-full bg-white/10" />
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  title="Pusatkan ke GPS Saya"
                  className="grid h-8 w-8 place-items-center text-emerald-400 transition hover:bg-white/10 cursor-pointer"
                >
                  <Crosshair className={`h-4 w-4 ${isLocating ? 'animate-spin text-white' : ''}`} />
                </button>
              </div>

              {/* Floating toolbar: Alat Gambar (Kiri Bawah) */}
              <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-1 rounded-xl bg-black/60 p-1 backdrop-blur-md shadow-md">
                <button
                  type="button"
                  onClick={() => setActiveTool('draw')}
                  title="Alat Gambar Poligon"
                  className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                    activeTool === 'draw' ? 'bg-emerald-600 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('pan')}
                  title="Alat Geser Peta"
                  className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                    activeTool === 'pan' ? 'bg-emerald-600 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Hand className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleUndoVertex}
                  title="Batalkan Titik Terakhir"
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/70 transition hover:text-white hover:bg-white/10"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetVertices}
                  title="Hapus Seluruh Poligon"
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/70 transition hover:text-red-400 hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Kompas & Skala (Kanan Bawah) */}
              <div className="absolute bottom-3 right-3 z-[400] flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-black/60 px-2.5 py-1.5 font-mono text-[10px] text-white backdrop-blur-md shadow-md">
                  <span className="relative block h-[3px] w-10 bg-white/80">
                    <span className="absolute -left-0.5 -top-1 block h-2.5 w-[2px] bg-white/80" />
                    <span className="absolute -right-0.5 -top-1 block h-2.5 w-[2px] bg-white/80" />
                  </span>
                  50 m
                </div>
              </div>
            </div>

            {/* Footer Kanvas: Ringkasan Spasial Real-time (Turf.js) */}
            <div className="grid grid-cols-2 gap-3 border-t border-stone-100 bg-stone-50/70 p-4 sm:grid-cols-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Jumlah Titik</p>
                <p className="mt-1 font-mono text-sm font-bold text-stone-900">{vertices.length} Titik Batas</p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Luas (ST_Area)</p>
                <p className="mt-1 font-mono text-sm font-bold text-emerald-700">
                  {spatialMetrics.areaHa} Ha{' '}
                  <span className="text-[11px] font-medium text-stone-500">
                    ({Math.round(spatialMetrics.areaSqm).toLocaleString('id-ID')} m²)
                  </span>
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Keliling</p>
                <p className="mt-1 font-mono text-sm font-bold text-stone-900">{spatialMetrics.perimeterM} m</p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Status Geometri</p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    polygonValidation.status === 'error'
                      ? 'text-rose-700'
                      : isPolygonClosed && polygonValidation.status === 'valid'
                      ? 'text-emerald-700'
                      : polygonValidation.status === 'validating'
                      ? 'text-sky-700'
                      : vertices.length >= 3
                      ? 'text-amber-700'
                      : 'text-stone-500'
                  }`}
                >
                  {polygonValidation.status === 'error'
                    ? 'Poligon Ditolak — Perbaiki Titik'
                    : isPolygonClosed && polygonValidation.status === 'valid'
                    ? 'Poligon Valid (Terkunci)'
                    : polygonValidation.status === 'validating'
                    ? 'Memvalidasi PostGIS…'
                    : vertices.length >= 3
                    ? 'Siap Divalidasi (Klik Tutup Poligon)'
                    : 'Belum Cukup Titik (Min. 3)'}
                </p>
              </div>
            </div>
          </article>

          {/* ---- DAFTAR TITIK BATAS (Bersih, Responsif, Tanpa Limit) ---- */}
          <article className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-tight text-stone-900">Daftar Titik Batas Poligon</h2>
                <p className="mt-0.5 text-xs text-stone-500">Koordinat titik sudut batas lahan (SRID 4326).</p>
              </div>

              <div className="flex items-center gap-2">
                {vertices.length >= 3 && !isPolygonClosed && (
                  <button
                    type="button"
                    onClick={handleClosePolygon}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-2 shadow-lg ring-4 ring-amber-400/40 animate-pulse transition cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                    <span>⚡ Klik untuk Tutup &amp; Kunci Poligon (Wajib)</span>
                  </button>
                )}
                {isPolygonClosed && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 border border-emerald-300 px-3 py-1.5 font-sans text-xs font-bold text-emerald-800">
                    <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                    <span>✓ Poligon Terkunci &amp; Valid</span>
                  </span>
                )}
                {isPolygonClosed && (
                  <button
                    type="button"
                    onClick={handleUnlockPolygon}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 font-sans text-xs font-bold text-stone-700 transition hover:bg-stone-50 cursor-pointer"
                  >
                    <LockOpen className="h-3.5 w-3.5 text-emerald-700" />
                    <span>🔓 Buka Kunci / Edit Ulang Titik</span>
                  </button>
                )}
                <span className="shrink-0 rounded-md bg-stone-100 px-2.5 py-1 font-mono text-[11px] font-bold text-stone-700">
                  {vertices.length} Titik Batas
                </span>
              </div>
            </div>

            {vertices.length === 0 ? (
              <div className="grid h-28 place-items-center rounded-2xl border border-dashed border-stone-200 text-center p-4">
                <p className="text-xs text-stone-400">
                  Belum ada titik poligon. Klik pada citra satelit atau klik <strong>"Muat Poligon Contoh"</strong> untuk mengisi titik otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {vertices.map((v, i) => {
                    const isFirst = i === 0;
                    const isLast = i === vertices.length - 1;
                    const isCloser = isLast && isPolygonClosed;

                    return (
                      <li
                        key={`list-${i}`}
                        className="flex items-center justify-between gap-2 rounded-xl border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`grid h-5 w-5 place-items-center rounded-md font-mono text-[10px] font-bold ${
                              isFirst
                                ? 'bg-[#0F291E] text-white'
                                : isCloser
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="font-mono text-[11px] text-stone-700">
                            {v[0].toFixed(5)}, {v[1].toFixed(5)}
                          </span>
                        </span>

                        {isCloser ? (
                          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Tutup
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecificVertex(i)}
                            className="text-stone-400 transition hover:text-red-600 p-1"
                            title="Hapus titik ini"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleUndoVertex}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition cursor-pointer"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    <span>Hapus Titik Terakhir</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetVertices}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Semua</span>
                  </button>
                </div>
              </div>
            )}
          </article>

          {/* Action Bar Step 2 */}
          <div className="space-y-3 pt-2">
            {polygonValidation.status === 'error' && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-900 shadow-xs" role="alert">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <p className="font-bold">Poligon ditolak — belum dikunci</p>
                  <p className="mt-1 font-medium leading-relaxed">{polygonValidation.message}</p>
                  {polygonValidation.conflict && (
                    <p className="mt-1 font-mono text-[10px] text-rose-700">
                      Konflik: {polygonValidation.conflict.name} · {polygonValidation.conflict.status}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px] font-semibold text-rose-700">
                    Poligon tetap terbuka. Geser/edit titik batas lalu klik "Tutup &amp; Kunci Poligon" kembali.
                  </p>
                </div>
              </div>
            )}

            {requiresDocumentByArea && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-900 shadow-xs" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="font-medium">
                  <strong>Dokumen wajib:</strong> luas lahan melebihi 2,00 Ha. Kembali ke Step 1 dan isi{' '}
                  <strong>Nomor Dokumen / Surat Keterangan Desa</strong> sebelum melanjutkan.
                </p>
              </div>
            )}

            {vertices.length >= 3 && !isPolygonClosed && polygonValidation.status !== 'error' && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-xs">
                <span className="text-amber-600 font-bold text-base shrink-0">⚠️</span>
                <p className="font-medium">
                  <strong>Perhatian:</strong> Silakan klik tombol <strong>"⚡ Klik untuk Tutup &amp; Kunci Poligon (Wajib)"</strong> terlebih dahulu sebelum melanjutkan ke Step 3.
                </p>
              </div>
            )}

            {isPolygonClosed && polygonValidation.status === 'valid' && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 shadow-xs">
                <Check className="h-4 w-4 shrink-0 text-emerald-700 stroke-[3]" />
                <p className="font-medium">
                  <strong>Poligon tervalidasi PostGIS:</strong> {polygonValidation.message}
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 shadow-xs transition hover:bg-stone-50 cursor-pointer active:scale-[0.99]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke Informasi Dasar</span>
              </button>

              <button
                type="button"
                disabled={!isStep2Valid}
                onClick={nextStep}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
              >
                <span>Lanjut ke Konfirmasi &amp; MRV</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
           STEP 3: KONFIRMASI & MRV
         ============================================================ */}
      {currentStep === 3 && (
        <section className="space-y-6 animate-fade-in" aria-label="Langkah 3 · Konfirmasi & MRV">
          
          {/* Ringkasan Data Lahan */}
          <article className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0F291E] text-emerald-400">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight text-stone-900">Konfirmasi Data Lahan</h2>
                <p className="mt-0.5 text-xs text-stone-500">Periksa kembali sebelum dikirim ke antrean audit satelit.</p>
              </div>
            </div>

            <dl className="divide-y divide-stone-100">
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">Nama Petak</dt>
                <dd className="text-right text-sm font-bold text-stone-900">{formData.name || 'Kebun Sengon Blok Timur'}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">Status Kepemilikan</dt>
                <dd className="text-right text-sm font-semibold text-stone-800">{formData.ownership || 'Milik Sendiri (SHM)'}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">Nomor Dokumen Hak</dt>
                <dd className="text-right font-mono text-sm font-semibold text-stone-700">{formData.document_no || 'Tidak dilampirkan'}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">Lokasi Administratif</dt>
                <dd className="text-right text-sm font-semibold text-stone-900">
                  {formData.village || 'Sukamaju'}, {formData.regency || 'Bogor'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">Luas Poligon (ST_Area)</dt>
                <dd className="text-right font-mono text-sm font-bold text-emerald-700">
                  {Math.round(formData.calculated_area_sqm).toLocaleString('id-ID')} m²{' '}
                  <span className="text-stone-500 font-normal">
                    ({(formData.calculated_area_sqm / 10000).toFixed(2)} Ha)
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">Titik Batas</dt>
                <dd className="text-right font-mono text-sm font-semibold text-stone-900">
                  {vertices.length} Titik (Poligon Tertutup)
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">Centroid PostGIS</dt>
                <dd className="text-right font-mono text-sm font-semibold text-stone-800">{spatialMetrics.centroid}</dd>
              </div>
            </dl>
          </article>

          {/* Estimasi Awal MRV */}
          <article className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight text-stone-900">Estimasi Awal MRV</h2>
                <p className="mt-0.5 text-xs text-stone-500">Proyeksi serapan karbon awal sebelum inspeksi lapangan.</p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                Belum Final
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Estimasi Serapan</p>
                <p className="mt-1.5 font-mono text-xl font-bold leading-none text-[#0F291E]">
                  {(formData.calculated_area_sqm * 0.0018).toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-stone-500">tCO₂e / tahun</p>
              </div>
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Blok Tanaman</p>
                <p className="mt-1.5 font-mono text-xl font-bold leading-none text-stone-900">0 Blok</p>
                <p className="mt-1 text-[11px] text-stone-500">Ditambah setelah lahan terdaftar</p>
              </div>
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Target Audit</p>
                <p className="mt-1.5 font-mono text-xl font-bold leading-none text-stone-900">14 Hari</p>
                <p className="mt-1 text-[11px] text-stone-500">Sejak pengajuan disubmit</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-xs text-stone-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
              <p>
                Estimasi serapan akan dihitung otomatis oleh <em>backend</em> FastAPI (alometrik Chave Tier-3) setelah Anda menambahkan data blok tanaman pada petak lahan ini.
              </p>
            </div>
          </article>

          {/* 2 Checkbox Persetujuan MRV (Syarat Wajib Submit) */}
          <article className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Pernyataan &amp; Persetujuan MRV</h3>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-100 p-3 hover:bg-stone-50 transition">
              <input
                type="checkbox"
                checked={agreePhysical}
                onChange={(e) => setAgreePhysical(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-emerald-600 transition focus:ring-emerald-600/30 cursor-pointer"
              />
              <span className="text-xs leading-relaxed text-stone-700">
                Saya menyatakan bahwa batas poligon yang digambar sesuai dengan kondisi fisik lahan dan dokumen hak kepemilikan yang sah.
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-100 p-3 hover:bg-stone-50 transition">
              <input
                type="checkbox"
                checked={agreeMrv}
                onChange={(e) => setAgreeMrv(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-emerald-600 transition focus:ring-emerald-600/30 cursor-pointer"
              />
              <span className="text-xs leading-relaxed text-stone-700">
                Saya menyetujui pemantauan geospasial Sentinel-2 secara berkala dan inspeksi verifikasi lapangan oleh surveyor independen.
              </span>
            </label>
          </article>

          {/* Bar Aksi Step 3 */}
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 shadow-xs transition hover:bg-stone-50 cursor-pointer active:scale-[0.99]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Pemetaan</span>
            </button>

            <button
              type="button"
              disabled={!isStep3Valid || isSubmitting}
              onClick={handleSubmitRegistration}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F291E] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#173D2E] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span>Mengirimkan ke PostGIS...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-emerald-400" />
                  <span>Kirim Pendaftaran Lahan</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* Footer Info PostGIS */}
      <p className="pt-4 text-center font-mono text-[10px] text-stone-400">
        TaniKarbon · Portal Mitra Petani — geometri pendaftaran tersinkron dengan basis data spasial PostGIS (SRID 4326)
      </p>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div
          role={toastMessage.type === 'error' ? 'alert' : 'status'}
          className={`fixed bottom-6 right-6 z-[60] flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl animate-fade-in ${
            toastMessage.type === 'error'
              ? 'border-rose-300'
              : toastMessage.type === 'warning'
              ? 'border-amber-300'
              : 'border-stone-200'
          }`}
        >
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-600'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            {toastMessage.type === 'error' ? (
              <XCircle className="h-[18px] w-[18px]" />
            ) : toastMessage.type === 'warning' ? (
              <AlertTriangle className="h-[18px] w-[18px]" />
            ) : (
              <CheckCheck className="h-[18px] w-[18px]" />
            )}
          </span>
          <div className="min-w-0">
            <p className={`text-sm font-bold ${
              toastMessage.type === 'error'
                ? 'text-rose-900'
                : toastMessage.type === 'warning'
                ? 'text-amber-900'
                : 'text-stone-900'
            }`}>{toastMessage.title}</p>
            {toastMessage.subtitle && (
              <p className={`mt-0.5 text-xs ${
                toastMessage.type === 'error'
                  ? 'text-rose-700'
                  : toastMessage.type === 'warning'
                  ? 'text-amber-700'
                  : 'text-stone-500'
              }`}>{toastMessage.subtitle}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
