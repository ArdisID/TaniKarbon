# 🌿 TaniKarbon — Agroforestry Carbon MRV & Fair-Trade Offset Platform

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Sentinel-2](https://img.shields.io/badge/Satellite-Sentinel--2%20NDVI-10B981)](https://sentinels.copernicus.eu/)
[![SRN-PPI](https://img.shields.io/badge/Compliance-SRN--PPI%20KLHK-14382C)](https://srn.menlhk.go.id/)
[![POJK 51](https://img.shields.io/badge/Regulation-POJK%20No.%2051%2F2017-059669)](https://www.ojk.go.id/)

> **TaniKarbon** adalah platform MRV (*Measurement, Reporting, Verification*) karbon berbasis AI dan citra satelit multispektral (ESA Sentinel-2) yang menghubungkan petani agroforestri rakyat Indonesia dengan pembeli kredit karbon korporat institusional melalui prinsip **Fair-Trade 88% — 12%**.

---

## 🚀 Fitur Unggulan

### 1. 🏡 Landing Page Naratif (`/`)
* **Storytelling Bab 01–06**: Mengedukasi publik dan investor tentang ketidakadilan pasar karbon tradisional vs model pemberdayaan petani TaniKarbon.
* **Kalkulator Alometrik Chave Tier-3**: Simulasi komparasi pohon tebang liar vs dividen tunai karbon jangka panjang.
* **Peta Satelit 3D & Kadaster**: Visualisasi geospasial tajuk pohon terpetakan GPS RTK.

### 2. 🔐 Gateway Autentikasi (`/login`)
* **Desain Glassmorphism Mewah**: Terinspirasi dari Dribbble UI (*Morva Labs*) dengan latar fotografi agroforestri Gunung Sindoro resolusi tinggi.
* **Role Switcher**: Pemisahan jalur pendaftaran Mitra Tani dan Portal Korporat B2B.

### 3. 👨‍🌾 Workspace Mitra Tani (`/mitra-tani`)
* **Bahasa Desain AgroPulse**: Antarmuka mobile-friendly, hangat, dan ramah bagi petani pedesaan.
* **Foto Botani Asli**: Seluruh kartu pohon menggunakan thumbnail fotografi tajuk riil (*Persea americana*, *Paraserianthes falcataria*, *Coffea canephora*, dll.).
* **Paspor Pohon Digital**: Bukti verifikasi biometrik (DBH, biomassa kering, serapan CO₂) dengan akreditasi SRN-PPI KLHK.
* **Peta Ortofoto Satelit & Kadaster**: Navigasi GPS interaktif dengan layer NDVI klorofil.
* **Pencairan Saldo Instan**: Integrasi dompet tunai ke rekening lokal Bank BRI dan e-Wallet DANA.

### 4. 🏢 Portal Korporat & B2B Carbon Desk (`/korporat`)
* **Light Nordic Enterprise Aesthetic**: Tata letak bersih, berwibawa, dan formal untuk kebutuhan dewan direksi, CFO, dan auditor ESG.
* **Panel Audit Spasial & Ground-Truth**: Citra satelit Sentinel-2 10m/px dipadukan dengan foto bukti lapangan bergeotag RTK dan verifikasi hash SHA-256.
* **Meja Eksekusi Pensiun Karbon (Fair-Trade)**: Transparansi alokasi dana: **88%** langsung ke kas kelompok tani dan **12%** untuk cadangan MRV.
* **Penerbitan Dokumen BAP Resmi**: Sertifikat *Berita Acara Pensiun* ber-QR code audit publik yang siap dicetak/diunduh sebagai lampiran Laporan Keberlanjutan OJK POJK 51/2017.

---

## 📁 Struktur Direktori

```text
TaniKarbon/
├── public/                     # Aset fotografi resolusi tinggi & favicon
│   ├── favicon.svg             # Logo resmi TaniKarbon
│   ├── canopy-tree.jpg         # Foto tajuk drone kanopi
│   ├── hero-agroforest.jpg     # Foto lanskap agroforestri lereng
│   ├── auth-bg.jpg             # Foto Gunung Sindoro Wonosobo
│   ├── pak-joko.jpg            # Profil mitra tani binaan
│   └── agri-drone.jpg          # Patroli sensor udara drone
├── src/
│   ├── components/             # Komponen halaman modular
│   │   ├── LandingPage.jsx     # Beranda narasi & peta publik
│   │   ├── AuthGateway.jsx     # Portal login/daftar glassmorphism
│   │   ├── FarmerWorkspace.jsx # Dasbor aplikasi mitra tani (AgroPulse)
│   │   ├── CorporateMarketplace.jsx # Meja bursa karbon korporat
│   │   └── Satellite3DMap.jsx  # Peta interaktif Leaflet
│   ├── App.jsx                 # Routing berbasis URL & state manajemen
│   ├── data.js                 # Dataset pohon, klaster, dan buyers
│   ├── index.css               # Desain sistem & utilitas Tailwind
│   └── main.jsx                # Entry point aplikasi React
├── index.html                  # HTML template dengan Plus Jakarta Sans
├── package.json                # Dependensi proyek
├── tailwind.config.js          # Konfigurasi token warna pine, emerald, & matcha
└── vite.config.js              # Bundler konfigurasi Vite
```

---

## 🛠️ Tech Stack

* **Frontend Framework**: [React 19](https://react.dev/)
* **Build Tool**: [Vite 6](https://vitejs.dev/)
* **Styling**: [TailwindCSS 3](https://tailwindcss.com/)
* **Typography**: Plus Jakarta Sans & JetBrains Mono (Google Fonts)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Mapping Engine**: [Leaflet](https://leafletjs.com/)

---

## 💻 Menjalankan Proyek Secara Lokal

1. **Clone repository:**
   ```bash
   git clone https://github.com/username-kamu/TaniKarbon.git
   cd TaniKarbon
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:5173`.

4. **Build untuk production:**
   ```bash
   npm run build
   ```

---

## 📜 Kepatuhan & Regulasi

Platform TaniKarbon dirancang agar selaras dengan kerangka regulasi keberlanjutan Republik Indonesia:
* **Peraturan Menteri LHK No. 21/2022**: Tata Laksana Penerapan Nilai Ekonomi Karbon (NEK).
* **Peraturan OJK No. 51/POJK.03/2017**: Penerapan Keuangan Berkelanjutan bagi Lembaga Jasa Keuangan, Emiten, dan Perusahaan Publik.
* **Metodologi MRV**: Alometrik Chave Tier-3, ISO 14064-2, dan Verra VM0042.

---

**© 2026 PT TaniKarbon Solusi Nusantara. All rights reserved.**
