import { useEffect, useState, useCallback } from 'react';
import { LanguageProvider, useLang } from '@/contexts/LanguageContext';
import { PointsProvider, usePoints } from '@/contexts/PointsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import HomePage from '@/pages/HomePage';
import GamesPage from '@/pages/GamesPage';
import ServicesPage from './ServicesPage';
import EducationPage from '@/pages/EducationPage';
import HealthHub from '@/pages/HealthHub';
import ExercisesPage from '@/pages/ExercisesPage';
import QuranView from '@/pages/QuranView';
import OnboardingScreen, { getGuestName, GUEST_NAME_KEY } from '@/components/OnboardingScreen';
import FlowerEntryAnimation from '@/components/FlowerEntryAnimation';
import GoogleConnectDialog, { type GoogleConnectReason } from '@/components/GoogleConnectDialog';
import { setRequireGoogleHandler } from '@/lib/requireGoogle';
import { DailyComboChallengeProvider } from '@/contexts/DailyComboChallengeContext';
import LiquidBackground from '@/components/LiquidBackground';

const AppContent = () => {
  const [page, setPage] = useState('home');
  const { points, gamesPoints, educationPoints, addPoints } = usePoints();
  const { dir } = useLang();

  const [guestName, setGuestName] = useState<string>(() => getGuestName());
  const [showFlowers, setShowFlowers] = useState(false);
  const [googleReason, setGoogleReason] = useState<GoogleConnectReason>(null);

  useEffect(() => {
    return setRequireGoogleHandler((reason) => setGoogleReason(reason));
  }, []);

  const handleNameComplete = useCallback((name: string) => {
    setGuestName(name);
    setShowFlowers(true);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(GUEST_NAME_KEY);
        setGuestName('');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!guestName) {
    return <OnboardingScreen onComplete={handleNameComplete} />;
  }

  return (
    <div dir={dir} className="min-h-[100dvh] bg-transparent max-w-lg mx-auto safe-area-padding relative z-0">
      <LiquidBackground />
      {showFlowers && (
        <FlowerEntryAnimation
          name={guestName}
          onDone={() => setShowFlowers(false)}
          duration={1800}
        />
      )}
      <main className="px-5 pt-5 pb-20">
        {page === 'home' && <HomePage points={points} addPoints={addPoints} />}
        {page === 'education' && (
          <EducationPage
            points={points}
            educationPoints={educationPoints}
            addPoints={(amount) => addPoints(amount, 'education')}
          />
        )}
        {page === 'quran' && <QuranView />}
        {page === 'health' && <HealthHub addPoints={addPoints} onNavigateToExercises={() => setPage('exercises')} />}
        {page === 'exercises' && <ExercisesPage points={points} addPoints={addPoints} onBack={() => setPage('health')} />}
        {page === 'games' && (
          <GamesPage
            points={points}
            gamePoints={gamesPoints}
            addPoints={(amount) => addPoints(amount, 'games')}
          />
        )}
        {page === 'services' && <ServicesPage points={points} addPoints={addPoints} />}
      </main>
      <BottomNav active={page} onNavigate={setPage} />

      <GoogleConnectDialog
        reason={googleReason}
        onClose={() => setGoogleReason(null)}
        onAuthed={async () => {
          if (googleReason === 'signout') {
            await supabase.auth.signOut();
            localStorage.removeItem(GUEST_NAME_KEY);
            setGuestName('');
          }
        }}
      />
    </div>
  );
};

// ThemeProvider must wrap everything so useTheme() works in all children
const Index = () => (
  <ThemeProvider>
    <LanguageProvider>
      <PointsProvider>
        <DailyComboChallengeProvider>
          <AppContent />
        </DailyComboChallengeProvider>
      </PointsProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default Index;
