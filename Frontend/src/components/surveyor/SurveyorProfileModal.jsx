import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Award,
  Radio,
  CheckCircle2,
  Save,
  ShieldCheck,
  Smartphone,
  Navigation,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { updateStoredUser } from '../../api/auth';

export default function SurveyorProfileModal({
  currentUser,
  onClose,
  onToast,
  onProfileUpdated
}) {
  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || 'Budi Santoso, S.Hut',
    surveyor_id: currentUser?.surveyor_id || currentUser?.id || 'SRV-BUDI-09',
    email: currentUser?.email || 'surveyor@tanikarbon.com',
    phone_number: currentUser?.phone_number || '0813-8821-9920',
    region: currentUser?.region || 'Kabupaten Wonosobo, Jawa Tengah',
    agency: currentUser?.agency || 'Dinas Lingkungan Hidup & Kehutanan Jateng',
    certification: currentUser?.certification || 'Auditor Silvikultur Chave Tier-3 & ISO 14064',
    gps_device: currentUser?.gps_device || 'RTK-GPS Dual Frequency ±1.5m',
    daily_capacity: currentUser?.daily_capacity || '15 Petak / Hari'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      if (onToast) onToast('Nama lengkap tidak boleh kosong.', 'warning');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const updatedUser = {
        ...currentUser,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        region: formData.region.trim(),
        agency: formData.agency.trim(),
        certification: formData.certification.trim(),
        gps_device: formData.gps_device.trim(),
        daily_capacity: formData.daily_capacity.trim(),
        surveyor_id: formData.surveyor_id.trim()
      };

      // Persist to localStorage
      updateStoredUser(updatedUser);

      if (onProfileUpdated) {
        onProfileUpdated(updatedUser);
      }

      if (onToast) {
        onToast('Profil surveyor berhasil diperbarui dan disimpan!');
      }

      setIsSaving(false);
      onClose();
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F291E] via-[#14382C] to-[#0F291E] p-5 sm:p-6 text-white flex items-center justify-between shrink-0 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-inner">
              <UserCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white font-sans">
                Profil &amp; Kredensial Surveyor
              </h3>
              <p className="text-xs text-emerald-200/80 font-sans mt-0.5">
                Kelola identitas resmi petugas audit fisik lapangan TaniKarbon
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Surveyor Verification ID Strip */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-xs font-bold text-emerald-900 font-sans">
                Status Akreditasi: Auditor Resmi SRN-PPI KLHK
              </span>
            </div>
            <span className="font-mono text-[11px] font-black bg-white px-2.5 py-0.5 rounded-md border border-emerald-300 text-emerald-800 shadow-2xs">
              {formData.surveyor_id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                Nama Lengkap &amp; Gelar
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={e => handleInputChange('full_name', e.target.value)}
                placeholder="Contoh: Budi Santoso, S.Hut"
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-xl text-xs text-stone-800 outline-none transition font-sans font-medium"
              />
            </div>

            {/* Surveyor ID / NIP */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                ID Petugas / NIP
              </label>
              <input
                type="text"
                required
                value={formData.surveyor_id}
                onChange={e => handleInputChange('surveyor_id', e.target.value)}
                placeholder="Contoh: SRV-BUDI-09"
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-xl text-xs text-stone-800 outline-none transition font-sans font-medium font-mono"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                Alamat Email Kedinasan
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="surveyor@tanikarbon.com"
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-xl text-xs text-stone-800 outline-none transition font-sans font-medium"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                No. WhatsApp / Telepon Lapangan
              </label>
              <input
                type="text"
                required
                value={formData.phone_number}
                onChange={e => handleInputChange('phone_number', e.target.value)}
                placeholder="0813-8821-9920"
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-xl text-xs text-stone-800 outline-none transition font-sans font-medium"
              />
            </div>
          </div>

          {/* Region / Assigned Territory */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
              Wilayah Kerja Lapangan Terdaftar
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.region}
                onChange={e => handleInputChange('region', e.target.value)}
                placeholder="Kabupaten Wonosobo, Jawa Tengah - Klaster Sindoro"
                className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-xl text-xs text-stone-800 outline-none transition font-sans font-medium"
              />
            </div>
          </div>

          {/* Certification & Standard */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
              Standar Kompetensi &amp; Sertifikasi
            </label>
            <div className="relative">
              <Award className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.certification}
                onChange={e => handleInputChange('certification', e.target.value)}
                placeholder="Auditor Silvikultur Chave Tier-3 & ISO 14064"
                className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-xl text-xs text-stone-800 outline-none transition font-sans font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* GPS Calibration Mode */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                Perangkat Geotagging GPS
              </label>
              <div className="relative">
                <Radio className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.gps_device}
                  onChange={e => handleInputChange('gps_device', e.target.value)}
                  placeholder="RTK-GPS Dual Frequency ±1.5m"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-xl text-xs text-stone-800 outline-none transition font-sans font-medium"
                />
              </div>
            </div>

            {/* Target Daily Capacity */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                Target Audit Harian
              </label>
              <div className="relative">
                <Navigation className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.daily_capacity}
                  onChange={e => handleInputChange('daily_capacity', e.target.value)}
                  placeholder="15 Petak / Hari"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-xl text-xs text-stone-800 outline-none transition font-sans font-medium"
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics (Read-only Verification Stats) */}
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2 font-sans">
              Rekam Jejak Lapangan Surveyor
            </span>
            <div className="grid grid-cols-3 gap-2.5 text-center font-sans">
              <div className="p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl">
                <span className="text-base font-black text-slate-900 block tabular-nums">48</span>
                <span className="text-[10px] font-semibold text-slate-500">Petak Selesai</span>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl">
                <span className="text-base font-black text-emerald-700 block tabular-nums">1.420</span>
                <span className="text-[10px] font-semibold text-slate-500">Pohon Diukur</span>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl">
                <span className="text-base font-black text-teal-700 block tabular-nums">99.4%</span>
                <span className="text-[10px] font-semibold text-slate-500">Akurasi GPS</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer font-sans"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer font-sans disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-white" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

