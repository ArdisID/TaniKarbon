import React, { useState } from 'react';
import { 
  Award, 
  Download, 
  FileArchive, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  ExternalLink, 
  Search, 
  Filter, 
  Sparkles, 
  Building2, 
  FileText, 
  RefreshCw, 
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import AuditApprovalAndMintingModal from './AuditApprovalAndMintingModal';

export default function ExternalAuditAndMintingView({ onToast }) {
  const [selectedClusterToMint, setSelectedClusterToMint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ready'); // 'ready' | 'minted' | 'renewal'

  // Clusters Data
  const [clusters, setClusters] = useState([
    {
      id: 'CLU-WNSB-001',
      name: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      region: 'Wonosobo, Jawa Tengah',
      farmersCount: 48,
      hectares: 34.5,
      preVerifiedCarbon: 520,
      targetQuota: 500,
      completionRate: 104,
      status: 'ready', // 'ready' | 'in_audit' | 'minted'
      auditor: 'PT Sucofindo (Terjadwal)',
      vintage: '2026',
      costAdvance: 15000000,
      availableQuota: 0,
      dateReady: '24 Okt 2026'
    },
    {
      id: 'CLU-SNDR-002',
      name: 'Klaster Konservasi Lereng Sindoro Utara',
      region: 'Temanggung, Jawa Tengah',
      farmersCount: 36,
      hectares: 28.0,
      preVerifiedCarbon: 500,
      targetQuota: 500,
      completionRate: 100,
      status: 'ready',
      auditor: 'PT Mutuagung Lestari (Terjadwal)',
      vintage: '2026',
      costAdvance: 15000000,
      availableQuota: 0,
      dateReady: '25 Okt 2026'
    },
    {
      id: 'CLU-DMK-003',
      name: 'Klaster Sabuk Pesisir Demak (Mangrove Blue Carbon)',
      region: 'Demak, Jawa Tengah',
      farmersCount: 82,
      hectares: 45.0,
      preVerifiedCarbon: 1200,
      targetQuota: 500,
      completionRate: 240,
      status: 'minted',
      auditor: 'PT Sucofindo - No. Reg: AUD-2026-SCF-081',
      vintage: '2026',
      costAdvance: 20000000,
      availableQuota: 1180,
      dateReady: '12 Sep 2026'
    },
    {
      id: 'CLU-MLG-004',
      name: 'Klaster Kopi Agroforestri Dampit Malang',
      region: 'Malang, Jawa Timur',
      farmersCount: 110,
      hectares: 68.2,
      preVerifiedCarbon: 2200,
      targetQuota: 500,
      completionRate: 440,
      status: 'minted',
      auditor: 'SGS Indonesia - No. Reg: AUD-2025-SGS-992',
      vintage: '2025',
      costAdvance: 25000000,
      availableQuota: 180,
      dateReady: '05 Jan 2025',
      renewalDueMonths: 1, // Ready for renewal to 2026/2027
      renewalStatus: 'due'
    }
  ]);

  // Handler: Export Cluster Bundle (.ZIP / GeoJSON / CSV)
  const handleExportClusterBundle = (cluster) => {
    if (onToast) {
      onToast(`Mengunduh Paket Audit untuk ${cluster.name} (.ZIP: GeoJSON Poligon, CSV Alometrik, Foto Sampul)`);
    }

    // Mock file download trigger
    const dummyGeoJson = JSON.stringify({
      type: "FeatureCollection",
      clusterId: cluster.id,
      clusterName: cluster.name,
      preVerifiedCarbon: cluster.preVerifiedCarbon,
      vintage: cluster.vintage,
      features: [
        {
          type: "Feature",
          properties: { farmer: "Pak Joko Widodo", trees: 120, species: "Alpukat Mentega" },
          geometry: { type: "Polygon", coordinates: [[[109.988, -7.363], [109.989, -7.363], [109.989, -7.364], [109.988, -7.364], [109.988, -7.363]]] }
        }
      ]
    }, null, 2);

    const blob = new Blob([dummyGeoJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Paket_Audit_Bundel_${cluster.id}_PostGIS.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handler: Confirm Minting
  const handleConfirmMint = (mintData) => {
    setClusters(prev => prev.map(c => {
      if (c.id === mintData.clusterId) {
        return {
          ...c,
          status: 'minted',
          auditor: `${mintData.auditorName} (${mintData.auditRefNumber})`,
          vintage: mintData.vintageYear,
          costAdvance: mintData.auditCostAdvance,
          availableQuota: mintData.approvedQuota
        };
      }
      return c;
    }));

    if (onToast) {
      onToast(`Sukses! ${mintData.clusterId} disahkan (${mintData.approvedQuota} tCO2e). Stepper petani lulus ke Tahap 4 & Klaster live di Bursa B2B.`);
    }
  };

  // Handler: Annual Renewal Trigger
  const handleTriggerAnnualRenewal = (cluster) => {
    if (onToast) {
      onToast(`Pemicu Perpanjangan Vintage (Annual Renewal) dikirim ke ${cluster.farmersCount} petani di ${cluster.name}!`);
    }
  };

  const readyClusters = clusters.filter(c => c.status === 'ready');
  const mintedClusters = clusters.filter(c => c.status === 'minted');
  const renewalClusters = clusters.filter(c => c.renewalStatus === 'due' || c.vintage === '2025');

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Registri Otoritas Bursa Karbon
            </span>
            <span className="text-xs text-slate-500 font-sans">
              Standar ISO 14064-2 &amp; SRN-PPI KLHK
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1 font-sans">
            Validasi Audit Eksternal &amp; Penerbitan Bursa
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-sans">
            Jembatan krusial antara verifikasi lapangan Petani &amp; Surveyor di hulu dengan bursa emisi korporat di hilir. Sahkan laporan auditor independen untuk mencetak kuota karbon live.
          </p>
        </div>

        {/* Quick Stat Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-sans block">Siap Diaudit Eksternal</span>
              <span className="text-base font-bold text-stone-900 font-mono">
                {readyClusters.length} Klaster <span className="text-xs font-normal text-slate-500">({readyClusters.reduce((acc, c) => acc + c.preVerifiedCarbon, 0)} tCO2e)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('ready')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'ready'
              ? 'bg-[#14382C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Klaster Siap Audit &ge; 500 tCO2e ({readyClusters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('minted')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'minted'
              ? 'bg-[#14382C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Telah Terbit di Bursa ({mintedClusters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('renewal')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'renewal'
              ? 'bg-[#14382C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>Siklus Tahunan / Perpanjangan Vintage ({renewalClusters.length})</span>
        </button>
      </div>

      {/* TAB 1: AUDIT READY CLUSTER LIST */}
      {activeTab === 'ready' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 font-sans">
                A. Daftar Klaster Mencapai Kuota Minimum (&ge; 500 tCO2e)
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Klaster ini telah mengumpulkan tonase Pre-Verified 100% dan siap diserahkan kepada Lembaga Verifikasi Validasi (LVV) independen.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-sans">Lembaga Rekanan:</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  PT Sucofindo
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Mutuagung Lestari
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  TÜV NORD
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {readyClusters.map((cluster) => (
              <div 
                key={cluster.id}
                className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs hover:border-blue-400 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  
                  {/* Left: Cluster Identification */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        {cluster.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800">
                        KUOTA 100% TERCAPAI
                      </span>
                      <span className="text-xs text-slate-400 font-sans">
                        • Siap sejak: {cluster.dateReady}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 font-sans">
                      {cluster.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-sans">
                      <span>Wilayah: <strong>{cluster.region}</strong></span>
                      <span>Petani Tergabung: <strong className="font-mono">{cluster.farmersCount} Mitra</strong></span>
                      <span>Luas Lahan: <strong className="font-mono">{cluster.hectares} ha</strong></span>
                    </div>

                    {/* Progress Bar Tonase */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 font-sans">Akumulasi Pre-Verified:</span>
                        <span className="font-mono font-bold text-blue-700">
                          {cluster.preVerifiedCarbon} / {cluster.targetQuota} tCO2e ({cluster.completionRate}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
                    {/* Export Bundle Button */}
                    <button
                      onClick={() => handleExportClusterBundle(cluster)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer font-sans whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                      <span>Export Bundel Data Auditor (.ZIP / GeoJSON / CSV)</span>
                    </button>

                    {/* Open Minting Modal */}
                    <button
                      onClick={() => setSelectedClusterToMint(cluster)}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-[#14382C] hover:bg-[#1E4D3D] rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer font-sans whitespace-nowrap"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Sahkan Dokumen Audit &amp; Terbitkan Bursa</span>
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MINTED CLUSTERS (BURSA LIVE) */}
      {activeTab === 'minted' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 font-sans">
              Klaster Telah Lulus Audit &amp; Terbit di Bursa Karbon
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Klaster ini aktif diperjualbelikan kepada perusahaan di Marketplace Korporat dan siap dipesan via API Auto-Buy.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                    <th className="py-3 px-4">Kode Klaster</th>
                    <th className="py-3 px-4 min-w-[220px]">Nama Klaster &amp; Wilayah</th>
                    <th className="py-3 px-4 whitespace-nowrap">Lembaga Auditor &amp; No. Sertifikat</th>
                    <th className="py-3 px-4 whitespace-nowrap">Vintage</th>
                    <th className="py-3 px-4 whitespace-nowrap">Biaya Talangan Audit</th>
                    <th className="py-3 px-4 whitespace-nowrap">Stok Bursa (Available)</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status Pasar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {mintedClusters.map((cluster) => (
                    <tr key={cluster.id} className="hover:bg-slate-50/60 transition font-sans">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {cluster.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{cluster.name}</div>
                        <div className="text-[11px] text-slate-500">{cluster.region} • {cluster.farmersCount} Petani</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{cluster.auditor}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        Vintage {cluster.vintage}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-700 whitespace-nowrap">
                        Rp {cluster.costAdvance.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {cluster.availableQuota} tCO2e
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                          LIVE DI BURSA
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLUSTER VINTAGE RENEWAL MANAGER (HALAMAN 3 BAGIAN C) */}
      {activeTab === 'renewal' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900 font-sans">
                C. Panel Kontrol Siklus Tahunan / Perpanjangan Vintage (ClusterVintageRenewalManager)
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Memantau klaster yang mendekati atau telah memasuki usia 12 bulan untuk pembukaan kuota tahun berikutnya (misal: Vintage 2026 &rarr; Vintage 2027).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {renewalClusters.map((cluster) => (
              <div 
                key={cluster.id}
                className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/90 shadow-2xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900">
                        {cluster.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 font-sans">
                        MASA SIKLUS 12 BULAN TERPENUHI
                      </span>
                      <span className="text-xs text-slate-500 font-sans">
                        • Vintage Saat Ini: <strong className="font-mono">{cluster.vintage}</strong>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 font-sans">
                      {cluster.name}
                    </h3>

                    <p className="text-xs text-slate-600 font-sans">
                      Klaster ini telah menyelesaikan penjualan kuota Vintage {cluster.vintage}. Saatnya memicu pengukuran pertumbuhan pohon (lingkar batang) tahun ke-2 kepada para petani untuk merilis kuota <strong className="font-mono">Vintage {Number(cluster.vintage) + 1}</strong>.
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => handleTriggerAnnualRenewal(cluster)}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-purple-900 hover:bg-purple-800 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer font-sans whitespace-nowrap"
                    >
                      <RefreshCw className="w-4 h-4 text-purple-300" />
                      <span>Picu Notifikasi AnnualVintageRenewalCard Petani</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-sans">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Dampak Aksi: Membuka input pembaruan data pohon di halaman utama {cluster.farmersCount} petani mitra.</span>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px]">Next: Vintage {Number(cluster.vintage) + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Pengesahan Audit & Pencetakan Kuota */}
      {selectedClusterToMint && (
        <AuditApprovalAndMintingModal
          cluster={selectedClusterToMint}
          isOpen={Boolean(selectedClusterToMint)}
          onClose={() => setSelectedClusterToMint(null)}
          onConfirmMint={handleConfirmMint}
        />
      )}

    </div>
  );
}
