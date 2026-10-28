import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import { 
  X, 
  ShieldCheck, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Trees, 
  Download, 
  Users, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function ClusterDetailDrawer({ cluster, onClose, onBuyClick }) {
  if (!cluster) return null;

  // 88% Direct Farmer Payout transparency distribution data
  const pieData = [
    { name: 'Hak Bersih Petani (Direct Payout)', value: 88, color: '#10B981' },
    { name: 'Reimburse Subsidi Audit', value: 6, color: '#F59E0B' },
    { name: 'Biaya Platform & Satelit MRV', value: 6, color: '#14382C' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto border-l border-slate-200 p-5 sm:p-7 space-y-6 animate-slide-in-right flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  {cluster.id || 'CLU-WNSB-001'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Vintage {cluster.vintage || '2026'}</span>
              </div>
              <h2 className="text-lg font-black text-[#14382C] mt-1">
                {cluster.name}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>{cluster.location || 'Dusun Garung, Kejajar, Wonosobo, Jawa Tengah'}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Satellite Map & Cadastral Polygons Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Peta Poligon Kebun Petani Binaan
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                NDVI 0.88 (Sentinel-2)
              </span>
            </div>
            <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
              <img
                src="/hero-agroforest.jpg"
                alt="Poligon Kebun Petani"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
              {/* Highlight Pin for Pak Joko */}
              <div className="absolute top-4 left-4 bg-[#14382C]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/20 text-xs font-mono">
                <span className="text-emerald-300 font-bold">● Petak Pak Joko (#TK-WNSB-042)</span>
                <span className="block text-[10px] text-slate-300">1.2 Ha Pekarangan • Alpukat &amp; Sengon</span>
              </div>
            </div>
          </div>

          {/* Cluster Core Metrics */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold block font-mono">Total Petani</span>
              <strong className="text-[#14382C] text-sm font-black block mt-0.5">
                {cluster.farmers || 185} Petani
              </strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold block font-mono">Luas Total</span>
              <strong className="text-[#14382C] text-sm font-black block mt-0.5">
                {cluster.hectares || 240} Hektare
              </strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold block font-mono">Stok Tersedia</span>
              <strong className="text-emerald-700 text-sm font-black block mt-0.5 font-mono">
                {cluster.availableQuota || 380} tCO2e
              </strong>
            </div>
          </div>

          {/* PayoutTransparencyPie (Recharts Donut Chart) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Diagram Transparansi Distribusi Dana (PayoutTransparencyPie)
              </span>
              <span className="text-[10px] font-mono text-emerald-800 font-bold">88% Anti-Calo</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={45}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-1.5 text-xs">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <strong className="font-mono text-slate-800 text-xs shrink-0">{item.value}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dokumen Bukti Audit & Laporan Alometrik Chave Tier-3 */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Dokumen Audit Resmi KLHK (Tier-3 Chave et al.)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 font-bold">Terverifikasi</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Klaster telah divalidasi oleh verifikator independen dan citra optik multispektral satelit Sentinel-2. Memenuhi persyaratan SRN-PPI untuk pelaporan POJK 51.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([`Laporan Audit KLHK Klaster ${cluster.name}\nNo: 2026/AUD/WNSB-042\nStatus: Terverifikasi Satelit Sentinel-2 Tier-3`], { type: 'application/pdf' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `BAP-AUDIT-${cluster.id || 'WNSB'}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-emerald-800 font-bold text-[11px] hover:bg-emerald-50 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Laporan Audit (PDF)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Checkout Trigger */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block font-mono">Harga Tetap Platform</span>
            <strong className="text-base font-black text-[#14382C] font-mono">
              Rp 160.000 <span className="text-xs text-slate-500 font-normal">/ tCO2e</span>
            </strong>
          </div>
          <button
            onClick={() => onBuyClick(cluster)}
            className="px-5 py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
          >
            <span>Beli Kredit Karbon Klaster Ini</span>
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
