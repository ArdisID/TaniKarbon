import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Plus, 
  ShieldCheck, 
  Trees, 
  Eye, 
  Leaf,
  Maximize2,
  Calendar,
  Ruler
} from 'lucide-react';
import { formatRupiah } from '../../data';

// Helper for LandStatusBadge 5 official colors
export function LandStatusBadge({ status }) {
  switch (status) {
    case 'draft':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300">
          <span className="w-2 h-2 rounded-full bg-stone-400"></span>
          <span>Draft (Belum Diajukan)</span>
        </span>
      );
    case 'waiting_survey':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Menunggu Survei Lapangan</span>
        </span>
      );
    case 'pre_verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-300">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span>Pre-Verified / Antrean Klaster</span>
        </span>
      );
    case 'audit_verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Terverifikasi Audit (Siap Jual)</span>
        </span>
      );
    case 'active':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-900 text-emerald-100 border border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Aktif Menghasilkan (Dibeli Perusahaan)</span>
        </span>
      );
  }
}

export default function LandManagementView({ 
  onOpenSamplePhoto, 
  onNavigateTab,
  customPlots = []
}) {
  const [openBlocks, setOpenBlocks] = useState({
    'plot-1-alpukat': true,
    'plot-1-sengon': false,
    'plot-1-kopi': false,
    'plot-2-durian': true,
    'plot-2-sengon': false
  });

  const toggleBlock = (key) => {
    setOpenBlocks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Base plots data with full specification details
  const plots = [
    {
      id: 'plot-1',
      name: 'Lahan 1 - Kebun Pekarangan Rumah Garung',
      centroidCoords: '-7.3639, 109.9886',
      areaHa: 0.45,
      areaM2: 4500,
      clusterAffiliation: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      elevation: '920 mdpl',
      status: 'active',
      totalTrees: 14,
      totalCarbon: 8.8,
      annualRevenue: 1408000,
      satelliteImage: '/hero-landscape.png',
      blocks: [
        {
          key: 'plot-1-alpukat',
          variety: 'Blok Alpukat Mentega (8 Pohon)',
          species: 'Alpukat Mentega (Persea americana)',
          absorptionCategory: 'Kategori Serapan Sedang-Tinggi (Kanopi Lebar)',
          blockPortionM2: 2000,
          population: 8,
          plantMonthYear: 'Maret 2019',
          plantAgeYears: 7,
          avgGirthK: 40,
          avgDbhD: (40 / Math.PI).toFixed(2), // D = K / pi = 12.73 cm
          avgHeight: '9.2 Meter',
          carbonFormulaText: 'Serapan per pohon: 400 kg CO2/thn × 8 pohon = 3.2 tCO2e/tahun',
          carbonContribution: '3.2 tCO2e/thn',
          revenueContribution: 'Rp 512.000/thn',
          samplesBreakdown: [
            { id: 1, girth: 40, dbh: 12.7, height: 9.2, photo: '/tree-dbh-sample.jpg' },
            { id: 2, girth: 42, dbh: 13.4, height: 9.5, photo: '/tree-dbh-sample.jpg' },
            { id: 3, girth: 38, dbh: 12.1, height: 8.9, photo: '/tree-dbh-sample.jpg' }
          ],
          treeData: {
            id: 'TK-AVD-001',
            species: 'Alpukat Mentega',
            age: 7,
            dbh: 40,
            co2PerYear: 0.40,
            samplePhoto: '/tree-dbh-sample.jpg'
          }
        },
        {
          key: 'plot-1-sengon',
          variety: 'Blok Sengon Laut (4 Pohon)',
          species: 'Sengon Laut (Paraserianthes falcataria)',
          absorptionCategory: 'Kategori Serapan Sangat Tinggi (Fast-Growing Biomass)',
          blockPortionM2: 1500,
          population: 4,
          plantMonthYear: 'Januari 2021',
          plantAgeYears: 5,
          avgGirthK: 44,
          avgDbhD: (44 / Math.PI).toFixed(2),
          avgHeight: '15.5 Meter',
          carbonFormulaText: 'Serapan per pohon: 950 kg CO2/thn × 4 pohon = 3.8 tCO2e/tahun',
          carbonContribution: '3.8 tCO2e/thn',
          revenueContribution: 'Rp 608.000/thn',
          samplesBreakdown: [
            { id: 1, girth: 44, dbh: 14.0, height: 15.5, photo: '/tree-dbh-sample.jpg' },
            { id: 2, girth: 46, dbh: 14.6, height: 16.0, photo: '/tree-dbh-sample.jpg' },
            { id: 3, girth: 42, dbh: 13.3, height: 15.0, photo: '/tree-dbh-sample.jpg' }
          ],
          treeData: {
            id: 'TK-SNG-002',
            species: 'Sengon Laut',
            age: 5,
            dbh: 44,
            co2PerYear: 0.95,
            samplePhoto: '/tree-dbh-sample.jpg'
          }
        },
        {
          key: 'plot-1-kopi',
          variety: 'Blok Kopi Arabika Naungan (2 Pohon)',
          species: 'Kopi Arabika (Coffea arabica)',
          absorptionCategory: 'Kategori Strata Bawah Agroforestri',
          blockPortionM2: 1000,
          population: 2,
          plantMonthYear: 'November 2022',
          plantAgeYears: 4,
          avgGirthK: 20,
          avgDbhD: (20 / Math.PI).toFixed(2),
          avgHeight: '3.2 Meter',
          carbonFormulaText: 'Serapan per pohon: 900 kg CO2/thn × 2 pohon = 1.8 tCO2e/tahun',
          carbonContribution: '1.8 tCO2e/thn',
          revenueContribution: 'Rp 288.000/thn',
          samplesBreakdown: [
            { id: 1, girth: 20, dbh: 6.4, height: 3.2, photo: '/tree-dbh-sample.jpg' },
            { id: 2, girth: 21, dbh: 6.7, height: 3.4, photo: '/tree-dbh-sample.jpg' },
            { id: 3, girth: 19, dbh: 6.0, height: 3.0, photo: '/tree-dbh-sample.jpg' }
          ],
          treeData: {
            id: 'TK-KPI-003',
            species: 'Kopi Arabika',
            age: 4,
            dbh: 20,
            co2PerYear: 0.90,
            samplePhoto: '/tree-dbh-sample.jpg'
          }
        }
      ]
    },
    {
      id: 'plot-2',
      name: 'Lahan 2 - Kebun Lereng Gunung Sindoro',
      centroidCoords: '-7.3512, 109.9921',
      areaHa: 0.75,
      areaM2: 7500,
      clusterAffiliation: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      elevation: '1.140 mdpl',
      status: 'active',
      totalTrees: 10,
      totalCarbon: 5.4,
      annualRevenue: 864000,
      satelliteImage: '/hero-agroforest.jpg',
      blocks: [
        {
          key: 'plot-2-durian',
          variety: 'Blok Durian Montong (6 Pohon)',
          species: 'Durian Montong (Durio zibethinus)',
          absorptionCategory: 'Kategori Pohon Kayu Keras & Buah Menahun',
          blockPortionM2: 4500,
          population: 6,
          plantMonthYear: 'Desember 2017',
          plantAgeYears: 9,
          avgGirthK: 42,
          avgDbhD: (42 / Math.PI).toFixed(2),
          avgHeight: '11.0 Meter',
          carbonFormulaText: 'Serapan per pohon: 500 kg CO2/thn × 6 pohon = 3.0 tCO2e/tahun',
          carbonContribution: '3.0 tCO2e/thn',
          revenueContribution: 'Rp 480.000/thn',
          samplesBreakdown: [
            { id: 1, girth: 42, dbh: 13.4, height: 11.0, photo: '/tree-dbh-sample.jpg' },
            { id: 2, girth: 44, dbh: 14.0, height: 11.5, photo: '/tree-dbh-sample.jpg' },
            { id: 3, girth: 40, dbh: 12.7, height: 10.5, photo: '/tree-dbh-sample.jpg' }
          ],
          treeData: {
            id: 'TK-DRN-005',
            species: 'Durian Montong',
            age: 9,
            dbh: 42,
            co2PerYear: 0.50,
            samplePhoto: '/tree-dbh-sample.jpg'
          }
        },
        {
          key: 'plot-2-sengon',
          variety: 'Blok Sengon Penahan Erosi (4 Pohon)',
          species: 'Sengon Laut (Paraserianthes falcataria)',
          absorptionCategory: 'Kategori Fast-Growing Sabuk Konservasi',
          blockPortionM2: 3000,
          population: 4,
          plantMonthYear: 'Agustus 2020',
          plantAgeYears: 6,
          avgGirthK: 39,
          avgDbhD: (39 / Math.PI).toFixed(2),
          avgHeight: '14.2 Meter',
          carbonFormulaText: 'Serapan per pohon: 600 kg CO2/thn × 4 pohon = 2.4 tCO2e/tahun',
          carbonContribution: '2.4 tCO2e/thn',
          revenueContribution: 'Rp 384.000/thn',
          samplesBreakdown: [
            { id: 1, girth: 39, dbh: 12.4, height: 14.2, photo: '/tree-dbh-sample.jpg' },
            { id: 2, girth: 41, dbh: 13.0, height: 14.8, photo: '/tree-dbh-sample.jpg' },
            { id: 3, girth: 37, dbh: 11.8, height: 13.6, photo: '/tree-dbh-sample.jpg' }
          ],
          treeData: {
            id: 'TK-SNG-006',
            species: 'Sengon Laut',
            age: 6,
            dbh: 39,
            co2PerYear: 0.60,
            samplePhoto: '/tree-dbh-sample.jpg'
          }
        }
      ]
    },
    ...customPlots
  ];

  // Data for LandComparisonChart
  const chartData = plots.map(p => ({
    name: p.name.includes('Pekarangan') ? 'Lahan 1 (Pekarangan)' : 'Lahan 2 (Sindoro)',
    carbon: p.totalCarbon,
    revenue: p.annualRevenue,
    trees: p.totalTrees,
    area: p.areaHa
  }));

  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#14382C] text-white p-3 rounded-2xl shadow-xl border border-emerald-500/30 text-xs">
          <p className="font-bold text-emerald-300">{data.name}</p>
          <div className="mt-1 space-y-0.5">
            <p className="font-mono text-sm font-extrabold">{data.carbon} tCO2e/thn</p>
            <p className="text-emerald-200 text-[11px]">{formatRupiah(data.revenue)} / tahun</p>
            <p className="text-stone-300 text-[10px]">{data.trees} Pohon • {data.area} Ha</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Inventaris Digital Multispesies
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1">
            Manajemen Lahan &amp; Pohon Agroforestri
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Inventaris digital yang memisahkan data antar lahan untuk memantau performa serapan karbon per lokasi dan per spesies.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('wizard')}
          className="px-4 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Tambah Lahan Baru</span>
        </button>
      </div>

      {/* A. Grafik Komparasi Produktivitas Lahan (LandComparisonChart) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#14382C]">
              Grafik Komparasi Produktivitas Lahan (LandComparisonChart)
            </h2>
            <p className="text-xs text-stone-500">
              Membandingkan kontribusi karbon antar lahan dan jenis pohon (tCO2e/tahun) agar petani memahami lahan mana yang paling produktif.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
            <span className="font-medium text-[11px]">Serapan Karbon (tCO2e)</span>
          </div>
        </div>

        <div className="h-44 sm:h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis 
                type="number" 
                unit=" t" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 11, fill: '#14382C', fontWeight: 600 }}
                width={150}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }} />
              <Bar 
                dataKey="carbon" 
                radius={[0, 8, 8, 0]} 
                barSize={20}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#059669' : '#10B981'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* B. Daftar Kartu Lahan (LandPlotCard) */}
      <div className="space-y-6">
        {plots.map((plot) => (
          <div 
            key={plot.id}
            className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden"
          >
            {/* Header Kartu Lahan: Nama, Titik Koordinat Tengah (Centroid), Total Luas, Nama Klaster */}
            <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Mini-Map Preview */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-emerald-500/30 shadow-xs group bg-stone-900">
                  <img
                    src={plot.satelliteImage}
                    alt={plot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 border-2 border-emerald-400 bg-emerald-500/20 pointer-events-none rounded-xl m-1.5 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-emerald-200 font-bold bg-black/60 px-1 py-0.5 rounded">
                      POLIGON
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-[#14382C]">
                      {plot.name}
                    </h2>
                    {/* Badge Status Siklus Lahan (5 Warna Status) */}
                    <LandStatusBadge status={plot.status} />
                  </div>

                  {/* Centroid coordinates and cluster affiliation */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mt-2">
                    <span className="font-bold text-stone-800">
                      Luas Area: {plot.areaHa} Ha ({plot.areaM2.toLocaleString('id-ID')} m²)
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      Titik Tengah (Centroid): {plot.centroidCoords}
                    </span>
                    <span className="text-stone-400">Elevasi: {plot.elevation}</span>
                  </div>

                  <div className="mt-1 text-xs text-emerald-800 font-semibold">
                    📍 Tergabung di: {plot.clusterAffiliation}
                  </div>
                </div>
              </div>

              <div className="text-left md:text-right shrink-0 p-3 bg-stone-50 rounded-2xl border border-stone-200/60 md:self-center">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Taksiran Nilai Bersih</span>
                <strong className="text-base font-black text-emerald-700 block">
                  {formatRupiah(plot.annualRevenue)} / thn
                </strong>
                <span className="text-[10px] text-stone-500">{plot.totalTrees} Batang Pohon Hidup</span>
              </div>
            </div>

            {/* C. Komponen Detail Blok Tanam (PlantingBlockAccordion) */}
            <div className="p-4 sm:p-6 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-600 mb-1 px-1">
                <span>Rincian Blok Tanam Berdasarkan Spesies (Multi-Spesies Agroforestri):</span>
                <span className="text-stone-400 text-[11px]">Buka / Tutup Blok</span>
              </div>

              {plot.blocks.map((block) => {
                const isOpen = !!openBlocks[block.key];
                return (
                  <div
                    key={block.key}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs transition"
                  >
                    {/* Accordion Trigger */}
                    <button
                      type="button"
                      onClick={() => toggleBlock(block.key)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-stone-50/70 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                          <Trees className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-[#14382C] truncate">
                              {block.variety}
                            </h4>
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600">
                              {block.absorptionCategory}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 truncate italic">{block.species}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {block.carbonContribution}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                      </div>
                    </button>

                    {/* Accordion Expanded Content */}
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-stone-100 bg-stone-50/30 space-y-3.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {/* Luas Blok & Populasi */}
                          <div className="p-3 bg-white rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-400 font-bold uppercase block">Luas Blok &amp; Populasi</span>
                            <strong className="text-stone-800 text-xs font-bold block">
                              {block.blockPortionM2.toLocaleString('id-ID')} m²
                            </strong>
                            <span className="text-[10px] text-stone-500">
                              dari total {plot.areaM2.toLocaleString('id-ID')} m² ({block.population} Pohon)
                            </span>
                          </div>

                          {/* Usia Tanaman */}
                          <div className="p-3 bg-white rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-400 font-bold uppercase block">Usia Tanaman</span>
                            <strong className="text-stone-800 text-xs font-bold block">
                              {block.plantAgeYears} Tahun
                            </strong>
                            <span className="text-[10px] text-stone-500">
                              Tanam: {block.plantMonthYear}
                            </span>
                          </div>

                          {/* SampleMetricsPill: Konversi D = K / pi */}
                          <div className="p-3 bg-white rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-400 font-bold uppercase block">Konversi Diameter (D = K / π)</span>
                            <strong className="text-[#14382C] text-xs font-black block">
                              Lingkar: {block.avgGirthK} cm
                            </strong>
                            <span className="text-[11px] font-mono font-bold text-emerald-700">
                              Diameter: {block.avgDbhD} cm
                            </span>
                          </div>

                          {/* Tombol Lihat Detail & Foto Sampel */}
                          <div className="p-3 bg-white rounded-xl border border-stone-200 flex flex-col justify-center">
                            <button
                              type="button"
                              onClick={() => onOpenSamplePhoto(block.treeData)}
                              className="w-full py-2 px-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Lihat Foto Sampel</span>
                            </button>
                          </div>
                        </div>

                        {/* Kotak Output Karbon per Blok (Rumus Alometrik Eksplisit) */}
                        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-emerald-700 shrink-0" />
                            <div>
                              <strong className="text-emerald-950 font-bold block">
                                Rumus Alometrik: {block.carbonFormulaText}
                              </strong>
                              <span className="text-[11px] text-emerald-800">
                                Nilai Dividen Bersih: {block.revenueContribution} (Hak Petani 88%)
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                            Estimasi Tinggi Kanopi: {block.avgHeight}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
