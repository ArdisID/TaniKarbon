import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  CircleDot, 
  AlertCircle, 
  FileCheck, 
  UserCheck, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  Camera, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink,
  RefreshCw,
  Award,
  FileSignature
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function VerificationTimelineView({ onToast, newlySubmittedPlot }) {
  const [renewalSimulated, setRenewalSimulated] = useState(false);
  const [newDbh, setNewDbh] = useState('41');
  const [isUpdatingDbh, setIsUpdatingDbh] = useState(false);

  const stages = [
    {
      id: 1,
      title: 'Data Diajukan',
      status: 'completed',
      date: '20 Okt 2026, 09:14 WIB',
      desc: 'Formulir batas poligon, spesifikasi spesies, dan foto sampel smart sampling berhasil diterima sistem. Menunggu penugasan surveyor.',
      tag: 'Selesai ✓'
    },
    {
      id: 2,
      title: 'Survei Lapangan Internal',
      status: 'active',
      date: 'Rabu, 28 Okt 2026, 09:30 WIB (Terjadwal)',
      desc: 'Petugas lapangan ditugaskan untuk melakukan verifikasi fisik meteran di batang pohon dan mencocokkan kalibrasi AI satelit Sentinel-2.',
      tag: 'Sedang Berjalan - Aktif',
      showSurveyorLog: true
    },
    {
      id: 3,
      title: 'Masuk Antrean Klaster (Pre-Verified)',
      status: 'pending',
      date: 'Estimasi: 10 Nov 2026',
      desc: 'Lahan dinyatakan sah secara internal oleh Gapoktan. Menunggu akumulasi kuota klaster Dusun Garung mencapai batas minimum 500 tCO2e.',
      tag: 'Menunggu'
    },
    {
      id: 4,
      title: 'Lulus Audit Eksternal (Verified)',
      status: 'pending',
      date: 'Target Penutupan: 30 Nov 2026',
      desc: 'Penerbitan nomor referensi dokumen pengesahan dari auditor independen (No: KLHK/SPE-GRK/2026/0942). Kuota karbon resmi dicetak ke katalog bursa.',
      tag: 'Menunggu'
    }
  ];

  const handleSimulateRenewal = (e) => {
    e.preventDefault();
    setIsUpdatingDbh(true);
    setTimeout(() => {
      setIsUpdatingDbh(false);
      setRenewalSimulated(true);
      if (onToast) onToast('Pembaruan tahunan (Vintage Year) berhasil! Kuota bertambah +0.3 tCO2e.');
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Transparansi Posisi Lahan &amp; Siklus Tahunan
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1">
          Lacak Status Verifikasi (VerificationStepper)
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Memberikan transparansi posisi lahan petani dalam alur pemeriksaan serta mengelola masa berlaku karbon tahunan.
        </p>
      </div>

      {newlySubmittedPlot && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="flex-1">
            <strong>Pengajuan Lapangan Diterima: {newlySubmittedPlot.name}</strong>
            <p className="text-[11px] text-emerald-800">
              Data lahan {newlySubmittedPlot.totalTrees} pohon telah masuk antrean penugasan surveyor. ID Tugas: #TIK-SRV-{Date.now().toString().slice(-5)}.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): VerificationStepper & SurveyorLogBox */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#14382C]">
                  Pelacak Status Vertikal 4 Tahap (VerificationStepper)
                </h2>
                <p className="text-xs text-stone-500">ID Registrasi Petak: #TK-PLT-GARUNG-01</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                Tahap 2 dari 4
              </span>
            </div>

            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
              {stages.map((stage) => {
                const isCompleted = stage.status === 'completed';
                const isActive = stage.status === 'active';
                const isPending = stage.status === 'pending';

                return (
                  <div key={stage.id} className="relative group">
                    <div className={`absolute -left-6 sm:-left-8 top-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : isActive
                        ? 'bg-white border-emerald-600 text-emerald-700 ring-4 ring-emerald-100 animate-pulse'
                        : 'bg-stone-100 border-stone-300 text-stone-400'
                    }`}>
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />}
                      {isActive && <CircleDot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />}
                      {isPending && <span className="text-[10px] font-bold font-mono">{stage.id}</span>}
                    </div>

                    <div className={`p-4 rounded-2xl border transition ${
                      isActive 
                        ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' 
                        : isCompleted
                        ? 'bg-stone-50/60 border-stone-200'
                        : 'bg-white border-stone-200/60 opacity-70'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className={`text-xs sm:text-sm font-extrabold ${
                          isActive ? 'text-emerald-950 font-black' : 'text-stone-800'
                        }`}>
                          {stage.id}. {stage.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 text-stone-500'
                        }`}>
                          {stage.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium mt-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>{stage.date}</span>
                      </div>

                      <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                        {stage.desc}
                      </p>

                      {/* B. Kotak Catatan & Koreksi Petugas (SurveyorLogBox) */}
                      {stage.showSurveyorLog && (
                        <div className="mt-3.5 p-3.5 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-emerald-700" />
                              <strong className="text-xs text-[#14382C] font-extrabold">
                                Petugas Ditugaskan: Ir. Bambang Sugiarto (Surveyor Klaster)
                              </strong>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Lolos Cek Lapangan
                            </span>
                          </div>

                          <div className="p-2.5 bg-emerald-50/70 rounded-lg border-l-4 border-emerald-600">
                            <p className="text-xs text-emerald-950 font-medium italic">
                              "Catatan Surveyor: Koordinat poligon valid. 3 sampel foto batang pohon sangat jelas memenuhi standar alometrik Tier-3. Populasi pohon dikoreksi dari 100 menjadi 95 pohon hidup; rata-rata lingkar batang tervalidasi 41 cm."
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                            <span>Sertifikasi Surveyor: KLHK No. 2024/AUD/0981</span>
                            <span>Inspeksi: 24 Okt 2026, 14:30 WIB</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: C. Kartu Pembaruan Siklus Tahunan (AnnualVintageRenewalCard) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Masa Berlaku Karbon
                </span>
                <h3 className="text-xs sm:text-sm font-black text-[#14382C]">
                  Annual Vintage Renewal
                </h3>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Status Kredit Terjual</span>
              <p className="font-extrabold text-[#14382C] text-sm leading-tight">
                Pembaruan Pengukuran Berikutnya: Oktober 2027
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Karena kredit karbon yang dibeli perusahaan bersifat <strong>hangus per tahun (Retired)</strong>, pohon petani yang terus hidup akan menghasilkan <strong>kuota karbon baru di tahun berikutnya (Vintage Year baru)</strong>.
              </p>
            </div>

            {/* Interactive Simulation Form */}
            {!renewalSimulated ? (
              <form onSubmit={handleSimulateRenewal} className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Simulasi Pengukuran Baru (Tahun Depan):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newDbh}
                      onChange={(e) => setNewDbh(e.target.value)}
                      className="w-20 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-center text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <span className="text-stone-600 font-bold">cm (Tumbuh +3 cm)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingDbh}
                  className="w-full py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isUpdatingDbh ? 'Mengalkulasi...' : 'Simulasikan Unggah Foto & Ukuran Baru'}</span>
                </button>
              </form>
            ) : (
              <div className="mt-4 p-3 bg-emerald-100/70 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Vintage Year 2027 Terdaftar!</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Lingkar batang baru <strong>{newDbh} cm</strong> tercatat. Kuota karbon baru bertambah <strong>+0.3 tCO2e/thn</strong> dengan dividen baru <strong>+Rp 48.000/thn</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setRenewalSimulated(false)}
                  className="text-[10px] text-emerald-800 underline font-bold mt-1"
                >
                  Ulangi Simulasi
                </button>
              </div>
            )}
          </div>

          <div className="bg-stone-50 rounded-3xl p-5 border border-stone-200/80 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-stone-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Standar Registrasi KLHK</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Seluruh data audit terintegrasi ke Sistem Registri Nasional Pengendalian Perubahan Iklim (SRN-PPI) sesuai Perpres No. 98 Tahun 2021.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
