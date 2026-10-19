import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

/**
 * Simplified single-player Dominoes vs greedy AI.
 * Standard double-six set. Player and AI each draw 7 tiles, the rest is the boneyard.
 * First player to play all tiles wins, or lowest pip count wins on a block.
 */
type Tile = [number, number];

const buildSet = (): Tile[] => {
  const tiles: Tile[] = [];
  for (let i = 0; i <= 6; i++) for (let j = i; j <= 6; j++) tiles.push([i, j]);
  return tiles.sort(() => Math.random() - 0.5);
};

const Dominoes = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [deck, setDeck] = useState(() => buildSet());
  const [board, setBoard] = useState<Tile[]>([]);
  const [hand, setHand] = useState<Tile[]>(() => deck.slice(0, 7));
  const [aiHand, setAiHand] = useState<Tile[]>(() => deck.slice(7, 14));
  const [boneyard, setBoneyard] = useState<Tile[]>(() => deck.slice(14));
  const [turn, setTurn] = useState<'p' | 'a'>('p');
  const [msg, setMsg] = useState('');
  const [over, setOver] = useState(false);

  const ends = useMemo(() => {
    if (board.length === 0) return null;
    return [board[0][0], board[board.length - 1][1]] as [number, number];
  }, [board]);

  const canPlay = (t: Tile, side: 'L' | 'R'): boolean => {
    if (!ends) return true;
    const [l, r] = ends;
    return side === 'L' ? t[0] === l || t[1] === l : t[0] === r || t[1] === r;
  };

  const play = (idx: number, side: 'L' | 'R') => {
    if (turn !== 'p' || over) return;
    let t = hand[idx];
    if (!canPlay(t, side)) { setMsg(lang === 'ar' ? '✗ غير متطابق' : '✗ Invalid'); return; }
    if (ends) {
      if (side === 'L' && t[1] !== ends[0]) t = [t[1], t[0]];
      if (side === 'R' && t[0] !== ends[1]) t = [t[1], t[0]];
    }
    const nb = side === 'L' ? [t, ...board] : [...board, t];
    const nh = hand.filter((_, i) => i !== idx);
    setBoard(nb); setHand(nh); setMsg('');
    if (nh.length === 0) { setMsg(lang === 'ar' ? '🏆 فزت!' : '🏆 You win!'); setOver(true); onScore?.(1); return; }
    setTurn('a');
    setTimeout(() => aiTurn(nb, nh), 600);
  };

  const draw = () => {
    if (turn !== 'p' || over) return;
    if (boneyard.length === 0) { setTurn('a'); setTimeout(() => aiTurn(board, hand), 400); return; }
    setHand([...hand, boneyard[0]]); setBoneyard(boneyard.slice(1));
  };

  const aiTurn = (b: Tile[], _ph: Tile[]) => {
    let aiHandLocal = [...aiHand];
    let bone = [...boneyard];
    let bd = [...b];
    let curEnds: [number, number] | null = bd.length ? [bd[0][0], bd[bd.length - 1][1]] : null;
    // Try to play
    for (let i = 0; i < aiHandLocal.length; i++) {
      const t = aiHandLocal[i];
      if (!curEnds) { bd = [t]; aiHandLocal.splice(i, 1); break; }
      if (t[0] === curEnds[0] || t[1] === curEnds[0]) {
        const tile: Tile = t[1] === curEnds[0] ? t : [t[1], t[0]];
        bd = [tile, ...bd]; aiHandLocal.splice(i, 1); break;
      }
      if (t[0] === curEnds[1] || t[1] === curEnds[1]) {
        const tile: Tile = t[0] === curEnds[1] ? t : [t[1], t[0]];
        bd = [...bd, tile]; aiHandLocal.splice(i, 1); break;
      }
      if (i === aiHandLocal.length - 1) {
        if (bone.length) { aiHandLocal.push(bone[0]); bone = bone.slice(1); break; }
      }
    }
    setBoard(bd); setAiHand(aiHandLocal); setBoneyard(bone);
    if (aiHandLocal.length === 0) {
      setMsg(lang === 'ar' ? '😞 خسرت' : '😞 AI wins'); setOver(true); onScore?.(0); return;
    }
    setTurn('p');
  };

  const reset = () => {
    const d = buildSet();
    setDeck(d); setBoard([]); setHand(d.slice(0, 7)); setAiHand(d.slice(7, 14));
    setBoneyard(d.slice(14)); setTurn('p'); setMsg(''); setOver(false);
  };

  const Pip = ({ t }: { t: Tile }) => (
    <span className="inline-flex items-center bg-white dark:bg-slate-700 border-2 border-foreground rounded-lg px-3 py-2 text-base font-extrabold mx-0.5 shadow-sm text-slate-900 dark:text-white">
      {t[0]}<span className="mx-1 opacity-60">|</span>{t[1]}
    </span>
  );

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="text-lg font-extrabold text-foreground dark:text-white">🁢 {lang === 'ar' ? 'الدومينو' : 'Dominoes'}</h2>
        <p className="text-xs text-muted-foreground">{lang === 'ar' ? `الذكاء الاصطناعي: ${aiHand.length} قطع · المخزون: ${boneyard.length}` : `AI: ${aiHand.length} tiles · Boneyard: ${boneyard.length}`}</p>
      </div>
      <div className="rounded-2xl p-3 bg-emerald-100 dark:bg-emerald-900/40 min-h-[100px] flex flex-wrap items-center justify-center gap-1 overflow-x-auto" dir="ltr">
        {board.length === 0 ? (
          <span className="text-xs text-muted-foreground dark:text-slate-300">{lang === 'ar' ? 'الطاولة فارغة' : 'Board is empty'}</span>
        ) : board.map((t, i) => <Pip key={i} t={t} />)}
      </div>
      <p className="text-center text-xs h-4 font-bold text-foreground dark:text-white">{msg}</p>
      {/* Force LTR for hand row so ← truly = left end and → truly = right end. */}
      <div dir="ltr" className="flex flex-wrap gap-2 justify-center">
        {hand.map((t, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Pip t={t} />
            {!over && (
              <div className="flex gap-1">
                <button
                  onClick={() => play(i, 'L')}
                  aria-label="Play to left end"
                  className="w-10 h-9 rounded-lg bg-primary text-primary-foreground text-lg font-extrabold active:scale-90 shadow"
                >←</button>
                <button
                  onClick={() => play(i, 'R')}
                  aria-label="Play to right end"
                  className="w-10 h-9 rounded-lg bg-primary text-primary-foreground text-lg font-extrabold active:scale-90 shadow"
                >→</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <button onClick={draw} disabled={over || turn !== 'p'} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-50">
          🃏 {lang === 'ar' ? 'سحب' : 'Draw'}
        </button>
        <button onClick={reset} className="px-4 py-2 rounded-xl bg-secondary text-sm font-bold">↺ {lang === 'ar' ? 'إعادة' : 'Reset'}</button>
      </div>
    </div>
  );
};

export default Dominoes;
