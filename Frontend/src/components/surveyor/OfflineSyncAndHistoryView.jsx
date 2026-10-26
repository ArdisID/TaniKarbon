import React, { useState } from 'react';
import { 
  History, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  MapPin, 
  Download,
  Search,
  Filter
} from 'lucide-react';

export default function OfflineSyncAndHistoryView({ 
  isOnline = true, 
  offlineQueue = [], 
  onSyncAll, 
  history = [], 
  onToast 
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Default offline queue if none passed
  const defaultQueue = [
    {
      id: 'OFF-01',
      ticketId: 'TKT-WNSB-042',
      farmerName: 'Pak Joko Widodo',
      landName: 'Lahan 1 - Pekarangan Garung',
      filesCount: 4,
      totalSizeMb: 8.4,
      status: 'Tersimpan Lokal (IndexedDB)',
      createdAt: '26 Okt 2026, 10:20 WIB'
    },
    {
      id: 'OFF-02',
      ticketId: 'TKT-WNSB-043',
      farmerName: 'Pak Hendra Wijaya',
      landName: 'Lahan 2 - Lereng Sindoro',
      filesCount: 3,
      totalSizeMb: 6.1,
      status: 'Tersimpan Lokal (IndexedDB)',
      createdAt: '25 Okt 2026, 16:45 WIB'
    },
    {
      id: 'OFF-03',
      ticketId: 'TKT-WNSB-044',
      farmerName: 'Pak Slamet Riyadi',
      landName: 'Kebun Sengon Blok Kidul',
      filesCount: 5,
      totalSizeMb: 11.2,
      status: 'Tersimpan Lokal (IndexedDB)',
      createdAt: '25 Okt 2026, 14:10 WIB'
    }
  ];

  // Default history archive if none passed
  const defaultHistory = [
    {
      id: 'HIS-0941',
      ticketId: 'TKT-WNSB-038',
      farmerName: 'Pak Supardi',
      landName: 'Lahan Durian Karanganyar',
      decision: 'Disahkan ke Pre-Verified',
      validatedCarbon: '+2.10 tCO2e',
      checkInTime: '24 Okt 2026, 09:15 WIB',
      gpsCoord: '-7.3621, 109.9870',
      clusterStatus: 'Lulus Audit Eksternal (Verified)'
    },
    {
      id: 'HIS-0940',
      ticketId: 'TKT-WNSB-035',
      farmerName: 'Pak Wahyudi',
      landName: 'Kebun Alpukat Lembah Sindoro',
      decision: 'Disahkan ke Pre-Verified',
      validatedCarbon: '+1.85 tCO2e',
      checkInTime: '23 Okt 2026, 14:30 WIB',
      gpsCoord: '-7.3640, 109.9895',
      clusterStatus: 'Lulus Audit Eksternal (Verified)'
    },
    {
      id: 'HIS-0939',
      ticketId: 'TKT-WNSB-033',
      farmerName: 'Bu Kartini',
      landName: 'Kebun Kopi Lereng Dieng',
      decision: 'Diminta Revisi',
      validatedCarbon: 'Tertunda',
      checkInTime: '22 Okt 2026, 11:00 WIB',
      gpsCoord: '-7.3610, 109.9850',
      clusterStatus: 'Menunggu Perbaikan Petani'
    },
    {
      id: 'HIS-0938',
      ticketId: 'TKT-WNSB-029',
      farmerName: 'Pak Sunarto',
      landName: 'Lahan Kering Perbatasan',
      decision: 'Ditolak',
      validatedCarbon: '0.00 tCO2e',
      checkInTime: '20 Okt 2026, 15:40 WIB',
      gpsCoord: '-7.3680, 109.9910',
      clusterStatus: 'Batal (Tidak Memenuhi Syarat)'
    }
  ];

  const currentQueue = offlineQueue.length > 0 ? offlineQueue : defaultQueue;
  const currentHistory = history.length > 0 ? history : defaultHistory;

  const handleSyncNow = () => {
    if (!isOnline) {
      if (onToast) onToast('Perangkat dalam Offline Mode. Hubungkan kembali ke internet untuk sinkronisasi.');
      return;
    }

    setIsSyncing(true);
    setSyncProgress(10);

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          if (onSyncAll) onSyncAll();
          if (onToast) onToast('Semua paket survei offline (IndexedDB) berhasil diunggah ke server pusat!');
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 font-sans">
      
      {/* Top Banner Context */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              OFFLINE-FIRST PWA ENGINE
            </span>
            <span className="text-xs text-slate-500 font-sans">IndexedDB Local Cache Storage</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1 font-sans">
            Manajer Sinkronisasi Offline &amp; Riwayat Inspeksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Menjamin tidak ada data survei atau foto resolusi tinggi yang hilang saat bertugas di area pegunungan tanpa sinyal internet.
          </p>
        </div>

        {/* Sync Trigger Button */}
        <button
          onClick={handleSyncNow}
          disabled={isSyncing || currentQueue.length === 0}
          className="px-5 py-3 bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-bold rounded-2xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Mengunggah Data ({syncProgress}%)...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Sinkronkan Semua Sekarang ({currentQueue.length} Paket)</span>
            </>
          )}
        </button>
      </div>

      {/* A. Antrean Unggahan Lokal (OfflineUploadQueueCard) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#14382C] text-sm sm:text-base font-sans">
                Antrean Unggahan Lokal di Perangkat (IndexedDB Queue)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Tersimpan aman di memori HP saat petugas mengesahkan survei di titik blank-spot
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            {currentQueue.length} Draf Menunggu Sinkron
          </span>
        </div>

        {/* Progress Bar saat proses sinkronisasi */}
        {isSyncing && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 space-y-1.5 font-sans">
            <div className="flex justify-between text-xs text-emerald-900 font-semibold">
              <span>Mengunggah payload inspeksi &amp; foto meteran ber-watermark...</span>
              <span className="font-mono">{syncProgress}%</span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {currentQueue.map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition font-sans">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900 font-sans">{item.farmerName}</span>
                  <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {item.ticketId}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {item.landName} • <span className="font-mono text-[11px]">{item.filesCount} Berkas ({item.totalSizeMb} MB)</span>
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-400 font-sans">
                <span className="flex items-center gap-1 sm:justify-end">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {item.createdAt}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                  Siap diunggah otomatis saat tersambung 4G
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* B. Tabel Riwayat Inspeksi Petugas (SurveyorHistoryList) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#14382C] text-base font-sans">
              Riwayat Arsip Inspeksi Petugas (SurveyorHistoryList)
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Daftar seluruh kebun yang telah diperiksa lengkap dengan stempel GPS &amp; status audit eksternal.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-sans">{currentHistory.length} Arsip Tercatat</span>
        </div>

        {/* Table Content (Rapi, Standar Stripe/Linear, whitespace-nowrap) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-sans text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">ID &amp; Petani</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Nama Lahan</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Keputusan Surveyor</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-right">Tonase Tervalidasi</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Waktu &amp; GPS Check-In</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-right">Status Audit Klaster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {currentHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  {/* ID & Petani */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-bold text-stone-900 block font-sans">{item.farmerName}</span>
                    <span className="font-mono text-xs text-slate-500 font-medium mt-0.5 block">{item.ticketId}</span>
                  </td>

                  {/* Lahan */}
                  <td className="px-5 py-4 whitespace-nowrap text-slate-700 font-medium">
                    {item.landName}
                  </td>

                  {/* Keputusan */}
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-medium ${
                      item.decision === 'Disahkan ke Pre-Verified'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : item.decision === 'Diminta Revisi'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.decision}</span>
                    </span>
                  </td>

                  {/* Tonase */}
                  <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-sm text-stone-800">
                    {item.validatedCarbon}
                  </td>

                  {/* Check-In */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-xs text-stone-600 block">{item.checkInTime}</span>
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block">
                      {item.gpsCoord}
                    </span>
                  </td>

                  {/* Status Audit */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-sans font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {item.clusterStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
