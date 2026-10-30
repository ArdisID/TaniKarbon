import React, { useState } from 'react';
import { 
  X, 
  Award, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Layers, 
  Building, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

export default function AuditApprovalAndMintingModal({ 
  cluster, 
  isOpen, 
  onClose, 
  onConfirmMint 
}) {
  if (!isOpen || !cluster) return null;

  const [auditorName, setAuditorName] = useState('PT Sucofindo (Persero) - Unit SBU Sertifikasi');
  const [auditRefNumber, setAuditRefNumber] = useState(`AUD-2026-SCF-${cluster.id || 'WNSB'}-098`);
  const [vintageYear, setVintageYear] = useState('2026');
  const [auditCostAdvance, setAuditCostAdvance] = useState(15000000); // Rp 15.000.000
  const [approvedQuota, setApprovedQuota] = useState(cluster.currentQuota || 510);
  const [uploadedFile, setUploadedFile] = useState({
    name: `Laporan_Audit_Eksternal_${cluster.id || 'CLU'}_2026_Final.pdf`,
    size: '4.8 MB',
    uploadedAt: 'Hari ini, 09:15 WIB'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onConfirmMint({
        clusterId: cluster.id,
        auditorName,
        auditRefNumber,
        vintageYear,
        auditCostAdvance,
        approvedQuota,
        fileName: uploadedFile?.name
      });
      setIsSubmitting(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-modal-pop">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-start justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/25 text-white uppercase tracking-wider font-sans">
                  Registry Authority
                </span>
                <span className="text-xs text-amber-100 font-sans font-semibold tabular-nums">
                  {cluster.id}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5 font-sans">
                Pengesahan Audit &amp; Penerbitan Kuota Bursa
              </h3>
              <p className="text-xs text-amber-100/90 font-sans mt-0.5">
                {cluster.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Informational Callout */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-950 leading-relaxed font-sans">
              Pengesahan ini otomatis meluluskan <strong>Verification Stepper Tahap 4 (Verified)</strong> untuk seluruh petani di klaster ini dan memunculkan kuota karbon aktif secara langsung di <strong>Marketplace Korporat (B2B ESG)</strong>.
            </p>
          </div>

          {/* 1. AuditReportPdfUploader & Auditor Details */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
              1. Dokumen Laporan &amp; Lembaga Auditor Independen
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 font-sans">
                  Lembaga Auditor Terakreditasi KLHK
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input 
                    type="text"
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    required
                    placeholder="PT Sucofindo / Mutuagung Lestari"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 font-sans">
                  Nomor Referensi Sertifikat Audit
                </label>
                <input 
                  type="text"
                  value={auditRefNumber}
                  onChange={(e) => setAuditRefNumber(e.target.value)}
                  required
                  placeholder="AUD-2026-SUCOFINDO-0891"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans font-medium tabular-nums"
                />
              </div>
            </div>

            {/* Mock PDF Uploader Box */}
            <div className="p-3.5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50/70 transition flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-900 font-sans">
                      {uploadedFile.name}
                    </p>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 font-sans">
                      SIAP VERIFIKASI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Ukuran: <span className="font-sans font-medium tabular-nums">{uploadedFile.size}</span> • Diunggah: {uploadedFile.uploadedAt}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUploadedFile({
                  name: `BAP-AUDIT-${cluster.id || 'KLHK'}-FINAL.pdf`,
                  size: '4.8 MB',
                  uploadedAt: 'Baru saja'
                })}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition cursor-pointer font-sans"
              >
                Ganti File
              </button>
            </div>
          </div>

          {/* 2. Vintage Year & Approved Quota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            
            {/* Vintage Year Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 font-sans">
                2. Tahun Produksi Karbon (Vintage)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={vintageYear}
                  onChange={(e) => setVintageYear(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans font-semibold text-slate-800 bg-white tabular-nums"
                >
                  <option value="2026">Vintage 2026 (Siklus Berjalan)</option>
                  <option value="2025">Vintage 2025 (Retroaktif)</option>
                  <option value="2027">Vintage 2027 (Proyeksi)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-1">
                Mengunci periode sertifikasi tahunan klaster.
              </p>
            </div>

            {/* Approved Carbon Quota */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 font-sans">
                3. Kuota Disahkan Auditor (tCO2e)
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="number"
                  step="1"
                  min="100"
                  value={approvedQuota}
                  onChange={(e) => setApprovedQuota(Number(e.target.value))}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans font-bold text-amber-950 bg-amber-50/30 tabular-nums"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-1">
                Pre-Verified: <span className="font-sans font-semibold tabular-nums">{cluster.currentQuota} tCO2e</span> (Batas min: 500)
              </p>
            </div>
          </div>

          {/* 3. AuditCostAdvanceInput (Dana Talangan Audit) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2 font-sans">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider font-sans">
                4. Biaya Talangan Audit Eksternal (Cost Recovery)
              </label>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 font-sans">
                Ditalangi Platform di Muka
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500 font-sans">
                Rp
              </div>
              <input
                type="number"
                step="500000"
                value={auditCostAdvance}
                onChange={(e) => setAuditCostAdvance(Number(e.target.value))}
                required
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans font-bold text-stone-900 tabular-nums"
              />
            </div>
            
            <p className="text-[11px] text-amber-900/90 font-sans leading-relaxed">
              Nominal ini disimpan di database klaster sebagai <strong>Beban Cost Recovery</strong> yang akan dipotong otomatis dan proporsional saat kredit karbon terjual ke perusahaan sebelum bagi hasil petani dibagikan.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer font-sans"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer font-sans disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Penerbitan Bursa...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Sahkan Klaster &amp; Terbitkan ke Bursa</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
