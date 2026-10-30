import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon, 
  DollarSign, 
  Building, 
  CreditCard,
  Send,
  ShieldCheck
} from 'lucide-react';

export default function UploadTransferProofModal({ 
  withdrawal, 
  isOpen, 
  onClose, 
  onConfirmTransfer 
}) {
  if (!isOpen || !withdrawal) return null;

  const [referenceNumber, setReferenceNumber] = useState(
    `TRX-${Date.now().toString().slice(-6)}-BRI`
  );
  const [selectedProof, setSelectedProof] = useState(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onConfirmTransfer({
        withdrawalId: withdrawal.id,
        referenceNumber,
        proofUrl: selectedProof,
        confirmedAt: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-modal-pop">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider font-sans">
                Verifikasi Payout Petani
              </span>
              <h3 className="text-base font-bold text-white font-sans">
                Unggah Bukti Transfer Bank
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Detail Penerima */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-sans">Penerima Dana:</span>
              <span className="text-xs font-bold text-stone-900 font-sans">{withdrawal.farmerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-sans">Klaster Asal:</span>
              <span className="text-xs font-medium text-slate-700 font-sans">{withdrawal.clusterName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-sans">Rekening / E-Wallet:</span>
              <span className="text-xs font-semibold text-slate-800 font-sans">
                {withdrawal.channel} • <span className="font-sans font-semibold tabular-nums">{withdrawal.accountNumber}</span>
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 font-sans">Nominal Dicairkan:</span>
              <span className="text-base font-extrabold text-emerald-700 font-sans tabular-nums">
                Rp {withdrawal.amount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Nomor Referensi Transfer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
              Nomor Referensi Transaksi Bank
            </label>
            <input 
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#14382C] font-sans font-medium tabular-nums"
            />
          </div>

          {/* Bukti Transfer Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
              Struk Bukti Pengiriman Bank (Terhubung ke Dompet Petani)
            </label>
            <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-200">
                <img 
                  src={selectedProof} 
                  alt="Struk Transfer" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-stone-900 truncate font-sans">
                  Struk_Transfer_BRI_{withdrawal.id}.jpg
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  Ukuran: <span className="font-sans font-medium tabular-nums">420 KB</span> • Terlampir otomatis
                </p>
                <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-emerald-700 font-semibold font-sans">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Validasi Signature Bank Berhasil</span>
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer font-sans disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Transfer...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-200" />
                  <span>Konfirmasi Dana Terkirim</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
