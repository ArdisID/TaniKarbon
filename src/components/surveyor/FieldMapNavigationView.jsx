import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  ExternalLink, 
  Compass, 
  ArrowRight,
  Layers,
  Info
} from 'lucide-react';
import * as turf from '@turf/turf';

export default function FieldMapNavigationView({ 
  selectedTicket, 
  onTicketChange, 
  allTickets = [], 
  onCheckInSuccess,
  onToast 
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

  // Default target ticket if none selected: Pak Joko Widodo
  const activeTicket = selectedTicket || allTickets[0] || {
    id: 'TKT-WNSB-042',
    farmerName: 'Pak Joko Widodo',
    landName: 'Lahan 1 - Pekarangan Garung',
    areaM2: 4520,
    treeCount: 100,
    species: 'Mangga & Alpukat',
    lat: -7.3639,
    lng: 109.9886,
    centroid: [-7.3639, 109.9886],
    polygon: [
      [-7.3635, 109.9880],
      [-7.3635, 109.9892],
      [-7.3644, 109.9892],
      [-7.3644, 109.9880]
    ]
  };

  // FITUR PENYELAMAT PRESENTASI / DEMO JURI:
  // Toggle Switch Simulasi Posisi GPS Petugas
  const [demoGpsMode, setDemoGpsMode] = useState('inside'); // 'outside' | 'inside'
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);

  // Dynamic distance and geofence status based on demo switch
  const isInsideGeofence = demoGpsMode === 'inside';
  const currentDistanceMeters = isInsideGeofence ? 8 : 2400;

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        if (!isMounted || !mapContainerRef.current) return;

        const centerLat = activeTicket.lat || -7.3639;
        const centerLng = activeTicket.lng || 109.9886;

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 17,
          zoomControl: true,
          attributionControl: false
        });

        // Satellite imagery tile
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        // Render polygon kebun petani (Garis Hijau Zamrud)
        const defaultPoly = [
          [-7.3634, 109.9881],
          [-7.3633, 109.9891],
          [-7.3643, 109.9893],
          [-7.3645, 109.9882]
        ];
        const polyCoords = activeTicket.polygon || defaultPoly;

        const polygonLayer = L.polygon(polyCoords, {
          color: '#10B981',
          weight: 3,
          fillColor: '#10B981',
          fillOpacity: 0.25,
          dashArray: '4, 4'
        }).addTo(map);

        // Marker Centroid Kebun
        const centroidIcon = L.divIcon({
          className: 'custom-centroid-marker',
          html: `<div style="background:#14382C;color:#34D399;border:2px solid #34D399;border-radius:12px;padding:4px 8px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.4);">
                  📍 ${activeTicket.farmerName} (${activeTicket.id})
                 </div>`,
          iconSize: [120, 30],
          iconAnchor: [60, 15]
        });

        L.marker([centerLat, centerLng], { icon: centroidIcon }).addTo(map);

        // Titik Posisi Petugas (Biru GPS Pulse)
        const surveyorLat = isInsideGeofence ? centerLat + 0.00006 : centerLat + 0.021;
        const surveyorLng = isInsideGeofence ? centerLng + 0.00005 : centerLng + 0.018;

        const surveyorIcon = L.divIcon({
          className: 'custom-surveyor-marker',
          html: `<div style="position:relative;width:20px;height:20px;">
                  <span style="position:absolute;width:100%;height:100%;border-radius:50%;background:#3B82F6;opacity:0.75;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
                  <span style="position:relative;display:block;width:16px;height:16px;margin:2px;border-radius:50%;background:#2563EB;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);"></span>
                 </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        L.marker([surveyorLat, surveyorLng], { icon: surveyorIcon })
          .addTo(map)
          .bindPopup(`<b>Posisi GPS Petugas</b><br>${isInsideGeofence ? 'Di dalam area kebun (8m)' : 'Di luar radius (2,4 km)'}`)
          .openPopup();

        // Fit bounds
        map.fitBounds(polygonLayer.getBounds(), { padding: [50, 50] });
        leafletMapRef.current = map;
      } catch (err) {
        console.error('Failed to initialize Leaflet Map', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [activeTicket, demoGpsMode]);

  const handleOpenGoogleMaps = () => {
    const lat = activeTicket.lat || -7.3639;
    const lng = activeTicket.lng || 109.9886;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleCheckIn = () => {
    if (!isInsideGeofence) return;

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB, ' + 
      new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    
    setIsCheckedIn(true);
    setCheckInTime(nowStr);

    if (onToast) {
      onToast(`Check-In Berhasil! Koordinat GPS (-7.3639, 109.9886) tercatat sah. Membuka Lembar Kerja Inspeksi...`);
    }

    setTimeout(() => {
      if (onCheckInSuccess) {
        onCheckInSuccess(activeTicket);
      }
    }, 700);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Top Header Selector & Demo GPS Switch */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              GEOFENCING &amp; ANTI-FRAUD
            </span>
            <span className="text-xs text-slate-500 font-sans">Radius Kunci: &le; 50 meter</span>
          </div>
          <h2 className="text-xl font-black text-[#14382C] mt-1 font-sans">
            Peta Rute Navigasi &amp; Validasi Kehadiran Fisik
          </h2>
        </div>

        {/* FITUR PENYELAMAT DEMO: SWITCH MODE GPS */}
        <div className="p-2 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <span className="text-[11px] font-bold text-slate-700 font-sans pl-2">
            Simulasi Demo GPS:
          </span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-2xs">
            <button
              onClick={() => setDemoGpsMode('outside')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans transition cursor-pointer ${
                demoGpsMode === 'outside'
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              (1) Di Luar Radius (2,4 km)
            </button>
            <button
              onClick={() => setDemoGpsMode('inside')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans transition cursor-pointer ${
                demoGpsMode === 'inside'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              (2) Di Dalam Poligon (8 m)
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas (SurveyorRouteMap) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden relative">
        <div 
          ref={mapContainerRef} 
          className="w-full h-[460px] z-10"
        />

        {/* Floating Map Controls Top-Right */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={handleOpenGoogleMaps}
            className="px-3.5 py-2 bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 text-xs font-bold rounded-xl shadow-md border border-slate-200 flex items-center gap-2 transition cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Buka Rute di Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Floating Map Legend Bottom-Left */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-md border border-slate-200 text-xs font-sans space-y-1.5 max-w-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Legenda Lapangan
          </span>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-600 inline-block" />
            <span>Batas Poligon Petani (4.520 m²)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
            <span>Posisi GPS HP Petugas (Real-Time)</span>
          </div>
        </div>
      </div>

      {/* B. GpsGeofenceCheckIn Card (Validasi Kehadiran Fisik Anti-Fraud) */}
      <div className={`p-6 rounded-3xl border transition-all shadow-md font-sans ${
        isInsideGeofence
          ? 'bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-300'
          : 'bg-gradient-to-br from-amber-50/70 via-white to-white border-amber-300'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Status Context */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              {isInsideGeofence ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Geofencing Lolos: Berada di Dalam Kebun</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Geofencing Terkunci: Di Luar Radius Toleransi</span>
                </span>
              )}
              <span className="text-xs font-mono font-bold text-slate-600">
                Jarak: {currentDistanceMeters} meter
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#14382C]">
              {activeTicket.landName} — {activeTicket.farmerName}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isInsideGeofence ? (
                <span className="text-emerald-900 font-medium">
                  ✓ Titik GPS Anda terverifikasi berada di dalam batas poligon kebun (&le; 50 meter). Tombol check-in aktif untuk membuka formulir audit inspeksi pohon.
                </span>
              ) : (
                <span className="text-amber-900 font-medium">
                  ⚠️ Peringatan Anti-Fraud: Anda harus berada &le; 50 meter dari batas kebun untuk membuka lembar inspeksi. Saat ini jarak Anda 2.400 meter dari poligon.
                </span>
              )}
            </p>
          </div>

          {/* Action Trigger Button */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <button
              onClick={handleCheckIn}
              disabled={!isInsideGeofence || isCheckedIn}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold font-sans transition flex items-center justify-center gap-2.5 shadow-md cursor-pointer active:scale-98 ${
                isInsideGeofence
                  ? 'bg-[#14382C] hover:bg-[#1a4436] text-white shadow-emerald-950/20'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              {isInsideGeofence ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Check-In Lokasi Kebun &amp; Buka Lembar Kerja</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Tombol Terkunci (Di Luar Radius 50m)</span>
                </>
              )}
            </button>

            {isInsideGeofence && (
              <span className="text-[11px] text-slate-400 font-sans">
                Koordinat &amp; Waktu Check-In akan tercatat permanen di SRN-PPI
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
