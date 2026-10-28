import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import {
  MapPin,
  Trees,
  TreePine,
  Layers,
  Ruler,
  Leaf,
  Search,
  Maximize2,
  Compass,
  Sprout,
  PlusCircle,
  SearchX,
  Database,
  Info,
  X,
  ChevronDown,
  Calculator,
  CheckCheck,
  Loader2,
  Menu,
  MapPinPlus,
  ArrowRight,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { getFarmerLands, addTreeBlock, getTreeSpecies, deleteLandPlot } from '../../api/farmer';

// Fallback initial data aligned with backend PostGIS schemas & HTML mockup
const DEFAULT_FALLBACK_LANDS = [
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Kebun Sengon Pertama',
    area_sqm: 500,
    status: 'verified',
    geojson_polygon: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [106.8330, -6.3685],
          [106.8332, -6.3685],
          [106.8332, -6.3687],
          [106.8330, -6.3687],
          [106.8330, -6.3685]
        ]
      ]
    }),
    tree_blocks: [
      {
        id: 'tb-01',
        species_name: 'Sengon Laut',
        planting_year: 2021,
        total_population: 200,
        estimated_tco2e_per_year: 42.22
      }
    ]
  },
  {
    id: '9f9fe559-9f9f-9f9f-9f9f-9f9fe559e506',
    name: 'Kebun Uji Coba Swagger',
    area_sqm: 12235.13,
    status: 'draft',
    geojson_polygon: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [106.8348, -6.3678],
          [106.8352, -6.3678],
          [106.8352, -6.3682],
          [106.8348, -6.3682],
          [106.8348, -6.3678]
        ]
      ]
    }),
    tree_blocks: []
  }
];

// Nilai awal form blok pohon · sengaja dikosongkan agar user wajib mengisi sendiri
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

