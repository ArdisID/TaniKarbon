import React, { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowRight, 
  X, 
  Trees, 
  Sparkles, 
  Clock, 
  FileCheck2, 
  Camera 
} from 'lucide-react';

export default function AnnualReverificationView({ onToast }) {
  const [selectedTicketForModal, setSelectedTicketForModal] = useState(null);

  // List of annual vintage renewal tickets
  const renewalTickets = [
    {
      id: 'VIN-2027-TK-001',
      farmerName: 'Petani Mitra Mandiri',
      landName: 'Kebun Sengon Pertama',
      species: 'Sengon Laut',
      treeCount: 95,
      oldVintage: '2026',
      newVintage: '2027',
      oldGirthCm: 40,
      newGirthCm: 46,
      girthDelta: '+6 cm',
      status: 'Menunggu Desk Review',
      submissionDate: '24 Okt 2026',
      photoCanopyUrl: '/canopy-comparison.jpg'
    },
    {
      id: 'VIN-2027-TK-002',
      farmerName: 'Kelompok Tani Lestari',
      landName: 'Lahan Pohon Mangrove',
      species: 'Rhizophora mucronata',
      treeCount: 140,
      oldVintage: '2026',
      newVintage: '2027',
      oldGirthCm: 35,
      newGirthCm: 40,
      girthDelta: '+5 cm',
      status: 'Menunggu Desk Review',
      submissionDate: '22 Okt 2026',
      photoCanopyUrl: '/canopy-comparison.jpg'
    },
    {
      id: 'VIN-2027-TK-003',
      farmerName: 'Karno Sudiro',
      landName: 'Lahan 4 Karno',
      species: 'Sengon Solomon',
      treeCount: 80,
      oldVintage: '2026',
      newVintage: '2027',
      oldGirthCm: 48,
      newGirthCm: 55,
      girthDelta: '+7 cm',
      status: 'Menunggu Desk Review',
      submissionDate: '19 Okt 2026',
      photoCanopyUrl: '/canopy-comparison.jpg'
    }
  ];

  const handleApproveDeskReview = (item) => {
    if (onToast) {
      onToast(`Pembaruan Vintage 2027 untuk ${item.farmerName} berhasil disetujui via Desk Review! Kuota baru telah terbit.`);
    }
    setSelectedTicketForModal(null);
  };

  const handleScheduleRandomAudit = (item) => {
    if (onToast) {
      onToast(`Jadwal verifikasi fisik acak untuk ${item.farmerName} berhasil ditambahkan ke antrean.`);
    }
    setSelectedTicketForModal(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 font-sans">
      
      {/* Header Context */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
              SIKLUS TAHUNAN (MRV TAHAP-2)
            </span>
            <span className="text-xs text-slate-500 font-sans">Pembaruan Kuota Tahunan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1 font-sans">
            Validasi Perpanjangan Vintage (Annual Reverification)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Validasi klaim pertambahan ukuran pohon tahun berjalan dari petani yang sudah aktif di tahun sebelumnya.
          </p>
        </div>
      </div>

      {/* Ticket List (VintageRenewalTicketList) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-[#14382C] text-base font-sans">
            Daftar Tiket Pembaruan Vintage Masuk ({renewalTickets.length})
          </h3>
          <span className="text-xs text-slate-500 font-sans">Siklus Pertumbuhan Biologis</span>
        </div>

        <div className="divide-y divide-slate-100">
          {renewalTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="p-5 hover:bg-slate-50/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-sans"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-stone-900 font-sans">
                      {ticket.farmerName}
                    </span>
                    <span className="font-sans text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                      {ticket.id}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span>{ticket.oldVintage}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-600 inline" />
                      <span>{ticket.newVintage}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    {ticket.landName} • {ticket.treeCount} Pohon ({ticket.species})
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span>Pertumbuhan: Lingkar {ticket.oldGirthCm} cm</span>
                      <ArrowRight className="w-3 h-3 text-emerald-600 inline" />
                      <strong>{ticket.newGirthCm} cm</strong> (<span className="text-emerald-700 font-bold">{ticket.girthDelta}</span>)
                    </span>
                    <span>•</span>
                    <span>Diajukan: {ticket.submissionDate}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setSelectedTicketForModal(ticket)}
                className="px-4 py-2.5 rounded-xl bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-end lg:self-auto cursor-pointer"
              >
                <span>Buka Komparasi Pertumbuhan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* GrowthComparisonModal */}
      {selectedTicketForModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
          onClick={() => setSelectedTicketForModal(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#14382C] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-sans font-semibold text-emerald-300 uppercase tracking-wider block">
                    Audit Biologis Pohon
                  </span>
                  <h3 className="text-sm font-bold text-white font-sans">
                    Komparasi Pertumbuhan Vintage ({selectedTicketForModal.farmerName})
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTicketForModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto font-sans">
              
              {/* Side-by-side growth metric card */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
                <span className="text-[10px] font-sans font-bold uppercase text-emerald-800 tracking-wider block">
                  ANALISIS LAJU PERTUMBUHAN TAHUNAN
                </span>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tahun Lalu ({selectedTicketForModal.oldVintage})</span>
                    <strong className="text-xl font-sans font-bold text-stone-800 mt-1 block tabular-nums">
                      Lingkar {selectedTicketForModal.oldGirthCm} cm
                    </strong>
                    <span className="text-[10px] text-slate-400">Terverifikasi Surveyor Budi</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Tahun Berjalan ({selectedTicketForModal.newVintage})</span>
                    <strong className="text-xl font-sans font-extrabold text-emerald-800 mt-1 block tabular-nums">
                      Lingkar {selectedTicketForModal.newGirthCm} cm
                    </strong>
                    <span className="text-[10px] text-emerald-600 font-semibold font-sans">
                      {selectedTicketForModal.girthDelta} (Pertumbuhan Wajar)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-600 leading-relaxed font-sans">
                  <strong>Indikator Agronomi:</strong> Pertambahan lingkar batang sebesar <strong>+6 cm / tahun</strong> berada dalam rentang wajar pertumbuhan vegetatif spesies <em>Mangga Harumanis</em> usia 5 tahun di tanah vulkanik Dieng.
                </div>
              </div>

              {/* Photo Canopy Evidence Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-semibold text-emerald-400">Bukti Foto Kanopi &amp; Meteran Petani</span>
                  <Camera className="w-4 h-4 text-slate-400" />
                </div>
                <div className="h-32 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 text-xs text-slate-400 font-sans">
                  [Pratinjau Foto Kanopi Satelit Sentinel-2 &amp; Pita Ukur Petani Terverifikasi]
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleScheduleRandomAudit(selectedTicketForModal)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                >
                  Jadwalkan Kunjungan Sampel Acak
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveDeskReview(selectedTicketForModal)}
                  className="flex-1 py-3 bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Setujui Desk Review Jarak Jauh</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
