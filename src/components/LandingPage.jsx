import React, { useState, useEffect } from 'react';
import {
  Leaf, TrendingUp, ArrowRight, Scan, TreePine, ShieldCheck,
  MapPin, Smartphone, Globe, ChevronRight, BarChart3,
  Users, DollarSign, ArrowUpRight, CheckCircle2, Award,
  Radio, Check, ArrowDownToLine, Compass, Bell, Activity, Wifi,
  Battery, Crosshair, Camera, Layers, Play, CheckCircle, RefreshCw,
  QrCode, ExternalLink, SlidersHorizontal, Eye, ShieldAlert,
  CreditCard, FileText, Quote, ChevronDown, Search, X, CheckSquare,
  BookOpen, Clock
} from 'lucide-react';
import { formatRupiah, formatNumber, TREES_DATA } from '../data';
import Satellite3DMap from './Satellite3DMap';

// Smooth animated counter component
function AnimatedCounter({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = typeof value === 'number' ? value : parseFloat(value);
    const duration = 1200;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const formatted = Number.isInteger(value)
    ? formatNumber(Math.round(display))
    : display.toFixed(1);

  return (
    <span className="font-mono font-extrabold tracking-tight tabular-nums text-[#14382C]">
      {prefix}{formatted}{suffix}
    </span>
  );
}

export default function LandingPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('home');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [simulatingScan, setSimulatingScan] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [phoneWallet, setPhoneWallet] = useState(3250000);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeNdviLayer, setActiveNdviLayer] = useState(true);
  const [activeOffsetTon, setActiveOffsetTon] = useState(50);
  const [activeBentoScan, setActiveBentoScan] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [ledgerFilter, setLedgerFilter] = useState('All');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [selectedTree, setSelectedTree] = useState(null);
  const [storyTreeCount, setStoryTreeCount] = useState(5);

  // Track scroll progress for storytelling reading bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger simulated scan inside hero phone
  const handleTriggerPhoneScan = () => {
    setSimulatingScan(true);
    setScanResult(null);
    setTimeout(() => {
      setSimulatingScan(false);
      setScanResult({
        species: 'Pohon Alpukat Mentega',
        dbh: '38 cm',
        biomass: '310 kg',
        reward: 280000,
        confidence: 94,
      });
      setPhoneWallet(prev => prev + 280000);
    }, 2000);
  };

  const handleBentoScanSim = () => {
    setActiveBentoScan(true);
    setTimeout(() => {
      setActiveBentoScan(false);
    }, 2000);
  };

  const calculatedCost = activeOffsetTon * 160000;
  const farmerShare = Math.round(calculatedCost * 0.88);
  const mrvShare = calculatedCost - farmerShare;

  return (
    <div className="min-h-screen bg-[#FAFDF9] text-slate-800 font-sans selection:bg-amber-200 relative overflow-x-hidden">
      {/* ── AMBIENT SUNLIT SKY & LEAF GLOWS (SUNLIT AGRO-ECOLOGY) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-amber-200/25 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] bg-emerald-200/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-sky-200/25 rounded-full blur-[140px]" />
      </div>

      {/* ── TOP READING PROGRESS BAR (VIBRANT SUNRISE GRADIENT) ── */}
      <div
        style={{ width: `${scrollProgress}%` }}
        className="fixed top-0 left-0 h-[3.5px] bg-gradient-to-r from-amber-400 via-emerald-400 via-teal-400 to-sky-500 z-[70] transition-all duration-150 pointer-events-none shadow-[0_1px_8px_rgba(245,158,11,0.5)]"
      />

      {/* 
        ========================================================================
        1. FLOATING PILL NAVBAR DENGAN STORYTELLING CHAPTERS & SUARA SINDORO
        ========================================================================
      */}
      <header className="fixed top-4 sm:top-6 inset-x-0 z-[9999] px-4 pointer-events-none flex justify-center transition-all">
        <nav className="w-fit mx-auto px-6 py-2.5 bg-white/95 backdrop-blur-xl rounded-full border border-stone-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-6 sm:gap-8 pointer-events-auto">
          {/* Kolom Kiri: Brand Logo + badge kecil hijau AgroCarbon AI */}
          <div
            className="flex items-center gap-2.5 shrink-0 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#14382C] to-emerald-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <Leaf className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="font-extrabold text-base text-[#14382C] tracking-tight whitespace-nowrap">
              TaniKarbon
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#14382C]/10 text-[#14382C] border border-[#14382C]/15 whitespace-nowrap shrink-0">
              AgroCarbon AI
            </span>
          </div>

          {/* Kolom Tengah: Menu tautan teks murni tanpa angka */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600 shrink-0">
            <button
              onClick={() => {
                setActiveTab('how-it-works');
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="whitespace-nowrap transition-colors hover:text-stone-900 text-stone-600 font-medium text-xs"
            >
              Alur Petani
            </button>
            <button
              onClick={() => {
                setActiveTab('satelit');
                document.getElementById('peta-satelit')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="whitespace-nowrap transition-colors hover:text-stone-900 text-stone-600 font-medium text-xs"
            >
              Satelit
            </button>
            <button
              onClick={() => {
                setActiveTab('audit');
                document.getElementById('audit-ekonomi')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="whitespace-nowrap transition-colors hover:text-stone-900 text-stone-600 font-medium text-xs"
            >
              Simulasi
            </button>
            <button
              onClick={() => {
                setActiveTab('portofolio');
                document.getElementById('portofolio')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="whitespace-nowrap transition-colors hover:text-stone-900 text-stone-600 font-medium text-xs"
            >
              Registri
            </button>
          </div>

          {/* Kolom Kanan: Tombol aksi tunggal Masuk / Daftar */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => onNavigate('auth')}
              className="bg-[#14382C] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#1a4436] transition whitespace-nowrap shadow-sm active:scale-95"
            >
              Masuk / Daftar
            </button>
          </div>
        </nav>
      </header>

      {/* 
        ========================================================================
        HERO SECTION: UBAH POHON PEKARANGAN JADI GAJI PASIF
        Hero landscape panorama with contextual story setting
        ========================================================================
      */}
      {/* 
        ========================================================================
        HERO SECTION: FULL-WIDTH PANORAMIC LANDSCAPE
        Full bleed edge-to-edge background with FarmVista telemetry bar
        ========================================================================
      */}
      <section
        className="w-full relative overflow-hidden bg-cover bg-center min-h-[640px] sm:min-h-[720px] lg:min-h-[780px] flex flex-col justify-center pt-32 sm:pt-40 pb-20 sm:pb-28 shadow-lg"
        style={{
          backgroundImage: "url('/hero-landscape.png')",
        }}
      >
        {/* Subtle contrast dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/60 pointer-events-none" />

        {/* Center Hero Content (Full Bleed Canvas, Massive Clean Sans-Serif) */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-white">
          {/* Giant Title */}
          <h1 className="text-5xl sm:text-7xl lg:text-[88px] font-black tracking-tight leading-[0.98] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            TaniKarbon
          </h1>

          {/* Sub-headline */}
          <p className="mt-4 text-lg sm:text-2xl font-bold text-emerald-200 tracking-tight">
            Ubah Pohon Pekarangan Jadi Gaji Pasif Abadi
          </p>

          {/* Description */}
          <p className="mt-3.5 text-xs sm:text-sm lg:text-base text-white/90 font-medium leading-relaxed max-w-2xl mx-auto">
            Disrupsi bursa karbon Indonesia. Menghubungkan pohon pekarangan petani rakyat di lereng Gunung Sindoro dengan bursa karbon global melalui kamera ponsel &amp; satelit ESA Sentinel-2.
          </p>

          {/* CTA Button + Avatar Stack Social Proof */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {/* FarmVista style Capsule button with circular green arrow */}
            <button
              onClick={() => onNavigate('auth', 'farmer')}
              className="group inline-flex items-center bg-white hover:bg-emerald-50 text-[#14382C] font-extrabold text-xs sm:text-sm pl-6 pr-2 py-2 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition-all active:scale-95"
            >
              <span className="mr-3 tracking-tight">Mulai Sebagai Mitra Tani</span>
              <div className="w-9 h-9 rounded-full bg-emerald-500 group-hover:bg-emerald-600 text-white flex items-center justify-center transition-colors shadow-sm">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </button>

            {/* B2B ESG Portal Button */}
            <button
              onClick={() => onNavigate('auth', 'corporate')}
              className="px-6 py-3 rounded-full bg-black/40 hover:bg-black/60 text-white font-extrabold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Portal B2B ESG</span>
            </button>

            {/* Avatar Stack Social Proof */}
            <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/15 px-4 py-2 rounded-full shadow-lg">
              <div className="flex -space-x-2">
                <img src="/pak-joko.jpg" alt="Pak Joko" className="w-7 h-7 rounded-full ring-2 ring-emerald-400 object-cover" />
                <div className="w-7 h-7 rounded-full bg-emerald-700 ring-2 ring-emerald-400 flex items-center justify-center text-[10px] text-white font-bold">JW</div>
                <div className="w-7 h-7 rounded-full bg-[#14382C] ring-2 ring-emerald-400 flex items-center justify-center text-[10px] text-emerald-300 font-bold">TK</div>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">1.850+ Mitra Tani</p>
                <p className="text-[10px] text-emerald-300 font-mono">Dusun Garung, Wonosobo</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* 
        ========================================================================
        BAB 01: REALITAS DI LAPANGAN & DISRUPSI AUDIT (THE HUMAN CONFLICT)
        Bold editorial layout with warm sunlit amber & vibrant pillars
        ========================================================================
      */}
      <section id="bab-realitas" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14382C] tracking-tight leading-[1.12]">
              Biaya Audit Silvikultur Rp 150 Juta. Kami Menghapusnya Menjadi Nol.
            </h2>
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl">
              Petani kecil di Indonesia mengelola lebih dari 14 juta hektar lahan agroforestri produktif. Namun sebelum TaniKarbon, mereka terisolasi total dari bursa karbon global karena mahalnya sertifikasi silvikultur manual oleh konsultan asing yang memakan biaya ratusan juta rupiah.
            </p>
          </div>

          <div className="lg:col-span-5 space-y-4 pt-2">
            <div className="bg-white/95 border border-stone-200/90 hover:border-[#14382C]/30 p-5 rounded-2xl shadow-xs transition-all group">
              <span className="font-mono text-[11px] font-bold text-stone-500 tracking-wider">
                01 / VERIFIKASI KAMERA HP
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#14382C] mt-1">Computer Vision Alometrik Chave Tier-3</h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                Kamera ponsel petani mengestimasi diameter batang (DBH) dan biomassa tajuk pohon dalam 2 detik dengan akurasi 94%.
              </p>
            </div>

            <div className="bg-white/95 border border-stone-200/90 hover:border-[#14382C]/30 p-5 rounded-2xl shadow-xs transition-all group">
              <span className="font-mono text-[11px] font-bold text-stone-500 tracking-wider">
                02 / 88% MASUK KANTONG PETANI
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#14382C] mt-1">Tanpa Calo &amp; Tengkulak Karbon</h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                Dari setiap Rp 160.000/ton kredit yang dibeli korporat ESG, Rp 140.800 cair langsung ke rekening bank lokal &amp; DANA petani.
              </p>
            </div>

            <div className="bg-white/95 border border-stone-200/90 hover:border-[#14382C]/30 p-5 rounded-2xl shadow-xs transition-all group">
              <span className="font-mono text-[11px] font-bold text-stone-500 tracking-wider">
                03 / PENGAWASAN SATELIT 5-HARI
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#14382C] mt-1">Sentinel-2 Anti-Penebangan Liar</h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                Sensor optik multispektral antariksa memverifikasi tutupan klorofil. Jika pohon ditebang, aliran dividen terhenti seketika.
              </p>
            </div>
          </div>
        </div>

        {/* 
          ========================================================================
          BENTO GRID TESTIMONIAL (FarmVista Architecture)
          ========================================================================
        */}
        <div className="mt-14 space-y-5">
          {/* Section Sub-header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[#14382C] tracking-tight">
                Kisah Petani yang Menolak Menebang Pohon
              </h3>
            </div>
          </div>

          {/* Top Row: Photo Card (5 cols) + Dark Pine Testimonial Card (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Card 1: Farmer Photo with Metric Overlay */}
            <div className="lg:col-span-5 rounded-[28px] overflow-hidden relative min-h-[320px] shadow-md border border-stone-200/80 group">
              <img
                src="/pak-joko.jpg"
                alt="Pak Joko Widodo di Pekarangan"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block text-white drop-shadow">
                  45%
                </span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-300">
                  Peningkatan Pendapatan Tunai Tahunan Petani
                </span>
              </div>
            </div>

            {/* Card 2: Dark Pine Green Card with Quotes & Author Profile */}
            <div className="lg:col-span-7 bg-[#14382C] border border-emerald-800/80 rounded-[28px] p-7 sm:p-9 text-white flex flex-col justify-between relative overflow-hidden shadow-lg">
              {/* Subtle top right ambient radial glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="text-4xl sm:text-5xl text-emerald-400 font-serif font-black select-none leading-none mb-3">
                  ““
                </div>
                <blockquote className="text-sm sm:text-base lg:text-lg text-emerald-50 font-normal leading-relaxed">
                  &ldquo;Bagi kami petani di desa, pohon pekarangan itu seperti buku tabungan darurat. Dulu kami terpaksa menebangnya saat anak mau masuk kuliah atau butuh biaya berobat. Sekarang, pohon alpukat ini tetap hidup rindang menaungi kebun kopi kami, dan tiap musim kami terima dividen karbon resmi langsung di rekening BRI tanpa lewat tengkulak.&rdquo;
                </blockquote>
              </div>

              <div className="flex items-center justify-between pt-5 mt-4 border-t border-emerald-800/60 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/pak-joko.jpg"
                    alt="Pak Joko Widodo"
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-400 shadow-md"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">Pak Joko Widodo (52 tahun)</h4>
                    <p className="text-xs text-emerald-300/80 font-mono">Mitra Tani Perintis · Dusun Garung, Wonosobo</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-3 py-1 rounded-full">
                  ID #TK-WNSB-042
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: 3 Bento Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Canopy Tree with Harvest / Shade Metric */}
            <div className="rounded-[28px] overflow-hidden relative min-h-[190px] border border-stone-200/80 shadow-md group">
              <img
                src="/canopy-tree.jpg"
                alt="Tajuk Pohon Alpukat"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-2xl font-black font-mono block text-white drop-shadow">30%</span>
                <span className="text-xs text-emerald-300 font-medium leading-snug block">
                  Kenaikan Kualitas Kopi Berkat Naungan Kanopi
                </span>
              </div>
            </div>

            {/* Card 2: Minimalist Dark Green Metric Card */}
            <div className="bg-[#14382C] text-white p-5 rounded-[28px] border border-emerald-800/80 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                  Satelit Sentinel-2
                </span>
              </div>
              <div className="my-2">
                <span className="text-3xl font-black font-mono text-emerald-300">0.88</span>
                <span className="text-xs font-mono text-emerald-200/80 ml-1">/ 1.00 NDVI</span>
                <p className="text-xs text-stone-200 font-medium mt-1">
                  Kanopi Sehat Terverifikasi Otomatis Tiap 5 Hari
                </p>
              </div>
              <p className="text-[10px] text-emerald-400/80 font-mono">Bebas manipulasi data manual</p>
            </div>

            {/* Card 3: Drone Aerial with Action Link */}
            <div
              onClick={() => document.getElementById('portofolio')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-[28px] overflow-hidden relative min-h-[190px] border border-stone-200/80 shadow-md cursor-pointer group"
            >
              <img
                src="/agri-drone.jpg"
                alt="Drone Pertanian"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block mb-1">
                    Registri Nasional
                  </span>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    <span>Lihat Paspor Pohon</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                  100% Terbuka
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        BAB 02: TIGA BABAK PERJALANAN DARI KEBUN KE BURSA
        Replaces repetitive 3 white cards with a dynamic interactive workbench
        ========================================================================
      */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#14382C] tracking-tight leading-tight">
              Bagaimana Pohon Pekarangan Menjadi Uang Tunai?
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              Dari kebun rakyat di lereng Sindoro menuju registri bursa karbon Indonesia dalam tiga tahap presisi tanpa konsultan mahal.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Interactive Step Selector & Narrative */}
            <div className="lg:col-span-5 space-y-4">
              {/* Step 1 Tab Button (Sky Blue Theme) */}
              <div
                onClick={() => setActiveStep(1)}
                className={`p-6 rounded-[24px] cursor-pointer transition-all border ${
                  activeStep === 1
                    ? 'bg-gradient-to-br from-sky-50 via-white to-blue-50/50 border-sky-400 shadow-[0_8px_24px_rgba(2,132,199,0.15)] ring-2 ring-sky-300/40'
                    : 'bg-white border-stone-200/80 hover:border-sky-300 hover:bg-sky-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                    activeStep === 1 ? 'bg-sky-600 text-white shadow-xs' : 'bg-stone-100 text-slate-700 border border-stone-200'
                  }`}>
                    LANGKAH 01
                  </span>
                  <span className="text-xs font-bold text-sky-800">
                    Tahap Lapangan &amp; GPS
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#14382C]">
                  Petani Memetakan Pekarangan (Geotagging)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Pak Joko cukup berjalan mengitari kebunnya. GPS smartphone mengunci koordinat poligon batas petak polikultur 1.2 Ha secara kriptografis tanpa risiko sengketa tanah.
                </p>
              </div>

              {/* Step 2 Tab Button (Lime / Forest Green Theme) */}
              <div
                onClick={() => setActiveStep(2)}
                className={`p-6 rounded-[24px] cursor-pointer transition-all border ${
                  activeStep === 2
                    ? 'bg-gradient-to-br from-lime-50 via-white to-emerald-50/60 border-lime-400 shadow-[0_8px_24px_rgba(132,204,22,0.18)] ring-2 ring-lime-300/40'
                    : 'bg-white border-stone-200/80 hover:border-lime-300 hover:bg-lime-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                    activeStep === 2 ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-slate-700 border border-stone-200'
                  }`}>
                    LANGKAH 02
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    Computer Vision Tajuk
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#14382C]">
                  Kamera HP Menggantikan Auditor Silvikultur
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Arahkan kamera ke tajuk pohon alpukat pekarangan. Computer Vision mendeteksi spesies, mengukur diameter batang (DBH 38 cm), dan menghitung biomassa 310 kg dalam 2 detik (94% Akurasi).
                </p>
              </div>

              {/* Step 3 Tab Button (Golden Amber Theme) */}
              <div
                onClick={() => setActiveStep(3)}
                className={`p-6 rounded-[24px] cursor-pointer transition-all border ${
                  activeStep === 3
                    ? 'bg-gradient-to-br from-amber-50 via-white to-yellow-50/50 border-amber-400 shadow-[0_8px_24px_rgba(245,158,11,0.18)] ring-2 ring-amber-300/40'
                    : 'bg-white border-stone-200/80 hover:border-amber-300 hover:bg-amber-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                    activeStep === 3 ? 'bg-amber-600 text-white shadow-xs' : 'bg-stone-100 text-slate-700 border border-stone-200'
                  }`}>
                    LANGKAH 03
                  </span>
                  <span className="text-xs font-bold text-amber-800">
                    Dividen Tunai Otomatis
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#14382C]">
                  Paspor Pohon Terbit &amp; Dividen Masuk Dompet
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Paspor digital pohon tercatat di registri SRN-PPI. Korporat membeli kredit offset emisi, dan dividen Rp 280.000 langsung cair ke rekening BRI / DANA petani tiap musim.
                </p>
              </div>
            </div>

            {/* Right Column: Dynamic Living Viewport (Responsive to activeStep) */}
            <div className="lg:col-span-7">
              <div className="rounded-[32px] bg-[#14382C] p-3 sm:p-5 shadow-[0_20px_50px_rgba(20,56,44,0.3)] border border-emerald-800/40 text-white min-h-[460px] flex flex-col justify-between">
                {/* Viewport Top Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-xs font-mono">
                  <span className="font-bold text-emerald-300">
                    {activeStep === 1 ? 'TANIGIS GPS MAP ENGINE' : activeStep === 2 ? 'AI ALOMETRIC VIEWPORT' : 'KLHK PASSPORT REGISTRY'}
                  </span>
                  <span className="text-white/60 text-[11px]">Wonosobo [-7.3639, 109.9000]</span>
                </div>

                {/* Viewport Main Interactive Canvas */}
                <div className="my-3 flex-1 rounded-2xl bg-slate-950 overflow-hidden relative flex items-center justify-center min-h-[360px]">
                  {activeStep === 1 && (
                    <div className="w-full h-full p-4 flex flex-col justify-between relative bg-[#092218]">
                      {/* Grid background */}
                      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #34d399 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                      <div className="flex justify-between items-center relative z-10">
                        <span className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded-full border border-white/20 text-emerald-300">
                          POLIGON KADASTRAL #WNSB-KLS-014
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
                          RTK-GPS ±1.8m
                        </span>
                      </div>

                      {/* Cadastral Polygon Vector Graphics */}
                      <div className="relative h-48 w-full flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 200 120">
                          <polygon
                            points="30,35 90,15 175,40 150,100 45,90"
                            fill="rgba(16,185,129,0.25)"
                            stroke="#10B981"
                            strokeWidth="2.5"
                            strokeDasharray="6 3"
                          />
                          <circle cx="30" cy="35" r="4" fill="#FFFFFF" stroke="#14382C" strokeWidth="2" />
                          <circle cx="90" cy="15" r="4" fill="#FFFFFF" stroke="#14382C" strokeWidth="2" />
                          <circle cx="175" cy="40" r="4" fill="#FFFFFF" stroke="#14382C" strokeWidth="2" />
                          <circle cx="150" cy="100" r="4" fill="#FFFFFF" stroke="#14382C" strokeWidth="2" />
                          <circle cx="45" cy="90" r="4" fill="#FFFFFF" stroke="#14382C" strokeWidth="2" />

                          {/* Center Node Cluster */}
                          <circle cx="90" cy="60" r="6" fill="#34D399" className="animate-ping opacity-60" />
                          <circle cx="90" cy="60" r="3" fill="#10B981" />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-center shadow-md">
                          <p className="text-xs font-mono font-bold text-white">Luas: 1.2 Hektar</p>
                          <p className="text-[10px] font-mono text-emerald-400">8 Petak Polikultur Aktif</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 flex items-center justify-between text-xs font-mono relative z-10">
                        <span>Status Lahan: Hak Milik Adat</span>
                        <span className="text-emerald-400 font-bold">✓ Terverifikasi Tanpa Sengketa</span>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="w-full h-full relative bg-cover bg-center overflow-hidden flex flex-col justify-between p-4" style={{ backgroundImage: "url('/canopy-tree.jpg')" }}>
                      <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

                      <div className="flex justify-between items-center relative z-10">
                        <span className="text-[10px] font-mono bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-400 font-bold">
                          ● AI CANOPY ESTIMATOR
                        </span>
                        <span className="text-[10px] font-mono font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded shadow-sm">
                          94% MATCH (Persea americana)
                        </span>
                      </div>

                      {/* Bounding Box HUD */}
                      <div className="relative mx-auto w-4/5 h-44 border-2 border-emerald-400 rounded-xl p-3 flex flex-col justify-between shadow-[0_0_25px_rgba(52,211,153,0.4)]">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                            Alpukat Mentega (12 Thn)
                          </span>
                          <span className="text-[9px] font-mono text-emerald-300 bg-black/60 px-1.5 py-0.5 rounded">
                            Chave Tier-3
                          </span>
                        </div>
                        <div className="bg-black/80 backdrop-blur-md p-2 rounded-lg border border-emerald-500/30 text-[10px] font-mono flex items-center justify-between">
                          <span>DBH: <strong className="text-white">38.2 cm</strong></span>
                          <span>Tinggi: <strong className="text-white">9.2 m</strong></span>
                          <span>Biomassa: <strong className="text-emerald-400">310 kg</strong></span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/15 flex items-center justify-between text-xs font-mono relative z-10">
                        <span>Kalkulasi Serapan Karbon:</span>
                        <span className="text-emerald-400 font-black">+0.62 Ton CO₂ / tahun</span>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="w-full h-full p-4 flex flex-col justify-between relative bg-slate-900">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded-full border border-white/20 text-emerald-300">
                          PASPOR POHON DIGITAL #TK-AVD-842
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
                          ✓ LUNAS
                        </span>
                      </div>

                      {/* Struk Dividen Digital */}
                      <div className="p-4 bg-white text-slate-900 rounded-2xl border border-stone-200 shadow-md max-w-sm mx-auto w-full">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-bold font-mono">Mitra Penerima</p>
                            <p className="text-sm font-black text-[#14382C]">Pak Joko Widodo</p>
                          </div>
                          <QrCode className="w-7 h-7 text-[#14382C]" />
                        </div>

                        <div className="my-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Kredit Karbon Terjual:</span>
                            <span className="font-mono font-bold">0.62 tCO₂</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Nilai Kotor Bursa:</span>
                            <span className="font-mono">Rp 318.000</span>
                          </div>
                          <div className="flex justify-between text-emerald-700 font-bold pt-1.5 border-t border-dashed border-stone-200">
                            <span>Dividen Bersih 88%:</span>
                            <span className="font-mono text-base font-black">Rp 280.000</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span>Kanal: Bank BRI (BRImo)</span>
                          <span className="text-emerald-700 font-bold">100% Bebas Calo</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 flex items-center justify-between text-xs font-mono">
                        <span>ID Registrasi Nasional:</span>
                        <span className="text-emerald-300 font-bold">SRN-PPI-2026-WNSB-842</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Step Indicator Bar */}
                <div className="flex items-center justify-between px-3 text-[11px] font-mono text-emerald-200/80">
                  <span>Tahap {activeStep} dari 3 · Klik tombol di kiri untuk beralih</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((s) => (
                      <span
                        key={s}
                        onClick={() => setActiveStep(s)}
                        className={`w-6 h-1.5 rounded-full cursor-pointer transition-all ${
                          activeStep === s ? 'bg-emerald-400' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        BAB 03: PENGAWASAN SPASIAL GIS & ORBIT SENTINEL-2 (THE SKY DEFENDER)
        Interactive Leaflet GIS Map, Wonosobo Agroforest, NDVI & Cadastral
        ========================================================================
      */}
      <section id="peta-satelit" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#14382C] tracking-tight leading-tight">
            Pengawasan Satelit Sentinel-2 &amp; Spasial GIS Terpadu
          </h2>
          <p className="mt-2 text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Sensor optik multispektral ESA Sentinel-2 memindai indeks vegetasi klorofil (NDVI 0.88) setiap 5 hari di atas lahan agroforestri Dusun Garung, Wonosobo. Bila pohon ditebang, status tutupan gugur seketika dari registri nasional.
          </p>
        </div>

        <Satellite3DMap />
      </section>

      {/* 
        ========================================================================
        BAB 04: AUDIT & SIMULASI EKONOMI 10 TAHUN (INTERACTIVE STORY SIMULATOR)
        Interactive financial investigation: Tebang Habis vs Dividen Abadi
        ========================================================================
      */}
      <section id="audit-ekonomi" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#14382C] tracking-tight">
            Mengapa Petani Berhenti Menebang Pohon?
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Studi komparasi riil: sebatang pohon ditebang sekali jual VS dirawat dengan dividen karbon dan panen buah abadi.
          </p>
        </div>

        {/* Interactive Story Simulator Slider Container */}
        <div className="mb-10 max-w-3xl mx-auto bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/40 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-[0_12px_36px_rgba(245,158,11,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-bold text-amber-800 tracking-wider uppercase">
                Simulator Interaktif Lahan Rakyat
              </p>
              <h4 className="text-base sm:text-lg font-extrabold text-[#14382C] mt-1">
                Berapa pohon produktif di pekarangan Anda?
              </h4>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-2xl border border-amber-300 shrink-0 shadow-xs">
              <TreePine className="w-5 h-5 text-emerald-800" />
              <span className="font-mono text-2xl font-black text-[#14382C]">
                {storyTreeCount}
              </span>
              <span className="text-xs font-bold text-amber-900">Pohon</span>
            </div>
          </div>

          {/* Slider input with vibrant accent */}
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={storyTreeCount}
            onChange={(e) => setStoryTreeCount(Number(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-rose-200 via-amber-200 to-emerald-300 rounded-lg appearance-none cursor-pointer accent-emerald-600 shadow-inner"
          />
          <div className="flex justify-between text-[11px] font-mono text-stone-600 mt-2.5 font-medium">
            <span className="text-rose-700 font-bold">1 Pohon (Pekarangan)</span>
            <span className="text-amber-800 font-bold">10 Pohon (Kebun Mini)</span>
            <span className="text-emerald-800 font-bold">25 Pohon (1 Ha Sindoro)</span>
          </div>
        </div>

        {/* Side by side comparison cards with live reactive numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Skenario Lama (Tebang Sekali Jual) */}
          <div className="rounded-[32px] p-8 sm:p-10 bg-white border border-stone-200/90 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
                Skenario Lama (Penebangan Kayu)
              </span>

              <h3 className="mt-4 text-2xl font-bold text-stone-800 tracking-tight">
                Tebang Habis {storyTreeCount} Pohon Sekali Jual
              </h3>
              <p className="text-xs text-stone-400 mt-1 font-mono">Kayu gelondongan ke tengkulak lokal</p>

              <div className="mt-6 mb-6 pb-6 border-b border-stone-100">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-stone-800">
                  {formatRupiah(storyTreeCount * 3500000)}
                </div>
                <p className="text-xs font-medium text-stone-500 mt-1">
                  ✕ Diterima sekali · Tahun ke-2 s.d 10 = Rp 0
                </p>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-stone-600">
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500/80 mt-0.5 shrink-0" />
                  <span><strong>Arus kas terputus:</strong> Butuh 12–15 tahun bagi bibit baru untuk tumbuh dewasa kembali.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500/80 mt-0.5 shrink-0" />
                  <span><strong>Degradasi kebun kopi:</strong> Hilangnya kanopi pelindung menyebabkan erosi tanah dan kualitas kopi merosot.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500/80 mt-0.5 shrink-0" />
                  <span><strong>Dipermainkan calo:</strong> Petani tidak memiliki posisi tawar saat butuh uang mendesak.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-stone-100">
              <p className="text-xs font-mono text-stone-500">
                Total Hasil 10 Tahun: <strong className="text-stone-700">{formatRupiah(storyTreeCount * 3500000)}</strong> (Pohon Lenyap)
              </p>
            </div>
          </div>

          {/* Skenario Baru (Model TaniKarbon Dividen Abadi) */}
          <div className="rounded-[32px] p-8 sm:p-10 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/50 border-2 border-emerald-500 shadow-[0_16px_40px_rgba(16,185,129,0.18)] ring-4 ring-emerald-500/15 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#14382C] text-white shadow-xs">
                  Model Dividen Abadi TaniKarbon
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-bold text-[#14382C] tracking-tight">
                Biarkan {storyTreeCount} Pohon Hidup Berdiri
              </h3>
              <p className="text-xs text-emerald-800 font-medium mt-1 font-mono">
                Dividen karbon kuartalan + hasil panen buah berkala
              </p>

              <div className="mt-6 mb-6 pb-6 border-b border-emerald-200">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#14382C]">
                  {formatRupiah(storyTreeCount * 2050000 * 10)}
                </div>
                <p className="text-xs font-extrabold text-emerald-700 mt-1">
                  ✓ {formatRupiah(storyTreeCount * 2050000)} / tahun tunai selama 10 tahun
                </p>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Gaji pasif teratur:</strong> Dividen karbon Rp {formatNumber(storyTreeCount * 450000)}/thn ditransfer langsung ke rekening BRI/DANA petani.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Panen buah berkelanjutan:</strong> Menghasilkan Rp {formatNumber(storyTreeCount * 1600000)}/thn dari panen buah alpukat mentega.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Ekosistem terlindungi:</strong> {storyTreeCount} pohon utuh menaungi tanaman kopi dan mencegah longsor lereng Sindoro.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono font-black text-amber-900 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300">
                Untung Tambahan: +{formatRupiah((storyTreeCount * 2050000 * 10) - (storyTreeCount * 3500000))}
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300 shadow-2xs">
                ROI +485%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        BAB 05: LIVE TREE PASSPORTS & CARBON REGISTRY LEDGER (BUKU KAS DESENTRALISASI)
        Real tangible database records with colorful species badges
        ========================================================================
      */}
      <section id="portofolio" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#14382C] tracking-tight leading-tight">
              Registri Terbuka &amp; Paspor Pohon Digital
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              Data terbuka setiap pohon rakyat di Jawa Tengah yang telah tersertifikasi satelit Sentinel-2 dan menghasilkan dividen aktif.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID pohon atau nama petani..."
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>
        </div>

        {/* Filter Pills dengan aksen warna cerah */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {['All', 'Alpukat Mentega', 'Sengon Laut', 'Kopi Robusta', 'Jati Putih', 'Durian Musang King'].map((cat) => (
            <button
              key={cat}
              onClick={() => setLedgerFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                ledgerFilter === cat
                  ? 'bg-gradient-to-r from-[#14382C] to-emerald-800 text-white border-transparent shadow-sm scale-105'
                  : 'bg-white text-slate-700 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              {cat === 'All' ? 'Semua Pohon (14.200)' : cat}
            </button>
          ))}
        </div>

        {/* Live Ledger Table */}
        <div className="bg-white rounded-[28px] border border-stone-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFDF9] border-b border-stone-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5 font-bold">ID Paspor</th>
                  <th className="py-3.5 px-5 font-bold">Mitra Petani &amp; Desa</th>
                  <th className="py-3.5 px-5 font-bold">Spesies &amp; Parameter</th>
                  <th className="py-3.5 px-5 font-bold">Biomassa &amp; CO₂</th>
                  <th className="py-3.5 px-5 font-bold">Dividen Bersih</th>
                  <th className="py-3.5 px-5 font-bold">Status Satelit</th>
                  <th className="py-3.5 px-5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {TREES_DATA
                  .filter((tree) => {
                    const matchCat = ledgerFilter === 'All' || tree.species === ledgerFilter;
                    const matchQuery =
                      tree.id.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                      tree.species.toLowerCase().includes(ledgerSearch.toLowerCase());
                    return matchCat && matchQuery;
                  })
                  .map((tree) => (
                    <tr
                      key={tree.id}
                      onClick={() => setSelectedTree(tree)}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-5 font-mono font-bold text-[#14382C] whitespace-nowrap">
                        #{tree.id}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-extrabold text-[#14382C]">Pak Joko Widodo</div>
                        <div className="text-[10px] text-slate-400 font-mono">Dusun Garung, Wonosobo</div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 block">{tree.species}</span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {tree.speciesLatin} · DBH {tree.dbh} cm
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap font-mono">
                        <div className="font-bold text-slate-800">{tree.biomass} kg Biomassa</div>
                        <div className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                          +{tree.co2PerYear} tCO₂ / thn
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap font-mono">
                        <span className="text-xs font-black text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">
                          {formatRupiah(tree.annualReward)}
                        </span>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          Sentinel-2 (NDVI 0.88)
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-900 flex items-center justify-end gap-1">
                          <span>Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Paspor Detail Pohon (Tangible Asset Proof) */}
        {selectedTree && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl relative">
              <button
                onClick={() => setSelectedTree(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#EBF3EC] text-[#14382C] flex items-center justify-center font-bold">
                  <TreePine className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">Paspor Pohon Terverifikasi</span>
                  <h3 className="text-lg font-black text-[#14382C]">#{selectedTree.id} · {selectedTree.species}</h3>
                </div>
              </div>

              <div className="p-4 bg-[#F4F6F0] rounded-2xl border border-stone-200/80 space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Latin:</span>
                  <span className="font-bold text-[#14382C] italic">{selectedTree.speciesLatin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Diameter Batang (DBH):</span>
                  <span className="font-bold text-[#14382C]">{selectedTree.dbh} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ketinggian Tajuk:</span>
                  <span className="font-bold text-[#14382C]">{selectedTree.height} meter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Biomassa Kering:</span>
                  <span className="font-bold text-[#14382C]">{selectedTree.biomass} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Serapan Karbon:</span>
                  <span className="font-bold text-emerald-700">{selectedTree.co2PerYear} tCO₂ / tahun</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold">
                  <span className="text-slate-600">Dividen Tahunan Mitra:</span>
                  <span className="text-emerald-700">{formatRupiah(selectedTree.annualReward)} / tahun</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-stone-100">
                <span className="font-mono text-[10px]">Koordinat: -7.3639, 109.9000</span>
                <button
                  onClick={() => setSelectedTree(null)}
                  className="px-4 py-2 rounded-xl bg-[#14382C] text-white font-bold text-xs hover:bg-[#1b4b3b] transition-colors"
                >
                  Tutup Paspor
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 
        ========================================================================
        SECTION PENUTUP: FINAL CTA & TESTIMONI USER-FRIENDLY (Gaya 21st.dev)
        Sederhana, hangat, manusiawi, bebas dari AI-slop & HUD teknis
        ========================================================================
      */}
      <section id="gabung" className="py-20 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[32px] border border-stone-200/90 shadow-[0_16px_50px_rgba(20,56,44,0.06)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">

            {/* Kolom Kiri: CTA Aksi Gotong Royong (7 Kolom) */}
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                  Gerakan Gotong Royong Karbon Desa
                </span>

                <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#14382C] tracking-tight leading-[1.12] mt-4">
                  Siap Mengubah Pohon Menjadi Aset Karbon Abadi?
                </h2>

                <p className="mt-4 text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
                  Bergabunglah bersama 1.850+ mitra tani di lereng Gunung Sindoro. Cukup foto pohon pekarangan Anda lewat kamera ponsel untuk mulai menerima dividen tunai tahunan langsung ke rekening bank.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100 space-y-6">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3.5">
                  <button
                    onClick={() => onNavigate('auth', 'farmer')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#14382C] hover:bg-[#1c4d3d] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Daftarkan Pekarangan Anda</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigate('auth', 'corporate')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#14382C] font-bold text-sm transition-all active:scale-95"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-700" />
                    <span>Jelajahi Portal B2B ESG</span>
                  </button>
                </div>

                {/* Trust strip */}
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs text-stone-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    SRN-PPI KLHK Terdaftar
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    POJK No. 51/2017 ESG
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Bagi Hasil 88% ke Petani
                  </span>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Kartu Testimoni Bersih ala 21st.dev (5 Kolom) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-stone-50/90 via-emerald-50/20 to-white p-8 sm:p-12 flex flex-col justify-between">
              <div>
                {/* Quote Icon & Verified Status */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                    <Quote className="w-5 h-5 fill-emerald-800/15" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white text-emerald-800 border border-emerald-200 shadow-2xs">
                    Mitra Terverifikasi
                  </span>
                </div>

                {/* Testimonial Quote */}
                <blockquote className="text-base sm:text-lg text-stone-800 leading-relaxed font-normal">
                  &ldquo;Dulu pohon alpukat saya tebang saat butuh uang mendesak. Lewat TaniKarbon, pohon itu saya biarkan hidup berdiri — dan tiap tahun menghasilkan gaji pasif yang ditransfer langsung ke rekening BRI saya.&rdquo;
                </blockquote>
              </div>

              {/* Author Profile */}
              <div className="mt-8 pt-6 border-t border-stone-200/70">
                <div className="flex items-center gap-3.5">
                  <img
                    src="/pak-joko.jpg"
                    alt="Pak Joko Widodo"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500 shadow-sm shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div
                    className="w-12 h-12 rounded-full bg-[#14382C] text-emerald-300 font-bold text-sm items-center justify-center hidden shrink-0"
                    aria-hidden="true"
                  >
                    JW
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-stone-900 leading-tight">Pak Joko Widodo</p>
                    <p className="text-xs text-stone-500 mt-0.5">Petani Dusun Garung, Wonosobo</p>
                    <p className="text-[11px] font-mono text-emerald-700 font-semibold mt-1">
                      ID: #TK-WNSB-042 · 12 Pohon Alpukat Terdaftar
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="py-12 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#14382C] text-emerald-400 flex items-center justify-center font-bold">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-[#14382C] tracking-tight">TaniKarbon</span>
              <span className="text-xs text-stone-500 font-mono">Sistem MRV Agroforestri Berbasis AI &amp; Satelit</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span>Terdaftar di SRN-PPI KLHK</span>
              <span>·</span>
              <span>POJK No. 51/2017 Compliant</span>
              <span>·</span>
              <span>Satelit Sentinel-2 Multispectral</span>
              <span>·</span>
              <span className="text-slate-400">© 2026 TaniKarbon Indonesia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
