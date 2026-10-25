import React, { useState, useEffect } from 'react';
import {
  Leaf, MapPin, Wallet, ArrowRight, Camera, Scan,
  ShieldCheck, ChevronRight, X, Download, Eye,
  Clock, Activity, TrendingUp, Plus, Banknote, CheckCircle2,
  Maximize2, Target, Crosshair, ArrowLeft,
  Check, Layers, RefreshCw, Smartphone,
  Globe, Bell, Sun, CloudSun, ChevronDown, CheckSquare,
  Landmark, Award, Search, User, Info, AlertCircle,
  Thermometer, Droplets, Wind, ZoomIn, ZoomOut, Copy,
  FileText, ExternalLink
} from 'lucide-react';
import { FARMER_DATA, TREES_DATA, formatRupiah, formatNumber } from '../data';

// Helper to assign real photographic imagery per tree species (Zero generic placeholder icons)
const getTreeThumbnail = (species) => {
  if (species.includes('Sengon')) return '/hero-agroforest.jpg';
  if (species.includes('Durian') || species.includes('Kelapa')) return '/auth-bg.jpg';
  return '/canopy-tree.jpg';
};

// ============================================================================
// 1. MODAL: PROFIL & KEANGGOTAAN PETANI (PAK JOKO WIDODO)
// ============================================================================
function FarmerProfileModal({ onClose, onToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#14382C] p-6 text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-emerald-400">
              <img src="/pak-joko.jpg" alt="Pak Joko Widodo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Profil Mitra Tani</span>
              <h3 className="font-extrabold text-white text-lg">Pak Joko Widodo</h3>
              <p className="text-xs text-emerald-200/80">Ketua Regu Petani Karbon Garung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">ID Mitra Tani</span>
              <strong className="text-[#14382C] text-sm font-bold">#TK-WNSB-042</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Kelompok Tani</span>
              <strong className="text-[#14382C] text-sm font-bold">Gapoktan Wono Subur</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Domisili Lahan</span>
              <strong className="text-[#14382C] text-sm font-bold">Dusun Garung, Wonosobo</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Luas Lahan Terdata</span>
              <strong className="text-emerald-700 text-sm font-bold">1.2 Hektar (SHM 418)</strong>
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">Rekening Penarikan Terhubung</span>
            <div className="flex items-center justify-between text-xs py-1 border-b border-stone-200/60">
              <span className="font-semibold text-blue-900">Bank BRI (Rek. ****4821)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="font-semibold text-sky-900">DANA e-Wallet (0812-****-7890)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => {
                onToast('Data profil berhasil diperbarui.');
                onClose();
              }}
              className="flex-1 py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs"
            >
              Simpan Profil
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MODAL: TELEMETRI SATELIT SENTINEL-2 (LIVE SENSOR STATUS)
// ============================================================================
function SatelliteTelemetryModal({ onClose, onToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <Globe className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">ESA Sentinel-2 Multispectral</span>
              <h3 className="font-extrabold text-white text-base">Telemetri Satelit Antariksa</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-[#FAFDF9] rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 font-medium">Indeks Kerapatan Vegetasi</span>
              <h4 className="text-2xl font-black text-[#14382C]">NDVI 0.88 / 1.00</h4>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Kanopi Sangat Padat & Sehat</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Leaf className="w-6 h-6 text-emerald-700" />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Resolusi Spasial Optik:</span>
              <strong className="text-[#14382C] font-bold">10 Meter / Piksel (Band 4 & 8)</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Tutupan Awan (Cloud Cover):</span>
              <strong className="text-emerald-700 font-bold">1.8% (Sangat Jernih)</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Lintasan Orbit Terakhir:</span>
              <strong className="text-stone-800 font-semibold">Hari ini, 10:14 WIB</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Siklus Lintasan Berikutnya:</span>
              <strong className="text-[#14382C] font-bold">27 Okt 2026 (~48 jam lagi)</strong>
            </div>
          </div>

          <button
            onClick={() => {
              onToast('Laporan telemetri satelit Sentinel-2 berhasil diunduh (PDF).');
              onClose();
            }}
            className="w-full py-3.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Laporan Telemetri Sentinel-2 (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. MODAL: NOTIFIKASI AKTIVITAS & AUDIT PETANI
// ============================================================================
function NotificationsModal({ onClose, onToast }) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Dividen Karbon Kuartal III Masuk',
      desc: 'Dana sebesar Rp 280.000 telah ditambahkan ke saldo dompet Anda.',
      time: '2 jam lalu',
      unread: true,
      type: 'dividend'
    },
    {
      id: 2,
      title: 'Audit Sentinel-2 Lolos Tanpa Catatan',
      desc: 'Verifikasi kanopi 7 pohon dinyatakan utuh tanpa ada penebangan liar.',
      time: 'Kemarin, 14:30 WIB',
      unread: true,
      type: 'satellite'
    },
    {
      id: 3,
      title: 'Prakiraan Cuaca Lereng Sindoro',
      desc: 'Peluang hujan ringan sore ini. Kondisi baik untuk pemupukan organik.',
      time: 'Hari ini, 06:15 WIB',
      unread: false,
      type: 'weather'
    }
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    onToast('Semua notifikasi ditandai telah dibaca.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#14382C] text-base">Notifikasi Mitra</h3>
              <p className="text-[11px] text-stone-400">Pembaruan dividen & sensor satelit</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 divide-y divide-stone-100 max-h-[380px] overflow-y-auto space-y-2">
          {notifications.map(item => (
            <div key={item.id} className={`pt-3 first:pt-0 pb-2 ${item.unread ? 'bg-emerald-50/40 -mx-2 px-2 rounded-xl' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-[#14382C] flex items-center gap-1.5">
                  {item.unread && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                  <span>{item.title}</span>
                </h4>
                <span className="text-[10px] text-stone-400 shrink-0">{item.time}</span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <button onClick={markAllRead} className="text-xs text-emerald-800 hover:text-emerald-900 font-bold transition">
            Tandai Semua Dibaca
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. MODAL: SERTIFIKAT LAHAN KADASTRAL (SHM & BATAS LAHAN)
// ============================================================================
function LandCertificateModal({ onClose, onViewMap }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <MapPin className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Kadaster & Geospasial</span>
              <h3 className="font-extrabold text-white text-base">Kebun Agroforestri Sindoro</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">No. Sertifikat Hak Milik</span>
              <strong className="text-[#14382C] font-bold text-sm">SHM No. 418/Garung</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Luas Area Kadastral</span>
              <strong className="text-emerald-700 font-bold text-sm">12.000 m² (1.2 Ha)</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Ketinggian Lahan</span>
              <strong className="text-[#14382C] font-bold text-sm">1.150 mdpl</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Kemiringan Lereng</span>
              <strong className="text-[#14382C] font-bold text-sm">18° (Terasering)</strong>
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span className="text-stone-400">Koordinat Pusat GPS:</span>
              <strong className="font-mono text-[#14382C]">7°21'50.2"S 109°54'00.8"E</strong>
            </div>
            <div className="flex justify-between text-stone-600">
              <span className="text-stone-400">Pola Tanam:</span>
              <strong className="text-[#14382C]">Agroforestri Multistrata Sindoro</strong>
            </div>
            <div className="flex justify-between text-stone-600">
              <span className="text-stone-400">Jenis Tanah:</span>
              <strong className="text-emerald-700">Andosol Vulkanik Subur</strong>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => {
                onClose();
                onViewMap();
              }}
              className="flex-1 py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Lihat di Peta Ortofoto Satelit</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. MODAL: PRAKIRAAN CUACA MIKRO LERENG SINDORO
// ============================================================================
function WeatherForecastModal({ onClose, onToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-[#14382C] to-[#1c4b3b] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <CloudSun className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Stasiun Cuaca Mikro</span>
              <h3 className="font-extrabold text-white text-base">Lereng Gunung Sindoro</h3>
              <p className="text-xs text-white/80">Desa Garung, Wonosobo (1.150 mdpl)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
            <div>
              <span className="text-xs text-stone-500 font-medium">Suhu Saat Ini</span>
              <h4 className="text-3xl font-black text-[#14382C]">21°C</h4>
              <p className="text-xs text-stone-600 font-semibold mt-0.5">Sejuk · Cerah Berawan</p>
            </div>
            <div className="text-right text-xs text-stone-500 space-y-1">
              <div>Maks: <strong className="text-stone-800">24°C</strong></div>
              <div>Min: <strong className="text-stone-800">16°C</strong></div>
              <div>Terasa seperti: <strong className="text-emerald-700">22°C</strong></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <Droplets className="w-4 h-4 text-sky-600 mx-auto mb-1" />
              <span className="text-stone-400 text-[10px] block">Kelembapan</span>
              <strong className="text-[#14382C] font-bold text-sm">74%</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <Wind className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-stone-400 text-[10px] block">Kecepatan Angin</span>
              <strong className="text-[#14382C] font-bold text-sm">8 km/h</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <span className="text-stone-400 text-[10px] block">Indeks UV</span>
              <strong className="text-[#14382C] font-bold text-sm">6 (Sedang)</strong>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
            <strong>Rekomendasi Petani:</strong> Kondisi iklim hari ini sangat optimal untuk pemupukan organik tanaman kopi & pemangkasan ranting mati alpukat.
          </div>

          <button
            onClick={() => {
              onToast('Prakiraan cuaca 7-hari tersimpan ke catatan.');
              onClose();
            }}
            className="w-full py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. MODAL: SERTIFIKAT VERIFIKASI RESMI SRN-PPI KLHK (#TK-WNSB-042)
// ============================================================================
function VerificationCertificateModal({ onClose, onToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Sistem Registri Nasional</span>
              <h3 className="font-extrabold text-white text-base">Sertifikat Verifikasi Karbon</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              Kementerian Lingkungan Hidup & Kehutanan RI
            </span>
            <h4 className="font-extrabold text-[#14382C] text-lg mt-3">Mitra Karbon Agroforestri Terdaftar</h4>
            <p className="text-xs text-stone-500 font-mono mt-1">No. Registrasi: SRN-PPI #REG-WNSB-042</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Nama Mitra Penerima:</span>
              <strong className="text-[#14382C] font-bold">Pak Joko Widodo</strong>
            </div>
            <div className="flex justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Metodologi MRV:</span>
              <strong className="text-[#14382C] font-bold">Chave Tier-3 & Sentinel-2 Optical</strong>
            </div>
            <div className="flex justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Masa Siklus Validitas:</span>
              <strong className="text-emerald-700 font-bold">2024 – 2034 (10 Tahun)</strong>
            </div>
            <div className="flex justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Status Akreditasi:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Aktif & Terverifikasi
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              onToast('Sertifikat resmi SRN-PPI #TK-WNSB-042 berhasil diunduh (PDF).');
              onClose();
            }}
            className="w-full py-3.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Sertifikat PDF Resmi (SRN-PPI)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. MODAL: STRUK RINCIAN BUKTI TRANSAKSI & AUDIT
// ============================================================================
function TransactionDetailModal({ tx, onClose, onToast }) {
  if (!tx) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-sm w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.color}`}>
              <tx.icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#14382C] text-sm">Bukti Transaksi</h3>
              <p className="text-[10px] text-stone-400 font-mono">ID #{String(Date.now()).slice(-6)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center py-2">
            <span className="text-xs text-stone-400 font-medium">Nominal / Nilai</span>
            <div className="text-2xl font-black text-[#14382C] mt-1">{tx.amount}</div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1.5 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Selesai &amp; Terverifikasi
            </span>
          </div>

          <div className="space-y-2 text-xs bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
            <div className="flex justify-between">
              <span className="text-stone-400">Judul Aktivitas:</span>
              <strong className="text-stone-800 text-right max-w-[180px]">{tx.title}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Waktu:</span>
              <strong className="text-stone-800">{tx.time}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Rincian:</span>
              <span className="text-stone-600 text-right max-w-[180px]">{tx.desc}</span>
            </div>
          </div>

          <button
            onClick={() => {
              onToast('Struk bukti transaksi berhasil disimpan (PDF).');
              onClose();
            }}
            className="w-full py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Struk Transaksi (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. MODAL: PASPOR POHON DIGITAL (CLEAN MRV PROOF, ZERO EMOJIS, ZERO CRYPTO)
// ============================================================================
function TreePassportModal({ tree, onClose, onToast }) {
  if (!tree) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#14382C] p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest font-bold">Paspor Pohon Digital</span>
                <h3 className="font-bold text-white text-base">#{tree.id}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="font-extrabold text-[#14382C] text-xl tracking-tight">{tree.species}</h4>
              <p className="text-xs text-stone-500 italic mt-0.5">{tree.speciesLatin}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {tree.confidence}% Terverifikasi
            </span>
          </div>

          {/* 4 Metric Parameter Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Diameter Batang (DBH)', value: `${tree.dbh} cm`, icon: Target },
              { label: 'Tinggi Tajuk', value: `${tree.height} m`, icon: Maximize2 },
              { label: 'Biomassa Kering', value: `${tree.biomass} kg`, icon: Activity },
              { label: 'Usia Estimasi', value: `${tree.age} tahun`, icon: Clock },
            ].map((item, i) => (
              <div key={i} className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 mb-1">
                  <item.icon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{item.label}</span>
                </div>
                <div className="font-mono font-bold text-base text-[#14382C]">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Carbon & Reward Card */}
          <div className="bg-[#FAFDF9] rounded-2xl p-5 border border-emerald-200 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500 font-medium">Serapan CO₂ Tahunan</p>
                <p className="font-sans text-2xl font-black text-[#14382C] mt-0.5">+{tree.co2PerYear} tCO₂</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Metrik Alometrik Chave Tier-3</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-500 font-medium">Dividen Karbon Bersih</p>
                <p className="font-sans text-2xl font-black text-emerald-700 mt-0.5">{formatRupiah(tree.annualReward)}</p>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">per tahun · cair otomatis</p>
              </div>
            </div>
          </div>

          {/* Verification Audit Strip */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs font-mono space-y-1.5 text-stone-600 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Registri Nasional:</span>
              <span className="font-bold text-[#14382C]">SRN-PPI KLHK #REG-WNSB-{tree.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Verifikasi Optik:</span>
              <span className="font-semibold text-emerald-700">Sentinel-2 Multispektral (NDVI 0.88)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Pemindaian Terakhir:</span>
              <span className="text-stone-700">{tree.lastScan}</span>
            </div>
          </div>

          <button
            onClick={() => {
              onToast(`Paspor Pohon #${tree.id} (${tree.species}) berhasil diunduh (PDF).`);
              onClose();
            }}
            className="w-full py-3.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Paspor Digital #{tree.id} (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 9. MODAL: AI VIEWFINDER CAMERA SCANNER (PHOTO VIEWFINDER & HUD)
// ============================================================================
function AIScannerModal({ onClose, onScanComplete }) {
  const [phase, setPhase] = useState('scanning'); // scanning | detected | complete
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (phase === 'scanning') {
      const timer = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setPhase('detected');
            return 100;
          }
          return prev + 3;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [phase]);

  const handleClaim = () => {
    setPhase('complete');
    setTimeout(() => {
      onScanComplete({
        id: `TK-AVD-${String(Date.now()).slice(-3)}`,
        species: 'Alpukat Mentega Dewasa',
        speciesLatin: 'Persea americana',
        age: 10,
        dbh: 39,
        height: 9.8,
        biomass: 320,
        co2PerYear: 0.64,
        annualReward: 290000,
        status: 'verified',
        confidence: 95,
        lastScan: new Date().toISOString().split('T')[0],
        x: 48,
        y: 38,
        canopyRadius: 16,
        color: '#10B981',
      });
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-white/20 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        {/* Real Photo Camera Viewfinder */}
        <div className="relative bg-black rounded-t-3xl overflow-hidden aspect-[4/3]">
          <img
            src="/canopy-tree.jpg"
            alt="Viewfinder Tajuk Pohon"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35 pointer-events-none" />

          {/* Camera HUD Interface */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
            <div className="flex items-center justify-between text-white pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-bold tracking-wider">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span>AI LIVE</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 font-semibold bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                  Alometrik Chave Tier-3
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors pointer-events-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Center Focus Reticle */}
            <div className="relative w-64 h-48 mx-auto my-auto flex items-center justify-center">
              <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-emerald-400" />

              {phase === 'scanning' && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line"
                  style={{ boxShadow: '0 0 15px 3px rgba(52, 211, 153, 0.7)' }}
                />
              )}

              <Crosshair className="w-8 h-8 text-emerald-400/70" />

              {phase !== 'scanning' && (
                <div className="absolute inset-2 border-2 border-emerald-400 rounded-xl bg-emerald-500/10 backdrop-blur-2xs animate-fade-in flex flex-col justify-between p-2">
                  <span className="self-start text-[10px] font-mono font-bold text-white bg-emerald-700/90 px-2 py-0.5 rounded">
                    Alpukat Mentega (Confidence 95%)
                  </span>
                  <span className="self-end text-[10px] font-mono text-emerald-200 bg-black/60 px-2 py-0.5 rounded">
                    DBH: 39 cm · H: 9.8 m
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-white/90 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <div>GPS: -7.3631°S, 109.9031°E</div>
              <div>Akurasi RTK: ±0.4m</div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="p-6">
          {phase === 'scanning' ? (
            <div className="text-center py-3">
              <div className="flex items-center justify-center gap-2 mb-2 text-[#14382C] font-bold text-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Menganalisis Tajuk & Diameter Batang...</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mt-3 max-w-xs mx-auto">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-100"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-stone-400 mt-2">{scanProgress}% diproses</p>
            </div>
          ) : phase === 'detected' ? (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-[#14382C]">Pohon Valid &amp; Siap Didaftarkan</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  95% Confidence
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-center font-mono">
                <div>
                  <p className="text-[10px] text-stone-400 uppercase">DBH</p>
                  <p className="font-bold text-[#14382C] text-sm mt-0.5">39 cm</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase">Biomassa</p>
                  <p className="font-bold text-[#14382C] text-sm mt-0.5">320 kg</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase">CO₂/Tahun</p>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">0.64 Ton</p>
                </div>
              </div>

              <div className="bg-[#FAFDF9] p-4 rounded-2xl border border-emerald-200 flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-stone-500 font-medium">Estimasi Dividen Karbon Tunai</p>
                  <p className="font-sans text-2xl font-black text-[#14382C] mt-0.5">+Rp 290.000 <span className="text-xs font-normal text-stone-500">/ tahun</span></p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
              </div>

              <button
                onClick={handleClaim}
                className="w-full py-3.5 px-4 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 active:scale-98"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Terbitkan Paspor &amp; Klaim Dividen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h3 className="text-lg font-bold text-[#14382C]">Paspor Pohon Berhasil Terbit!</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Tercatat resmi di SRN-PPI KLHK. Dividen tahunan Rp 290.000 telah ditambahkan ke estimasi dividen Anda.
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full py-3 bg-stone-100 hover:bg-stone-200 text-[#14382C] font-bold text-xs rounded-xl transition"
              >
                Kembali ke Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 10. MODAL: PENARIKAN SALDO TUNAI (DANA & BANK BRI)
// ============================================================================
function WithdrawModal({ balance, onClose, onWithdrawSuccess, onToast }) {
  const [method, setMethod] = useState('dana');
  const [amount, setAmount] = useState('500000');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const val = parseInt(amount) || 0;
    if (val <= 0 || val > balance) {
      if (onToast) onToast('Nominal penarikan tidak valid atau melebihi saldo.');
      return;
    }
    setSubmitted(true);
    if (onWithdrawSuccess) {
      onWithdrawSuccess(val);
    }
    if (onToast) {
      onToast(`Penarikan ${formatRupiah(val)} sedang diproses ke ${method === 'dana' ? 'DANA' : 'Bank BRI'}.`);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-3xl max-w-sm w-full p-7 text-center border border-stone-200 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>
          <h3 className="text-lg font-extrabold text-[#14382C]">Pencairan Berhasil Diproses!</h3>
          <p className="text-xs text-stone-600 mt-2 leading-relaxed">
            Dana sebesar <strong className="text-[#14382C] font-sans font-bold">{formatRupiah(parseInt(amount) || 0)}</strong> sedang ditransfer ke akun <strong>{method === 'dana' ? 'DANA (+62 812-****-7890)' : 'BRI (Rek. ****4821)'}</strong>.
          </p>
          <div className="my-4 py-2 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] font-mono text-stone-500">
            Estimasi tiba: 1–3 Menit (Realtime Transfer)
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 border border-stone-200 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-extrabold text-[#14382C] text-lg tracking-tight">Tarik Dividen Karbon</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Saldo: <strong className="font-sans font-bold text-emerald-800">{formatRupiah(balance)}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-2">
              Pilih Rekening Tujuan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod('dana')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  method === 'dana'
                    ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-400/20 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-sky-700 font-mono tracking-tight">DANA</span>
                  {method === 'dana' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
                </div>
                <p className="text-[10px] text-stone-500 font-mono truncate">0812-****-7890</p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('bri')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  method === 'bri'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-blue-800 font-mono tracking-tight">Bank BRI</span>
                  {method === 'bri' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />}
                </div>
                <p className="text-[10px] text-stone-500 font-mono truncate">****4821</p>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
              Nominal Penarikan
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-stone-400">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-sm text-[#14382C] focus:bg-white focus:outline-none focus:border-[#14382C]"
              />
            </div>
            {/* Quick preset buttons */}
            <div className="flex gap-1.5 mt-2">
              {['250000', '500000', '1000000'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className="flex-1 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-sans font-bold text-stone-700 transition"
                >
                  {formatRupiah(parseInt(val))}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(String(balance))}
                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[10px] font-sans font-bold text-emerald-800 transition"
              >
                Semua
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-md active:scale-98"
          >
            Konfirmasi Pencairan Tunai
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. PETA GIS ORTOFOTO KADASTRAL LAHAN (PRECISION SATELLITE CAD MAP)
// ============================================================================
function SatelliteGISMap({ trees, onTreeClick, onToast }) {
  const [activeLayer, setActiveLayer] = useState('sat'); // 'sat' | 'ndvi'
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleCopyGPS = () => {
    if (onToast) onToast('Koordinat GPS RTK (7°21\'50"S 109°54\'00"E) tersalin ke clipboard.');
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-stone-200 shadow-inner bg-stone-900 aspect-[16/10]">
      <div
        className="w-full h-full transition-transform duration-500"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <img
          src="/canopy-tree.jpg"
          alt="Foto Ortofoto Lahan"
          className={`w-full h-full object-cover transition-filter duration-300 ${
            activeLayer === 'ndvi' ? 'hue-rotate-60 saturate-200 contrast-125' : 'brightness-90 contrast-110'
          }`}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Cadastral Polygon & Grid Overlay SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points="8,10 92,12 88,88 12,85"
          fill="rgba(16, 185, 129, 0.12)"
          stroke="#10B981"
          strokeWidth="0.8"
          strokeDasharray="2.5,1.5"
        />
        <line x1="8" y1="50" x2="90" y2="52" stroke="#34D399" strokeWidth="0.4" strokeDasharray="1.5,1" opacity="0.6" />
        <line x1="50" y1="11" x2="48" y2="86" stroke="#34D399" strokeWidth="0.4" strokeDasharray="1.5,1" opacity="0.6" />
      </svg>

      {/* Interactive Tree Pins (Using Leaf icon, NO TreePine undefined!) */}
      {trees.map((tree) => (
        <div
          key={tree.id}
          onClick={() => onTreeClick(tree)}
          style={{ left: `${tree.x}%`, top: `${tree.y}%` }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute w-8 h-8 rounded-full bg-emerald-400/30 group-hover:scale-150 transition-transform duration-300 animate-ping pointer-events-none" />
            <div className="w-6 h-6 rounded-full bg-[#14382C] border-2 border-emerald-400 text-white flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform">
              <Leaf className="w-3 h-3 text-emerald-300" />
            </div>
          </div>

          <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-lg text-[10px] font-sans font-semibold whitespace-nowrap shadow-md pointer-events-none group-hover:bg-emerald-950 group-hover:border-emerald-400 transition-colors">
            {tree.species.split(' ')[0]} · {tree.dbh}cm
          </div>
        </div>
      ))}

      {/* Top Left: Layer Controller & Zoom In/Out */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
        <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl p-1 flex items-center text-xs font-sans text-white">
          <button
            type="button"
            onClick={() => setActiveLayer('sat')}
            className={`px-3 py-1.5 rounded-xl transition font-bold ${
              activeLayer === 'sat' ? 'bg-[#14382C] text-emerald-300 shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            Ortofoto Riil
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('ndvi')}
            className={`px-3 py-1.5 rounded-xl transition font-bold ${
              activeLayer === 'ndvi' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            Klorofil NDVI
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl p-1 flex items-center text-white">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.15))}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-xl transition"
            title="Perbesar Peta"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.15))}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-xl transition"
            title="Perkecil Peta"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom GIS Telemetry Strip (Clickable to copy coordinates) */}
      <div
        onClick={handleCopyGPS}
        className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-sans text-white/90 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 z-20 cursor-pointer hover:bg-black/90 transition"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono">7°21'50"S 109°54'00"E</span>
          <span className="hidden sm:inline text-stone-400">· Garung, Wonosobo (Klik salin GPS)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-stone-300">Luas: 1.2 Ha</span>
          <span className="text-emerald-300 font-bold">{trees.length} Pohon Terpetakan</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 12. MAIN FARMER WORKSPACE COMPONENT (AGROPULSE FRIENDLY FINTECH STYLE)
// ============================================================================
export default function FarmerWorkspace({ walletBalance, onUpdateBalance, trees, onAddTree, onBack }) {
  // Modal states
  const [selectedTree, setSelectedTree] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLand, setShowLand] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Main view: 'trees' | 'map' | 'activity'
  const [mainView, setMainView] = useState('trees');
  // Tree species filter
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  const handleScanComplete = (newTree) => {
    onAddTree(newTree);
    onUpdateBalance(walletBalance + newTree.annualReward);
    setShowScanner(false);
    showToast(`Pohon baru ${newTree.species} berhasil didaftarkan. Dividen +${formatRupiah(newTree.annualReward)}!`);
  };

  const handleWithdrawSuccess = (amount) => {
    onUpdateBalance(Math.max(0, walletBalance - amount));
  };

  const totalCO2 = trees.reduce((acc, t) => acc + t.co2PerYear, 0);
  const totalReward = trees.reduce((acc, t) => acc + t.annualReward, 0);

  // Filtered trees by species & search query
  const filteredTrees = trees.filter(tree => {
    const matchesSpecies = (() => {
      if (speciesFilter === 'all') return true;
      if (speciesFilter === 'alpukat') return tree.species.toLowerCase().includes('alpukat');
      if (speciesFilter === 'sengon') return tree.species.toLowerCase().includes('sengon');
      if (speciesFilter === 'kopi') return tree.species.toLowerCase().includes('kopi');
      if (speciesFilter === 'lainnya') {
        return !['alpukat', 'sengon', 'kopi'].some(s => tree.species.toLowerCase().includes(s));
      }
      return true;
    })();

    const matchesSearch = searchQuery.trim() === '' ||
      tree.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.speciesLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSpecies && matchesSearch;
  });

  // Switch to map & scroll
  const handleGoToMap = () => {
    setMainView('map');
    const el = document.getElementById('inventory-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-stone-900 font-sans pb-24 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#14382C] text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-400/40 flex items-center gap-2.5 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* 
        ========================================================================
        AGROPULSE APP TOP BAR: Clean profile header with back & notification
        ========================================================================
      */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Back Button & Farmer Greeting (Interactive Profile Click) */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBack}
              title="Kembali ke Beranda"
              className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Farmer Avatar & Greeting (Clickable to open profile) */}
            <div
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-3 cursor-pointer group p-1 -m-1 rounded-2xl hover:bg-stone-50 transition"
              title="Klik untuk melihat profil lengkap petani"
            >
              <div className="relative">
                <img
                  src="/pak-joko.jpg"
                  alt="Pak Joko Widodo"
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-600 transition"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-medium text-stone-400 leading-tight">Halo, Selamat Datang</p>
                <h1 className="text-sm font-bold text-stone-900 group-hover:text-emerald-800 leading-tight flex items-center gap-1 transition">
                  <span>Pak Joko Widodo</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700" />
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Satellite Live Pill & Notification Bell (Interactive) */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSatellite(true)}
              title="Klik untuk diagnosa satelit Sentinel-2"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100/80 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sentinel-2 Live (NDVI 0.88)</span>
            </button>

            <button
              onClick={() => setShowNotifications(true)}
              title="Pemberitahuan & Notifikasi"
              className="w-10 h-10 rounded-2xl bg-white border border-stone-200/80 text-stone-600 flex items-center justify-center shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer relative active:scale-95"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </button>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN APP BODY (AGROPULSE BENTO GRID ARCHITECTURE)
        ========================================================================
      */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP ROW: Farm Landscape Banner with Dual Bento Status & Gold Member Wallet */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Farm Landscape Hero & Live Agro Bento Cards (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl overflow-hidden relative shadow-sm border border-stone-200/80 bg-cover bg-center min-h-[340px] p-6 text-white"
            style={{ backgroundImage: "url('/auth-bg.jpg')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 pointer-events-none" />

            {/* Top Farm Identity Tag (Interactive Land Certificate) */}
            <div className="relative z-10 flex items-center justify-between">
              <button
                onClick={() => setShowLand(true)}
                className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full transition cursor-pointer group active:scale-95"
                title="Klik rincian sertifikat lahan"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Kebun Agroforestri Sindoro</span>
              </button>
              <button
                onClick={() => setShowLand(true)}
                className="text-[11px] font-mono font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-1 rounded-full text-white border border-white/20 transition cursor-pointer active:scale-95"
                title="Luas Lahan 1.2 Hektar"
              >
                1.2 Hektar
              </button>
            </div>

            {/* Middle Welcome Text */}
            <div className="relative z-10 my-4">
              <p className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-bold">Dusun Garung · Wonosobo</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Kemitraan Karbon Berkelanjutan
              </h2>
              <p className="text-xs text-white/80 mt-1 max-w-md">
                Pohon pekarangan Anda memproduksi dividen tunai aktif terverifikasi sensor optik multispektral antariksa.
              </p>
            </div>

            {/* Bottom 2 Bento Status Cards (AgroPulse style, INTERACTIVE) */}
            <div className="relative z-10 grid grid-cols-2 gap-3 pt-2">
              <div
                onClick={() => setShowSatellite(true)}
                className="bg-white/95 hover:bg-white backdrop-blur-md rounded-2xl p-3.5 text-stone-900 border border-white/40 shadow-sm flex items-center gap-3 cursor-pointer group transition active:scale-98"
                title="Klik untuk diagnosa kanopi NDVI"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Leaf className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-400 font-medium">Kanopi Pohon</p>
                  <p className="text-sm font-extrabold text-[#14382C] truncate">Optimal (NDVI 0.88)</p>
                </div>
              </div>

              <div
                onClick={() => setShowWeather(true)}
                className="bg-white/95 hover:bg-white backdrop-blur-md rounded-2xl p-3.5 text-stone-900 border border-white/40 shadow-sm flex items-center gap-3 cursor-pointer group transition active:scale-98"
                title="Klik untuk detail cuaca Sindoro"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CloudSun className="w-5 h-5 text-stone-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-400 font-medium">Cuaca Sindoro</p>
                  <p className="text-sm font-extrabold text-[#14382C] truncate">Sejuk · 21°C Cerah</p>
                </div>
              </div>
            </div>
          </div>

          {/* Member Rewards / Carbon Wallet Card (5 Cols, Clean Sans-Serif Typography, ZERO SPARKLES) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-sm flex flex-col justify-between">
            <div>
              {/* Verified Header Tag (Interactive Certificate) */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <button
                  onClick={() => setShowCertificate(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer active:scale-95"
                  title="Klik untuk melihat sertifikat verifikasi SRN-PPI"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mitra Karbon Terverifikasi</span>
                </button>
                <button
                  onClick={() => setShowCertificate(true)}
                  className="text-xs font-mono font-bold text-stone-400 hover:text-stone-700 transition cursor-pointer"
                  title="No. Registrasi SRN-PPI"
                >
                  #TK-WNSB-042
                </button>
              </div>

              {/* Giant Balance: Pure, Elegant, Bold Plus Jakarta Sans Typography */}
              <div className="my-5">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Dividen Siap Cair</p>
                <div
                  onClick={() => setShowWithdraw(true)}
                  className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#14382C] font-sans mt-1 cursor-pointer hover:opacity-90 transition"
                  title="Klik untuk menarik dividen"
                >
                  {formatRupiah(walletBalance)}
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-stone-600 mb-1.5">
                    <span className="font-medium">Dividen Kuartal III Siap Cair</span>
                    <strong className="text-emerald-800 font-bold">+{formatRupiah(totalReward)} / thn</strong>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#14382C] h-full rounded-full" style={{ width: '75%' }} />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1.5">
                    Transfer otomatis langsung ke rekening bank lokal &amp; DANA petani.
                  </p>
                </div>
              </div>
            </div>

            {/* Two Action Buttons: Left Outline, Right Solid (AgroPulse style) */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={() => setMainView('activity')}
                className="py-3 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-[#14382C] font-bold text-xs transition text-center active:scale-95 cursor-pointer"
              >
                Riwayat Dividen
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                className="py-3 px-3 rounded-2xl bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs transition text-center shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tarik Saldo</span>
              </button>
            </div>
          </div>

        </div>

        {/* MIDDLE SECTION: Quick Actions (Cohesive Dark Pine Palette, ALL CLICKABLE) */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base font-extrabold text-[#14382C] tracking-tight">Aksi Cepat Mitra</h3>
            <span className="text-xs text-stone-400 font-medium">3 Layanan Aktif</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Action 1: Pindai Pohon Baru */}
            <div
              onClick={() => setShowScanner(true)}
              className="bg-white hover:bg-emerald-50/30 p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:border-[#14382C]/30 hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between active:scale-98"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#14382C] text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Camera className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#14382C] truncate group-hover:text-emerald-900">
                    Pindai Tajuk Pohon Baru
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    Deteksi spesies &amp; biomassa Chave Tier-3
                  </p>
                </div>
              </div>
              <span className="ml-2 shrink-0 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                +Rp 280k
              </span>
            </div>

            {/* Quick Action 2: Tarik Saldo Instan */}
            <div
              onClick={() => setShowWithdraw(true)}
              className="bg-white hover:bg-emerald-50/30 p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:border-[#14382C]/30 hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between active:scale-98"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#14382C] text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Banknote className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#14382C] truncate group-hover:text-emerald-900">
                    Cairkan Dividen Karbon
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    Transfer instan via DANA / Bank BRI
                  </p>
                </div>
              </div>
              <span className="ml-2 shrink-0 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Tersedia
              </span>
            </div>

            {/* Quick Action 3: Peta Ortofoto Kadastral (NOW FULLY CLICKABLE & SCROLLS SMOOTHLY) */}
            <div
              onClick={handleGoToMap}
              className="bg-white hover:bg-emerald-50/30 p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:border-[#14382C]/30 hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between active:scale-98"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#14382C] text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <MapPin className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#14382C] truncate group-hover:text-emerald-900">
                    Peta Ortofoto &amp; Kadaster
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    {trees.length} pohon terpetakan GPS RTK
                  </p>
                </div>
              </div>
              <span className="ml-2 shrink-0 px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold bg-stone-100 text-stone-700 border border-stone-200 group-hover:bg-[#14382C] group-hover:text-white transition-colors">
                Buka Peta
              </span>
            </div>
          </div>
        </div>

        {/* 
          ========================================================================
          BOTTOM SECTION: CLEAN SEGMENTED NAVIGATION & INVENTORY
          ========================================================================
        */}
        <div id="inventory-workspace" className="space-y-4 pt-2">
          
          {/* TOP TIER: Main View Switcher Capsule (Sleek Apple/Linear Pill Bar) */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="bg-stone-200/70 p-1.5 rounded-2xl inline-flex items-center gap-1 border border-stone-300/60 shadow-2xs">
              <button
                type="button"
                onClick={() => setMainView('trees')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mainView === 'trees'
                    ? 'bg-[#14382C] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <Leaf className="w-3.5 h-3.5" />
                <span>Katalog Pohon ({trees.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMainView('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mainView === 'map'
                    ? 'bg-[#14382C] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Peta Satelit GIS</span>
              </button>

              <button
                type="button"
                onClick={() => setMainView('activity')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mainView === 'activity'
                    ? 'bg-[#14382C] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Buku Kas &amp; Riwayat</span>
              </button>
            </div>

            {/* Primary Action Button: Pindai Pohon Baru */}
            <button
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#14382C] text-white text-xs font-bold transition shadow-sm hover:bg-[#1a4436] active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Tambah Pohon</span>
            </button>
          </div>

          {/* 
            SUB-TIER (Only displayed when in 'trees' view): 
            Category Chips with Live Counts + Real-time Search Filter Bar
          */}
          {mainView === 'trees' && (
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 flex-wrap animate-fade-in">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
                {[
                  { key: 'all', label: 'Semua', count: trees.length },
                  { key: 'alpukat', label: 'Alpukat Mentega', count: trees.filter(t => t.species.toLowerCase().includes('alpukat')).length },
                  { key: 'sengon', label: 'Sengon Laut', count: trees.filter(t => t.species.toLowerCase().includes('sengon')).length },
                  { key: 'kopi', label: 'Kopi Robusta', count: trees.filter(t => t.species.toLowerCase().includes('kopi')).length },
                  { key: 'lainnya', label: 'Spesies Lain', count: trees.filter(t => !['alpukat', 'sengon', 'kopi'].some(s => t.species.toLowerCase().includes(s))).length },
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSpeciesFilter(filter.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      speciesFilter === filter.key
                        ? 'bg-[#14382C] text-white shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border border-stone-200/80 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      speciesFilter === filter.key ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-600'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari ID / jenis pohon..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#14382C] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW 1: Tree Cards Grid (AgroPulse visual thumbnail card design, ZERO REPETITIVE ICONS, ZERO GREY BOXES) */}
          {mainView === 'trees' && (
            <div>
              {filteredTrees.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 mt-4">
                  <Leaf className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-stone-700">Tidak ada pohon yang cocok</h4>
                  <p className="text-xs text-stone-400 mt-1">Coba gunakan kata kunci pencarian lain atau pilih filter Semua.</p>
                  <button
                    onClick={() => { setSpeciesFilter('all'); setSearchQuery(''); }}
                    className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                  {filteredTrees.map((tree) => (
                    <div
                      key={tree.id}
                      onClick={() => setSelectedTree(tree)}
                      className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-2xs hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between active:scale-99"
                    >
                      {/* Photo Thumbnail Banner (Real Agroforest Foliage) */}
                      <div className="relative h-36 w-full overflow-hidden bg-stone-100">
                        <img
                          src={getTreeThumbnail(tree.species)}
                          alt={tree.species}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />

                        {/* Top Chips */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold bg-black/60 text-white backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                            #{tree.id}
                          </span>
                          <span className="text-xs font-bold text-white bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                            {formatRupiah(tree.annualReward)} / thn
                          </span>
                        </div>

                        {/* Bottom Species on photo */}
                        <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
                          <span className="text-[10px] font-mono text-emerald-300 font-semibold uppercase tracking-wider block">
                            {tree.speciesLatin}
                          </span>
                          <h4 className="text-base font-extrabold text-white leading-tight drop-shadow-sm">
                            {tree.species}
                          </h4>
                        </div>
                      </div>

                      {/* Card Body & Metadata (Clean single-line parameter, NO 3 GREY BOXES!) */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-stone-600 font-medium py-2 border-b border-stone-100">
                          <span>DBH: <strong className="text-[#14382C] font-semibold">{tree.dbh} cm</strong></span>
                          <span>·</span>
                          <span>Biomassa: <strong className="text-[#14382C] font-semibold">{tree.biomass} kg</strong></span>
                          <span>·</span>
                          <span>CO₂: <strong className="text-emerald-700 font-semibold">+{tree.co2PerYear}t/thn</strong></span>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-1 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Sentinel-2 Terverifikasi</span>
                          </div>
                          <span className="font-bold text-[#14382C] group-hover:text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>Buka Paspor</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: Peta GIS Lahan (NOW ERROR-FREE & INTERACTIVE) */}
          {mainView === 'map' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-[#14382C] text-base">Peta Ortofoto Kadastral (Dusun Garung, Wonosobo)</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Klik pin pohon pada peta untuk melihat parameter biometrik & paspor karbon.</p>
                </div>
                <button
                  onClick={() => setShowLand(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Detail Sertifikat Lahan</span>
                </button>
              </div>
              <SatelliteGISMap trees={trees} onTreeClick={setSelectedTree} onToast={showToast} />
            </div>
          )}

          {/* VIEW 3: Riwayat Dividen & Audit */}
          {mainView === 'activity' && (
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-[#14382C] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Buku Besar Transaksi &amp; Audit Satelit</span>
                </h3>
                <span className="text-xs text-stone-400">Klik baris untuk rincian struk</span>
              </div>

              <div className="divide-y divide-stone-100">
                {[
                  {
                    title: 'Dividen Karbon Kuartal III Dicairkan',
                    desc: 'Transfer tunai otomatis ke Rekening Bank BRI (No. Rek: ****4821)',
                    amount: '+Rp 280.000',
                    time: '2 hari lalu',
                    icon: Banknote,
                    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  },
                  {
                    title: 'Pendaftaran Pohon Baru Terverifikasi',
                    desc: 'Paspor #TK-AVD-007 (Alpukat Mentega) terbit di SRN-PPI KLHK',
                    amount: 'Alpukat Mentega',
                    time: '5 hari lalu',
                    icon: ShieldCheck,
                    color: 'text-stone-700 bg-stone-100 border-stone-200',
                  },
                  {
                    title: 'Pencairan Saldo via DANA',
                    desc: 'No. Akun 0812-****-7890 Berhasil',
                    amount: '-Rp 500.000',
                    time: '1 minggu lalu',
                    icon: Smartphone,
                    color: 'text-sky-700 bg-sky-50 border-sky-200',
                  },
                  {
                    title: 'Audit Satelit Sentinel-2 Siklus 5-Hari',
                    desc: 'NDVI 0.88 kanopi sehat utuh tanpa penebangan, dividen diteruskan',
                    amount: 'Lolos Audit',
                    time: '2 minggu lalu',
                    icon: Globe,
                    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedTx(item)}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-stone-50/80 -mx-3 px-3 rounded-2xl transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${item.color} group-hover:scale-105 transition-transform`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-[#14382C] truncate group-hover:text-emerald-800">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-[#14382C] block">{item.amount}</span>
                      <p className="text-[10px] text-stone-400 font-sans mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* 
        ========================================================================
        INTERACTIVE MODALS (ALL ZERO DUMMY, FULLY FUNCTIONAL)
        ========================================================================
      */}
      {/* 1. Modal: Profil Petani */}
      {showProfile && (
        <FarmerProfileModal
          onClose={() => setShowProfile(false)}
          onToast={showToast}
        />
      )}

      {/* 2. Modal: Telemetri Sentinel-2 */}
      {showSatellite && (
        <SatelliteTelemetryModal
          onClose={() => setShowSatellite(false)}
          onToast={showToast}
        />
      )}

      {/* 3. Modal: Notifikasi */}
      {showNotifications && (
        <NotificationsModal
          onClose={() => setShowNotifications(false)}
          onToast={showToast}
        />
      )}

      {/* 4. Modal: Detail Lahan Kadaster */}
      {showLand && (
        <LandCertificateModal
          onClose={() => setShowLand(false)}
          onViewMap={handleGoToMap}
        />
      )}

      {/* 5. Modal: Cuaca Mikro Sindoro */}
      {showWeather && (
        <WeatherForecastModal
          onClose={() => setShowWeather(false)}
          onToast={showToast}
        />
      )}

      {/* 6. Modal: Sertifikat Verifikasi SRN-PPI */}
      {showCertificate && (
        <VerificationCertificateModal
          onClose={() => setShowCertificate(false)}
          onToast={showToast}
        />
      )}

      {/* 7. Modal: Struk Transaksi */}
      {selectedTx && (
        <TransactionDetailModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
          onToast={showToast}
        />
      )}

      {/* 8. Modal: Paspor Pohon */}
      {selectedTree && (
        <TreePassportModal
          tree={selectedTree}
          onClose={() => setSelectedTree(null)}
          onToast={showToast}
        />
      )}

      {/* 9. Modal: AI Viewfinder Scanner */}
      {showScanner && (
        <AIScannerModal
          onClose={() => setShowScanner(false)}
          onScanComplete={handleScanComplete}
        />
      )}

      {/* 10. Modal: Tarik Saldo */}
      {showWithdraw && (
        <WithdrawModal
          balance={walletBalance}
          onClose={() => setShowWithdraw(false)}
          onWithdrawSuccess={handleWithdrawSuccess}
          onToast={showToast}
        />
      )}
    </div>
  );
}
