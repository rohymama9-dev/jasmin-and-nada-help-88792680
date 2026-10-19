import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

interface ShareableResultProps {
  title: string;
  score: string;
  subtitle?: string;
  lang?: 'ar' | 'en';
}

export const ShareableResult: React.FC<ShareableResultProps> = ({
  title,
  score,
  subtitle,
  lang = 'ar'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const saveAsImage = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // High resolution
        useCORS: true
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `result-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to capture image", err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 my-8">
      {/* The isolated card to be screenshotted */}
      <div 
        id="shareable-card" 
        ref={cardRef}
        className="relative overflow-hidden w-full max-w-sm rounded-2xl bg-gradient-to-br from-primary/80 to-primary p-8 text-white shadow-xl flex flex-col items-center justify-center text-center aspect-[4/5]"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Decorative background elements */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold font-arabic leading-tight">
            {title}
          </h2>
          
          <div className="w-32 h-32 rounded-full border-4 border-white/30 flex items-center justify-center bg-black/20 backdrop-blur-sm shadow-inner">
            <span className="text-4xl font-black">{score}</span>
          </div>
          
          {subtitle && (
            <p className="text-lg opacity-90 font-medium">
              {subtitle}
            </p>
          )}
          
          <div className="mt-8 pt-4 border-t border-white/20 w-full text-sm opacity-70">
            {lang === 'ar' ? 'تطبيق ياسمين وندى ✨' : 'Jasmin & Nada App ✨'}
          </div>
        </div>
      </div>

      {/* Action Button (Not included in screenshot) */}
      <button 
        onClick={saveAsImage}
        disabled={isCapturing}
        className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
      >
        {isCapturing ? (
          <span className="animate-pulse">{lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
        ) : (
          <>
            <span>📸</span>
            <span>{lang === 'ar' ? 'حفظ كصورة' : 'Save as Image'}</span>
          </>
        )}
      </button>
    </div>
  );
};
