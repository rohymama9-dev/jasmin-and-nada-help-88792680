import { toast } from 'sonner';
import { getSkills, getPoints, unlockSkill, SKILL_COSTS, useMetaTick, SkillId } from '@/lib/metaGame';
import { playChime } from '@/lib/asmrAudio';

const SKILLS: { id: SkillId; name: string; desc: string; icon: string; }[] = [
  { id: 'deepFocus', name: 'تركيز عميق', desc: 'كل دقيقة بومودورو = 1.5 نقطة', icon: '🧠' },
  { id: 'expertTrader', name: 'تاجر خبير', desc: 'خصم 10% على الجاتشا والصناديق', icon: '💼' },
  { id: 'luckyAura', name: 'هالة الحظ', desc: 'إزالة خيار "حاول مجدداً" من العجلة', icon: '🍀' },
];

export default function SkillTree() {
  useMetaTick();
  const skills = getSkills();
  const pts = getPoints();

  const buy = (id: SkillId) => {
    if (unlockSkill(id)) { playChime(); toast.success('تم فتح المهارة!'); }
    else toast.error('نقاط غير كافية أو مفتوحة بالفعل');
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">🌳 شجرة المهارات</h3>
      <div className="grid gap-3">
        {SKILLS.map(s => {
          const owned = skills[s.id];
          const cost = SKILL_COSTS[s.id];
          const can = pts >= cost;
          return (
            <div key={s.id} className={`rounded-2xl p-3 border-2 ${owned ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                  </div>
                </div>
                {owned ? (
                  <span className="text-emerald-500 text-xs font-bold">✓ مفتوحة</span>
                ) : (
                  <button
                    onClick={() => buy(s.id)}
                    disabled={!can}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${can ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                  >
                    {cost} نقطة
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}