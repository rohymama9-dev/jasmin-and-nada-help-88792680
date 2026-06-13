import { useEffect, useState } from 'react';
import { getGuestName } from '@/components/OnboardingScreen';

/**
 * Owner gate for the upload UI.
 * Supports both standard email checking and local secret heart bypass.
 */
export const useIsAdmin = () => {
  const checkAdminStatus = (): boolean => {
    const isEmailAdmin = getGuestName() === 'yasminehassan037@gmail.com';
    const isLocalUnlocked = typeof window !== 'undefined' && sessionStorage.getItem('ghost-admin-unlocked') === '1';
    return isEmailAdmin || isLocalUnlocked;
  };

  const [isAdmin, setIsAdmin] = useState<boolean>(() => checkAdminStatus());

  useEffect(() => {
    const sync = () => setIsAdmin(checkAdminStatus());
    sync();

    window.addEventListener('guest-name-changed', sync);
    window.addEventListener('admin-state-changed', sync); // حدث مخصص لتحديث الواجهة فوراً
    window.addEventListener('storage', sync);
    
    return () => {
      window.removeEventListener('guest-name-changed', sync);
      window.removeEventListener('admin-state-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return { isAdmin, loading: false };
};