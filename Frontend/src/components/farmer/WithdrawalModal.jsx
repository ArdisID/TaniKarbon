import React, { useState } from 'react';
import { X, Landmark, Smartphone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatRupiah } from '../../data';
import { withdrawFarmerBalance } from '../../api/farmer';

export default function WithdrawalModal({ availableBalance, onClose, onSuccess, onToast }) {
  const [method, setMethod] = useState('bri');
  const [accountNumber, setAccountNumber] = useState('0142-01-084821-50-8');
  const [accountHolder, setAccountHolder] = useState('JOKO WIDODO');
  const [amount, setAmount] = useState('50000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numericAmount = parseInt(amount || '0', 10);

  const paymentOptions = [
    { id: 'bri', name: 'Bank BRI (Rekomendasi Petani)', type: 'bank', defaultAcc: '0142-01-084821-50-8', badge: 'Bebas Biaya' },
    { id: 'bca', name: 'Bank BCA', type: 'bank', defaultAcc: '822-019-4821', badge: 'Bebas Biaya' },
    { id: 'mandiri', name: 'Bank Mandiri', type: 'bank', defaultAcc: '137-00-1928374-1', badge: 'Bebas Biaya' },
    { id: 'dana', name: 'DANA Dompet Digital', type: 'ewallet', defaultAcc: '0812-4921-7890', badge: 'Instan' },
    { id: 'gopay', name: 'GoPay Petani', type: 'ewallet', defaultAcc: '0812-4921-7890', badge: 'Instan' },
    { id: 'shopeepay', name: 'ShopeePay', type: 'ewallet', defaultAcc: '0812-4921-7890', badge: 'Instan' },
  ];

  const handleSelectMethod = (opt) => {
    setMethod(opt.id);
    setAccountNumber(opt.defaultAcc);
    setError('');
  };

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Anti-double-click guard

    if (numericAmount <= 0) {
      setError('Masukkan nominal penarikan yang valid.');
      return;
    }
    if (numericAmount > availableBalance) {
      setError(`Nominal melebihi saldo siap ditarik (${formatRupiah(availableBalance)}).`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const selectedOpt = paymentOptions.find(o => o.id === method) || paymentOptions[0];
      const bankName = selectedOpt.name.split(' (')[0];
      
      const res = await withdrawFarmerBalance({
        amount: numericAmount,
        bank_name: bankName,
        account_number: accountNumber
      });

      const newTransaction = {
        id: `WD-${Date.now().toString().slice(-6)}`,
        title: `Pencairan Saldo ke ${bankName}`,
        recipient: `${bankName} - ${accountNumber} (a.n. ${accountHolder})`,
        amount: numericAmount,
        date: 'Hari ini, baru saja',
        status: 'Dana Terkirim',
        statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        refNumber: `TRX-${Math.floor(10000000 + Math.random() * 90000000)}`
      };

      if (onSuccess) {
        onSuccess(numericAmount, newTransaction, res.remaining_balance);
      }
      if (onToast) {
        onToast(`Penarikan ${formatRupiah(numericAmount)} berhasil diproses! Sisa saldo: ${formatRupiah(res.remaining_balance)}`);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal memproses penarikan dana ke backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#14382C] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Pencairan Dividen Karbon</span>
              <h3 className="font-extrabold text-white text-base leading-tight">Tarik Saldo ke Rekening</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Balance info card */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-600 font-medium block">Saldo Siap Ditarik Saat Ini</span>
              <strong className="text-2xl font-black text-[#14382C]">{formatRupiah(availableBalance)}</strong>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300/60">
              Tanpa Potongan Admin
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Pilih Rekening Tujuan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {paymentOptions.map((opt) => {
                const isSelected = method === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectMethod(opt)}
                    className={`p-3 rounded-2xl text-left border transition flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/30'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        opt.type === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {opt.type === 'bank' ? <Landmark className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-stone-800 block truncate">{opt.name.split(' (')[0]}</span>
                        <span className="text-[10px] text-stone-400 block truncate">{opt.defaultAcc}</span>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">Nomor Rekening / HP</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">Nama Pemilik Rekening</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-bold text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Nominal Penarikan
              </label>
              <span className="text-[11px] text-stone-500">Maks. {formatRupiah(availableBalance)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                min="50000"
                max={availableBalance}
                step="50000"
                required
                className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                placeholder="0"
              />
            </div>

            {/* Quick nominal buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[500000, 1000000, 2000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  disabled={val > availableBalance}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-40 transition"
                >
                  {formatRupiah(val)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickAmount(availableBalance)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition"
              >
                Tarik Semua
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Guarantee pill */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-start gap-2 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              Dana ditransfer langsung dari rekening penampung bursa karbon IDXCarbon ke rekening petani mitra tanpa potongan perantara (88% utuh).
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0 || numericAmount > availableBalance}
              className="flex-2 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Memproses Transfer...' : `Konfirmasi Tarik ${numericAmount > 0 ? formatRupiah(numericAmount) : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
