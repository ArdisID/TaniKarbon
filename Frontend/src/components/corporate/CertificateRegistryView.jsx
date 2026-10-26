import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  QrCode, 
  CheckCircle2, 
  FileText,
  Copy,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { formatRupiah } from '../../data';

export default function CertificateRegistryView({ 
  certificates = [], 
  onViewCertificate, 
  onToast 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');

  const defaultCertificates = [
    {
      uuid: 'CERT-2026-TK-9941A',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      vintage: '2026',
      quantity: 500,
      totalCost: 80000000,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Manual Checkout',
      date: '18 Okt 2026',
      srnRef: 'ID-SRN-2026-00418'
    },
    {
      uuid: 'CERT-2026-TK-8812B',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: 'Klaster Konservasi Lereng Sindoro Utara',
      vintage: '2026',
      quantity: 350,
      totalCost: 56000000,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Auto-Buy API',
      date: '12 Okt 2026',
      srnRef: 'ID-SRN-2026-00392'
    },
    {
      uuid: 'CERT-2026-TK-7703C',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: 'Klaster Sabuk Pesisir Demak (Mangrove)',
      vintage: '2026',
      quantity: 200,
      totalCost: 35000000,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Auto-Buy API',
      date: '04 Okt 2026',
      srnRef: 'ID-SRN-2026-00277'
    },
    {
      uuid: 'CERT-2026-TK-6624D',
      companyName: 'PT Industri Hijau Nusantara (Tbk)',
      clusterName: 'Klaster Agroforestri Dusun Garung - Wonosobo',
      vintage: '2026',
      quantity: 150,
      totalCost: 24000000,
      status: 'RETIRED • Terkunci Tahun Buku 2026',
      source: 'Manual Checkout',
      date: '28 Sep 2026',
      srnRef: 'ID-SRN-2026-00194'
    }
  ];

  const allCerts = [...certificates, ...defaultCertificates];

  const filteredCerts = allCerts.filter(c => {
    if (filterYear !== 'all' && c.vintage !== filterYear) return false;
    if (searchQuery && !c.uuid.toLowerCase().includes(searchQuery.toLowerCase()) && !c.clusterName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalRetired = allCerts.reduce((acc, c) => acc + (c.quantity || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Kredit Karbon Permanen (Retired Registry)
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#14382C] mt-1.5 tracking-tight">
            Sertifikat &amp; Repositori Audit ESG (SRN-PPI)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar resmi sertifikat pengurangan emisi berstatus RETIRED yang terkunci untuk pemenuhan kepatuhan POJK 51 dan standar ISO 14064.
          </p>
        </div>

        <button
          onClick={() => {
            if (onToast) onToast('Bundel audit tahunan (.ZIP / .CSV) siap diunduh.');
          }}
          className="px-4 py-2.5 rounded-2xl bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs transition flex items-center gap-2 shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Seluruh Bundel Audit (.ZIP)</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
            Total Emisi Terkunci (Retired)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-[#14382C] font-mono">
              {totalRetired.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">tCO2e</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tercatat sah di buku besar KLHK</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xl shadow-slate-100 border-slate-200">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
            Total Dokumen Sertifikat
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-[#14382C] font-mono">
              {allCerts.length}
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">Berkas BAP</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Dilengkapi stempel digital publik</span>
        </div>

        <div className="bg-emerald-950 text-white p-5 rounded-3xl border border-emerald-900 shadow-2xs">
          <span className="text-[10px] uppercase font-mono font-bold text-emerald-300 block">
            Kepatuhan Pelaporan Audit
          </span>
          <div className="mt-1">
            <span className="text-lg font-black text-white block">
              POJK No. 51 / 2017 &amp; GRI
            </span>
          </div>
          <span className="text-[11px] text-emerald-200 mt-1 block">Tervalidasi pihak ketiga Tier-3</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari UUID sertifikat atau klaster..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14382C]"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500 font-bold">Filter Tahun:</span>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#14382C]"
          >
            <option value="all">Semua Tahun</option>
            <option value="2026">Tahun Buku 2026</option>
            <option value="2025">Tahun Buku 2025</option>
          </select>
        </div>
      </div>

      {/* A. RetirementCertificateList (Tabel Sertifikat Permanen) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#14382C]">
            Tabel &amp; Kartu Sertifikat Pensiun (RetirementCertificateList)
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {filteredCerts.length} Sertifikat Ditemukan
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredCerts.map((cert) => (
            <div
              key={cert.uuid}
              className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-[#14382C] bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {cert.uuid}
                    </span>
                    {/* Badge Status Siklus Hidup */}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      RETIRED • Terkunci Tahun Buku {cert.vintage}
                    </span>
                    {/* Sumber Eksekusi Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                      cert.source === 'Auto-Buy API'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}>
                      {cert.source}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-slate-800 mt-1 truncate font-sans">
                    {cert.clusterName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-sans mt-0.5">
                    <span>Terbit: {cert.date}</span>
                    <span>•</span>
                    <span>No. Registri: <span className="font-mono text-stone-700">{cert.srnRef || 'ID-SRN-KLHK-9921'}</span></span>
                  </div>
                </div>
              </div>

              {/* Volume & Action Buttons */}
              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pl-13 md:pl-0">
                <div className="text-left md:text-right">
                  <span className="font-mono text-sm sm:text-base font-black text-emerald-700 block">
                    {cert.quantity} tCO2e
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Nilai: {formatRupiah(cert.totalCost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onViewCertificate(cert)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#14382C] text-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lihat BAP Resmi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
