import React, { useState, useEffect, useCallback, useRef } from 'react';
import FarmerSidebar from './farmer/FarmerSidebar';
import FarmerMobileNav from './farmer/FarmerMobileNav';
import FarmerDashboardView from './farmer/FarmerDashboardView';
import LandManagementView from './farmer/LandManagementView';
import LandRegistrationWizard from './farmer/LandRegistrationWizard';
import VerificationTrackingView from './farmer/VerificationTrackingView';
import FarmerWalletView from './farmer/FarmerWalletView';
import WithdrawalModal from './farmer/WithdrawalModal';
import TransferReceiptModal from './farmer/TransferReceiptModal';
import { 
  getFarmerSummary, 
  getFarmerLands, 
  getFarmerWalletTransactions,
  getFarmerProfile,
  updateFarmerProfile,
  getFarmerBankAccounts
} from '../api/farmer';
import { updateStoredUser } from '../api/auth';
import { 
  X, 
  Globe, 
  Leaf, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  MapPin, 
  Calendar,
  Menu,
  Edit3,
  User,
  Phone,
  CreditCard,
  Building2,
  Check,
  Loader2,
  Landmark,
  LogOut
} from 'lucide-react';

// Sentinel-2 Telemetry Modal
function SatelliteTelemetryModal({ onClose, onToast }) {
  return (
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <Globe className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">ESA Sentinel-2 Multispectral</span>
              <h3 className="font-extrabold text-white text-base">Telemetri Satelit Sentinel-2</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-4 bg-[#FAFDF9] rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 font-medium">Indeks Kerapatan Vegetasi</span>
              <h4 className="text-2xl font-black text-[#14382C]">NDVI 0.88 / 1.00</h4>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Kanopi Sangat Padat &amp; Sehat</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Leaf className="w-6 h-6 text-emerald-700" />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Resolusi Spasial Optik:</span>
              <strong className="text-[#14382C] font-bold">10 Meter / Piksel (Band 4 &amp; 8)</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Tutupan Awan (Cloud Cover):</span>
              <strong className="text-emerald-700 font-bold">1.8% (Sangat Jernih)</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Lintasan Orbit Terakhir:</span>
              <strong className="text-stone-800 font-semibold">25 Okt 2026, 10:14 WIB</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Siklus Lintasan Berikutnya:</span>
              <strong className="text-[#14382C] font-bold">28 Okt 2026 (~2 hari lagi)</strong>
            </div>
          </div>

          <button
            onClick={() => {
              onToast('Laporan telemetri satelit Sentinel-2 berhasil diunduh (PDF resmi).');
              onClose();
            }}
            className="w-full py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Laporan Telemetri Sentinel-2 (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Dynamic Profile Modal with View & Edit Modes
function FarmerProfileModal({ currentUser, farmerSummary, onClose, onToast, onUserUpdated, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Form State for Editing
  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || '',
    nik: '',
    phone_number: '',
    gapoktan_name: '',
    address: '',
    village: '',
    regency: '',
    province: 'Jawa Tengah'
  });

  // Fetch real profile and bank accounts from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      setIsLoadingProfile(true);
      try {
        const [profileData, banks] = await Promise.all([
          getFarmerProfile().catch(() => null),
          getFarmerBankAccounts().catch(() => [])
        ]);
        if (isMounted) {
          if (profileData) {
            setProfile(profileData);
            setFormData({
              full_name: profileData.full_name || currentUser?.full_name || '',
              nik: profileData.nik || '',
              phone_number: profileData.phone_number || '',
              gapoktan_name: profileData.gapoktan_name || '',
              address: profileData.address || '',
              village: profileData.village || '',
              regency: profileData.regency || '',
              province: profileData.province || 'Jawa Tengah'
            });
          }
          if (Array.isArray(banks)) {
            setBankAccounts(banks);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat profil petani:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }
    loadProfile();
    return () => { isMounted = false; };
  }, [currentUser]);

  const displayName = profile?.full_name || currentUser?.full_name || farmerSummary?.farmer_name || 'Petani Mitra';
  const displayEmail = profile?.email || currentUser?.email || farmerSummary?.farmer_email || 'petani@tanikarbon.id';
  
  const rawArea = (farmerSummary?.total_land_area_sqm !== undefined && farmerSummary?.total_land_area_sqm !== null)
    ? Number(farmerSummary.total_land_area_sqm)
    : 0;
  const totalAreaHa = (rawArea / 10000).toFixed(2);
  const totalPlots = (farmerSummary?.total_land_plots !== undefined && farmerSummary?.total_land_plots !== null)
    ? Number(farmerSummary.total_land_plots)
    : 0;

  const farmerIdCode = currentUser?.id 
    ? `#TK-${String(currentUser.id).slice(0, 8).toUpperCase()}` 
    : '#TK-MITRA-01';

  // Format domisili string
  const domicileParts = [
    profile?.village ? `Desa ${profile.village}` : null,
    profile?.regency ? profile.regency : null,
    profile?.province ? profile.province : null
  ].filter(Boolean);
  const domicileText = domicileParts.length > 0 
    ? domicileParts.join(', ') 
    : (profile?.address || currentUser?.domicile || 'Wonosobo, Jawa Tengah');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      onToast('Nama lengkap tidak boleh kosong.', 'warning');
      return;
    }
    if (formData.nik && formData.nik.length !== 16) {
      onToast('NIK harus berjumlah 16 digit sesuai e-KTP.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateFarmerProfile({
        full_name: formData.full_name.trim(),
        nik: formData.nik ? formData.nik.trim() : null,
        phone_number: formData.phone_number ? formData.phone_number.trim() : null,
        gapoktan_name: formData.gapoktan_name ? formData.gapoktan_name.trim() : null,
        address: formData.address ? formData.address.trim() : null,
        village: formData.village ? formData.village.trim() : null,
        regency: formData.regency ? formData.regency.trim() : null,
        province: formData.province ? formData.province.trim() : null
      });

      setProfile(updated);
      updateStoredUser({
        full_name: updated.full_name,
        nik: updated.nik,
        phone_number: updated.phone_number,
        gapoktan_name: updated.gapoktan_name
      });
      if (onUserUpdated) {
        onUserUpdated(updated);
      }
      setIsEditing(false);
      onToast('Data profil berhasil diperbarui.');
    } catch (err) {
      console.error('Gagal memperbarui profil:', err);
      onToast(err.message || 'Gagal menyimpan pembaruan profil.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-[#14382C] p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-emerald-400 shrink-0 bg-emerald-800 flex items-center justify-center text-white font-black text-xl">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">
                {isEditing ? 'Pembaruan Data' : 'Profil Mitra Tani'}
              </span>
              <h3 className="font-extrabold text-white text-base leading-tight">
                {isEditing ? 'Edit Profil Mitra' : displayName}
              </h3>
              <p className="text-xs text-emerald-200/80 leading-tight mt-0.5">{displayEmail}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {isLoadingProfile ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#14382C]" />
              <p className="text-xs font-medium">Memuat data profil mitra...</p>
            </div>
          ) : isEditing ? (
            /* ================= EDIT MODE ================= */
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                  Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Contoh: Petani Agro / Joko Widodo"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#14382C] focus:bg-white text-xs transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                    Nomor Induk Kependudukan (NIK)
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => handleInputChange('nik', e.target.value.replace(/\D/g, ''))}
                      placeholder="16 Digit NIK KTP"
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-sans tabular-nums text-xs focus:outline-hidden focus:ring-2 focus:ring-[#14382C] focus:bg-white transition"
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 block">Wajib untuk verifikasi sertifikat karbon.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                    No. WhatsApp / Telepon
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#14382C] focus:bg-white transition"
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 block">Digunakan surveyor untuk koordinasi inspeksi.</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                  Kelompok Tani / Gapoktan
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.gapoktan_name}
                    onChange={(e) => handleInputChange('gapoktan_name', e.target.value)}
                    placeholder="Contoh: Gapoktan Sumber Makmur Garung"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#14382C] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                  Alamat Rumah / Tempat Tinggal
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Nama jalan, RT/RW, Dusun"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#14382C] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Desa / Kel.</label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => handleInputChange('village', e.target.value)}
                    placeholder="Garung"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#14382C] focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Kabupaten</label>
                  <input
                    type="text"
                    value={formData.regency}
                    onChange={(e) => handleInputChange('regency', e.target.value)}
                    placeholder="Wonosobo"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#14382C] focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    placeholder="Jawa Tengah"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#14382C] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS (EDIT MODE) */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#14382C] hover:bg-[#1C4E3D] text-white font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <>
              {/* 6 Bento Grid Information Cards */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">ID Mitra Tani</span>
                  <strong className="text-[#14382C] text-sm font-bold font-sans tabular-nums">{farmerIdCode}</strong>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">NIK (e-KTP)</span>
                  <strong className="text-stone-800 text-sm font-semibold font-sans tabular-nums">
                    {profile?.nik ? `${profile.nik.slice(0, 6)}******${profile.nik.slice(12)}` : 'Belum Diisi'}
                  </strong>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">No. WhatsApp / HP</span>
                  <strong className="text-stone-800 text-xs font-semibold">
                    {profile?.phone_number || 'Belum diatur'}
                  </strong>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Kelompok Tani</span>
                  <strong className="text-stone-800 text-xs font-semibold truncate block">
                    {profile?.gapoktan_name || currentUser?.gapoktan || 'Mandiri / Belum Tergabung'}
                  </strong>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Domisili Lahan</span>
                  <strong className="text-stone-800 text-xs font-semibold block truncate" title={domicileText}>
                    {domicileText}
                  </strong>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Total Lahan</span>
                  <strong className="text-emerald-700 text-sm font-bold">{totalAreaHa} Ha ({totalPlots} Petak)</strong>
                </div>
              </div>

              {/* Rekening Penarikan Terdaftar Card */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                    Rekening Penarikan Terdaftar
                  </span>
                  {bankAccounts.length > 0 && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Terverifikasi
                    </span>
                  )}
                </div>

                {bankAccounts.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {bankAccounts.map((b) => (
                      <div key={b.id || b.account_number} className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#14382C] font-bold text-xs flex items-center justify-center border border-emerald-200">
                            <Landmark className="w-4 h-4 text-[#14382C]" />
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-xs">{b.bank_name || b.bank_code}</p>
                            <p className="text-stone-500 text-[11px] font-sans tabular-nums">{b.account_number} • a.n. {b.account_holder_name}</p>
                          </div>
                        </div>
                        {b.is_primary && (
                          <span className="text-[9px] font-bold bg-[#14382C] text-emerald-300 px-2 py-0.5 rounded-md">
                            Utama
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2.5 text-center">
                    <p className="text-xs text-stone-500 font-medium">Belum diatur</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Rekening bank atau e-wallet dapat ditentukan saat pengajuan penarikan saldo dividen karbon.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons (View Mode) */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 bg-[#14382C] hover:bg-[#1C4E3D] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>Edit Profil</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {onLogout && (
                <div className="pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Keluar dari Akun Petani</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const FARMER_TAB_PATHS = {
  dashboard: '/mitra-tani/dashboard',
  land: '/mitra-tani/lahan',
  wizard: '/mitra-tani/pendaftaran',
  timeline: '/mitra-tani/verifikasi',
  wallet: '/mitra-tani/dompet',
};

function getFarmerTabFromPath(pathname) {
  const normalized = (pathname || '').toLowerCase().replace(/\/$/, '');
  if (normalized.endsWith('/lahan') || normalized.endsWith('/manajemen-lahan')) return 'land';
  if (normalized.endsWith('/pendaftaran') || normalized.endsWith('/daftarkan-lahan')) return 'wizard';
  if (normalized.endsWith('/verifikasi') || normalized.endsWith('/lacak-verifikasi')) return 'timeline';
  if (normalized.endsWith('/dompet') || normalized.endsWith('/dompet-karbon')) return 'wallet';
  return 'dashboard';
}

export default function FarmerWorkspace({
  currentUser,
  onLogout,
  walletBalance = 0,
  onUpdateBalance,
  trees = [],
  onAddTree,
  onBack,
  onNavigateRole
}) {
  // Active user state to keep UI updated upon profile edit
  const [activeUser, setActiveUser] = useState(currentUser);

  useEffect(() => {
    if (currentUser) {
      setActiveUser(currentUser);
    }
  }, [currentUser]);

  // Navigation tab state: 'dashboard' | 'land' | 'wizard' | 'timeline' | 'wallet'
  // Inisialisasi awal membaca langsung dari window.location.pathname agar kebal refresh F5/Cmd+R
  const [activeTab, setActiveTabState] = useState(() => {
    return getFarmerTabFromPath(window.location.pathname);
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Two-way synchronization antara activeTab dan URL browser (mendukung query parameter seperti ?plotId=...)
  const setActiveTab = useCallback((tabId, queryOrOptions = {}, replace = false) => {
    let queryStr = '';
    let isReplace = replace;
    if (typeof queryOrOptions === 'boolean') {
      isReplace = queryOrOptions;
    } else if (typeof queryOrOptions === 'string') {
      queryStr = queryOrOptions.startsWith('?') ? queryOrOptions : `?plotId=${queryOrOptions}`;
    } else if (typeof queryOrOptions === 'object' && queryOrOptions !== null) {
      const params = new URLSearchParams(queryOrOptions).toString();
      if (params) queryStr = `?${params}`;
    }

    setActiveTabState(tabId);
    const basePath = FARMER_TAB_PATHS[tabId] || '/mitra-tani/dashboard';
    const targetPath = `${basePath}${queryStr}`;
    const currentFull = `${window.location.pathname}${window.location.search}`;

    if (currentFull.toLowerCase() !== targetPath.toLowerCase()) {
      if (isReplace) {
        window.history.replaceState({ tab: tabId }, '', targetPath);
      } else {
        window.history.pushState({ tab: tabId }, '', targetPath);
      }
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);

  // Normalisasi URL awal jika user mengakses root /mitra-tani
  useEffect(() => {
    const current = window.location.pathname.toLowerCase().replace(/\/$/, '');
    if (current === '/mitra-tani') {
      window.history.replaceState({ tab: 'dashboard' }, '', '/mitra-tani/dashboard');
    }
  }, []);

  // Dengarkan browser Back / Forward (popstate) agar tab berganti sesuai riwayat sub-path
  useEffect(() => {
    const handlePopState = () => {
      const tabFromUrl = getFarmerTabFromPath(window.location.pathname);
      setActiveTabState(tabFromUrl);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Real backend synchronization state
  const [farmerSummary, setFarmerSummary] = useState(null);
  const [realLands, setRealLands] = useState([]);

  // Financial state
  const [currentAvailableBalance, setCurrentAvailableBalance] = useState(walletBalance || 0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  // Modals state
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showSatelliteModal, setShowSatelliteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState(null);

  // New plot state submitted from wizard
  const [customPlots, setCustomPlots] = useState([]);
  const [newlySubmittedPlot, setNewlySubmittedPlot] = useState(null);

  // Toast feedback banner (success | error | warning)
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ message: msg, type });
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 4500);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // Fetch real data from PostgreSQL backend
  const fetchFarmerData = useCallback(async () => {
    try {
      const [summary, lands, txs] = await Promise.all([
        getFarmerSummary(),
        getFarmerLands(),
        getFarmerWalletTransactions().catch(() => [])
      ]);
      setFarmerSummary(summary);
      setRealLands(lands);
      if (summary?.available_balance !== undefined) {
        setCurrentAvailableBalance(summary.available_balance);
        if (onUpdateBalance) onUpdateBalance(summary.available_balance);
      }
      if (summary?.escrow_balance !== undefined) {
        setEscrowBalance(summary.escrow_balance);
      }
      if (txs && txs.length > 0) {
        const mappedTx = txs.map(act => ({
          id: act.id,
          title: act.description,
          recipient: act.transaction_type === 'credit_payout' ? 'Dompet TaniKarbon (Bagi Hasil)' : 'Rekening Bank Terdaftar',
          recipientFull: act.description,
          amount: act.amount,
          date: new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
          status: act.status === 'completed' ? 'Dana Terkirim' : 'Diproses Admin',
          statusColor: act.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300',
          refNumber: `TRX-${String(act.id).slice(0, 8).toUpperCase()}`,
          transaction_type: act.transaction_type
        }));
        setTransactions(mappedTx);
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi data riil petani:', err);
    }
  }, [onUpdateBalance]);

  useEffect(() => {
    fetchFarmerData();
  }, [fetchFarmerData]);

  // Handle successful withdrawal from modal
  const handleWithdrawSuccess = (amount, newTx, remainingBalance) => {
    const updatedBalance = remainingBalance !== undefined ? remainingBalance : (currentAvailableBalance - amount);
    setCurrentAvailableBalance(updatedBalance);
    if (onUpdateBalance) onUpdateBalance(updatedBalance);
    setTransactions(prev => [newTx, ...prev]);
    fetchFarmerData();
  };

  // Handle completion of wizard
  const handleWizardComplete = (newPlotData = {}) => {
    const samples = Array.isArray(newPlotData?.samples) ? newPlotData.samples : [];
    const avgDbhStr = samples.length > 0
      ? `${(samples.reduce((a, s) => a + (parseFloat(s?.dbh) || 35), 0) / samples.length).toFixed(1)} cm`
      : '35.0 cm';
    const annualRev = Number(newPlotData?.farmerNetRevenue || 0);
    const spec = newPlotData?.species || 'Pohon Agroforestri';
    const totalTrees = Number(newPlotData?.totalTrees || 0);
    const estAbsorption = Number(newPlotData?.estimatedAbsorption || 0);

    const newPlotEntry = {
      id: newPlotData?.id || `plot-${Date.now()}`,
      name: newPlotData?.name || 'Petak Baru',
      areaHa: newPlotData?.areaHa || (newPlotData?.areaM2 ? (newPlotData.areaM2 / 10000).toFixed(2) : '0.50'),
      areaM2: newPlotData?.areaM2 || 5000,
      coordinates: newPlotData?.centroidCoords || '-7.3640, 109.9888',
      elevation: '920 mdpl',
      status: 'pending',
      statusLabel: '● Menunggu Verifikasi',
      totalTrees,
      totalCarbon: estAbsorption,
      annualRevenue: annualRev,
      satelliteImage: '/canopy-tree.jpg',
      blocks: [
        {
          key: `block-${Date.now()}`,
          variety: `Blok ${spec} (${totalTrees} Pohon)`,
          species: spec,
          population: totalTrees,
          avgAge: `${2026 - parseInt(newPlotData?.plantYear || '2020', 10)} Tahun`,
          avgDbh: avgDbhStr,
          carbonContribution: `${estAbsorption} tCO2e/thn`,
          revenueContribution: `Rp ${annualRev.toLocaleString('id-ID')}/thn`,
          treeData: {
            id: `TK-NEW-${Date.now().toString().slice(-4)}`,
            species: spec,
            age: 2026 - parseInt(newPlotData?.plantYear || '2020', 10),
            dbh: 38,
            co2PerYear: estAbsorption,
            samplePhoto: samples[0]?.photo || '/tree-dbh-sample.jpg'
          }
        }
      ]
    };

    setCustomPlots(prev => [newPlotEntry, ...prev]);
    setNewlySubmittedPlot(newPlotData);
    showToast(`Lahan "${newPlotData?.name || 'Baru'}" berhasil didaftarkan!`);
    fetchFarmerData();
    setActiveTab('land');
  };

  // Handle saving draft in wizard
  const handleWizardDraft = (draftData) => {
    showToast(`Draft lahan "${draftData.name}" berhasil disimpan lokal.`);
  };

  return (
    <div className="min-h-screen bg-[#E8ECE9] text-stone-800 flex font-sans">
      {/* FIXED LEFT SIDEBAR (single navigation surface — no top navbar) */}
      <FarmerSidebar
        currentUser={activeUser}
        onLogout={onLogout}
        currentTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          setMobileOpen(false);
        }}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* MAIN WORKSPACE WRAPPER */}
      <main className="min-w-0 flex-1 lg:ml-64 p-3 sm:p-4 lg:p-6 pb-28 lg:pb-8">
        <div className="bg-[#F9FBFA] rounded-[28px] border border-white/80 shadow-sm p-5 sm:p-6 lg:p-8 min-h-[calc(100vh-3rem)]">
          {/* Mobile top utility bar for quick logout & breadcrumbs */}
          <div className="flex items-center justify-between pb-4 lg:hidden">
            {activeTab !== 'dashboard' ? (
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
              >
                &larr; Beranda
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Mitra Tani Terverifikasi</span>
              </div>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition cursor-pointer"
              title="Keluar dari akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs animate-slide-up max-w-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-950 text-white border-rose-400/50'
                : toastMessage.type === 'warning'
                ? 'bg-amber-950 text-white border-amber-400/50'
                : 'bg-[#0F291E] text-white border-emerald-400/40'
            }`}>
              {toastMessage.type === 'error' ? (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : toastMessage.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="font-medium flex-1">{toastMessage.message}</span>
              <button 
                onClick={() => setToastMessage(null)}
                className="text-white/60 hover:text-white p-1 rounded-md transition cursor-pointer"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* VIEW ROUTING (5 HALAMAN UTAMA) WITH SMOOTH TRANSITION */}
          <div key={activeTab} className="page-enter">
            {activeTab === 'dashboard' && (
              <FarmerDashboardView
                farmerSummary={farmerSummary}
                realLands={realLands}
                onNavigateTab={setActiveTab}
                onOpenSatelliteModal={() => setShowSatelliteModal(true)}
                onOpenWithdrawal={() => setShowWithdrawalModal(true)}
                onOpenMobileNav={() => setMobileOpen(true)}
                availableBalance={currentAvailableBalance}
                escrowBalance={escrowBalance}
              />
            )}

            {activeTab === 'land' && (
              <LandManagementView
                realLands={realLands}
                customPlots={customPlots}
                onNavigateTab={setActiveTab}
                onRefresh={fetchFarmerData}
                onOpenMobileNav={() => setMobileOpen(true)}
                onToast={showToast}
              />
            )}

            {activeTab === 'wizard' && (
              <LandRegistrationWizard
                onComplete={handleWizardComplete}
                onSaveDraft={handleWizardDraft}
                onToast={showToast}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'timeline' && (
              <VerificationTrackingView
                newlySubmittedPlot={newlySubmittedPlot}
                onToast={showToast}
                onOpenMobileNav={() => setMobileOpen(true)}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'wallet' && (
              <FarmerWalletView
                availableBalance={currentAvailableBalance}
                escrowBalance={escrowBalance}
                transactions={transactions}
                onOpenWithdrawal={() => setShowWithdrawalModal(true)}
                onOpenReceipt={(tx) => setSelectedReceiptTx(tx)}
                onToast={showToast}
              />
            )}
          </div>
        </div>
      </main>

      {/* =========================================================================
          INTERACTIVE MODALS
          ========================================================================= */}
      {/* 1. Withdrawal Modal (from Farmer Wallet) */}
      {showWithdrawalModal && (
        <WithdrawalModal
          availableBalance={currentAvailableBalance}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={handleWithdrawSuccess}
          onToast={showToast}
        />
      )}

      {/* 4. Satellite Telemetry Modal */}
      {showSatelliteModal && (
        <SatelliteTelemetryModal
          onClose={() => setShowSatelliteModal(false)}
          onToast={showToast}
        />
      )}

      {/* 5. Farmer Profile Modal */}
      {showProfileModal && (
        <FarmerProfileModal
          currentUser={activeUser}
          farmerSummary={farmerSummary}
          onLogout={onLogout}
          onClose={() => setShowProfileModal(false)}
          onToast={showToast}
          onUserUpdated={(updatedData) => {
            setActiveUser(prev => ({ ...prev, ...updatedData }));
            setFarmerSummary(prev => prev ? ({ ...prev, farmer_name: updatedData.full_name || prev.farmer_name }) : prev);
          }}
        />
      )}

      {/* 6. Transfer Receipt Modal */}
      {selectedReceiptTx && (
        <TransferReceiptModal
          transaction={selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}

      {/* Mobile Bottom Navigation Bar (lg:hidden) - auto hidden when modals are open */}
      {!showWithdrawalModal && !showProfileModal && !showSatelliteModal && !selectedReceiptTx && (
        <FarmerMobileNav
          currentTab={activeTab}
          onSelectTab={(tabId) => {
            setActiveTab(tabId);
            setMobileOpen(false);
          }}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}

