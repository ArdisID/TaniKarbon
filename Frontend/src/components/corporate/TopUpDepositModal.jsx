import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  CheckCircle2, 
  Copy, 
  Upload, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function TopUpDepositModal({ onClose, onTopUpSuccess, onToast }) {
  const [bank, setBank] = useState('mandiri');
  const [nominal, setNominal] = useState('50000000');
  const [copiedVa, setCopiedVa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vaNumbers = {
    mandiri: '8871-0812-4921-9921',
    bri: '0142-9901-8841-2091',
    bca: '7001-2026-9941-8812'
  };

  const handleCopyVa = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(vaNumbers[bank]);
    }
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
    if (onToast) onToast('Nomor Virtual Account Korporat berhasil disalin.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(nominal || '0', 10);
    if (val <= 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onTopUpSuccess(val, bank);
      if (onToast) onToast(`Top-up ${formatRupiah(val)} berhasil didepositkan ke akun korporat.`);
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F1E2E] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-sky-300">Pre-Funded Wallet</span>
              <h3 className="font-extrabold text-white text-base leading-tight">Top-Up Deposit Korporat B2B</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Select Bank VA */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Virtual Account Bank
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mandiri', name: 'Bank Mandiri', label: 'Mandiri B2B' },
                { id: 'bri', name: 'Bank BRI', label: 'BRI Corporate' },
                { id: 'bca', name: 'Bank BCA', label: 'BCA Virtual' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBank(opt.id)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    bank === opt.id
                      ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold ring-2 ring-sky-600/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* VA Display Box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-1">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Nomor Rekening Virtual Account (Otomatis Kliring)
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-base sm:text-lg font-bold font-sans text-sky-300 tabular-nums">
                {vaNumbers[bank]}
              </span>
              <button
                type="button"
                onClick={handleCopyVa}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans font-medium transition flex items-center gap-1 cursor-pointer"
              >
                {copiedVa ? <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedVa ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              a.n. TaniKarbon ESCROW - PT Industri Hijau Nusantara (Tbk)
            </p>
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nominal Top-Up Deposit
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
              <input
                type="number"
                step="10000000"
                min="10000000"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-sans font-extrabold text-lg text-[#0F1E2E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] tabular-nums"
              />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[25000000, 50000000, 100000000, 250000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setNominal(val.toString())}
                  className="px-2.5 py-1 text-xs font-sans font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer tabular-nums"
                >
                  {formatRupiah(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Bukti Transfer (Opsional B2B) */}
          <div className="p-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-1 bg-slate-50/50">
            <Upload className="w-5 h-5 text-slate-400 mx-auto" />
            <span className="text-xs font-bold text-slate-700 block">Unggah Bukti Transfer Bank (Opsional)</span>
            <span className="text-[10px] text-slate-400 block">Sistem kliring VA memproses deposit otomatis dalam 60 detik.</span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 py-3 bg-[#0F1E2E] hover:bg-[#1E293B] text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Memverifikasi Setoran...' : `Konfirmasi Top-Up ${formatRupiah(parseInt(nominal || 0))}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
