import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Car, X } from 'lucide-react';

interface Props { onScore?: (n: number) => void; }

/**
 * Bank El-Haz — classic Egyptian Monopoly-style game.
 * 1-4 players, starting balance 1500 EGP, 24 spaces with properties,
 * cars as player tokens, dice movement, buy/rent.
 */

interface Space {
  name: string;
  nameAr: string;
  price: number; // 0 = special (start, jail, free, tax)
  rent: number;
  color?: string; // group color
  type: 'prop' | 'start' | 'jail' | 'tax' | 'chance';
}

const BOARD: Space[] = [
  { name: 'GO', nameAr: 'بداية', price: 0, rent: 0, type: 'start' },
  { name: 'Alex', nameAr: 'الإسكندرية', price: 60, rent: 8, color: 'bg-amber-700', type: 'prop' },
  { name: 'Chance', nameAr: 'صندوق الحظ', price: 0, rent: 0, type: 'chance' },
  { name: 'Aswan', nameAr: 'أسوان', price: 80, rent: 10, color: 'bg-amber-700', type: 'prop' },
  { name: 'Tax', nameAr: 'ضريبة 100', price: 0, rent: 100, type: 'tax' },
  { name: 'Cairo Train', nameAr: 'محطة القاهرة', price: 200, rent: 25, color: 'bg-slate-800', type: 'prop' },
  { name: 'Tanta', nameAr: 'طنطا', price: 100, rent: 12, color: 'bg-cyan-500', type: 'prop' },
  { name: 'Mansoura', nameAr: 'المنصورة', price: 120, rent: 14, color: 'bg-cyan-500', type: 'prop' },
  { name: 'Jail', nameAr: 'السجن', price: 0, rent: 0, type: 'jail' },
  { name: 'Luxor', nameAr: 'الأقصر', price: 140, rent: 18, color: 'bg-pink-500', type: 'prop' },
  { name: 'Chance', nameAr: 'صندوق الحظ', price: 0, rent: 0, type: 'chance' },
  { name: 'Hurghada', nameAr: 'الغردقة', price: 160, rent: 20, color: 'bg-pink-500', type: 'prop' },
  { name: 'Sharm', nameAr: 'شرم الشيخ', price: 180, rent: 22, color: 'bg-orange-500', type: 'prop' },
  { name: 'Train Alex', nameAr: 'محطة إسكندرية', price: 200, rent: 25, color: 'bg-slate-800', type: 'prop' },
  { name: 'Marsa', nameAr: 'مرسى علم', price: 220, rent: 28, color: 'bg-orange-500', type: 'prop' },
  { name: 'Free Park', nameAr: 'حديقة مجانية', price: 0, rent: 0, type: 'start' },
  { name: 'Giza', nameAr: 'الجيزة', price: 240, rent: 30, color: 'bg-red-500', type: 'prop' },
  { name: 'Maadi', nameAr: 'المعادي', price: 260, rent: 32, color: 'bg-red-500', type: 'prop' },
  { name: 'Tax', nameAr: 'ضريبة 75', price: 0, rent: 75, type: 'tax' },
  { name: 'Zamalek', nameAr: 'الزمالك', price: 280, rent: 35, color: 'bg-yellow-500', type: 'prop' },
  { name: 'Mohandesin', nameAr: 'المهندسين', price: 300, rent: 38, color: 'bg-yellow-500', type: 'prop' },
  { name: 'Chance', nameAr: 'صندوق الحظ', price: 0, rent: 0, type: 'chance' },
  { name: 'New Cairo', nameAr: 'القاهرة الجديدة', price: 350, rent: 50, color: 'bg-emerald-600', type: 'prop' },
  { name: 'Sheikh Z.', nameAr: 'الشيخ زايد', price: 400, rent: 60, color: 'bg-emerald-600', type: 'prop' },
];

const CAR_COLORS = ['text-red-500', 'text-blue-500', 'text-emerald-500', 'text-amber-500'];
const PLAYER_NAMES_AR = ['اللاعب 1', 'اللاعب 2', 'اللاعب 3', 'اللاعب 4'];
const PLAYER_NAMES_EN = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
const START_BALANCE = 1500;
const JAIL_INDEX = 8;

