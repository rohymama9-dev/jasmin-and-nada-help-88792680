import { toast } from 'sonner';
import { useEffect, useRef, useState, ReactNode } from 'react';

/**
 * Ghost-admin unlock. The wrapped UI stays hidden until the user either:
 *   1. Long-presses the trigger surface for 5 seconds, OR
 *   2. Presses Shift + Alt + U on a physical keyboard.
 * After either gesture, a hardcoded passcode prompt confirms identity.
 * No Google / Supabase auth is involved — fully local.
 */

const PASSCODE = 'nada2025'; // hardcoded, change here only
const SESSION_KEY = 'ghost-admin-unlocked';

interface Props {
  children: ReactNode;
  /** Visible label rendered as the long-press surface (small, subtle). */
  hint?: string;
}

const HiddenAdminGate = ({ children, hint = '·' }: Props) => {
  const [unlocked, setUnlocked] = useState<boolean>(
    () => typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1',
  );
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const promptPasscode = () => {
    const v = window.prompt('🔒 Passcode');
    if (v && v.trim() === PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
    } else if (v !== null) {
      window.toast('❌');
    }
  };

  // Keyboard shortcut: Shift + Alt + U
  useEffect(() => {
    if (unlocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        promptPasscode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unlocked]);

  const startPress = () => {
    startRef.current = Date.now();
    setProgress(0);
    timerRef.current = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - startRef.current) / 5000) * 100);
      setProgress(p);
      if (p >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setProgress(0);
        promptPasscode();
      }
    }, 100);
  };
  const cancelPress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setProgress(0);
  };

  if (unlocked) return <>{children}</>;

  return (
    <div
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      className="select-none touch-none inline-flex items-center justify-center text-[10px] text-muted-foreground/30 px-2 py-1 rounded-full"
      style={{
        background:
          progress > 0
            ? `linear-gradient(90deg, hsl(var(--primary)/0.15) ${progress}%, transparent ${progress}%)`
            : 'transparent',
      }}
      aria-hidden
    >
      {hint}
    </div>
  );
};

export default HiddenAdminGate;
