import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Building2, 
  Edit3, 
  X, 
  Sparkles, 
  Check, 
  Compass, 
  Award, 
  ArrowRight 
} from 'lucide-react';
import { getAdminUsers } from '../../api/admin';

// Helper format display user code
function formatUserCode(id, prefix = 'USR') {
  const str = String(id || '');
  if (str.startsWith('SRV-') || str.startsWith('FAR-') || str.startsWith('CORP-') || str.startsWith('ADM-')) {
    return str;
  }
  return `${prefix}-${str.slice(0, 8).toUpperCase()}`;
}

export default function UserAndSurveyorManagementView({ onToast }) {
  const [activeTab, setActiveTab] = useState('surveyors'); // 'surveyors' | 'farmers' | 'corporates'
  const [searchQuery, setSearchQuery] = useState('');
  const [dbUsers, setDbUsers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        const data = await getAdminUsers();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDbUsers(data);
        }
      } catch (e) {
        console.warn('Backend users list fallback to mock:', e);
      }
    }
    loadUsers();
    return () => { isMounted = false; };
  }, []);
  
  // Surveyor Assignment Drawer state
  const [selectedSurveyorForAssign, setSelectedSurveyorForAssign] = useState(null);
  const [assignedClusterInput, setAssignedClusterInput] = useState('');

  // Surveyors Data
  const [surveyors, setSurveyors] = useState([
    {
      id: 'SRV-BUDI-09',
      name: 'Budi Santoso, S.Hut.',
      assignedClusterId: 'CLU-WNSB-001',
      assignedClusterName: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      region: 'Kec. Kejajar & Garung, Wonosobo',
      tasksCompleted: 48,
      gpsGeofenceCompliance: 98.5, // 98.5% <= 50m
      hasDeviationAlert: false,
      deviationRate: 3.2,
      status: 'active'
    },
    {
      id: 'SRV-SITI-04',
      name: 'Siti Rahmawati, S.Si.',
      assignedClusterId: 'CLU-SNDR-002',
      assignedClusterName: 'Klaster Konservasi Lereng Sindoro Utara',
      region: 'Kec. Kledung, Temanggung',
      tasksCompleted: 36,
      gpsGeofenceCompliance: 99.1,
      hasDeviationAlert: false,
      deviationRate: 2.8,
      status: 'active'
    },
    {
      id: 'SRV-ANDI-12',
      name: 'Andi Firmansyah',
      assignedClusterId: 'CLU-DMK-003',
      assignedClusterName: 'Klaster Sabuk Pesisir Demak (Mangrove)',
      region: 'Kec. Sayung, Demak',
      tasksCompleted: 82,
      gpsGeofenceCompliance: 86.4, // Warning < 90%
      hasDeviationAlert: true, // Warning deviasi > 15%
      deviationRate: 16.4,
      status: 'review_required'
    },
    {
      id: 'SRV-HNDR-07',
      name: 'Hendra Gunawan, S.P.',
      assignedClusterId: 'CLU-MLG-004',
      assignedClusterName: 'Klaster Kopi Agroforestri Dampit Malang',
      region: 'Kec. Dampit & Tirtoyudo, Malang',
      tasksCompleted: 110,
      gpsGeofenceCompliance: 97.8,
      hasDeviationAlert: false,
      deviationRate: 4.1,
      status: 'active'
    }
  ]);

  // Farmers Directory Data
  const [farmers] = useState([
    {
      id: 'FAR-WNSB-001',
      name: 'Pak Joko Widodo',
      cluster: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      landArea: '1.2 ha',
      treesCount: 120,
      quotaClaimed: '2.40 tCO2e',
      kycStatus: 'Verified KTP & Lahan',
      phone: '0812-9847-1920'
    },
    {
      id: 'FAR-WNSB-002',
      name: 'Pak Slamet Riyadi',
      cluster: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      landArea: '0.8 ha',
      treesCount: 95,
      quotaClaimed: '1.90 tCO2e',
      kycStatus: 'Verified KTP & Lahan',
      phone: '0857-1829-3712'
    },
    {
      id: 'FAR-DMK-042',
      name: 'Ibu Siti Maryam',
      cluster: 'Klaster Sabuk Pesisir Demak',
      landArea: '2.5 ha',
      treesCount: 450,
      quotaClaimed: '5.20 tCO2e',
      kycStatus: 'Verified KTP & Lahan',
      phone: '0813-9182-3718'
    }
  ]);

  // Corporate Directory Data
  const [corporates] = useState([
    {
      code: 'CORP-IHN-001',
      name: 'PT Industri Hijau Nusantara (Tbk)',
      taxId: '01.382.918.4-012.000',
      kybStatus: 'SRN-PPI Terverifikasi',
      depositBalance: 'Rp 148.500.000',
      totalRetiredCarbon: '3.450 tCO2e',
      tier: 'Tier 1 Enterprise ESG'
    },
    {
      code: 'CORP-LMK-002',
      name: 'PT Logistik Maritim Katulistiwa',
      taxId: '02.491.827.1-014.000',
      kybStatus: 'SRN-PPI Terverifikasi',
      depositBalance: 'Rp 64.000.000',
      totalRetiredCarbon: '1.200 tCO2e',
      tier: 'Corporate Partner'
    },
    {
      code: 'CORP-NPP-003',
      name: 'PT Nusantara Pulp & Paper',
      taxId: '01.992.481.5-019.000',
      kybStatus: 'Review Berkas Pajak',
      depositBalance: 'Rp 75.000.000',
      totalRetiredCarbon: '2.800 tCO2e',
      tier: 'Industrial Direct Buyer'
    }
  ]);

  // Open Drawer Handler
  const handleOpenAssignDrawer = (srv) => {
    setSelectedSurveyorForAssign(srv);
    setAssignedClusterInput(srv.assignedClusterId);
  };

  // Save Assignment Handler
  const handleSaveAssignment = () => {
    const clusterMap = {
      'CLU-WNSB-001': 'Klaster Agroforestri Dusun Garung - Wonosobo',
      'CLU-SNDR-002': 'Klaster Konservasi Lereng Sindoro Utara',
      'CLU-DMK-003': 'Klaster Sabuk Pesisir Demak (Mangrove)',
      'CLU-MLG-004': 'Klaster Kopi Agroforestri Dampit Malang'
    };

    setSurveyors(prev => prev.map(s => {
      if (s.id === selectedSurveyorForAssign.id) {
        return {
          ...s,
          assignedClusterId: assignedClusterInput,
          assignedClusterName: clusterMap[assignedClusterInput] || assignedClusterInput
        };
      }
      return s;
    }));

    if (onToast) {
      onToast(`Wilayah tugas ${selectedSurveyorForAssign.name} berhasil ditautkan ke ${assignedClusterInput}!`);
    }

    setSelectedSurveyorForAssign(null);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              Otoritas Manajemen Ekosistem
            </span>
            <span className="text-xs text-slate-500 font-sans">
              Penugasan Spasial &amp; Verifikasi Pengguna
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1 font-sans">
            Manajemen Pengguna &amp; Wilayah Surveyor
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-sans">
            Tautkan petugas surveyor lapangan ke klaster/kecamatan tertentu untuk penugasan tiket otomatis, pantau metrik geofencing kepatuhan, serta kelola verifikasi petani dan pembeli korporat.
          </p>
        </div>

        {/* Quick Stat Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-2xs font-sans">
            <span className="text-[10px] text-slate-500 font-sans block">Surveyor Aktif Terpetakan</span>
            <span className="text-sm font-bold text-stone-900 font-sans tabular-nums">
              {surveyors.length} Petugas Lapangan
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('surveyors')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'surveyors'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Compass className={`w-4 h-4 ${activeTab === 'surveyors' ? 'text-amber-200' : 'text-slate-500'}`} />
          <span>Penugasan Wilayah &amp; Kepatuhan Surveyor ({surveyors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('farmers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'farmers'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'farmers' ? 'text-amber-200' : 'text-slate-500'}`} />
          <span>Direktori Ringkas Mitra Petani ({farmers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('corporates')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'corporates'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className={`w-4 h-4 ${activeTab === 'corporates' ? 'text-amber-200' : 'text-slate-500'}`} />
          <span>Verifikasi KYB Perusahaan Pembeli ({corporates.length})</span>
        </button>
      </div>

      {/* TAB 1: SURVEYOR ASSIGNMENT & COMPLIANCE TABLE */}
      {activeTab === 'surveyors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 font-sans">
                Tabel Penugasan Petugas Lapangan &amp; Kepatuhan Geospasial
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Saat petani menekan tombol "Ajukan Verifikasi Lapangan", sistem otomatis mengarahkan tiket ke surveyor penanggung jawab wilayah.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                    <th className="py-3 px-4">ID Surveyor</th>
                    <th className="py-3 px-4 min-w-[200px]">Nama Petugas &amp; Kontak</th>
                    <th className="py-3 px-4 min-w-[240px]">Wilayah / Klaster Tertaut</th>
                    <th className="py-3 px-4 whitespace-nowrap">Audit Selesai</th>
                    <th className="py-3 px-4 whitespace-nowrap">Kesesuaian GPS (&le; 50m)</th>
                    <th className="py-3 px-4 whitespace-nowrap">Audit Deviasi (&gt; 15%)</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Kelola Wilayah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {surveyors.map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-50/60 transition font-sans">
                      <td 
                        title={`ID Pengguna: ${srv.id}`}
                        className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap tabular-nums"
                      >
                        {formatUserCode(srv.id, 'SRV')}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{srv.name}</div>
                        <div className="text-[11px] text-slate-500">Petugas Terakreditasi</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{srv.assignedClusterName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                          {srv.region}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900 whitespace-nowrap tabular-nums">
                        {srv.tasksCompleted} Lahan
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`font-sans font-bold tabular-nums ${
                            srv.gpsGeofenceCompliance >= 95 ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {srv.gpsGeofenceCompliance}% Valid
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {srv.hasDeviationAlert ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>Peringatan: Deviasi {srv.deviationRate}% (&gt; 15%)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Aman ({srv.deviationRate}%)</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenAssignDrawer(srv)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition inline-flex items-center gap-1.5 ml-auto cursor-pointer font-sans"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ganti Penugasan</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FARMERS DIRECTORY */}
      {activeTab === 'farmers' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 font-sans">
              Direktori Ringkas Status Akun Petani
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Daftar petani mitra yang terdaftar di sistem dengan integrasi data KYC dan klaim tonase karbon.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                    <th className="py-3 px-4">ID Petani</th>
                    <th className="py-3 px-4 min-w-[200px]">Nama Petani</th>
                    <th className="py-3 px-4 min-w-[220px]">Klaster Asal</th>
                    <th className="py-3 px-4 whitespace-nowrap">Luas Lahan</th>
                    <th className="py-3 px-4 whitespace-nowrap">Jumlah Pohon</th>
                    <th className="py-3 px-4 whitespace-nowrap">Estimasi Karbon</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status KYC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {farmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-slate-50/60 transition font-sans">
                      <td 
                        title={`ID Petani: ${farmer.id}`}
                        className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap tabular-nums"
                      >
                        {formatUserCode(farmer.id, 'FAR')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{farmer.name}</div>
                        <div className="text-[11px] text-slate-400 font-sans tabular-nums">{farmer.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {farmer.cluster}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-700 whitespace-nowrap tabular-nums">
                        {farmer.landArea}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                        {farmer.treesCount} Pohon
                      </td>
                      <td className="py-3.5 px-4 font-sans font-bold text-emerald-800 whitespace-nowrap tabular-nums">
                        {farmer.quotaClaimed}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                          {farmer.kycStatus}
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

      {/* TAB 3: CORPORATE KYB DIRECTORY */}
      {activeTab === 'corporates' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 font-sans">
              Verifikasi KYB Perusahaan Pembeli (Corporate Buyer Directory)
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Status verifikasi hukum dan kepatuhan perpajakan perusahaan pembeli kredit karbon B2B.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                    <th className="py-3 px-4">Kode Perusahaan</th>
                    <th className="py-3 px-4 min-w-[220px]">Nama Badan Usaha</th>
                    <th className="py-3 px-4 whitespace-nowrap">NPWP Perusahaan</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status KYB</th>
                    <th className="py-3 px-4 whitespace-nowrap">Saldo Pre-Funded</th>
                    <th className="py-3 px-4 whitespace-nowrap">Total Emisi Hangus</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tier Lisensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {corporates.map((corp) => (
                    <tr key={corp.code} className="hover:bg-slate-50/60 transition font-sans">
                      <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap tabular-nums">
                        {corp.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {corp.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap tabular-nums font-medium">
                        {corp.taxId}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                          {corp.kybStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-700 whitespace-nowrap tabular-nums">
                        {corp.depositBalance}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap tabular-nums">
                        {corp.totalRetiredCarbon}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-sans">
                          {corp.tier}
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

      {/* DRAWER / MODAL: SURVEYOR ASSIGNMENT */}
      {selectedSurveyorForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    Penugasan Wilayah Surveyor
                  </h3>
                  <p className="text-xs text-amber-100 font-sans">
                    {selectedSurveyorForAssign.name} ({selectedSurveyorForAssign.id})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSurveyorForAssign(null)}
                className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                  Pilih Klaster Penugasan Utama
                </label>
                <select
                  value={assignedClusterInput}
                  onChange={(e) => setAssignedClusterInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#14382C] bg-white font-sans font-medium"
                >
                  <option value="CLU-WNSB-001">CLU-WNSB-001: Klaster Agroforestri Dusun Garung - Wonosobo</option>
                  <option value="CLU-SNDR-002">CLU-SNDR-002: Klaster Konservasi Lereng Sindoro Utara</option>
                  <option value="CLU-DMK-003">CLU-DMK-003: Klaster Sabuk Pesisir Demak (Mangrove)</option>
                  <option value="CLU-MLG-004">CLU-MLG-004: Klaster Kopi Agroforestri Dampit Malang</option>
                </select>
                <p className="text-[11px] text-slate-500 font-sans mt-1">
                  Seluruh tiket verifikasi pohon di wilayah ini otomatis diteruskan ke akun surveyor yang bersangkutan.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-sans">
                Kepatuhan Geofencing Surveyor ini saat ini: <strong className="font-bold tabular-nums">{selectedSurveyorForAssign.gpsGeofenceCompliance}%</strong>.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSurveyorForAssign(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer font-sans"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignment}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 rounded-xl shadow-xs transition cursor-pointer font-sans"
                >
                  Simpan Penugasan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
