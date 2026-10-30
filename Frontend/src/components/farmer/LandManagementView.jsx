import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import {
  MapPin,
  Trees,
  TreePine,
  Layers,
  Ruler,
  Leaf,
  Search,
  Maximize2,
  Sprout,
  PlusCircle,
  SearchX,
  Database,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Calculator,
  CheckCheck,
  Loader2,
  MapPinPlus,
  ArrowRight,
  Download,
  Trash2,
  AlertTriangle,
  Camera,
  ExternalLink,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { getFarmerLands, addTreeBlock, getTreeSpecies, deleteLandPlot } from '../../api/farmer';

// Helper hook for smooth animated number counting
function useAnimatedCounter(endValue, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(easeProgress * endValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);

  return count;
}

// Fallback initial data aligned with backend PostGIS schemas & requested land names
const DEFAULT_FALLBACK_LANDS = [
  {
    id: 'lhn-01-garung',
    name: 'Lahan 1 - Pekarangan Garung',
    area_sqm: 4500,
    status: 'verified',
    geojson_polygon: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [109.9045, -7.3518],
          [109.9058, -7.3518],
          [109.9058, -7.3530],
          [109.9045, -7.3530],
          [109.9045, -7.3518]
        ]
      ]
    }),
    tree_blocks: [
      {
        id: 'tb-01',
        species_name: 'Sengon Laut',
        planting_year: 2021,
        total_population: 200,
        avg_dbh_cm: 28.4,
        avg_height_m: 14.5,
        estimated_tco2e_per_year: 42.22,
        sample_photo_url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'tb-02',
        species_name: 'Alpukat Mentega',
        planting_year: 2020,
        total_population: 80,
        avg_dbh_cm: 22.0,
        avg_height_m: 8.5,
        estimated_tco2e_per_year: 16.45,
        sample_photo_url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'lhn-02-sindoro',
    name: 'Lahan 2 - Lereng Sindoro',
    area_sqm: 8200,
    status: 'draft',
    geojson_polygon: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [109.9790, -7.3195],
          [109.9810, -7.3195],
          [109.9810, -7.3210],
          [109.9790, -7.3210],
          [109.9790, -7.3195]
        ]
      ]
    }),
    tree_blocks: [
      {
        id: 'tb-03',
        species_name: 'Jati Emas',
        planting_year: 2022,
        total_population: 150,
        avg_dbh_cm: 21.5,
        avg_height_m: 11.0,
        estimated_tco2e_per_year: 31.50,
        sample_photo_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80'
      }
    ]
  }
];

// Nilai awal form blok pohon
const EMPTY_TREE_BLOCK_FORM = {
  land_plot_id: '',
  species_name: '',
  total_population: '',
  planting_year: '',
  avg_dbh_cm: '',
  avg_height_m: ''
};

