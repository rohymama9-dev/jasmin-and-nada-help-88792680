import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';

const LiquidBackground: React.FC = () => {
  const { theme } = useTheme();
  
  // Light mode uses softer pastel blobs, Dark mode uses deep neon/cyan blobs
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      <div 
        className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[80px] opacity-40 animate-blob mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000 ${isDark ? 'bg-indigo-700/50' : 'bg-cyan-200/60'}`}
      />
      <div 
        className={`absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[80px] opacity-40 animate-blob mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000 ${isDark ? 'bg-cyan-900/60' : 'bg-fuchsia-200/50'}`}
        style={{ animationDelay: '2s', animationDuration: '18s' }}
      />
      <div 
        className={`absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-30 animate-blob mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000 ${isDark ? 'bg-teal-900/50' : 'bg-violet-200/50'}`}
        style={{ animationDelay: '4s', animationDuration: '20s' }}
      />
    </div>
  );
};

export default LiquidBackground;
