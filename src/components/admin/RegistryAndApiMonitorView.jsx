import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  ExternalLink, 
  Activity, 
  CheckCircle2, 
  Copy, 
  Check, 
  QrCode, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  Filter, 
  Terminal, 
  ArrowUpRight,
  Server,
  Zap,
  Globe,
  Clock,
  X
} from 'lucide-react';

export default function RegistryAndApiMonitorView({ onToast }) {
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'api'
  const [copiedId, setCopiedId] = useState(null);
  const [selectedCertificateModal, setSelectedCertificateModal] = useState(null);
  const [isSimulatingPing, setIsSimulatingPing] = useState(false);

  // Retired Certificates Ledger
  const [certificates, setCertificates] = useState([
    {
      uuid: 'TK-2026-RET-8921-WNSB',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      companyCode: 'CORP-IHN-001',
      emissionPeriod: 'FY 2025 Scope 1 & 2',
      clusterOrigin: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      vintage: '2026',
      volume: 350,
      executionMethod: 'ERP Auto-Buy', // 'ERP Auto-Buy' | 'Manual Checkout'
      retiredAt: '25 Okt 2026, 14:20 WIB',
      srnPpiReg: 'SRN-PPI-ID-837491-2026',
      auditor: 'PT Sucofindo'
    },
    {
      uuid: 'TK-2026-RET-7740-DMK',
      companyName: 'PT Logistik Maritim Katulistiwa',
      companyCode: 'CORP-LMK-002',
      emissionPeriod: 'Q3 2026 Scope 3 Cargo',
      clusterOrigin: 'Klaster Sabuk Pesisir Demak (Mangrove)',
      vintage: '2026',
      volume: 200,
      executionMethod: 'Manual Checkout',
      retiredAt: '23 Okt 2026, 11:05 WIB',
      srnPpiReg: 'SRN-PPI-ID-781920-2026',
      auditor: 'PT Sucofindo'
    },
    {
      uuid: 'TK-2026-RET-6102-MLG',
      companyName: 'PT Nusantara Pulp & Paper',
      companyCode: 'CORP-NPP-003',
      emissionPeriod: 'Tahunan 2025 Mandatori',
      clusterOrigin: 'Klaster Kopi Agroforestri Dampit Malang',
      vintage: '2025',
      volume: 1200,
      executionMethod: 'ERP Auto-Buy',
      retiredAt: '18 Okt 2026, 09:30 WIB',
      srnPpiReg: 'SRN-PPI-ID-601928-2025',
      auditor: 'SGS Indonesia'
    },
    {
      uuid: 'TK-2026-RET-5519-SNDR',
      companyName: 'PT Petrochemical Mandiri Sejahtera',
      companyCode: 'CORP-PMS-004',
      emissionPeriod: 'Semester 1 2026',
      clusterOrigin: 'Klaster Konservasi Lereng Sindoro Utara',
      vintage: '2026',
      volume: 500,
      executionMethod: 'Manual Checkout',
      retiredAt: '10 Okt 2026, 16:45 WIB',
      srnPpiReg: 'SRN-PPI-ID-549102-2026',
      auditor: 'PT Mutuagung Lestari'
    }
  ]);

  // Live API Traffic Logs
  const [apiLogs, setApiLogs] = useState([
    {
      id: 'LOG-9921',
      endpoint: 'POST /api/v1/offset/auto-buy',
      source: 'SAP ERP - PT Industri Hijau Nusantara',
      method: 'POST',
      statusCode: 200,
      responseTime: '24ms',
      payload: '{"tonnage": 50, "cluster_id": "CLU-WNSB-001", "idempotency_key": "idemp_8921"}',
      responseSummary: 'Quota deducted: 50 tCO2e, Deposit cut: Rp 6.000.000',
      timestamp: 'Baru saja'
    },
    {
      id: 'LOG-9920',
      endpoint: 'GET /api/v1/certificates/TK-2026-RET-8921-WNSB',
      source: 'QR Scanner - KLHK Auditor Portal',
      method: 'GET',
      statusCode: 200,
      responseTime: '18ms',
      payload: 'Query param: { verify_signature: true }',
      responseSummary: 'Public certificate verified: RETIRED',
      timestamp: '1 menit lalu'
    },
    {
      id: 'LOG-9919',
      endpoint: 'POST /api/v1/offset/auto-buy',
      source: 'NetSuite ERP - PT Nusantara Pulp & Paper',
      method: 'POST',
      statusCode: 200,
      responseTime: '28ms',
      payload: '{"tonnage": 100, "cluster_id": "CLU-MLG-004", "idempotency_key": "idemp_7712"}',
      responseSummary: 'Quota deducted: 100 tCO2e, Deposit cut: Rp 12.000.000',
      timestamp: '3 menit lalu'
    },
    {
      id: 'LOG-9918',
      endpoint: 'GET /api/v1/clusters/active',
      source: 'IDXCarbon Integration Gateway',
      method: 'GET',
      statusCode: 200,
      responseTime: '32ms',
      payload: 'Query param: { status: "verified" }',
      responseSummary: 'Returned 4 active audited clusters',
      timestamp: '5 menit lalu'
    }
  ]);

  // Copy to clipboard helper
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    if (onToast) onToast(`UUID ${text} disalin ke clipboard!`);
  };

  // Simulate ERP Webhook Ping / Auto-Buy
  const handleSimulateWebhookPing = () => {
    setIsSimulatingPing(true);
    
    setTimeout(() => {
      const newLog = {
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        endpoint: 'POST /api/v1/offset/auto-buy',
        source: 'Simulated SAP ERP Webhook (Live Test)',
        method: 'POST',
        statusCode: 200,
        responseTime: '24ms',
        payload: '{"tonnage": 25, "cluster_id": "CLU-WNSB-001", "execution_mode": "instant_settlement"}',
        responseSummary: 'Quota deducted: 25 tCO2e, Deposit cut: Rp 3.000.000, Status: 200 OK',
        timestamp: 'Baru saja'
      };

      setApiLogs(prev => [newLog, ...prev]);
      setIsSimulatingPing(false);

      if (onToast) {
        onToast('Live Ping ERP Berhasil! Payload 25 tCO2e dieksekusi dengan latency 24ms (200 OK).');
      }
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Registri Otoritas Publik &amp; Integrasi B2B
            </span>
            <span className="text-xs text-slate-500 font-sans">
              Interoperabilitas REST API &amp; Webhook ERP
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1 font-sans">
            Registri Sertifikat &amp; Monitor API
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-sans">
            Buku besar nasional seluruh sertifikat kredit karbon berstatus RETIRED (Hangus) serta monitor real-time lalu lintas API / webhook otomatisasi offset ERP korporat (UINIC 8.0).
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-[10px] text-slate-500 font-sans block leading-none">Gateway API</span>
              <span className="text-xs font-bold text-stone-900 font-mono">200 OK (24ms)</span>
            </div>
          </div>

          <button
            onClick={handleSimulateWebhookPing}
            disabled={isSimulatingPing}
            className="px-4 py-2.5 text-xs font-bold text-white bg-[#14382C] hover:bg-[#1E4D3D] rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer font-sans shrink-0 disabled:opacity-50"
          >
            {isSimulatingPing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memanggil Webhook...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Simulasi Test Webhook / Ping ERP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('registry')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'registry'
              ? 'bg-[#14382C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-400" />
          <span>Buku Besar Sertifikat Pensiun ({certificates.length} Terbit)</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'api'
              ? 'bg-[#14382C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Monitor Lalu Lintas API &amp; Webhook Global ({apiLogs.length} Log)</span>
        </button>
      </div>

      {/* TAB 1: GLOBAL CERTIFICATE REGISTRY TABLE */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900 font-sans">
                A. Buku Besar Registri Sertifikat Pensiun (GlobalCertificateRegistryTable)
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Daftar permanen kredit karbon yang telah dibeli dan dihanguskan (RETIRED) demi mencegah klaim ganda (anti-double counting).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                    <th className="py-3 px-4">UUID Sertifikat</th>
                    <th className="py-3 px-4 min-w-[220px]">Perusahaan Pembeli &amp; Periode</th>
                    <th className="py-3 px-4 whitespace-nowrap">Klaster Penyuplai &amp; Vintage</th>
                    <th className="py-3 px-4 whitespace-nowrap">Volume Hangus</th>
                    <th className="py-3 px-4 whitespace-nowrap">Metode Eksekusi</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Aksi Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {certificates.map((cert) => (
                    <tr key={cert.uuid} className="hover:bg-slate-50/60 transition font-sans">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-stone-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {cert.uuid}
                          </span>
                          <button
                            onClick={() => handleCopy(cert.uuid)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
                            title="Salin UUID"
                          >
                            {copiedId === cert.uuid ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{cert.companyName}</div>
                        <div className="text-[11px] text-slate-500">{cert.emissionPeriod}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{cert.clusterOrigin}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Vintage {cert.vintage} • {cert.auditor}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {cert.volume.toLocaleString('id-ID')} tCO2e
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                          cert.executionMethod === 'ERP Auto-Buy'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {cert.executionMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-emerald-300 font-mono">
                          RETIRED (HANGUS)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedCertificateModal(cert)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition inline-flex items-center gap-1.5 ml-auto cursor-pointer font-sans"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-600" />
                          <span>Validasi Publik QR</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL API TRAFFIC MONITOR */}
      {activeTab === 'api' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900 font-sans">
                B. Monitor Lalu Lintas API &amp; Webhook Global (GlobalApiTrafficMonitor)
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Panggilan API real-time dari ERP perusahaan pembeli dan verifikasi sertifikat QR oleh auditor KLHK (refetchInterval: 3000ms).
              </p>
            </div>
          </div>

          <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white font-sans">Live API Stream Console</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  LISTENING ON PORT 443
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-sans">
                Active Client Endpoints: 2
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {apiLogs.map((log) => (
                <div 
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {log.statusCode} OK
                      </span>
                      <span className="font-bold text-slate-200">{log.endpoint}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Latency: <strong className="text-emerald-400 font-mono">{log.responseTime}</strong></span>
                      <span>• {log.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-sans">
                    Sumber: <span className="text-slate-300 font-medium">{log.source}</span>
                  </div>

                  <div className="p-2 rounded bg-black/40 text-[11px] text-slate-300 border border-slate-800/80">
                    <div><span className="text-slate-500">Payload:</span> {log.payload}</div>
                    <div><span className="text-emerald-500">Output:</span> {log.responseSummary}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL VALIDASI PUBLIK QR CODE */}
      {selectedCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 bg-[#14382C] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-sans">
                    Validasi Publik SRN-PPI &amp; TaniKarbon
                  </span>
                  <h3 className="text-base font-bold text-white font-sans">
                    Sertifikat Pensiun Emisi Resmi
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCertificateModal(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              {/* QR Mockup */}
              <div className="inline-block p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-emerald-300">
                <div className="w-40 h-40 bg-white rounded-xl shadow-xs p-2 flex flex-col items-center justify-center mx-auto">
                  <QrCode className="w-32 h-32 text-slate-900" />
                </div>
                <span className="text-[11px] font-mono text-slate-500 mt-2 block">
                  Scan URL: /verify/certificates/{selectedCertificateModal.uuid}
                </span>
              </div>

              {/* Certificate Details */}
              <div className="text-left p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">UUID Sertifikat:</span>
                  <span className="font-mono font-bold text-stone-900">{selectedCertificateModal.uuid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Perusahaan Pemilik:</span>
                  <span className="font-bold text-stone-900 font-sans">{selectedCertificateModal.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Tonase Dihanguskan:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedCertificateModal.volume} tCO2e</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Klaster &amp; Vintage:</span>
                  <span className="font-medium text-slate-800 font-sans">{selectedCertificateModal.clusterOrigin} ({selectedCertificateModal.vintage})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">No. Registri KLHK:</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedCertificateModal.srnPpiReg}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <p className="text-[11px] text-emerald-900 font-sans">
                  Status: <strong>RETIRED &amp; TERCATAT PERMANEN</strong>. Sertifikat ini tidak dapat diperjualbelikan kembali dan telah sah digunakan untuk pelaporan ESG / Taksonomi Hijau OJK.
                </p>
              </div>

              <button
                onClick={() => setSelectedCertificateModal(null)}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#14382C] hover:bg-[#1E4D3D] rounded-xl shadow-xs transition cursor-pointer font-sans"
              >
                Tutup Tampilan Validasi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
