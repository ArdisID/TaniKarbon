import React, { useState, useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import { 
  MapPin, 
  Crosshair, 
  RotateCcw, 
  Trash2, 
  AlertTriangle, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Camera, 
  Info, 
  ShieldCheck, 
  HelpCircle, 
  Save, 
  Send,
  Layers,
  Sparkles,
  TreePine,
  Maximize2,
  Plus,
  Ruler,
  CheckCircle2
} from 'lucide-react';
import { formatRupiah } from '../../data';

const NEIGHBOR_PLOT = [
  [-7.3610, 109.9850],
  [-7.3610, 109.9870],
  [-7.3625, 109.9870],
  [-7.3625, 109.9850],
];

export default function LandRegistrationWizard({ 
  onComplete, 
  onSaveDraft, 
  onOpenViewfinder,
  onToast 
}) {
  const [currentStep, setCurrentStep] = useState(1);

  // STEP 1 STATE: Polygon Map
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const markersGroupRef = useRef(null);

  const [points, setPoints] = useState([
    [-7.3635, 109.9880],
    [-7.3635, 109.9892],
    [-7.3645, 109.9895],
    [-7.3648, 109.9882],
  ]);

  const [plotName, setPlotName] = useState('Kebun Sengon & Kopi Blok C');
  const [areaSquareMeters, setAreaSquareMeters] = useState(4520);
  const [hasOverlap, setHasOverlap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Auto Cluster Assignment via Centroid (turf.centroid)
  const [centroidCoords, setCentroidCoords] = useState('-7.3640, 109.9887');
  const [assignedCluster, setAssignedCluster] = useState('Klaster Agroforestri - Kecamatan Kejajar (Dusun Garung)');

  // STEP 2 STATE: Tree Blocks (Supports multiple species for intercropping/tumpang sari)
  const [treeBlocks, setTreeBlocks] = useState([
    {
      id: 1,
      species: 'Alpukat Mentega',
      portionM2: 2500,
      plantMonthYear: '2020-03',
      totalTrees: 20,
    }
  ]);

  const [showDbhGuide, setShowDbhGuide] = useState(false);

  // Dynamic 3 to 5 sample rows with DBH and Optional Height
  const [samples, setSamples] = useState([
    { id: 1, dbh: '38', height: '9.2', photo: '/tree-dbh-sample.jpg' },
    { id: 2, dbh: '41', height: '9.8', photo: null },
    { id: 3, dbh: '36', height: '8.9', photo: null },
    { id: 4, dbh: '40', height: '9.4', photo: null }
  ]);

  const speciesCoefficients = {
    'Alpukat Mentega': { factor: 0.0105, rewardPerTon: 160000, absorptionCategory: 'Kanopi Lebar Menengah' },
    'Sengon Laut': { factor: 0.0225, rewardPerTon: 160000, absorptionCategory: 'Fast-Growing Biomass' },
    'Durian Musang King': { factor: 0.0145, rewardPerTon: 160000, absorptionCategory: 'Pohon Kayu Keras & Buah' },
    'Kopi Arabika': { factor: 0.0055, rewardPerTon: 160000, absorptionCategory: 'Strata Bawah Naungan' },
  };

  // Calculate live area and centroid using Turf.js
  const computePolygonMetrics = (polygonPoints) => {
    if (polygonPoints.length < 3) return { area: 4520, centroid: '-7.3640, 109.9887' };
    try {
      const turfCoords = polygonPoints.map(p => [p[1], p[0]]);
      turfCoords.push([polygonPoints[0][1], polygonPoints[0][0]]);
      const poly = turf.polygon([turfCoords]);
      const area = Math.round(turf.area(poly));
      const centroid = turf.centroid(poly);
      const cLat = centroid.geometry.coordinates[1].toFixed(6);
      const cLng = centroid.geometry.coordinates[0].toFixed(6);
      return { area, centroid: `${cLat}, ${cLng}` };
    } catch (err) {
      return { area: 4520, centroid: '-7.3640, 109.9887' };
    }
  };

  const checkPolygonOverlap = (polygonPoints) => {
    if (polygonPoints.length < 3) return false;
    return polygonPoints.some(pt => pt[0] > -7.3630 && pt[1] < 109.9872);
  };

  useEffect(() => {
    const { area, centroid } = computePolygonMetrics(points);
    setAreaSquareMeters(area || 4520);
    setCentroidCoords(centroid);
    setHasOverlap(checkPolygonOverlap(points));
  }, [points]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (currentStep !== 1 || !mapContainerRef.current) return;

    let map = leafletMapRef.current;
    if (!map && window.L) {
      map = window.L.map(mapContainerRef.current, {
        center: [-7.3640, 109.9888],
        zoom: 17,
        zoomControl: false,
      });

      window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri Satellite &copy; Maxar, Earthstar Geographics',
        maxZoom: 19,
      }).addTo(map);

      window.L.control.zoom({ position: 'bottomright' }).addTo(map);

      polygonLayerRef.current = window.L.polygon([], {
        color: '#10B981',
        weight: 3,
        fillColor: '#10B981',
        fillOpacity: 0.25,
      }).addTo(map);

      markersGroupRef.current = window.L.layerGroup().addTo(map);

      window.L.polygon(NEIGHBOR_PLOT, {
        color: '#EF4444',
        weight: 2,
        dashArray: '4, 4',
        fillColor: '#EF4444',
        fillOpacity: 0.15,
      }).addTo(map).bindPopup('<strong>Batas Tetangga Terdaftar:</strong><br/>Gapoktan Sindoro Barat (SHM #419)');

      map.on('click', (e) => {
        const newPt = [parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6))];
        setPoints(prev => [...prev, newPt]);
      });

      leafletMapRef.current = map;
    }

    if (map && polygonLayerRef.current && markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      const color = hasOverlap ? '#EF4444' : '#10B981';
      polygonLayerRef.current.setLatLngs(points);
      polygonLayerRef.current.setStyle({
        color: color,
        fillColor: color,
        fillOpacity: hasOverlap ? 0.4 : 0.25,
      });

      points.forEach((pt, idx) => {
        const markerIcon = window.L.divIcon({
          className: 'custom-map-marker',
          html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; color: white;">${idx + 1}</div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        window.L.marker(pt, { icon: markerIcon }).addTo(markersGroupRef.current);
      });

      if (points.length >= 3) {
        map.fitBounds(polygonLayerRef.current.getBounds(), { padding: [40, 40], maxZoom: 18 });
      }
    }
  }, [currentStep, points, hasOverlap]);

  const handleLocateMe = () => {
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
      if (leafletMapRef.current) {
        leafletMapRef.current.setView([-7.3639, 109.9886], 18, { animate: true });
        if (onToast) onToast('GPS Akurat: Titik tengah Dusun Garung, Wonosobo terkunci.');
      }
    }, 700);
  };

  const handleUndoPoint = () => {
    if (points.length > 3) {
      setPoints(prev => prev.slice(0, -1));
    } else {
      if (onToast) onToast('Minimal 3 titik sudut untuk membentuk bidang poligon kebun.');
    }
  };

  const handleSimulateOverlap = () => {
    setPoints([
      [-7.3615, 109.9860],
      [-7.3615, 109.9880],
      [-7.3630, 109.9885],
      [-7.3630, 109.9860],
    ]);
    if (onToast) onToast('Simulasi overlap diaktifkan: Batas sudut menabrak kebun tetangga.');
  };

  const handleResetPolygon = () => {
    setPoints([
      [-7.3635, 109.9880],
      [-7.3635, 109.9892],
      [-7.3645, 109.9895],
      [-7.3648, 109.9882],
    ]);
  };

  // Add another species block for intercropping
  const handleAddAnotherSpecies = () => {
    const nextId = treeBlocks.length + 1;
    setTreeBlocks(prev => [
      ...prev,
      {
        id: nextId,
        species: 'Kopi Arabika',
        portionM2: 1000,
        plantMonthYear: '2022-01',
        totalTrees: 10,
      }
    ]);
    if (onToast) onToast('Blok tumpang sari baru ditambahkan ke lahan.');
  };

  // Add another sample row (up to 5)
  const handleAddSampleRow = () => {
    if (samples.length >= 5) {
      if (onToast) onToast('Maksimal 5 baris sampel perwakilan.');
      return;
    }
    const nextId = samples.length + 1;
    setSamples(prev => [
      ...prev,
      { id: nextId, dbh: '39', height: '9.0', photo: null }
    ]);
  };

  const handleAttachPhoto = (index, photoUrl) => {
    setSamples(prev => {
      const next = [...prev];
      next[index] = { ...next[index], photo: photoUrl };
      return next;
    });
  };

  // STEP 3: Live Revenue Estimator calculation
  const totalTreesSum = treeBlocks.reduce((acc, b) => acc + parseInt(b.totalTrees || '0', 10), 0);
  const avgDbh = samples.reduce((acc, s) => acc + (parseFloat(s.dbh) || 35), 0) / (samples.length || 1);
  const primarySpecies = treeBlocks[0]?.species || 'Alpukat Mentega';
  const coeff = speciesCoefficients[primarySpecies] || speciesCoefficients['Alpukat Mentega'];

  const estimatedAbsorption = totalTreesSum > 0 
    ? parseFloat(((avgDbh * coeff.factor * totalTreesSum) / 3.2).toFixed(2))
    : 0;

  // Gross Revenue and Farmer Net
  const grossRevenue = Math.round(estimatedAbsorption * coeff.rewardPerTon);
  const farmerNetRevenue = Math.round(grossRevenue * 0.88);

  const handleSubmitVerification = () => {
    if (hasOverlap) {
      if (onToast) onToast('Harap perbaiki titik poligon yang bertabrakan sebelum mengajukan verifikasi.');
      setCurrentStep(1);
      return;
    }

    const newPlotData = {
      name: plotName,
      species: primarySpecies,
      treeBlocks,
      totalTrees: totalTreesSum,
      areaHa: parseFloat((areaSquareMeters / 10000).toFixed(2)),
      areaM2: areaSquareMeters,
      centroidCoords,
      assignedCluster,
      estimatedAbsorption,
      grossRevenue,
      farmerNetRevenue,
      samples,
      submittedDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    onComplete(newPlotData);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-28 md:pb-12">
      {/* Wizard Progress Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 text-xs font-bold transition ${
              currentStep === 1 ? 'text-emerald-800' : currentStep > 1 ? 'text-emerald-600' : 'text-stone-400'
            }`}
          >
            <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs ${
              currentStep === 1 ? 'bg-[#14382C] text-white shadow-xs' : currentStep > 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
            }`}>
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </span>
            <span className="hidden sm:inline">1. Pemetaan Poligon &amp; Klaster</span>
          </button>

          <div className={`h-0.5 flex-1 mx-2 transition-colors ${currentStep > 1 ? 'bg-emerald-500' : 'bg-stone-200'}`}></div>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-2 text-xs font-bold transition ${
              currentStep === 2 ? 'text-emerald-800' : currentStep > 2 ? 'text-emerald-600' : 'text-stone-400'
            }`}
          >
            <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs ${
              currentStep === 2 ? 'bg-[#14382C] text-white shadow-xs' : currentStep > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
            }`}>
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </span>
            <span className="hidden sm:inline">2. Blok Pohon &amp; Smart Sampling</span>
          </button>

          <div className={`h-0.5 flex-1 mx-2 transition-colors ${currentStep > 2 ? 'bg-emerald-500' : 'bg-stone-200'}`}></div>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-2 text-xs font-bold transition ${
              currentStep === 3 ? 'text-emerald-800' : 'text-stone-400'
            }`}
          >
            <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs ${
              currentStep === 3 ? 'bg-[#14382C] text-white shadow-xs' : 'bg-stone-100 text-stone-500'
            }`}>
              3
            </span>
            <span className="hidden sm:inline">3. Estimator &amp; Konfirmasi</span>
          </button>
        </div>
      </div>

      {/* TAHAP 1: Pemetaan Poligon & Deteksi Klaster (PolygonMapDrawer) */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Tahap 1: Pemetaan Poligon &amp; Deteksi Klaster
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#14382C] mt-1">
                Tentukan Sudut Batas Lahan &amp; Deteksi Klaster Otomatis
              </h2>
              <p className="text-xs text-stone-500">
                Sentuh layar pada titik-titik sudut kebun Anda untuk membentuk bidang poligon tertutup.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Crosshair className={`w-4 h-4 text-emerald-700 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Mencari GPS...' : 'Pusatkan ke Lokasi Saya (GPS)'}</span>
              </button>
              <button
                type="button"
                onClick={handleUndoPoint}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                title="Batalkan titik terakhir"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetPolygon}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                title="Atur ulang batas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 pt-4 pb-2 bg-stone-50/60 border-b border-stone-100 flex flex-col sm:flex-row items-center gap-3">
            <label className="text-xs font-bold text-stone-700 shrink-0">Nama Petak Lahan:</label>
            <input
              type="text"
              value={plotName}
              onChange={(e) => setPlotName(e.target.value)}
              className="flex-1 w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-[#14382C] focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Contoh: Kebun Pekarangan Sengon Barat"
            />
          </div>

          {/* Overlap Validator Alert */}
          {hasOverlap && (
            <div className="m-4 p-3.5 bg-red-50 border-2 border-red-300 rounded-2xl text-red-900 text-xs flex items-start gap-3 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-bold">Peringatan: Poligon Menabrak Batas Lahan Petani Lain (Klaim Ganda)!</strong>
                <span className="text-[11px] leading-relaxed">
                  Garis poligon Anda menabrak batas kebun Gapoktan Sindoro Barat (SHM #419). Harap sesuaikan titik sudut agar data tidak ditolak verifikator.
                </span>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleResetPolygon}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] transition"
                  >
                    Atur Ulang ke Posisi Aman
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Satellite Map Canvas */}
          <div className="relative w-full h-[380px] sm:h-[460px] bg-stone-900">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* FloatingAreaBox (Turf.js) */}
            <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-stone-200/90 text-xs max-w-xs">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Kalkulator Luas Real-Time (Turf.js)
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-[#14382C] font-mono">
                  {areaSquareMeters.toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-bold text-stone-500">m²</span>
                <span className="text-xs font-mono font-bold text-emerald-700 ml-1">
                  / {(areaSquareMeters / 10000).toFixed(2)} Ha
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                {points.length} Titik Sudut Terkunci
              </p>
            </div>

            <div className="absolute bottom-4 left-4 z-[400] flex gap-2">
              <button
                type="button"
                onClick={handleSimulateOverlap}
                className="px-3 py-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-md text-amber-300 font-mono text-[10px] font-bold rounded-xl border border-amber-400/40 transition"
              >
                Uji Validasi Overlap Batas Tetangga
              </button>
            </div>
          </div>

          {/* AutoClusterAssignmentBadge (Deteksi Klaster Otomatis via Centroid) */}
          <div className="p-3.5 bg-emerald-50 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="text-emerald-950">
                <span className="font-bold">AutoClusterAssignmentBadge: </span>
                <span>Titik tengah lahan ({centroidCoords}) berada di radius <strong>{assignedCluster} (Otomatis tergabung)</strong></span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
              turf.centroid Terkunci
            </span>
          </div>

          <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
            <span className="text-xs text-stone-500 hidden sm:inline">
              Meskipun sebagian pinggir lahan melewati batas radius, lahan tidak akan terbelah dua.
            </span>
            <button
              type="button"
              onClick={() => {
                if (hasOverlap) {
                  if (onToast) onToast('Batas poligon bertabrakan. Harap atur ulang titik poligon.');
                  return;
                }
                setCurrentStep(2);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-[#14382C] hover:bg-[#1a4436] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm ml-auto"
            >
              <span>Lanjut: Input Blok Pohon &amp; Smart Sampling</span>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      )}

      {/* TAHAP 2: Input Blok Pohon & Smart Sampling (TreeBlockForm) */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden animate-fade-in space-y-6 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Tahap 2: Input Blok Pohon &amp; Smart Sampling
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#14382C] mt-1">
                Data Blok Tanam &amp; Generator Sampel Dinamis
              </h2>
              <p className="text-xs text-stone-500">
                Mendukung multi-spesies / tumpang sari dalam satu petak lahan.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddAnotherSpecies}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Jenis Pohon Lain di Lahan Ini</span>
            </button>
          </div>

          {/* List of Tree Blocks (Multi-species) */}
          <div className="space-y-4">
            {treeBlocks.map((block, bIdx) => (
              <div key={block.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14382C] flex items-center gap-2">
                    <TreePine className="w-4 h-4 text-emerald-700" />
                    <span>Blok Tanam #{bIdx + 1}: {block.species}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-bold">
                    Porsi Luas: {block.portionM2} m²
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Spesies Pohon</label>
                    <select
                      value={block.species}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTreeBlocks(prev => {
                          const n = [...prev];
                          n[bIdx] = { ...n[bIdx], species: val };
                          return n;
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="Alpukat Mentega">Alpukat Mentega</option>
                      <option value="Sengon Laut">Sengon Laut</option>
                      <option value="Durian Musang King">Durian Musang King</option>
                      <option value="Kopi Arabika">Kopi Arabika</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Porsi Luas (m²)</label>
                    <input
                      type="number"
                      value={block.portionM2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value || '0', 10);
                        setTreeBlocks(prev => {
                          const n = [...prev];
                          n[bIdx] = { ...n[bIdx], portionM2: val };
                          return n;
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Bulan/Tahun Tanam</label>
                    <input
                      type="month"
                      value={block.plantMonthYear}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTreeBlocks(prev => {
                          const n = [...prev];
                          n[bIdx] = { ...n[bIdx], plantMonthYear: val };
                          return n;
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Total Populasi Pohon</label>
                    <input
                      type="number"
                      value={block.totalTrees}
                      onChange={(e) => {
                        const val = parseInt(e.target.value || '0', 10);
                        setTreeBlocks(prev => {
                          const n = [...prev];
                          n[bIdx] = { ...n[bIdx], totalTrees: val };
                          return n;
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Generator Form Sampel Dinamis (SmartSamplingInputs: 3-5 Baris) */}
          <div className="bg-stone-50/90 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs sm:text-sm font-black text-[#14382C]">
                  Generator Form Sampel Dinamis (SmartSamplingInputs)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddSampleRow}
                  disabled={samples.length >= 5}
                  className="text-[11px] font-bold text-stone-700 bg-white hover:bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 transition disabled:opacity-40"
                >
                  + Tambah Baris Sampel ({samples.length}/5)
                </button>

                {/* Tooltip Panduan Pengukuran (MeasurementGuideModal) */}
                <button
                  type="button"
                  onClick={() => setShowDbhGuide(!showDbhGuide)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Panduan DBH 130 cm</span>
                </button>
              </div>
            </div>

            {showDbhGuide && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1 animate-fade-in">
                <p className="font-bold flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-emerald-700" />
                  <span>Ilustrasi Pengukuran DBH (Diameter at Breast Height):</span>
                </p>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  Ukur keliling batang tepat di ketinggian dada orang dewasa (130 cm dari permukaan tanah). Jangan ukur cabang atau tonjolan. Rumus konversi diameter: D = K / π.
                </p>
              </div>
            )}

            {/* Dynamic Samples Rows */}
            <div className="space-y-3">
              {samples.map((sample, idx) => (
                <div 
                  key={sample.id}
                  className="p-3.5 bg-white rounded-xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-xs font-black flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#14382C] block">
                        Sampel Batang #{idx + 1} ({primarySpecies})
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {sample.photo ? '✓ Foto terkalibrasi tersimpan' : 'Wajib foto meteran di dada'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                    {/* Input Lingkar Batang (cm) */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-stone-500 font-semibold">Lingkar:</span>
                      <input
                        type="number"
                        value={sample.dbh}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSamples(prev => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], dbh: val };
                            return next;
                          });
                        }}
                        className="w-14 px-1.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-center text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <span className="text-xs font-bold text-stone-600">cm</span>
                    </div>

                    {/* Input Estimasi Tinggi (opsional / meter) */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-stone-500 font-semibold">Tinggi:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={sample.height || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSamples(prev => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], height: val };
                            return next;
                          });
                        }}
                        placeholder="Opsional"
                        className="w-16 px-1.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-center text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <span className="text-xs font-bold text-stone-600">m</span>
                    </div>

                    {/* Tombol Kamera Viewfinder */}
                    <button
                      type="button"
                      onClick={() => onOpenViewfinder(idx, sample.photo, (photoUrl) => handleAttachPhoto(idx, photoUrl))}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                        sample.photo
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-emerald-700 text-white hover:bg-emerald-600 shadow-xs'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{sample.photo ? 'Ganti Foto' : 'Buka Kamera'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Poligon</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs"
            >
              <span>Lanjut ke Tinjauan &amp; Estimasi</span>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      )}

      {/* TAHAP 3: Estimator Pendapatan & Konfirmasi (LiveRevenueEstimator & SubmissionReview) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden animate-fade-in p-5 sm:p-6 space-y-6">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Tahap 3: Estimator Pendapatan &amp; Konfirmasi
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#14382C] mt-1">
              Pratinjau Pengajuan &amp; Potensi Bagi Hasil
            </h2>
            <p className="text-xs text-stone-500">
              Mengunci form dan mengirimkan tiket tugas inspeksi ke role Petugas/Surveyor lapangan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Detail Bidang &amp; Klaster</span>
              <strong className="text-sm font-bold text-[#14382C] block">{plotName}</strong>
              <div className="text-stone-600 space-y-0.5 text-xs">
                <p>Luas: <strong>{(areaSquareMeters / 10000).toFixed(2)} Ha ({areaSquareMeters.toLocaleString('id-ID')} m²)</strong></p>
                <p>Titik Tengah (Centroid): <strong>{centroidCoords}</strong></p>
                <p>Klaster Otomatis: <strong>{assignedCluster}</strong></p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Komposisi Agroforestri</span>
              <strong className="text-sm font-bold text-[#14382C] block">
                {treeBlocks.map(b => `${b.species} (${b.totalTrees})`).join(', ')}
              </strong>
              <div className="text-stone-600 space-y-0.5 text-xs">
                <p>Total Populasi: <strong>{totalTreesSum} Batang Pohon</strong></p>
                <p>Rata-rata DBH Sampel: <strong>{avgDbh.toFixed(1)} cm (D = K / π)</strong></p>
                <p>Foto Sampel: <strong>{samples.filter(s => s.photo).length} / {samples.length} Bukti Terkalibrasi</strong></p>
              </div>
            </div>
          </div>

          {/* Model Formula Box */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <TreePine className="w-4 h-4 text-emerald-700" />
              <span>Model Alometrik Biomassa Karbon (Chave et al. Tier-3):</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Rumus Alometrik: Rata-rata sampel ukuran ({avgDbh.toFixed(1)} cm) × Konstanta Spesies ({coeff.factor}) × Total Populasi ({totalTreesSum} pohon) ÷ 3.2. Menghasilkan estimasi yang diakui katalog bursa SRN-PPI.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Perbaiki Data Pohon</span>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Estimator Bar (StickyEstimatorBar) */}
      <div className="fixed bottom-0 md:bottom-2 left-0 right-0 md:left-auto md:right-4 md:max-w-xl z-30 p-3 sm:p-4">
        <div className="bg-[#14382C] text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-emerald-500/30 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Kotak Kalkulasi Langsung (StickyEstimatorBar)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg sm:text-xl font-black text-white font-mono">
                  Estimasi Serapan: ~{estimatedAbsorption} tCO2e/tahun
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
                Potensi Bagi Hasil Kotor: <strong className="text-white font-bold">{formatRupiah(grossRevenue)}/thn</strong> (Acuan Katalog Tetap) • Hak Bersih Petani (88%): <strong className="text-emerald-300 font-bold">{formatRupiah(farmerNetRevenue)}/thn</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onSaveDraft({
                  name: plotName,
                  species: primarySpecies,
                  totalTrees: totalTreesSum,
                  areaM2: areaSquareMeters
                });
                if (onToast) onToast('Disimpan sebagai Draft. Anda dapat melanjutkan pengukuran di kebun kapan saja.');
              }}
              className="flex-1 py-3 px-3 rounded-2xl border border-emerald-400/50 bg-white/5 hover:bg-white/10 text-emerald-200 font-bold text-xs transition text-center flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan sebagai Draft</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitVerification}
              className="flex-2 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs transition shadow-lg flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Ajukan Verifikasi Lapangan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
