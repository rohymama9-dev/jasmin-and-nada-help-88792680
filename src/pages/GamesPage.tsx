import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import GameInstructions from '@/components/GameInstructions';
import MathChallenge from '@/components/MathChallenge';
import MemoryGame from '@/components/MemoryGame';
import GlobalLeaderboard from '@/components/GlobalLeaderboard';
import WordScramble from '@/components/WordScramble';
import PuzzleSlider from '@/components/PuzzleSlider';
import PatternMatch from '@/components/PatternMatch';
import MazeGame from '@/components/MazeGame';
import WordSearchGame from '@/components/WordSearchGame';
import ShapeSorter from '@/components/ShapeSorter';
import TriviaGame from '@/components/TriviaGame';
import LetterWarGame from '@/components/LetterWarGame';
import SequenceGame from '@/components/SequenceGame';
import SpotDifference from '@/components/SpotDifference';
import MatchPairsGame from '@/components/MatchPairsGame';
import ColorLearning from '@/components/ColorLearning';
import JumperGame from '@/components/JumperGame';
import Chess from '@/components/Chess';
import Dominoes from '@/components/Dominoes';
import BankElHaz from '@/components/BankElHaz';
import SnakesLadders from '@/components/SnakesLadders';
import RacingGame from '@/components/RacingGame';
import VoxelBuilder from '@/components/VoxelBuilder';
import MemoryFlipGame from '@/components/MemoryFlipGame';
import FruitLearning from '@/components/FruitLearning';
import Ludo from '@/components/Ludo';
import ScrewPuzzle from '@/components/ScrewPuzzle';
import WhoIsLying from '@/components/WhoIsLying';
import TicTacToe from '@/components/TicTacToe';
import Sudoku from '@/components/Sudoku';
import ZumaMarble from '@/components/games/ZumaMarble';
import WhackARabbit from '@/components/games/WhackARabbit';
import CarEscape from '@/components/CarEscape';
import TargetShootingGame from '@/components/TargetShootingGame';
import ExplorationGame from '@/components/ExplorationGame';
import PuzzleHub from '@/components/PuzzleHub';
import LogicGames from '@/components/LogicGames';
import FarmSimulator from '@/components/FarmSimulator';
import CatchColorGame from '@/components/CatchColorGame';
import PartyGames from '@/components/PartyGames';
import SimGate from '@/components/SimGate';
import Game2048Viewer from '@/components/Game2048Viewer';

interface GamesPageProps {
  points: number;
  gamePoints: number;
  addPoints: (n: number) => void;
}

type Difficulty = 'beginner' | 'intermediate' | 'pro';

interface GameEntry {
  id: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
  descAr: string;
  descEn: string;
  minAge: number;
  color: string;
  instructionsAr: string[];
  instructionsEn: string[];
}

