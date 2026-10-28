import React, { useState } from 'react';
import { 
  History, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  Upload, 
  RefreshCw, 
  CheckCheck,
  SearchX,
  FileText
} from 'lucide-react';
import BeritaAcaraModal from './BeritaAcaraModal';

export default function OfflineSyncAndHistoryView({ 
  isOnline = true, 
  offlineQueue = [], 
  onSyncAll, 
  history = [], 
  onToast 
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [selectedBa, setSelectedBa] = useState(null);

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
          if (onToast) onToast('Semua paket survei offline berhasil diunggah ke server TaniKarbon ✔');
          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Context */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              OFFLINE-FIRST PWA ENGINE
            </span>
            <span className="text-xs text-slate-500 font-sans">IndexedDB Local Cache Storage</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] mt-1 font-sans">
            Manajer Sinkronisasi Offline &amp; Riwayat Inspeksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Menjamin tidak ada data survei atau foto geotag yang hilang saat bertugas di area perkebunan tanpa sinyal internet.
          </p>
        </div>

        {/* Sync Trigger Button */}
        <button
          onClick={handleSyncNow}
          disabled={isSyncing || offlineQueue.length === 0}
          className="px-5 py-3 bg-[#0F291E] hover:bg-[#173D2E] text-white text-xs font-bold rounded-2xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Mengunggah Data ({syncProgress}%)...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Sinkronkan Semua ({offlineQueue.length} Paket)</span>
            </>
          )}
        </button>
      </div>

      {/* A. Antrean Unggahan Lokal (IndexedDB Queue) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F291E] text-sm sm:text-base font-sans">
                Antrean Unggahan Lokal di Perangkat (IndexedDB Queue)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Tersimpan aman di memori perangkat saat petugas mengesahkan survei di titik blank-spot
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            {offlineQueue.length} Draf Menunggu Sinkron
          </span>
        </div>

        {/* Progress Bar saat proses sinkronisasi */}
        {isSyncing && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 space-y-1.5 font-sans">
            <div className="flex justify-between text-xs text-emerald-900 font-semibold">
              <span>Mengunggah payload inspeksi &amp; foto geotag...</span>
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

        {offlineQueue.length === 0 ? (
          <div className="p-8 text-center font-sans">
            <CheckCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-sm text-[#0F291E]">Semua Data Telah Tersinkronisasi</p>
            <p className="text-xs text-slate-500 mt-0.5">Tidak ada antrean tertunda di IndexedDB lokal.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {offlineQueue.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition font-sans">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 font-sans">{item.farmerName}</span>
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
                    Siap diunggah otomatis saat tersambung internet
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* B. Tabel Riwayat Inspeksi Petugas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#0F291E] text-base font-sans">
              Riwayat Arsip Inspeksi Petugas
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Daftar seluruh kebun yang telah diperiksa lengkap dengan stempel GPS &amp; status audit.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-sans">{history.length} Arsip Tercatat</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center font-sans">
            <SearchX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-sm text-[#0F291E]">Belum Ada Riwayat Selesai</p>
            <p className="text-xs text-slate-500 mt-0.5">Lahan yang telah selesai diaudit akan tercatat di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-sans text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">ID &amp; Petani</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Nama Lahan</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-center">Keputusan Surveyor</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Tonase Tervalidasi</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Waktu &amp; GPS Check-In</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-center">Status Audit</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block font-sans">{item.farmerName}</span>
                      <span className="font-mono text-xs text-slate-500 font-medium mt-0.5 block">{item.ticketId}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-700 font-medium">
                      {item.landName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-medium ${
                        item.decision?.includes('Disahkan') || item.decision?.includes('Pre-Verified')
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : item.decision?.includes('Revisi')
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.decision}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-sm text-slate-800">
                      {item.validatedCarbon}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs text-slate-600 block">{item.checkInTime}</span>
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block">
                        {item.gpsCoord}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-sans font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.clusterStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBa(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F291E] text-white hover:bg-[#173D2E] text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lihat Berita Acara</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Berita Acara Modal */}
      <BeritaAcaraModal
        isOpen={Boolean(selectedBa)}
        onClose={() => setSelectedBa(null)}
        data={selectedBa}
      />
    </div>
  );
}
