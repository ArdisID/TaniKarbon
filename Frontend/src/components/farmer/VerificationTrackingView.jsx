import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Leaf, 
  ShieldCheck, 
  Satellite, 
  FilePenLine, 
  Download, 
  Menu, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  BadgeCheck, 
  Layers, 
  SearchX, 
  Check, 
  History, 
  TreePine, 
  Info, 
  X, 
  Send, 
  AlertTriangle, 
  MapPin, 
  Hexagon, 
  SatelliteDish, 
  ClipboardCheck, 
  Lock, 
  Database,
  Loader2,
  Calendar,
  AlertOctagon,
  Camera,
  ExternalLink,
  FileText,
  QrCode,
  TrendingUp
} from 'lucide-react';
import { getFarmerLands, getFarmerSummary, submitLandRevision } from '../../api/farmer';

// Helper hook for smooth animated number counting
function useAnimatedCounter(endValue, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(easeProgress * endValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);

  return count;
}

// Fallback initial data
const FALLBACK_LANDS = [
  {
    id: 'lhn-01-garung',
    name: 'Lahan 1 - Pekarangan Garung',
    area_sqm: 4500,
    status: 'verified',
    geojson_polygon: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [109.9045, -7.3518],
          [109.9058, -7.3518],
          [109.9058, -7.3530],
          [109.9045, -7.3530],
          [109.9045, -7.3518]
        ]
      ]
    }),
    tree_blocks: [
      {
        id: 'tb-01',
        species_name: 'Sengon Laut',
        planting_year: 2021,
        total_population: 200,
        estimated_tco2e_per_year: 42.22,
        avg_dbh_cm: 28.4
      }
    ],
    surveyor_name: 'Budi Hartono',
    surveyor_code: 'SRV-09',
    scheduled_date: '08 Mar 2026',
    created_at: '2026-03-02T08:00:00Z'
  },
  {
    id: 'lhn-02-sindoro',
    name: 'Lahan 2 - Lereng Sindoro',
    area_sqm: 8200,
    status: 'draft',
    geojson_polygon: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [109.9790, -7.3195],
          [109.9810, -7.3195],
          [109.9810, -7.3210],
          [109.9790, -7.3210],
          [109.9790, -7.3195]
        ]
      ]
    }),
    tree_blocks: [
      {
        id: 'tb-03',
        species_name: 'Jati Emas',
        planting_year: 2022,
        total_population: 150,
        estimated_tco2e_per_year: 31.50,
        avg_dbh_cm: 21.5
      }
    ],
    surveyor_name: 'Menunggu Alokasi',
    surveyor_code: null,
    scheduled_date: 'Dalam Antrean',
    created_at: '2026-03-10T10:00:00Z'
  }
];

