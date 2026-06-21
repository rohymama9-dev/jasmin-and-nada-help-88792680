import { useState } from 'react';
import { toast } from 'sonner';
import { setDailyQuest, hasPickedTodayCard } from '@/lib/metaGame';
import { playChime } from '@/lib/asmrAudio';

const QUESTS = [
  { text: 'اشرب 4 أكواب ماء قبل الساعة 3 عصراً', reward: 50 },
  { text: 'أكمل بومودورو واحد بدون مقاطعة', reward: 60 },
  { text: 'سجّل 3 أذكار صباحية', reward: 40 },
  { text: 'تحدّى صديقاً في لعبة واحدة اليوم', reward: 45 },
  { text: 'اكتب هدفاً ليومك في الكبسولة الزمنية', reward: 35 },
  { text: 'اقرأ صفحة من كتاب أو ملخص', reward: 55 },
];

export default function DailyMagicCards({ onClose }: { onClose: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<{ text: string; reward: number } | null>(null);

  if (hasPickedTodayCard()) return null;

  const handlePick = (i: number) => {
    if (picked !== null) return;
    const q = QUESTS[Math.floor(Math.random() * QUESTS.length)];
    setPicked(i);
    setRevealed(q);
    setDailyQuest(q.text, q.reward);
    playChime();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <h2 className="text-white text-2xl font-bold mb-2">🔮 بطاقات اليوم السحرية</h2>
      <p className="text-white/70 text-sm mb-6 text-center">اختر بطاقة لتكشف مهمتك السرية لليوم</p>
      <div className="flex gap-4">
        {[0, 1, 2].map(i => (
          <button
            key={i}
            onClick={() => handlePick(i)}
            className="relative w-28 h-44 sm:w-32 sm:h-48 [perspective:1000px] focus:outline-none"
            disabled={picked !== null && picked !== i}
          >
            <div
              className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]"
              style={{ transform: picked === i ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-2 border-white/40 flex items-center justify-center text-5xl shadow-2xl [backface-visibility:hidden]">
                ✦
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-pink-400 border-2 border-white p-2 flex flex-col items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-2xl">
                <div className="text-3xl mb-2">🎁</div>
                <div className="text-[10px] text-white font-bold leading-tight">
                  {picked === i && revealed ? revealed.text : ''}
                </div>
                <div className="text-xs text-white/90 font-extrabold mt-1">
                  {picked === i && revealed ? `+${revealed.reward} نقطة` : ''}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {revealed && (
        <button
          onClick={() => { toast.success('تم حفظ مهمتك السرية ✨'); onClose(); }}
          className="mt-8 px-6 py-3 rounded-full bg-white text-indigo-700 font-bold shadow-lg hover:scale-105 transition-transform"
        >
          ابدأ المهمة 🚀
        </button>
      )}
    </div>
  );
}