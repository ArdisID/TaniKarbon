import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  MapPin, 
  Trees, 
  Ruler, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  FileCheck2, 
  Scale, 
  Info, 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function FieldInspectionWorksheetView({ 
  ticket, 
  onCompleteVerification, 
  onBackToMap, 
  onToast 
}) {
  const activeTicket = ticket || {
    id: 'TKT-WNSB-042',
    farmerName: 'Pak Joko Widodo',
    landName: 'Lahan 1 - Pekarangan Garung',
    areaM2: 4520,
    treeCount: 100,
    species: 'Mangga Harumanis',
    initialCarbon: 2.00
  };

  // Stepper State (Tahap 1 s/d 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Tahap 1: Verifikasi Poligon
  const [polygonValidOption, setPolygonValidOption] = useState('match'); // 'match' | 'redraw'
  const [recalculatedArea, setRecalculatedArea] = useState(activeTicket.areaM2 || 4520);
  const [noOverlapConfirmed, setNoOverlapConfirmed] = useState(true);

  // Tahap 2: Audit Blok Tanam & Koreksi Populasi
  const [actualPopulation, setActualPopulation] = useState(95);
  const farmerClaimPopulation = 100;
  const populationDelta = actualPopulation - farmerClaimPopulation; // -5
  const [correctionReason, setCorrectionReason] = useState('5 pohon di sudut utara ditemukan mati kering dan tidak dihitung.');

  // Tahap 3: Uji Petik & Pengukuran Ulang Sampel
  const [samples, setSamples] = useState([
    {
      id: 1,
      farmerGirthCm: 40,
      farmerPhotoValid: true,
      actualGirthCm: 41,
      hasPhoto: true,
      photoUrl: '/sample-measuring.jpg'
    },
    {
      id: 2,
      farmerGirthCm: 42,
      farmerPhotoValid: true,
      actualGirthCm: 42,
      hasPhoto: true,
      photoUrl: '/sample-measuring.jpg'
    },
    {
      id: 3,
      farmerGirthCm: 38,
      farmerPhotoValid: true,
      actualGirthCm: 39,
      hasPhoto: true,
      photoUrl: '/sample-measuring.jpg'
    }
  ]);

  // Detektor Deviasi Ekstrem: Hitung persentase perbedaan rata-rata
  const avgFarmerGirth = samples.reduce((acc, s) => acc + s.farmerGirthCm, 0) / samples.length;
  const avgActualGirth = samples.reduce((acc, s) => acc + (parseFloat(s.actualGirthCm) || 0), 0) / samples.length;
  const deviationPercent = Math.abs((avgActualGirth - avgFarmerGirth) / avgFarmerGirth) * 100;
  const isExtremeDeviation = deviationPercent > 15; // Clean > 15% without LaTeX typo!

  // Tahap 4: Kalkulasi Ulang Karbon & Keputusan
  const initialCarbonEstimate = 2.00; // tCO2e
  const validatedCarbonResult = 1.94; // tCO2e
  const [officialNotes, setOfficialNotes] = useState('Populasi dikoreksi dari 100 menjadi 95 pohon hidup; 5 pohon mati tidak dihitung. Sampel DBH valid.');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Step Navigators
  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleDecision = (decisionType) => {
    const resultData = {
      ticketId: activeTicket.id,
      farmerName: activeTicket.farmerName,
      decision: decisionType, // 'approved' | 'revision' | 'rejected'
      validatedTrees: actualPopulation,
      validatedCarbon: validatedCarbonResult,
      officialNotes,
      rejectionReason,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB, Hari Ini'
    };

    onCompleteVerification(resultData);
    if (onToast) {
      if (decisionType === 'approved') {
        onToast(`Lahan ${activeTicket.farmerName} berhasil Disahkan ke Pre-Verified (+1,94 tCO2e)!`);
      } else if (decisionType === 'revision') {
        onToast(`Permintaan revisi berhasil dikirim ke akun ${activeTicket.farmerName}.`);
      } else {
        onToast(`Pengajuan lahan ${activeTicket.farmerName} ditolak.`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 font-sans">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-[#14382C] text-emerald-300 uppercase">
              LEMBAR AUDIT FISIK TIER-3
            </span>
            <span className="text-xs font-mono font-medium text-slate-500">{activeTicket.id}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1 font-sans">
            Inspeksi Lapangan: {activeTicket.landName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Petani: <strong className="text-stone-800">{activeTicket.farmerName}</strong> • Komparasi data klaim petani vs temuan aktual fisik.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToMap}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Peta</span>
        </button>
      </div>

      {/* Stepper Indicator (4 Tahap Bersih) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-sans">
          {[
            { num: 1, title: 'Batas Poligon' },
            { num: 2, title: 'Audit Populasi' },
            { num: 3, title: 'Uji Sampel DBH' },
            { num: 4, title: 'Kalkulasi Karbon' }
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`p-2.5 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer ${
                currentStep === s.num
                  ? 'bg-[#14382C] text-white font-bold shadow-xs'
                  : currentStep > s.num
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                  : 'bg-slate-50 text-slate-500 font-medium'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center ${
                currentStep === s.num ? 'bg-white text-[#14382C] font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                {s.num}
              </span>
              <span className="text-[11px] sm:text-xs truncate">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: Verifikasi Poligon & Batas Lahan */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <div>
              <h3 className="font-bold text-base text-[#14382C]">
                Tahap 1: Verifikasi Poligon &amp; Batas Lahan (PolygonVerificationStep)
              </h3>
              <p className="text-xs text-slate-500">
                Cocokkan garis batas GPS petani dengan kondisi patok fisik di lapangan.
              </p>
            </div>
          </div>

          {/* Visual Boundary Preview Box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl relative overflow-hidden h-52 flex flex-col justify-between">
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-mono text-emerald-400 bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
                Overlay Citra Satelit + Jalur Berjalan Petugas
              </span>
              <span className="text-xs font-mono font-bold text-white">
                Luas Lahan: {recalculatedArea.toLocaleString('id-ID')} m²
              </span>
            </div>

            <div className="text-center z-10 py-6">
              <div className="inline-block p-4 border-2 border-dashed border-emerald-400/80 rounded-2xl bg-emerald-500/10 backdrop-blur-xs">
                <span className="text-xs text-emerald-200 block font-medium">Poligon Lahan #TK-WNSB-042</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {recalculatedArea} m²
                </span>
                <span className="text-[10px] text-emerald-300 font-sans mt-0.5 block">
                  ● Posisi berjalan petugas terpantau di dalam batas patok
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 z-10 border-t border-white/10 pt-2 font-mono">
              <span>Sensor: GPS High-Precision (Akurasi &plusmn; 1.2m)</span>
              <span>Datum: WGS84 UTM Zone 49S</span>
            </div>
          </div>

          {/* Toggle Validasi Batas Lahan */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 block">
              Pemeriksaan Batas Bidang Kebun:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPolygonValidOption('match');
                  setRecalculatedArea(4520);
                }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  polygonValidOption === 'match'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold font-sans">✓ Batas Poligon Sesuai Lapangan</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Garis poligon yang digambar petani akurat sesuai patok batas fisik di tanah (4.520 m²).
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPolygonValidOption('redraw');
                  setRecalculatedArea(4380);
                }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  polygonValidOption === 'redraw'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700">✎ Koreksi Titik Sudut (Redraw Tool)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Ada sudut meluber ke jalan desa / jurang; dikoreksi menjadi <strong>4.380 m²</strong>.
                </p>
              </button>
            </div>
          </div>

          {/* Checkbox Konfirmasi Tumpang Tindih */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="noOverlap"
              checked={noOverlapConfirmed}
              onChange={(e) => setNoOverlapConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="noOverlap" className="text-xs text-slate-700 font-medium cursor-pointer leading-relaxed">
              <strong>Konfirmasi Anti-Sengketa:</strong> Saya menyatakan bahwa batas lahan ini telah diverifikasi secara fisik dan <em>tidak ditemukan tumpang tindih fisik / sengketa patok ganda</em> dengan lahan tetangga di sekitarnya.
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleNext}
              disabled={!noOverlapConfirmed}
              className="px-6 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Lanjut ke Audit Blok Tanam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Audit Blok Tanam & Koreksi Populasi */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <div>
              <h3 className="font-bold text-base text-[#14382C]">
                Tahap 2: Audit Blok Tanam &amp; Koreksi Populasi (PopulationAuditStep)
              </h3>
              <p className="text-xs text-slate-500">
                Bandingkan klaim populasi petani dengan temuan aktual pohon hidup di kebun.
              </p>
            </div>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Klaim Petani */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[10px] font-sans font-semibold uppercase text-slate-400 block tracking-wider">
                DATA KLAIM AWAL PETANI
              </span>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>Spesies Terdaftar: <strong className="text-stone-900">Mangga Harumanis</strong></p>
                <p>Tahun Tanam: <strong className="text-stone-900">2021 (Umur 5 Tahun)</strong></p>
                <p>Metode Tanam: <strong className="text-stone-900">Agroforestri Monokultur Selang</strong></p>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-500 block">Klaim Populasi Petani:</span>
                <span className="text-3xl font-black font-sans text-stone-900 mt-0.5 block">
                  100 Pohon
                </span>
              </div>
            </div>

            {/* Right: Temuan Aktual Petugas */}
            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
              <span className="text-[10px] font-sans font-semibold uppercase text-emerald-800 block tracking-wider">
                TEMUAN AKTUAL PETUGAS (HASIL HITUNG CEPAT)
              </span>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">
                  Jumlah Pohon Hidup di Lapangan:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={actualPopulation}
                    onChange={(e) => setActualPopulation(parseInt(e.target.value || '0', 10))}
                    className="w-32 px-3.5 py-2 text-base font-sans font-bold bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                  />
                  <span className="text-xs font-bold text-slate-700">Pohon Hidup</span>
                </div>
              </div>

              {/* Automatic Delta Badge */}
              <div className="pt-2">
                <span className="text-xs text-slate-500 block">Kalkulasi Selisih Otomatis:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-sans font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Selisih: {populationDelta} Pohon ({Math.round((populationDelta / farmerClaimPopulation) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Correction Reason */}
          {populationDelta !== 0 && (
            <div className="space-y-1.5 p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs">
              <label className="font-bold text-amber-900 block">
                Alasan Koreksi Populasi (Wajib Diisi untuk Audit KLHK):
              </label>
              <input
                type="text"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-sans bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-amber-600 transition"
                placeholder="Contoh: 5 pohon di sudut utara ditemukan mati kering dan tidak dihitung."
              />
            </div>
          )}

          <div className="flex justify-between pt-3">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <span>Lanjut ke Uji Sampel DBH</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Uji Petik & Pengukuran Ulang Sampel */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <div>
              <h3 className="font-bold text-base text-[#14382C]">
                Tahap 3: Uji Petik &amp; Pengukuran Ulang Sampel (SampleRemeasurementStep)
              </h3>
              <p className="text-xs text-slate-500">
                Validasi 3 sampel pohon dengan pita ukur setinggi dada (130 cm / DBH) dan kamera ber-watermark.
              </p>
            </div>
          </div>

          {/* Deviation Warning Alert (> 15%) - Clean without LaTeX! */}
          {isExtremeDeviation && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Detektor Deviasi Ekstrem: Selisih &gt; 15%!</strong>
                <p className="mt-0.5 leading-relaxed">
                  Rata-rata ukuran lingkar batang aktual berbeda lebih dari 15% dari klaim petani. Sistem mewajibkan petugas mengambil <strong>+2 Pohon Sampel Tambahan</strong> secara acak di kebun untuk memastikan keabsahan data alometrik.
                </p>
              </div>
            </div>
          )}

          {/* Sample Cards List */}
          <div className="space-y-4">
            {samples.map((sample, idx) => {
              const actualGirthNum = parseFloat(sample.actualGirthCm) || 0;
              const diameterCm = actualGirthNum > 0 ? (actualGirthNum / Math.PI).toFixed(2) : '0';

              return (
                <div key={sample.id} className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#14382C] text-white text-[11px] font-mono flex items-center justify-center font-bold">
                        #{sample.id}
                      </span>
                      <span>Pohon Sampel Uji Petik #{sample.id}</span>
                    </span>

                    {/* Toggle Kualitas Foto Petani */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...samples];
                          updated[idx].farmerPhotoValid = !updated[idx].farmerPhotoValid;
                          setSamples(updated);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                          sample.farmerPhotoValid
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {sample.farmerPhotoValid ? '✓ Foto Petani Valid' : '⚠️ Foto Buram / Tidak Sesuai'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                    {/* Klaim Petani */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Klaim Petani</span>
                      <strong className="text-base font-mono text-stone-800 mt-0.5 block">
                        Lingkar {sample.farmerGirthCm} cm
                      </strong>
                      <span className="text-[10px] text-slate-400">Tercatat di aplikasi petani</span>
                    </div>

                    {/* Input Aktual Petugas */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                        Pengukuran Ulang Petugas (DBH 130 cm)
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={sample.actualGirthCm}
                          onChange={(e) => {
                            const updated = [...samples];
                            updated[idx].actualGirthCm = e.target.value;
                            setSamples(updated);
                          }}
                          className="w-20 px-2.5 py-1 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                        />
                        <span className="font-mono text-xs text-slate-600">cm</span>
                        <span className="text-slate-400">➔</span>
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          D = {diameterCm} cm
                        </span>
                      </div>
                    </div>

                    {/* GeoStamped Camera Simulator */}
                    <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-400 font-mono">WATERMARK BUKTI</span>
                        <Camera className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="text-[9px] font-mono text-slate-300 leading-tight mt-2">
                        26 Okt 2026 10:14 WIB<br />
                        -7.3639, 109.9886<br />
                        ID: SRV-BUDI-09
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-3">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <span>Lanjut ke Keputusan Verifikasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Kalkulasi Ulang Karbon & Keputusan Verifikasi */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <div>
              <h3 className="font-bold text-base text-[#14382C]">
                Tahap 4: Kalkulasi Ulang Karbon &amp; Keputusan Verifikasi (VerificationDecisionStep)
              </h3>
              <p className="text-xs text-slate-500">
                Tetapkan tonase serapan karbon resmi yang akan dikunci dan dimasukkan ke bursa kuota klaster.
              </p>
            </div>
          </div>

          {/* Panel Komparasi Serapan Karbon (RecalculatedCarbonCard) */}
          <div className="p-6 bg-emerald-950 text-white rounded-3xl relative overflow-hidden shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 block tracking-wider">
                  HASIL REKALKULASI ALOMETRIK CHAVE TIER-3
                </span>
                <h4 className="text-lg font-bold text-white mt-0.5">
                  Kuota Karbon Lahan Terverifikasi
                </h4>
              </div>

              <div className="sm:text-right space-y-1">
                {/* Estimasi Awal (Dicoret) */}
                <div className="text-xs text-slate-400 font-sans">
                  Estimasi Awal Petani (100 pohon, 40 cm): <span className="line-through font-mono">2,00 tCO2e / tahun</span>
                </div>
                {/* Hasil Validasi (Highlight Hijau Tebal) */}
                <div className="text-3xl font-black font-sans text-emerald-300">
                  +1,94 <span className="text-base font-normal font-mono text-white">tCO2e / tahun</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-sans block">
                  Dikunci Permanen untuk Kuota Klaster Agroforestri
                </span>
              </div>
            </div>
          </div>

          {/* Kotak Catatan Resmi Petugas (SurveyorOfficialNotesInput) */}
          <div className="space-y-1.5 font-sans">
            <label className="text-xs font-semibold text-slate-700 block">
              Catatan Resmi Pemeriksaan Lapangan (SurveyorOfficialNotesInput):
            </label>
            <textarea
              rows={3}
              value={officialNotes}
              onChange={(e) => setOfficialNotes(e.target.value)}
              className="w-full p-3.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#14382C] focus:bg-white transition"
              placeholder="Tuliskan catatan detail verifikasi..."
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-sans">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                <strong>Integrasi ke Role Petani:</strong> Catatan ini otomatis langsung dirender pada komponen <em>SurveyorLogBox</em> di halaman Lacak Verifikasi milik Petani.
              </span>
            </p>
          </div>

          {/* Kotak Alasan Penolakan (Jika tombol Tolak ditekan) */}
          {showRejectBox && (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 space-y-2 text-xs">
              <label className="font-bold text-red-900 block">
                Alasan Penolakan Lahan (Wajib untuk Laporan Dewan Pengawas):
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-red-300 rounded-xl"
                placeholder="Contoh: Lahan terbukti fiktif, gundul, atau melanggar syarat sempadan sungai..."
              />
            </div>
          )}

          {/* Tiga Tombol Keputusan Akhir (DecisionActionButtons) */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
            <button
              type="button"
              onClick={handlePrev}
              className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Kembali
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              {/* Tombol 1: Minta Revisi */}
              <button
                type="button"
                onClick={() => handleDecision('revision')}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition cursor-pointer"
              >
                Minta Revisi ke Petani
              </button>

              {/* Tombol 2: Tolak Pengajuan */}
              <button
                type="button"
                onClick={() => {
                  if (!showRejectBox) {
                    setShowRejectBox(true);
                  } else {
                    handleDecision('rejected');
                  }
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-bold transition cursor-pointer"
              >
                Tolak Pengajuan Lahan
              </button>

              {/* Tombol 3: Sahkan (Utama Hijau) */}
              <button
                type="button"
                onClick={() => handleDecision('approved')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sahkan &amp; Ubah ke Pre-Verified (+1,94 tCO2e)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
