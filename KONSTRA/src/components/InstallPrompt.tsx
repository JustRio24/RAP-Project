import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
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

  if (!isInstallable || isDismissed) return null;

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