// Master data 13 spesies pohon resmi ICRAF/KLHK + 1 Opsi Lainnya
const DEFAULT_TREE_SPECIES_OPTIONS = [
  { id: '1', local_name: 'Mangga', latin_name: 'Mangifera indica', category: 'Dikotil (Umum)', wood_density: 0.58, formula_type: 'ketterings', coeff_a: 0.11, exp_b: 2.62, requires_height: false, formula_display: 'AGB = 0.11 × ρ × D^2.62', reference_source: 'Chave et al. (2005) / Ketterings' },
  { id: '2', local_name: 'Alpukat', latin_name: 'Persea americana', category: 'Dikotil (Umum)', wood_density: 0.43, formula_type: 'ketterings', coeff_a: 0.11, exp_b: 2.62, requires_height: false, formula_display: 'AGB = 0.11 × ρ × D^2.62', reference_source: 'Chave et al. (2005) / Ketterings' },
  { id: '3', local_name: 'Nangka', latin_name: 'Artocarpus heterophyllus', category: 'Dikotil (Umum)', wood_density: 0.60, formula_type: 'ketterings', coeff_a: 0.11, exp_b: 2.62, requires_height: false, formula_display: 'AGB = 0.11 × ρ × D^2.62', reference_source: 'Chave et al. (2005) / Ketterings' },
  { id: '4', local_name: 'Durian', latin_name: 'Durio zibethinus', category: 'Dikotil (Umum)', wood_density: 0.52, formula_type: 'ketterings', coeff_a: 0.11, exp_b: 2.62, requires_height: false, formula_display: 'AGB = 0.11 × ρ × D^2.62', reference_source: 'Chave et al. (2005) / Ketterings' },
  { id: '5', local_name: 'Sengon', latin_name: 'Falcataria moluccana', category: 'Dikotil (Cepat)', wood_density: 0.33, formula_type: 'power_law', coeff_a: 0.1127, exp_b: 2.3983, requires_height: false, formula_display: 'AGB = 0.1127 × D^2.3983', reference_source: 'Litbang LHK / Siregar et al.' },
  { id: '6', local_name: 'Jati', latin_name: 'Tectona grandis', category: 'Dikotil (Keras)', wood_density: 0.67, formula_type: 'power_law', coeff_a: 0.153, exp_b: 2.382, requires_height: false, formula_display: 'AGB = 0.153 × D^2.382', reference_source: 'Purwanggono et al. / IPCC' },
  { id: '7', local_name: 'Mahoni', latin_name: 'Swietenia macrophylla', category: 'Dikotil (Keras)', wood_density: 0.56, formula_type: 'power_law', coeff_a: 0.086, exp_b: 2.645, requires_height: false, formula_display: 'AGB = 0.086 × D^2.645', reference_source: 'C.A.S.E (Agroforestry)' },
  { id: '8', local_name: 'Gamal', latin_name: 'Gliricidia sepium', category: 'Dikotil (Legum)', wood_density: 0.60, formula_type: 'power_law', coeff_a: 0.197, exp_b: 2.21, requires_height: false, formula_display: 'AGB = 0.197 × D^2.21', reference_source: 'Hairiah & Rahayu (ICRAF)' },
  { id: '9', local_name: 'Turi', latin_name: 'Sesbania grandiflora', category: 'Dikotil (Legum)', wood_density: 0.42, formula_type: 'power_law', coeff_a: 0.166, exp_b: 2.31, requires_height: false, formula_display: 'AGB = 0.166 × D^2.31', reference_source: 'Hairiah & Rahayu (ICRAF)' },
  { id: '10', local_name: 'Kopi', latin_name: 'Coffea canephora / arabica', category: 'Agroforestri Spesifik', wood_density: 0.55, formula_type: 'power_law', coeff_a: 0.281, exp_b: 2.06, requires_height: false, formula_display: 'AGB = 0.281 × D^2.06', reference_source: 'Arifin (2001) / ICRAF' },
  { id: '11', local_name: 'Kakao', latin_name: 'Theobroma cacao', category: 'Agroforestri Spesifik', wood_density: 0.43, formula_type: 'power_law', coeff_a: 0.120, exp_b: 2.35, requires_height: false, formula_display: 'AGB = 0.120 × D^2.35', reference_source: 'Yuliasmara et al. (Puslitkoka)' },
  { id: '12', local_name: 'Kelapa', latin_name: 'Cocos nucifera', category: 'Monokotil', wood_density: 0.73, formula_type: 'monocot_cylinder', coeff_a: 730.0, exp_b: 2.0, requires_height: true, formula_display: 'AGB = π × (D/200)^2 × H × 730', reference_source: 'Hairiah et al. (2001)' },
  { id: '13', local_name: 'Pisang', latin_name: 'Musa paradisiaca', category: 'Non-Berkayu', wood_density: 0.25, formula_type: 'power_law', coeff_a: 0.030, exp_b: 2.34, requires_height: false, formula_display: 'AGB = 0.030 × D^2.34', reference_source: 'Arifin (2001) / ICRAF' },
  { id: '14', local_name: 'Lainnya (Spesies Belum Terdaftar)', latin_name: 'Spesies Campuran', category: 'Fallback', wood_density: 0.48, formula_type: 'ketterings', coeff_a: 0.11, exp_b: 2.62, requires_height: false, formula_display: 'AGB = 0.11 × 0.48 × D^2.62', reference_source: 'Default Konservatif ICRAF' }
];

// Helper to safely parse GeoJSON string or object
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

// Extract centroid and bounds from GeoJSON polygon
function getCentroidAndBounds(geojson) {
  if (!geojson) {
    return { center: [-7.352, 109.905], bounds: null, vertexCount: 0, vertices: [] };
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
    return { center: [-7.352, 109.905], bounds: null, vertexCount: 0, vertices: [] };
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
    return { center: [-7.352, 109.905], bounds: null, vertexCount: 0, vertices: [] };
  }

  const center = [sumLat / validCount, sumLng / validCount];
  const bounds =
    minLat !== 90 && maxLat !== -90 && minLng !== 180 && maxLng !== -180
      ? [
          [minLat, minLng],
          [maxLat, maxLng]
        ]
      : null;

  return { center, bounds, vertexCount: ring.length, vertices: ring };
}

// Helper component inside MapContainer to smoothly adjust map viewport
function MapController({ bounds, center }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    try {
      if (bounds && bounds[0] && bounds[1]) {
        const [sw, ne] = bounds;
        if (sw[0] !== ne[0] || sw[1] !== ne[1]) {
          map.fitBounds(bounds, { padding: [20, 20], maxZoom: 17, animate: false });
          return;
        }
      }
      if (center && !isNaN(center[0]) && !isNaN(center[1])) {
        map.setView(center, 16, { animate: false });
      }
    } catch (err) {
      console.warn('Leaflet fitBounds error:', err);
    }
  }, [bounds, center, map]);

  return null;
}