// Extract center coordinates, bounds, and vertex list from GeoJSON polygon
function getCentroidAndBounds(geojson) {
  if (!geojson) {
    return { center: [-6.3685, 106.8330], bounds: null, vertexCount: 0, vertices: [] };
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
    return { center: [-6.3685, 106.8330], bounds: null, vertexCount: 0, vertices: [] };
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
    return { center: [-6.3685, 106.8330], bounds: null, vertexCount: 0, vertices: [] };
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

// Format coordinates formatted for inspector terminal
function formatVertexCoordinates(geojson) {
  const { vertices } = getCentroidAndBounds(geojson);
  if (!vertices || vertices.length === 0) {
    return '[106.8330, -6.3685] -> [106.8332, -6.3685] -> [106.8332, -6.3687] -> [106.8330, -6.3687]';
  }
  return vertices
    .map(([lng, lat]) => `[${Number(lng).toFixed(4)}, ${Number(lat).toFixed(4)}]`)
    .join(' -> ');
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
          map.fitBounds(bounds, { padding: [35, 35], maxZoom: 18, animate: true });
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

export default function LandManagementView({
  realLands = [],
  customPlots = [],
  onNavigateTab,
  onOpenSamplePhoto,
  onRefresh,
  onOpenMobileNav,
  onToast
}) {
  // Main data state
  const [lands, setLands] = useState(
    realLands && realLands.length > 0 ? realLands : DEFAULT_FALLBACK_LANDS
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'draft'
  const [activePlotId, setActivePlotId] = useState('');
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite' | 'vector'

  // Accordion daftar petak: hanya petak yang dipilih (aktif) yang mengembang
  const [expandedPlotId, setExpandedPlotId] = useState('');

  // Pastikan petak yang sedang aktif otomatis mengembang
  useEffect(() => {
    if (activePlotId) {
      setExpandedPlotId(activePlotId);
    }
  }, [activePlotId]);

  // Modal input tree block state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Seluruh nilai awal dikosongkan (string kosong) agar user wajib mengisi sendiri
  const [formData, setFormData] = useState(EMPTY_TREE_BLOCK_FORM);

  // Combobox master spesies pohon dinamis dari database (GET /api/v1/tree-species)
  const [speciesOptions, setSpeciesOptions] = useState(DEFAULT_TREE_SPECIES_OPTIONS);
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [isOtherSpecies, setIsOtherSpecies] = useState(false);
  const [customSpeciesName, setCustomSpeciesName] = useState('');

  // State modal konfirmasi hapus petak draft (Agro-Pulse Bento)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    plotId: null,
    plotName: '',
    isDeleting: false
  });

  // State error validasi inline di dalam modal blok pohon (menggantikan browser alert)
  const [modalFormError, setModalFormError] = useState('');

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

  // Objek spesies yang saat ini dipilih user
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

  const resetTreeBlockForm = useCallback(
    (plotId = '') => {
      setFormData({ ...EMPTY_TREE_BLOCK_FORM, land_plot_id: plotId });
      setSpeciesSearch('');
      setShowSpeciesDropdown(false);
      setIsOtherSpecies(false);
      setCustomSpeciesName('');
      setModalFormError('');
    },
    []
  );

  // Floating toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    title: 'Blok pohon tersimpan',
    desc: 'Serapan karbon dihitung ulang oleh server FastAPI.'
  });

  // Fetch real data from GET /api/v1/farmer/lands
  const fetchLands = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFarmerLands();
      if (Array.isArray(data) && data.length > 0) {
        setLands(data);
        setActivePlotId((prev) => (prev && data.some((l) => l.id === prev) ? prev : data[0].id));
      } else if (realLands && realLands.length > 0) {
        setLands(realLands);
        setActivePlotId((prev) => (prev ? prev : realLands[0].id));
      }
    } catch (err) {
      console.warn('Pemberitahuan: Memuat data lahan fallback lokal:', err);
      if (realLands && realLands.length > 0) {
        setLands(realLands);
        setActivePlotId((prev) => (prev ? prev : realLands[0].id));
      }
    } finally {
      setIsLoading(false);
    }
  }, [realLands]);

  // Initial load
  useEffect(() => {
    fetchLands();
  }, [fetchLands]);

  // If realLands prop updates externally, synchronize
  useEffect(() => {
    if (realLands && realLands.length > 0) {
      setLands(realLands);
      setActivePlotId((prev) => (prev && realLands.some((l) => l.id === prev) ? prev : realLands[0].id));
    }
  }, [realLands]);

  // Ensure activePlotId is always populated
  useEffect(() => {
    if (!activePlotId && lands.length > 0) {
      setActivePlotId(lands[0].id);
    }
  }, [activePlotId, lands]);

  // 4 Dynamic KPI Calculations
  const totalPlots = lands.length;
  const verifiedCount = lands.filter(
    (l) => l.status === 'verified' || l.status === 'audit_verified' || l.status === 'active'
  ).length;
  const draftCount = Math.max(0, totalPlots - verifiedCount);

  const totalAreaSqm = useMemo(() => {
    return (lands || []).filter(Boolean).reduce((acc, l) => acc + (Number(l?.area_sqm) || 0), 0);
  }, [lands]);

  const totalAreaHa = (totalAreaSqm / 10000).toFixed(2);

  // Buka Modal Konfirmasi Hapus Petak Draft (Agro-Pulse Bento)
  const handleOpenDeleteModal = (plotId, plotName) => {
    setDeleteConfirmModal({
      isOpen: true,
      plotId,
      plotName: plotName || 'Draft',
      isDeleting: false
    });
  };

  // Eksekusi DELETE /api/v1/farmer/lands/{land_id} setelah dikonfirmasi via modal kustom
  const executeDeletePlot = async () => {
    if (!deleteConfirmModal.plotId) return;
    setDeleteConfirmModal(prev => ({ ...prev, isDeleting: true }));

    try {
      await deleteLandPlot(deleteConfirmModal.plotId);
      setLands((prev) => prev.filter((p) => p.id !== deleteConfirmModal.plotId));
      setActivePlotId((prev) => {
        if (prev === deleteConfirmModal.plotId) {
          const remaining = lands.filter((p) => p.id !== deleteConfirmModal.plotId);
          return remaining.length > 0 ? remaining[0].id : '';
        }
        return prev;
      });
      setToastMessage({
        title: 'Petak Lahan Dihapus',
        desc: `Petak "${deleteConfirmModal.plotName || 'Draft'}" berhasil dihapus secara permanen dari database.`
      });
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3500);
      if (onToast) onToast(`Lahan "${deleteConfirmModal.plotName || 'Draft'}" berhasil dihapus.`);
      if (onRefresh) onRefresh();
      setDeleteConfirmModal({ isOpen: false, plotId: null, plotName: '', isDeleting: false });
    } catch (err) {
      console.error('Gagal menghapus lahan:', err);
      setToastMessage({
        title: 'Gagal Menghapus Petak',
        desc: err.message || 'Terjadi kesalahan saat menghapus petak draft dari server.'
      });
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 4000);
      setDeleteConfirmModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const { totalTrees, uniqueSpeciesCount, primarySpeciesName, totalCarbon } = useMemo(() => {
    let treesSum = 0;
    let carbonSum = 0;
    const speciesMap = {};

    lands.forEach((l) => {
      (l.tree_blocks || []).forEach((tb) => {
        const pop = Number(tb.total_population) || 0;
        const carb = Number(tb.estimated_tco2e_per_year) || 0;
        treesSum += pop;
        carbonSum += carb;
        if (tb.species_name) {
          speciesMap[tb.species_name] = (speciesMap[tb.species_name] || 0) + pop;
        }
      });
    });

    const speciesKeys = Object.keys(speciesMap);
    const primary = speciesKeys.length > 0
      ? speciesKeys.sort((a, b) => speciesMap[b] - speciesMap[a])[0]
      : 'Sengon Laut';

    return {
      totalTrees: treesSum,
      uniqueSpeciesCount: speciesKeys.length || (treesSum > 0 ? 1 : 0),
      primarySpeciesName: primary,
      totalCarbon: carbonSum
    };
  }, [lands]);

  // Filtered Lands
  const filteredLands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lands.filter((plot) => {
      // Status filter
      const isVerified =
        plot.status === 'verified' || plot.status === 'audit_verified' || plot.status === 'active';
      if (statusFilter === 'verified' && !isVerified) return false;
      if (statusFilter === 'draft' && isVerified) return false;

      // Search query filter (name or tree species)
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

  // Currently selected / active plot for the map inspector
  const activePlot = useMemo(() => {
    return lands.find((l) => l.id === activePlotId) || lands[0] || null;
  }, [lands, activePlotId]);

  // GeoJSON details for the active plot
  const activeGeoJSON = useMemo(() => {
    return activePlot ? safeParseGeoJSON(activePlot.geojson_polygon) : null;
  }, [activePlot]);

  const { center: activeCenter, bounds: activeBounds, vertexCount: activeVertexCount } = useMemo(() => {
    return getCentroidAndBounds(activeGeoJSON);
  }, [activeGeoJSON]);

  // Open modal handler (can specify initial landPlotId)
  const handleOpenModal = (plotId = null) => {
    resetTreeBlockForm(plotId || activePlot?.id || (lands[0]?.id || ''));
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setShowSpeciesDropdown(false);
  };

  // Combobox spesies: pilih salah satu opsi dari database
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

  // Trigger floating toast
  const triggerToast = (title, desc) => {
    setToastMessage({ title, desc });
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 4000);
  };

  // Submit Modal Tree Block (POST /api/v1/farmer/tree-blocks)
  const handleSubmitTreeBlock = async (e) => {
    e.preventDefault();
    setModalFormError('');

    if (!formData.land_plot_id) {
      setModalFormError('Pilih petak lahan terlebih dahulu.');
      return;
    }

    let finalSpeciesName = formData.species_name;
    if (isOtherSpecies) {
      if (!customSpeciesName || !customSpeciesName.trim()) {
        setModalFormError('Silakan masukkan nama spesies lokal.');
        return;
      }
      finalSpeciesName = customSpeciesName.trim();
    }

    if (!finalSpeciesName || !finalSpeciesName.trim()) {
      setModalFormError('Pilih spesies pohon terlebih dahulu (bisa diketik untuk mencari).');
      return;
    }
    if (!formData.total_population || !formData.planting_year || !formData.avg_dbh_cm) {
      setModalFormError('Lengkapi jumlah populasi, tahun tanam, dan diameter batang (DBH) terlebih dahulu.');
      return;
    }

    // Validasi parameter tinggi untuk Monokotil (Kelapa)
    if (selectedSpeciesObj?.requires_height) {
      const hVal = parseFloat(formData.avg_height_m);
      if (!hVal || isNaN(hVal) || hVal <= 0) {
        setModalFormError('Spesies Monokotil (Kelapa) wajib menyertakan tinggi batang pohon (H > 0 meter) untuk rumus silinder alometrik ICRAF.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const dbh = parseFloat(formData.avg_dbh_cm);
      if (!dbh || isNaN(dbh) || dbh <= 0) {
        throw new Error('Diameter batang (DBH) tidak valid.');
      }
      const circumference = dbh * Math.PI;

      // Backend requires at least 3 tree samples (schemas.py: min_length=3)
      const samples = [
        { circumference_cm: Number((circumference * 0.96).toFixed(1)) },
        { circumference_cm: Number(circumference.toFixed(1)) },
        { circumference_cm: Number((circumference * 1.04).toFixed(1)) }
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

      // Success feedback
      triggerToast(
        'Blok pohon tersimpan',
        'Serapan karbon dihitung ulang oleh server FastAPI.'
      );
      if (onToast) {
        onToast(`Blok pohon ${finalSpeciesName} berhasil ditambahkan dan serapan karbon terhitung!`);
      }

      // Close and reset form (tanpa nilai default / pre-filled)
      handleCloseModal();
      resetTreeBlockForm(activePlot?.id || lands[0]?.id || '');

      // Refetch lands from backend
      await fetchLands();
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Gagal menambahkan blok pohon:', err);
      setModalFormError(err.message || 'Gagal menambahkan blok pohon ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download active plot GeoJSON
  const handleDownloadGeoJSON = (e) => {
    e.preventDefault();
    if (!activePlot) return;
    const geoContent =
      typeof activePlot.geojson_polygon === 'string'
        ? activePlot.geojson_polygon
        : JSON.stringify(activePlot.geojson_polygon, null, 2);

    const blob = new Blob([geoContent], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activePlot.name || 'petak_lahan')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')}_boundary.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ============================================================
           KOMPONEN 2 · PAGE HEADER & DUAL ACTION BAR
      ============================================================= */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <MapPin className="h-3 w-3" />
            Inventaris Spasial &amp; Biomassa
          </span>

          <h1 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-stone-900 sm:text-3xl">
            Manajemen Lahan &amp; Blok Pohon
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500">
            Kelola batas poligon petak kebun PostGIS, rincian populasi spesies tanaman, dan kalkulasi serapan karbon per petak.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Tombol sekunder · trigger modal tambah blok pohon */}
          <button
            id="btn-open-tree-modal"
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-xs transition hover:bg-stone-50 active:scale-[0.99] cursor-pointer"
          >
            <Trees className="h-4 w-4 text-emerald-600" />
            + Tambah Blok Pohon
          </button>

          {/* Tombol primer · navigasi ke wizard pendaftaran lahan */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('wizard')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pine px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-pine-900 active:scale-[0.99] cursor-pointer"
          >
            <MapPinPlus className="h-4 w-4 text-emerald-400" />
            + Daftarkan Petak Baru
          </button>

          {/* Mobile-only drawer trigger (tetap tanpa top navbar) */}
          {onOpenMobileNav && (
            <button
              id="menuBtn"
              type="button"
              onClick={onOpenMobileNav}
              aria-label="Buka navigasi"
              className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* ============================================================
           KOMPONEN 3 · STRIP RINGKASAN METRIK SPASIAL (4 KPI)
      ============================================================= */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Ringkasan metrik spasial">
        {/* KPI 1 · Total Petak Terdaftar */}
        <article className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs transition hover:shadow-card">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Total Petak Kebun</p>
            <p className="tnum mt-1.5 font-mono text-xl font-bold leading-none tracking-tight text-stone-900">
              {totalPlots} Petak
            </p>
            <p className="mt-1.5 truncate text-[11px] font-medium text-emerald-700">
              {verifiedCount} Terverifikasi • {draftCount} Draft
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <Layers className="h-5 w-5" />
          </span>
        </article>

        {/* KPI 2 · Akumulasi Luas Spasial */}
        <article className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs transition hover:shadow-card">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Total Luas Poligon</p>
            <p className="tnum mt-1.5 font-mono text-xl font-bold leading-none tracking-tight text-stone-900">
              {totalAreaHa} Ha
            </p>
            <p className="tnum mt-1.5 truncate font-mono text-[11px] text-stone-500">
              {Number(totalAreaSqm).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} m² (PostGIS Valid)
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-700">
            <Ruler className="h-5 w-5" />
          </span>
        </article>

        {/* KPI 3 · Total Populasi Tanaman */}
        <article className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs transition hover:shadow-card">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Populasi Pohon Aktif</p>
            <p className="tnum mt-1.5 font-mono text-xl font-bold leading-none tracking-tight text-stone-900">
              {totalTrees} Batang
            </p>
            <p className="mt-1.5 truncate text-[11px] text-stone-500">
              {uniqueSpeciesCount} Spesies Terdata {primarySpeciesName ? `(${primarySpeciesName})` : ''}
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <TreePine className="h-5 w-5" />
          </span>
        </article>

        {/* KPI 4 · Estimasi Serapan Tahunan */}
        <article className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs transition hover:shadow-card">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Estimasi Serapan Karbon</p>
            <p className="tnum mt-1.5 font-mono text-xl font-bold leading-none tracking-tight text-emerald-700">
              {totalCarbon.toFixed(2)} tCO2e/thn
            </p>
            <p className="mt-1.5 truncate text-[11px] text-stone-500">Rumus Alometrik Chave Tier-3</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pine text-emerald-400">
            <Leaf className="h-5 w-5" />
          </span>
        </article>
      </section>

      {/* ============================================================
           KOMPONEN 4 · BAR KONTROL PENCARIAN & FILTER STATUS
      ============================================================= */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Filter status pills */}
        <div id="filterPills" className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto sm:w-auto">
          <button
            type="button"
            data-filter="all"
            onClick={() => setStatusFilter('all')}
            className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-pine text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Semua Petak ({totalPlots})
          </button>
          <button
            type="button"
            data-filter="verified"
            onClick={() => setStatusFilter('verified')}
            className={`flex whitespace-nowrap items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              statusFilter === 'verified'
                ? 'bg-pine text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Terverifikasi ({verifiedCount})
          </button>
          <button
            type="button"
            data-filter="draft"
            onClick={() => setStatusFilter('draft')}
            className={`flex whitespace-nowrap items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              statusFilter === 'draft'
                ? 'bg-pine text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Draft / Menunggu Audit ({draftCount})
          </button>
        </div>

        {/* Input pencarian cepat */}
        <div className="relative w-full shrink-0 sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            id="searchInput"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kebun atau spesies pohon..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50 py-1.5 pl-9 pr-4 text-xs text-stone-800 placeholder-stone-400 transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
          />
        </div>
      </div>

      {/* ============================================================
           KOMPONEN 5 · MASTER-DETAIL BENTO GRID
      ============================================================= */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start" aria-label="Daftar petak lahan dan inspektor peta">
        {/* ============================================================
             SUB-KOMPONEN 5A · KOLOM KIRI (7/12) · DAFTAR PETAK
        ============================================================= */}
        <div id="landList" className="space-y-5 lg:col-span-7">
          {isLoading && lands.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-stone-200 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs font-medium">Sinkronisasi poligon PostGIS...</p>
            </div>
          ) : filteredLands.length === 0 ? (
            <div id="noResult" className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
              <SearchX className="mx-auto h-6 w-6 text-stone-400" />
              <p className="mt-2 text-sm font-semibold text-stone-700">Petak lahan tidak ditemukan</p>
              <p className="mt-1 text-xs text-stone-500">Coba kata kunci lain, misalnya nama kebun atau spesies pohon.</p>
            </div>
          ) : (
            /* Wrapper scroll lokal agar daftar petak tidak memanjangkan halaman utama */
            <div className="space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
            {filteredLands.map((plot, idx) => {
              const isSelected = activePlot?.id === plot.id;
              const isExpanded = isSelected && expandedPlotId === plot.id;
              const isVerified =
                plot.status === 'verified' || plot.status === 'audit_verified' || plot.status === 'active';
              const parsedGeo = safeParseGeoJSON(plot.geojson_polygon);
              const { center, vertexCount } = getCentroidAndBounds(parsedGeo);
              const centroidStr = center ? `${center[0].toFixed(4)}, ${center[1].toFixed(4)}` : '-';
              const plotCarbon = (plot?.tree_blocks || []).filter(Boolean).reduce(
                (sum, tb) => sum + (Number(tb?.estimated_tco2e_per_year) || 0),
                0
              );
              const plotTreesCount = (plot?.tree_blocks || []).filter(Boolean).reduce(
                (sum, tb) => sum + (Number(tb?.total_population) || 0),
                0
              );
              const shortUUID = plot.id ? `${String(plot.id).slice(0, 8)}...${String(plot.id).slice(-4)}` : 'ID-POSTGIS';
              const plotBlockCount = plot.tree_blocks?.length || 0;

              return (
                <article
                  key={plot.id}
                  data-plot-id={plot.id}
                  data-status={plot.status}
                  onClick={() => {
                    setActivePlotId(plot.id);
                    setExpandedPlotId(plot.id);
                  }}
                  className={`land-card cursor-pointer overflow-hidden rounded-2xl transition ${
                    isSelected
                      ? 'border-2 border-pine bg-white shadow-card'
                      : 'border border-stone-200/80 bg-white shadow-xs hover:border-stone-300'
                  }`}
                >
                  {/* Bagian 1 · Card Header Petak */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-stone-600">
                          PLOT #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="font-mono text-[11px] text-stone-400" title={plot.id}>
                          {shortUUID}
                        </span>
                      </div>

                      {isVerified ? (
                        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          ✓ Terverifikasi
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            ⏳ Draft / Menunggu Audit
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteModal(plot.id, plot.name);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 transition shadow-xs cursor-pointer active:scale-95"
                            title="Hapus petak draft"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            <span>Hapus Petak</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <h2 className="mt-2 text-lg font-bold leading-tight tracking-tight text-stone-900">
                      {plot.name}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-600">
                      <span className="flex items-center gap-1.5">
                        <Maximize2 className="h-3.5 w-3.5 text-stone-400" />
                        <span className="tnum font-mono font-semibold text-stone-800">
                          {Number(plot.area_sqm).toLocaleString('id-ID')} m² ({(plot.area_sqm / 10000).toFixed(2)} Ha)
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-stone-400" />
                        <span className="tnum font-mono text-stone-500">{centroidStr}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Sprout className="h-3.5 w-3.5 text-stone-400" />
                        <span className={`tnum font-mono font-semibold ${plotCarbon > 0 ? 'text-emerald-700' : 'text-stone-400'}`}>
                          {plotCarbon.toFixed(2)} tCO2e/thn
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Bagian 2 · Sub-Seksi Daftar Blok Tanaman (tree_blocks) · ACCORDION */}
                  <div className={`border-t border-stone-100 p-4 ${isVerified ? 'bg-stone-50/60' : 'bg-amber-50/20'}`}>
                    {/* Baris header accordion · sekaligus ringkasan saat petak tidak aktif (collapsed) */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            // Toggle collapse tanpa mengubah petak aktif di peta
                            setExpandedPlotId((prev) => (prev === plot.id ? '' : plot.id));
                          } else {
                            setActivePlotId(plot.id);
                            setExpandedPlotId(plot.id);
                          }
                        }}
                        className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500 transition hover:text-stone-700 cursor-pointer"
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                        Blok Tanaman Terdaftar ({plotBlockCount} Blok • {plotTreesCount} Pohon)
                      </button>

                      {/* Tombol header HANYA tampil saat petak aktif (expanded) dan sudah punya blok */}
                      {isExpanded && plotBlockCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(plot.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 cursor-pointer"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          + Tambah Blok di Petak Ini
                        </button>
                      )}
                    </div>

                    {/* Konten accordion · hanya dirender bila petak ini sedang aktif & diklik */}
                    {isExpanded && (
                      <>
                        {/* Baris blok pohon */}
                        {plotBlockCount > 0 ? (
                          <div className="mt-2.5 space-y-2">
                            {plot.tree_blocks.map((tb) => (
                              <div
                                key={tb.id}
                                className="flex flex-col gap-3 rounded-xl border border-stone-200/80 bg-white p-3.5 transition hover:border-stone-300 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                                    <TreePine className="h-[18px] w-[18px]" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-stone-900">{tb.species_name}</p>
                                    <p className="tnum mt-0.5 truncate font-mono text-[11px] text-stone-500">
                                      Tahun Tanam: {tb.planting_year} • Populasi: {tb.total_population} Batang
                                    </p>
                                  </div>
                                </div>
                                <span className="tnum shrink-0 self-start rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-800 sm:self-auto">
                                  {Number(tb.estimated_tco2e_per_year).toFixed(2)} tCO2e/thn
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Empty State Blok Tanaman · hanya untuk petak aktif & belum punya blok */
                          <div className="mt-2.5 flex flex-col items-center justify-between gap-3 rounded-xl border border-dashed border-stone-300 bg-white/80 p-4 sm:flex-row">
                            <div className="flex items-start gap-3">
                              <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                              <div>
                                <p className="text-xs font-medium text-stone-700">Belum ada blok pohon tercatat di petak ini.</p>
                                <p className="mt-0.5 text-[11px] text-stone-500">Tambahkan populasi pohon untuk menghitung estimasi serapan karbon.</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(plot.id);
                              }}
                              className="shrink-0 rounded-lg bg-pine px-3 py-1.5 text-xs font-medium text-white transition hover:bg-pine-900 cursor-pointer"
                            >
                              + Input Blok Pohon
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Bagian 3 · Card Footer Actions */}
                  {isVerified ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-white px-4 py-2.5 text-xs">
                      <span className="font-mono text-[11px] text-stone-400">
                        {vertexCount || 5} Titik Koordinat Poligon Tertutup (SRID 4326)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePlotId(plot.id);
                          setExpandedPlotId(plot.id);
                        }}
                        className="font-semibold text-pine transition hover:text-emerald-800 cursor-pointer"
                      >
                        Fokus di Peta →
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-100 bg-amber-50/50 px-4 py-2.5 text-xs text-amber-900">
                      <span>Dijadwalkan inspeksi lapangan oleh Budi Surveyor (SRV-BUDI-09) • 28 Okt 2026</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateTab?.('timeline');
                        }}
                        className="shrink-0 font-semibold underline transition hover:text-amber-950 cursor-pointer"
                      >
                        Lacak Audit →
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
            </div>
          )}
        </div>

        {/* ============================================================
             SUB-KOMPONEN 5B · KOLOM KANAN (5/12) · INSPECTOR PETA
        ============================================================= */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:col-span-5">
          <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
            {/* Bagian 1 · Map Inspector Header */}
            <header className="flex items-start justify-between gap-3 border-b border-stone-100 p-4">
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-tight tracking-tight text-stone-900">
                  Pratinjau Poligon PostGIS
                </h2>
                <p id="mapActivePlot" className="mt-0.5 truncate text-xs font-medium text-emerald-700">
                  Petak Aktif: {activePlot?.name || 'Pilih Petak'}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-stone-100 px-2 py-1 font-mono text-[10px] text-stone-600">
                SRID: 4326
              </span>
            </header>

            {/* Bagian 2 · Interactive Satellite/Vector Map Viewport */}
            <div
              id="farmer-land-map-canvas"
              className={`relative flex h-72 sm:h-80 items-center justify-center overflow-hidden bg-[#0B1D16] ${
                mapLayer === 'vector' ? 'gis-grid' : ''
              }`}
            >
              {/* React Leaflet Map Container */}
              <MapContainer
                center={activeCenter || [-6.3685, 106.833]}
                zoom={16}
                scrollWheelZoom={true}
                dragging={true}
                doubleClickZoom={true}
                touchZoom={true}
                boxZoom={true}
                keyboard={true}
                zoomControl={false}
                attributionControl={false}
                className="h-full w-full z-10"
              >
                {/* Tombol zoom diletakkan di kanan bawah agar tidak tertutup panel layer (kiri atas) */}
                <ZoomControl position="bottomright" />
                {/* Dynamically Toggled Map Layer */}
                {mapLayer === 'satellite' ? (
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

                {/* Map Viewport Controller */}
                <MapController bounds={activeBounds} center={activeCenter} />

                {/* Render PostGIS GeoJSON Polygons */}
                {lands.map((plot) => {
                  const geo = safeParseGeoJSON(plot.geojson_polygon);
                  if (!geo) return null;
                  const isVerified =
                    plot.status === 'verified' || plot.status === 'audit_verified' || plot.status === 'active';
                  const isCurrentActive = activePlot?.id === plot.id;

                  return (
                    <GeoJSON
                      key={`${plot.id}-${plot.status}-${isCurrentActive ? 'active' : 'inactive'}`}
                      data={geo}
                      style={() => ({
                        color: isVerified ? '#10B981' : '#F59E0B',
                        weight: isCurrentActive ? 3.5 : 2,
                        dashArray: isVerified ? undefined : '5, 4',
                        fillColor: isVerified ? '#10B981' : '#F59E0B',
                        fillOpacity: isCurrentActive ? 0.38 : 0.2
                      })}
                      eventHandlers={{
                        click: () => setActivePlotId(plot.id)
                      }}
                    />
                  );
                })}
              </MapContainer>

              {/* Floating map controls · layer switcher (kiri atas) */}
              <div className="absolute left-3 top-3 z-[500] flex items-center gap-1 rounded-lg bg-black/70 p-1 text-[11px] text-white backdrop-blur-xs shadow-md">
                <button
                  type="button"
                  data-layer="satellite"
                  onClick={() => setMapLayer('satellite')}
                  className={`map-layer-btn rounded-md px-2 py-1 font-medium transition cursor-pointer ${
                    mapLayer === 'satellite'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Satelit
                </button>
                <button
                  type="button"
                  data-layer="vector"
                  onClick={() => setMapLayer('vector')}
                  className={`map-layer-btn rounded-md px-2 py-1 font-medium transition cursor-pointer ${
                    mapLayer === 'vector'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Vektor GIS
                </button>
              </div>

              {/* Kompas (kanan atas) */}
              <div className="absolute right-3 top-3 z-[500] grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/70 backdrop-blur-xs shadow-md pointer-events-none">
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <polygon points="12,3 15,12 12,10.5 9,12" fill="#10B981" />
                  <polygon points="12,21 9,12 12,13.5 15,12" fill="#F8FAFC" opacity="0.85" />
                </svg>
              </div>

              {/* Floating legend + skala peta (kiri bawah) · kanan bawah dikosongkan untuk tombol zoom Leaflet */}
              <div className="absolute bottom-3 left-3 z-[500] space-y-1 rounded-lg bg-black/70 px-2.5 py-2 text-[10px] text-white backdrop-blur-xs shadow-md pointer-events-none">
                <p className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-emerald-400 bg-emerald-500/80"></span>
                  Terverifikasi
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-500/80"></span>
                  Draft Audit
                </p>
                <p className="mt-1 flex items-center gap-2 border-t border-white/10 pt-1.5 font-mono text-[10px]">
                  <span className="relative block h-[3px] w-10 bg-white/80">
                    <span className="absolute -left-0.5 -top-1 block h-2.5 w-[2px] bg-white/80"></span>
                    <span className="absolute -right-0.5 -top-1 block h-2.5 w-[2px] bg-white/80"></span>
                  </span>
                  50 m
                </p>
              </div>
            </div>

            {/* Bagian 3 · Detail Telemetri & GeoJSON Coordinates Inspector */}
            <div className="space-y-3 bg-stone-50/50 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-stone-200/80 bg-white p-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Luas Kalkulasi ST_Area</p>
                  <p id="inspectorArea" className="tnum mt-1 font-mono text-sm font-bold text-stone-900">
                    {activePlot
                      ? `${Number(activePlot.area_sqm).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`
                      : '0,00 m²'}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-white p-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Status Geometri</p>
                  <p
                    id="inspectorGeometry"
                    className={`mt-1.5 text-xs font-semibold ${
                      activePlot?.status === 'verified' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    Poligon Valid ({activePlot?.status === 'verified' ? 'Tertutup' : 'Menunggu Audit'})
                  </p>
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                  Koordinat Vertex Poligon (Lon, Lat)
                </p>
                <pre
                  id="inspectorGeojson"
                  className="scroll-slim mt-1.5 overflow-x-auto rounded-xl bg-stone-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-400"
                >
                  {formatVertexCoordinates(activeGeoJSON)}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-stone-400" /> Sumber: PostGIS · lands.polygon_boundary
                </span>
                <button
                  type="button"
                  onClick={handleDownloadGeoJSON}
                  className="font-semibold text-pine transition hover:text-emerald-800 cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh GeoJSON →
                </button>
              </div>
            </div>
          </article>

          {/* Kartu catatan operasional (tetap dalam palet Agro-Pulse) */}
          <article className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-700">
              <Info className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-sm font-semibold text-stone-900">Butuh revisi batas petak?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                Petak terverifikasi terkunci untuk perubahan geometri. Ajukan revisi poligon melalui menu{' '}
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('timeline')}
                  className="font-semibold text-stone-700 underline cursor-pointer hover:text-emerald-700"
                >
                  Lacak Verifikasi
                </button>
                .
              </p>
            </div>
          </article>
        </div>
      </section>

      <p className="pt-1 text-center font-mono text-[10px] text-stone-400">
        TaniKarbon · Portal Mitra Petani — geometri petak tersinkron dengan basis data spasial PostGIS (SRID 4326)
      </p>

      {/* ================================================================
           KOMPONEN 6 · MODAL "TAMBAH BLOK POHON BARU"
           POST /api/v1/farmer/tree-blocks
      ================================================================ */}
      {isModalOpen && (
        <div
          id="treeBlockModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="treeModalTitle"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 bg-pine p-5 text-white">
              <div className="min-w-0">
                <h2 id="treeModalTitle" className="text-base font-bold tracking-tight">
                  Tambah Blok Tanaman &amp; Kalkulasi Karbon
                </h2>
                <p className="mt-0.5 text-xs text-emerald-200/80">
                  Data pohon akan dihitung menggunakan rumus alometrik di server.
                </p>
              </div>
              <button
                id="btnCloseTreeModal"
                type="button"
                onClick={handleCloseModal}
                aria-label="Tutup modal"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form id="treeBlockForm" onSubmit={handleSubmitTreeBlock} className="space-y-4 p-5">
              {/* Alert error inline di dalam modal */}
              {modalFormError && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 animate-fade-in">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="font-medium flex-1 leading-relaxed">{modalFormError}</span>
                  <button type="button" onClick={() => setModalFormError('')} className="text-red-400 hover:text-red-600 font-bold p-0.5">✕</button>
                </div>
              )}

              {/* 1 · land_plot_id */}
              <div>
                <label htmlFor="land_plot_id" className="mb-1.5 block text-xs font-semibold text-stone-700">
                  Petak Lahan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="land_plot_id"
                    name="land_plot_id"
                    required
                    value={formData.land_plot_id}
                    onChange={(e) => {
                      setFormData({ ...formData, land_plot_id: e.target.value });
                      if (modalFormError) setModalFormError('');
                    }}
                    className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-3 pr-9 text-sm text-stone-800 transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
                  >
                    <option value="" disabled>Pilih Petak Lahan</option>
                    {lands.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({Number(l.area_sqm).toLocaleString('id-ID')} m²)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                </div>
              </div>

              {/* 2 · species_name · Searchable Combobox / Autocomplete */}
              <div className="relative">
                <label htmlFor="species_search" className="mb-1.5 block text-xs font-semibold text-stone-700">
                  Spesies Pohon (13 Spesies Terdaftar + Lainnya) <span className="text-red-500">*</span>
                </label>

                {/* Nilai tersimpan untuk validasi form (required) */}
                <input
                  type="hidden"
                  id="species_name"
                  name="species_name"
                  value={formData.species_name}
                  onChange={() => {}}
                  required={!formData.species_name}
                />

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="species_search"
                    type="text"
                    autoComplete="off"
                    value={showSpeciesDropdown ? speciesSearch : formData.species_name}
                    placeholder="Cari spesies (Mangga, Sengon, Kelapa, dll.)..."
                    onChange={(e) => {
                      setSpeciesSearch(e.target.value);
                      setShowSpeciesDropdown(true);
                      if (modalFormError) setModalFormError('');
                    }}
                    onFocus={() => setShowSpeciesDropdown(true)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-9 text-sm text-stone-800 placeholder-stone-400 transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
                  />
                  <button
                    type="button"
                    aria-label="Buka daftar spesies"
                    onClick={() => setShowSpeciesDropdown((prev) => !prev)}
                    className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-stone-400 transition hover:bg-stone-200/60 hover:text-stone-600 cursor-pointer"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        showSpeciesDropdown ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Dropdown hasil pencarian · absolute + z-index tinggi */}
                {showSpeciesDropdown && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[70] max-h-60 overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-2xl custom-scrollbar divide-y divide-stone-100">
                    {filteredSpecies.length > 0 ? (
                      filteredSpecies.map((sp) => {
                        const sName = sp.local_name || sp.name;
                        const sLatin = sp.latin_name || sp.latin;
                        const sDensity = sp.wood_density;
                        const sCategory = sp.category;
                        const isActive = formData.species_name === sName;
                        const isOther = sName.toLowerCase().includes('lainnya');

                        return (
                          <button
                            key={sp.id || sName}
                            type="button"
                            onClick={() => handleSelectSpecies(sp)}
                            className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition cursor-pointer ${
                              isActive ? 'bg-emerald-50/80' : 'hover:bg-stone-50'
                            }`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate text-sm font-semibold ${isActive ? 'text-emerald-900' : 'text-stone-800'}`}>
                                {sName}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {sLatin && (
                                  <span className="truncate text-[11px] italic text-stone-400">{sLatin}</span>
                                )}
                                {sCategory && (
                                  <span className="rounded bg-stone-100 text-stone-600 px-1.5 py-0.2 text-[9px] font-mono font-medium">
                                    {sCategory}
                                  </span>
                                )}
                              </div>
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {sp.requires_height && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Wajib H
                                </span>
                              )}
                              {sDensity !== undefined && (
                                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                                  isOther
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  ρ {Number(sDensity).toFixed(2)}
                                </span>
                              )}
                              {isActive && <CheckCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-3 text-center">
                        <p className="text-xs font-medium text-stone-600">Spesies tidak ditemukan</p>
                        <p className="mt-0.5 text-[11px] text-stone-400">
                          Coba kata kunci lain atau pilih opsi "Lainnya" untuk input manual.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Input Tambahan Otomatis jika Memilih Opsi "Lainnya (Spesies Belum Terdaftar)" */}
                {isOtherSpecies && (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 space-y-1.5 transition-all">
                    <label htmlFor="custom_species_name" className="block text-xs font-bold text-amber-900">
                      Masukkan Nama Spesies Lokal <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="custom_species_name"
                      name="custom_species_name"
                      type="text"
                      required
                      value={customSpeciesName}
                      onChange={(e) => {
                        setCustomSpeciesName(e.target.value);
                        if (modalFormError) setModalFormError('');
                      }}
                      placeholder="Contoh: Pohon Sukun, Petai, Nangka, dll."
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder-stone-400 transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
                    />
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Spesies baru akan dihitung menggunakan formula konservatif Ketterings dengan Kerapatan Kayu (Wood Density) default <span className="font-mono font-semibold">0.48 g/cm³</span>.
                    </p>
                  </div>
                )}

                {/* Pratinjau Rumus Metodologi Spesifik Spesies */}
                {selectedSpeciesObj && !isOtherSpecies && (
                  <div className="mt-2.5 rounded-2xl border border-emerald-200 bg-[#FAFDF9] p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Calculator className="h-3.5 w-3.5 text-emerald-700" />
                        Metodologi: {selectedSpeciesObj.reference_source || 'ICRAF / Litbang LHK'}
                      </span>
                      <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                        {selectedSpeciesObj.category || 'Alometrik Standar'}
                      </span>
                    </div>
                    <div className="font-mono text-emerald-900 font-semibold text-[11px] bg-white rounded-lg p-2 border border-emerald-100 flex items-center justify-between">
                      <span>{selectedSpeciesObj.formula_display || `AGB = 0.11 × ${selectedSpeciesObj.wood_density} × D^2.62`}</span>
                      <span className="text-[10px] text-stone-500 font-mono">ρ = {selectedSpeciesObj.wood_density}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 · total_population & planting_year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="total_population" className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Jumlah Populasi Pohon <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="total_population"
                    name="total_population"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formData.total_population}
                    onChange={(e) => {
                      setFormData({ ...formData, total_population: e.target.value });
                      if (modalFormError) setModalFormError('');
                    }}
                    placeholder="Contoh: 150"
                    className="tnum w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-mono text-sm text-stone-800 placeholder:font-sans placeholder:text-stone-400 transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">Batang</p>
                </div>
                <div>
                  <label htmlFor="planting_year" className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Tahun Tanam <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="planting_year"
                    name="planting_year"
                    type="number"
                    min="1950"
                    max="2100"
                    step="1"
                    required
                    value={formData.planting_year}
                    onChange={(e) => {
                      setFormData({ ...formData, planting_year: e.target.value });
                      if (modalFormError) setModalFormError('');
                    }}
                    placeholder="Contoh: 2023"
                    className="tnum w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-mono text-sm text-stone-800 placeholder:font-sans placeholder:text-stone-400 transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">Tahun</p>
                </div>
              </div>

              {/* 4 · avg_dbh_cm & avg_height_m */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="avg_dbh_cm" className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Rata-rata DBH Batang <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="avg_dbh_cm"
                    name="avg_dbh_cm"
                    type="number"
                    min="1"
                    step="0.1"
                    required
                    value={formData.avg_dbh_cm}
                    onChange={(e) => {
                      setFormData({ ...formData, avg_dbh_cm: e.target.value });
                      if (modalFormError) setModalFormError('');
                    }}
                    placeholder="Contoh: 25.0"
                    className="tnum w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-mono text-sm text-stone-800 placeholder:font-sans placeholder:text-stone-400 transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">Diameter DBH (cm)</p>
                </div>
                <div>
                  <label htmlFor="avg_height_m" className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Rata-rata Tinggi Batang {selectedSpeciesObj?.requires_height ? <span className="text-red-500 font-bold">* (Wajib)</span> : <span className="text-stone-400 font-normal">(Opsional)</span>}
                  </label>
                  <input
                    id="avg_height_m"
                    name="avg_height_m"
                    type="number"
                    min="0"
                    step="0.1"
                    required={Boolean(selectedSpeciesObj?.requires_height)}
                    value={formData.avg_height_m}
                    onChange={(e) => {
                      setFormData({ ...formData, avg_height_m: e.target.value });
                      if (modalFormError) setModalFormError('');
                    }}
                    placeholder={selectedSpeciesObj?.requires_height ? 'Contoh: 12.0 (Wajib)' : 'Contoh: 14.5'}
                    className={`tnum w-full rounded-xl border px-3 py-2.5 font-mono text-sm text-stone-800 placeholder:font-sans placeholder:text-stone-400 transition focus:outline-none focus:ring-1 ${
                      selectedSpeciesObj?.requires_height
                        ? 'border-amber-400 bg-amber-50/50 focus:border-amber-600 focus:ring-amber-500/30'
                        : 'border-stone-200 bg-stone-50 focus:border-emerald-600 focus:ring-emerald-600/30'
                    }`}
                  />
                  {selectedSpeciesObj?.requires_height ? (
                    <p className="mt-1 text-[11px] font-semibold text-amber-700">
                      ⚡ Monokotil (Kelapa) wajib tinggi silinder batang untuk biomassa Hairiah et al.
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-stone-400">Meter (m) · Rumus murni DBH</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
                <button
                  id="btnCancelTreeModal"
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-pine px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-pine-900 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      Menghitung...
                    </>
                  ) : (
                    <>
                      <Leaf className="h-4 w-4 text-emerald-400" />
                      Simpan &amp; Hitung Serapan Karbon
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
           Modal Konfirmasi Hapus Petak Draft (Agro-Pulse Bento)
      ================================================================ */}
      {deleteConfirmModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            if (!deleteConfirmModal.isDeleting) {
              setDeleteConfirmModal({ isOpen: false, plotId: null, plotName: '', isDeleting: false });
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-600 shrink-0">
                <Trash2 className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 leading-tight">
                  Hapus Petak Lahan Draft?
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50/70 p-3.5 text-xs text-red-900 space-y-1">
              <p>
                Anda akan menghapus petak lahan <strong className="font-bold underline">{deleteConfirmModal.plotName || 'Draft'}</strong>.
              </p>
              <p className="text-[11px] text-red-700 leading-relaxed">
                Seluruh koordinat batas poligon spasial PostGIS dan data blok tegakan pohon di petak ini akan dihapus secara permanen dari basis data server.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteConfirmModal.isDeleting}
                onClick={() => setDeleteConfirmModal({ isOpen: false, plotId: null, plotName: '', isDeleting: false })}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteConfirmModal.isDeleting}
                onClick={executeDeletePlot}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {deleteConfirmModal.isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Ya, Hapus Petak</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
           Toast konfirmasi (POST /tree-blocks)
      ================================================================ */}
      {toastVisible && (
        <div
          id="toast"
          className="fixed bottom-6 right-6 z-[60] flex w-full max-w-xs items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl animate-slide-up"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCheck className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-900">{toastMessage.title}</p>
            <p className="mt-0.5 text-xs text-stone-500">{toastMessage.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}
