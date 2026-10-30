import React from 'react';

/**
 * TaniKarbon Signature Brand Logo Component
 * Menggabungkan siluet daun agroforestri organik dengan faset kristal heksagonal karbon (C6).
 * Memiliki depth 3D realistis dengan specular highlight, gradient emerald-pine, dan glass luster.
 *
 * Props:
 * - size: number | 'sm' (28px) | 'md' (36px) | 'lg' (44px) | 'xl' (56px)
 * - showText: boolean (default: true)
 * - textVariant: 'dark' (slate-900) | 'light' (white) | 'emerald'
 * - subtitle: string (optional, e.g. "PORTAL ESG & EMISI" or "AUTHORITY")
 * - className: additional wrapper classes
 */
export default function TaniKarbonLogo({
  size = 'md',
  showText = true,
  textVariant = 'dark',
  subtitle,
  className = '',
  onClick
}) {
  const sizeMap = {
    xs: 24,
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
  };

  const pixelSize = typeof size === 'number' ? size : (sizeMap[size] || 36);

  // Text color styling based on variant
  const titleColor =
    textVariant === 'light'
      ? 'text-white'
      : textVariant === 'emerald'
      ? 'text-[#0F2E22]'
      : 'text-slate-900';

  const accentColor =
    textVariant === 'light'
      ? 'text-emerald-400'
      : 'text-emerald-600';

  const subtitleColor =
    textVariant === 'light'
      ? 'text-emerald-300/80'
      : 'text-slate-400';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 3D Realistic Emblem SVG Icon */}
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className="relative shrink-0 flex items-center justify-center transition-transform duration-300 hover:scale-105"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(16,185,129,0.25)]"
        >
          <defs>
            {/* Background Squircle Gradient */}
            <linearGradient id="tkBgGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#14382C" />
              <stop offset="60%" stopColor="#0B231B" />
              <stop offset="100%" stopColor="#05120E" />
            </linearGradient>

            {/* Emerald Leaf Gradient (Main Body) */}
            <linearGradient id="tkLeafMain" x1="28" y1="20" x2="72" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="45%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Carbon Hex Facet Gradient (Right Wing) */}
            <linearGradient id="tkCarbonFacet" x1="48" y1="25" x2="82" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="35%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>

            {/* Glowing Atomic Core Radial */}
            <radialGradient id="tkCoreGlow" cx="50" cy="50" r="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0" />
            </radialGradient>

            {/* Gold/Emerald Rim Border Highlight */}
            <linearGradient id="tkBorderGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
            </linearGradient>

            {/* Specular Highlight Glint (Glossy Luster) */}
            <linearGradient id="tkSpecular" x1="20" y1="12" x2="50" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Inner Shadow Filter for 3D Carve Depth */}
            <filter id="tkSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Outer Squircle Container with Chamfered Glass Border */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="26"
            fill="url(#tkBgGrad)"
            stroke="url(#tkBorderGrad)"
            strokeWidth="2.5"
            filter="url(#tkSoftGlow)"
          />

          {/* Ambient Inner Core Glow */}
          <circle cx="50" cy="50" r="32" fill="url(#tkCoreGlow)" />

          {/* 
            Geometry: The Fusion of Nature (Leaf) and Carbon (Hexagon)
            Left Leaf Petal with Natural S-curve
          */}
          <path
            d="M50 18C44 26 26 36 26 56C26 70 37 80 50 82C46 72 44 60 50 48C53 42 52 28 50 18Z"
            fill="url(#tkLeafMain)"
          />

          {/* Right Crystalline Carbon Hexagonal Facets */}
          <path
            d="M50 18C52 28 53 42 50 48C56 60 54 72 50 82C63 80 74 70 74 56C74 38 58 26 50 18Z"
            fill="url(#tkCarbonFacet)"
            opacity="0.95"
          />

          {/* Central Vein / Carbon Lattice Axis */}
          <path
            d="M50 20V80"
            stroke="#ECFDF5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.9"
          />

          {/* High-Tech Hexagonal Facet Nodes (Carbon Atoms C6) */}
          <path
            d="M50 36L62 43V57L50 64L38 57V43L50 36Z"
            stroke="#A7F3D0"
            strokeWidth="1.8"
            fill="none"
            strokeDasharray="1.5 2.5"
            strokeOpacity="0.8"
          />

          {/* Glowing Center Core Dot */}
          <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" />
          <circle cx="50" cy="50" r="2.5" fill="#10B981" />

          {/* Top Glass Specular Reflection Crescent */}
          <path
            d="M8 32C8 18.7452 18.7452 8 32 8H68C81.2548 8 92 18.7452 92 32C92 33 60 48 8 32Z"
            fill="url(#tkSpecular)"
            opacity="0.4"
          />

          {/* Tiny Sunlight Sparkle in Upper Left Leaf */}
          <polygon
            points="38,24 40,28 44,30 40,32 38,36 36,32 32,30 36,28"
            fill="#FFFFFF"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Brand Text Block */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline">
            <span
              className={`font-black tracking-tight font-sans ${titleColor} ${
                pixelSize >= 40
                  ? 'text-xl sm:text-2xl'
                  : pixelSize >= 32
                  ? 'text-base sm:text-lg'
                  : 'text-sm sm:text-base'
              }`}
            >
              Tani<span className={accentColor}>Karbon</span>
            </span>
          </div>
          {subtitle && (
            <span
              className={`text-[9px] font-sans font-extrabold uppercase tracking-widest mt-0.5 ${subtitleColor}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

