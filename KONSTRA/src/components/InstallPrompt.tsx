import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if already installed
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone === true);
    setIsStandalone(isAppStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (isDismissed || isStandalone) return null;

  // Render for iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-[80px] left-4 right-4 z-50 animate-slide-up">
        <div className="bg-white/95 backdrop-blur-md border border-primary-100 text-slate-800 p-4 rounded-xl shadow-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-sm text-primary-700">Instal di iOS (iPhone/iPad)</span>
            <button onClick={() => setIsDismissed(true)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="text-xs text-slate-600 space-y-2 mt-2">
            <p className="flex items-center gap-2">
              1. Tap ikon Share <Share size={14} className="text-blue-500" /> di menu bawah Safari.
            </p>
            <p className="flex items-center gap-2">
              2. Scroll ke bawah, pilih <strong>Add to Home Screen</strong> <PlusSquare size={14} className="text-slate-700" />.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-[80px] left-4 right-4 z-50 animate-slide-up">
      <div className="bg-primary-600 text-white p-4 rounded-xl shadow-xl flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-bold text-sm">Instal Aplikasi KONSTRA</span>
          <span className="text-xs text-primary-100 mt-0.5">Tambahkan ke layar utama HP Anda</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDismissed(true)} 
            className="px-2 py-1 text-xs font-semibold text-primary-200 hover:text-white transition-colors"
          >
            Nanti
          </button>
          <button 
            onClick={handleInstall} 
            className="flex items-center gap-1.5 bg-white text-primary-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download size={14} /> Instal
          </button>
        </div>
      </div>
    </div>
  );
}
