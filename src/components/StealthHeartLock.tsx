import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';

interface StealthHeartLockProps {
  onUnlock?: (unlocked: boolean) => void;
  storageKey: string;
  onUploadClick?: () => void;
}

const STEALTH_PASSWORD = '132018';

const StealthHeartLock = ({ onUnlock, storageKey, onUploadClick }: StealthHeartLockProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });
  const [opacity, setOpacity] = useState(1);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);

  // Keep visible permanently - don't fade out
  useEffect(() => {
    // Heart stays visible and fully opaque
    return () => {};
  }, []);

  const promptPasscode = () => {
    onUploadClick?.();
    setIsUnlocked(true);
    onUnlock?.(true);
  };

  const handleMouseDown = () => {
    longPressRef.current = setTimeout(() => {
      promptPasscode();
    }, 3000);
  };

  const handleMouseUp = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (!isVisible || isUnlocked) return null;

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseUp}
      onContextMenu={handleContextMenu}
      className="fixed bottom-4 right-4 z-40 cursor-pointer touch-none select-none"
      style={{
        opacity,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      <Heart
        size={48}
        className="text-red-500"
        fill="currentColor"
      />
    </div>
  );
};

export default StealthHeartLock;
