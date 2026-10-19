import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export type GoogleConnectReason = 'signout' | 'download' | null;

interface Props {
  reason: GoogleConnectReason;
  onClose: () => void;
  /** Called after Google sign-in succeeds (or is no longer needed). */
  onAuthed?: () => void;
}

/**
 * Asks the user to connect Google ONLY when they try to sign out or
 * download something. If they're already signed in we just run the action.
 */
const GoogleConnectDialog = ({ reason, onClose, onAuthed }: Props) => {
  const { lang } = useLang();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // If already authed, skip the dialog entirely.
  useEffect(() => {
    if (!reason) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        onAuthed?.();
        onClose();
      }
    });
    return () => { cancelled = true; };
  }, [reason, onAuthed, onClose]);

  if (!reason) return null;

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t('فشل تسجيل الدخول بجوجل', 'Google sign-in failed'));
      return;
    }
    if (result.redirected) return; // browser will navigate
    onAuthed?.();
    onClose();
  };

  const title =
    reason === 'signout'
      ? t('تسجيل الدخول للخروج بأمان', 'Sign in to sign out safely')
      : t('تسجيل الدخول للتحميل', 'Sign in to download');

  const desc =
    reason === 'signout'
      ? t(
          'لحفظ تقدمكِ ونقاطكِ قبل الخروج، يرجى الدخول بحساب جوجل.',
          'To save your progress and points before leaving, please sign in with Google.'
        )
      : t(
          'لتحميل المحتوى الخاص بكِ بأمان، يرجى الدخول بحساب جوجل.',
          'To download your content securely, please sign in with Google.'
        );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-5 animate-fade-in">
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-2xl space-y-4 relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary transition-colors"
          aria-label="close"
        >
          <X size={16} />
        </button>

        <div className="text-center space-y-2 pt-2">
          <span className="text-4xl">🔐</span>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('المتابعة باستخدام جوجل', 'Continue with Google')}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('ليس الآن', 'Not now')}
        </button>
      </div>
    </div>
  );
};

export default GoogleConnectDialog;