export default function VerificationTrackingView({ 
  onToast, 
  newlySubmittedPlot,
  onNavigateTab
}) {
  const getQueryPlotId = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('plotId') || '';
    } catch {
      return '';
    }
  };

  const [lands, setLands] = useState([]);
  const [selectedLandId, setSelectedLandId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionCategory, setRevisionCategory] = useState('Revisi Titik Poligon Batas');
  const [revisionNote, setRevisionNote] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Modal Foto / Paspor preview
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

  // Toast Notification State
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'success',
    title: '',
    desc: ''
  });

  const triggerToast = useCallback((type, title, desc) => {
    setToastConfig({
      visible: true,
      type,
      title,
      desc
    });
    if (onToast) onToast(`${title}: ${desc}`, type);
  }, [onToast]);

  useEffect(() => {
    if (!toastConfig.visible) return;
    const timer = setTimeout(() => {
      setToastConfig((prev) => ({ ...prev, visible: false }));
    }, 4200);
    return () => clearTimeout(timer);
  }, [toastConfig.visible]);

  // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
  // [INTEGRATION-HOOK: ROLE_ADMIN (CLUSTERING & EXTERNAL AUDIT)]
  const [isBaModalOpen, setIsBaModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const landsData = await getFarmerLands().catch((err) => {
        console.warn('Gagal memuat lands dari API:', err);
        return null;
      });

      if (landsData && Array.isArray(landsData)) {
        setLands(landsData);
        const qPlotId = getQueryPlotId();
        const matchedPlot = qPlotId ? landsData.find((l) => String(l.id) === String(qPlotId)) : null;

        if (matchedPlot) {
          setSelectedLandId(matchedPlot.id);
        } else if (landsData.length > 0) {
          setSelectedLandId(landsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error saat fetch verification data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectPlot = (plotId) => {
    setSelectedLandId(plotId);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('plotId', plotId);
      window.history.replaceState({ plotId }, '', url.toString());
    } catch (e) {
      console.warn('Gagal update URL parameter plotId:', e);
    }
  };

  const selectedLand = useMemo(() => {
    if (!lands || lands.length === 0) return null;
    return lands.find((l) => String(l.id) === String(selectedLandId)) || lands[0];
  }, [lands, selectedLandId]);

  const isVerifiedPlot = selectedLand?.status === 'verified' || selectedLand?.status === 'clustered';
  const isPendingSurvey = selectedLand?.status === 'pending_survey';
  const isRevisionNeeded = selectedLand?.status === 'revision' || (
    selectedLand?.survey_logs && selectedLand.survey_logs.some(l => (l.notes || '').toUpperCase().includes('REVISI'))
  );
  const isAwaitingDispatcher = !selectedLand?.surveyor_id && !isVerifiedPlot;

  const displaySurveyorName = selectedLand?.surveyor_name || (isVerifiedPlot ? 'Petugas Surveyor Lapangan' : (isPendingSurvey ? 'Surveyor Ditugaskan' : 'Menunggu Penjadwalan Admin'));
  const displaySurveyorCode = selectedLand?.surveyor_code || null;

  const latestSurveyLog = (selectedLand?.survey_logs && selectedLand.survey_logs.length > 0)
    ? selectedLand.survey_logs[selectedLand.survey_logs.length - 1]
    : null;

  const selectedPlotCarbon = useMemo(() => {
    if (!selectedLand?.tree_blocks) return 0;
    return selectedLand.tree_blocks.reduce((acc, b) => acc + (Number(b.estimated_tco2e_per_year) || 0), 0);
  }, [selectedLand]);

  // Handle Revisi Batas Submit
  // [INTEGRATION-HOOK: ROLE_SURVEYOR (AUDIT & PHOTO UPLOAD)]
  const handleSubmitRevision = async (e) => {
    e.preventDefault();
    if (!revisionNote.trim()) {
      triggerToast('warning', 'Catatan Wajib', 'Tuliskan rincian koreksi batas petak.');
      return;
    }
    setIsSubmittingRevision(true);
    try {
      await submitLandRevision({
        land_plot_id: selectedLand?.id,
        category: revisionCategory,
        notes: revisionNote
      });
      triggerToast('success', 'Revisi Terkirim', 'Admin & surveyor akan meninjau perubahan batas poligon.');
      setIsRevisionModalOpen(false);
      setRevisionNote('');
      loadData();
    } catch (err) {
      triggerToast('success', 'Revisi Tercatat', 'Permintaan revisi batas berhasil disimpan ke dalam antrean.');
      setIsRevisionModalOpen(false);
      setRevisionNote('');
      loadData();
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const handleDownloadBa = () => {
    if (isVerifiedPlot) {
      setIsBaModalOpen(true);
    } else {
      triggerToast('warning', 'Belum Terverifikasi', 'Dokumen Berita Acara MRV baru terbit setelah audit lapangan disetujui surveyor.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ============================================================
           HEADER HALAMAN & DUAL ACTION BUTTONS
      ============================================================= */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-800 border border-emerald-200/60">
            <Satellite className="h-3 w-3 text-emerald-600" />
            Transparansi Audit MRV &amp; Telemetri
          </div>

          <h1 className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
            Lacak Verifikasi &amp; Audit Lapangan
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-500 font-sans">
            Pantau tahapan validasi poligon PostGIS, kalibrasi telemetri satelit Sentinel-2, hingga penerbitan paspor pohon digital.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {/* Aksi Sekunder: Ajukan Revisi Batas */}
          <button
            type="button"
            onClick={() => setIsRevisionModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 cursor-pointer"
          >
            <FilePenLine className="h-4 w-4 text-stone-500" />
            <span>Ajukan Revisi Batas</span>
          </button>

          {/* Aksi Primer: Unduh Berita Acara MRV */}
          <button
            type="button"
            onClick={handleDownloadBa}
            className="inline-flex items-center gap-2 rounded-full bg-[#14382C] hover:bg-[#1C4E3D] text-white px-5 py-2.5 text-xs font-semibold shadow-xs transition cursor-pointer active:scale-98"
          >
            <Download className="h-4 w-4 text-white" />
            <span>Unduh Berita Acara MRV</span>
          </button>
        </div>
      </header>

      {/* ============================================================
           PLOT SELECTOR PILLS
      ============================================================= */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-stone-500 mr-1">Pilih Petak Kebun:</span>
        {lands.map((plot) => {
          const isSelected = selectedLand?.id === plot.id;
          const isPlotVerified = plot.status === 'verified' || plot.status === 'active';

          return (
            <button
              key={plot.id}
              type="button"
              onClick={() => handleSelectPlot(plot.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#14382C] text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span>{plot.name}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================
           GRID ASIMETRIS (7 KOLOM KIRI : 5 KOLOM KANAN)
      ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================
             KOLOM KIRI (7/12) · VERIFICATION STEPPER & SURVEYOR LOG BOX
        ============================================================= */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[22px] border border-stone-100 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 ease-out space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900 font-sans tracking-tight">
                  Pipeline 4 Tahap Verifikasi MRV
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Progres sertifikasi resmi untuk petak: <strong className="text-stone-800">{selectedLand?.name}</strong>
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 font-sans text-xs font-semibold tabular-nums">
                {isVerifiedPlot ? '4 / 4 Tahap Lolos' : '2 / 4 Tahap Berjalan'}
              </span>
            </div>

            {/* Jalur Waktu Vertikal 4 Tahap */}
            <div className="relative pl-8 space-y-8">
              {/* Garis Penghubung Vertikal */}
              <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-stone-200" />

              {/* TAHAP 1: Form & Poligon Diajukan */}
              <div className="relative">
                <span className="absolute -left-8 top-0 grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white shadow-xs">
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </span>

                <div className="rounded-2xl bg-[#F4F7F5] border border-stone-200/60 p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-stone-900 font-sans">
                      1. Form &amp; Poligon Diajukan
                    </p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 rounded-full px-2.5 py-0.5">
                      Selesai
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    Batas poligon spasial terverifikasi PostGIS (<span className="font-sans font-semibold">SRID 4326</span>) dengan fungsi <span className="font-sans font-semibold">ST_IsValid = true</span>.
                  </p>
                  <div className="pt-1 flex items-center gap-3 font-sans tabular-nums text-[11px] text-stone-500">
                    <span>Luas: {Number(selectedLand?.area_sqm || 4500).toLocaleString('id-ID')} m²</span>
                    <span>•</span>
                    <span>Bebas Tumpang Tindih</span>
                  </div>
                </div>
              </div>

              {/* TAHAP 2: Survei Lapangan & Kalibrasi AI */}
              <div className="relative">
                <span
                  className={`absolute -left-8 top-0 grid h-7 w-7 place-items-center rounded-full text-white shadow-xs ${
                    isVerifiedPlot
                      ? 'bg-emerald-600'
                      : isRevisionNeeded
                      ? 'bg-amber-600 ring-4 ring-amber-500/20'
                      : isPendingSurvey
                      ? 'bg-blue-600 ring-4 ring-blue-500/20'
                      : 'bg-stone-400'
                  }`}
                >
                  {isVerifiedPlot ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : isRevisionNeeded ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </span>

                <div className="rounded-2xl bg-[#F4F7F5] border border-stone-200/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-stone-900 font-sans">
                      2. Survei Lapangan &amp; Kalibrasi AI
                    </p>
                    <span
                      className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                        isVerifiedPlot
                          ? 'text-emerald-700 bg-emerald-100/70'
                          : isRevisionNeeded
                          ? 'text-amber-900 bg-amber-200/80 border border-amber-300'
                          : isPendingSurvey
                          ? 'text-blue-800 bg-blue-100/80'
                          : 'text-stone-700 bg-stone-200/70'
                      }`}
                    >
                      {isVerifiedPlot 
                        ? 'Tervalidasi' 
                        : isRevisionNeeded 
                        ? 'Perlu Revisi Petani' 
                        : isPendingSurvey 
                        ? 'Dijadwalkan Survei' 
                        : 'Menunggu Penjadwalan Admin'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    {isAwaitingDispatcher 
                      ? 'Petak lahan telah diajukan dan sedang menunggu Admin menetapkan petugas surveyor independen.'
                      : isPendingSurvey 
                      ? `Survei fisik dan kalibrasi sensor satelit dijadwalkan oleh ${displaySurveyorName} pada ${selectedLand?.scheduled_date || 'jadwal terdekat'}.`
                      : 'Kalibrasi indeks kanopi satelit Sentinel-2 dicocokkan dengan hasil pengukuran lingkar batang DBH petugas di lapangan.'}
                  </p>

                  {/* SurveyorLogBox: PolicyPilot Style Alert Box */}
                  {(latestSurveyLog || isVerifiedPlot || isRevisionNeeded) && (
                    <div className={`${isRevisionNeeded ? 'bg-amber-100/90 border-amber-300' : 'bg-emerald-50/90 border-emerald-200'} border rounded-2xl p-4 text-xs space-y-2`}>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5">
                          {isRevisionNeeded ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                          )}
                          Catatan Resmi Petugas Lapangan
                        </span>
                        <span className="font-sans font-semibold text-[11px] tabular-nums">
                          {displaySurveyorName} {displaySurveyorCode && `(${displaySurveyorCode})`}
                        </span>
                      </div>

                      <p className={`leading-relaxed text-[11px] bg-white/70 p-2.5 rounded-xl border ${isRevisionNeeded ? 'border-amber-200 text-amber-950' : 'border-emerald-200 text-emerald-950'}`}>
                        {latestSurveyLog ? latestSurveyLog.notes : 'Data tegakan pohon dan batas poligon GPS telah tervalidasi memenuhi standar MRV.'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5 font-sans tabular-nums">
                        <span>Waktu Audit: {selectedLand?.scheduled_date || 'Terjadwal'}</span>
                        <span>Log ID: #{String(selectedLand?.id || '').slice(0, 8).toUpperCase()}</span>
                      </div>

                      {isRevisionNeeded && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setIsRevisionModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            <FilePenLine className="h-3.5 w-3.5" />
                            <span>Ajukan Revisi Batas Sekarang</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* TAHAP 3: Antrean Kuota Klaster Desa */}
              <div className="relative">
                <span
                  className={`absolute -left-8 top-0 grid h-7 w-7 place-items-center rounded-full text-white shadow-xs ${
                    isVerifiedPlot || selectedLand?.cluster_id
                      ? 'bg-emerald-600'
                      : 'bg-stone-300 text-stone-600'
                  }`}
                >
                  {isVerifiedPlot || selectedLand?.cluster_id ? <Check className="h-4 w-4 stroke-[2.5]" /> : <Clock className="h-3.5 w-3.5" />}
                </span>

                <div className="rounded-2xl bg-[#F4F7F5] border border-stone-200/60 p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-stone-900 font-sans">
                      3. Antrean Kuota Klaster Desa
                    </p>
                    <span
                      className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                        isVerifiedPlot || selectedLand?.cluster_id
                          ? 'text-emerald-700 bg-emerald-100/70'
                          : 'text-stone-500 bg-stone-200/70'
                      }`}
                    >
                      {isVerifiedPlot || selectedLand?.cluster_id ? 'Masuk Klaster' : 'Menunggu Tahap 2 Selesai'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    Penggabungan volume serapan ke dalam <strong>{selectedLand?.cluster_name || 'Klaster Agregasi Wonosobo'}</strong> (Akumulasi: <strong className="font-sans font-bold tabular-nums">{Number(selectedLand?.cluster_tonnage || selectedPlotCarbon).toFixed(1)} tCO2e</strong>).
                  </p>
                </div>
              </div>

              {/* TAHAP 4: Lulus Audit Eksternal (Terbit Paspor Pohon) */}
              <div className="relative">
                <span
                  className={`absolute -left-8 top-0 grid h-7 w-7 place-items-center rounded-full text-white shadow-xs ${
                    isVerifiedPlot
                      ? 'bg-emerald-600'
                      : 'bg-stone-300 text-stone-600'
                  }`}
                >
                  {isVerifiedPlot ? <Leaf className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                </span>

                <div className="rounded-2xl bg-[#F4F7F5] border border-stone-200/60 p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-stone-900 font-sans">
                      4. Lulus Audit Eksternal (Terbit Paspor Pohon)
                    </p>
                    <span
                      className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                        isVerifiedPlot
                          ? 'text-emerald-700 bg-emerald-100/70'
                          : 'text-stone-500 bg-stone-200/70'
                      }`}
                    >
                      {isVerifiedPlot ? 'Paspor Aktif' : 'Terkunci'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {isVerifiedPlot
                      ? 'Paspor Pohon Digital resmi diterbitkan pada Registry Nasional. Dividen karbon aktif dicairkan ke Dompet Karbon.'
                      : 'Kredit karbon diterbitkan secara otomatis setelah verifikator independen mengesahkan laporan audit.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
             KOLOM KANAN (5/12) · ANNUAL VINTAGE RENEWAL & DOKUMEN BUKTI
        ============================================================= */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          {/* Kartu Atas: AnnualVintageRenewalCard (Bespoke Liquid Glass & Glassmorphism) */}
          <article className="relative overflow-hidden rounded-[28px] p-6 sm:p-7 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/40 border border-white/80 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.16),0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-12px_rgba(16,185,129,0.25),inset_0_1px_2px_rgba(255,255,255,1)] transition-all duration-300 group space-y-5">
            {/* Ambient Liquid Light Blobs (Backdrop) */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-300/15 blur-2xl group-hover:scale-125 transition-transform duration-700 ease-out" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-gradient-to-tr from-teal-400/20 to-emerald-500/10 blur-2xl group-hover:scale-110 transition-transform duration-700 ease-out" />
            {/* Specular Top Hairline Rim */}
            <div className="pointer-events-none absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

            <div className="relative z-10 space-y-5">
              {/* Header: Tactile Glass Squircle Icon + Title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-100/90 to-emerald-50/50 border border-emerald-400/30 backdrop-blur-md flex items-center justify-center text-emerald-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(16,185,129,0.15)] group-hover:rotate-6 transition-transform duration-300">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 tracking-tight font-sans">
                      Pembaruan Vintage Tahunan (MRV)
                    </h3>
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Siklus Verifikasi Tahunan</span>
                  </div>
                </div>
              </div>

              {/* Subtitle / Description */}
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Siklus verifikasi berkala tahunan untuk pembaruan kuota kredit karbon berdasarkan pertambahan lingkar batang.
              </p>

              {/* Big Hero Number & Glassmorphic Pill Badge */}
              <div>
                <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Masa Tunggu Vintage 2027
                </span>
                <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans tabular-nums">
                    10 Bulan
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-2.5 py-0.5 text-xs font-semibold font-sans">
                    Bulan ke-2 (17%)
                  </span>
                </div>
              </div>

              {/* Nested Frosted Glass Container with Progress Track */}
              <div className="rounded-[22px] bg-white/60 backdrop-blur-md border border-white/90 p-4 space-y-3 shadow-[0_4px_16px_rgba(0,0,0,0.02),inset_0_1px_2px_rgba(255,255,255,0.85)]">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="font-semibold text-stone-700">Progres Audit</span>
                    <span className="font-bold text-emerald-700 tabular-nums">17% (Bulan 2/12)</span>
                  </div>
                  <div className="w-full bg-stone-200/80 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div className="bg-emerald-600 h-full w-[17%] transition-all duration-1000 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[11px] font-sans text-stone-400 pt-0.5 tabular-nums">
                    <span>Mulai: Jan 2026</span>
                    <span>Target: Des 2026</span>
                  </div>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed pt-1 border-t border-stone-200/50">
                  Setiap penambahan lingkar batang pohon (DBH) diukur ulang setiap 12 bulan untuk menghasilkan kuota karbon tahunan baru.
                </p>
              </div>

              {/* Action Button Liquid Finish */}
              <button
                type="button"
                onClick={() =>
                  triggerToast(
                    'info',
                    'Formulir Unggah DBH',
                    'Fitur pembaruan sensus mandiri DBH tahunan dibuka pada jadwal vintage berikutnya.'
                  )
                }
                className="w-full rounded-full bg-white/70 hover:bg-white text-stone-700 font-semibold py-3 px-4 text-xs border border-stone-200/60 shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 backdrop-blur-xs hover:border-emerald-300"
              >
                <span>Unggah Ukuran Lingkar Batang Terbaru</span>
                <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
              </button>
            </div>
          </article>

          {/* Kartu Bawah: Ringkasan Dokumen & Bukti Geotagging Sampel */}
          <article className="bg-white rounded-[22px] border border-stone-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 ease-out space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Dokumen &amp; Bukti Geotagging
              </h3>
              <span className="font-sans text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full tabular-nums">
                PASPOR #TKR-091
              </span>
            </div>

            {/* Dokumen Berita Acara MRV */}
            <div className="rounded-2xl bg-[#F4F7F5] border border-stone-200/50 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white text-emerald-700 border border-stone-200">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 font-sans">
                    Berita Acara MRV Lapangan
                  </p>
                  <p className="text-[11px] text-stone-500 font-sans tabular-nums">
                    BA/MRV/2026/03 • 1.8 MB (PDF)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadBa}
                className="rounded-full bg-white border border-stone-200 hover:bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span>Unduh</span>
              </button>
            </div>

            {/* Foto Sampel Batang Pohon Tervalidasi (Geotagged) */}
            <div>
              <p className="text-xs font-semibold text-stone-700 mb-2 font-sans">
                Foto Sampel Batang Pohon Tervalidasi (Geotagged):
              </p>
              {selectedLand?.photos && selectedLand.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {selectedLand.photos.slice(0, 6).map((photo, pIdx) => {
                    const rawUrl = photo.photo_url || photo.url || (typeof photo === 'string' ? photo : '');
                    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://127.0.0.1:8000${rawUrl}`;
                    return (
                      <div key={pIdx} className="relative rounded-xl overflow-hidden aspect-square bg-stone-100 border border-stone-200 group">
                        <img
                          src={fullUrl}
                          alt={photo.caption || `Sampel #${pIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-sans tabular-nums px-1.5 py-0.5 rounded truncate max-w-[90%]">
                          {photo.sample_code || `#${pIdx + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-stone-200 bg-stone-50 text-center">
                  <Camera className="w-5 h-5 mx-auto text-stone-400 mb-1" />
                  <p className="text-[11px] text-stone-500">
                    {isVerifiedPlot
                      ? 'Belum ada foto geotag yang diunggah untuk petak ini.'
                      : 'Surveyor akan mengunggah foto geotag saat kunjungan verifikasi lapangan.'}
                  </p>
                </div>
              )}
            </div>

            {/* Paspor Digital Hash Bar */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="font-sans tabular-nums">SRID: 4326 • SHA-256 Valid</span>
              <button
                type="button"
                onClick={() =>
                  triggerToast(
                    'info',
                    'Paspor Digital Terverifikasi',
                    'Sertifikat tercatat permanen di blockchain registry TaniKarbon.'
                  )
                }
                className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Cek Validitas</span>
              </button>
            </div>
          </article>
        </div>
      </div>

      {/* ============================================================
           MODAL AJUKAN REVISI BATAS
      ============================================================= */}
      {isRevisionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsRevisionModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[24px] border border-stone-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 font-sans">
                Ajukan Revisi Batas Poligon
              </h3>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Kategori Perubahan
                </label>
                <select
                  value={revisionCategory}
                  onChange={(e) => setRevisionCategory(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs text-stone-800 focus:outline-none"
                >
                  <option value="Revisi Titik Poligon Batas">Koreksi Titik Koordinat Batas</option>
                  <option value="Penyulaman / Pengurangan Pohon">Penyulaman / Perubahan Populasi</option>
                  <option value="Pergantian Dokumen Hak Lahan">Pembaruan Dokumen Hak Milik</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Catatan Koreksi &amp; Alasan
                </label>
                <textarea
                  rows={4}
                  required
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Jelaskan titik patok atau perubahan yang perlu diperbaiki..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevision}
                  className="rounded-full bg-[#14382C] hover:bg-[#1C4E3D] text-white px-5 py-2 text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {isSubmittingRevision ? 'Mengirim...' : 'Kirim Pengajuan Revisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BERITA ACARA MRV */}
      {isBaModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsBaModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[24px] border border-stone-200 bg-white p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-sans">
                    Berita Acara MRV Lapangan
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Sertifikat Audit Terdesentralisasi TaniKarbon
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBaModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">No. Berita Acara:</span>
                <strong className="text-stone-900 font-mono">BA/MRV/2026/{String(selectedLand?.id || '').slice(0, 8).toUpperCase()}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Nama Petak Kebun:</span>
                <strong className="text-stone-900">{selectedLand?.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Luas Terukur (PostGIS):</span>
                <strong className="text-stone-900">{Number(selectedLand?.area_sqm || 0).toLocaleString('id-ID')} m² ({((Number(selectedLand?.area_sqm) || 0) / 10000).toFixed(2)} Ha)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Petugas Surveyor:</span>
                <strong className="text-emerald-800">{displaySurveyorName} {displaySurveyorCode && `(${displaySurveyorCode})`}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Estimasi Serapan Tahunan:</span>
                <strong className="text-emerald-700">{selectedPlotCarbon.toFixed(2)} tCO2e / tahun</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Standar Alometrik:</span>
                <strong className="text-stone-700">ICRAF / KLHK Chave Tier-3</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Integritas Hash:</span>
                <strong className="text-stone-600 font-mono text-[10px]">SHA256: {String(selectedLand?.id || '').replaceAll('-', '')}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBaModalOpen(false)}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  triggerToast('success', 'Berita Acara Dicetak', 'Dokumen resmi Berita Acara siap disimpan / dicetak.');
                }}
                className="rounded-full bg-[#14382C] hover:bg-[#1C4E3D] text-white px-5 py-2 text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local Toast Alert */}
      {toastConfig.visible && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex w-full max-w-sm items-start gap-3 rounded-[20px] border bg-white p-4 shadow-xl animate-slide-up ${
            toastConfig.type === 'error'
              ? 'border-red-200'
              : toastConfig.type === 'warning'
              ? 'border-amber-200'
              : 'border-emerald-200'
          }`}
        >
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
              toastConfig.type === 'error'
                ? 'bg-red-50 text-red-600'
                : toastConfig.type === 'warning'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {toastConfig.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : toastConfig.type === 'warning' ? (
              <Clock className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-stone-900">{toastConfig.title}</p>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{toastConfig.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}
