import React, { useState } from 'react';
import { 
  Key, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Trash2, 
  Zap, 
  Send, 
  Cpu, 
  Sliders, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function ErpIntegrationView({ 
  depositBalance = 250000000, 
  onSimulateWebhookHit, 
  onToast 
}) {
  // A. ApiKeyManagerCard state
  const [apiKey, setApiKey] = useState('tk_live_89a1f4c290be471b8219003847ac');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // B. AutoOffsetRulesForm state
  const [autoBuyActive, setAutoBuyActive] = useState(true);
  const [clusterAlgorithm, setClusterAlgorithm] = useState('jawa_tengah');
  const [spendingCap, setSpendingCap] = useState('100000000');

  // D. DeveloperSnippetTabs state (curl | node | python)
  const [activeSnippetTab, setActiveSnippetTab] = useState('curl');
  const [isFiringWebhook, setIsFiringWebhook] = useState(false);

  // C. ApiWebhookLogsTable state
  const [logs, setLogs] = useState([
    {
      id: 'log-01',
      timestamp: '25 Okt 2026, 14:10:22 WIB',
      endpoint: 'POST /v1/emissions/auto-offset',
      payload: '12.5 tCO2e',
      cluster: 'Klaster Dusun Garung - Wonosobo',
      cost: 2000000,
      uuid: 'CERT-2026-TK-8812B',
      status: 200,
      statusText: '200 OK'
    },
    {
      id: 'log-02',
      timestamp: '24 Okt 2026, 18:45:10 WIB',
      endpoint: 'POST /v1/emissions/auto-offset',
      payload: '8.0 tCO2e',
      cluster: 'Klaster Lereng Sindoro Utara',
      cost: 1280000,
      uuid: 'CERT-2026-TK-8813C',
      status: 200,
      statusText: '200 OK'
    },
    {
      id: 'log-03',
      timestamp: '23 Okt 2026, 09:30:04 WIB',
      endpoint: 'POST /v1/emissions/auto-offset',
      payload: '25.0 tCO2e',
      cluster: 'Klaster Sabuk Pesisir Demak',
      cost: 4000000,
      uuid: 'CERT-2026-TK-8814D',
      status: 200,
      statusText: '200 OK'
    }
  ]);

  const handleCopyKey = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(apiKey);
    }
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    if (onToast) onToast('Bearer Token berhasil disalin ke clipboard.');
  };

  const handleRegenerateKey = () => {
    const randomHex = Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12);
    setApiKey(`tk_live_${randomHex}`);
    if (onToast) onToast('Kunci API baru (Bearer Token) berhasil digenerate.');
  };

  // FITUR DEMO PENTING: Simulasi Tembak Webhook ERP Sekarang!
  const handleFireSimulatedWebhook = () => {
    setIsFiringWebhook(true);
    setTimeout(() => {
      const generatedTons = (Math.random() * 8 + 5).toFixed(1);
      const generatedCost = Math.round(parseFloat(generatedTons) * 160000);
      const newUuid = `CERT-2026-TK-${Math.floor(1000 + Math.random() * 9000)}API`;

      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB, Hari Ini',
        endpoint: 'POST /v1/emissions/auto-offset',
        payload: `${generatedTons} tCO2e`,
        cluster: 'Klaster Dusun Garung - Wonosobo',
        cost: generatedCost,
        uuid: newUuid,
        status: 200,
        statusText: '200 OK'
      };

      setLogs(prev => [newLog, ...prev]);
      setIsFiringWebhook(false);

      if (onSimulateWebhookHit) {
        onSimulateWebhookHit(parseFloat(generatedTons), generatedCost, newUuid);
      }
      if (onToast) {
        onToast(`Webhook ERP Diterima: ${generatedTons} tCO2e otomatis ditebus di Garung Klaster! (HTTP 200 OK)`);
      }
    }, 450);
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.tanikarbon.id/v1/emissions/auto-offset \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "facility_id": "PABRIK-SMG-01",
    "emission_tco2e": 12.5,
    "vintage_year": "2026",
    "target_cluster_pref": "${clusterAlgorithm}",
    "idempotency_key": "IDEM-2026-9921"
  }'`,

    node: `const axios = require('axios');

async function reportAndOffsetEmission() {
  const response = await axios.post('https://api.tanikarbon.id/v1/emissions/auto-offset', {
    facility_id: 'PABRIK-SMG-01',
    emission_tco2e: 12.5,
    vintage_year: '2026',
    target_cluster_pref: '${clusterAlgorithm}',
    idempotency_key: 'IDEM-2026-9921'
  }, {
    headers: {
      'Authorization': 'Bearer ${apiKey}',
      'Content-Type': 'application/json'
    }
  });

  console.log('Certificate Issued:', response.data.certificate_uuid);
}

reportAndOffsetEmission();`,

    python: `import requests

url = "https://api.tanikarbon.id/v1/emissions/auto-offset"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "facility_id": "PABRIK-SMG-01",
    "emission_tco2e": 12.5,
    "vintage_year": "2026",
    "target_cluster_pref": "${clusterAlgorithm}",
    "idempotency_key": "IDEM-2026-9921"
}

response = requests.post(url, json=payload, headers=headers)
print("Response HTTP:", response.status_code)
print("Certificate UUID:", response.json().get("certificate_uuid"))`
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Interoperabilitas Sistem UINIC 8.0
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1.5 tracking-tight">
          Integrasi ERP &amp; Developer API
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Hubungkan sistem ERP pabrik (SAP, Odoo, Oracle) untuk pelaporan emisi otomatis dan penebusan instan tanpa login manual.
        </p>
      </div>

      {/* Top Grid: API Key Manager & Auto-Buy Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* A. Panel Manajemen Kredensial API (ApiKeyManagerCard) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-700" />
                <h2 className="text-sm font-extrabold text-[#14382C]">
                  Manajemen Kredensial API (ApiKeyManagerCard)
                </h2>
              </div>

              {/* Status Koneksi ERP Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Connected to SAP / Odoo</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Gunakan kunci rahasia ini sebagai Bearer Token otentikasi di header request integrasi backend.
            </p>

            {/* Bearer Token Box */}
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 font-mono text-xs">
              <div className="text-emerald-400 truncate">
                {showKey ? apiKey : apiKey.substring(0, 12) + '••••••••••••••••••••'}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
                  title={showKey ? "Sembunyikan Kunci" : "Tampilkan Kunci"}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition"
                  title="Salin Kunci"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-slate-400">Environment: Production (Live)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRegenerateKey}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate New</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin mencabut kunci API ini?')) {
                    if (onToast) onToast('Kunci API berhasil dicabut (Revoked).');
                  }
                }}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition"
              >
                Revoke Key
              </button>
            </div>
          </div>
        </div>

        {/* B. Konfigurasi Aturan Auto-Buy (AutoOffsetRulesForm) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-700" />
              <h2 className="text-sm font-extrabold text-[#14382C]">
                Konfigurasi Aturan Auto-Buy (AutoOffsetRulesForm)
              </h2>
            </div>
            {/* Toggle switch utama */}
            <button
              type="button"
              onClick={() => setAutoBuyActive(!autoBuyActive)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                autoBuyActive ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoBuyActive ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Rule 1: Toggle info */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <strong className="text-slate-800 block font-bold">Status Eksekusi Real-Time</strong>
                <span className="text-[11px] text-slate-500">
                  {autoBuyActive 
                    ? 'API diizinkan memotong deposit & membakar kuota otomatis tanpa login' 
                    : 'Auto-buy nonaktif. Transaksi API membutuhkan konfirmasi manual'}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                autoBuyActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {autoBuyActive ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>

            {/* Rule 2: Preferensi Klaster Otomatis */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Preferensi Algoritma Klaster
              </label>
              <select
                value={clusterAlgorithm}
                onChange={(e) => setClusterAlgorithm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#14382C]"
              >
                <option value="jawa_tengah">Prioritas Agroforestri Jawa Tengah (Garung &amp; Sindoro)</option>
                <option value="lowest_price">Prioritas Harga Terendah (Batas Bawah IDXCarbon)</option>
                <option value="highest_social">Prioritas Skor Sosial Tertinggi (Gapoktan Mitra)</option>
              </select>
            </div>

            {/* Rule 3: Batas Anggaran Otomatis (MonthlySpendingCapInput) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Batas Aman Debet API Bulanan (Monthly Spending Cap)
                </label>
                <span className="font-mono text-[10px] text-emerald-700 font-bold">
                  {formatRupiah(parseInt(spendingCap || 0))}
                </span>
              </div>
              <input
                type="number"
                step="5000000"
                value={spendingCap}
                onChange={(e) => setSpendingCap(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#14382C]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* D. Kotak Panduan & Contoh Payload (DeveloperSnippetTabs) */}
      <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">
                Contoh Payload Request API (DeveloperSnippetTabs)
              </h2>
              <p className="text-[11px] text-slate-400">Endpoint: POST https://api.tanikarbon.id/v1/emissions/auto-offset</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Snippet Tabs */}
            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs font-mono">
              {['curl', 'node', 'python'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveSnippetTab(tab)}
                  className={`px-3 py-1 rounded-lg transition font-bold ${
                    activeSnippetTab === tab 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* LIVE DEMO TRIGGER: Simulasikan Tembak Webhook ERP Sekarang */}
            <button
              type="button"
              onClick={handleFireSimulatedWebhook}
              disabled={isFiringWebhook}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono rounded-xl transition shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Zap className={`w-4 h-4 text-slate-950 ${isFiringWebhook ? 'animate-bounce' : ''}`} />
              <span>{isFiringWebhook ? 'Mengirim Payload...' : 'Simulasikan Tembak Webhook ERP'}</span>
            </button>
          </div>
        </div>

        {/* Code Block Content */}
        <div className="relative rounded-2xl bg-slate-900 p-4 border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-300">
          <pre>{codeSnippets[activeSnippetTab]}</pre>
        </div>
      </div>

      {/* C. Tabel Log Aktivitas API Real-Time (ApiWebhookLogsTable) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-extrabold text-[#14382C]">
              Tabel Log Aktivitas API Real-Time (ApiWebhookLogsTable)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {logs.length} Event Payload Terproses
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-sans text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Timestamp</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Endpoint API</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Payload Emisi</th>
                <th className="px-5 py-3.5 min-w-[200px]">Klaster Terpotong</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-right">Biaya Didebet</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Sertifikat Terbit</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">HTTP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 text-stone-500 font-sans text-xs whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/80">
                      {log.endpoint}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-xs text-[#14382C]">
                    {log.payload}
                  </td>
                  <td className="px-5 py-4 font-sans text-xs text-stone-800 min-w-[200px]">
                    {log.cluster}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-sm text-emerald-800">
                    {formatRupiah(log.cost)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold text-[#14382C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {log.uuid}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{log.statusText}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
