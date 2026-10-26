import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Image, 
  FileText, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function ClusterNameEditorModal({ cluster, onClose, onSave, onToast }) {
  const [clusterName, setClusterName] = useState(cluster?.name || 'Klaster Agroforestri Dusun Garung - Wonosobo');
  const [description, setDescription] = useState(cluster?.description || 'Klaster perkebunan rakyat berbasis agroforestri alpukat mentega dan kopi arabika di lereng Dieng, menjaga resapan air hulu dan mensejahterakan 48 petani lokal.');
  const [coverPhoto, setCoverPhoto] = useState(cluster?.coverPhoto || '/hero-landscape.png');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!cluster) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSave(cluster.id, {
        name: clusterName,
        description,
        coverPhoto
      });
      if (onToast) onToast(`Profil klaster "${clusterName}" berhasil diperbarui untuk Marketplace B2B!`);
      onClose();
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-sans"
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
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans font-semibold text-emerald-300 uppercase tracking-wider block">
                EDITOR GEOSPASIAL KLASTER
              </span>
              <h3 className="text-sm font-bold text-white font-sans">
                Edit Identitas &amp; Narasi Publik Klaster
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
          {/* Reverse Geocode Context */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-sans space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">ID Klaster PostGIS:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[#14382C] text-sm">{cluster.id}</span>
              <span className="font-mono text-slate-500 text-[11px]">{cluster.centroid ? `${cluster.centroid[0]}, ${cluster.centroid[1]}` : '-7.3639, 109.9886'}</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Reverse Geocoding Awal: <em>{cluster.rawName || 'Klaster Agro - Kec. Kejajar / Garung'}</em>
            </p>
          </div>

          {/* Form Fields */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Nama Resmi Klaster (Tampil di Katalog Korporat):
            </label>
            <input
              type="text"
              value={clusterName}
              onChange={(e) => setClusterName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-sans font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Narasi Dampak Sosial &amp; Konservasi Desa (ESG Investor Narrative):
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition"
              placeholder="Jelaskan dampak sosial, spesies pohon, dan komunitas petani..."
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Pilihan Foto Sampul Klaster:
            </label>
            <select
              value={coverPhoto}
              onChange={(e) => setCoverPhoto(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#14382C] focus:bg-white transition cursor-pointer"
            >
              <option value="/hero-landscape.png">Panorama Hutan Agroforestri Wonosobo (Default)</option>
              <option value="/hero-agroforest.jpg">Lansekap Perkebunan Rakyat Lereng Sindoro</option>
              <option value="/mangrove-hero.jpg">Konservasi Mangrove Sabuk Pesisir</option>
            </select>
          </div>

          {/* Actions */}
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
              className="flex-1 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Klaster'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