interface ChanceCard { ar: string; en: string; effect: 'pay' | 'win' | 'jail'; amount?: number; }
const CHANCE_DECK: ChanceCard[] = [
  { ar: 'ادفع غرامة 50 ج.م', en: 'Pay fine 50 EGP', effect: 'pay', amount: 50 },
  { ar: 'ربحت 100 ج.م 🎉', en: 'You won 100 EGP 🎉', effect: 'win', amount: 100 },
  { ar: 'اذهب مباشرة إلى السجن 🚓', en: 'Go directly to Jail 🚓', effect: 'jail' },
  { ar: 'مكافأة بنكية: +200 ج.م', en: 'Bank bonus: +200 EGP', effect: 'win', amount: 200 },
  { ar: 'ضريبة طرق: -75 ج.م', en: 'Road tax: -75 EGP', effect: 'pay', amount: 75 },
  { ar: 'هدية الحظ: +50 ج.م', en: 'Lucky gift: +50 EGP', effect: 'win', amount: 50 },
];

interface BuyPrompt { player: number; spaceIndex: number; }

const BankElHaz = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [numPlayers, setNumPlayers] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [pos, setPos] = useState<number[]>([]);
  const [bal, setBal] = useState<number[]>([]);
  const [owner, setOwner] = useState<(number | null)[]>(() => Array(BOARD.length).fill(null));
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [log, setLog] = useState<string>('');
  const [winner, setWinner] = useState<number | null>(null);
  const [buyPrompt, setBuyPrompt] = useState<BuyPrompt | null>(null);
  const [chanceCard, setChanceCard] = useState<ChanceCard | null>(null);
  const [jailTurns, setJailTurns] = useState<number[]>([]); // remaining skipped turns per player; 0 = free
  const [jailPrompt, setJailPrompt] = useState<number | null>(null); // player index awaiting jail decision
  const [hasRolled, setHasRolled] = useState(false); // gates auto-progression — manual control

  const start = (n: number) => {
    setNumPlayers(n);
    setPos(Array(n).fill(0));
    setBal(Array(n).fill(START_BALANCE));
    setOwner(Array(BOARD.length).fill(null));
    setTurn(0); setDice(null); setLog(''); setWinner(null);
    setJailTurns(Array(n).fill(0));
    setBuyPrompt(null); setChanceCard(null); setJailPrompt(null); setHasRolled(false);
  };

  const T = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Build perimeter coordinates for a 7×7 board (24 cells around the edge).
  // Order matches BOARD index 0..23 going clockwise from top-left corner.
  // 7×7 perimeter has exactly 4*(7-1) = 24 cells.
  const SIDE = 7;
  const perimeter: { r: number; c: number }[] = (() => {
    const cells: { r: number; c: number }[] = [];
    for (let c = 0; c < SIDE; c++) cells.push({ r: 0, c });           // top L→R
    for (let r = 1; r < SIDE; r++) cells.push({ r, c: SIDE - 1 });    // right T→B
    for (let c = SIDE - 2; c >= 0; c--) cells.push({ r: SIDE - 1, c });// bottom R→L
    for (let r = SIDE - 2; r > 0; r--) cells.push({ r, c: 0 });        // left B→T
    return cells;
  })();

  const advanceTurn = (balances: number[]) => {
    if (numPlayers === null) return;
    setHasRolled(false);
    let next = (turn + 1) % numPlayers;
    while (balances[next] <= 0 && next !== turn) next = (next + 1) % numPlayers;
    setTurn(next);
    // Jail check at start of next turn
    if (jailTurns[next] > 0) {
      setJailPrompt(next);
    }
  };

  const roll = () => {
    if (winner !== null || numPlayers === null) return;
    if (hasRolled || buyPrompt || chanceCard || jailPrompt !== null) return;
    // If currently in jail, must resolve via jailPrompt first
    if (jailTurns[turn] > 0) { setJailPrompt(turn); return; }
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    setDice([d1, d2]);
    setHasRolled(true);
    const sum = d1 + d2;
    const np = [...pos];
    const oldPos = np[turn];
    np[turn] = (np[turn] + sum) % BOARD.length;
    // passed GO
    let nb = [...bal];
    if (np[turn] < oldPos) nb[turn] += 200;
    const space = BOARD[np[turn]];
    let logMsg = `${(lang === 'ar' ? PLAYER_NAMES_AR : PLAYER_NAMES_EN)[turn]} 🎲 ${d1}+${d2} → ${lang === 'ar' ? space.nameAr : space.name}`;
    let needsPrompt = false;

    if (space.type === 'tax') {
      nb[turn] -= space.rent;
      logMsg += ` · −${space.rent}`;
    } else if (space.type === 'chance') {
      const card = CHANCE_DECK[Math.floor(Math.random() * CHANCE_DECK.length)];
      setChanceCard(card);
      needsPrompt = true;
      logMsg += ` · 🎴`;
    } else if (space.type === 'jail') {
      // Just visiting — no action.
      logMsg += ` · ${T('زيارة فقط', 'just visiting')}`;
    } else if (space.type === 'prop') {
      const o = owner[np[turn]];
      if (o !== null && o !== turn) {
        nb[turn] -= space.rent;
        nb[o] += space.rent;
        logMsg += ` · ${T('إيجار', 'rent')} ${space.rent} → P${o + 1}`;
      } else if (o === null && nb[turn] >= space.price) {
        // PROMPT player — no auto-buy.
        setBuyPrompt({ player: turn, spaceIndex: np[turn] });
        needsPrompt = true;
      }
    }

    // Bankruptcy check
    const alive = nb.map(b => b > 0);
    const aliveCount = alive.filter(Boolean).length;
    if (aliveCount === 1 && numPlayers > 1) {
      const w = alive.findIndex(Boolean);
      setWinner(w);
      onScore?.(15);
    }

    setPos(np); setBal(nb); setLog(logMsg);
    // If a modal needs to show, hold turn until user resolves it.
    if (!needsPrompt && winner === null) advanceTurn(nb);
  };

  const resolveBuy = (yes: boolean) => {
    if (!buyPrompt) return;
    const { player, spaceIndex } = buyPrompt;
    const space = BOARD[spaceIndex];
    const nb = [...bal];
    if (yes && nb[player] >= space.price) {
      nb[player] -= space.price;
      const newOwner = [...owner]; newOwner[spaceIndex] = player; setOwner(newOwner);
      setBal(nb);
      setLog(l => l + ` · 🏠 ${T('اشترى', 'bought')} ${space.price}`);
    } else {
      setLog(l => l + ` · ${T('رفض الشراء', 'declined')}`);
    }
    setBuyPrompt(null);
    if (winner === null) advanceTurn(nb);
  };

  const resolveChance = () => {
    if (!chanceCard) return;
    const nb = [...bal];
    const np = [...pos];
    if (chanceCard.effect === 'pay') nb[turn] -= chanceCard.amount ?? 0;
    else if (chanceCard.effect === 'win') nb[turn] += chanceCard.amount ?? 0;
    else if (chanceCard.effect === 'jail') {
      np[turn] = JAIL_INDEX;
      const jt = [...jailTurns]; jt[turn] = 3; setJailTurns(jt);
      setPos(np);
    }
    setBal(nb);
    setChanceCard(null);
    if (winner === null) advanceTurn(nb);
  };

  const resolveJail = (payToExit: boolean) => {
    if (jailPrompt === null) return;
    const p = jailPrompt;
    const nb = [...bal];
    const jt = [...jailTurns];
    if (payToExit) {
      if (nb[p] >= 50) {
        nb[p] -= 50;
        jt[p] = 0;
        setLog(`${(lang === 'ar' ? PLAYER_NAMES_AR : PLAYER_NAMES_EN)[p]} ${T('دفع 50 وخرج من السجن', 'paid 50, free')}`);
      }
    } else {
      jt[p] = Math.max(0, jt[p] - 1);
      setLog(`${(lang === 'ar' ? PLAYER_NAMES_AR : PLAYER_NAMES_EN)[p]} ${T(`ينتظر في السجن (${jt[p]} متبقية)`, `waits in jail (${jt[p]} left)`)}`);
    }
    setBal(nb); setJailTurns(jt); setJailPrompt(null);
    if (jt[p] > 0) {
      // Skip this player's turn
      if (winner === null) advanceTurn(nb);
    }
    // else they're free — they may roll on this turn now.
  };

  if (numPlayers === null) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-400 to-orange-600 text-white">
          <h2 className="text-2xl font-extrabold">💰 {T('بنك الحظ', 'Bank El-Haz')}</h2>
          <p className="text-sm mt-1 opacity-90">{T('لعبة مونوبولي مصرية كلاسيكية', 'Classic Egyptian Monopoly')}</p>
          <p className="text-xs mt-2 opacity-80">{T(`رصيد البداية: ${START_BALANCE} جنيه`, `Start: ${START_BALANCE} EGP`)}</p>
        </div>
        <p className="text-sm font-bold text-foreground dark:text-white">{T('اختاري عدد اللاعبين', 'Choose players')}</p>
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          {[1, 2, 3, 4].map(n => (
            <button key={n} onClick={() => { start(n); setShowTutorial(true); }}
              className="py-4 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-xl active:scale-95">
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const renderSpace = (i: number) => {
    const s = BOARD[i];
    const here = pos.map((p, idx) => p === i ? idx : -1).filter(x => x >= 0);
    const o = owner[i];
    return (
      <div key={i} className={`relative rounded-md p-1 text-[8px] flex flex-col bg-card border w-full h-full overflow-hidden ${o !== null ? 'border-2' : 'border-border'} ${turn === here[0] ? '' : ''}`}
        style={o !== null ? { borderColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][o] } : undefined}>
        {s.color && <div className={`h-1.5 ${s.color} rounded-sm mb-0.5`} />}
        <p className="font-bold leading-tight truncate text-foreground dark:text-white">{lang === 'ar' ? s.nameAr : s.name}</p>
        {s.type === 'prop' && <p className="text-[7px] opacity-70">${s.price}</p>}
        <div className="flex flex-wrap gap-0.5 mt-auto">
          {here.map(p => <Car key={p} size={10} className={CAR_COLORS[p]} fill="currentColor" />)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 relative">
      {/* Perimeter board — 7×7 grid with center "Bank" hub like the photo */}
      <div
        className="grid gap-1 p-2 rounded-2xl bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 dark:from-amber-900/40 dark:via-yellow-900/30 dark:to-orange-900/40 ring-2 ring-amber-400 shadow-xl mx-auto"
        style={{ gridTemplateColumns: `repeat(${SIDE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${SIDE}, minmax(0, 1fr))`, aspectRatio: '1 / 1', maxWidth: '32rem' }}
      >
        {/* Center hub */}
        <div
          className="rounded-xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 text-white flex flex-col items-center justify-center shadow-inner"
          style={{ gridColumn: `2 / span ${SIDE - 2}`, gridRow: `2 / span ${SIDE - 2}` }}
        >
          <span className="text-3xl">🏦</span>
          <p className="font-extrabold text-base mt-1">{T('بنك الحظ', 'Bank El-Haz')}</p>
          <p className="text-[10px] opacity-90">{T('المونوبولي المصري', 'Egyptian Monopoly')}</p>
        </div>
        {/* Perimeter spaces */}
        {BOARD.map((_, i) => {
          const { r, c } = perimeter[i];
          return (
            <div key={i} style={{ gridColumn: c + 1, gridRow: r + 1 }} className="min-h-0">
              {renderSpace(i)}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: numPlayers }).map((_, i) => (
          <div key={i} className={`rounded-xl p-2 text-center ${turn === i && winner === null ? 'ring-2 ring-primary bg-primary/10' : 'bg-secondary'}`}>
            <div className="flex items-center justify-center gap-1">
              <Car size={14} className={CAR_COLORS[i]} fill="currentColor" />
              <p className="text-[10px] font-bold text-foreground dark:text-white">{(lang === 'ar' ? PLAYER_NAMES_AR : PLAYER_NAMES_EN)[i]}</p>
            </div>
            <p className={`text-lg font-extrabold ${bal[i] <= 0 ? 'text-destructive line-through' : ''}`}>{bal[i]} {T('ج.م', 'EGP')}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="flex gap-1">
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 border-2 border-foreground flex items-center justify-center font-extrabold text-foreground dark:text-white">{dice?.[0] ?? '?'}</div>
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 border-2 border-foreground flex items-center justify-center font-extrabold text-foreground dark:text-white">{dice?.[1] ?? '?'}</div>
        </div>
        <button onClick={roll} disabled={winner !== null}
          className="px-5 py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-50">
          🎲 {T('ارمي النرد', 'Roll')}
        </button>
        <button onClick={() => setNumPlayers(null)} className="px-3 py-3 rounded-xl bg-secondary font-bold">↺</button>
      </div>

      <p className="text-xs text-center min-h-[1em] text-foreground dark:text-slate-200">{log}</p>
      {winner !== null && (
        <div className="rounded-xl p-3 bg-emerald-500 text-white text-center font-extrabold">
          🏆 {T(`فاز ${PLAYER_NAMES_AR[winner]}!`, `${PLAYER_NAMES_EN[winner]} wins!`)}
        </div>
      )}

      <button onClick={() => setShowTutorial(true)}
        className="text-xs underline text-primary mx-auto block">
        ❓ {T('عرض التعليمات', 'Show tutorial')}
      </button>

      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowTutorial(false)}>
          <div className="bg-card rounded-2xl p-5 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowTutorial(false)} className="absolute top-2 end-2 p-1 rounded-full hover:bg-secondary">
              <X size={18} />
            </button>
            <h3 className="text-lg font-extrabold mb-2">📘 {T('كيف تلعب', 'How to Play')}</h3>
            <ul className="text-sm space-y-1.5 list-disc ms-5 leading-relaxed">
              <li>{T(`كل لاعب يبدأ بـ ${START_BALANCE} جنيه.`, `Each player starts with ${START_BALANCE} EGP.`)}</li>
              <li>{T('ارمِ النرد لتحريك سيارتك حول اللوحة.', 'Roll the dice to move your car around the board.')}</li>
              <li>{T('عند المرور على البداية تحصل على 200 ج.م.', 'Pass GO to collect 200 EGP.')}</li>
              <li>{T('عند الهبوط على مدينة فارغة، يسألك اللعب: شراء أم لا.', 'Landing on an empty city prompts: Buy or Skip.')}</li>
              <li>{T('ادفع الإيجار لمالك المدينة عند الهبوط عليها.', 'Pay rent to the owner when you land on their city.')}</li>
              <li>{T('صندوق الحظ: بطاقة (دفع غرامة، ربح، أو الذهاب للسجن).', 'Chance card: pay fine, win money, or go to jail.')}</li>
              <li>{T('السجن: ادفع 50 ج.م للخروج فوراً أو انتظر 3 أدوار.', 'Jail: pay 50 EGP to exit or wait 3 turns.')}</li>
              <li>{T('الضرائب تُخصم فوراً.', 'Tax cells deduct immediately.')}</li>
              <li>{T('من ينفد رصيده يُستبعد. آخر لاعب باقٍ يفوز!', 'Bankrupt players are out. Last one standing wins!')}</li>
            </ul>
            <button onClick={() => setShowTutorial(false)}
              className="mt-4 w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-extrabold">
              {T('ابدأ اللعب', 'Start Playing')}
            </button>
          </div>
        </div>
      )}

      {/* Buy property prompt */}
      {buyPrompt && (() => {
        const sp = BOARD[buyPrompt.spaceIndex];
        const name = lang === 'ar' ? sp.nameAr : sp.name;
        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl p-5 max-w-sm w-full shadow-2xl text-center space-y-3">
              <h3 className="text-lg font-extrabold">🏠 {name}</h3>
              <p className="text-sm">{T(`هل تريد شراء هذا العقار بـ ${sp.price} ج.م؟`, `Buy this property for ${sp.price} EGP?`)}</p>
              <p className="text-xs text-muted-foreground">{T(`الإيجار: ${sp.rent} ج.م`, `Rent: ${sp.rent} EGP`)}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => resolveBuy(true)} className="py-2.5 rounded-xl bg-emerald-500 text-white font-extrabold">{T('نعم', 'Yes')}</button>
                <button onClick={() => resolveBuy(false)} className="py-2.5 rounded-xl bg-secondary font-extrabold">{T('لا', 'No')}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Chance card */}
      {chanceCard && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl p-5 max-w-sm w-full shadow-2xl text-center space-y-3">
            <h3 className="text-lg font-extrabold">🎴 {T('بطاقة الحظ', 'Chance Card')}</h3>
            <p className="text-base font-bold">{lang === 'ar' ? chanceCard.ar : chanceCard.en}</p>
            <button onClick={resolveChance} className="w-full py-2.5 rounded-xl bg-white text-amber-700 font-extrabold">
              {T('موافق', 'OK')}
            </button>
          </div>
        </div>
      )}

      {/* Jail prompt */}
      {jailPrompt !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full shadow-2xl text-center space-y-3">
            <h3 className="text-lg font-extrabold">🚓 {T('في السجن', 'In Jail')}</h3>
            <p className="text-sm">{T(`أمامك ${jailTurns[jailPrompt]} دور للخروج`, `${jailTurns[jailPrompt]} turns left`)}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => resolveJail(true)} disabled={bal[jailPrompt] < 50}
                className="py-2.5 rounded-xl bg-emerald-500 text-white font-extrabold disabled:opacity-50">
                {T('ادفع 50 ج.م', 'Pay 50 EGP')}
              </button>
              <button onClick={() => resolveJail(false)} className="py-2.5 rounded-xl bg-secondary font-extrabold">
                {T('انتظار', 'Wait')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankElHaz;
