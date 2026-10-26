import React from 'react';
import { X, ShieldCheck, MapPin, Calendar, Ruler, Award, CheckCircle2, Info } from 'lucide-react';

export default function SamplePhotoModal({ tree, onClose }) {
  if (!tree) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#14382C] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Foto Sampel Terverifikasi</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">Tier-3 KLHK</span>
              </div>
              <h3 className="font-extrabold text-white text-base leading-tight mt-0.5">
                {tree.species || 'Pohon Terdata'} (#{tree.id || 'TK-SMP-01'})
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Photo with Verification Stamp */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 shadow-inner group">
            <img 
              src={tree.samplePhoto || "/tree-dbh-sample.jpg"} 
              alt="Foto pengukuran lingkar batang pohon dengan meteran kain" 
              className="w-full h-64 sm:h-72 object-cover object-center"
            />
            {/* Real Forestry Watermark Overlay */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>DBH: {tree.dbh || 38} cm @ Dada 130 cm</span>
            </div>
            <div className="absolute bottom-3 right-3 bg-[#14382C]/90 backdrop-blur-md text-emerald-200 text-[10px] font-sans px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Geotag Valid &amp; Tersertifikasi</span>
            </div>
          </div>

          {/* Biometric Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Lingkar Batang</span>
              <strong className="text-[#14382C] text-sm font-bold">{tree.dbh || 38} cm</strong>
              <span className="text-[10px] text-stone-500 block">Diameter: {((tree.dbh || 38) / 3.14159).toFixed(1)} cm</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Umur Tanam</span>
              <strong className="text-[#14382C] text-sm font-bold">{tree.age || 7} Tahun</strong>
              <span className="text-[10px] text-stone-500 block">Ditanam: {2026 - (tree.age || 7)}</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Serapan Karbon</span>
              <strong className="text-emerald-700 text-sm font-bold">{tree.co2PerYear || 0.40} tCO2e/thn</strong>
              <span className="text-[10px] text-stone-500 block">Model Chave et al.</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Estimasi Nilai</span>
              <strong className="text-[#14382C] text-sm font-bold">Rp {((tree.co2PerYear || 0.4) * 160000).toLocaleString('id-ID')}</strong>
              <span className="text-[10px] text-stone-500 block">/ tahun per pohon</span>
            </div>
          </div>

          {/* Audit Verification Log */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
              <Award className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Verifikasi Surveyor Lapangan Gapoktan Garung</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Foto batang pohon diambil tegak lurus dengan meteran kain terkalibrasi di ketinggian 130 cm dari permukaan tanah (Breast Height). Terkalibrasi dengan pantauan citra satelit Sentinel-2 pada indeks NDVI 0.88.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-emerald-700 font-mono">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> -7.3639, 109.9886</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> 14 Oktober 2026</span>
              <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> Elevasi: 920 mdpl</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-sm"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
}
