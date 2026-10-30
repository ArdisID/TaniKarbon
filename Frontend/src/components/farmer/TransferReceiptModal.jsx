import React from 'react';
import { X, CheckCircle2, Landmark, Download, ShieldCheck, Printer, ArrowDownLeft } from 'lucide-react';
import { formatRupiah } from '../../data';

export default function TransferReceiptModal({ transaction, onClose }) {
  if (!transaction) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in isolate"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Receipt Header */}
        <div className="bg-[#14382C] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Struk Bukti Transfer Resmi</span>
              <h3 className="font-extrabold text-white text-sm">Kliring Bursa Karbon IDX</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Badge & Amount */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              <span>Dana Terkirim (Settled)</span>
            </span>
            <div className="text-stone-500 text-[11px] font-medium font-sans">Nominal Dividen Karbon Ditransfer</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14382C] font-sans mt-0.5 tracking-tight tabular-nums">
              {formatRupiah(transaction.amount)}
            </div>
            <div className="text-[10px] text-emerald-800 mt-1 font-semibold font-sans">
              Bebas Biaya Admin (Ditanggung Koperasi Gapoktan)
            </div>
          </div>

          {/* Details Card */}
          <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200/80 font-sans text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">ID Transaksi:</span>
              <strong className="text-stone-900 tabular-nums">{transaction.refNumber || transaction.id}</strong>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Waktu Transfer:</span>
              <span className="text-stone-800 tabular-nums">{transaction.date}</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Bank Penyalur:</span>
              <span className="text-stone-800 font-bold">Bank Rakyat Indonesia (BRI)</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Rekening Tujuan:</span>
              <span className="text-stone-800 font-bold tabular-nums">{transaction.recipient || '0142-01-084821-50-8'}</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Nama Penerima:</span>
              <span className="text-stone-800 font-bold">JOKO WIDODO</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Keterangan:</span>
              <span className="text-emerald-800 font-bold">Dividen Penjualan ESG Korporat</span>
            </div>
          </div>

          {/* Stempel Digital Admin */}
          <div className="p-3 bg-stone-50 rounded-xl border border-dashed border-stone-300 flex items-center justify-between text-[10px] text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Verifikasi Kasir Platform TaniKarbon: Disetujui Otomatis</span>
            </div>
            <span className="font-sans text-emerald-800 font-bold uppercase tracking-wider">LUNAS</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unduh Bukti (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
