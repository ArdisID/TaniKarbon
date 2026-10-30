import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TaniKarbon Caught Error in ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F7F2] text-[#173829] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-stone-200 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-3">
              Pemulihan Tampilan Otomatis
            </span>

            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Terjadi Kendala Memuat Halaman
            </h2>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Sistem TaniKarbon telah mengamankan sesi Anda. Silakan muat ulang halaman atau kembali ke beranda untuk melanjutkan.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-left text-xs font-mono text-stone-700 max-h-28 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#14382C] hover:bg-[#1C4E3D] text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer border border-stone-200"
              >
                <Home className="w-4 h-4" />
                <span>Ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

