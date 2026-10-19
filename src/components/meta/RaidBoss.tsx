import { useEffect } from 'react';
import { toast } from 'sonner';
import { BOSS_MAX_HP, damageBoss, getBoss, useMetaTick } from '@/lib/metaGame';
import { playPop } from '@/lib/asmrAudio';

export default function RaidBoss() {
  useMetaTick();
  const boss = getBoss();
  const pct = (boss.hp / BOSS_MAX_HP) * 100;

  useEffect(() => {
    const onPomo = () => { damageBoss(50); toast.success('بومودورو ⚔️ -50 HP'); };
    const onWater = () => { damageBoss(10); toast.success('💧 -10 HP'); };
    const onDefeat = () => toast.success('🏆 هزمت وحش الكسل! +500 نقطة');
    window.addEventListener('pomodoro-completed', onPomo);
    window.addEventListener('water-logged', onWater);
    window.addEventListener('boss-defeated', onDefeat);
    return () => {
      window.removeEventListener('pomodoro-completed', onPomo);
      window.removeEventListener('water-logged', onWater);
      window.removeEventListener('boss-defeated', onDefeat);
    };
  }, []);

  if (boss.defeated) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-4 text-white text-center">
        <div className="text-3xl mb-1">🏆</div>
        <div className="font-bold">هزمت وحش الكسل لهذا الأسبوع!</div>
        <div className="text-xs opacity-80 mt-1">يعود الأحد القادم</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 p-4 border border-red-500/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <span className="text-2xl">👹</span>
          <span>وحش الكسل</span>
        </div>
        <div className="text-red-300 text-xs font-mono">{boss.hp} / {BOSS_MAX_HP} HP</div>
      </div>
      <div className="relative h-5 rounded-full bg-black/60 overflow-hidden border border-red-700/60">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => { damageBoss(50); playPop(); toast.success('⚔️ -50 HP'); }}
          className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold"
        >
          أتممت بومودورو
        </button>
        <button
          onClick={() => { damageBoss(10); playPop(); toast.success('💧 -10 HP'); }}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
        >
          سجلت كوب ماء
        </button>
      </div>
      <p className="text-[10px] text-red-200/70 mt-2 text-center">الإنجازات تخصم تلقائياً • يُعاد كل يوم أحد</p>
    </div>
  );
}