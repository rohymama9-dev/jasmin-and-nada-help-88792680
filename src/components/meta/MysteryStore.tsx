import { useState } from 'react';
import { toast } from 'sonner';
import { addPoints, getPoints, getSkills, spendPoints, getInventory, saveInventory, useMetaTick } from '@/lib/metaGame';
import { playPop, playChime } from '@/lib/asmrAudio';

type Rarity = 'common' | 'epic' | 'legendary';
const DINO_COLORS = ['أحمر', 'أزرق', 'ذهبي', 'بنفسجي', 'فيروزي'];
const UI_BGS = ['غابة', 'فضاء', 'محيط', 'صحراء'];
const CROWNS = ['تاج ذهبي', 'تاج ماسي', 'تاج النار'];
const RARE_THEMES = ['ثيم الأسطورة', 'ثيم الفجر الأرجواني'];

const pickRarity = (): Rarity => {
  const r = Math.random();
  if (r < 0.05) return 'legendary';
  if (r < 0.30) return 'epic';
  return 'common';
};

const rarityAura: Record<Rarity, string> = {
  common: 'shadow-[0_0_40px_rgba(59,130,246,0.7)] from-blue-500 to-cyan-500',
  epic: 'shadow-[0_0_60px_rgba(168,85,247,0.8)] from-purple-500 to-fuchsia-500',
  legendary: 'shadow-[0_0_80px_rgba(234,179,8,0.95)] from-yellow-400 to-amber-500',
};

export default function MysteryStore() {
  useMetaTick();
  const [opening, setOpening] = useState<null | { type: 'box' | 'gacha'; rarity?: Rarity; reward?: string }>(null);
  const skills = getSkills();
  const discount = skills.expertTrader ? 0.9 : 1;
  const boxCost = Math.round(150 * discount);
  const gachaCost = Math.round(100 * discount);

  const openBox = () => {
    if (!spendPoints(boxCost)) { toast.error('نقاط غير كافية'); return; }
    setOpening({ type: 'box' });
    setTimeout(() => {
      const inv = getInventory();
      const roll = Math.random();
      let reward = '';
      if (roll < 0.5) { const p = 20 + Math.floor(Math.random() * 80); addPoints(p); reward = `+${p} نقطة`; }
      else { inv.dinoFood += 3; reward = '🍖 +3 طعام ديناصور'; saveInventory(inv); }
      playPop();
      setOpening({ type: 'box', reward });
    }, 1200);
  };

  const pullGacha = () => {
    if (!spendPoints(gachaCost)) { toast.error('نقاط غير كافية'); return; }
    setOpening({ type: 'gacha' });
    setTimeout(() => {
      const rarity = pickRarity();
      const inv = getInventory();
      let reward = '';
      if (rarity === 'common') { addPoints(20); reward = '+20 نقطة'; }
      else if (rarity === 'epic') {
        const pool = Math.random() < 0.5 ? DINO_COLORS : UI_BGS;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (pool === DINO_COLORS) inv.dinoColors.push(pick); else inv.uiBackgrounds.push(pick);
        saveInventory(inv);
        reward = `🎨 ${pick}`;
      } else {
        const isCrown = Math.random() < 0.5;
        const pick = isCrown ? CROWNS[Math.floor(Math.random() * CROWNS.length)] : RARE_THEMES[Math.floor(Math.random() * RARE_THEMES.length)];
        if (isCrown) inv.crowns.push(pick); else inv.rareThemes.push(pick);
        saveInventory(inv);
        reward = `👑 ${pick}`;
      }
      playChime();
      setOpening({ type: 'gacha', rarity, reward });
    }, 1500);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">🛍️ متجر المفاجآت</h3>
      <div className="text-xs text-muted-foreground">رصيدك: <b>{getPoints()}</b> نقطة {skills.expertTrader && '· خصم 10% مفعل ✨'}</div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={openBox}
          className="rounded-2xl p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:scale-105 transition-transform"
        >
          <div className="text-4xl mb-1">🎁</div>
          <div className="font-bold">صندوق غامض</div>
          <div className="text-xs opacity-80">{boxCost} نقطة</div>
        </button>
        <button
          onClick={pullGacha}
          className="rounded-2xl p-4 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-lg hover:scale-105 transition-transform"
        >
          <div className="text-4xl mb-1">✨</div>
          <div className="font-bold">سحبة جاتشا</div>
          <div className="text-xs opacity-80">{gachaCost} نقطة</div>
        </button>
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">مخزني</summary>
        <Inventory />
      </details>

      {opening && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={() => opening.reward && setOpening(null)}>
          <div className="text-center">
            {!opening.reward ? (
              <>
                {opening.type === 'box' ? (
                  <div className="text-9xl animate-bounce">🎁</div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 -m-20 rounded-full bg-gradient-to-br from-yellow-400 via-fuchsia-500 to-cyan-400 blur-3xl opacity-70 animate-pulse" />
                    <div className="relative text-9xl animate-spin" style={{ animationDuration: '1.5s' }}>✨</div>
                  </div>
                )}
                <p className="text-white mt-4">جاري الفتح...</p>
              </>
            ) : (
              <div className={`relative rounded-3xl p-8 bg-gradient-to-br ${opening.rarity ? rarityAura[opening.rarity] : rarityAura.common} text-white`}>
                <div className="text-7xl mb-3">{opening.rarity === 'legendary' ? '👑' : opening.rarity === 'epic' ? '💎' : '🎉'}</div>
                <div className="text-xs uppercase tracking-widest font-bold mb-1">
                  {opening.rarity === 'legendary' ? 'أسطوري' : opening.rarity === 'epic' ? 'نادر' : 'عادي'}
                </div>
                <div className="text-2xl font-extrabold">{opening.reward}</div>
                <button onClick={() => setOpening(null)} className="mt-5 px-5 py-2 rounded-full bg-white/20 backdrop-blur text-white font-bold border border-white/40">رائع!</button>
                {opening.rarity === 'legendary' && <Confetti />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Inventory() {
  const inv = getInventory();
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
      <div>🍖 طعام: {inv.dinoFood}</div>
      <div>🎨 ألوان: {inv.dinoColors.length}</div>
      <div>🌄 خلفيات: {inv.uiBackgrounds.length}</div>
      <div>👑 تيجان: {inv.crowns.length}</div>
      <div>🎭 ثيمات نادرة: {inv.rareThemes.length}</div>
    </div>
  );
}

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {Array.from({ length: 30 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-2 h-2 rounded-sm animate-[fall_1.2s_linear_forwards]"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10%',
            background: ['#fde047', '#f472b6', '#60a5fa', '#34d399'][i % 4],
            animationDelay: `${Math.random() * 0.5}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(120vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}