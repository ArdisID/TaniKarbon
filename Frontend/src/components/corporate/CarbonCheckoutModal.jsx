import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Wallet, 
  Building2, 
  AlertCircle, 
  ArrowRight,
  Info
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function CarbonCheckoutModal({ 
  cluster, 
  depositBalance = 250000000, 
  onClose, 
  onSuccess, 
  onToast 
}) {
  const [quantity, setQuantity] = useState(50);
  const [smartMultiCluster, setSmartMultiCluster] = useState(true);
  const [targetEmissionYear, setTargetEmissionYear] = useState('2026');
  const [companyName, setCompanyName] = useState('PT Industri Hijau Nusantara (Tbk)');
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // 'wallet' | 'va'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pricePerTon = 160000;
  const numQty = parseInt(quantity || 0, 10);
  const totalCost = numQty * pricePerTon;
  const farmerShare = Math.round(totalCost * 0.88);
  const mrvReserve = totalCost - farmerShare;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numQty <= 0) {
      setError('Masukkan kuantitas penebusan yang valid.');
      return;
    }
    if (paymentMethod === 'wallet' && totalCost > depositBalance) {
      setError(`Saldo deposit (${formatRupiah(depositBalance)}) tidak mencukupi untuk transaksi ${formatRupiah(totalCost)}.`);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const uuid = `CERT-${targetEmissionYear}-TK-${Math.floor(1000 + Math.random() * 9000)}A`;
      const newPurchase = {
        uuid,
        clusterName: cluster?.name || 'Klaster Agroforestri Dusun Garung - Wonosobo',
        vintage: targetEmissionYear,
        quantity: numQty,
        totalCost,
        companyName,
        paymentMethod: paymentMethod === 'wallet' ? 'Pre-funded Wallet' : 'B2B Virtual Account',
        source: 'Manual Checkout',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      onSuccess(newPurchase);
      if (onToast) onToast(`Penebusan ${numQty} tCO2e berhasil diproses! Sertifikat ${uuid} telah terbit.`);
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F1E2E] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Checkout Penebusan Emisi</span>
              <h3 className="font-extrabold text-white text-base leading-tight">
                Pembelian Karbon (Fractional Buying)
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Target Cluster Pill */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Klaster Terpilih</span>
              <strong className="text-[#0F1E2E] text-xs font-bold block font-sans">
                {cluster?.name || 'Klaster Agroforestri Dusun Garung - Wonosobo'}
              </strong>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-sans text-xs font-semibold bg-sky-100 text-sky-800 tabular-nums">
              Rp 160.000 / tCO2e
            </span>
          </div>

          {/* Input Kuantitas Fleksibel (tCO2e) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                Volume Penebusan (Fractional Buying)
              </label>
              <span className="font-sans text-xs text-slate-500 tabular-nums">Maks. Tersedia: 380 tCO2e</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="1000"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-sans font-extrabold text-[#0F1E2E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F1E2E] tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-sans text-xs font-semibold text-slate-400">
                Ton CO2e
              </span>
            </div>

            {/* Quick chips */}
            <div className="flex gap-1.5 mt-2">
              {[25, 50, 100, 250, 300].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuantity(val)}
                  className="px-2.5 py-1 text-xs font-sans font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer tabular-nums"
                >
                  {val} Ton
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox Smart Multi-Cluster Fill */}
          <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="multiCluster"
              checked={smartMultiCluster}
              onChange={(e) => setSmartMultiCluster(e.target.checked)}
              className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
            />
            <label htmlFor="multiCluster" className="text-[11px] text-emerald-950 leading-relaxed cursor-pointer">
              <strong>Smart Multi-Cluster Fill:</strong> Ambil sisa kekurangan kuota secara otomatis dari klaster terdekat di Jawa Tengah jika kuota klaster utama tidak mencukupi volume pesanan.
            </label>
          </div>

          {/* Dropdown Wajib Tahun Buku Peruntukan & Nama Entitas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tahun Buku Peruntukan (Lock)
              </label>
              <select
                value={targetEmissionYear}
                onChange={(e) => setTargetEmissionYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs font-semibold text-[#0F1E2E] focus:outline-none focus:ring-2 focus:ring-[#0F1E2E]"
              >
                <option value="2026">Laporan Emisi Tahun Buku 2026</option>
                <option value="2027">Laporan Emisi Tahun Buku 2027</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Entitas Tercetak di BAP
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F1E2E] focus:outline-none focus:ring-2 focus:ring-[#0F1E2E]"
              />
            </div>
          </div>

          {/* Pilihan Metode Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-sans">
              Metode Pembayaran B2B
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3 rounded-2xl text-left border transition flex items-center justify-between cursor-pointer ${
                  paymentMethod === 'wallet'
                    ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-600/30'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0F1E2E] block font-sans">Pre-funded Deposit</span>
                    <span className="text-xs font-sans text-sky-700 tabular-nums">Sisa: {formatRupiah(depositBalance)}</span>
                  </div>
                </div>
                {paymentMethod === 'wallet' && <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('va')}
                className={`p-3 rounded-2xl text-left border transition flex items-center justify-between cursor-pointer ${
                  paymentMethod === 'va'
                    ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-600/30'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block font-sans">Virtual Account B2B</span>
                    <span className="text-[10px] text-slate-500 font-sans">Bank Mandiri / BRI</span>
                  </div>
                </div>
                {paymentMethod === 'va' && <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Investment Calculation Breakdown */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-sans">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-sans">Kalkulasi Volume:</span>
              <span className="font-sans font-bold text-slate-800 tabular-nums">{numQty} Ton × Rp 160.000</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-sky-800 font-semibold font-sans">Hak Petani Langsung (88%):</span>
              <span className="font-sans font-bold text-sky-800 tabular-nums">{formatRupiah(farmerShare)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-sans">Alokasi MRV &amp; Subsidi Audit (12%):</span>
              <span className="font-sans font-medium text-slate-600 tabular-nums">{formatRupiah(mrvReserve)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <strong className="text-xs text-slate-800 uppercase tracking-wider font-sans">Total Pembayaran:</strong>
              <strong className="text-base font-extrabold text-[#0F1E2E] font-sans tabular-nums">
                {formatRupiah(totalCost)}
              </strong>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
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
              disabled={isSubmitting || numQty <= 0}
              className="flex-2 py-3 bg-[#0F1E2E] hover:bg-[#1E293B] text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Memproses Penebusan...' : `Pensiunkan ${numQty} tCO2e & Terbitkan Sertifikat`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
