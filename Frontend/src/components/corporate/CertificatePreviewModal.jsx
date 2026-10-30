import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Share2, 
  Printer, 
  QrCode, 
  CheckCircle2, 
  Building2, 
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function CertificatePreviewModal({ certificate, onClose, onToast }) {
  if (!certificate) return null;

  const handleCopyLink = () => {
    const url = `https://tanikarbon.id/verify/certificates/${certificate.uuid}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    if (onToast) onToast('Tautan verifikasi KLHK berhasil disalin ke clipboard.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden relative max-h-[94vh] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar Header */}
        <div className="bg-[#0F1E2E] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                Dokumen Resmi Pensiun Emisi (Berita Acara Pensiun)
              </span>
              <h3 className="font-extrabold text-white text-sm font-sans">
                Sertifikat Penurunan Emisi Indonesia (SPE-GRK)
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

        {/* Certificate Paper Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs bg-[#FAFDF9] font-sans">
          {/* Certificate Border Frame */}
          <div className="p-6 sm:p-8 bg-white border-2 border-[#0F1E2E] rounded-2xl shadow-sm relative space-y-5">
            {/* Header Stamp */}
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  REPUBLIK INDONESIA • SRN-PPI KLHK
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#0F1E2E] tracking-tight uppercase font-sans">
                Sertifikat Penebusan &amp; Pensiun Karbon
              </h2>
              <p className="font-sans text-xs text-slate-500 mt-1">
                Nomor Registri: <strong className="text-slate-900 tabular-nums">{certificate.uuid}</strong>
              </p>
            </div>

            {/* Entity Grant Statement */}
            <div className="text-center space-y-1.5 py-2">
              <p className="text-slate-500 text-xs font-sans">Dengan ini menerangkan secara sah bahwa entitas korporat:</p>
              <h3 className="text-base sm:text-lg font-black text-[#0F1E2E] uppercase tracking-wide font-sans">
                {certificate.companyName || 'PT Industri Hijau Nusantara (Tbk)'}
              </h3>
              <p className="font-sans text-xs text-slate-500 tabular-nums">
                Nomor Pokok Wajib Pajak (NPWP): 01.482.910.4-021.000 • Ticker IDX: IHN
              </p>
            </div>

            {/* Core Tonnage Box */}
            <div className="p-4 bg-sky-50/70 border border-sky-300 rounded-2xl text-center">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-sky-800 block">
                Total Volume Karbon Hangus Permanen (Status: RETIRED)
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0F1E2E] font-sans mt-1 tabular-nums">
                {certificate.quantity || 100} <span className="text-base font-bold text-sky-700">tCO2e</span>
              </div>
              <p className="text-[11px] text-sky-900 font-medium mt-1 font-sans">
                Terkunci Permanen untuk Laporan Emisi Tahun Buku: <strong className="tabular-nums">{certificate.vintage || '2026'}</strong>
              </p>
            </div>

            {/* Traceability Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-sans">Asal Klaster Petani:</span>
                <strong className="text-slate-800 font-sans font-bold block mt-0.5 truncate">
                  {certificate.clusterName || 'Klaster Dusun Garung - Wonosobo'}
                </strong>
                <span className="text-[10px] text-slate-500 font-sans">Jawa Tengah (920 mdpl)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-sans">Metode Eksekusi:</span>
                <strong className="text-slate-800 font-sans font-bold block mt-0.5">
                  {certificate.source || 'Manual Checkout (B2B)'}
                </strong>
                <span className="text-[10px] text-sky-700 font-sans">Hak 88% Petani Tersalurkan</span>
              </div>
            </div>

            {/* Digital Signatures & QR Code Section */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 p-1.5 bg-white border border-slate-300 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <QrCode className="w-12 h-12 text-[#0F1E2E]" />
                </div>
                <div>
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Validasi QR Code</span>
                  <strong className="text-xs text-[#0F1E2E] block font-sans">Pindai untuk Audit Publik</strong>
                  <span className="text-[11px] font-sans text-sky-700 break-all tabular-nums">/verify/certificates/{certificate.uuid}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block border-b-2 border-slate-400 pb-1 font-serif text-sm font-bold text-[#0F1E2E] italic">
                  Dr. Ir. R. Hendro Wicaksono, M.Sc.
                </div>
                <span className="text-[11px] text-slate-500 block font-sans mt-0.5">
                  Direktur Validasi Nilai Ekonomi Karbon KLHK
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Salin Tautan KLHK</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-[#0F1E2E] hover:bg-[#1E293B] text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Unduh Sertifikat (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onToast) onToast('Bundel audit tahunan (.ZIP) disiapkan untuk diunduh.');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Bundel (.ZIP)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
