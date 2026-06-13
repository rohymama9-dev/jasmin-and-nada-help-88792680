export { usePoints } from '@/contexts/PointsContext';
import { userKey } from '@/lib/userStorage';
import { getGuestName } from '@/components/OnboardingScreen';

const POINTS_BASE = 'app-points';

// Helper exposed for migrations / debugging.
export const pointsKeyForName = (name: string) =>
  userKey(POINTS_BASE, name || getGuestName());
