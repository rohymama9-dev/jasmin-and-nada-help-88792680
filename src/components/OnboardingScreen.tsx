import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { User, Sparkles, LogIn } from 'lucide-react';
import HiddenAdminGate from './HiddenAdminGate';
import AdminUploadInline from './AdminUploadInline';
import { toast } from 'sonner';

// Legacy health-profile shim (kept for DietTracker / HomePage compatibility)
export interface UserProfile {
  name: string;
  gender?: 'male' | 'female';
  weight?: number;
  height?: number;
  age?: number;
  goal?: 'lose' | 'gain' | 'maintain';
}
const HEALTH_PROFILE_KEY = 'app-health-profile';
export const getUserProfile = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(HEALTH_PROFILE_KEY) || 'null'); } catch { return null; }
};
export const saveUserProfile = (p: UserProfile) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HEALTH_PROFILE_KEY, JSON.stringify(p));
};

export const GUEST_NAME_KEY = 'app-guest-name';
export const getGuestName = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GUEST_NAME_KEY) || '';
};

interface OnboardingScreenProps {
  onComplete: (name: string) => void;
}

/**
 * Frictionless entry: just ask for a name, then straight into the app.
 * Google sign-in is deferred until the user tries to sign out / download
 * (handled by GoogleConnectDialog).
 */
const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const { lang } = useLang();
  const [name, setName] = useState('');
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const handleEnter = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t('من فضلكم أدخلوا أسماءكم', 'Please enter your name'));
      return;
    }
    localStorage.setItem(GUEST_NAME_KEY, trimmed);
    try { window.dispatchEvent(new CustomEvent('guest-name-changed', { detail: trimmed })); } catch { /* ignore */ }
    onComplete(trimmed);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <span className="text-6xl">🌸</span>
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            Nada Helps
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('فقط أدخلوا أسماءكم وابدأوا', 'Just enter your name to start')}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <User size={18} />
              <label className="font-semibold text-foreground text-sm">
                {t('الاسم', 'Your name')}
              </label>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEnter()}
                placeholder={t('أدخلوا أسماءكم', 'Enter your name')}
                maxLength={60}
                className="min-w-0 w-full max-w-full box-border overflow-hidden px-4 py-3 rounded-xl bg-background border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <HiddenAdminGate>
                <div className="p-1 bg-primary/5 rounded-xl border border-primary/20">
                  <AdminUploadInline category="story" accept="*/*" labelAr="أدمن" labelEn="Admin" />
                </div>
              </HiddenAdminGate>
            </div>
          </div>

          <button
            onClick={handleEnter}
            className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90"
          >
            <Sparkles size={18} />
            {t('دخول', 'Enter')}
          </button>

          <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
            {t(
              'تقدروا تنزلوا الموقع كتطبيق للاستمتاع به بدون نت وتلقي الاشعارات دائما لمساعدتكم في حياتكم.',
              'You can download the site as an app to enjoy it offline and always receive notifications to help you in your life.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
