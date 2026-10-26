/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F6F7F2',
        porcelain: '#F6F7F2',
        pine: {
          50: '#eef5f1',
          100: '#d7e8df',
          200: '#b4d4c5',
          300: '#8bbba7',
          400: '#5f9d85',
          500: '#3d7e67',
          600: '#2b6350',
          700: '#204d3d',
          800: '#173829',
          900: '#0e241a',
          DEFAULT: '#173829',
        },
        leaf: '#10B981',
        matcha: '#DCF0E2',
        amber: {
          DEFAULT: '#F59E0B',
          soft: '#FEF3C7',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Newsreader"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 8px 30px rgb(0 0 0 / 0.04)',
        'card-hover': '0 16px 36px rgb(23 56 41 / 0.08)',
        'float': '0 20px 45px rgb(23 56 41 / 0.12)',
        'soft-glow': '0 0 25px rgba(16, 185, 129, 0.15)',
      },
      animation: {
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'counter': 'counter 1.5s ease-out',
        'float': 'floatBounce 4s ease-in-out infinite',
        'spin-slow': 'spin 14s linear infinite',
      },
      keyframes: {
        scanLine: {
          '0%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        floatBounce: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
