import React, { useState, useEffect } from 'react';

interface MonthlyWrappedProps {
  onClose: () => void;
}

export const MonthlyWrapped: React.FC<MonthlyWrappedProps> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState({
    water: 0,
    pomodoro: 0,
    games: 0,
    points: 0
  });

  // Mocking reading from LocalStorage
  useEffect(() => {
    try {
      const gamiData = JSON.parse(localStorage.getItem('jasmin_nada_gamification') || '{}');
      setStats({
        water: 35, // Mock data
        pomodoro: 120, // Mock minutes
        games: 12, // Mock games
        points: gamiData.points || 0
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const slides = [
    {
      title: "شهرك باختصار ✨",
      content: "لقد كان شهراً حافلاً بالإنجازات! دعنا نلقي نظرة على ما حققته...",
      bg: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
      icon: "📅"
    },
    {
      title: "التركيز 🍅",
      content: `قضيت ${stats.pomodoro} دقيقة في التركيز والعمل العميق. استمر في هذا الأداء الرائع!`,
      bg: "bg-gradient-to-br from-red-500 to-orange-500",
      icon: "🔥"
    },
    {
      title: "الترطيب 💧",
      content: `شربت ${stats.water} كوباً من الماء. جسدك يشكرك على هذا الاهتمام!`,
      bg: "bg-gradient-to-br from-cyan-400 to-blue-500",
      icon: "🌊"
    },
    {
      title: "نقاطك 🏆",
      content: `جمعت ${stats.points} نقطة هذا الشهر. أنت تقترب من فتح جوائز جديدة!`,
      bg: "bg-gradient-to-br from-amber-400 to-orange-600",
      icon: "⭐"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center font-arabic">
      <div className={`relative w-full h-full max-w-md ${slides[currentSlide].bg} transition-colors duration-500 flex flex-col`}>
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {slides.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300 ease-linear"
                style={{ 
                  width: idx < currentSlide ? '100%' : idx === currentSlide ? '100%' : '0%',
                  transitionDuration: idx === currentSlide ? '5s' : '0.3s'
                }}
              />
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-4 z-20 text-white p-2 text-xl opacity-80 hover:opacity-100"
        >
          ✖
        </button>

        {/* Click Areas for Navigation */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={prevSlide} />
        <div className="absolute inset-y-0 right-0 w-2/3 z-10" onClick={nextSlide} />

        {/* Slide Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-white text-center animate-in fade-in zoom-in duration-500">
          <div className="text-8xl mb-8 drop-shadow-lg animate-bounce">
            {slides[currentSlide].icon}
          </div>
          <h2 className="text-4xl font-black mb-6 drop-shadow-md">
            {slides[currentSlide].title}
          </h2>
          <p className="text-2xl leading-relaxed opacity-90 drop-shadow">
            {slides[currentSlide].content}
          </p>
        </div>

        {/* Tap Indicator */}
        <div className="absolute bottom-8 left-0 right-0 text-center text-white/50 text-sm animate-pulse pointer-events-none">
          انقر للمتابعة
        </div>

      </div>
    </div>
  );
};
