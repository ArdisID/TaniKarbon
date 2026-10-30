import React, { useState } from 'react';
import { 
  X, 
  Landmark, 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Check,
  ChevronDown,
  Info
} from 'lucide-react';
import { formatRupiah } from '../../data';
import { withdrawFarmerBalance } from '../../api/farmer';

export default function WithdrawalModal({ availableBalance = 0, onClose, onSuccess, onToast }) {
  // Pre-configured KYC Verified Accounts
  const defaultSavedAccounts = [
    {
      id: 'bri',
      name: 'Bank BRI',
      accountNumber: '0142-01-084821-50-8',
      accountHolder: 'JOKO WIDODO',
      type: 'bank',
      isPrimary: true,
      tag: 'Rekening Utama'
    },
    {
      id: 'gopay',
      name: 'GoPay Petani',
      accountNumber: '0812-4921-7890',
      accountHolder: 'JOKO WIDODO',
      type: 'ewallet',
      isPrimary: false,
      tag: 'E-Wallet'
    }
  ];

  const [selectedAccountId, setSelectedAccountId] = useState('bri');
  const [useCustomAccount, setUseCustomAccount] = useState(false);
  const [customBank, setCustomBank] = useState('Bank Mandiri');
  const [customNumber, setCustomNumber] = useState('');
  const [customHolder, setCustomHolder] = useState('JOKO WIDODO');

  const [amount, setAmount] = useState('500000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numericAmount = parseInt(amount || '0', 10);

  // Determine current active account details
  const activeAccount = defaultSavedAccounts.find(a => a.id === selectedAccountId) || defaultSavedAccounts[0];
  const finalBankName = useCustomAccount ? customBank : activeAccount.name;
  const finalAccountNumber = useCustomAccount ? customNumber : activeAccount.accountNumber;
  const finalAccountHolder = useCustomAccount ? customHolder : activeAccount.accountHolder;

  const handleQuickAmount = (val) => {
    setAmount(String(val));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (numericAmount <= 0) {
      setError('Masukkan nominal penarikan yang ingin dicairkan.');
      return;
    }
    if (numericAmount < 50000) {
      setError('Minimal penarikan saldo adalah Rp 50.000.');
      return;
    }
    if (numericAmount > availableBalance) {
      setError(`Nominal penarikan melebihi saldo siap ditarik (${formatRupiah(availableBalance)}).`);
      return;
    }
    if (useCustomAccount && !customNumber.trim()) {
      setError('Nomor rekening tujuan tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await withdrawFarmerBalance({
        amount: numericAmount,
        bank_name: finalBankName,
        account_number: finalAccountNumber
      });

      const newTransaction = {
        id: `WD-${Date.now().toString().slice(-6)}`,
        title: `Pencairan Saldo ke ${finalBankName}`,
        recipient: `${finalBankName} - ${finalAccountNumber} (a.n. ${finalAccountHolder})`,
        amount: numericAmount,
        transaction_type: 'debit_withdrawal',
        date: 'Hari ini, baru saja',
        status: 'completed',
        statusText: '• Berhasil Ditransfer',
        statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        refNumber: `TRX-${Math.floor(10000000 + Math.random() * 90000000)}`
      };

      if (onSuccess) {
        onSuccess(numericAmount, newTransaction, res?.remaining_balance ?? (availableBalance - numericAmount));
      }
      if (onToast) {
        onToast(`Penarikan ${formatRupiah(numericAmount)} ke ${finalBankName} berhasil diproses tanpa biaya admin.`);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal memproses penarikan saldo ke sistem perbankan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in isolate"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-[28px] sm:rounded-[26px] max-w-lg w-full border border-stone-100 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col font-sans animate-modal-pop"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal: Bersih & Minimalis */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                Tarik Saldo ke Rekening
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                Pencairan dividen karbon langsung tanpa potongan
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Kartu Saldo Tersedia */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Saldo Siap Ditarik
              </span>
              <span className="text-2xl font-extrabold text-stone-900 font-sans tracking-tight block mt-0.5 tabular-nums">
                {formatRupiah(availableBalance)}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/70">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Gratis Biaya Admin
              </span>
            </div>
          </div>

          {/* 2. Pilihan Rekening Tujuan (Minimalist Card List) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-stone-700">
              Pilih Rekening Tujuan Pencairan
            </label>

            <div className="space-y-2">
              {defaultSavedAccounts.map((acc) => {
                const isSelected = !useCustomAccount && selectedAccountId === acc.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setUseCustomAccount(false);
                      setSelectedAccountId(acc.id);
                      setError('');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/60 border-[#10B981] ring-1 ring-[#10B981]'
                        : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        acc.type === 'bank' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {acc.type === 'bank' ? <Landmark className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-stone-900">{acc.name}</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            {acc.tag}
                          </span>
                        </div>
                        <span className="font-sans font-medium text-xs text-stone-600 block mt-0.5 tabular-nums">
                          {acc.accountNumber} • a.n. {acc.accountHolder}
                        </span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-stone-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}

              {/* Opsi Rekening / E-Wallet Lain */}
              <div
                onClick={() => {
                  setUseCustomAccount(true);
                  setError('');
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  useCustomAccount
                    ? 'bg-emerald-50/60 border-[#10B981] ring-1 ring-[#10B981]'
                    : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900">Gunakan Rekening Bank Lain</span>
                      <span className="text-[11px] text-stone-500 block">BCA, Mandiri, BNI, Bank Jateng, DANA</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    useCustomAccount ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-stone-300'
                  }`}>
                    {useCustomAccount && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                {useCustomAccount && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">Nama Bank / E-Wallet</label>
                        <select
                          value={customBank}
                          onChange={(e) => setCustomBank(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Bank BCA">Bank BCA</option>
                          <option value="Bank Mandiri">Bank Mandiri</option>
                          <option value="Bank BNI">Bank BNI</option>
                          <option value="Bank Jateng">Bank Jateng</option>
                          <option value="DANA Dompet Digital">DANA</option>
                          <option value="ShopeePay">ShopeePay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">Nomor Rekening / HP</label>
                        <input
                          type="text"
                          required
                          value={customNumber}
                          onChange={(e) => setCustomNumber(e.target.value)}
                          placeholder="Nomor rekening"
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-sans font-bold text-stone-800 tabular-nums placeholder-stone-400 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Input Nominal Penarikan & Quick Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700">
                Nominal Penarikan
              </label>
              <span className="text-[11px] text-stone-500 font-medium font-sans tabular-nums">
                Maks: {formatRupiah(availableBalance)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans font-bold text-stone-400 text-base">
                Rp
              </span>
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
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 font-sans font-extrabold text-lg sm:text-xl tabular-nums focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                placeholder="500000"
              />
            </div>

            {/* Quick Chips: Ramah Jempol Petani */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[100000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  disabled={val > availableBalance}
                  className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                    numericAmount === val
                      ? 'bg-[#14382C] text-white border-[#14382C]'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000} Rb`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickAmount(availableBalance)}
                className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                  numericAmount === availableBalance && availableBalance > 0
                    ? 'bg-[#14382C] text-white border-[#14382C]'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Tarik Semua
              </button>
            </div>
          </div>

          {/* 4. Rincian Penerimaan Bersih */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-2 text-xs">
            <div className="flex items-center justify-between text-stone-600">
              <span>Nominal yang ditarik:</span>
              <span className="font-sans font-bold text-stone-800 tabular-nums">{formatRupiah(numericAmount || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Biaya transfer perbankan:</span>
              <span className="font-sans font-bold text-emerald-700 tabular-nums">Rp 0 (Gratis)</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between font-bold text-stone-900">
              <span>Total masuk rekening:</span>
              <span className="font-sans font-extrabold text-base text-emerald-700 tabular-nums">
                {formatRupiah(numericAmount || 0)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Jaminan Keamanan */}
          <div className="flex items-start gap-2 text-[11px] text-stone-500 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Pencairan disalurkan resmi dari kustodian penampung bursa karbon IDXCarbon langsung ke rekening atas nama Anda tanpa perantara.
            </span>
          </div>

          {/* Modal Footer / Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-3 px-5 rounded-full text-stone-600 hover:bg-stone-100 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0 || numericAmount > availableBalance}
              className="flex-1 py-3 px-6 rounded-full bg-[#14382C] hover:bg-[#1C4E3D] disabled:opacity-50 text-white font-semibold text-xs tracking-tight transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Memproses Transfer...</span>
                </>
              ) : (
                <>
                  <span>Tarik {numericAmount > 0 ? formatRupiah(numericAmount) : 'Saldo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

