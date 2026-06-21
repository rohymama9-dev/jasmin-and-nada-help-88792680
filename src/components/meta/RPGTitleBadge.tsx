import { useState } from 'react';
import { getUnlockedTitles, useMetaTick } from '@/lib/metaGame';

export default function RPGTitleBadge() {
  useMetaTick();
  const titles = getUnlockedTitles();
  const [idx, setIdx] = useState(0);
  const t = titles[idx % titles.length];
  return (
    <button
      onClick={() => setIdx(i => (i + 1) % titles.length)}
      className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-white text-[10px] font-bold border border-white/30 hover:bg-white/30 transition-colors shrink-0"
      title={titles.length > 1 ? 'انقر للتبديل بين الألقاب' : ''}
    >
      {t.emoji} {t.label}
    </button>
  );
}