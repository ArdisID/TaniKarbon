import React, { useState } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Trees, 
  Phone, 
  Clock, 
  ArrowRight, 
  Search, 
  Filter, 
  Layers, 
  Compass, 
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function SurveyorDashboardView({ 
  tickets = [], 
  onOpenScheduleModal, 
  onStartInspection, 
  onNavigateTab,
  onToast 
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'nearest' | 'unscheduled' | 'today'
  const [searchQuery, setSearchQuery] = useState('');

  // Default tickets if none passed
  const defaultTickets = [
    {
      id: 'TKT-WNSB-042',
      farmerName: 'Pak Joko Widodo',
      farmerPhone: '0812-3456-7890',
      landName: 'Lahan 1 - Pekarangan Garung',
      areaM2: 4520,
      treeCount: 100,
      species: 'Mangga Harumanis & Alpukat Mentega',
      distanceKm: 2.4,
      status: 'Menunggu Survei',
      scheduledDate: '27 Okt 2026',
      scheduledTime: '10:00 WIB',
      isToday: false,
      isScheduled: true,
      notes: 'Batas patok sudah ditandai bambu putih.'
    },
    {
      id: 'TKT-WNSB-043',
      farmerName: 'Pak Hendra Wijaya',
      farmerPhone: '0813-8821-4921',
      landName: 'Lahan 2 - Lereng Sindoro Utara',
      areaM2: 6800,
      treeCount: 140,
      species: 'Alpukat Mentega & Kopi Arabika',
      distanceKm: 1.2,
      status: 'Menunggu Survei',
      scheduledDate: '26 Okt 2026',
      scheduledTime: '13:30 WIB',
      isToday: true,
      isScheduled: true,
      notes: 'Jadwal survei fisik hari ini pukul 13:30.'
    },
    {
      id: 'TKT-WNSB-044',
      farmerName: 'Pak Slamet Riyadi',
      farmerPhone: '0857-9912-3341',
      landName: 'Kebun Sengon Blok Kidul',
      areaM2: 3200,
      treeCount: 80,
      species: 'Sengon Soloman',
      distanceKm: 3.5,
      status: 'Menunggu Survei',
      scheduledDate: '26 Okt 2026',
      scheduledTime: '09:00 WIB',
      isToday: true,
      isScheduled: true,
      notes: 'Akses masuk lewat jalan setapak dusun.'
    },
    {
      id: 'TKT-WNSB-045',
      farmerName: 'Bu Siti Aminah',
      farmerPhone: '0821-4455-6677',
      landName: 'Lahan Agroforestri Bawah',
      areaM2: 5100,
      treeCount: 110,
      species: 'Durian Montong & Alpukat',
      distanceKm: 4.8,
      status: 'Menunggu Survei',
      scheduledDate: null,
      scheduledTime: null,
      isToday: false,
      isScheduled: false,
      notes: 'Belum dijadwalkan kunjungan.'
    },
    {
      id: 'TKT-WNSB-046',
      farmerName: 'Pak Agus Santoso',
      farmerPhone: '0819-2233-4455',
      landName: 'Kebun Buah Puncak Dieng',
      areaM2: 3900,
      treeCount: 90,
      species: 'Alpukat & Mangga',
      distanceKm: 5.6,
      status: 'Menunggu Revisi Petani',
      scheduledDate: null,
      scheduledTime: null,
      isToday: false,
      isScheduled: false,
      notes: 'Foto pita ukur pohon #3 buram, diminta foto ulang.'
    },
    {
      id: 'TKT-WNSB-047',
      farmerName: 'Pak Mulyono',
      farmerPhone: '0878-1122-3344',
      landName: 'Lahan Konservasi Mata Air',
      areaM2: 7400,
      treeCount: 160,
      species: 'Beringin & Alpukat Mentega',
      distanceKm: 6.2,
      status: 'Menunggu Survei',
      scheduledDate: null,
      scheduledTime: null,
      isToday: false,
      isScheduled: false,
      notes: 'Belum dijadwalkan kunjungan.'
    }
  ];

  const queueList = tickets.length > 0 ? tickets : defaultTickets;

  // Filter logic
  const filteredList = queueList.filter((item) => {
    const matchesSearch = 
      item.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.landName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'today') return item.isToday;
    if (activeFilter === 'unscheduled') return !item.isScheduled;
    if (activeFilter === 'nearest') return item.distanceKm <= 3.0;
    return true;
  });

  const handleOpenWhatsApp = (phone, name) => {
    const text = encodeURIComponent(`Halo ${name}, saya Budi Santoso petugas verifikasi lapangan dari TaniKarbon.`);
    window.open(`https://wa.me/62${phone.replace(/[^0-9]/g, '').slice(1)}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      
      {/* A. SurveyorStatsGrid (4 Kartu Metrik Ringkas) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase">
              Tiket Menunggu Survei
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-sans text-[#14382C]">
              6 Kebun
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">
            Status: Menunggu Survei Lapangan
          </span>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase">
              Jadwal Kunjungan Hari Ini
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-sans text-blue-900">
              2 Kebun
            </span>
          </div>
          <span className="text-[11px] text-blue-600 font-sans mt-0.5 block font-medium">
            Pak Hendra &amp; Pak Slamet
          </span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase">
              Menunggu Revisi Petani
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-sans text-amber-900">
              1 Kebun
            </span>
          </div>
          <span className="text-[11px] text-amber-700 font-sans mt-0.5 block">
            Foto sampel buram / dikembalikan
          </span>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase">
              Total Lahan Tervalidasi
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-sans text-emerald-800">
              42 Kebun
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-sans mt-0.5 block font-medium">
            Disahkan ke Pre-Verified
          </span>
        </div>
      </div>

      {/* B. AssignedClusterReadinessCard (Progres Klaster Wilayah Tugas) */}
      <div className="bg-[#14382C] text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase">
                KLASTER WILAYAH PENUGASAN
              </span>
              <span className="text-xs text-emerald-200/80 font-sans">Kecamatan Garung, Wonosobo</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white font-sans tracking-tight">
              Klaster Agroforestri Desa Sukamaju / Garung — Wonosobo
            </h3>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-xs text-emerald-200/80 font-sans block">Kuota Terkumpul Saat Ini:</span>
            <div className="text-2xl sm:text-3xl font-black font-sans text-white">
              380 / 500 <span className="text-sm font-mono text-emerald-300 font-normal">tCO2e</span> <span className="text-emerald-400 text-lg font-bold">(76%)</span>
            </div>
          </div>
        </div>

        {/* Progress Bar (Hijau Zamrud 76%) */}
        <div className="mt-4 space-y-1.5">
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: '76%' }}
            />
          </div>
        </div>

        {/* Operational Motivation Banner */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/90 font-sans">
          <p className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              <strong>Target Klaster:</strong> Selesaikan 4 tiket survei lagi (± 120 tCO2e) di desa ini agar klaster mencapai batas minimum dan siap diajukan ke Auditor Eksternal!
            </span>
          </p>
        </div>
      </div>

      {/* C. SurveyTicketQueueList (Daftar Tiket Penugasan & Penjadwalan) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#14382C] text-base font-sans">
              Daftar Antrean Tiket Survei Lapangan
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Pilih kebun untuk dijadwalkan atau langsung buka navigasi peta lapangan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-sans">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                  activeFilter === 'all' ? 'bg-white text-[#14382C] shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({queueList.length})
              </button>
              <button
                onClick={() => setActiveFilter('today')}
                className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                  activeFilter === 'today' ? 'bg-white text-blue-800 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jadwal Hari Ini (2)
              </button>
              <button
                onClick={() => setActiveFilter('nearest')}
                className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                  activeFilter === 'nearest' ? 'bg-white text-emerald-800 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Terdekat (&le; 3 km)
              </button>
              <button
                onClick={() => setActiveFilter('unscheduled')}
                className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                  activeFilter === 'unscheduled' ? 'bg-white text-amber-800 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum Dijadwalkan
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama petani atau lahan..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition w-48 sm:w-56 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Ticket Cards Grid */}
        <div className="divide-y divide-slate-100">
          {filteredList.map((ticket) => (
            <div 
              key={ticket.id} 
              className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-sans"
            >
              {/* Left Context */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Trees className="w-5 h-5" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-stone-900 font-sans">
                      {ticket.farmerName}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {ticket.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{ticket.distanceKm} km dari lokasi Anda</span>
                    </span>
                    {ticket.isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Jadwal Hari Ini
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-700">
                    {ticket.landName} • <span className="font-sans text-slate-500">Luas: {ticket.areaM2.toLocaleString('id-ID')} m²</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span>Populasi: <strong className="text-stone-800">{ticket.treeCount} Pohon</strong> ({ticket.species})</span>
                    <span>•</span>
                    {ticket.isScheduled ? (
                      <span className="text-blue-700 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        Jadwal: {ticket.scheduledDate}, {ticket.scheduledTime}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">Belum ada jadwal survei</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                {/* WhatsApp button */}
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(ticket.farmerPhone, ticket.farmerName)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition cursor-pointer shadow-2xs"
                  title={`Hubungi ${ticket.farmerName} via WhatsApp`}
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                </button>

                {/* Schedule Modal button */}
                <button
                  type="button"
                  onClick={() => onOpenScheduleModal(ticket)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{ticket.isScheduled ? 'Ubah Jadwal' : 'Atur Jadwal'}</span>
                </button>

                {/* Inspect / Geofence button */}
                <button
                  type="button"
                  onClick={() => onStartInspection(ticket)}
                  className="px-4 py-2 rounded-xl bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buka Peta &amp; Check-In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
