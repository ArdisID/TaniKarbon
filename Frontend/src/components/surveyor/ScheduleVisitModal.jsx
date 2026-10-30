import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  MapPin, 
  Trees 
} from 'lucide-react';

export default function ScheduleVisitModal({ ticket, onClose, onScheduleSuccess, onToast }) {
  const [selectedDate, setSelectedDate] = useState('2026-10-27');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('Mohon siapkan pita meteran dan pastikan patok sudut lahan sudah terpasang.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!ticket) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onScheduleSuccess(ticket.id, selectedDate, selectedTime, notes);
      if (onToast) {
        onToast(`Jadwal verifikasi untuk ${ticket.farmerName} berhasil dikirim ke akun petani!`);
      }
      onClose();
    }, 450);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#14382C] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans font-semibold text-emerald-300 uppercase tracking-wider block">
                Penjadwalan Lapangan
              </span>
              <h3 className="text-sm font-bold text-white font-sans">
                Atur Jadwal Kunjungan Survei Fisik
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Target Ticket Context */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs font-sans">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#14382C] text-sm">{ticket.farmerName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 tabular-nums">
                {ticket.id}
              </span>
            </div>
            <p className="text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{ticket.landName} • Luas: {ticket.areaM2.toLocaleString('id-ID')} m²</span>
            </p>
            <p className="text-slate-600 flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Klaim Populasi: {ticket.treeCount} Pohon ({ticket.species})</span>
            </p>
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Tanggal Kunjungan
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Pukul (WIB)
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition cursor-pointer"
              >
                <option value="08:30">08:30 WIB (Pagi)</option>
                <option value="10:00">10:00 WIB (Pagi)</option>
                <option value="13:30">13:30 WIB (Siang)</option>
                <option value="15:30">15:30 WIB (Sore)</option>
              </select>
            </div>
          </div>

          {/* Notes for Farmer */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Catatan &amp; Arahan Persiapan untuk Petani
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition"
              placeholder="Contoh: Mohon hadir di lokasi kebun tepat waktu..."
            />
          </div>

          {/* Microcopy Integrasi Role Petani */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 font-sans">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Integrasi Otomatis:</strong> Mengirim jadwal ini akan otomatis memicu munculnya komponen peringatan kuning (<em>ActionAlertBanner</em>) di Dashboard HP milik {ticket.farmerName}.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Jadwal ke Petani'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