const games: GameEntry[] = [
  { id: '2048', nameAr: '2048', nameEn: '2048', emoji: '🔢', descAr: 'ادمج الأرقام للوصول إلى 2048', descEn: 'Merge tiles to reach 2048', minAge: 7, color: 'from-blue-500 to-cyan-600',
    instructionsAr: ['استخدم الأسهم أو مفاتيح WASD','ادمج الأرقام المتطابقة','اصل إلى 2048 للفوز'],
    instructionsEn: ['Use arrow keys or WASD','Combine matching numbers','Reach 2048 to win'] },
  { id: 'trivia', nameAr: 'من سيربح المليون', nameEn: 'Millionaire Trivia', emoji: '💰', descAr: 'أسئلة ثقافية متنوعة', descEn: 'Trivia questions', minAge: 6, color: 'from-amber-500 to-yellow-600',
    instructionsAr: ['أجب على الأسئلة بالترتيب','استخدم وسائل المساعدة الثلاث','كل إجابة صحيحة تزيد من رصيدك','إجابة خاطئة تنهي اللعبة'],
    instructionsEn: ['Answer questions in order','Use 3 lifelines wisely','Each correct answer counts','Wrong answer ends the game'] },
  { id: 'letterwar', nameAr: 'حرب الحروف والأرقام', nameEn: 'Letter & Number War', emoji: '⚔️', descAr: 'تحدي الحروف والحساب', descEn: 'Letters & math challenge', minAge: 5, color: 'from-red-500 to-rose-600',
    instructionsAr: ['اقرأ السؤال','اكتب الإجابة الصحيحة','تعلم الحروف والأرقام بطريقة ممتعة'],
    instructionsEn: ['Read the question','Type the correct answer','Learn letters and numbers in a fun way'] },
  { id: 'sequence', nameAr: 'تذكر التسلسل', nameEn: 'Sequence Memory', emoji: '🧠', descAr: 'تدريب الذاكرة والتركيز', descEn: 'Memory & focus training', minAge: 4, color: 'from-purple-500 to-indigo-600',
    instructionsAr: ['شاهد التسلسل المضيء','أعد الضغط بنفس الترتيب','كل مستوى يزداد صعوبة'],
    instructionsEn: ['Watch the lit sequence','Repeat in same order','Each level gets harder'] },
  { id: 'spotdiff', nameAr: 'اكتشف الاختلاف', nameEn: 'Spot Difference', emoji: '🔍', descAr: 'ابحث عن العناصر المختلفة', descEn: 'Find different elements', minAge: 4, color: 'from-cyan-500 to-teal-600',
    instructionsAr: ['قارن بين الشبكتين','اضغط على العنصر المختلف','جد كل الاختلافات للفوز'],
    instructionsEn: ['Compare two grids','Tap the different item','Find all differences to win'] },
  { id: 'matchpairs', nameAr: 'طابق الأزواج', nameEn: 'Match Pairs', emoji: '🔗', descAr: 'طابق الرموز مع أسمائها', descEn: 'Match emojis to names', minAge: 4, color: 'from-pink-500 to-fuchsia-600',
    instructionsAr: ['اختر رمزاً من اليسار','اختر الاسم المطابق من اليمين','طابق الكل للفوز'],
    instructionsEn: ['Select emoji from left','Select matching name','Match all to win'] },
  { id: 'math', nameAr: 'تحدي الرياضيات', nameEn: 'Math Challenge', emoji: '🧮', descAr: 'حل مسائل رياضية بسرعة', descEn: 'Solve math problems fast', minAge: 5, color: 'from-violet-500 to-purple-600',
    instructionsAr: ['حل المسألة قبل انتهاء الوقت','اختر الإجابة الصحيحة','كل إجابة صحيحة = نقاط'],
    instructionsEn: ['Solve before time runs out','Choose correct answer','Each correct = points'] },
  { id: 'memory', nameAr: 'لعبة الذاكرة', nameEn: 'Memory Match', emoji: '🃏', descAr: 'طابق الأزواج واختبر ذاكرتك', descEn: 'Match pairs and test memory', minAge: 4, color: 'from-cyan-500 to-blue-600',
    instructionsAr: ['اقلب بطاقتين لإيجاد الأزواج','تذكر مواقع البطاقات','أقل محاولات = أعلى نقاط'],
    instructionsEn: ['Flip two cards to find pairs','Remember positions','Fewer attempts = higher score'] },
  { id: 'word', nameAr: 'ترتيب الكلمات', nameEn: 'Word Scramble', emoji: '🔤', descAr: 'رتب الحروف لتكوين كلمات', descEn: 'Unscramble letters', minAge: 7, color: 'from-emerald-500 to-green-600',
    instructionsAr: ['رتب الحروف المبعثرة','استخدم التلميحات','أسرع حل = نقاط أكثر'],
    instructionsEn: ['Unscramble letters','Use hints','Faster = more points'] },
  { id: 'puzzle', nameAr: 'لغز التمرير', nameEn: 'Slide Puzzle', emoji: '🧩', descAr: 'رتّب المربعات بالترتيب', descEn: 'Slide tiles into order', minAge: 5, color: 'from-pink-500 to-rose-600',
    instructionsAr: ['حرك المربعات لترتيب الأرقام','المربع الفارغ يسمح بالتحريك','أقل حركات = أعلى نتيجة'],
    instructionsEn: ['Move tiles to arrange numbers','Empty space allows movement','Fewer moves = higher score'] },
  { id: 'pattern', nameAr: 'تطابق الأنماط', nameEn: 'Pattern Match', emoji: '🎯', descAr: 'تذكّر وأعد النمط', descEn: 'Remember patterns', minAge: 4, color: 'from-amber-500 to-orange-600',
    instructionsAr: ['شاهد النمط المضيء','أعد تكراره','كل مستوى يزداد صعوبة'],
    instructionsEn: ['Watch light pattern','Repeat it','Each level gets harder'] },
  { id: 'maze', nameAr: 'المتاهة', nameEn: 'Maze', emoji: '🏁', descAr: 'اعثر على طريق الخروج', descEn: 'Find the exit', minAge: 4, color: 'from-lime-500 to-green-600',
    instructionsAr: ['استخدم الأسهم','تجنب الجدران','الوصول للمخرج 🏁'],
    instructionsEn: ['Use arrows','Avoid walls','Reach exit 🏁'] },
  { id: 'wordsearch', nameAr: 'البحث عن الكلمات', nameEn: 'Word Search', emoji: '🔎', descAr: 'ابحث عن الكلمات المخفية', descEn: 'Find hidden words', minAge: 6, color: 'from-indigo-500 to-violet-600',
    instructionsAr: ['اضغط الحروف لتكوين الكلمة','مخبأة أفقياً وعمودياً وقطرياً','جد الكل للفوز'],
    instructionsEn: ['Tap letters','Hidden in rows, columns, diagonals','Find all to win'] },
  { id: 'shapes', nameAr: 'فرز الأشكال', nameEn: 'Shape Sorter', emoji: '🔷', descAr: 'صنّف الأشكال حسب النوع', descEn: 'Sort shapes by type', minAge: 3, color: 'from-orange-500 to-red-600',
    instructionsAr: ['انظر للشكل المطلوب','اضغط المطابقة','تجنب الخاطئة'],
    instructionsEn: ['Look at target','Tap matching','Avoid wrong'] },
  { id: 'colorlearn', nameAr: 'تعلم الألوان', nameEn: 'Color Learning', emoji: '🌈', descAr: 'اضغط اللون الصحيح واسمع اسمه', descEn: 'Tap the right color & hear its name', minAge: 3, color: 'from-pink-500 to-rose-600',
    instructionsAr: ['اقرأ اسم اللون','استمع للنطق العربي والإنجليزي','اضغط اللون المطابق'],
    instructionsEn: ['Read the color name','Listen to Arabic & English pronunciation','Pick the matching color'] },
  { id: 'fruitlearn', nameAr: 'تعلم الفواكه', nameEn: 'Fruit Learning', emoji: '🍎', descAr: 'تعلم أسماء الفواكه بالصوت العربي والإنجليزي', descEn: 'Learn fruit names with Arabic & English voice', minAge: 3, color: 'from-red-400 to-orange-500',
    instructionsAr: ['اضغط ▶ للتنقل بين الفواكه','استمع للنطق العربي ثم الإنجليزي','جرب وضع الاختبار لتمرين نفسك'],
    instructionsEn: ['Tap ▶ to browse fruits','Listen to Arabic then English voice','Try Quiz mode to test yourself'] },
  { id: 'jumper', nameAr: 'الأرنب القافز', nameEn: 'Jumper', emoji: '🐰', descAr: 'اقفز فوق العقبات', descEn: 'Jump over obstacles', minAge: 5, color: 'from-sky-500 to-blue-600',
    instructionsAr: ['انقر أو مسافة للقفز','تجنب العقبات الحمراء','أكمل المسافة للفوز'],
    instructionsEn: ['Tap or SPACE to jump','Avoid red obstacles','Reach the goal'] },
  { id: 'chess', nameAr: 'الشطرنج', nameEn: 'Chess', emoji: '♟️', descAr: 'العب ضد الذكاء الاصطناعي', descEn: 'Play vs AI', minAge: 8, color: 'from-slate-700 to-zinc-900',
    instructionsAr: ['اضغط قطعتك ثم المربع المراد','الذكاء الاصطناعي يلعب الأسود','اقتنص الملك للفوز'],
    instructionsEn: ['Tap your piece, then target square','AI plays black','Capture the king to win'] },
  { id: 'dominoes', nameAr: 'الدومينو', nameEn: 'Dominoes', emoji: '🁫', descAr: 'دومينو ضد الكمبيوتر', descEn: 'Dominoes vs AI', minAge: 7, color: 'from-amber-700 to-stone-800',
    instructionsAr: ['اختر بلاطة ثم الجهة','طابق الأرقام بأطراف اللوح','تخلص من بلاطاتك أولاً'],
    instructionsEn: ['Pick a tile then a side','Match numbers on board ends','Empty your hand first'] },
  { id: 'bankhaz', nameAr: 'بنك الحظ', nameEn: 'Bank El Haz', emoji: '🎲', descAr: 'لعبة المخاطرة لاعبين', descEn: '2-player risk game', minAge: 6, color: 'from-yellow-500 to-amber-700',
    instructionsAr: ['ارمِ النردين','بنّك أرباحك قبل ظهور الـ7','أعلى مجموع بعد 10 جولات يفوز'],
    instructionsEn: ['Roll two dice','Bank earnings before a 7','Highest after 10 rounds wins'] },
  { id: 'snakes', nameAr: 'السلم والثعبان', nameEn: 'Snakes & Ladders', emoji: '🐍', descAr: 'لعبة كلاسيكية لاعبين', descEn: 'Classic 2-player', minAge: 5, color: 'from-emerald-500 to-green-700',
    instructionsAr: ['ارمِ النرد بالدور','اصعد السلالم وتجنّب الثعابين','أوّل من يصل 100 يفوز'],
    instructionsEn: ['Take turns rolling','Climb ladders, dodge snakes','First to 100 wins'] },
  { id: 'ludo', nameAr: 'لودو', nameEn: 'Ludo', emoji: '🎲', descAr: 'كلاسيك ٢ أو ٤ لاعبين', descEn: '2 or 4 players vs bots', minAge: 6, color: 'from-rose-500 to-indigo-600',
    instructionsAr: ['اختر ٢ أو ٤ لاعبين وحدد البوتات','احصل على ٦ لإخراج قطعة من الزاوية','أكمل دورة كاملة وادخل بيت اللون','أوّل من يُنهي ٤ قطع يفوز'],
    instructionsEn: ['Pick 2 or 4 players & toggle bots','Roll a 6 to leave the yard','Loop the board and enter your colored home','First to finish all 4 tokens wins'] },
  { id: 'racing', nameAr: 'سباق سيارات', nameEn: 'Racing', emoji: '🏎️', descAr: 'سباق بمسار عشوائي', descEn: 'Race on randomized tracks', minAge: 6, color: 'from-zinc-600 to-slate-800',
    instructionsAr: ['استخدم ← → لتغيير الحارة','تجنب السيارات الأخرى','أكمل المسافة للفوز'],
    instructionsEn: ['Use ← → to change lanes','Avoid other cars','Finish the distance'] },
  { id: 'voxel', nameAr: 'باني الفوكسل', nameEn: 'Voxel Builder', emoji: '🧱', descAr: 'انسخ النموذج بالألوان', descEn: 'Copy the target with colors', minAge: 5, color: 'from-emerald-600 to-teal-700',
    instructionsAr: ['اختر لوناً من الأسفل','اضغط الخلية لتلوينها','طابق النموذج 100%'],
    instructionsEn: ['Pick a color below','Tap a cell to paint','Match the target 100%'] },
  { id: 'memflip', nameAr: 'قلب البطاقات', nameEn: 'Memory Flip', emoji: '🎴', descAr: 'اعثر على الأزواج', descEn: 'Find all pairs', minAge: 4, color: 'from-violet-500 to-purple-700',
    instructionsAr: ['اقلب بطاقتين','اعثر على الزوج','المستويات تكبر تدريجياً'],
    instructionsEn: ['Flip two cards','Find the matching pair','Levels grow gradually'] },
  { id: 'screw', nameAr: 'لغز المسامير', nameEn: 'Screw Puzzle', emoji: '🔩', descAr: 'رتب الألوان في الأنابيب', descEn: 'Sort colors into tubes', minAge: 6, color: 'from-stone-500 to-zinc-700',
    instructionsAr: ['اضغط أنبوباً ثم آخر','انقل المسمار العلوي إذا تطابق اللون','رتب كل أنبوب بلون واحد'],
    instructionsEn: ['Tap a tube then another','Move top screw if color matches','Sort each tube to one color'] },
  { id: 'lying', nameAr: 'من الكاذب؟', nameEn: 'Who Is Lying?', emoji: '🕵️', descAr: 'لغز منطقي — اكتشف الكاذب', descEn: 'Logic puzzle — find the liar', minAge: 8, color: 'from-fuchsia-600 to-purple-800',
    instructionsAr: ['اقرأ الأقوال الثلاثة','واحد فقط يكذب','اضغط على الكاذب'],
    instructionsEn: ['Read the 3 statements','Only one is lying','Tap the liar'] },
  { id: 'tictactoe', nameAr: 'إكس و أو', nameEn: 'Tic-Tac-Toe', emoji: '⭕', descAr: 'العب ضد الكمبيوتر أو صديق', descEn: 'Play vs computer or a friend', minAge: 4, color: 'from-orange-500 to-rose-500',
    instructionsAr: ['اختر الوضع: ضد الكمبيوتر أو لاعبان','اضغط مربعاً لوضع علامتك','أوّل من يصف ٣ يفوز'],
    instructionsEn: ['Choose mode: vs Computer or 2 Players','Tap a cell to place your mark','First to line up 3 wins'] },
  { id: 'sudoku', nameAr: 'سودوكو', nameEn: 'Sudoku', emoji: '🧩', descAr: 'لغز الأرقام الكلاسيكي', descEn: 'Classic number puzzle', minAge: 8, color: 'from-slate-600 to-slate-900',
    instructionsAr: ['املأ الشبكة بالأرقام ١-٩','بدون تكرار في الصف أو العمود أو المربع','استخدم التلميحات بحكمة'],
    instructionsEn: ['Fill the grid with 1-9','No repeats in row, column, or 3×3 box','Use hints wisely'] },
  { id: 'zuma', nameAr: 'زوما المرمر', nameEn: 'Zuma Marble', emoji: '🐸', descAr: 'صوّب الكرات لمطابقة ٣ ألوان قبل وصولها للحفرة', descEn: 'Shoot marbles to match 3 colors before they reach the hole', minAge: 6, color: 'from-emerald-500 to-indigo-700',
    instructionsAr: ['وجّه الضفدع نحو السلسلة','اضغط لإطلاق الكرة','طابق ٣ ألوان أو أكثر لتفجيرها'],
    instructionsEn: ['Aim the frog at the chain','Tap to shoot a marble','Match 3+ same-color marbles to pop them'] },
  { id: 'whackrabbit', nameAr: 'اضرب الأرنب', nameEn: 'Whack-A-Rabbit', emoji: '🐰', descAr: 'اضربي الأرانب وتجنّبي القنابل — مع تأثير POW!', descEn: 'Whack rabbits, dodge bombs — with POW! particles', minAge: 4, color: 'from-amber-500 to-orange-600',
    instructionsAr: ['اضغطي الأرنب 🐰 لكسب نقطة','تجنّبي القنابل 💣 — تخصم نقطتين','المستوى يرتفع كل ١٠ ضربات'],
    instructionsEn: ['Tap the 🐰 to score','Avoid 💣 — costs 2 points','Level scales every 10 hits'] },
  { id: 'carescape', nameAr: 'لغز هروب السيارة', nameEn: 'Car Escape Puzzle', emoji: '🚗', descAr: 'لغز تحريك السيارات للخروج', descEn: 'Move cars to find the exit', minAge: 6, color: 'from-red-500 to-orange-600',
    instructionsAr: ['حرك السيارات لفتح الطريق','أخرج السيارة الحمراء','حل اللغز في أقل عدد من الحركات'],
    instructionsEn: ['Move cars to clear the path','Get the red car out','Solve in minimum moves'] },
  { id: 'shooting', nameAr: 'إصابة الأهداف', nameEn: 'Target Shooting', emoji: '🎯', descAr: 'صوب بدقة نحو الأهداف', descEn: 'Aim precisely at targets', minAge: 5, color: 'from-red-400 to-rose-500',
    instructionsAr: ['صوب نحو الأهداف المتحركة','اضغط للإطلاق','اجمع النقاط قبل انتهاء الوقت'],
    instructionsEn: ['Aim at moving targets','Tap to shoot','Collect points before time runs out'] },
  { id: 'explorer', nameAr: 'عالم الاستكشاف', nameEn: '2D Explorer', emoji: '🗺️', descAr: 'استكشف العالم واجمع الكنوز', descEn: 'Explore the world and find treasures', minAge: 6, color: 'from-teal-400 to-cyan-500',
    instructionsAr: ['تحرك في الخريطة','اجمع العناصر المفيدة','تجنب العقبات'],
    instructionsEn: ['Move around the map','Collect useful items','Avoid obstacles'] },
  { id: 'puzzlehub', nameAr: 'مركز الألغاز', nameEn: 'Puzzle Hub', emoji: '🧩', descAr: 'مجموعة ألغاز متنوعة', descEn: 'Collection of various puzzles', minAge: 5, color: 'from-violet-500 to-purple-700',
    instructionsAr: ['اختر لغزاً من المجموعة','اتبع التعليمات الخاصة بكل لغز','اجمع النقاط'],
    instructionsEn: ['Pick a puzzle from the collection','Follow specific instructions','Earn points'] },
  { id: 'logic', nameAr: 'ألعاب المنطق', nameEn: 'Logic Games', emoji: '💡', descAr: 'تحديات منطقية ذكية', descEn: 'Smart logic challenges', minAge: 8, color: 'from-cyan-500 to-blue-700',
    instructionsAr: ['فكر في الحل المنطقي','حل التحدي للانتقال للمستوى التالي','استخدم ذكاءك'],
    instructionsEn: ['Think logically','Solve to reach next level','Use your brain power'] },
  { id: 'farm', nameAr: 'المزرعة', nameEn: 'Farm Simulator', emoji: '👩‍🌾', descAr: 'قم بإدارة مزرعتك الخاصة', descEn: 'Manage your own farm', minAge: 6, color: 'from-green-500 to-lime-600',
    instructionsAr: ['ازرع المحاصيل','اهتم بالحيوانات','وسع مزرعتك'],
    instructionsEn: ['Plant crops','Take care of animals','Expand your farm'] },
  { id: 'catchcolor', nameAr: 'امسكي اللون', nameEn: 'Catch The Color', emoji: '🎨', descAr: 'التقط الألوان المتساقطة', descEn: 'Catch the falling colors', minAge: 4, color: 'from-red-400 to-pink-600',
    instructionsAr: ['حرك السلة لالتقاط الألوان','طابق اللون المطلوب','تجنب الألوان الخاطئة'],
    instructionsEn: ['Move the basket to catch colors','Match the target color','Avoid wrong colors'] },
  { id: 'partygames', nameAr: 'ألعاب الحفلات', nameEn: 'Party Games', emoji: '🎉', descAr: 'ألعاب جماعية ممتعة', descEn: 'Fun group games', minAge: 5, color: 'from-pink-500 to-orange-500',
    instructionsAr: ['العب مع أصدقائك','اختر نوع اللعبة','استمتع بالوقت'],
    instructionsEn: ['Play with friends','Choose game type','Have fun together'] },
];

