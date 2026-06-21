import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import DailyMagicCards from './DailyMagicCards';
import RaidBoss from './RaidBoss';
import MysteryStore from './MysteryStore';
import SkillTree from './SkillTree';
import DeepFocusRoom from './DeepFocusRoom';
import { getDailyQuest, hasPickedTodayCard } from '@/lib/metaGame';

type Tab = 'raid' | 'store' | 'skills';

export default function MetaHub() {
  const [showCards, setShowCards] = useState(() => !hasPickedTodayCard());
  const [openHub, setOpenHub] = useState(false);
  const [tab, setTab] = useState<Tab>('raid');
  const [focus, setFocus] = useState(false);
  const quest = getDailyQuest();

  return (
    <>
      {showCards && <DailyMagicCards onClose={() => setShowCards(false)} />}
      {focus && <DeepFocusRoom onExit={() => setFocus(false)} />}

      <button
        onClick={() => setOpenHub(true)}
        aria-label="Gamification Hub"
        className="fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-2 border-white/40"
      >
        <Sparkles size={24} />
      </button>

      {openHub && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOpenHub(false)}>
          <div
            onClick={e => e.stopPropagation()}
            dir="rtl"
            className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl"
          >
            <div className="sticky top-0 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold"><Sparkles size={18} /> مركز الإنجازات</div>
              <button onClick={() => setOpenHub(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><X size={16} /></button>
            </div>

            <div className="p-4 space-y-4">
              {quest && (
                <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">مهمة اليوم السرية</div>
                  <div className="text-sm font-bold mt-1">{quest.text}</div>
                  <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">المكافأة: +{quest.reward} نقطة</div>
                </div>
              )}

              <button
                onClick={() => { setOpenHub(false); setFocus(true); }}
                className="w-full rounded-2xl p-4 bg-gradient-to-br from-slate-800 to-indigo-900 text-white text-right shadow-lg hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🌌</div>
                  <div>
                    <div className="font-bold">الوضع العميق</div>
                    <div className="text-xs text-white/70">جلسة 25 دقيقة + أصوات ASMR</div>
                  </div>
                </div>
              </button>

              <div className="flex gap-2 border-b border-border">
                {(['raid', 'store', 'skills'] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                  >
                    {t === 'raid' ? '⚔️ الوحش' : t === 'store' ? '🛍️ المتجر' : '🌳 المهارات'}
                  </button>
                ))}
              </div>

              <div className="pb-6">
                {tab === 'raid' && <RaidBoss />}
                {tab === 'store' && <MysteryStore />}
                {tab === 'skills' && <SkillTree />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}