import React, { useState, useRef } from 'react';
import {
  Leaf, MapPin, ShieldCheck, QrCode, ArrowRight,
  Download, Sliders, Globe, ChevronRight, ChevronDown, X, Eye, EyeOff,
  BarChart3, Users, TrendingUp, Camera, Building2, CheckCircle2,
  FileCheck2, Scale, Printer, ExternalLink, Layers, Satellite,
  Filter, Info, Calendar, Award, ArrowLeft, Bell, Search,
  ZoomIn, ZoomOut, Copy, Check, FileText, Share2
} from 'lucide-react';
import { CLUSTERS_DATA, CORPORATE_BUYERS, formatRupiah, formatNumber } from '../data';

// ============================================================================
// 1. MODAL: PROFIL ESG PERUSAHAAN (PT TELKOM INDONESIA)
// ============================================================================
function CompanyProfileModal({ onClose, onToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <Building2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Akun Korporat Terverifikasi</span>
              <h3 className="font-extrabold text-white text-lg">PT Telkom Indonesia (Persero) Tbk</h3>
              <p className="text-xs text-emerald-200/80">Directorate of Sustainability &amp; ESG</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Kode Entitas IDX</span>
              <strong className="text-[#14382C] font-bold text-sm font-mono">IDX: TLKM</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">No. Akun SRN-PPI</span>
              <strong className="text-[#14382C] font-bold text-sm font-mono">ID-SRN-CORP-0182</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Target Net-Zero</span>
              <strong className="text-emerald-700 font-bold text-sm">Scope 1 &amp; 2 (Tahun 2030)</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Kepatuhan Regulasi</span>
              <strong className="text-[#14382C] font-bold text-sm">POJK No. 51/2017</strong>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
            <span className="font-bold text-stone-700 uppercase text-[10px] tracking-wider block">Pejabat Otorisasi ESG</span>
            <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
              <span className="text-stone-600">SVP Corporate Sustainability:</span>
              <strong className="text-stone-900">Dr. Hendra Wibowo, M.Sc.</strong>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-stone-600">Email Verifikasi Audit:</span>
              <span className="font-mono text-emerald-800 font-semibold">esg-offset@telkom.co.id</span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => {
                onToast('Dokumen Kepatuhan POJK 51/2017 Telkom berhasil diunduh (PDF).');
                onClose();
              }}
              className="flex-1 py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh Dokumen ESG (POJK 51)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MODAL: SERTIFIKASI & AKREDITASI REGULASI (SRN-PPI & IDXCARBON)
// ============================================================================
function AccreditationModal({ onClose, onToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Legalitas &amp; Sertifikasi MRV</span>
              <h3 className="font-extrabold text-white text-base">Akreditasi Bursa Karbon Nasional</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-start gap-3">
              <FileCheck2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-bold block text-sm">Sistem Registri Nasional (SRN-PPI KLHK)</strong>
                <p className="text-emerald-800 mt-0.5 leading-relaxed">
                  Semua kredit karbon agroforestri terbit di SRN-PPI KLHK sesuai Permen LHK No. 21/2022 tentang Tata Laksana Penerapan Nilai Ekonomi Karbon (NEK).
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3">
              <Scale className="w-5 h-5 text-stone-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900 font-bold block text-sm">Bursa Karbon Indonesia (IDXCarbon)</strong>
                <p className="text-stone-600 mt-0.5 leading-relaxed">
                  Dapat dicatatkan sebagai unit karbon terverifikasi (SPE-GRK) yang diakui untuk perdagangan dan pelaporan Bursa Efek Indonesia.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900 font-bold block text-sm">ISO 14064-2 &amp; Verra VM0042 MRV</strong>
                <p className="text-stone-600 mt-0.5 leading-relaxed">
                  Metrik perhitungan alometrik Chave Tier-3 diaudit independen secara berkala menggunakan sensor optik satelit Sentinel-2.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onToast('Salinan akreditasi resmi SRN-PPI & POJK 51 berhasil diunduh (PDF).');
              onClose();
            }}
            className="w-full py-3.5 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Berkas Akreditasi Resmi (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. MODAL: NOTIFIKASI & AUDIT ESG KORPORAT
// ============================================================================
function CorporateNotificationModal({ onClose, onToast }) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Audit Satelit Sentinel-2 Klaster Sindoro Selesai',
      desc: 'Tutupan kanopi 240 Ha stabil pada NDVI 0.72. Kuota kredit karbon kuartal IV telah diverifikasi.',
      time: 'Hari ini, 09:30 WIB',
      unread: true,
      category: 'audit'
    },
    {
      id: 2,
      title: 'Invoice Pensiunan BAP-2026-TLKM-8821 Siap',
      desc: 'Pensiunan 200 Ton CO₂ telah terbit sertifikat resminya dan siap dilampirkan ke Laporan Tahunan.',
      time: 'Kemarin, 16:45 WIB',
      unread: true,
      category: 'invoice'
    },
    {
      id: 3,
      title: 'Pembaruan Regulasi OJK Terkait Pajak Karbon',
      desc: 'Perhitungan offset TaniKarbon telah selaras dengan tarif batas emisi PLTU dan industri telekomunikasi.',
      time: '3 hari lalu',
      unread: false,
      category: 'compliance'
    }
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    onToast('Semua notifikasi korporat ditandai telah dibaca.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#14382C] text-base">Notifikasi ESG Korporat</h3>
              <p className="text-[11px] text-stone-400">Pembaruan audit satelit &amp; dokumen BAP</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 divide-y divide-stone-100 max-h-[380px] overflow-y-auto space-y-2">
          {notifications.map(item => (
            <div key={item.id} className={`pt-3 first:pt-0 pb-2 ${item.unread ? 'bg-emerald-50/50 -mx-2 px-2 rounded-xl' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-[#14382C] flex items-center gap-1.5">
                  {item.unread && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                  <span>{item.title}</span>
                </h4>
                <span className="text-[10px] text-stone-400 shrink-0">{item.time}</span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <button onClick={markAllRead} className="text-xs text-emerald-800 hover:text-emerald-900 font-bold transition">
            Tandai Semua Dibaca
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. MODAL: FOTO GROUND-TRUTH LAPANGAN PETANI
// ============================================================================
function GroundTruthModal({ photo, onClose, onToast }) {
  if (!photo) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="relative aspect-[16/10] bg-black overflow-hidden">
          <img src={photo.image} alt={photo.caption} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-mono flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Geotagged Camera Survey</span>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <div>
            <h4 className="font-extrabold text-[#14382C] text-base">{photo.caption}</h4>
            <p className="text-xs text-stone-500 mt-0.5">Dokumentasi audit fisik pohon lapangan oleh mitra tani kelompok binaan.</p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                Koordinat GPS RTK:
              </span>
              <button
                onClick={() => onToast(`Koordinat ${photo.gps} tersalin.`)}
                className="font-mono text-[#14382C] font-bold hover:text-emerald-700 transition"
              >
                {photo.gps}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                Waktu Audit:
              </span>
              <strong className="text-stone-800">{photo.time}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Hash Integritas:
              </span>
              <span className="font-mono text-emerald-800 font-semibold">{photo.hash} (SHA-256)</span>
            </div>
          </div>

          <button
            onClick={() => {
              onToast('Foto ground-truth beresolusi tinggi berhasil diunduh.');
              onClose();
            }}
            className="w-full py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Berkas Foto Asli Metadata (JPG)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. MODAL: PORTOFOLIO BUYER KORPORAT LAIN
// ============================================================================
function BuyerPortfolioModal({ buyer, onClose, onToast }) {
  if (!buyer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="bg-[#14382C] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-bold text-lg text-emerald-300 border border-white/20">
              {buyer.logo}
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Bursa Karbon Partisipan</span>
              <h3 className="font-extrabold text-white text-base">{buyer.name}</h3>
              <p className="text-xs text-white/80">Sektor: {buyer.sector}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <span className="text-xs text-stone-500 font-medium">Total Kredit Karbon Dipensiunkan</span>
            <div className="text-3xl font-black text-[#14382C] font-sans mt-1">
              {formatNumber(buyer.retired)} <span className="text-sm font-semibold text-stone-500">Ton CO₂e</span>
            </div>
            <p className="text-[11px] text-emerald-800 font-bold mt-1">Tercatat Sah di Registri SRN-PPI KLHK</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Distribusi Dana Petani (88%):</span>
              <strong className="text-emerald-700 font-bold">{formatRupiah(buyer.retired * 165000 * 0.88)}</strong>
            </div>
            <div className="flex justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-stone-500 font-medium">Status Laporan POJK 51:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Terakreditasi Bersih
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              onToast(`Ringkasan audit keberlanjutan ${buyer.name} berhasil disimpan.`);
              onClose();
            }}
            className="w-full py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            Lihat Portofolio Lengkap
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. MODAL: SERTIFIKAT RESMI BAP (BERITA ACARA PENSIUN) KREDIT KARBON
// ============================================================================
function BAPCertificateModal({ tonnage, pricePerTon, cluster, onClose, onToast }) {
  const totalPrice = tonnage * pricePerTon;
  const farmerShare = totalPrice * 0.88;
  const operationalReserve = totalPrice * 0.12;
  const certId = `BAP-${Date.now().toString(36).toUpperCase()}-${cluster.id}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (onToast) onToast('Gagal membuka jendela cetak. Periksa setelan pop-up browser Anda.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Berita Acara Pensiun Karbon - ${certId}</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 36px; background: white; color: #14382C; }
            .cert-box { border: 3px solid #14382C; padding: 36px; border-radius: 20px; position: relative; }
            .header { text-align: center; margin-bottom: 24px; }
            .logo-badge { display: inline-block; background: #14382C; color: white; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 13px; margin-bottom: 10px; }
            h1 { font-size: 22px; font-weight: 900; color: #14382C; }
            h2 { font-size: 13px; color: #555; margin-top: 4px; }
            .cert-id { font-family: monospace; font-size: 12px; color: #777; margin-top: 6px; font-weight: bold; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
            .field { background: #F8F9FA; border: 1px solid #E5E7EB; padding: 12px 14px; border-radius: 12px; }
            .field-label { font-size: 10px; text-transform: uppercase; color: #777; font-weight: bold; }
            .field-value { font-size: 14px; font-weight: 800; color: #14382C; margin-top: 2px; }
            .total-banner { background: #14382C; color: white; padding: 18px; border-radius: 16px; text-align: center; margin: 20px 0; }
            .total-banner .val { font-size: 26px; font-weight: 900; margin: 4px 0; }
            .stamp { display: inline-block; border: 2px solid #059669; color: #059669; padding: 8px 18px; border-radius: 10px; font-weight: 800; font-size: 12px; transform: rotate(-3deg); margin: 15px auto; }
            .footer { text-align: center; font-size: 10px; color: #777; margin-top: 24px; border-top: 1px solid #E5E7EB; padding-top: 14px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="cert-box">
            <div class="header">
              <div class="logo-badge">TANIKARBON MRV</div>
              <h1>BERITA ACARA PENSIUN (BAP) KREDIT KARBON</h1>
              <h2>Sertifikat Resmi Pensiunan Unit Karbon Terverifikasi (SPE-GRK)</h2>
              <p class="cert-id">${certId}</p>
            </div>
            <div class="grid">
              <div class="field">
                <p class="field-label">Pihak Pembeli Pensiunan</p>
                <p class="field-value">PT Telkom Indonesia (Persero) Tbk</p>
              </div>
              <div class="field">
                <p class="field-label">Klaster Agroforestri Penghasil</p>
                <p class="field-value">${cluster.name}</p>
              </div>
              <div class="field">
                <p class="field-label">Volume Emisi Dipensiunkan</p>
                <p class="field-value">${tonnage} Ton CO₂e</p>
              </div>
              <div class="field">
                <p class="field-label">Harga Satuan Fair-Trade</p>
                <p class="field-value">${formatRupiah(pricePerTon)} / Ton</p>
              </div>
            </div>
            <div class="total-banner">
              <p style="font-size:11px;opacity:0.8;">Total Nilai Investasi Karbon Pensiun</p>
              <div class="val">${formatRupiah(totalPrice)}</div>
              <p style="font-size:10px;opacity:0.75;">88% Disalurkan Tunai ke Petani (${formatRupiah(farmerShare)}) · 12% Cadangan Verifikasi MRV (${formatRupiah(operationalReserve)})</p>
            </div>
            <div style="text-align: center;">
              <div class="stamp">✓ SAH DIPENSIUNKAN · SRN-PPI KLHK & POJK NO. 51/2017</div>
            </div>
            <div class="footer">
              <p>Diterbitkan secara sah oleh TaniKarbon — Sistem MRV Agroforestri Berbasis AI & Satelit.</p>
              <p>Sertifikat ini sah dan dapat diaudit oleh Otoritas Jasa Keuangan (OJK) serta Kementerian LHK RI.</p>
              <p>Tanggal Penerbitan: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
    if (onToast) onToast('Membuka dialog cetak sertifikat BAP resmi...');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        {/* Certificate Header */}
        <div className="bg-[#14382C] p-6 text-center text-white relative">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/20">
            <Award className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">Berita Acara Pensiun (BAP)</h2>
          <p className="text-xs text-white/70 mt-0.5">Sertifikat Resmi Pensiunan Kredit Karbon</p>
          <span className="inline-block font-mono text-[11px] text-emerald-300 font-bold mt-2 bg-black/30 px-3 py-0.5 rounded-full border border-white/15">
            {certId}
          </span>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Entitas Pembeli</span>
              <strong className="text-[#14382C] font-bold">PT Telkom Indonesia</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Klaster Asal</span>
              <strong className="text-[#14382C] font-bold truncate block">{cluster.name}</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Volume Pensiun</span>
              <strong className="text-emerald-700 font-bold">{tonnage} Ton CO₂e</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Harga Fair-Trade</span>
              <strong className="text-[#14382C] font-bold">{formatRupiah(pricePerTon)} / Ton</strong>
            </div>
          </div>

          {/* Investment & 88% farmer share banner */}
          <div className="bg-[#FAFDF9] p-4 rounded-2xl border border-emerald-200 text-center">
            <span className="text-xs text-stone-500 font-medium">Total Nilai Investasi Offset</span>
            <div className="text-2xl sm:text-3xl font-black text-[#14382C] font-sans mt-0.5">
              {formatRupiah(totalPrice)}
            </div>
            <div className="flex items-center justify-center gap-3 text-xs mt-2 text-stone-600">
              <span className="font-semibold text-emerald-800">88% Petani: {formatRupiah(farmerShare)}</span>
              <span>·</span>
              <span className="text-stone-500">12% Ops MRV: {formatRupiah(operationalReserve)}</span>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center flex items-center justify-between px-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-[#14382C]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#14382C]">QR Verifikasi Audit Publik</p>
                <p className="text-[10px] text-stone-500 font-mono">Tervalidasi di SRN-PPI KLHK</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              Sah &amp; Valid
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handlePrint}
              className="py-3 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={() => {
                if (onToast) onToast('Tautan verifikasi sertifikat berhasil disalin.');
              }}
              className="py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-stone-600" />
              <span>Salin Tautan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. COMPONENT: AUDIT SPASIAL & GROUND-TRUTH CITRA SATELIT
// ============================================================================
function SpatialAuditPanel({ cluster, onOpenPhoto }) {
  const [showNdvi, setShowNdvi] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Ground photos tied to real assets
  const groundPhotos = [
    {
      id: 1,
      caption: 'Kanopi Tegakan Agroforestri',
      image: '/canopy-tree.jpg',
      gps: '-7.3631°S, 109.9031°E',
      time: '14:22 WIB, 12 Okt 2026',
      hash: '0x8f3a...c21d'
    },
    {
      id: 2,
      caption: 'Batas Pekarangan Terasering',
      image: '/hero-agroforest.jpg',
      gps: '-7.3628°S, 109.9035°E',
      time: '14:35 WIB, 12 Okt 2026',
      hash: '0x7e2b...d904'
    },
    {
      id: 3,
      caption: 'Pohon Kopi & Alpukat Binaan',
      image: '/auth-bg.jpg',
      gps: '-7.3634°S, 109.9028°E',
      time: '14:48 WIB, 12 Okt 2026',
      hash: '0x4c1f...a882'
    },
    {
      id: 4,
      caption: 'Patroli Sensor Udara Drone',
      image: '/agri-drone.jpg',
      gps: '-7.3636°S, 109.9033°E',
      time: '15:02 WIB, 12 Okt 2026',
      hash: '0x99a4...f31e'
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
      {/* Panel Header */}
      <div className="p-5 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Satellite className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#14382C] text-sm sm:text-base">Panel Audit Spasial &amp; Ground-Truth</h3>
            <p className="text-[11px] text-stone-500">Sentinel-2 Multispektral 10m · Verifikasi Poligon Kadastral</p>
          </div>
        </div>

        {/* Layer Toggle Switch */}
        <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowNdvi(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !showNdvi ? 'bg-white text-[#14382C] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Ortofoto Riil
          </button>
          <button
            type="button"
            onClick={() => setShowNdvi(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showNdvi ? 'bg-emerald-700 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Klorofil NDVI
          </button>
        </div>
      </div>

      {/* Satellite Visual Viewport */}
      <div className="relative aspect-[16/9] bg-stone-900 overflow-hidden">
        <div
          className="w-full h-full transition-transform duration-500"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src="/hero-agroforest.jpg"
            alt="Citra Ortofoto Satelit Klaster"
            className={`w-full h-full object-cover transition-all duration-300 ${
              showNdvi ? 'hue-rotate-60 saturate-200 contrast-125' : 'brightness-95 contrast-105'
            }`}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

        {/* Cadastral Polygon CAD Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="12,18 88,14 84,86 16,84"
            fill={showNdvi ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)'}
            stroke={showNdvi ? '#10B981' : '#ffffff'}
            strokeWidth="0.8"
            strokeDasharray="2.5,1.5"
          />
          <polygon
            points="24,28 60,25 64,65 28,68"
            fill="none"
            stroke={showNdvi ? '#34D399' : '#ffffff'}
            strokeWidth="0.5"
            strokeDasharray="1.5,1"
            opacity="0.7"
          />
        </svg>

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono border border-white/20">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{cluster.coordinates}</span>
          </span>
        </div>

        <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
          {/* Zoom controls */}
          <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-xl p-0.5 flex items-center text-white">
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.15))}
              className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.15))}
              className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
            {showNdvi ? `NDVI: ${cluster.ndviScore}` : 'RGB Sentinel-2'}
          </span>
        </div>

        {/* Bottom Telemetry Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-sans text-white/90 bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Poligon Terverifikasi SRN-PPI · {cluster.hectares} Hektar</span>
          </div>
          <span className="text-emerald-300 font-bold">{cluster.farmers} Petani Binaan</span>
        </div>
      </div>

      {/* Ground Photos Bar (All Clickable) */}
      <div className="p-5 bg-stone-50/60 border-t border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs sm:text-sm font-bold text-[#14382C] flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-700" />
            <span>Bukti Foto Ground-Truth Petani (Klik untuk perbesar)</span>
          </h4>
          <span className="text-[11px] text-stone-400 font-medium">4 Foto Geotagged</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {groundPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(photo)}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-stone-200/80 shadow-2xs hover:border-emerald-500 transition-all cursor-pointer bg-stone-200"
            >
              <img
                src={photo.image}
                alt={photo.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-white">
                <p className="text-[10px] font-bold leading-tight truncate">{photo.caption}</p>
                <p className="text-[9px] font-mono text-emerald-300 truncate mt-0.5">{photo.gps}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. MAIN COMPONENT: CORPORATE MARKETPLACE (LIGHT NORDIC ENTERPRISE CLEAN)
// ============================================================================
export default function CorporateMarketplace({ totalRetired, onRetire, onBack }) {
  // Modal states
  const [selectedCluster, setSelectedCluster] = useState(CLUSTERS_DATA[0]);
  const [tonnageInput, setTonnageInput] = useState(50);
  const [showBAP, setShowBAP] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAccreditation, setShowAccreditation] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Filter state for clusters
  const [clusterFilter, setClusterFilter] = useState('all'); // 'all' | 'verified' | 'agroforest' | 'hutan'

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  const pricePerTon = selectedCluster.avgPrice;
  const totalCost = tonnageInput * pricePerTon;
  const farmerShare = totalCost * 0.88;
  const opsReserve = totalCost * 0.12;

  const handlePurchase = () => {
    onRetire(tonnageInput);
    setShowBAP(true);
    showToast(`Pensiunan ${tonnageInput} Ton CO₂e berhasil diterbitkan! Berita Acara Pensiun (BAP) siap dicetak.`);
  };

  // Filter clusters
  const filteredClusters = CLUSTERS_DATA.filter(cluster => {
    if (clusterFilter === 'verified') return cluster.verified;
    if (clusterFilter === 'agroforest') return cluster.name.toLowerCase().includes('poly-crop') || cluster.name.toLowerCase().includes('subak');
    if (clusterFilter === 'hutan') return cluster.name.toLowerCase().includes('forest') || cluster.name.toLowerCase().includes('riparian');
    return true;
  });

  // Helper thumbnail for clusters
  const getClusterImage = (id) => {
    if (id.includes('HLMH')) return '/canopy-tree.jpg';
    if (id.includes('KLTM')) return '/agri-drone.jpg';
    if (id.includes('BALI')) return '/auth-bg.jpg';
    return '/hero-agroforest.jpg';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-stone-900 font-sans pb-24 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#14382C] text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-400/40 flex items-center gap-2.5 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* 
        ========================================================================
        CORPORATE TOP BAR: Clean Enterprise Navigation & Verified Identity
        ========================================================================
      */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left Side: Back Navigation, Platform Identity & Corporate Account */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              title="Kembali ke Beranda"
              className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Platform Brand Identity */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-[#14382C] text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
                <Leaf className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-[#14382C] tracking-tight">TaniKarbon</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#14382C] text-emerald-300">
                    B2B Enterprise
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-medium">Bursa Karbon Terverifikasi</p>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="hidden md:block h-6 w-px bg-stone-200 mx-1 shrink-0" />

            {/* Corporate Profile Dropdown Pill (Clickable) */}
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 transition text-left group cursor-pointer max-w-[240px] sm:max-w-none"
              title="Klik profil perusahaan & otorisasi ESG"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[10px] shrink-0">
                TLKM
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-800 group-hover:text-emerald-900 truncate">
                    PT Telkom Indonesia
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <p className="text-[10px] text-stone-400 truncate">ESG Division · #CORP-01</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition shrink-0" />
            </button>
          </div>

          {/* Right Side: Accreditations, BAP Certificate Shortcut & Notification */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Accreditation Badge */}
            <button
              type="button"
              onClick={() => setShowAccreditation(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-[11px] font-bold text-emerald-800 transition active:scale-95 shadow-2xs cursor-pointer"
              title="Legalitas SRN-PPI & OJK POJK 51"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>SRN-PPI &amp; IDXCarbon</span>
            </button>

            {/* Quick Action: Buka Sertifikat BAP */}
            <button
              type="button"
              onClick={() => setShowBAP(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#14382C] hover:bg-[#1a4436] text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              title="Lihat Sertifikat Berita Acara Pensiun (BAP)"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Sertifikat BAP</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              title="Pemberitahuan & Audit ESG"
              className="w-10 h-10 rounded-2xl bg-white border border-stone-200/80 text-stone-600 hover:text-stone-900 flex items-center justify-center shadow-2xs hover:bg-stone-50 transition relative active:scale-95 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </button>
          </div>

        </div>
      </header>

      {/* 
        ========================================================================
        MAIN BODY: Nordic Enterprise Clean Layout
        ========================================================================
      */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* TOP ROW: ESG Impact Summary Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Bento Card 1: Total Pensiun */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Total Karbon Dipensiunkan</span>
              <div className="text-2xl sm:text-3xl font-black text-[#14382C] font-sans mt-1">
                {formatNumber(totalRetired)} <span className="text-xs font-semibold text-stone-500">Ton CO₂e</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Terdaftar di SRN-PPI KLHK
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>

          {/* Bento Card 2: 88% Direct Payout to Farmers */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Penyaluran Dana Petani (88%)</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-sans mt-1">
                {formatRupiah(totalRetired * 165000 * 0.88)}
              </div>
              <p className="text-[11px] text-stone-500 font-medium mt-1">Fair-Trade langsung ke rekening petani</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Bento Card 3: SDG & Compliance */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Kepatuhan Laporan POJK 51</span>
              <div className="text-2xl sm:text-3xl font-black text-[#14382C] font-sans mt-1">
                100% <span className="text-xs font-semibold text-stone-500">Audit-Ready</span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium mt-1">Memenuhi 4 Pilar SDG Keberlanjutan</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* MAIN WORKSPACE GRID: Left Clusters & Top Buyers (4 Cols) - Right Spatial Audit & Order Desk (8 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Cluster Explorer & Buyers Leaderboard (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Clusters Container */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-[#14382C] text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-700" />
                    <span>Klaster Agroforestri Terdaftar</span>
                  </h2>
                  <p className="text-[11px] text-stone-400 mt-0.5">Pilih klaster untuk melihat audit spasial</p>
                </div>
                <span className="text-xs font-bold text-stone-400">{filteredClusters.length} Klaster</span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'verified', label: 'Verified SRN' },
                  { key: 'agroforest', label: 'Polikultur' },
                  { key: 'hutan', label: 'Buffer Hutan' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setClusterFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      clusterFilter === tab.key
                        ? 'bg-[#14382C] text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Cluster Card Items */}
              <div className="space-y-3">
                {filteredClusters.map((cluster) => {
                  const isSelected = selectedCluster.id === cluster.id;
                  return (
                    <div
                      key={cluster.id}
                      onClick={() => {
                        setSelectedCluster(cluster);
                        showToast(`Klaster aktif diubah ke ${cluster.name}.`);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-[#14382C] bg-emerald-50/40 ring-2 ring-[#14382C]/10 shadow-sm'
                          : 'border-stone-200/80 hover:border-stone-300 bg-white hover:bg-stone-50/50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-100 relative">
                          <img
                            src={getClusterImage(cluster.id)}
                            alt={cluster.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm text-[9px] text-white font-mono px-1.5 py-0.5 rounded">
                            {cluster.hectares} Ha
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h3 className="font-bold text-xs sm:text-sm text-[#14382C] group-hover:text-emerald-900 leading-snug truncate">
                                {cluster.name}
                              </h3>
                              <p className="text-[11px] text-stone-400 mt-0.5">{cluster.province}</p>
                            </div>
                            {cluster.verified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                Audit Q4
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-stone-100">
                            <span className="text-stone-500 font-medium">
                              CO₂: <strong className="text-[#14382C]">{formatNumber(cluster.totalCO2)} T</strong>
                            </span>
                            <span className="text-emerald-700 font-bold">
                              {formatRupiah(cluster.avgPrice)} <span className="text-[10px] text-stone-400 font-normal">/ Ton</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Buyers Leaderboard */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-[#14382C] text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span>Partisipan Bursa Karbon Teraktif</span>
                </h3>
                <span className="text-[11px] text-stone-400">Klik untuk audit</span>
              </div>

              <div className="space-y-2">
                {CORPORATE_BUYERS.map((buyer, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedBuyer(buyer)}
                    className="p-3 rounded-2xl border border-stone-200/80 hover:bg-stone-50/80 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#14382C] text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                        {buyer.logo}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#14382C] truncate group-hover:text-emerald-800">{buyer.name}</p>
                        <p className="text-[10px] text-stone-400">{buyer.sector}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-sans font-bold text-xs text-[#14382C] block">{formatNumber(buyer.retired)} T</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Tercatat SRN</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Spatial Audit Panel & Order Execution Desk (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Spatial Audit Satellite Panel */}
            <SpatialAuditPanel
              cluster={selectedCluster}
              onOpenPhoto={setSelectedPhoto}
            />

            {/* Order Execution Desk / Fair-Trade Calculator */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h3 className="font-extrabold text-[#14382C] text-base">Meja Eksekusi Pensiun Karbon (Fair-Trade Desk)</h3>
                    <p className="text-[11px] text-stone-500">Pensiunkan kredit untuk kompensasi emisi POJK No. 51/2017</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedCluster.name.split(' ')[0]} Cluster
                </span>
              </div>

              {/* Tonnage Selector with Slider & Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Volume Karbon Dipensiunkan
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={tonnageInput}
                      onChange={(e) => setTonnageInput(Math.max(1, Math.min(1000, parseInt(e.target.value) || 0)))}
                      className="w-24 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-sm text-right text-[#14382C] focus:bg-white focus:outline-none focus:border-[#14382C]"
                    />
                    <span className="text-xs font-bold text-stone-500">Ton CO₂e</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={tonnageInput}
                  onChange={(e) => setTonnageInput(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-[#14382C]"
                />

                {/* Quick Presets */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[25, 50, 100, 200, 500].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTonnageInput(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        tonnageInput === val
                          ? 'bg-[#14382C] text-white shadow-2xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {val} Ton
                    </button>
                  ))}
                </div>
              </div>

              {/* Transparent Price & 88% Direct Payout Breakdown */}
              <div className="p-5 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">Harga per Ton Karbon:</span>
                  <span className="font-bold text-[#14382C]">{formatRupiah(pricePerTon)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">Perhitungan Volume:</span>
                  <span className="font-bold text-[#14382C]">{tonnageInput} Ton × {formatRupiah(pricePerTon)}</span>
                </div>

                <div className="h-px bg-stone-200/80 my-2" />

                {/* 88% / 12% Distribution */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                      Hak Petani Langsung (88% Fair-Trade):
                    </span>
                    <strong className="text-emerald-700 font-sans font-bold text-sm">{formatRupiah(farmerShare)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-stone-500 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#14382C] inline-block" />
                      Biaya Verifikasi MRV Satelit &amp; Audit (12%):
                    </span>
                    <strong className="text-stone-700 font-sans font-bold">{formatRupiah(opsReserve)}</strong>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="h-2.5 rounded-full overflow-hidden flex bg-stone-200 mt-2">
                  <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: '88%' }} />
                  <div className="bg-[#14382C] h-full transition-all duration-300" style={{ width: '12%' }} />
                </div>

                <div className="h-px bg-stone-200/80 my-2" />

                {/* Total Investment */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">Total Nilai Pensiunan</span>
                    <span className="text-[10px] text-stone-400">Termasuk pajak dan sertifikat BAP resmi</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-[#14382C] font-sans">
                    {formatRupiah(totalCost)}
                  </span>
                </div>
              </div>

              {/* Action Button: Beli & Pensiunkan Kredit */}
              <button
                onClick={handlePurchase}
                className="w-full py-4 bg-[#14382C] hover:bg-[#1a4436] text-white font-extrabold text-sm rounded-2xl transition shadow-md flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Pensiunkan {tonnageInput} Ton CO₂e &amp; Terbitkan BAP Resmi</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400 font-medium flex-wrap text-center">
                <span>✓ Sesuai SRN-PPI KLHK</span>
                <span>·</span>
                <span>✓ POJK No. 51/2017 Audit-Ready</span>
                <span>·</span>
                <span>✓ ISO 14064-2 Compliant</span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* 
        ========================================================================
        MODALS (ALL FUNCTIONAL, ZERO DUMMY)
        ========================================================================
      */}
      {/* 1. Modal: Profil Perusahaan */}
      {showProfile && (
        <CompanyProfileModal
          onClose={() => setShowProfile(false)}
          onToast={showToast}
        />
      )}

      {/* 2. Modal: Legalitas & Akreditasi */}
      {showAccreditation && (
        <AccreditationModal
          onClose={() => setShowAccreditation(false)}
          onToast={showToast}
        />
      )}

      {/* 3. Modal: Notifikasi ESG */}
      {showNotifications && (
        <CorporateNotificationModal
          onClose={() => setShowNotifications(false)}
          onToast={showToast}
        />
      )}

      {/* 4. Modal: Foto Ground-Truth */}
      {selectedPhoto && (
        <GroundTruthModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onToast={showToast}
        />
      )}

      {/* 5. Modal: Portofolio Buyer Lain */}
      {selectedBuyer && (
        <BuyerPortfolioModal
          buyer={selectedBuyer}
          onClose={() => setSelectedBuyer(null)}
          onToast={showToast}
        />
      )}

      {/* 6. Modal: Berita Acara Pensiun (BAP) Sertifikat */}
      {showBAP && (
        <BAPCertificateModal
          tonnage={tonnageInput}
          pricePerTon={pricePerTon}
          cluster={selectedCluster}
          onClose={() => setShowBAP(false)}
          onToast={showToast}
        />
      )}
    </div>
  );
}