export default function LandManagementView({
  realLands = [],
  customPlots = [],
  onNavigateTab,
  onOpenSamplePhoto,
  onRefresh,
  onToast
}) {
  // Main data state
  const [lands, setLands] = useState(
    Array.isArray(realLands) ? realLands : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'draft'
  const [expandedBlocks, setExpandedBlocks] = useState({}); // { [plotId]: boolean }

  // Modal input tree block state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_TREE_BLOCK_FORM);

  // Modal foto sampel lokal jika onOpenSamplePhoto tidak dipasang parent
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  // Combobox master spesies pohon dinamis
  const [speciesOptions, setSpeciesOptions] = useState(DEFAULT_TREE_SPECIES_OPTIONS);
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [isOtherSpecies, setIsOtherSpecies] = useState(false);
  const [customSpeciesName, setCustomSpeciesName] = useState('');

  // State modal konfirmasi hapus petak draft
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    plotId: null,
    plotName: '',
    isDeleting: false
  });

  // State error validasi inline di dalam modal blok pohon
  const [modalFormError, setModalFormError] = useState('');

  // Toast feedback state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: 'success',
    title: 'Blok pohon tersimpan',
    desc: 'Serapan karbon dihitung ulang oleh server FastAPI.'
  });
  const toastTimerRef = useRef(null);

  const scheduleToastHide = (delay) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      toastTimerRef.current = null;
    }, delay);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // Fetch daftar master data spesies pohon dari backend FastAPI
  const fetchTreeSpecies = useCallback(async () => {
    try {
      const data = await getTreeSpecies();
      if (Array.isArray(data) && data.length > 0) {
        setSpeciesOptions(data);
      }
    } catch (err) {
      console.warn('Pemberitahuan: Memuat fallback data spesies pohon lokal:', err);
    }
  }, []);

  useEffect(() => {
    fetchTreeSpecies();
  }, [fetchTreeSpecies]);

  const activeSpeciesList = speciesOptions.length > 0 ? speciesOptions : DEFAULT_TREE_SPECIES_OPTIONS;

  const selectedSpeciesObj = useMemo(() => {
    if (!formData.species_name) return null;
    return activeSpeciesList.find(s => (s.local_name || s.name) === formData.species_name) || null;
  }, [formData.species_name, activeSpeciesList]);

  const filteredSpecies = useMemo(() => {
    const q = speciesSearch.trim().toLowerCase();
    if (!q) return activeSpeciesList;
    return activeSpeciesList.filter((s) => {
      const local = (s.local_name || s.name || '').toLowerCase();
      const latin = (s.latin_name || s.latin || '').toLowerCase();
      const cat = (s.category || '').toLowerCase();
      return local.includes(q) || latin.includes(q) || cat.includes(q);
    });
  }, [activeSpeciesList, speciesSearch]);

  const resetTreeBlockForm = useCallback((plotId = '') => {
    setFormData({ ...EMPTY_TREE_BLOCK_FORM, land_plot_id: plotId });
    setSpeciesSearch('');
    setShowSpeciesDropdown(false);
    setIsOtherSpecies(false);
    setCustomSpeciesName('');
    setModalFormError('');
  }, []);

  // Fetch real data from GET /api/v1/farmer/lands
  const fetchLands = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFarmerLands();
      if (Array.isArray(data)) {
        setLands(data);
      } else if (Array.isArray(realLands)) {
        setLands(realLands);
      }
    } catch (err) {
      console.warn('Pemberitahuan: Memuat data lahan lokal:', err);
      if (Array.isArray(realLands)) {
        setLands(realLands);
      }
    } finally {
      setIsLoading(false);
    }
  }, [realLands]);

  useEffect(() => {
    fetchLands();
  }, [fetchLands]);

  useEffect(() => {
    if (Array.isArray(realLands)) {
      setLands(realLands);
    }
  }, [realLands]);

  // Calculations for summary metrics
  const totalPlots = lands.length;
  const verifiedCount = lands.filter(
    (l) => l.status === 'verified' || l.status === 'audit_verified' || l.status === 'active'
  ).length;
  const draftCount = Math.max(0, totalPlots - verifiedCount);

  // Total verified carbon for revenue calculation
  const verifiedCarbon = useMemo(() => {
    return (lands || [])
      .filter((l) => l.status === 'verified' || l.status === 'audit_verified' || l.status === 'active')
      .reduce((sum, l) => {
        const plotC = (l.tree_blocks || []).reduce(
          (acc, tb) => acc + (Number(tb.estimated_tco2e_per_year) || 0),
          0
        );
        return sum + plotC;
      }, 0);
  }, [lands]);

  // Annual revenue estimation: verified tCO2e * Rp 84.000 * 88%
  const annualDividendRupiah = Math.round(verifiedCarbon * 84000 * 0.88);
  const animatedDividend = useAnimatedCounter(annualDividendRupiah, 1300);
  const animatedCarbon = (useAnimatedCounter(Math.round(verifiedCarbon * 10), 1300) / 10);

  // Filtered lands list
  const filteredLands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lands.filter((plot) => {
      const isVerified =
        plot.status === 'verified' || plot.status === 'audit_verified' || plot.status === 'active';
      if (statusFilter === 'verified' && !isVerified) return false;
      if (statusFilter === 'draft' && isVerified) return false;

      if (q) {
        const nameMatch = (plot.name || '').toLowerCase().includes(q);
        const speciesMatch = (plot.tree_blocks || []).some((tb) =>
          (tb.species_name || '').toLowerCase().includes(q)
        );
        return nameMatch || speciesMatch;
      }
      return true;
    });
  }, [lands, statusFilter, searchQuery]);

  // Recharts data for LandComparisonChart
  const comparisonChartData = useMemo(() => {
    return lands.map((plot, i) => {
      const carbon = (plot.tree_blocks || []).reduce(
        (acc, tb) => acc + (Number(tb.estimated_tco2e_per_year) || 0),
        0
      );
      // Short label for chart axis
      const shortName = plot.name
        ? plot.name.length > 14
          ? plot.name.slice(0, 12) + '...'
          : plot.name
        : `Lahan ${i + 1}`;

      return {
        name: shortName,
        fullName: plot.name || `Lahan ${i + 1}`,
        carbon: parseFloat(carbon.toFixed(2)),
        status: plot.status
      };
    });
  }, [lands]);

  // Buka Modal Konfirmasi Hapus Petak Draft
  const handleOpenDeleteModal = (plotId, plotName) => {
    setDeleteConfirmModal({
      isOpen: true,
      plotId,
      plotName: plotName || 'Draft',
      isDeleting: false
    });
  };

  const executeDeletePlot = async () => {
    if (!deleteConfirmModal.plotId) return;
    setDeleteConfirmModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      await deleteLandPlot(deleteConfirmModal.plotId);
      setLands((prev) => prev.filter((p) => p.id !== deleteConfirmModal.plotId));
      setToastMessage({
        type: 'success',
        title: 'Petak Lahan Dihapus',
        desc: `Petak "${deleteConfirmModal.plotName || 'Draft'}" berhasil dihapus secara permanen.`
      });
      setToastVisible(true);
      scheduleToastHide(3500);
      if (onToast) onToast(`Lahan "${deleteConfirmModal.plotName || 'Draft'}" berhasil dihapus.`);
      if (onRefresh) onRefresh();
      setDeleteConfirmModal({ isOpen: false, plotId: null, plotName: '', isDeleting: false });
    } catch (err) {
      console.error('Gagal menghapus lahan:', err);
      setToastMessage({
        type: 'error',
        title: 'Gagal Menghapus Petak',
        desc: err.message || 'Terjadi kesalahan saat menghapus petak draft dari server.'
      });
      setToastVisible(true);
      scheduleToastHide(4000);
      setDeleteConfirmModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleOpenModal = (plotId = null) => {
    resetTreeBlockForm(plotId || lands[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setShowSpeciesDropdown(false);
  };

  const handleSelectSpecies = (sp) => {
    const sName = sp.local_name || sp.name;
    setFormData((prev) => ({
      ...prev,
      species_name: sName,
      wood_density: sp.wood_density
    }));
    setSpeciesSearch('');
    setShowSpeciesDropdown(false);
    setModalFormError('');

    if (sName.toLowerCase().includes('lainnya')) {
      setIsOtherSpecies(true);
    } else {
      setIsOtherSpecies(false);
      setCustomSpeciesName('');
    }
  };

  const handleSubmitTreeBlock = async (e) => {
    e.preventDefault();
    setModalFormError('');

    const targetPlot = lands.find((l) => l.id === formData.land_plot_id);
    if (!targetPlot) {
      setModalFormError('Silakan pilih petak kebun yang sah.');
      return;
    }

    const finalSpeciesName = isOtherSpecies ? customSpeciesName.trim() : formData.species_name;
    if (!finalSpeciesName) {
      setModalFormError('Pilih atau masukkan nama spesies pohon.');
      return;
    }

    if (!formData.total_population || Number(formData.total_population) <= 0) {
      setModalFormError('Populasi pohon harus lebih dari 0.');
      return;
    }

    if (!formData.planting_year || Number(formData.planting_year) < 1980) {
      setModalFormError('Tahun tanam harus berupa angka valid (minimal 1980).');
      return;
    }

    if (!formData.avg_dbh_cm || Number(formData.avg_dbh_cm) <= 0) {
      setModalFormError('Diameter DBH harus lebih dari 0 cm.');
      return;
    }

    if (selectedSpeciesObj?.requires_height && (!formData.avg_height_m || Number(formData.avg_height_m) <= 0)) {
      setModalFormError(`Spesies ${finalSpeciesName} adalah monokotil dan mewajibkan input rata-rata tinggi batang.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const dbhNum = parseFloat(formData.avg_dbh_cm);
      const samples = [
        { sample_index: 1, dbh_cm: dbhNum, height_m: formData.avg_height_m ? parseFloat(formData.avg_height_m) : undefined },
        { sample_index: 2, dbh_cm: dbhNum * 0.98, height_m: formData.avg_height_m ? parseFloat(formData.avg_height_m) : undefined },
        { sample_index: 3, dbh_cm: dbhNum * 1.02, height_m: formData.avg_height_m ? parseFloat(formData.avg_height_m) : undefined }
      ];

      const payload = {
        land_plot_id: formData.land_plot_id,
        species_name: finalSpeciesName,
        planting_year: parseInt(formData.planting_year, 10),
        total_population: parseInt(formData.total_population, 10),
        samples,
        height_m: formData.avg_height_m ? parseFloat(formData.avg_height_m) : undefined
      };

      await addTreeBlock(payload);

      setToastMessage({
        type: 'success',
        title: 'Blok pohon tersimpan',
        desc: 'Serapan karbon dihitung ulang oleh server FastAPI.'
      });
      setToastVisible(true);
      scheduleToastHide(3500);

      if (onToast) {
        onToast(`Blok pohon ${finalSpeciesName} berhasil ditambahkan!`);
      }

      handleCloseModal();
      resetTreeBlockForm();
      await fetchLands();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Gagal menambahkan blok pohon:', err);
      setModalFormError(err.message || 'Gagal menambahkan blok pohon ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerSamplePhoto = (sample) => {
    if (onOpenSamplePhoto) {
      onOpenSamplePhoto(sample);
    } else {
      setActivePhotoModal(sample);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ============================================================
           HEADER HALAMAN: MANAJEMEN LAHAN & POHON
      ============================================================= */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-800 border border-emerald-200/60">
            <MapPin className="h-3 w-3 text-emerald-600" />
            Inventaris Spasial &amp; Biomassa
          </div>

          <h1 className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
            Manajemen Lahan &amp; Pohon
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-500 font-sans">
            Kelola batas poligon petak kebun PostGIS, rincian tegakan pohon, dan estimasi serapan biomassa karbon.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {/* Tombol Sekunder: Tambah Blok Pohon */}
          <button
            id="btn-open-tree-modal"
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 active:scale-98 cursor-pointer"
          >
            <Trees className="h-4 w-4 text-emerald-600" />
            <span>Tambah Blok Pohon</span>
          </button>

          {/* Tombol Primer: Tambah Lahan Baru (Pill Hijau Emerald) */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('wizard')}
            className="inline-flex items-center gap-2 rounded-full bg-[#14382C] hover:bg-[#1C4E3D] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition active:scale-98 cursor-pointer"
          >
            <MapPinPlus className="h-4 w-4 text-white" />
            <span>Tambah Lahan Baru</span>
          </button>
        </div>
      </header>

      {/* ============================================================
           BAR PENCARIAN & FILTER STATUS
      ============================================================= */}
      <div className="flex flex-col gap-3 rounded-[20px] border border-stone-200/70 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#14382C] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Semua Petak ({totalPlots})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('verified')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'verified'
                ? 'bg-[#14382C] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Aktif Dividen ({verifiedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'draft'
                ? 'bg-[#14382C] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Menunggu Survei ({draftCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lahan atau pohon..."
            className="w-full rounded-full border border-stone-200 bg-stone-50 py-1.5 pl-9 pr-4 text-xs text-stone-800 placeholder-stone-400 transition focus:border-emerald-600 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* ============================================================
           GRID ASIMETRIS (8 KOLOM KIRI : 4 KOLOM KANAN)
      ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================
             KOLOM KIRI (8/12) · DAFTAR KARTU LAHAN (LandPlotCard)
        ============================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {isLoading && lands.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[22px] border border-stone-200/60 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs font-medium">Sinkronisasi poligon PostGIS...</p>
            </div>
          ) : lands.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
              <Sprout className="mx-auto h-9 w-9 text-emerald-600 mb-2" />
              <p className="mt-2 text-base font-bold text-stone-800 font-sans">Belum ada petak lahan terdaftar</p>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                Daftarkan kebun atau lahan agroforestri Anda untuk mulai memetakan batas GPS dan menghitung potensi dividen karbon.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab?.('wizard')}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#14382C] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1C4E3D] transition shadow-xs cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Daftarkan Lahan Pertama</span>
              </button>
            </div>
          ) : filteredLands.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-xs">
              <SearchX className="mx-auto h-7 w-7 text-stone-400" />
              <p className="mt-2 text-sm font-semibold text-stone-800">Petak lahan tidak ditemukan</p>
              <p className="mt-1 text-xs text-stone-500">Coba ubah filter pencarian atau kata kunci.</p>
            </div>
          ) : (
            filteredLands.map((plot, plotIdx) => {
              const isVerified =
                plot.status === 'verified' || plot.status === 'audit_verified' || plot.status === 'active';
              const parsedGeo = safeParseGeoJSON(plot.geojson_polygon);
              const { center, bounds, vertexCount } = getCentroidAndBounds(parsedGeo);
              const centroidStr = center ? `[${center[1].toFixed(4)}, ${center[0].toFixed(4)}]` : '[-]';
              const plotHa = ((Number(plot.area_sqm) || 0) / 10000).toLocaleString('id-ID', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              const plotCarbon = (plot.tree_blocks || []).reduce(
                (sum, tb) => sum + (Number(tb.estimated_tco2e_per_year) || 0),
                0
              );
              const plotTreesCount = (plot.tree_blocks || []).reduce(
                (sum, tb) => sum + (Number(tb.total_population) || 0),
                0
              );
              const isBlocksExpanded = expandedBlocks[plot.id] !== false; // default expanded

              return (
                <article
                  key={plot.id || plotIdx}
                  className="bg-white rounded-[22px] border border-stone-100 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 ease-out"
                >
                  {/* Header Kartu Lahan */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-stone-900 font-sans tracking-tight">
                          {plot.name}
                        </h2>
                        {/* Pill Koordinat GPS */}
                        <span className="font-sans text-xs bg-stone-100 text-stone-600 rounded-full px-3 py-1 tabular-nums">
                          {centroidStr}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        <span>Luas: <strong className="font-sans font-semibold text-stone-800 tabular-nums">{plotHa} Ha</strong> ({Number(plot.area_sqm || 0).toLocaleString('id-ID')} m²)</span>
                        <span>•</span>
                        <span>Populasi: <strong className="font-sans font-semibold text-stone-800 tabular-nums">{plotTreesCount} Batang</strong></span>
                        <span>•</span>
                        <span>Serapan: <strong className="font-sans font-semibold text-emerald-700 tabular-nums">{plotCarbon.toFixed(2)} tCO2e/thn</strong></span>
                      </div>
                    </div>

                    {/* Status Badge Kapsul */}
                    <div>
                      {isVerified ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/60 px-3.5 py-1 text-xs font-semibold text-emerald-700">
                          Aktif Menghasilkan Dividen
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/60 px-3.5 py-1 text-xs font-semibold text-amber-700">
                          Menunggu Survei
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mini-Map Thumbnail Satelit Poligon */}
                  <div className="rounded-2xl overflow-hidden border border-stone-200/80 h-44 sm:h-52 relative my-4 bg-[#0B1D16] shadow-inner isolate">
                    <MapContainer
                      key={`mini-map-${plot.id || plotIdx}`}
                      center={center}
                      zoom={16}
                      scrollWheelZoom={false}
                      dragging={false}
                      zoomControl={false}
                      attributionControl={false}
                      doubleClickZoom={false}
                      touchZoom={false}
                      className="h-full w-full z-10"
                    >
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        maxZoom={19}
                      />
                      <MapController bounds={bounds} center={center} />
                      {parsedGeo && (
                        <GeoJSON
                          data={parsedGeo}
                          style={() => ({
                            color: isVerified ? '#10B981' : '#F59E0B',
                            weight: 2.5,
                            dashArray: isVerified ? undefined : '5, 4',
                            fillColor: isVerified ? '#10B981' : '#F59E0B',
                            fillOpacity: 0.35
                          })}
                        />
                      )}
                    </MapContainer>

                    {/* Floating Map Overlay Badges */}
                    <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] text-white">
                      <span>Satelit Sentinel-2 / ESRI</span>
                    </div>

                    <div className="absolute bottom-3 right-3 z-[400] rounded-lg bg-black/60 backdrop-blur-xs px-2.5 py-1 font-sans text-[11px] font-medium text-emerald-300 tabular-nums">
                      {vertexCount || 5} Vertex • PostGIS SRID 4326
                    </div>
                  </div>

                  {/* PlantingBlockAccordion (Rincian Blok Pohon) */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TreePine className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 font-sans">
                          Rincian Blok Tegakan Pohon ({plot.tree_blocks?.length || 0})
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedBlocks((prev) => ({
                            ...prev,
                            [plot.id]: expandedBlocks[plot.id] === false
                          }))
                        }
                        className="text-xs text-stone-500 hover:text-stone-800 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {isBlocksExpanded ? (
                          <>
                            <span>Tutup</span>
                            <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Buka Rincian</span>
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>

                    {isBlocksExpanded && (
                      <div className="space-y-2.5">
                        {(!plot.tree_blocks || plot.tree_blocks.length === 0) ? (
                          <div className="rounded-2xl bg-[#F4F7F5] border border-stone-200/50 p-4 text-center">
                            <p className="text-xs text-stone-500">Belum ada blok pohon yang terdaftar pada petak ini.</p>
                            <button
                              type="button"
                              onClick={() => handleOpenModal(plot.id)}
                              className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                            >
                              Tambah Blok Pohon Sekarang
                            </button>
                          </div>
                        ) : (
                          plot.tree_blocks.map((block, bIdx) => {
                            const plantingAge = block.planting_year
                              ? new Date().getFullYear() - block.planting_year
                              : 4;
                            const dbh = block.avg_dbh_cm || 25.0;
                            const height = block.avg_height_m || 12.0;
                            const blockCarbon = Number(block.estimated_tco2e_per_year) || 0;

                            return (
                              <div
                                key={block.id || bIdx}
                                className="rounded-2xl bg-[#F4F7F5] border border-stone-200/50 p-4 transition hover:border-stone-300"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-stone-900 text-sm font-sans">
                                        {block.species_name}
                                      </span>
                                      <span className="rounded-full bg-stone-200/70 px-2 py-0.5 text-[10px] font-medium text-stone-700">
                                        {block.planting_year ? `Tanam ${block.planting_year} (${plantingAge} Thn)` : '4 Tahun'}
                                      </span>
                                    </div>

                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                                      <span>Populasi: <strong className="font-sans font-semibold text-stone-800 tabular-nums">{block.total_population} Btg</strong></span>
                                      <span>Rata DBH: <strong className="font-sans font-semibold text-stone-800 tabular-nums">{dbh} cm</strong></span>
                                      <span>Tinggi: <strong className="font-sans font-semibold text-stone-800 tabular-nums">{height} m</strong></span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    {/* Highlight Serapan Karbon */}
                                    <div className="text-right">
                                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                                        Serapan Karbon
                                      </span>
                                      <span className="font-sans font-bold text-[#14382C] text-sm sm:text-base tabular-nums">
                                        {blockCarbon.toFixed(2)} tCO2e/thn
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(plot.id)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Tambah Blok Pohon di Lahan Ini</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {!isVerified && (
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(plot.id, plot.name)}
                          className="rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Hapus Petak
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigateTab?.('timeline', { plotId: plot.id })}
                        className="rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 px-3.5 py-1 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        Lacak Status Audit →
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* ============================================================
             KOLOM KANAN (4/12) · KOMPARASI & RINGKASAN ASET
        ============================================================= */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* Kartu Kanan Atas: LandComparisonChart */}
          <article className="bg-white rounded-[22px] border border-stone-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 ease-out">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-stone-900 font-sans tracking-tight">
                  Komparasi Serapan Karbon
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Produksi <span className="font-sans font-medium">tCO2e/thn</span> per petak lahan
                </p>
              </div>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Leaf className="h-4 w-4" />
              </span>
            </div>

            {/* Recharts Horizontal Pill Bar Chart */}
            <div className="mt-4 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonChartData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#78716c"
                    fontSize={11}
                    width={90}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-stone-200 bg-white p-2.5 shadow-md text-xs">
                            <p className="font-bold text-stone-900">{data.fullName}</p>
                            <p className="font-sans text-emerald-700 font-semibold mt-0.5 tabular-nums">
                              {data.carbon} tCO2e / tahun
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="carbon" 
                    radius={[12, 12, 12, 12]} 
                    barSize={14}
                    isAnimationActive={true}
                    animationDuration={1400}
                  >
                    {comparisonChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.status === 'verified' ? '#10B981' : '#F59E0B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-xs bg-[#10B981]"></span>
                Terverifikasi
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-xs bg-[#F59E0B]"></span>
                Menunggu Audit
              </span>
            </div>
          </article>

          {/* Kartu Kanan Bawah: Bespoke Liquid Glass & Glassmorphism Summary Card */}
          <article className="relative overflow-hidden rounded-[28px] p-6 sm:p-7 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/40 border border-white/80 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.16),0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-12px_rgba(16,185,129,0.25),inset_0_1px_2px_rgba(255,255,255,1)] transition-all duration-300 group">
            {/* Ambient Liquid Light Blobs (Backdrop) */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-300/15 blur-2xl group-hover:scale-125 transition-transform duration-700 ease-out" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-gradient-to-tr from-teal-400/20 to-emerald-500/10 blur-2xl group-hover:scale-110 transition-transform duration-700 ease-out" />
            {/* Specular Top Hairline Rim */}
            <div className="pointer-events-none absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

            <div className="relative z-10">
              {/* Header: Tactile Glass Squircle Icon + Title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-100/90 to-emerald-50/50 border border-emerald-400/30 backdrop-blur-md flex items-center justify-center text-emerald-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(16,185,129,0.15)] group-hover:rotate-6 transition-transform duration-300">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 tracking-tight font-sans">
                      Total Potensi Dividen
                    </h3>
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Dividen Bersih 88%</span>
                  </div>
                </div>
              </div>

              {/* Subtitle / Description */}
              <p className="text-xs text-stone-500 mt-2 leading-relaxed font-normal">
                Estimasi bagi hasil dividen bersih petani (88%) dari seluruh petak aktif terverifikasi.
              </p>

              {/* Big Hero Number & Glassmorphic Pill Badge */}
              <div className="mt-4 flex flex-wrap items-baseline gap-1">
                <span className="text-xl lg:text-2xl font-bold text-stone-600 mr-1.5 font-sans">Rp</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans tabular-nums">
                  {animatedDividend.toLocaleString('id-ID')}
                </span>
                <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-400/30 text-emerald-800 px-2.5 py-0.5 text-xs font-semibold font-sans shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="tabular-nums">+18.4%</span>
                </span>
              </div>

              {/* Nested Frosted Glass Container */}
              <div className="mt-5 rounded-[22px] bg-white/60 backdrop-blur-md border border-white/90 p-4 space-y-3 text-xs shadow-[0_4px_16px_rgba(0,0,0,0.02),inset_0_1px_2px_rgba(255,255,255,0.85)]">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Total Lahan Aktif</span>
                  <span className="font-sans font-bold text-stone-800 tabular-nums">
                    {verifiedCount} Petak ({verifiedCarbon > 0 ? '0,45 Ha' : '0 Ha'})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Akumulasi Serapan</span>
                  <span className="font-sans font-bold text-emerald-700 tabular-nums">
                    {animatedCarbon.toFixed(2)} tCO2e/thn
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-200/50 pt-2.5">
                  <span className="text-stone-500 font-medium">Telemetri Satelit</span>
                  <span className="inline-flex items-center font-sans text-emerald-700 font-semibold">
                    Sentinel-2 (5 Hari Sekali)
                  </span>
                </div>
              </div>

              {/* Action Pill Button with Specular Volumetric Finish */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('wallet')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#14382C] hover:bg-[#1C4E3D] text-white font-semibold text-xs py-3 px-4 shadow-xs transition-all duration-200 active:scale-98 cursor-pointer"
                >
                  <span>Lihat Dompet Karbon Petani</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* ============================================================
           MODAL TAMBAH BLOK POHON BARU
      ============================================================= */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 bg-[#14382C] p-5 text-white">
              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight font-sans">
                  Tambah Blok Tegakan Pohon
                </h2>
                <p className="mt-0.5 text-xs text-emerald-200/80">
                  Data pohon akan dihitung otomatis menggunakan formula alometrik ICRAF/KLHK.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitTreeBlock} className="space-y-4 p-5">
              {modalFormError && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="font-medium flex-1">{modalFormError}</span>
                  <button type="button" onClick={() => setModalFormError('')} className="text-red-400 hover:text-red-600 p-0.5 rounded transition cursor-pointer" title="Tutup">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 1. Pilih Petak Lahan */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                  Petak Lahan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.land_plot_id}
                    onChange={(e) => {
                      setFormData({ ...formData, land_plot_id: e.target.value });
                      if (modalFormError) setModalFormError('');
                    }}
                    className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-3.5 pr-9 text-xs text-stone-800 transition focus:border-emerald-600 focus:bg-white focus:outline-none"
                  >
                    <option value="" disabled>Pilih Petak Kebun</option>
                    {lands.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({Number(l.area_sqm).toLocaleString('id-ID')} m²)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                </div>
              </div>

              {/* 2. Spesies Pohon */}
              <div className="relative">
                <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                  Spesies Pohon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    readOnly={!showSpeciesDropdown}
                    value={formData.species_name || ''}
                    onClick={() => setShowSpeciesDropdown(true)}
                    placeholder="Pilih Spesies Pohon Terdaftar..."
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-3.5 pr-9 text-xs text-stone-800 cursor-pointer focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                </div>

                {showSpeciesDropdown && (
                  <div className="absolute z-30 mt-1 w-full rounded-2xl border border-stone-200 bg-white p-2 shadow-xl animate-fade-in">
                    <input
                      type="text"
                      value={speciesSearch}
                      onChange={(e) => setSpeciesSearch(e.target.value)}
                      placeholder="Ketik untuk mencari pohon..."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 mb-2 focus:border-emerald-600 focus:outline-none"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredSpecies.map((sp) => (
                        <div
                          key={sp.id}
                          onClick={() => handleSelectSpecies(sp)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 cursor-pointer text-xs transition"
                        >
                          <div>
                            <span className="font-semibold text-stone-900">{sp.local_name || sp.name}</span>
                            <span className="text-stone-400 italic text-[11px] ml-1.5">({sp.latin_name || sp.latin})</span>
                          </div>
                          <span className="text-[11px] font-sans font-medium text-emerald-700 bg-emerald-100/60 rounded px-1.5 py-0.5 tabular-nums">
                            ρ {sp.wood_density}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isOtherSpecies && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Nama Spesies Kustom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customSpeciesName}
                    onChange={(e) => setCustomSpeciesName(e.target.value)}
                    placeholder="Contoh: Petai Hutan / Kayu Manis"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 px-3.5 text-xs text-stone-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              )}

              {/* 3. Populasi & Tahun Tanam */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Jumlah Pohon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.total_population}
                    onChange={(e) => setFormData({ ...formData, total_population: e.target.value })}
                    placeholder="Contoh: 150"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 px-3.5 font-sans text-xs text-stone-800 focus:border-emerald-600 focus:outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Tahun Tanam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1980"
                    max={new Date().getFullYear()}
                    required
                    value={formData.planting_year}
                    onChange={(e) => setFormData({ ...formData, planting_year: e.target.value })}
                    placeholder="Contoh: 2021"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 px-3.5 font-sans text-xs text-stone-800 focus:border-emerald-600 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* 4. DBH & Tinggi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Rata-rata DBH (cm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formData.avg_dbh_cm}
                    onChange={(e) => setFormData({ ...formData, avg_dbh_cm: e.target.value })}
                    placeholder="Contoh: 28.4"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 px-3.5 font-sans text-xs text-stone-800 focus:border-emerald-600 focus:outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Rata-rata Tinggi (m) {selectedSpeciesObj?.requires_height && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required={Boolean(selectedSpeciesObj?.requires_height)}
                    value={formData.avg_height_m}
                    onChange={(e) => setFormData({ ...formData, avg_height_m: e.target.value })}
                    placeholder="Contoh: 14.5"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 px-3.5 font-sans text-xs text-stone-800 focus:border-emerald-600 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-[#14382C] hover:bg-[#1C4E3D] text-white px-5 py-2 text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Leaf className="h-4 w-4" />
                      <span>Simpan Blok Pohon</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
           MODAL KONFIRMASI HAPUS PETAK DRAFT
      ============================================================= */}
      {deleteConfirmModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => {
            if (!deleteConfirmModal.isDeleting) {
              setDeleteConfirmModal({ isOpen: false, plotId: null, plotName: '', isDeleting: false });
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-[24px] border border-stone-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-100 text-red-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 font-sans">
                  Hapus Petak Lahan Draft?
                </h3>
                <p className="text-xs text-stone-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50/70 p-3.5 text-xs text-red-900">
              Anda akan menghapus petak <strong>{deleteConfirmModal.plotName}</strong>. Data poligon batas PostGIS dan blok pohon terkait akan dihapus secara permanen.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteConfirmModal.isDeleting}
                onClick={() => setDeleteConfirmModal({ isOpen: false, plotId: null, plotName: '', isDeleting: false })}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteConfirmModal.isDeleting}
                onClick={executeDeletePlot}
                className="rounded-full bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {deleteConfirmModal.isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Petak</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ============================================================
           TOAST NOTIFIKASI
      ============================================================= */}
      {toastVisible && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex w-full max-w-sm items-start gap-3 rounded-[20px] border bg-white p-4 shadow-xl animate-slide-up ${
            toastMessage.type === 'error' ? 'border-red-200' : 'border-emerald-200'
          }`}
        >
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
              toastMessage.type === 'error'
                ? 'bg-red-50 text-red-600'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-stone-900">{toastMessage.title}</p>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}
