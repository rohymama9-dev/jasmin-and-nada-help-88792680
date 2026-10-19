import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

interface GameInstructionsProps {
  titleAr: string;
  titleEn: string;
  stepsAr: string[];
  stepsEn: string[];
}

const GameInstructions = ({ titleAr, titleEn, stepsAr, stepsEn }: GameInstructionsProps) => {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-muted-foreground hover:text-primary transition-colors p-1">
        <HelpCircle size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="glass-card rounded-2xl p-5 max-w-sm w-full animate-bounce-in space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">{lang === 'ar' ? titleAr : titleEn}</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground"><X size={18} /></button>
            </div>
            <ol className="space-y-2">
              {(lang === 'ar' ? stepsAr : stepsEn).map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-bold">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
};

export default GameInstructions;
