import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  TrendingUp, 
  MapPin, 
  ShieldCheck, 
  Save, 
  Info,
  DollarSign,
  Cpu,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function SystemParametersMasterView({ onToast }) {
  // Tree Species Allometric Constants State
  const [speciesList, setSpeciesList] = useState([
    {
      id: 'SPC-001',
      name: 'Alpukat Mentega (Persea americana)',
      category: 'Agroforestri Buah Produktif',
      woodDensity: 0.52, // g/cm3
      constA: 0.0559,
      constB: 2.37,
      conversionFactor: 3.67, // 44/12
      carbonFraction: 0.47
    },
    {
      id: 'SPC-002',
      name: 'Mangga Harumanis (Mangifera indica)',
      category: 'Agroforestri Buah Produktif',
      woodDensity: 0.60,
      constA: 0.0509,
      constB: 2.38,
      conversionFactor: 3.67,
      carbonFraction: 0.47
    },
    {
      id: 'SPC-003',
      name: 'Sengon Buto (Falcataria moluccana)',
      category: 'Tanaman Keras Cepat Tumbuh',
      woodDensity: 0.33,
      constA: 0.0437,
      constB: 2.42,
      conversionFactor: 3.67,
      carbonFraction: 0.50
    },
    {
      id: 'SPC-004',
      name: 'Jati Emas (Tectona grandis)',
      category: 'Tanaman Kayu Keras Bernilai Tinggi',
      woodDensity: 0.67,
      constA: 0.0520,
      constB: 2.40,
      conversionFactor: 3.67,
      carbonFraction: 0.48
    },
    {
      id: 'SPC-005',
      name: 'Mangrove Bakau (Rhizophora apiculata)',
      category: 'Blue Carbon Pesisir',
      woodDensity: 0.77,
      constA: 0.0632,
      constB: 2.45,
      conversionFactor: 3.67,
      carbonFraction: 0.49
    }
  ]);

  // Editing state
  const [editingSpeciesId, setEditingSpeciesId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // New Species Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSpecies, setNewSpecies] = useState({
    name: '',
    category: 'Agroforestri Buah Produktif',
    woodDensity: 0.55,
    constA: 0.0500,
    constB: 2.40,
    conversionFactor: 3.67,
    carbonFraction: 0.47
  });

  // Catalog Pricing State
  const [pricing, setPricing] = useState({
    agroforestryPrice: 120000, // Rp 120.000 / tCO2e
    blueCarbonPrice: 160000,    // Rp 160.000 / tCO2e
    idxCarbonFloor: 69600,      // Batas bawah bursa IDXCarbon
  });

  // Platform Rules & PostGIS GIS Configuration State
  const [platformRules, setPlatformRules] = useState({
    takeRateFee: 15,            // 15% net after cost recovery
    clusterRadiusKm: 10,        // ST_DWithin 10 km
    minAuditQuota: 500,         // 500 tCO2e
    surveyorGeofenceTolerance: 50 // 50 meter
  });

  // Handlers
  const handleStartEdit = (sp) => {
    setEditingSpeciesId(sp.id);
    setEditForm({ ...sp });
  };

  const handleSaveEdit = () => {
    setSpeciesList(prev => prev.map(s => s.id === editForm.id ? editForm : s));
    setEditingSpeciesId(null);
    setEditForm(null);
    if (onToast) {
      onToast(`Parameter alometrik untuk ${editForm.name} berhasil diperbarui.`);
    }
  };

  const handleCancelEdit = () => {
    setEditingSpeciesId(null);
    setEditForm(null);
  };

  const handleAddSpecies = (e) => {
    e.preventDefault();
    const id = `SPC-00${speciesList.length + 1}`;
    setSpeciesList([...speciesList, { id, ...newSpecies }]);
    setIsAddModalOpen(false);
    setNewSpecies({
      name: '',
      category: 'Agroforestri Buah Produktif',
      woodDensity: 0.55,
      constA: 0.0500,
      constB: 2.40,
      conversionFactor: 3.67,
      carbonFraction: 0.47
    });
    if (onToast) {
      onToast(`Spesies ${newSpecies.name} berhasil ditambahkan ke katalog pohon nasional.`);
    }
  };

  const handleSavePricingAndRules = (e) => {
    e.preventDefault();
    if (onToast) {
      onToast('Konfigurasi Harga Bursa & Parameter PostGIS berhasil disimpan ke server live!');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Pengaturan Inti &amp; Dynamic Config
            </span>
            <span className="text-xs text-slate-500 font-sans">
              Standar Persamaan Biomassa Chave et al. (2014)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1 font-sans">
            Master Parameter &amp; Rumus Alometrik
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-sans">
            Pusat kendali variabel dinamis platform tanpa perlu mengubah kode sumber backend. Perubahan di sini langsung merefleksikan estimasi tonase petani, kalkulasi surveyor, dan harga jual katalog.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-[#14382C] hover:bg-[#1E4D3D] rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0 font-sans"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Tambah Spesies Baru</span>
        </button>
      </div>

      {/* SECTION A: ALLOMETRIC FORMULA MANAGER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 font-sans flex items-center gap-2">
              <span>A. Master Spesies Pohon &amp; Rumus Alometrik Biomassa</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                AGB = a × D^b
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Parameter biometrik pohon menentukan jumlah biomassa di atas permukaan tanah (Above-Ground Biomass) dan konversi ke tCO2e (<span className="font-mono">44/12 ≈ 3,67</span>).
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4 min-w-[220px]">Nama Spesies &amp; Kategori</th>
                  <th className="py-3 px-4 whitespace-nowrap">Kerapatan Kayu (ρ)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Konstanta (a)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Konstanta (b)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Fraksi Karbon (CF)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Faktor CO2e (44/12)</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {speciesList.map((sp) => {
                  const isEditing = editingSpeciesId === sp.id;

                  return (
                    <tr key={sp.id} className="hover:bg-slate-50/60 transition font-sans">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {sp.id}
                      </td>

                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-sans"
                          />
                        ) : (
                          <div>
                            <div className="font-bold text-stone-900">{sp.name}</div>
                            <div className="text-[11px] text-slate-500">{sp.category}</div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.woodDensity}
                            onChange={(e) => setEditForm({ ...editForm, woodDensity: parseFloat(e.target.value) })}
                            className="w-16 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                          />
                        ) : (
                          <span>{sp.woodDensity} g/cm³</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editForm.constA}
                            onChange={(e) => setEditForm({ ...editForm, constA: parseFloat(e.target.value) })}
                            className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                          />
                        ) : (
                          <span>{sp.constA}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.constB}
                            onChange={(e) => setEditForm({ ...editForm, constB: parseFloat(e.target.value) })}
                            className="w-16 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                          />
                        ) : (
                          <span>{sp.constB}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {sp.carbonFraction * 100}%
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {sp.conversionFactor}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(sp)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer text-xs font-semibold font-sans inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION B & C: CATALOG PRICING & PLATFORM RULES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION B: CATALOG PRICING CONTROL CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-stone-900 font-sans">
                B. Panel Kontrol Harga Katalog Karbon (CatalogPricingControlCard)
              </h2>
              <p className="text-[11px] text-slate-500 font-sans">
                Atur harga patokan tCO2e per kategori ekosistem untuk transaksi marketplace korporat.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-sans">
              KONTROL DINAMIS
            </span>
          </div>

          {/* Pricing Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                Harga Agroforestri Darat
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-500">Rp</span>
                <input
                  type="number"
                  step="5000"
                  value={pricing.agroforestryPrice}
                  onChange={(e) => setPricing({ ...pricing, agroforestryPrice: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#14382C] font-mono font-bold text-stone-900"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">per tCO2e (Alpukat, Kopi, dsb)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                Harga Premium Blue Carbon
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-500">Rp</span>
                <input
                  type="number"
                  step="5000"
                  value={pricing.blueCarbonPrice}
                  onChange={(e) => setPricing({ ...pricing, blueCarbonPrice: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#14382C] font-mono font-bold text-blue-900"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">per tCO2e (Mangrove Rhizophora)</span>
            </div>
          </div>

          {/* PriceBenchmarkBar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="font-bold text-slate-700">Formula Acuan Harga Industri (PriceBenchmarkBar):</span>
              <span className="font-mono text-emerald-800 font-bold">Total Rp {pricing.agroforestryPrice.toLocaleString('id-ID')}</span>
            </div>

            {/* Visual Split Bar */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-slate-600" 
                style={{ width: `${(pricing.idxCarbonFloor / pricing.agroforestryPrice) * 100}%` }}
                title="Batas Bawah IDXCarbon"
              />
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${((pricing.agroforestryPrice - pricing.idxCarbonFloor) / pricing.agroforestryPrice) * 100}%` }}
                title="Premi Dampak Sosial Petani Mikro"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
                <span className="text-slate-600">Bursa IDXCarbon: <strong className="font-mono text-slate-900">Rp {pricing.idxCarbonFloor.toLocaleString('id-ID')}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600">Premi Sosial Petani: <strong className="font-mono text-emerald-800">Rp {(pricing.agroforestryPrice - pricing.idxCarbonFloor).toLocaleString('id-ID')}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: PLATFORM RULES CONFIG FORM */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-stone-900 font-sans">
                C. Konfigurasi Komisi &amp; Geospasial PostGIS (PlatformRulesConfigForm)
              </h2>
              <p className="text-[11px] text-slate-500 font-sans">
                Pengaturan spasial ST_DWithin dan persentase potongan jasa platform.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 font-sans">
              GEOSPATIAL RULES
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Take Rate Fee Input */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-sans">
                  Persentase Komisi Platform (Take-Rate Fee)
                </label>
                <p className="text-[11px] text-slate-400 font-sans">
                  Dipotong setelah kas talangan audit dikembalikan penuh.
                </p>
              </div>
              <div className="w-28 relative shrink-0">
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="30"
                  value={platformRules.takeRateFee}
                  onChange={(e) => setPlatformRules({ ...platformRules, takeRateFee: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-mono font-bold text-stone-900 text-right pr-7"
                />
                <span className="absolute right-3 top-1.5 text-xs font-mono font-bold text-slate-500">%</span>
              </div>
            </div>

            {/* PostGIS Radius */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-sans">
                  Radius Maksimal Klaster ST_DWithin
                </label>
                <p className="text-[11px] text-slate-400 font-sans">
                  Jarak PostGIS untuk auto-clustering titik centroid poligon lahan.
                </p>
              </div>
              <div className="w-28 relative shrink-0">
                <input
                  type="number"
                  step="1"
                  value={platformRules.clusterRadiusKm}
                  onChange={(e) => setPlatformRules({ ...platformRules, clusterRadiusKm: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-mono font-bold text-stone-900 text-right pr-9"
                />
                <span className="absolute right-3 top-1.5 text-xs font-mono font-bold text-slate-500">km</span>
              </div>
            </div>

            {/* Minimum Audit Quota */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-sans">
                  Batas Kuota Minimum Audit Klaster
                </label>
                <p className="text-[11px] text-slate-400 font-sans">
                  Target akumulasi tonase Pre-Verified untuk membuka audit eksternal.
                </p>
              </div>
              <div className="w-28 relative shrink-0">
                <input
                  type="number"
                  step="50"
                  value={platformRules.minAuditQuota}
                  onChange={(e) => setPlatformRules({ ...platformRules, minAuditQuota: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-mono font-bold text-stone-900 text-right pr-14"
                />
                <span className="absolute right-3 top-1.5 text-xs font-mono font-bold text-slate-500">tCO2e</span>
              </div>
            </div>

            {/* Surveyor Geofence Tolerance */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-sans">
                  Toleransi Geofencing Check-In Surveyor
                </label>
                <p className="text-[11px] text-slate-400 font-sans">
                  Jarak maksimal GPS perangkat dari batas poligon kebun petani.
                </p>
              </div>
              <div className="w-28 relative shrink-0">
                <input
                  type="number"
                  step="5"
                  value={platformRules.surveyorGeofenceTolerance}
                  onChange={(e) => setPlatformRules({ ...platformRules, surveyorGeofenceTolerance: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-mono font-bold text-stone-900 text-right pr-12"
                />
                <span className="absolute right-3 top-1.5 text-xs font-mono font-bold text-slate-500">meter</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSavePricingAndRules}
              className="w-full py-2.5 text-xs font-bold text-white bg-[#14382C] hover:bg-[#1E4D3D] rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Simpan Seluruh Parameter Live Platform</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL TAMBAH SPESIES POHON BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 bg-[#14382C] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    Tambah Spesies Pohon Baru
                  </h3>
                  <p className="text-xs text-emerald-200 font-sans">
                    Masukkan parameter biometrik &amp; konstanta alometrik
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSpecies} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                  Nama Spesies (Lokal &amp; Latin)
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Misal: Mahoni Daun Lebar (Swietenia macrophylla)"
                  value={newSpecies.name}
                  onChange={(e) => setNewSpecies({ ...newSpecies, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#14382C] font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                  Kategori Tanaman
                </label>
                <select
                  value={newSpecies.category}
                  onChange={(e) => setNewSpecies({ ...newSpecies, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-sans"
                >
                  <option value="Agroforestri Buah Produktif">Agroforestri Buah Produktif</option>
                  <option value="Tanaman Keras Cepat Tumbuh">Tanaman Keras Cepat Tumbuh</option>
                  <option value="Tanaman Kayu Keras Bernilai Tinggi">Tanaman Kayu Keras Bernilai Tinggi</option>
                  <option value="Blue Carbon Pesisir">Blue Carbon Pesisir</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-sans">
                    Wood Density (ρ)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={newSpecies.woodDensity}
                    onChange={(e) => setNewSpecies({ ...newSpecies, woodDensity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-sans">
                    Konstanta Alometrik (a)
                  </label>
                  <input 
                    type="number"
                    step="0.0001"
                    required
                    value={newSpecies.constA}
                    onChange={(e) => setNewSpecies({ ...newSpecies, constA: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-sans">
                    Eksponen Alometrik (b)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={newSpecies.constB}
                    onChange={(e) => setNewSpecies({ ...newSpecies, constB: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-sans">
                    Faktor CO2e (44/12)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    disabled
                    value={newSpecies.conversionFactor}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer font-sans"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#14382C] hover:bg-[#1E4D3D] rounded-xl shadow-xs transition cursor-pointer font-sans"
                >
                  Simpan Spesies
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
