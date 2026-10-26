import React, { useState } from 'react';
import { 
  Landmark, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Upload, 
  Download, 
  FileText, 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import UploadTransferProofModal from './UploadTransferProofModal';

export default function FinancialEscrowAndPayoutView({ onToast }) {
  const [selectedWithdrawalForTransfer, setSelectedWithdrawalForTransfer] = useState(null);
  const [activeFinanceTab, setActiveFinanceTab] = useState('split'); // 'split' | 'withdrawals' | 'deposits'

  // Escrow Batches Data
  const [escrowBatches, setEscrowBatches] = useState([
    {
      id: 'BATCH-TX-2026-081',
      clusterId: 'CLU-WNSB-001',
      clusterName: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      buyerName: 'PT Industri Hijau Nusantara (Tbk)',
      volume: 520, // tCO2e
      pricePerTon: 120000, // Rp 120.000
      grossRevenue: 62400000, // 520 * 120.000 = Rp 62.400.000
      costRecoveryCut: 15000000, // Hutang talangan audit
      platformTakeRate: 7110000, // 15% dari (62.400.000 - 15.000.000 = 47.400.000) = Rp 7.110.000
      netFarmerPool: 40290000, // Rp 40.290.000
      farmersCount: 48,
      status: 'pending_release', // 'pending_release' | 'released'
      timestamp: '25 Okt 2026, 14:20 WIB'
    },
    {
      id: 'BATCH-TX-2026-079',
      clusterId: 'CLU-DMK-003',
      clusterName: 'Klaster Sabuk Pesisir Demak (Mangrove Blue Carbon)',
      buyerName: 'PT Logistik Maritim Katulistiwa',
      volume: 350,
      pricePerTon: 160000,
      grossRevenue: 56000000,
      costRecoveryCut: 20000000,
      platformTakeRate: 5400000,
      netFarmerPool: 30600000,
      farmersCount: 82,
      status: 'released',
      timestamp: '23 Okt 2026, 11:05 WIB'
    }
  ]);

  // Farmer Withdrawals Queue Data
  const [farmerWithdrawals, setFarmerWithdrawals] = useState([
    {
      id: 'WD-FARM-901',
      farmerName: 'Pak Joko Widodo',
      clusterName: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      amount: 3250000,
      channel: 'Bank BRI',
      accountNumber: '0129-01-084729-50-1',
      accountHolder: 'Joko Widodo',
      date: 'Hari ini, 08:30 WIB',
      status: 'pending' // 'pending' | 'transferred'
    },
    {
      id: 'WD-FARM-902',
      farmerName: 'Pak Slamet Riyadi',
      clusterName: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      amount: 2840000,
      channel: 'Bank Mandiri',
      accountNumber: '137-00-1928471-2',
      accountHolder: 'Slamet Riyadi',
      date: 'Hari ini, 09:12 WIB',
      status: 'pending'
    },
    {
      id: 'WD-FARM-903',
      farmerName: 'Ibu Siti Maryam',
      clusterName: 'Klaster Sabuk Pesisir Demak',
      amount: 1950000,
      channel: 'GoPay',
      accountNumber: '0812-9847-1029',
      accountHolder: 'Siti Maryam',
      date: 'Kemarin, 16:40 WIB',
      status: 'pending'
    },
    {
      id: 'WD-FARM-904',
      farmerName: 'Pak Bambang Sutrisno',
      clusterName: 'Klaster Konservasi Lereng Sindoro',
      amount: 4120000,
      channel: 'Bank BCA',
      accountNumber: '892-0192831',
      accountHolder: 'Bambang Sutrisno',
      date: 'Kemarin, 14:10 WIB',
      status: 'transferred',
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      referenceNumber: 'TRX-837192-BCA'
    },
    {
      id: 'WD-FARM-905',
      farmerName: 'Pak Sutopo Harsono',
      clusterName: 'Klaster Kopi Agroforestri Dampit Malang',
      amount: 3800000,
      channel: 'Bank BRI',
      accountNumber: '0129-01-987261-53-4',
      accountHolder: 'Sutopo Harsono',
      date: '24 Okt 2026',
      status: 'transferred',
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      referenceNumber: 'TRX-918274-BRI'
    }
  ]);

  // Corporate Deposits Queue Data
  const [corporateDeposits, setCorporateDeposits] = useState([
    {
      id: 'DEP-CORP-101',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      companyCode: 'CORP-IHN-001',
      amount: 100000000, // Rp 100.000.000
      bankSource: 'Bank Mandiri Corporate Escrow',
      transferDate: 'Hari ini, 07:15 WIB',
      invoiceNumber: 'INV-TK-2026-X091',
      status: 'pending' // 'pending' | 'approved'
    },
    {
      id: 'DEP-CORP-102',
      companyName: 'PT Nusantara Pulp & Paper',
      companyCode: 'CORP-NPP-003',
      amount: 75000000,
      bankSource: 'Bank BCA KlikBCA Bisnis',
      transferDate: '24 Okt 2026, 17:00 WIB',
      invoiceNumber: 'INV-TK-2026-X088',
      status: 'approved'
    }
  ]);

  // Handler: Release Escrow to Farmer Wallet
  const handleReleaseEscrow = (batchId) => {
    setEscrowBatches(prev => prev.map(batch => {
      if (batch.id === batchId) {
        return { ...batch, status: 'released' };
      }
      return batch;
    }));

    if (onToast) {
      onToast(`Berhasil! Dana Batch ${batchId} sebesar Rp 40.290.000 telah dirilis dari Escrow ke Saldo Siap Tarik 48 Petani.`);
    }
  };

  // Handler: Confirm Farmer Withdrawal
  const handleConfirmTransfer = (data) => {
    setFarmerWithdrawals(prev => prev.map(wd => {
      if (wd.id === data.withdrawalId) {
        return {
          ...wd,
          status: 'transferred',
          referenceNumber: data.referenceNumber,
          proofUrl: data.proofUrl
        };
      }
      return wd;
    }));

    if (onToast) {
      onToast(`Transfer berhasil dikonfirmasi! Bukti transfer dilampirkan ke dompet petani (${data.referenceNumber}).`);
    }
  };

  // Handler: Approve Corporate Deposit
  const handleApproveDeposit = (depositId) => {
    setCorporateDeposits(prev => prev.map(dep => {
      if (dep.id === depositId) {
        return { ...dep, status: 'approved' };
      }
      return dep;
    }));

    if (onToast) {
      onToast(`Deposit korporat disetujui! Saldo B2B bertambah & Faktur Pajak resmi (PDF) diterbitkan.`);
    }
  };

  const pendingWithdrawalsCount = farmerWithdrawals.filter(w => w.status === 'pending').length;
  const pendingDepositsCount = corporateDeposits.filter(d => d.status === 'pending').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
              Brankas Keuangan Terdesentralisasi
            </span>
            <span className="text-xs text-slate-500 font-sans">
              Rekonsiliasi Escrow, Payout &amp; Deposit B2B
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1 font-sans">
            Brankas Keuangan, Escrow &amp; Payout
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-sans">
            Kelola pembagian hasil penjualan karbon secara matematis transparan, talangan audit (cost recovery), pencairan dana petani, dan verifikasi deposit korporat.
          </p>
        </div>

        {/* Quick Balance Metrics */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-[10px] text-slate-500 font-sans block">Total Saldo Escrow Tertahan</span>
            <span className="text-sm font-bold text-amber-700 font-mono">
              Rp 40.290.000
            </span>
          </div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-[10px] text-slate-500 font-sans block">Cost Recovery Reimbursed</span>
            <span className="text-sm font-bold text-emerald-700 font-mono">
              Rp 60.000.000
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveFinanceTab('split')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeFinanceTab === 'split'
              ? 'bg-[#14382C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Mesin Split-Payout &amp; Escrow Klaster</span>
        </button>

        <button
          onClick={() => setActiveFinanceTab('withdrawals')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeFinanceTab === 'withdrawals'
              ? 'bg-[#14382C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Antrean Penarikan Dana Petani ({pendingWithdrawalsCount} Pending)</span>
        </button>

        <button
          onClick={() => setActiveFinanceTab('deposits')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeFinanceTab === 'deposits'
              ? 'bg-[#14382C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Verifikasi Deposit B2B Korporat ({pendingDepositsCount} Menunggu)</span>
        </button>
      </div>

      {/* TAB 1: CLUSTER REVENUE SPLIT MONITOR */}
      {activeFinanceTab === 'split' && (
        <div className="space-y-6">
          
          {/* Transparency Formula Banner */}
          <div className="p-5 rounded-2xl bg-[#14382C] text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider font-sans">
                    Transparansi Formula Payout
                  </span>
                  <span className="text-xs text-emerald-200 font-sans">Aturan Pembagian Otomatis Kontrak Cerdas</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
                  <span className="text-[11px] text-emerald-200 block font-semibold mb-1 font-sans">
                    Rumus 1: Net Payout Pool Petani
                  </span>
                  <div className="font-mono text-xs text-white bg-black/20 p-2 rounded-lg border border-white/5">
                    NetPayoutPool = GrossRevenue - CostRecoveryAudit - PlatformTakeRate
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
                  <span className="text-[11px] text-emerald-200 block font-semibold mb-1 font-sans">
                    Rumus 2: Proporsi Payout Petani Individu
                  </span>
                  <div className="font-mono text-xs text-white bg-black/20 p-2 rounded-lg border border-white/5">
                    PayoutPetani_i = NetPayoutPool × (TonasePetani_i / TotalTonaseKlaster)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Transaksi List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900 font-sans">
                A. Rincian Eksekusi Split-Payout per Batch Transaksi Bursa
              </h2>
              <span className="text-xs text-slate-500 font-sans">
                Setiap kali korporat checkout atau tembak API Auto-Buy, dana ditampung di brankas escrow klaster
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {escrowBatches.map((batch) => (
                <div 
                  key={batch.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-4"
                >
                  {/* Top Bar of Batch */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {batch.id}
                      </span>
                      <span className="text-xs font-bold text-stone-900 font-sans">
                        {batch.clusterName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-sans">
                        Dibeli oleh: <strong className="text-slate-700 font-sans">{batch.buyerName}</strong>
                      </span>
                      {batch.status === 'pending_release' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 font-sans">
                          TERTAHAN DI ESCROW
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                          DANA TELAH DIRILIS KE PETANI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4 Pillars of Revenue Split */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    
                    {/* Gross Revenue */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-sans block">
                        1. Gross Revenue Korporat
                      </span>
                      <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                        Rp {batch.grossRevenue.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {batch.volume} tCO2e × Rp {batch.pricePerTon.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Cost Recovery Reimbursement */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-800 font-sans block">
                        2. Kas Cost Recovery Platform
                      </span>
                      <div className="text-base font-bold text-amber-900 font-mono mt-0.5">
                        - Rp {batch.costRecoveryCut.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[10px] text-amber-700 font-sans block mt-0.5">
                        Mengembalikan talangan audit
                      </span>
                    </div>

                    {/* Platform Take-Rate */}
                    <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
                      <span className="text-[10px] uppercase font-bold text-purple-800 font-sans block">
                        3. Kas Profit Platform (15%)
                      </span>
                      <div className="text-base font-bold text-purple-900 font-mono mt-0.5">
                        - Rp {batch.platformTakeRate.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[10px] text-purple-700 font-sans block mt-0.5">
                        Take-rate jasa platform
                      </span>
                    </div>

                    {/* Net Farmer Pool */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 font-sans block">
                        4. Hak Bersih Petani (Net Pool)
                      </span>
                      <div className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                        Rp {batch.netFarmerPool.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-sans block mt-0.5">
                        Dibagikan ke {batch.farmersCount} rekening mitra
                      </span>
                    </div>

                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Rilis ini otomatis mengirimkan rincian matematis ke accordion dompet petani mitra.</span>
                    </div>

                    {batch.status === 'pending_release' ? (
                      <button
                        onClick={() => handleReleaseEscrow(batch.id)}
                        className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer font-sans whitespace-nowrap"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>Rilis Dana dari Escrow ke Saldo Tersedia Petani</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Saldo Tersedia di Dompet Petani</span>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: FARMER WITHDRAWAL APPROVAL TABLE */}
      {activeFinanceTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 font-sans">
                B. Tabel Persetujuan Penarikan Dana Petani (FarmerWithdrawalApprovalTable)
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Permintaan pencairan yang diajukan petani melalui modal dompet mereka. Verifikasi transfer dan unggah struk bank untuk konfirmasi.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                    <th className="py-3 px-4">ID Penarikan</th>
                    <th className="py-3 px-4 min-w-[220px]">Nama Petani &amp; Klaster</th>
                    <th className="py-3 px-4 whitespace-nowrap">Nominal Pencairan</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tujuan Transfer</th>
                    <th className="py-3 px-4 whitespace-nowrap">Nomor Rekening</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {farmerWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-slate-50/60 transition font-sans">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {withdrawal.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{withdrawal.farmerName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{withdrawal.clusterName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        Rp {withdrawal.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{withdrawal.channel}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {withdrawal.accountNumber}
                        <div className="text-[10px] text-slate-400 font-sans">a.n. {withdrawal.accountHolder}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {withdrawal.status === 'pending' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 font-sans">
                            MENUNGGU TRANSFER
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                            DANA TERKIRIM
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {withdrawal.status === 'pending' ? (
                          <button
                            onClick={() => setSelectedWithdrawalForTransfer(withdrawal)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition flex items-center gap-1.5 ml-auto cursor-pointer font-sans"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah Bukti &amp; Kirim</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 justify-end text-slate-500">
                            <span className="text-[11px] font-mono">{withdrawal.referenceNumber}</span>
                            <a 
                              href={withdrawal.proofUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                              title="Lihat Struk Transfer"
                            >
                              <FileText className="w-4 h-4 text-emerald-700" />
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CORPORATE DEPOSIT APPROVAL TABLE */}
      {activeFinanceTab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 font-sans">
                C. Verifikasi Top-Up Deposit Korporat (CorporateDepositApprovalTable)
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Validasi transfer masuk dari perusahaan untuk mengisi saldo PreFundedDepositCard mereka dan terbitkan faktur resmi (Invoice PDF).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                    <th className="py-3 px-4">ID Deposit</th>
                    <th className="py-3 px-4 min-w-[220px]">Nama Perusahaan Pembeli</th>
                    <th className="py-3 px-4 whitespace-nowrap">Nominal Top-Up</th>
                    <th className="py-3 px-4 whitespace-nowrap">Bank Pengirim</th>
                    <th className="py-3 px-4 whitespace-nowrap">Waktu Transfer</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status Saldo</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Aksi Konfirmasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {corporateDeposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-slate-50/60 transition font-sans">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {deposit.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{deposit.companyName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{deposit.companyCode}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        Rp {deposit.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {deposit.bankSource}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {deposit.transferDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {deposit.status === 'pending' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 font-sans">
                            MENUNGGU VERIFIKASI
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                            SALDO AKTIF &amp; FAKTUR RESMI
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {deposit.status === 'pending' ? (
                          <button
                            onClick={() => handleApproveDeposit(deposit.id)}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#14382C] hover:bg-[#1E4D3D] rounded-xl shadow-xs transition flex items-center gap-1.5 ml-auto cursor-pointer font-sans"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Setujui Saldo &amp; Terbitkan Faktur Pajak (PDF)</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 justify-end text-emerald-700 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-[11px] font-mono">{deposit.invoiceNumber}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Transfer Proof */}
      {selectedWithdrawalForTransfer && (
        <UploadTransferProofModal
          withdrawal={selectedWithdrawalForTransfer}
          isOpen={Boolean(selectedWithdrawalForTransfer)}
          onClose={() => setSelectedWithdrawalForTransfer(null)}
          onConfirmTransfer={handleConfirmTransfer}
        />
      )}

    </div>
  );
}
