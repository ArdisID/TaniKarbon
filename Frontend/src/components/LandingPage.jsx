import React, { useState, useEffect } from 'react';
import {
  Leaf, TrendingUp, ArrowRight, TreePine, ShieldCheck,
  MapPin, Smartphone, Globe, ChevronRight, BarChart3,
  Users, DollarSign, ArrowUpRight, CheckCircle2, Award,
  Radio, Check, ArrowDownToLine, Compass, Bell, Activity, Wifi,
  Battery, Crosshair, Layers, Play, CheckCircle, RefreshCw,
  QrCode, ExternalLink, SlidersHorizontal, Eye, ShieldAlert,
  CreditCard, FileText, Quote, ChevronDown, Search, X, CheckSquare,
  BookOpen, Clock, Sparkles, Menu
} from 'lucide-react';
import { formatRupiah, formatNumber, TREES_DATA } from '../data';
import Satellite3DMap from './Satellite3DMap';
import TaniKarbonLogo from './common/TaniKarbonLogo';

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
    <span className="font-sans font-extrabold tracking-tight tabular-nums text-[#14382C]">
      {prefix}{formatted}{suffix}
    </span>
  );
}

export default function LandingPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('home');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [phoneWallet, setPhoneWallet] = useState(3250000);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeNdviLayer, setActiveNdviLayer] = useState(true);
  const [activeOffsetTon, setActiveOffsetTon] = useState(50);
  const [activeStep, setActiveStep] = useState(1);
  const [ledgerFilter, setLedgerFilter] = useState('All');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [selectedTree, setSelectedTree] = useState(null);
  const [storyTreeCount, setStoryTreeCount] = useState(5);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        1. FLOATING PILL NAVBAR FLEKSIBEL DENGAN LOGO RESMI TANIKARBON & MOBILE DRAWER
        ========================================================================
      */}
      <header className="fixed top-3 sm:top-5 inset-x-0 z-[9999] px-3 sm:px-4 pointer-events-none flex justify-center transition-all duration-300">
        <div className="w-full max-w-4xl relative">
          <nav className="w-full mx-auto px-3.5 sm:px-6 py-2 sm:py-2.5 bg-white/95 backdrop-blur-xl rounded-full border border-stone-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.08)] flex items-center justify-between pointer-events-auto font-sans transition-all">
            {/* Kolom Kiri: Brand Logo Baru TaniKarbon */}
            <div
              className="flex items-center shrink-0 cursor-pointer"
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <TaniKarbonLogo size={28} showText={true} textVariant="dark" />
            </div>

            {/* Kolom Tengah: Menu Navigasi Desktop */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-full bg-stone-100/70 border border-stone-200/60 text-xs font-medium text-stone-600">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('how-it-works');
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-full hover:text-stone-900 hover:bg-white transition-all font-semibold text-xs whitespace-nowrap cursor-pointer"
              >
                Alur Petani
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('satelit');
                  document.getElementById('peta-satelit')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-full hover:text-stone-900 hover:bg-white transition-all font-semibold text-xs whitespace-nowrap cursor-pointer"
              >
                Satelit
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('audit');
                  document.getElementById('audit-ekonomi')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-full hover:text-stone-900 hover:bg-white transition-all font-semibold text-xs whitespace-nowrap cursor-pointer"
              >
                Simulasi
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('portofolio');
                  document.getElementById('portofolio')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-full hover:text-stone-900 hover:bg-white transition-all font-semibold text-xs whitespace-nowrap cursor-pointer"
              >
                Registri
              </button>
            </div>

            {/* Kolom Kanan: Tombol Aksi & Mobile Hamburger Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('auth');
                }}
                className="bg-[#14382C] hover:bg-[#1c4d3d] text-white text-xs font-bold px-3.5 sm:px-5 py-2 rounded-full transition-all whitespace-nowrap shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <span className="hidden sm:inline">Masuk / Daftar</span>
                <span className="sm:hidden">Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Hamburger Button untuk Mobile */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition active:scale-95 cursor-pointer border border-stone-200/80 flex items-center justify-center"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4 text-stone-900" />
                ) : (
                  <Menu className="w-4 h-4 text-stone-900" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Navigation Drawer Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 mt-2 p-4 bg-white/98 backdrop-blur-2xl rounded-[28px] border border-stone-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.18)] animate-fade-in font-sans space-y-3 pointer-events-auto">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-left transition border border-stone-100 cursor-pointer"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Alur Kerja</span>
                  <span className="text-xs font-bold text-slate-800">Alur Petani</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.getElementById('peta-satelit')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-left transition border border-stone-100 cursor-pointer"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">Sentinel-2</span>
                  <span className="text-xs font-bold text-slate-800">Peta Satelit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.getElementById('audit-ekonomi')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-left transition border border-stone-100 cursor-pointer"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Kalkulator</span>
                  <span className="text-xs font-bold text-slate-800">Simulasi Dividen</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.getElementById('portofolio')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-left transition border border-stone-100 cursor-pointer"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Bursa SRN-PPI</span>
                  <span className="text-xs font-bold text-slate-800">Registri Klaster</span>
                </button>
              </div>

              {/* Portal Shortcuts */}
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2 px-1">
                  Akses Portal Langsung
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-medium text-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('auth', 'farmer');
                    }}
                    className="p-2 rounded-xl hover:bg-stone-50 text-left text-emerald-800 font-semibold cursor-pointer"
                  >
                    🌱 Portal Petani
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('auth', 'corporate');
                    }}
                    className="p-2 rounded-xl hover:bg-stone-50 text-left text-sky-900 font-semibold cursor-pointer"
                  >
                    🏢 Portal Korporat ESG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('surveyor');
                    }}
                    className="p-2 rounded-xl hover:bg-stone-50 text-left text-slate-800 font-semibold cursor-pointer"
                  >
                    🧭 Portal Surveyor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('admin');
                    }}
                    className="p-2 rounded-xl hover:bg-stone-50 text-left text-amber-900 font-semibold cursor-pointer"
                  >
                    🛡️ Administrator
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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
        Soft sunlit morning mist dissolve into #FAFDF9 + Editorial Typography
        ========================================================================
      */}
      <section
        className="w-full relative overflow-hidden bg-cover bg-center min-h-[680px] sm:min-h-[760px] lg:min-h-[840px] flex flex-col justify-center pt-36 sm:pt-44 pb-32 sm:pb-44"
        style={{
          backgroundImage: "url('/hero-landscape.png')",
        }}
      >
        {/* Subtle contrast dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/60 pointer-events-none" />

        {/* Multi-stop smooth bottom fade out directly into #FAFDF9 (Seamless Section Blend) */}
        <div className="absolute inset-x-0 bottom-0 h-48 sm:h-72 lg:h-96 bg-gradient-to-t from-[#FAFDF9] via-[#FAFDF9]/85 via-[#FAFDF9]/35 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-24 sm:h-36 bg-gradient-to-t from-[#FAFDF9] to-transparent pointer-events-none z-10" />

        {/* Center Hero Content (Full Bleed Canvas, Clean Typography) */}
        <div className="relative z-20 text-center max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-white">
          {/* Giant Title */}
          <h1 className="text-5xl sm:text-7xl lg:text-[88px] font-black tracking-tight leading-[0.96] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] font-sans">
            Tani<span className="text-emerald-400">Karbon</span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-4 sm:mt-6 text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug max-w-2xl mx-auto drop-shadow-[0_4px_24px_rgba(0,0,0,0.75)] font-sans text-balance">
            Ubah Pohon Pekarangan Jadi{' '}
            <span className="text-emerald-300">Gaji Pasif Abadi</span>
          </p>

          {/* Description */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-white/90 font-medium leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] font-sans text-balance">
            Demokratisasi bursa karbon Indonesia. Menghubungkan pohon pekarangan petani rakyat di lereng Gunung Sindoro dengan bursa karbon nasional melalui <span className="text-white font-bold">Agregasi Klaster Spasial</span> &amp; <span className="text-white font-bold">Verifikasi Satelit Sentinel-2</span> tanpa calo.
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

            {/* Surveyor Field Portal Button */}
            <button
              onClick={() => onNavigate('surveyor')}
              className="px-5 py-3 rounded-full bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 font-extrabold text-xs sm:text-sm border border-emerald-500/40 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Portal Surveyor Lapangan</span>
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
                <p className="text-[10px] text-emerald-300 font-sans">Dusun Garung, Wonosobo</p>
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
      <section id="bab-realitas" className="relative z-20 pt-8 sm:pt-14 pb-20 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            {/* Editorial Kicker Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-200/80 text-stone-700 text-[11px] font-bold uppercase tracking-wider mb-4 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>01 / DISRUPSI MRV ALOMETRIK</span>
            </div>

            {/* Main Headline with High Contrast Strikethrough vs Vibrant Solution */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14382C] tracking-tight leading-[1.15] font-sans">
              <span className="line-through decoration-rose-500/80 decoration-[3.5px] text-stone-400 block sm:inline">
                Biaya Audit Silvikultur Rp 150 Juta.
              </span>{' '}
              <span className="block mt-2 sm:mt-1">
                Kami Menghapusnya{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent underline decoration-emerald-400/80 decoration-wavy underline-offset-8 italic font-serif font-normal">
                  Menjadi Nol.
                </span>
              </span>
            </h2>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl">
              Petani kecil di Indonesia mengelola lebih dari 14 juta hektar lahan agroforestri produktif. Namun sebelum TaniKarbon, mereka terisolasi total dari bursa karbon global karena mahalnya sertifikasi silvikultur manual oleh konsultan asing yang memakan biaya ratusan juta rupiah.
            </p>
          </div>

          <div className="lg:col-span-5 space-y-4 pt-2">
            <div className="bg-white/95 border border-stone-200/90 hover:border-[#14382C]/30 p-5 rounded-2xl shadow-xs transition-all group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-sans text-[11px] font-extrabold uppercase text-emerald-800 tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                  01 · AGREGASI KLASTER OTOMATIS
                </span>
                <span className="text-[11px] font-bold text-emerald-700 font-sans tabular-nums">Standar ISO 14064-2</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#14382C]">Agregasi Klaster Kuota 500+ tCO2e</h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed font-sans">
                Mengelompokkan ratusan pekarangan rakyat menjadi satu kesatuan klaster terverifikasi SRN-PPI, memangkas biaya sertifikasi konsultan asing Rp 150 juta menjadi Rp 0.
              </p>
            </div>

            <div className="bg-white/95 border border-stone-200/90 hover:border-[#14382C]/30 p-5 rounded-2xl shadow-xs transition-all group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-sans text-[11px] font-extrabold uppercase text-amber-900 tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  02 · 88% MASUK KANTONG PETANI
                </span>
                <span className="text-[11px] font-bold text-amber-800 font-sans tabular-nums">Rp 140.800/tCO2e</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#14382C]">Tanpa Calo &amp; Bebas Tengkulak Karbon</h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed font-sans">
                Dari setiap Rp 160.000/ton kredit yang dibeli korporat ESG, Rp 140.800 cair langsung ke rekening bank lokal &amp; dompet DANA petani.
              </p>
            </div>

            <div className="bg-white/95 border border-stone-200/90 hover:border-[#14382C]/30 p-5 rounded-2xl shadow-xs transition-all group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-sans text-[11px] font-extrabold uppercase text-sky-900 tracking-wider bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  03 · PENGAWASAN SATELIT 5-HARI
                </span>
                <span className="text-[11px] font-bold text-sky-800 font-sans tabular-nums">NDVI 0.88</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#14382C]">Sentinel-2 Anti-Penebangan Liar</h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed font-sans">
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
          {/* Section Sub-header with kicker */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-200/80 text-stone-700 text-[11px] font-bold uppercase tracking-wider mb-2 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>DAMPAK SOSIAL &amp; EKONOMI PEDESAAN</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#14382C] tracking-tight font-sans">
                Kisah Nyata Petani yang Menolak Menebang Pohon
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
                <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight block text-white drop-shadow tabular-nums">
                  45%
                </span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-300 font-sans">
                  Peningkatan Pendapatan Tunai Tahunan Petani
                </span>
              </div>
            </div>

            {/* Card 2: Dark Pine Green Card with Quotes & Author Profile */}
            <div className="lg:col-span-7 bg-[#14382C] border border-emerald-800/80 rounded-[28px] p-7 sm:p-9 text-white flex flex-col justify-between relative overflow-hidden shadow-lg font-sans">
              {/* Subtle top right ambient radial glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="text-5xl sm:text-6xl text-emerald-400 font-serif font-black select-none leading-none mb-3 opacity-60">
                  “
                </div>
                <blockquote className="text-base sm:text-xl lg:text-2xl text-emerald-50 font-serif italic font-normal leading-relaxed">
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
                    <h4 className="text-sm font-bold text-white font-sans">Pak Joko Widodo (52 tahun)</h4>
                    <p className="text-xs text-emerald-300/80 font-sans">Mitra Tani Perintis · Dusun Garung, Wonosobo</p>
                  </div>
                </div>
                <span className="text-[11px] font-sans font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-3 py-1 rounded-full tabular-nums">
                  ID #TK-WNSB-042
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: 3 Bento Metric Cards (Autentik & Bebas AI Slop) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
            {/* Card 1: Agroforestri Polikultur Nyata */}
            <div className="rounded-[28px] overflow-hidden relative min-h-[220px] border border-stone-200/80 shadow-md group">
              <img
                src="/canopy-tree.jpg"
                alt="Tajuk Pohon Agroforestri"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
              <div className="absolute top-4 left-4">
                <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-400/30">
                  Agroforestri Polikultur
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-2xl sm:text-3xl font-black font-sans block text-white drop-shadow tabular-nums">+30%</span>
                <p className="text-xs text-emerald-200 font-semibold leading-snug mt-0.5 font-sans">
                  Kenaikan Kualitas Kopi Rakyat Berkat Naungan Kanopi Alami
                </p>
              </div>
            </div>

            {/* Card 2: Monitoring Satelit Sentinel-2 dengan Spektrum NDVI */}
            <div className="bg-[#14382C] text-white p-5 sm:p-6 rounded-[28px] border border-emerald-800/80 flex flex-col justify-between shadow-md relative overflow-hidden font-sans group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-300">
                      Satelit Sentinel-2 L2A
                    </span>
                  </div>
                  <span className="text-[10px] font-sans font-semibold text-emerald-300/80 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 tabular-nums">
                    Orbit Tiap 5 Hari
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black font-sans text-white tabular-nums tracking-tight">0.88</span>
                    <span className="text-xs font-sans text-emerald-300 tabular-nums font-bold">/ 1.00 NDVI</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1 font-sans">
                    Kerapatan kanopi sehat &amp; bebas deforestasi
                  </p>
                </div>
              </div>

              {/* Bar Spektrum NDVI Multi-warna */}
              <div className="mt-4 pt-3 border-t border-emerald-800/60">
                <div className="flex justify-between text-[9px] font-sans font-semibold text-emerald-300/70 mb-1">
                  <span>0.2 Kering</span>
                  <span className="text-emerald-300 font-bold">0.88 Tajuk Lebat</span>
                  <span>1.0 Hutan</span>
                </div>
                <div className="h-2 w-full rounded-full ndvi-gradient relative overflow-hidden shadow-inner">
                  <div 
                    className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-md -translate-x-1/2"
                    style={{ left: '88%' }}
                  />
                </div>
                <p className="text-[10px] text-emerald-400/90 font-sans mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Validasi pita spektral NIR (B8/B4)</span>
                </p>
              </div>
            </div>

            {/* Card 3: Paspor Karbon Digital SRN-PPI Nasional (Menggantikan Drone Fiktif) */}
            <div
              onClick={() => document.getElementById('portofolio')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white rounded-[28px] border border-stone-200/90 hover:border-emerald-500/60 p-5 sm:p-6 shadow-md cursor-pointer group flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl font-sans relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-400/15 transition-colors" />

              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>Registri SRN-PPI</span>
                  </span>
                  <span className="text-[10px] font-sans font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                    #KLST-WNSB-042
                  </span>
                </div>

                {/* Info Klaster */}
                <div className="mt-3.5 space-y-1">
                  <h4 className="text-sm sm:text-base font-extrabold text-[#14382C] group-hover:text-emerald-700 transition-colors leading-snug">
                    Klaster Agroforestri Wonosobo
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Dusun Garung · 48 Petani Rakyat
                  </p>
                </div>

                {/* Kuota Kupon Metrik */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-sans text-slate-400 block font-semibold">KUOTA TERCATAT</span>
                    <strong className="text-xs sm:text-sm font-sans font-extrabold text-slate-900 tabular-nums">
                      5.200 <span className="text-xs font-bold text-slate-500">tCO2e</span>
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-sans text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block">
                      Terbit Bursa
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-[#14382C] group-hover:text-emerald-700 transition-colors">
                    Buka Paspor Digital
                  </span>
                </div>
                <span className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#14382C] group-hover:text-white text-slate-600 flex items-center justify-center transition-all">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-100 text-stone-700 text-[11px] font-bold uppercase tracking-wider mb-3 font-sans border border-stone-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>02 / ALUR KERJA END-TO-END</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#14382C] tracking-tight leading-tight font-sans">
              Bagaimana Pohon Pekarangan Menjadi{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent italic font-serif font-normal">
                Uang Tunai?
              </span>
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed font-sans">
              Dari kebun rakyat di lereng Sindoro menuju registri bursa karbon Indonesia dalam tiga tahap presisi tanpa konsultan mahal.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Interactive Step Selector & Narrative */}
            <div className="lg:col-span-5 space-y-4">
              {/* Step 1 Tab Button (Sky Blue Theme) */}
              <div
                onClick={() => setActiveStep(1)}
                className={`p-6 rounded-[24px] cursor-pointer transition-all border font-sans ${
                  activeStep === 1
                    ? 'bg-gradient-to-br from-sky-50 via-white to-blue-50/50 border-sky-400 shadow-[0_8px_24px_rgba(2,132,199,0.15)] ring-2 ring-sky-300/40'
                    : 'bg-white border-stone-200/80 hover:border-sky-300 hover:bg-sky-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-sans font-bold px-2.5 py-0.5 rounded-full ${
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

              {/* Step 2 Tab Button (Emerald / Forest Theme) */}
              <div
                onClick={() => setActiveStep(2)}
                className={`p-6 rounded-[24px] cursor-pointer transition-all border font-sans ${
                  activeStep === 2
                    ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 border-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.18)] ring-2 ring-emerald-300/40'
                    : 'bg-white border-stone-200/80 hover:border-emerald-300 hover:bg-emerald-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-sans font-bold px-2.5 py-0.5 rounded-full ${
                    activeStep === 2 ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-slate-700 border border-stone-200'
                  }`}>
                    LANGKAH 02
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    Audit Lapangan &amp; Radar Satelit
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#14382C]">
                  Validasi Surveyor Resmi &amp; Sentinel-2
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Surveyor bersertifikat memvalidasi spesimen pohon dengan geofencing GPS RTK. Data kerapatan kanopi dikonfirmasi silang secara objektif oleh konstelasi satelit Sentinel-2.
                </p>
              </div>

              {/* Step 3 Tab Button (Golden Amber Theme) */}
              <div
                onClick={() => setActiveStep(3)}
                className={`p-6 rounded-[24px] cursor-pointer transition-all border font-sans ${
                  activeStep === 3
                    ? 'bg-gradient-to-br from-amber-50 via-white to-yellow-50/50 border-amber-400 shadow-[0_8px_24px_rgba(245,158,11,0.18)] ring-2 ring-amber-300/40'
                    : 'bg-white border-stone-200/80 hover:border-amber-300 hover:bg-amber-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-sans font-bold px-2.5 py-0.5 rounded-full ${
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
            <div className="lg:col-span-7 font-sans">
              <div className="rounded-[32px] bg-[#14382C] p-3 sm:p-5 shadow-[0_20px_50px_rgba(20,56,44,0.3)] border border-emerald-800/40 text-white min-h-[460px] flex flex-col justify-between">
                {/* Viewport Top Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-xs font-sans">
                  <span className="font-bold text-emerald-300">
                    {activeStep === 1 ? 'TANIGIS GPS MAP ENGINE' : activeStep === 2 ? 'SURVEYOR GEOFENCING & SENTINEL-2 NDVI' : 'KLHK PASSPORT REGISTRY'}
                  </span>
                  <span className="text-white/60 text-[11px]">Wonosobo [-7.3639, 109.9000]</span>
                </div>

                {/* Viewport Main Interactive Canvas */}
                <div className="my-3 flex-1 rounded-2xl bg-slate-950 overflow-hidden relative flex items-center justify-center min-h-[360px]">
                  {activeStep === 1 && (
                    <div className="w-full h-full p-4 flex flex-col justify-between relative bg-[#092218]">
                      {/* Grid background */}
                      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #34d399 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                      <div className="flex justify-between items-center relative z-10 font-sans">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full border border-white/20 text-emerald-300">
                          POLIGON KADASTRAL #WNSB-KLS-014
                        </span>
                        <span className="text-[10px] font-sans font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded tabular-nums">
                          RTK-GPS ±1.8m
                        </span>
                      </div>

                      {/* Cadastral Polygon Vector Graphics */}
                      <div className="relative h-48 w-full flex items-center justify-center font-sans">
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
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-center shadow-md font-sans">
                          <p className="text-xs font-sans font-bold text-white tabular-nums">Luas: 1.2 Hektar</p>
                          <p className="text-[10px] font-sans text-emerald-400 font-semibold tabular-nums">8 Petak Polikultur Aktif</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 flex items-center justify-between text-xs font-sans relative z-10">
                        <span>Status Lahan: Hak Milik Adat</span>
                        <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Terverifikasi Tanpa Sengketa</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="w-full h-full relative bg-slate-900 overflow-hidden flex flex-col justify-between p-4 font-sans">
                      {/* Background radar grid effect */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10B981 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none"></div>

                      <div className="flex justify-between items-center relative z-10 font-sans">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>GEOFENCING SURVEYOR: VALID (&le;50M)</span>
                        </span>
                        <span className="text-[10px] font-sans font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded shadow-sm tabular-nums">
                          SENTINEL-2 NDVI: 0.88
                        </span>
                      </div>

                      {/* Ground-Check & Satellite Cross-Verification HUD */}
                      <div className="relative mx-auto w-full max-w-md border border-emerald-500/30 bg-slate-950/90 rounded-2xl p-4 flex flex-col justify-between shadow-2xl backdrop-blur-md font-sans space-y-3 z-10">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div>
                            <span className="text-[10px] font-sans text-emerald-400 font-bold uppercase tracking-wider">
                              Ground-Check Audit Fisik
                            </span>
                            <p className="text-xs font-bold text-white mt-0.5">
                              Klaster Sukamaju · Petak #04
                            </p>
                          </div>
                          <span className="text-[10px] font-sans font-bold text-slate-400 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                            Auditor: DLHK Jateng
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                            <span className="text-[10px] text-slate-400 block font-sans">PITA UKUR DBH</span>
                            <strong className="text-white text-xs font-sans tabular-nums font-bold">38.2 cm</strong>
                          </div>
                          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                            <span className="text-[10px] text-slate-400 block font-sans">TINGGI TAJUK</span>
                            <strong className="text-white text-xs font-sans tabular-nums font-bold">9.4 meter</strong>
                          </div>
                          <div className="bg-emerald-950/60 p-2 rounded-xl border border-emerald-500/30">
                            <span className="text-[10px] text-emerald-400 block font-sans">BIOMASSA CHAVE</span>
                            <strong className="text-emerald-300 text-xs font-sans tabular-nums font-bold">310 kg</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-sans">
                          <span className="text-slate-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Spesies Terverifikasi: Alpukat &amp; Sengon</span>
                          </span>
                          <span className="text-emerald-400 font-bold tabular-nums">
                            ISO 14064-2 Compliant
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/15 flex items-center justify-between text-xs font-sans relative z-10">
                        <span className="text-slate-300">Kalkulasi Serapan Karbon Klaster:</span>
                        <span className="text-emerald-400 font-extrabold tabular-nums">+0.62 Ton CO₂ / pohon / tahun</span>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="w-full h-full p-4 flex flex-col justify-between relative bg-slate-900 font-sans">
                      <div className="flex justify-between items-center font-sans">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full border border-white/20 text-emerald-300">
                          PASPOR POHON DIGITAL #TK-AVD-842
                        </span>
                        <span className="text-[10px] font-sans font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
                          LUNAS
                        </span>
                      </div>

                      {/* Struk Dividen Digital */}
                      <div className="p-4 bg-white text-slate-900 rounded-2xl border border-stone-200 shadow-md max-w-sm mx-auto w-full font-sans">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                          <div>
                            <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-stone-500">Mitra Penerima</p>
                            <p className="text-sm font-black text-[#14382C]">Pak Joko Widodo</p>
                          </div>
                          <QrCode className="w-7 h-7 text-[#14382C]" />
                        </div>

                        <div className="my-3 space-y-1 text-xs font-sans">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Kredit Karbon Terjual:</span>
                            <span className="font-sans font-bold tabular-nums">0.62 tCO₂</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Nilai Kotor Bursa:</span>
                            <span className="font-sans font-bold text-slate-700 tabular-nums">Rp 318.000</span>
                          </div>
                          <div className="flex justify-between text-emerald-700 font-bold pt-1.5 border-t border-dashed border-stone-200">
                            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Dividen Bersih 88%:</span>
                            <span className="font-sans text-base font-extrabold text-emerald-700 tabular-nums">Rp 280.000</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[9px] font-sans text-slate-500">
                          <span>Kanal: Bank BRI (BRImo)</span>
                          <span className="text-emerald-700 font-bold">100% Bebas Calo</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 flex items-center justify-between text-xs font-sans">
                        <span>ID Registrasi Nasional:</span>
                        <span className="text-emerald-300 font-bold">SRN-PPI-2026-WNSB-842</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Step Indicator Bar */}
                <div className="flex items-center justify-between px-3 text-[11px] font-sans text-emerald-200/80">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-200/80 text-stone-700 text-[11px] font-bold uppercase tracking-wider mb-3 font-sans">
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            <span>03 / TELEMETRI ORBITAL SENTINEL-2</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#14382C] tracking-tight leading-tight font-sans">
            Pengawasan Satelit Sentinel-2 &amp;{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 bg-clip-text text-transparent italic font-serif font-normal">
              Spasial GIS Terpadu.
            </span>
          </h2>
          <p className="mt-2 text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed font-sans">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-100/90 text-amber-900 text-[11px] font-bold uppercase tracking-wider mb-3 font-sans border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>04 / STUDI INVESTASI 10 TAHUN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#14382C] tracking-tight font-sans">
            Mengapa Petani Berhenti{' '}
            <span className="line-through decoration-rose-500/80 decoration-[3px] text-stone-400">
              Menebang
            </span>{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-700 bg-clip-text text-transparent italic font-serif font-normal">
              Pohon?
            </span>
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed font-sans">
            Studi komparasi riil: sebatang pohon ditebang sekali jual VS dirawat dengan dividen karbon dan panen buah abadi.
          </p>
        </div>

        {/* Interactive Story Simulator Slider Container */}
        <div className="mb-10 max-w-3xl mx-auto bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/40 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-[0_12px_36px_rgba(245,158,11,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-bold text-amber-800 tracking-wider uppercase font-sans">
                Simulator Interaktif Lahan Rakyat
              </p>
              <h4 className="text-base sm:text-lg font-extrabold text-[#14382C] mt-1 font-sans">
                Berapa pohon produktif di pekarangan Anda?
              </h4>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-2xl border border-amber-300 shrink-0 shadow-xs">
              <TreePine className="w-5 h-5 text-emerald-800" />
              <span className="font-sans text-2xl font-black text-[#14382C] tabular-nums">
                {storyTreeCount}
              </span>
              <span className="text-xs font-bold text-amber-900 font-sans">Pohon</span>
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
          <div className="flex justify-between text-[11px] font-sans text-stone-600 mt-2.5 font-medium">
            <span className="text-rose-700 font-bold">1 Pohon (Pekarangan)</span>
            <span className="text-amber-800 font-bold">10 Pohon (Kebun Mini)</span>
            <span className="text-emerald-800 font-bold">25 Pohon (1 Ha Sindoro)</span>
          </div>
        </div>

        {/* Side by side comparison cards with live reactive numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto font-sans">
          {/* Skenario Lama (Tebang Sekali Jual) */}
          <div className="rounded-[32px] p-8 sm:p-10 bg-white border border-stone-200/90 shadow-xs relative overflow-hidden flex flex-col justify-between font-sans">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200 font-sans">
                Skenario Lama (Penebangan Kayu)
              </span>

              <h3 className="mt-4 text-2xl font-bold text-stone-800 tracking-tight font-sans">
                Tebang Habis {storyTreeCount} Pohon Sekali Jual
              </h3>
              <p className="text-xs text-stone-400 mt-1 font-sans">Kayu gelondongan ke tengkulak lokal</p>

              <div className="mt-6 mb-6 pb-6 border-b border-stone-100">
                <div className="flex items-baseline font-sans">
                  <span className="text-xl lg:text-2xl font-bold text-stone-500 mr-1.5 font-sans">Rp</span>
                  <span className="text-3xl sm:text-4xl font-extrabold text-stone-800 tracking-tight font-sans tabular-nums">
                    {formatNumber(storyTreeCount * 3500000)}
                  </span>
                </div>
                <p className="text-xs font-medium text-stone-500 mt-1 font-sans">
                  Diterima sekali · Tahun ke-2 s.d 10 = Rp 0
                </p>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-stone-600 font-sans">
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
              <p className="text-xs font-sans text-stone-500 tabular-nums">
                Total Hasil 10 Tahun: <strong className="text-stone-700">{formatRupiah(storyTreeCount * 3500000)}</strong> (Pohon Lenyap)
              </p>
            </div>
          </div>

          {/* Skenario Baru (Model TaniKarbon Dividen Abadi) */}
          <div className="rounded-[32px] p-8 sm:p-10 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/50 border-2 border-emerald-500 shadow-[0_16px_40px_rgba(16,185,129,0.18)] ring-4 ring-emerald-500/15 relative overflow-hidden flex flex-col justify-between font-sans">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#14382C] text-white shadow-xs font-sans">
                  Model Dividen Abadi TaniKarbon
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-bold text-[#14382C] tracking-tight font-sans">
                Biarkan {storyTreeCount} Pohon Hidup Berdiri
              </h3>
              <p className="text-xs text-emerald-800 font-medium mt-1 font-sans">
                Dividen karbon kuartalan + hasil panen buah berkala
              </p>

              <div className="mt-6 mb-6 pb-6 border-b border-emerald-200">
                <div className="flex items-baseline font-sans">
                  <span className="text-xl lg:text-2xl font-bold text-emerald-800/80 mr-1.5 font-sans">Rp</span>
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#14382C] tracking-tight font-sans tabular-nums">
                    {formatNumber(storyTreeCount * 2050000 * 10)}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-emerald-700 mt-1 font-sans inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{formatRupiah(storyTreeCount * 2050000)} / tahun tunai selama 10 tahun</span>
                </p>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 font-sans">
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

            <div className="mt-8 pt-4 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2 font-sans">
              <span className="text-xs font-sans font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300 tabular-nums">
                Untung Tambahan: +{formatRupiah((storyTreeCount * 2050000 * 10) - (storyTreeCount * 3500000))}
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300 shadow-2xs font-sans">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-200/80 text-stone-700 text-[11px] font-bold uppercase tracking-wider mb-3 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>05 / BUKU KAS DESENTRALISASI &amp; SRN-PPI</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#14382C] tracking-tight leading-tight font-sans">
              Registri Terbuka &amp;{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent italic font-serif font-normal">
                Paspor Pohon Digital.
              </span>
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed font-sans">
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
                <tr className="bg-[#FAFDF9] border-b border-stone-200/80 font-sans text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
                      <td className="py-4 px-5 font-sans font-bold text-[#14382C] whitespace-nowrap tabular-nums">
                        #{tree.id}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-extrabold text-[#14382C]">Pak Joko Widodo</div>
                        <div className="text-[11px] text-slate-400 font-sans">Dusun Garung, Wonosobo</div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 block">{tree.species}</span>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5 tabular-nums">
                          {tree.speciesLatin} · DBH {tree.dbh} cm
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap font-sans tabular-nums">
                        <div className="font-bold text-slate-800">{tree.biomass} kg Biomassa</div>
                        <div className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5 font-sans tabular-nums">
                          +{tree.co2PerYear} tCO₂ / thn
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap font-sans">
                        <span className="text-xs font-black text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs tabular-nums">
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
                  <span className="text-[11px] font-sans text-emerald-700 font-bold uppercase tracking-wider">Paspor Pohon Terverifikasi</span>
                  <h3 className="text-lg font-black text-[#14382C]">#{selectedTree.id} · {selectedTree.species}</h3>
                </div>
              </div>

              <div className="p-4 bg-[#F4F6F0] rounded-2xl border border-stone-200/80 space-y-2 text-xs font-sans tabular-nums mb-4">
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
                <span className="font-sans text-[11px] text-slate-500 tabular-nums">Koordinat: -7.3639, 109.9000</span>
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
                <span className="text-xs font-sans font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                  Gerakan Gotong Royong Karbon Desa
                </span>

                <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#14382C] tracking-tight leading-[1.12] mt-4 font-sans">
                  Siap Mengubah Pohon Menjadi{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent italic font-serif font-normal">
                    Aset Karbon Abadi?
                  </span>
                </h2>

                <p className="mt-4 text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
                  Bergabunglah bersama 1.850+ mitra tani di lereng Gunung Sindoro. Daftarkan petak pekarangan pohon Anda dalam hitungan menit untuk mulai menerima dividen tunai tahunan langsung ke rekening bank &amp; e-wallet.
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
                  <span className="px-3 py-1 rounded-full text-[11px] font-sans font-bold bg-white text-emerald-800 border border-emerald-200 shadow-2xs">
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
                    <p className="text-[11px] font-sans text-emerald-700 font-semibold mt-1 tabular-nums">
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
            <div className="flex items-center gap-3">
              <TaniKarbonLogo size={32} showText={true} textVariant="dark" subtitle="Sistem MRV Agroforestri AI & Satelit" />
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