const POINT_GATE = 100;

const GamesPage = ({ points, gamePoints, addPoints }: GamesPageProps) => {
  const { t, lang } = useLang();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const internal: Difficulty = 'intermediate';
  const awardGameOutcome = (result: number | boolean = true) => {
    const isPositive = typeof result === 'boolean' ? result : result > 0;
    addPoints(isPositive ? 2 : 1);
  };

  if (activeGame) {
    const game = games.find(g => g.id === activeGame);
    return (
      <div className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setActiveGame(null)} className="text-primary text-sm font-medium flex items-center gap-1">← {t('back')}</button>
          {game && <GameInstructions titleAr={game.nameAr} titleEn={game.nameEn} stepsAr={game.instructionsAr} stepsEn={game.instructionsEn} />}
        </div>
        {activeGame === '2048' && <Game2048Viewer onBack={() => setActiveGame(null)} onScore={awardGameOutcome} />}
        {activeGame === 'trivia' && <TriviaGame onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'letterwar' && <LetterWarGame onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'sequence' && <SequenceGame onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'spotdiff' && <SpotDifference onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'matchpairs' && <MatchPairsGame onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'math' && <MathChallenge onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'memory' && <MemoryGame onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'word' && <WordScramble onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'puzzle' && <PuzzleSlider onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'pattern' && <PatternMatch onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'maze' && <MazeGame onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'wordsearch' && <WordSearchGame onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'shapes' && <ShapeSorter onScore={awardGameOutcome} difficulty={internal} />}
        {activeGame === 'colorlearn' && <ColorLearning onScore={awardGameOutcome} />}
        {activeGame === 'fruitlearn' && <FruitLearning onScore={awardGameOutcome} />}
        {activeGame === 'jumper' && <JumperGame onScore={awardGameOutcome} />}
        {activeGame === 'chess' && <Chess onScore={awardGameOutcome} />}
        {activeGame === 'dominoes' && <Dominoes onScore={awardGameOutcome} />}
        {activeGame === 'bankhaz' && <BankElHaz onScore={awardGameOutcome} />}
        {activeGame === 'snakes' && <SnakesLadders onScore={awardGameOutcome} />}
        {activeGame === 'racing' && <RacingGame onScore={awardGameOutcome} />}
        {activeGame === 'voxel' && <VoxelBuilder onScore={awardGameOutcome} />}
        {activeGame === 'memflip' && <MemoryFlipGame onScore={awardGameOutcome} />}
        {activeGame === 'ludo' && <Ludo onScore={awardGameOutcome} />}
        {activeGame === 'screw' && <ScrewPuzzle onScore={awardGameOutcome} />}
        {activeGame === 'lying' && <WhoIsLying onScore={awardGameOutcome} />}
        {activeGame === 'tictactoe' && <TicTacToe onScore={awardGameOutcome} />}
        {activeGame === 'sudoku' && <Sudoku onScore={awardGameOutcome} />}
        {activeGame === 'zuma' && <ZumaMarble onScore={awardGameOutcome} />}
        {activeGame === 'whackrabbit' && <WhackARabbit onScore={awardGameOutcome} />}
        {activeGame === 'carescape' && <CarEscape onScore={awardGameOutcome} />}
        {activeGame === 'shooting' && <TargetShootingGame onScore={awardGameOutcome} difficulty="intermediate" />}
        {activeGame === 'explorer' && <ExplorationGame onScore={awardGameOutcome} />}
        {activeGame === 'puzzlehub' && <PuzzleHub onScore={awardGameOutcome} />}
        {activeGame === 'logic' && <LogicGames onScore={awardGameOutcome} />}
        {activeGame === 'farm' && (
          <SimGate simId="farm" titleAr="المزرعة" titleEn="Farm Simulator" points={points}>
            {(g) => <FarmSimulator onScore={awardGameOutcome} gender={g} />}
          </SimGate>
        )}
        {activeGame === 'catchcolor' && <CatchColorGame onScore={awardGameOutcome} />}
        {activeGame === 'partygames' && <PartyGames onScore={awardGameOutcome} />}
      </div>
    );
  }

  return (
    <div className="pb-4 space-y-4">
      <div className="text-center mb-2">
        <div className="w-16 h-16 rounded-2xl gradient-gaming flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Gamepad2 size={28} className="text-gaming-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{t('gamingCenter')}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === 'ar' ? 'الصعوبة تتكيّف تلقائياً مع مستواك 🔥' : 'Difficulty adapts to your level 🔥'}
        </p>
      </div>
      <GlobalLeaderboard currentPoints={gamePoints} section="games" />
      <div className="grid grid-cols-1 gap-3">
        {games.map(game => (
          <button key={game.id} onClick={() => setActiveGame(game.id)}
            className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:bg-primary/5 transition-all active:scale-[0.98]">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-lg`}>
              <span className="text-2xl">{game.emoji}</span>
            </div>
            <div className="flex-1 text-start">
              <p className="font-bold text-foreground">{lang === 'ar' ? game.nameAr : game.nameEn}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{lang === 'ar' ? game.descAr : game.descEn}</p>
            </div>
            <div className="text-primary text-xl">→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GamesPage;
