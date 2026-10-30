import React from 'react';
import { 
  FileText, 
  X, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  User, 
  Trees, 
  ShieldCheck, 
  Scale, 
  Phone
} from 'lucide-react';

export default function BeritaAcaraModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const isVerified = 
    data.isVerified ?? 
    (String(data.decision || data.status || '').toLowerCase().includes('verif') || 
     String(data.decision || data.status || '').toLowerCase().includes('disahkan') ||
     String(data.decision || data.status || '').toLowerCase() === 'approved');

  const isRejected = 
    String(data.decision || data.status || '').toLowerCase().includes('tolak') || 
    String(data.decision || data.status || '').toLowerCase() === 'rejected';

  const ticketCode = data.ticketId || (data.id ? `TKT-${String(data.id).slice(0, 8).toUpperCase()}` : 'TKT-MRV-001');
  const docNumber = `BA-MRV/${ticketCode}/${new Date().getFullYear()}`;
  const farmerName = data.farmerName || data.farmer_name || 'Petani Mitra';
  const landName = data.landName || data.name || 'Petak Agroforestri';
  const areaSqm = Number(data.areaSqm || data.area_sqm || data.areaM2 || 0);
  const areaHa = (areaSqm / 10000).toFixed(2);
  const surveyorName = data.surveyorName || data.surveyor_name || 'SRV-09 · Budi Surveyor';
  const auditDate = data.checkInTime || data.scheduledDate || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const gpsCoord = data.gpsCoord || (data.lat && data.lng ? `${Number(data.lat).toFixed(4)}, ${Number(data.lng).toFixed(4)}` : '-6.3686, 106.8331');
  const treeBlocks = data.treeBlocks || data.tree_blocks || [];
  const treeCount = data.treeCount || treeBlocks.reduce((acc, b) => acc + (b.total_population || b.tree_count || 0), 0);
  const notes = data.notes || (data.surveyLogs?.[0]?.notes) || (data.survey_logs?.[0]?.notes) || (isVerified ? 'Telah memenuhi standar alometrik dan verifikasi geofencing spasial lapangan.' : 'Tidak memenuhi kualifikasi batas atau tutupan vegetasi.');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F291E]/70 backdrop-blur-xs animate-fade-in font-sans">
      <div 
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col font-sans print:shadow-none print:border-none print:max-h-full print:w-full animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0F291E] text-base leading-tight">
                Berita Acara Verifikasi Lapangan
              </h3>
              <p className="text-[11px] font-sans font-medium text-slate-500 tabular-nums">{docNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              title="Cetak Berita Acara"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Cetak Dokumen</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Tutup Berita Acara"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Document Sheet */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 text-xs sm:text-sm">
          {/* Document Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#0F291E] text-lg tracking-tight">TANIKARBON MRV</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-900 font-sans">
                  OFFICIAL AUDIT REPORT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sistem Registri &amp; Verifikasi Kredit Karbon Berbasis Agroforestri
              </p>
            </div>

            {/* Status Stamp */}
            <div className="self-start sm:self-center">
              {isVerified ? (
                <div className="px-3.5 py-1.5 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>TERVERIFIKASI &amp; DISAHKAN</span>
                </div>
              ) : isRejected ? (
                <div className="px-3.5 py-1.5 rounded-xl border-2 border-rose-600 bg-rose-50 text-rose-800 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs font-sans">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>AUDIT DITOLAK</span>
                </div>
              ) : (
                <div className="px-3.5 py-1.5 rounded-xl border-2 border-amber-600 bg-amber-50 text-amber-800 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs font-sans">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>MENUNGGU REVISI</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-sans">
                NOMOR TIKET &amp; DOKUMEN
              </span>
              <p className="font-sans font-bold text-slate-900 text-sm mt-0.5 tabular-nums">{ticketCode}</p>
              <p className="font-sans text-[11px] font-medium text-slate-500 tabular-nums">{docNumber}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-sans">
                WAKTU &amp; TANGGAL AUDIT
              </span>
              <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{auditDate}</span>
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-sans">
                DATA PETANI / PEMILIK
              </span>
              <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{farmerName}</span>
              </p>
              {data.farmerPhone && (
                <p className="font-sans font-medium text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 tabular-nums">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{data.farmerPhone}</span>
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-sans">
                AUDITOR / PETUGAS SURVEYOR
              </span>
              <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{surveyorName}</span>
              </p>
            </div>
          </div>

          {/* Spatial & Land Data */}
          <div>
            <h4 className="font-bold text-[#0F291E] text-xs uppercase tracking-wider mb-2 font-sans flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Data Spasial &amp; Geofencing Lahan
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border border-slate-200 rounded-xl p-3 bg-white">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">NAMA PETAK</span>
                <span className="font-bold text-slate-800">{landName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">LUAS LAHAN</span>
                <span className="font-sans font-bold text-slate-800 tabular-nums">
                  {areaSqm.toLocaleString()} m² ({areaHa} Ha)
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-sans">SENTROID GPS</span>
                <span className="font-sans text-emerald-700 font-semibold tabular-nums">{gpsCoord}</span>
              </div>
            </div>
          </div>

          {/* Tree & Allometric Table */}
          <div>
            <h4 className="font-bold text-[#0F291E] text-xs uppercase tracking-wider mb-2 font-sans flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-emerald-600" /> Rekapitulasi Blok Tegakan Pohon
            </h4>
            {treeBlocks.length === 0 ? (
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-xs font-sans">
                Populasi terdata: <strong className="text-slate-800 tabular-nums">{treeCount} pohon</strong>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2">Spesies Pohon</th>
                      <th className="px-3.5 py-2 text-right">Populasi</th>
                      <th className="px-3.5 py-2 text-right">Rata² DBH</th>
                      <th className="px-3.5 py-2 text-right">Tinggi</th>
                      <th className="px-3.5 py-2 text-right">Potensi Serapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans tabular-nums">
                    {treeBlocks.map((block, i) => (
                      <tr key={block.id || i} className="hover:bg-slate-50/50">
                        <td className="px-3.5 py-2 font-sans font-semibold text-slate-800">
                          {block.species_name || 'Pohon Agroforestri'}
                        </td>
                        <td className="px-3.5 py-2 text-right text-slate-700">
                          {block.total_population || block.tree_count || 0} btg
                        </td>
                        <td className="px-3.5 py-2 text-right text-slate-700">
                          {block.avg_dbh_cm || 25} cm
                        </td>
                        <td className="px-3.5 py-2 text-right text-slate-700">
                          {block.avg_height_m || 12} m
                        </td>
                        <td className="px-3.5 py-2 text-right font-bold text-emerald-700">
                          {block.estimated_tco2e_per_year ? `${block.estimated_tco2e_per_year} tCO2e/thn` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes & Audit Logs */}
          <div>
            <h4 className="font-bold text-[#0F291E] text-xs uppercase tracking-wider mb-2 font-sans flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-600" /> Catatan Resmi Berita Acara &amp; Audit Log
            </h4>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed font-sans italic">
                "{notes}"
              </p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                <span>Status Konsensus: Validated via Ledger</span>
                <span className="tabular-nums">TaniKarbon MRV Engine v2.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-end gap-2.5 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#0F291E] hover:bg-[#173D2E] text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup Dokumen
          </button>
        </div>
      </div>
    </div>
  );
}

