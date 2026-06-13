import { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap, BookOpen, Languages, Mic, SpellCheck,
  ArrowLeft, Check, X, Volume2, Globe, Type, MessageSquare,
  Headphones, FileText, Quote,
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { markEducationDailyChallenge } from '@/lib/dailyChallenge';

interface EducationHubProps {
  addPoints: (n: number) => void;
}

type Level = 'kids' | 'teen' | 'adult';
type ModuleKey =
  | 'letters'
  | 'words'
  | 'grammar'
  | 'listening'
  | 'texts'
  | 'phrases'
  | 'conversations';

/**
 * UNIFIED PEDAGOGICAL SCHEMA (Duolingo-grade)
 * One Exercise object powers every category. Optional fields keep file lean.
 *
 *  - teachAr/teachEn  → "explanation": concise rule / context block
 *  - exampleAr/En     → 1–2 real contextual sentences with translation
 *  - noteAr/noteEn    → "nuance": common mistakes / fine differences
 *  - promptAr/En      → the actual question
 *  - type:
 *      • 'choice'     → MCQ with smart single-word distractors
 *      • 'fill'       → fill-in-the-blank (MCQ — distractors are SINGLE
 *                       grammatically-plausible but contextually-wrong words,
 *                       NEVER chunks of the sentence)
 *      • 'match'      → word ↔ meaning mapping (rendered as choice grid)
 *      • 'position'   → letter position (start/middle/end)
 *      • 'spell'      → typed answer
 *      • 'speak'      → speaking drill (typed-back confirmation)
 *      • 'listening'  → TTS-played audio + strict distractors
 *  - audioWord        → exact text passed to TTS (for listening/speak)
 */
interface Exercise {
  promptAr: string;
  promptEn: string;
  type: 'choice' | 'fill' | 'match' | 'position' | 'spell' | 'speak' | 'listening';
  optionsAr?: string[];
  optionsEn?: string[];
  correct: string | number;
  hintAr?: string;
  hintEn?: string;
  teachAr?: string;
  teachEn?: string;
  exampleAr?: string;
  exampleEn?: string;
  noteAr?: string;
  noteEn?: string;
  audioWord?: string;
}

const MODULE_REWARD = 25;

/* ================================================================== */
/*  CONTENT TREE — level → module → exercises                          */
/*  Every item: explanation + nuance + example + smart distractors.    */
/* ================================================================== */

const content: Record<Level, Record<ModuleKey, Exercise[]>> = {
  /* ============================= KIDS ============================= */
  kids: {
    letters: [
      {
        teachAr: 'الحروف العربية تتغيّر شكلًا حسب موقعها: أول، وسط، آخر.',
        teachEn: 'Arabic letters change shape based on position: start, middle, end.',
        exampleAr: 'بَطّة (أول) • كِتاب (آخر) • سَبَب (وسط)',
        exampleEn: 'بَطّة = duck • كِتاب = book • سَبَب = reason',
        promptAr: 'في أيِّ موضعٍ يقعُ حرف (ب) في كلمة "كِتاب"؟',
        promptEn: 'Where is the letter "ب" in the word "كِتاب" (book)?',
        type: 'position',
        optionsAr: ['في البداية', 'في الوسط', 'في النهاية'],
        optionsEn: ['Start', 'Middle', 'End'],
        correct: 2,
        noteAr: 'الكتابة من اليمين لليسار، فآخر الكلمة على يسارها.',
        noteEn: 'Arabic reads right-to-left, so the END is on the LEFT side.',
      },
      {
        teachAr: 'كلُّ حرفٍ له صوتٌ مميَّز. حرف (م) صوته «مـ» كأول كلمة "موزة".',
        teachEn: 'The letter "م" makes the /m/ sound, like in "moon" or "mama".',
        promptAr: 'أيُّ كلمةٍ تبدأ بحرف (م)؟',
        promptEn: 'Which word starts with the letter "م" (/m/)?',
        type: 'choice',
        optionsAr: ['تفاحة', 'موزة', 'سيارة'],
        optionsEn: ['Apple', 'Banana (موزة)', 'Car'],
        correct: 1,
        noteAr: 'لا تخلطي بين (م) و(ن): النون صوتها «نـ» من الأنف.',
        noteEn: 'Don\'t confuse /m/ (lips closed) with /n/ (through the nose).',
      },
      {
        teachAr: 'المطابقة تساعدنا على ربط الحرف بصوتٍ أو شيءٍ يبدأ به.',
        teachEn: 'Matching links a letter to something that begins with it.',
        promptAr: 'طابقي حرف (س) مع الصورة الصحيحة:',
        promptEn: 'Match the letter "س" (/s/) with the correct picture:',
        type: 'match',
        optionsAr: ['🐍 ثعبان (سـ)', '🐘 فيل (فـ)', '🦓 حمار وحشي (حـ)'],
        optionsEn: ['🐍 Snake (s)', '🐘 Elephant (e)', '🦓 Zebra (z)'],
        correct: 0,
        hintAr: 'فكّري في الصوت الأول لاسم كل حيوان.',
        hintEn: 'Think about the first sound of each animal\'s name.',
      },
      {
        audioWord: 'شمس',
        promptAr: '🔊 استمعي ثم اختاري الحرف الأول الذي تسمعينه:',
        promptEn: '🔊 Listen, then pick the FIRST letter you hear:',
        type: 'listening',
        optionsAr: ['ش', 'س', 'ص'],
        optionsEn: ['ش (sh)', 'س (s)', 'ص (heavy s)'],
        correct: 0,
        noteAr: 'الفرق: (س) صوت رفيع، (ش) فيه نفخ هواء، (ص) صوت مفخّم.',
        noteEn: '(س) thin /s/, (ش) airy /sh/, (ص) heavy emphatic /s/.',
      },
      {
        teachAr: 'الأبجدية العربية فيها 28 حرفًا أساسيًا.',
        teachEn: 'The Arabic alphabet has 28 basic letters.',
        promptAr: 'كم عدد حروف اللغة العربية؟',
        promptEn: 'How many letters are in the Arabic alphabet?',
        type: 'choice',
        optionsAr: ['26', '28', '30'],
        optionsEn: ['26', '28', '30'],
        correct: 1,
        noteAr: 'الهمزة (ء) ليست حرفًا مستقلًّا في العدّ الأساسي.',
        noteEn: 'The hamza (ء) is not counted as a separate basic letter.',
      },
    ],

    words: [
      // ╔═══════════════════════════════════════════╗
      // ║  🐾 الحيوانات  /  ANIMALS                 ║
      // ╚═══════════════════════════════════════════╝
      {
        teachAr: '🐾 قسمُ الحيوانات: قط 🐱، كلب 🐶، أسد 🦁، فيل 🐘، أرنب 🐰، طائر 🐦، سمكة 🐟.',
        teachEn: '🐾 Animals: cat, dog, lion, elephant, rabbit, bird, fish.',
        exampleAr: 'القطُّ يموءُ، والكلبُ ينبحُ، والأسدُ يزأرُ.',
        exampleEn: 'The cat meows, the dog barks, the lion roars.',
        promptAr: 'ما معنى كلمة "Lion" 🦁؟',
        promptEn: 'What does "أسد" 🦁 mean?',
        type: 'choice',
        optionsAr: ['نمر', 'أسد', 'فيل'],
        optionsEn: ['Tiger', 'Lion', 'Elephant'],
        correct: 1,
        noteAr: 'النمر (Tiger) له خطوط، أما الأسد فله لبدةٌ شعرية.',
        noteEn: 'A tiger has stripes; a lion has a mane.',
      },
      {
        promptAr: 'أيُّ الحيوانات يعيشُ في الماء؟ 🐟',
        promptEn: 'Which animal lives in water? 🐟',
        type: 'choice',
        optionsAr: ['أرنب', 'سمكة', 'جمل'],
        optionsEn: ['Rabbit', 'Fish', 'Camel'],
        correct: 1,
        noteAr: 'الجملُ يعيشُ في الصحراء، والأرنبُ في الحقول.',
        noteEn: 'Camels live in deserts, rabbits in fields.',
      },
      {
        audioWord: 'فيل',
        promptAr: '🔊 استمعي للحيوان ثم اكتبي اسمَه (يبدأ بـ "ف"):',
        promptEn: '🔊 Listen and type the animal name (in Arabic):',
        type: 'spell',
        correct: 'فيل',
        hintAr: 'أكبرُ حيوانٍ بريّ — له خرطومٌ طويل.',
        hintEn: 'Largest land animal — has a long trunk.',
      },
      {
        teachAr: 'الحيوانُ ___ صوتًا مميّزًا. كلُّ حيوانٍ له فعلُه الخاص.',
        teachEn: 'Each animal has its own action verb.',
        promptAr: 'الكلبُ ___ بصوتٍ عالٍ. 🐶',
        promptEn: 'The dog ___ loudly. 🐶',
        type: 'fill',
        optionsAr: ['ينبحُ', 'يطيرُ', 'يسبحُ'],
        optionsEn: ['barks', 'flies', 'swims'],
        correct: 0,
        noteAr: '«يطير» للطيور، و«يسبح» للأسماك — الكلبُ ينبح.',
        noteEn: '"Flies" is for birds, "swims" for fish — dogs bark.',
      },

      // ╔═══════════════════════════════════════════╗
      // ║  🎨 الألوان  /  COLORS                    ║
      // ╚═══════════════════════════════════════════╝
      {
        teachAr: '🎨 الألوان: أحمر 🔴، أزرق 🔵، أصفر 🟡، أخضر 🟢، أسود ⚫، أبيض ⚪، برتقالي 🟠.',
        teachEn: '🎨 Colors: red, blue, yellow, green, black, white, orange.',
        exampleAr: 'السماءُ زرقاء، والعشبُ أخضر، والشمسُ صفراء.',
        exampleEn: 'The sky is blue, the grass is green, the sun is yellow.',
        promptAr: 'ما لونُ الموزة 🍌؟',
        promptEn: 'What color is a banana 🍌?',
        type: 'choice',
        optionsAr: ['أزرق', 'أصفر', 'أسود'],
        optionsEn: ['Blue', 'Yellow', 'Black'],
        correct: 1,
        noteAr: 'الموزُ الناضجُ أصفرُ دائمًا.',
        noteEn: 'A ripe banana is always yellow.',
      },
      {
        promptAr: 'ما معنى كلمة "Red" 🔴؟',
        promptEn: 'What does "أحمر" 🔴 mean?',
        type: 'choice',
        optionsAr: ['أبيض', 'أحمر', 'أخضر'],
        optionsEn: ['White', 'Red', 'Green'],
        correct: 1,
        noteAr: 'الأحمرُ لونُ الفراولةِ والطماطم.',
        noteEn: 'Red is the color of strawberries and tomatoes.',
      },
      {
        promptAr: 'الثلجُ لونُه ___ . ❄️',
        promptEn: 'Snow is ___ in color. ❄️',
        type: 'fill',
        optionsAr: ['أسود', 'أبيض', 'أحمر'],
        optionsEn: ['black', 'white', 'red'],
        correct: 1,
        noteAr: 'الليلُ أسود، والثلجُ أبيض.',
        noteEn: 'Night is black, snow is white.',
      },

      // ╔═══════════════════════════════════════════╗
      // ║  🍎 الفاكهة  /  FRUITS                    ║
      // ╚═══════════════════════════════════════════╝
      {
        teachAr: '🍎 الفاكهة: تفاحة 🍎، موزة 🍌، برتقالة 🍊، عنب 🍇، فراولة 🍓، بطيخ 🍉، مانجو 🥭.',
        teachEn: '🍎 Fruits: apple, banana, orange, grapes, strawberry, watermelon, mango.',
        exampleAr: 'آكلُ تفاحةً في الصباح وأشربُ عصيرَ البرتقال.',
        exampleEn: 'I eat an apple in the morning and drink orange juice.',
        promptAr: 'ما معنى كلمة "Apple" 🍎؟',
        promptEn: 'What does "تفاحة" 🍎 mean?',
        type: 'choice',
        optionsAr: ['موزة', 'تفاحة', 'فراولة'],
        optionsEn: ['Banana', 'Apple', 'Strawberry'],
        correct: 1,
        noteAr: 'لا تخلطي بين «تفاحة» و«طماطم» رغم اللون الأحمر — الطماطمُ خضارٌ لا فاكهة.',
        noteEn: 'Don\'t confuse "apple" with "tomato" — both red, but tomato is a vegetable.',
      },
      {
        promptAr: 'أيُّ الفواكه صفراء وطويلة 🍌؟',
        promptEn: 'Which fruit is long and yellow 🍌?',
        type: 'choice',
        optionsAr: ['عنب', 'موزة', 'فراولة'],
        optionsEn: ['Grapes', 'Banana', 'Strawberry'],
        correct: 1,
        noteAr: 'العنبُ صغيرٌ ومستدير، والفراولةُ حمراءُ صغيرة.',
        noteEn: 'Grapes are small and round; strawberries are small and red.',
      },
      {
        audioWord: 'برتقال',
        promptAr: '🔊 استمعي ثم اكتبي اسمَ الفاكهة 🍊:',
        promptEn: '🔊 Listen and type the fruit name (in Arabic) 🍊:',
        type: 'spell',
        correct: 'برتقال',
        hintAr: 'لونُها ولونُ اسمها واحد!',
        hintEn: 'Its name and its color are the same word!',
      },

      // ╔═══════════════════════════════════════════╗
      // ║  🪑 الجماد  /  OBJECTS                    ║
      // ╚═══════════════════════════════════════════╝
      {
        teachAr: '🪑 الجمادُ أشياءُ بلا روح: كرسي 🪑، طاولة، باب 🚪، نافذة، كتاب 📖، قلم ✏️، سيارة 🚗.',
        teachEn: '🪑 Inanimate objects: chair, table, door, window, book, pen, car.',
        exampleAr: 'الكتابُ على الطاولة، والقلمُ في الحقيبة.',
        exampleEn: 'The book is on the table, the pen is in the bag.',
        promptAr: 'ما معنى كلمة "Book" 📖؟',
        promptEn: 'What does "كتاب" 📖 mean?',
        type: 'choice',
        optionsAr: ['قلم', 'كتاب', 'باب'],
        optionsEn: ['Pen', 'Book', 'Door'],
        correct: 1,
        noteAr: 'القلمُ نكتبُ به، والكتابُ نقرأ فيه.',
        noteEn: 'We write with a pen, we read a book.',
      },
      {
        promptAr: 'نجلسُ على الـ ___ . 🪑',
        promptEn: 'We sit on the ___ . 🪑',
        type: 'fill',
        optionsAr: ['كرسي', 'قلم', 'نافذة'],
        optionsEn: ['chair', 'pen', 'window'],
        correct: 0,
        noteAr: 'القلمُ للكتابة، والنافذةُ للنظر — نجلسُ على الكرسي فقط.',
        noteEn: 'Pens are for writing, windows for looking — we sit on chairs.',
      },
      {
        audioWord: 'سيارة',
        promptAr: '🔊 استمعي واكتبي اسمَ وسيلة المواصلات 🚗:',
        promptEn: '🔊 Listen and type the vehicle name (Arabic) 🚗:',
        type: 'spell',
        correct: 'سيارة',
        hintAr: 'تبدأ بـ (س) وتنتهي بـ (ة) — لها أربعُ عجلات.',
        hintEn: 'Starts with س, ends with ة. Has 4 wheels.',
      },

      // ╔═══════════════════════════════════════════╗
      // ║  👨‍👩‍👧 العائلة  /  FAMILY                   ║
      // ╚═══════════════════════════════════════════╝
      {
        teachAr: '👨‍👩‍👧 العائلة: أب 👨، أم 👩، أخ، أخت، جد 👴، جدة 👵، عمّ، خال.',
        teachEn: '👨‍👩‍👧 Family: father, mother, brother, sister, grandfather, grandmother, uncle.',
        exampleAr: 'أبي يعملُ، وأمي تطبخ، وأختي تدرس.',
        exampleEn: 'My father works, my mother cooks, my sister studies.',
        promptAr: 'ما معنى كلمة "Mother" 👩؟',
        promptEn: 'What does "أم" 👩 mean?',
        type: 'choice',
        optionsAr: ['أب', 'أم', 'أخت'],
        optionsEn: ['Father', 'Mother', 'Sister'],
        correct: 1,
        noteAr: '«Mother» للأم، و«Father» للأب — لا تخلطي.',
        noteEn: '"Mother" = mom, "Father" = dad.',
      },
      {
        promptAr: 'والدُ والدي هو ___ . 👴',
        promptEn: 'My father\'s father is my ___ . 👴',
        type: 'fill',
        optionsAr: ['عمّي', 'جدّي', 'أخي'],
        optionsEn: ['uncle', 'grandfather', 'brother'],
        correct: 1,
        noteAr: 'العمُّ أخو الأب، والخالُ أخو الأم.',
        noteEn: '"Uncle" (paternal) = father\'s brother; grandfather is one level up.',
      },

      // ╔═══════════════════════════════════════════╗
      // ║  🍞 الطعام والشراب  /  FOOD & DRINK       ║
      // ╚═══════════════════════════════════════════╝
      {
        teachAr: '🍞 الطعام: خبز 🍞، أرز 🍚، لحم 🍖، بيض 🥚، جبن 🧀، حليب 🥛، ماء 💧.',
        teachEn: '🍞 Food: bread, rice, meat, egg, cheese, milk, water.',
        exampleAr: 'أتناولُ خبزًا وجبنًا في الفطور، وأشربُ الحليب.',
        exampleEn: 'I have bread and cheese for breakfast, and drink milk.',
        promptAr: 'ما معنى كلمة "Milk" 🥛؟',
        promptEn: 'What does "حليب" 🥛 mean?',
        type: 'choice',
        optionsAr: ['ماء', 'حليب', 'عصير'],
        optionsEn: ['Water', 'Milk', 'Juice'],
        correct: 1,
        noteAr: 'الماءُ شفاف، والحليبُ أبيض، والعصيرُ ملوّن.',
        noteEn: 'Water is clear, milk is white, juice is colorful.',
      },
      {
        promptAr: 'عند العطشِ نشربُ ___ . 💧',
        promptEn: 'When thirsty, we drink ___ . 💧',
        type: 'fill',
        optionsAr: ['ماء', 'خبز', 'لحم'],
        optionsEn: ['water', 'bread', 'meat'],
        correct: 0,
        noteAr: 'الخبزُ واللحمُ طعامٌ يُؤكل، لا يُشرب.',
        noteEn: 'Bread and meat are eaten, not drunk.',
      },

      // ╔═══════════════════════════════════════════╗
      // ║  👁️ أعضاء الجسم  /  BODY PARTS            ║
      // ╚═══════════════════════════════════════════╝
      {
        teachAr: '👁️ الجسم: رأس، عين 👁️، أنف 👃، فم 👄، يد ✋، رِجل 🦵، أذن 👂.',
        teachEn: '👁️ Body: head, eye, nose, mouth, hand, leg, ear.',
        exampleAr: 'أرى بعينيّ، وأسمعُ بأذنيّ، وأمشي برجليّ.',
        exampleEn: 'I see with my eyes, hear with my ears, walk with my legs.',
        promptAr: 'ما معنى كلمة "Eye" 👁️؟',
        promptEn: 'What does "عين" 👁️ mean?',
        type: 'choice',
        optionsAr: ['أذن', 'عين', 'فم'],
        optionsEn: ['Ear', 'Eye', 'Mouth'],
        correct: 1,
        noteAr: 'الأذنُ للسمع، والعينُ للرؤية، والفمُ للكلام.',
        noteEn: 'Ear hears, eye sees, mouth speaks.',
      },
      {
        promptAr: 'نشمُّ الروائحَ بالـ ___ . 👃',
        promptEn: 'We smell with our ___ . 👃',
        type: 'fill',
        optionsAr: ['أنف', 'يد', 'رِجل'],
        optionsEn: ['nose', 'hand', 'leg'],
        correct: 0,
        noteAr: 'اليدُ للمسك، والرِّجلُ للمشي — الشمُّ بالأنف.',
        noteEn: 'Hand grabs, leg walks — only the nose smells.',
      },

      // ╔═══════════════════════════════════════════╗
      // ║  ⏱️ مراجعة عامة  /  GENERAL REVIEW        ║
      // ╚═══════════════════════════════════════════╝
      {
        teachAr: 'المرادفُ كلمةٌ بنفس المعنى. الضدُّ كلمةٌ بمعنىً معاكس.',
        teachEn: 'Synonyms = same meaning. Antonyms = opposite meaning.',
        exampleAr: 'كبير = ضخم • ساخن ≠ بارد',
        exampleEn: 'big = huge • hot ≠ cold',
        promptAr: 'مرادفُ كلمة "كبير":',
        promptEn: 'A synonym for "big":',
        type: 'choice',
        optionsAr: ['ضخم', 'قصير', 'سريع'],
        optionsEn: ['Huge', 'Short', 'Fast'],
        correct: 0,
        noteAr: '«قصير» ضدُّ «طويل»، و«سريع» ضدُّ «بطيء».',
        noteEn: '"Short" opposes "tall"; "fast" opposes "slow".',
      },
      {
        promptAr: 'عكسُ كلمة "ساخن":',
        promptEn: 'The opposite of "hot":',
        type: 'choice',
        optionsAr: ['دافئ', 'بارد', 'حار'],
        optionsEn: ['Warm', 'Cold', 'Boiling'],
        correct: 1,
        noteAr: '«دافئ» درجةٌ متوسطة، و«حار» مرادفٌ لساخن.',
        noteEn: '"Warm" is mild; "boiling" is hotter — only "cold" is opposite.',
      },
      {
        teachAr: 'الفعلُ يدلُّ على عملٍ يحدث: يأكلُ، يشربُ، يلعبُ.',
        teachEn: 'A verb describes an action: eat, drink, play.',
        promptAr: 'الولدُ ___ الكرةَ في الحديقة.',
        promptEn: 'The boy ___ the ball in the garden.',
        type: 'fill',
        optionsAr: ['يلعبُ', 'كرسي', 'أحمر'],
        optionsEn: ['plays', 'chair', 'red'],
        correct: 0,
        noteAr: '«كرسي» اسم، و«أحمر» صفة — لا تصلحُ مكان الفعل.',
        noteEn: '"Chair" is a noun, "red" an adjective — only a verb fits.',
      },
    ],

    grammar: [
      {
        teachAr: 'الضمائرُ تحلُّ محلَّ الأسماء: هو (مفرد مذكر) — هي (مفرد مؤنث) — هم (جمع).',
        teachEn: 'Pronouns replace nouns: he (one male), she (one female), they (group).',
        exampleAr: 'أحمدُ يلعبُ → هو يلعبُ.',
        exampleEn: 'Sara is reading → She is reading.',
        promptAr: 'الضميرُ المناسب لـ "بنت واحدة":',
        promptEn: 'The correct pronoun for "one girl":',
        type: 'choice',
        optionsAr: ['هو', 'هي', 'هم'],
        optionsEn: ['He', 'She', 'They'],
        correct: 1,
        noteAr: '«هم» للجمع المذكر، و«هنّ» للجمع المؤنث — ليست للمفرد.',
        noteEn: '"They" is plural — don\'t use it for one person in formal writing.',
      },
      {
        teachAr: 'الجمعُ في العربية: مؤنث سالم (ـات)، مذكر سالم (ون/ين)، أو تكسير (أقلام).',
        teachEn: 'Plurals can be regular (books) or irregular (children, mice).',
        exampleAr: 'قلم → أقلام • معلمة → معلمات',
        exampleEn: 'pen → pens • child → children',
        promptAr: 'جمعُ كلمة "قلم":',
        promptEn: 'The plural of "قلم" (pen):',
        type: 'choice',
        optionsAr: ['أقلام', 'قلمين', 'قلمات'],
        optionsEn: ['أقلام (pens)', 'قلمين (two pens — dual)', 'قلمات (wrong)'],
        correct: 0,
        noteAr: '«قلمين» مثنى (اثنان فقط)، وليس جمعًا (ثلاثة فأكثر).',
        noteEn: '«قلمين» means TWO pens (dual), not the plural for 3+.',
      },
      {
        teachAr: 'حروفُ الجرّ تحدّد المكان: في، على، تحت، فوق، بين.',
        teachEn: 'Prepositions show location: in, on, under, above, between.',
        exampleAr: 'القلمُ على الطاولة. الكتابُ في الحقيبة.',
        exampleEn: 'The pen is on the table. The book is in the bag.',
        promptAr: 'القطةُ ___ الكرسيّ. (اختاري حرف الجر)',
        promptEn: 'The cat is ___ the chair. (Pick the preposition)',
        type: 'fill',
        optionsAr: ['على', 'إلى', 'مع'],
        optionsEn: ['on', 'to', 'with'],
        correct: 0,
        noteAr: '«على» = فوق سطح. «في» = داخل. «إلى» = اتجاه. «مع» = مرافقة.',
        noteEn: '"On" = touching the top. "To" = direction. "With" = accompanying.',
      },
    ],

    listening: [
      {
        audioWord: 'مرحبًا',
        promptAr: '🔊 ما الكلمةُ التي سمعتِها؟',
        promptEn: '🔊 Which word did you hear?',
        type: 'listening',
        optionsAr: ['وداعًا', 'مرحبًا', 'شكرًا'],
        optionsEn: ['Goodbye', 'Hello', 'Thank you'],
        correct: 1,
        teachAr: '«مرحبًا» تحيّةٌ عامة تُقال في أي وقت.',
        teachEn: '"مرحبًا" (Marhaban) is a universal greeting — any time of day.',
        noteAr: '«وداعًا» تُقال عند الفراق فقط.',
        noteEn: '"Goodbye" is only for leaving — not greeting.',
      },
      {
        audioWord: 'كم الساعة الآن؟',
        promptAr: '🔊 ما معنى الجملة التي سمعتِها؟',
        promptEn: '🔊 What does the sentence mean?',
        type: 'listening',
        optionsAr: ['ما اسمك؟', 'كم الساعة الآن؟', 'كيف حالك؟'],
        optionsEn: ['What\'s your name?', 'What time is it now?', 'How are you?'],
        correct: 1,
        noteAr: 'كلمة «كم» تسأل عن العدد أو الوقت.',
        noteEn: 'The word «كم» (kam) asks about quantity or time.',
      },
      {
        audioWord: 'ثلاثة',
        promptAr: '🔊 أيُّ رقمٍ سمعتِ؟',
        promptEn: '🔊 Which number did you hear?',
        type: 'listening',
        optionsAr: ['اثنان', 'ثلاثة', 'أربعة'],
        optionsEn: ['Two (2)', 'Three (3)', 'Four (4)'],
        correct: 1,
        noteAr: 'احفظي الأرقام 1–10 شفهيًا قبل الكتابة.',
        noteEn: 'Master 1–10 by ear first, then move to spelling.',
      },
    ],

    texts: [
      {
        teachAr:
          'النص: «ذهبتْ سارةُ إلى الحديقةِ مع أمِّها صباحَ السبت. شاهدتْ عصفورًا صغيرًا يطيرُ بين الأشجار.»',
        teachEn:
          'Text: "Sara went to the park with her mom on Saturday morning. She saw a small bird flying among the trees."',
        promptAr: 'متى ذهبتْ سارةُ إلى الحديقة؟',
        promptEn: 'When did Sara go to the park?',
        type: 'choice',
        optionsAr: ['مساءَ الجمعة', 'صباحَ السبت', 'ظهرَ الأحد'],
        optionsEn: ['Friday evening', 'Saturday morning', 'Sunday noon'],
        correct: 1,
        noteAr: 'ابحثي عن دلائل الزمن: «صباح، مساء، ظهر».',
        noteEn: 'Scan for time markers: morning, evening, noon.',
      },
      {
        teachAr: 'نفس النص أعلاه — ركّزي على التفاصيل المرئية.',
        teachEn: 'Same passage — focus on visual details.',
        promptAr: 'ماذا شاهدتْ سارةُ في الحديقة؟',
        promptEn: 'What did Sara see at the park?',
        type: 'choice',
        optionsAr: ['قطةً', 'عصفورًا', 'كلبًا'],
        optionsEn: ['A cat', 'A bird', 'A dog'],
        correct: 1,
        noteAr: 'النص لم يذكر القطة ولا الكلب — لا تخمّني.',
        noteEn: 'The text never mentions a cat or dog — don\'t guess.',
      },
    ],

    phrases: [
      {
        teachAr: 'تحياتُ الصباح: «صباحُ الخير» — والردُّ المعتاد «صباحُ النور».',
        teachEn: '"صباح الخير" (Good morning) — reply with "صباح النور" (Morning of light).',
        exampleAr: '– صباحُ الخير يا أمي.\n– صباحُ النور يا حبيبتي.',
        exampleEn: '– Good morning, mom.\n– Morning of light, sweetheart.',
        promptAr: 'الردُّ المناسبُ على «صباحُ الخير»:',
        promptEn: 'The proper reply to "Good morning":',
        type: 'choice',
        optionsAr: ['تصبحُ على خير', 'صباحُ النور', 'مع السلامة'],
        optionsEn: ['Good night', 'Morning of light', 'Goodbye'],
        correct: 1,
        noteAr: '«تصبحُ على خير» تُقال قبل النوم فقط، لا في الصباح.',
        noteEn: '"Good night" is only said before sleeping — never as a morning reply.',
      },
      {
        teachAr: 'الشكرُ من أرقى العبارات — يفتحُ القلوب.',
        teachEn: 'Saying "thank you" is the simplest way to open hearts.',
        promptAr: 'العبارةُ المناسبةُ لشكر شخص:',
        promptEn: 'The right phrase to thank someone:',
        type: 'choice',
        optionsAr: ['من فضلك', 'شكرًا جزيلًا', 'عذرًا'],
        optionsEn: ['Please', 'Thank you very much', 'Excuse me'],
        correct: 1,
        noteAr: '«من فضلك» للطلب، و«عذرًا» للاعتذار — كلٌّ في موضعه.',
        noteEn: '"Please" = request, "Excuse me" = apology — each has its role.',
      },
    ],

    conversations: [
      {
        teachAr:
          'محادثة:\n– أحمد: مرحبًا! ما اسمُكِ؟\n– ليلى: اسمي ليلى، وأنت؟\n– أحمد: أنا أحمد، تشرّفتُ بكِ.',
        teachEn:
          'Dialogue:\n– Ahmed: Hi! What\'s your name?\n– Layla: My name is Layla. And you?\n– Ahmed: I\'m Ahmed, nice to meet you.',
        promptAr: 'بماذا عرّفتْ ليلى عن نفسها؟',
        promptEn: 'How did Layla introduce herself?',
        type: 'choice',
        optionsAr: ['اسمي ليلى', 'تشرّفتُ بكِ', 'مع السلامة'],
        optionsEn: ['"My name is Layla"', '"Nice to meet you"', '"Goodbye"'],
        correct: 0,
        noteAr: '«تشرّفتُ بك» تأتي بعد تبادل الأسماء، لا قبلها.',
        noteEn: '"Nice to meet you" comes AFTER names are exchanged.',
      },
      {
        teachAr: 'الأدبُ في الطلب يستخدم «من فضلك» و«أرجو».',
        teachEn: 'Polite requests use "please" and "may I".',
        promptAr: 'في المطعم، كيف تطلبين بأدب؟',
        promptEn: 'At a restaurant, how do you order politely?',
        type: 'choice',
        optionsAr: ['أعطني ماء!', 'من فضلك، أريدُ كوبَ ماء.', 'ماء الآن!'],
        optionsEn: ['Give me water!', 'May I have a glass of water, please?', 'Water now!'],
        correct: 1,
        noteAr: 'الأمرُ المباشر دون «من فضلك» قد يبدو وقحًا.',
        noteEn: 'Direct commands without "please" sound rude.',
      },
    ],
  },

  /* ============================= TEEN ============================= */
  teen: {
    letters: [
      {
        teachAr:
          'الحروف الشمسية تُدغم فيها لام التعريف فلا تُنطق: (ال + شمس) = «الشَّمس». الحروف القمرية تُنطق فيها اللام: (ال + قمر) = «الْقمر».',
        teachEn:
          'Arabic "sun letters" absorb the ل of ال so the لام is silent ("الشَّمس"). "Moon letters" keep ل clear ("الْقمر").',
        exampleAr: 'شمسية: الشَّمس، التَّاج، الرَّجل ✦ قمرية: الْقمر، الْكتاب، الْباب',
        exampleEn: 'Sun: الشَّمس, التَّاج ✦ Moon: الْقمر, الْكتاب',
        promptAr: 'أيُّ الحروف التالية شمسيٌّ؟',
        promptEn: 'Which letter is a "sun letter"?',
        type: 'choice',
        optionsAr: ['ق', 'ك', 'ت'],
        optionsEn: ['ق', 'ك', 'ت'],
        correct: 2,
        noteAr: 'الحروف الشمسية 14: ت ث د ذ ر ز س ش ص ض ط ظ ل ن.',
        noteEn: 'There are 14 sun letters: ت ث د ذ ر ز س ش ص ض ط ظ ل ن.',
      },
      {
        teachAr:
          'الهمزة المتوسطة تُكتب على حرفٍ يناسبُ أقوى الحركتين: الكسرة (نبرة) ثم الضمة (واو) ثم الفتحة (ألف) ثم السكون.',
        teachEn:
          'The medial hamza sits on the letter matching the strongest vowel: kasra > damma > fatha > sukun.',
        exampleAr: 'سُؤال (الضمة أقوى من الفتحة) • بِئر (الكسرة أقوى) • رَأس (فتحتان).',
        exampleEn: 'سُؤال → on و (damma wins) • بِئر → on ـئـ (kasra wins).',
        promptAr: 'الهمزةُ في «سُؤال» كُتبتْ على الواو لأنّ:',
        promptEn: 'In «سُؤال», the hamza sits on و because:',
        type: 'choice',
        optionsAr: [
          'ما قبلها مضمومٌ والضمة أقوى من الفتحة',
          'ما قبلها مفتوحٌ',
          'ما قبلها مكسورٌ',
        ],
        optionsEn: [
          'The previous letter is damma (stronger than fatha)',
          'The previous letter is fatha',
          'The previous letter is kasra',
        ],
        correct: 0,
        noteAr: 'لو كان قبلها كسرةٌ لكتبناها على نبرة: «سُئِل».',
        noteEn: 'If a kasra preceded it, we\'d write it on a ـئـ (e.g. «سُئِل»).',
      },
    ],

    words: [
      {
        teachAr: 'المرادفاتُ تُثري الأسلوبَ وتمنع التكرار في الكتابة.',
        teachEn: 'Synonyms enrich style and prevent repetition.',
        exampleAr: 'ذكي = فطن = نبيه. سعيد = مسرور = فرحان.',
        exampleEn: 'smart = intelligent = sharp. happy = joyful = pleased.',
        promptAr: 'مرادفُ كلمة "ذكي":',
        promptEn: 'A synonym for "ذكي" (smart):',
        type: 'choice',
        optionsAr: ['فطن', 'كسول', 'هادئ'],
        optionsEn: ['Sharp/Intelligent', 'Lazy', 'Quiet'],
        correct: 0,
        noteAr: '«هادئ» صفةٌ سلوكية لا علاقة لها بالذكاء.',
        noteEn: '"Quiet" describes behavior, not intelligence.',
      },
      {
        audioWord: 'بيئة',
        promptAr: '🔊 اكتبي الكلمة التي سمعتِها (تعني environment):',
        promptEn: '🔊 Type the Arabic word you heard (= environment):',
        type: 'spell',
        correct: 'بيئة',
        noteAr: 'انتبهي للهمزة على نبرة: «بيئة» وليست «بيأة».',
        noteEn: 'Watch the hamza on ـئـ: it\'s «بيئة», not «بيأة».',
      },
      {
        teachAr: 'كلمةُ «نهضة» تعني انطلاقةً وتطورًا كبيرًا بعد ركود.',
        teachEn: '"نهضة" (Nahda) means a revival or rebirth after stagnation.',
        exampleAr: 'تشهدُ البلادُ نهضةً علميةً كبيرة.',
        exampleEn: 'The country is witnessing a major scientific renaissance.',
        promptAr: 'ضدُّ كلمة "نهضة":',
        promptEn: 'The opposite of "Renaissance / Revival":',
        type: 'choice',
        optionsAr: ['تطوّر', 'انهيار', 'استقرار'],
        optionsEn: ['Growth', 'Collapse', 'Stability'],
        correct: 1,
        noteAr: '«استقرار» ليس ضدًّا، بل حالةٌ محايدة.',
        noteEn: '"Stability" isn\'t the opposite — it\'s a neutral state.',
      },
      {
        teachAr: 'الجملةُ الفعلية تبدأ بفعل: «قرأَ الطالبُ الكتاب».',
        teachEn: 'A verbal sentence starts with a verb in Arabic.',
        promptAr: 'كتبتْ سارةُ ___ بخطٍّ جميل. (املئي الفراغ بمفعول مناسب)',
        promptEn: 'Sara wrote ___ in beautiful handwriting. (Pick a suitable object)',
        type: 'fill',
        optionsAr: ['الرسالةَ', 'سريعًا', 'جميلٌ'],
        optionsEn: ['the letter', 'quickly', 'beautiful'],
        correct: 0,
        noteAr: '«سريعًا» حال، و«جميلٌ» صفة مرفوعة — لا تصلحان مفعولًا.',
        noteEn: '"Quickly" is an adverb, "beautiful" an adjective — neither is an object.',
      },
    ],

    grammar: [
      {
        teachAr:
          'المبني للمجهول: نحذف الفاعل ونرفع المفعولَ نائبًا له، ونغيّر شكل الفعل: «كتبَ → كُتِبَ».',
        teachEn:
          'Passive voice: drop the doer, raise the object as subject, change verb: "wrote → was written".',
        exampleAr: 'كتبَ الطالبُ الدرسَ → كُتِبَ الدرسُ.',
        exampleEn: 'The student wrote the lesson → The lesson was written.',
        promptAr: 'الصيغةُ المبنيةُ للمجهول من «أكلَ الولدُ التفاحةَ»:',
        promptEn: 'The passive form of "The boy ate the apple":',
        type: 'choice',
        optionsAr: ['أُكِلَتِ التفاحةُ', 'الولدُ أُكِلَ', 'أكلَ التفاحةُ'],
        optionsEn: ['The apple was eaten', 'The boy was eaten', 'The apple ate'],
        correct: 0,
        noteAr: 'خطأ شائع: ترك الفاعل مذكورًا — في المجهول يُحذف.',
        noteEn: 'Common mistake: forgetting "was/were" — verb alone isn\'t passive.',
      },
      {
        teachAr: 'في الشرط بـ«إذا»: فعلُ الشرط يأتي ماضيًا حتى لو كان المعنى مستقبلًا.',
        teachEn: 'After "إذا" the verb is past in form but future in meaning.',
        exampleAr: 'إذا اجتهدتَ، نجحتَ.',
        exampleEn: 'إذا اجتهدتَ، نجحتَ. (If you work hard, you will succeed.)',
        promptAr: 'إذا ___ المطرُ، بقينا في البيت. (الفعل المناسب)',
        promptEn: 'إذا ___ المطرُ، بقينا في البيت. (Pick the verb)',
        type: 'fill',
        optionsAr: ['نزلَ', 'سينزلُ', 'ينزلْ'],
        optionsEn: ['نزلَ (past)', 'سينزلُ (future)', 'ينزلْ (jussive)'],
        correct: 0,
        noteAr: 'لا نقول «إذا سينزلُ» — حرف «إذا» يقتضي الماضي.',
        noteEn: 'Never «إذا + future» — «إذا» grammatically requires the past form.',
      },
      {
        teachAr: '«إنّ» وأخواتها تنصبُ المبتدأ (اسمها) وترفعُ الخبر.',
        teachEn: '«إنّ» and its sisters put the subject in the accusative.',
        exampleAr: 'الجوُّ جميلٌ → إنّ الجوَّ جميلٌ.',
        exampleEn: '"الجوُّ" (nom.) → after إنّ: "الجوَّ" (acc.).',
        promptAr: 'أيُّ الجمل صحيحة؟',
        promptEn: 'Which sentence is grammatically correct?',
        type: 'choice',
        optionsAr: ['إنّ الطالبُ مجتهدٌ', 'إنّ الطالبَ مجتهدٌ', 'إنّ الطالبَ مجتهدًا'],
        optionsEn: ['إنّ الطالبُ مجتهدٌ (wrong)', 'إنّ الطالبَ مجتهدٌ ✓', 'إنّ الطالبَ مجتهدًا (wrong)'],
        correct: 1,
        noteAr: 'الخبر يبقى مرفوعًا — لا ينصبه إنّ.',
        noteEn: 'The خبر stays nominative; only the اسم is accusative.',
      },
    ],

    listening: [
      {
        audioWord: 'I would like to book a table for two, please.',
        promptAr: '🔊 في أيِّ موقفٍ تُقال هذه الجملة؟',
        promptEn: '🔊 In what situation is this sentence said?',
        type: 'listening',
        optionsAr: ['في المكتبة', 'في المطعم', 'في المحطّة'],
        optionsEn: ['At a library', 'At a restaurant', 'At a station'],
        correct: 1,
        noteAr: '«book a table» اصطلاحٌ يعني «حجز طاولة».',
        noteEn: '"Book a table" = reserve a table (collocation).',
      },
      {
        audioWord: 'The train leaves at quarter past seven.',
        promptAr: '🔊 متى يغادرُ القطار؟',
        promptEn: '🔊 When does the train leave?',
        type: 'listening',
        optionsAr: ['7:00', '7:15', '7:45'],
        optionsEn: ['7:00', '7:15', '7:45'],
        correct: 1,
        noteAr: '«quarter past» = الربع بعد. «quarter to» = إلا ربعًا.',
        noteEn: '"quarter past 7" = 7:15. "quarter to 8" = 7:45.',
      },
    ],

    texts: [
      {
        teachAr:
          'النص: «التكنولوجيا أداةٌ ذاتُ حدّين؛ تُسهّل التعلّمَ والتواصلَ، لكنها قد تُسبّب الإدمانَ والعزلةَ إن لم تُستخدم بحكمة.»',
        teachEn:
          'Text: "Technology is a double-edged tool. It eases learning and communication, but may cause addiction and isolation if not used wisely."',
        promptAr: 'الفكرةُ الرئيسةُ للنص:',
        promptEn: 'The main idea of the text:',
        type: 'choice',
        optionsAr: [
          'التكنولوجيا شرٌّ مطلق',
          'التكنولوجيا مفيدةٌ وضارّةٌ حسب الاستخدام',
          'التكنولوجيا للتواصل فقط',
        ],
        optionsEn: [
          'Technology is purely harmful',
          'Technology is both useful and harmful — depends on use',
          'Technology is only for communication',
        ],
        correct: 1,
        noteAr: 'عبارة «ذات حدّين» مفتاحٌ يدل على الموقف المتوازن.',
        noteEn: 'The phrase "double-edged" signals a balanced argument.',
      },
      {
        teachAr: 'استخراج المرادفات من السياق مهارةٌ أساسية في القراءة.',
        teachEn: 'Inferring synonyms from context is a key reading skill.',
        promptAr: 'المرادفُ لـ «بحكمة» في النص:',
        promptEn: 'A synonym for "wisely" in the text:',
        type: 'choice',
        optionsAr: ['بتعقّل', 'بسرعة', 'بإهمال'],
        optionsEn: ['Sensibly', 'Quickly', 'Carelessly'],
        correct: 0,
        noteAr: '«بإهمال» ضدّ المعنى، و«بسرعة» لا علاقة بالحكمة.',
        noteEn: '"Carelessly" is the opposite; "quickly" is unrelated to wisdom.',
      },
    ],

    phrases: [
      {
        teachAr: 'التعابيرُ الاصطلاحية لها معنى مجازي لا يُترجم حرفيًا.',
        teachEn: 'Idioms have figurative meanings — never translate them literally.',
        exampleAr: '«يدٌ واحدةٌ لا تصفّق» = نحتاج التعاون.',
        exampleEn: '"Break the ice" = start a friendly chat.',
        promptAr: 'ماذا يعني «ضربَ عصفورين بحجرٍ واحد»؟',
        promptEn: 'What does "kill two birds with one stone" mean?',
        type: 'choice',
        optionsAr: ['أنجزَ شيئين بعملٍ واحد', 'أذى الطيور', 'فشلَ في مهمتين'],
        optionsEn: ['Achieve two things in one action', 'Harm two birds', 'Fail at two tasks'],
        correct: 0,
        noteAr: 'ترجمةُ الاصطلاح حرفيًا تفقدُ المعنى تمامًا.',
        noteEn: 'Literal translation of idioms loses the meaning entirely.',
      },
    ],

    conversations: [
      {
        teachAr:
          'محادثةٌ في عيادة الطبيب:\n– الطبيب: ما الذي يؤلمكِ؟\n– المريضة: أعاني من صداعٍ شديدٍ منذ ثلاثةِ أيام.\n– الطبيب: هل تتناولين أيَّ دواء؟',
        teachEn:
          'Doctor visit:\n– Doctor: What\'s troubling you?\n– Patient: I\'ve had a severe headache for three days.\n– Doctor: Are you taking any medication?',
        promptAr: 'منذ متى تعاني المريضةُ من الصداع؟',
        promptEn: 'How long has the patient had the headache?',
        type: 'choice',
        optionsAr: ['يومٌ واحد', 'ثلاثةُ أيام', 'أسبوع'],
        optionsEn: ['One day', 'Three days', 'A week'],
        correct: 1,
        noteAr: '«منذ + المدة» تدلّ على استمرار الحالة حتى الآن.',
        noteEn: 'Use Present Perfect + "for + duration" for ongoing states.',
      },
      {
        teachAr: 'الردُّ المهذّب في المتاجر يحفظ راحة الجميع.',
        teachEn: 'A polite reply in stores keeps everyone comfortable.',
        promptAr: 'الردُّ المناسبُ على «هل أستطيعُ مساعدتكِ؟»:',
        promptEn: 'Best reply to "Can I help you?" in a shop:',
        type: 'choice',
        optionsAr: ['لا، أنا غاضبة!', 'فقط أتفرّج، شكرًا.', 'اذهب بعيدًا.'],
        optionsEn: ['No, I\'m angry!', 'Just browsing, thanks.', 'Go away.'],
        correct: 1,
        noteAr: '«فقط أتفرّج» يرفض المساعدة بأدبٍ دون جرح.',
        noteEn: '"Just browsing" politely declines without rudeness.',
      },
    ],
  },

  /* ============================= ADULT ============================ */
  adult: {
    letters: [
      {
        teachAr:
          'الإعجامُ (التنقيط) يميّز بين حروفٍ متشابهةِ الرسم: ب/ت/ث، ج/ح/خ، د/ذ، ر/ز، س/ش، ص/ض، ط/ظ، ع/غ، ف/ق.',
        teachEn:
          'Dots (i‘jām) distinguish letters with identical skeletons: ب/ت/ث, ج/ح/خ, etc.',
        exampleAr: 'بَيت • تَيه • ثَوب — نفس الرسم، اختلاف النقاط.',
        exampleEn: 'Same shape, different dots → entirely different words.',
        promptAr: 'الفرقُ الرئيسُ بين (ض) و(ظ) في:',
        promptEn: 'The main difference between (ض) and (ظ) is:',
        type: 'choice',
        optionsAr: [
          'مخرج الصوت (الضاد من حافة اللسان، الظاء من طرفه مع الأسنان)',
          'الشكل المكتوب فقط',
          'لا يوجد فرق نطقي',
        ],
        optionsEn: [
          'Articulation point (ض from tongue\'s side, ظ from tip + teeth)',
          'Only written shape',
          'No phonetic difference',
        ],
        correct: 0,
        noteAr: 'العربُ يُعرفون بـ«أهل الضاد» لصعوبة هذا الحرف على غيرهم.',
        noteEn: 'Arabs are called "people of the Ḍād" — this sound is unique.',
      },
    ],

    words: [
      {
        teachAr: 'المعجمُ الأكاديمي يستخدمُ مصطلحاتٍ دقيقةً تختلفُ عن اللغة اليومية.',
        teachEn: 'Academic vocabulary uses precise terms unlike everyday speech.',
        exampleAr: '«استراتيجية» (طويلة الأمد) ≠ «تكتيك» (مرحلي عملي).',
        exampleEn: '"Strategy" (long-term) ≠ "Tactic" (short-term action).',
        promptAr: 'المرادفُ الأدقُّ لكلمة «إيديولوجيا»:',
        promptEn: 'The most precise synonym for "ideology":',
        type: 'choice',
        optionsAr: ['منظومةٌ فكريةٌ متكاملة', 'رأيٌ شخصي', 'شعورٌ عابر'],
        optionsEn: ['A coherent belief system', 'Personal opinion', 'Fleeting feeling'],
        correct: 0,
        noteAr: 'الإيديولوجيا بنيةٌ متكاملة، أكبر من «الرأي» وأعمق من «الشعور».',
        noteEn: 'Ideology is a structured framework — broader than opinion.',
      },
      {
        audioWord: 'entrepreneurship',
        promptAr: '🔊 اكتبي المصطلح الذي سمعتِ:',
        promptEn: '🔊 Spell the term you heard:',
        type: 'spell',
        correct: 'entrepreneurship',
        noteAr: 'من أصلٍ فرنسي — لاحظي تتابع «eu» مرتين.',
        noteEn: 'French origin — note the "eu" appearing twice.',
      },
      {
        teachAr: 'الفرقُ بين «شفافية» و«وضوح» دقيق: الأولى نزاهةٌ مؤسسية، الثاني سهولةُ فهم.',
        teachEn: '"Transparency" implies institutional honesty; "clarity" is ease of understanding.',
        promptAr: 'أعلنتْ الحكومةُ ميزانيتَها بكاملِ ___ . (املئي بالأنسب)',
        promptEn: 'The government released its budget with full ___ . (Best word)',
        type: 'fill',
        optionsAr: ['شفافية', 'سرعة', 'صعوبة'],
        optionsEn: ['transparency', 'speed', 'difficulty'],
        correct: 0,
        noteAr: '«وضوح» ممكنة، لكن «شفافية» أدقّ في السياق المؤسسي.',
        noteEn: '"Clarity" works but "transparency" is more precise institutionally.',
      },
    ],

    grammar: [
      {
        teachAr:
          'الشرطُ الامتناعي بـ«لو»: يدلُّ على امتناع شيءٍ لامتناع غيره، وجوابه يقترن بـ«اللام»: «لو فعلَ، لكان».',
        teachEn:
          '3rd Conditional (unreal past): "If + past perfect, would have + V3".',
        exampleAr: 'لو ذاكرتَ، لنجحتَ. (= لم يذاكر فلم ينجح)',
        exampleEn: 'If I had studied, I would have passed. (But I didn\'t.)',
        promptAr: 'أيُّ الجمل صحيحةٌ في الشرط الامتناعي؟',
        promptEn: 'Which 3rd-conditional sentence is correct?',
        type: 'choice',
        optionsAr: [
          'لو كنتُ أعلمُ، لساعدتُكَ',
          'لو كنتُ أعلمُ، أساعدكَ',
          'إذا كنتُ أعلمُ، لساعدتُكَ',
        ],
        optionsEn: [
          'If I had known, I would have helped you ✓',
          'If I knew, I help you',
          'If I have known, I will help you',
        ],
        correct: 0,
        noteAr: 'خطأ شائع: حذفُ «اللام» من جواب الشرط، أو استخدام «إذا» مكان «لو».',
        noteEn: 'Common error: mixing "would" + "had" wrongly; order matters.',
      },
      {
        teachAr:
          'الاستثناءُ بـ«إلا»: إذا كان الكلامُ تامًّا موجبًا، فالمستثنى منصوبٌ وجوبًا.',
        teachEn:
          'Subjunctive mood after "suggest/recommend/insist that" uses the base verb (no -s).',
        exampleAr: 'حضرَ الطلابُ إلا طالبًا.',
        exampleEn: 'I suggest that he be on time. (not "is")',
        promptAr: 'الإعرابُ الصحيحُ لـ«طالبًا» في الجملة:',
        promptEn: 'Pick the correct subjunctive form:',
        type: 'choice',
        optionsAr: [
          'مستثنى منصوبٌ بالفتحة',
          'فاعلٌ مرفوع',
          'مفعولٌ به',
        ],
        optionsEn: [
          'I suggest that he goes',
          'I suggest that he go ✓',
          'I suggest that he going',
        ],
        correct: 1,
        noteAr: 'إذا كان الكلام منفيًّا أو ناقصًا جاز فيه البدل.',
        noteEn: 'Subjunctive drops the "-s" — even with he / she / it.',
      },
      {
        teachAr: 'الكلامُ المنقول: نُحوّل الزمن خطوةً للوراء، ودلائلَ الزمن (غدًا → اليوم التالي).',
        teachEn: 'Reported speech: shift tense back one step (will → would, am → was).',
        exampleAr: 'قال: «أنا ذاهبٌ» → قال إنه ذاهبٌ / كان ذاهبًا.',
        exampleEn: 'He said, "I am going" → He said he was going.',
        promptAr: 'الصيغةُ المنقولة لـ: قالت: «سأسافرُ غدًا».',
        promptEn: 'Reported form of: She said, "I will travel tomorrow".',
        type: 'choice',
        optionsAr: [
          'قالت إنها ستسافرُ غدًا',
          'قالت إنها ستسافرُ في اليوم التالي',
          'قالت إنها تسافرُ غدًا',
        ],
        optionsEn: [
          'She said she will travel tomorrow',
          'She said she would travel the next day ✓',
          'She said she travels tomorrow',
        ],
        correct: 1,
        noteAr: 'تذكّري تحويل «غدًا» إلى «اليوم التالي» مع تغيُّر الزمن.',
        noteEn: 'Also shift time markers: "tomorrow" → "the next day".',
      },
    ],

    listening: [
      {
        audioWord:
          'Despite the economic downturn, the company managed to increase its quarterly revenue by twelve percent.',
        promptAr: '🔊 بكم زادت إيراداتُ الشركة؟',
        promptEn: '🔊 By how much did the company\'s revenue increase?',
        type: 'listening',
        optionsAr: ['2%', '12%', '20%'],
        optionsEn: ['2%', '12%', '20%'],
        correct: 1,
        noteAr: 'انتبهي للفرق بين «twelve» و«twenty» — الضغطُ على المقطع يختلف.',
        noteEn: '"Twelve" stresses syllable 1; "twenty" has a clear /n/ sound.',
      },
    ],

    texts: [
      {
        teachAr:
          'نصٌّ تحليلي: «العولمةُ ظاهرةٌ متعددةُ الأبعاد، تُذيبُ الحدودَ الاقتصاديةَ والثقافية، غيرَ أنها تُنتجُ في الوقتِ ذاته صراعًا بين الهويةِ المحلية والمدِّ الكوني.»',
        teachEn:
          'Text: "Globalization is multi-dimensional; it dissolves economic and cultural borders, yet simultaneously breeds tension between local identity and global influence."',
        promptAr: 'الموقفُ الذي يعكسُهُ الكاتب:',
        promptEn: 'The author\'s stance is:',
        type: 'choice',
        optionsAr: ['متحمّسٌ بشكلٍ مطلق', 'رافضٌ كليًّا', 'متوازنٌ ينتقدُ ويُقرّ'],
        optionsEn: ['Wholly enthusiastic', 'Wholly rejecting', 'Balanced — critical & acknowledging'],
        correct: 2,
        noteAr: 'كلمة «غيرَ أنها» أداةُ استدراك تكشفُ الموقف المتوازن.',
        noteEn: '"Yet" signals contrast — a marker of balanced argument.',
      },
      {
        teachAr: 'استخراجُ المرادف الأكاديمي يتطلّب فهمَ سياق الجملة بأكملها.',
        teachEn: 'Finding academic synonyms requires reading the full context.',
        promptAr: 'المرادفُ الأكاديمي لـ«تُذيبُ الحدود»:',
        promptEn: 'Academic synonym for "dissolves borders":',
        type: 'choice',
        optionsAr: ['تُلغي الفواصل', 'تُقوّي الحواجز', 'تُهمل القوانين'],
        optionsEn: ['Erases boundaries', 'Strengthens barriers', 'Ignores laws'],
        correct: 0,
        noteAr: '«تُقوّي» ضدّ المعنى، و«تُهمل» خارج السياق.',
        noteEn: '"Strengthens" is the opposite; "ignores laws" is off-topic.',
      },
    ],

    phrases: [
      {
        teachAr: 'العباراتُ الرسمية في المراسلات تختلفُ تمامًا عن اليومية.',
        teachEn: 'Formal register is mandatory in business and academic writing.',
        exampleAr: '«تفضّلوا بقبول فائق الاحترام» — ختامٌ رسمي.',
        exampleEn: '"Yours sincerely / Yours faithfully" — formal closings.',
        promptAr: 'الأنسبُ لختام رسالةٍ رسمية:',
        promptEn: 'The most appropriate formal email closing:',
        type: 'choice',
        optionsAr: [
          'مع تحياتي الحارة 😊',
          'وتفضّلوا بقبول فائق الاحترام والتقدير',
          'باي باي',
        ],
        optionsEn: [
          'Cheers mate 😊',
          'Yours sincerely,',
          'Bye bye',
        ],
        correct: 1,
        noteAr: 'تجنّبي الإيموجي والعامية في السياق الرسمي.',
        noteEn: 'Avoid emojis and slang in formal correspondence.',
      },
    ],

    conversations: [
      {
        teachAr:
          'مقابلةُ عمل:\n– المسؤول: لماذا تعتقدين أنكِ الأنسبُ لهذا المنصب؟\n– المرشّحة: أملكُ خمسَ سنواتٍ من الخبرةِ في إدارة المشاريع، وشهادةَ PMP، وقدتُ فريقًا من 12 شخصًا نجح في تسليم ثلاثةِ مشاريعَ قبل موعدها.',
        teachEn:
          'Job interview:\n– Manager: Why do you think you\'re the best fit?\n– Candidate: I have 5 years of PM experience, a PMP cert, and led a 12-person team that delivered 3 projects ahead of schedule.',
        promptAr: 'ما أقوى نقطةٍ ذكرتها المرشّحة؟',
        promptEn: 'What is the candidate\'s STRONGEST point?',
        type: 'choice',
        optionsAr: [
          'وجودُ شهادةٍ فقط',
          'نتائجُ قابلةٌ للقياس (تسليم 3 مشاريع قبل موعدها)',
          'سنواتُ خبرةٍ بدون سياق',
        ],
        optionsEn: [
          'Only having a certificate',
          'Measurable results (3 projects ahead of schedule)',
          'Years of experience without context',
        ],
        correct: 1,
        noteAr: 'القاعدةُ الذهبية: الأرقامُ والنتائج أقوى من الأوصاف العامة.',
        noteEn: 'Golden rule: quantified achievements beat vague claims.',
      },
      {
        teachAr: 'الردُّ الدبلوماسي يمزجُ التقديرَ بالدعوةِ للحوار.',
        teachEn: 'Diplomatic replies blend acknowledgment with collaboration.',
        promptAr: 'الردُّ الدبلوماسي على انتقادٍ حادٍّ في اجتماع:',
        promptEn: 'Diplomatic reply to harsh criticism in a meeting:',
        type: 'choice',
        optionsAr: [
          'أنتَ مخطئٌ تمامًا!',
          'أقدّرُ ملاحظتكَ، دعنا نُراجع البيانات معًا.',
          'لا أريدُ سماعَ ذلك.',
        ],
        optionsEn: [
          'You\'re completely wrong!',
          'I appreciate your point — let\'s review the data together.',
          'I don\'t want to hear it.',
        ],
        correct: 1,
        noteAr: 'تأكيدُ التقدير + دعوةٌ للحوار = نزعُ فتيلِ الصراع.',
        noteEn: 'Acknowledge + invite collaboration = de-escalation formula.',
      },
    ],
  },
};

/* ================================================================== */
/*  MODULE META                                                        */
/* ================================================================== */

const moduleMeta: { key: ModuleKey; ar: string; en: string; emoji: string; icon: any }[] = [
  { key: 'letters',       ar: 'الحروف',     en: 'Letters',       emoji: '🔤', icon: Type },
  { key: 'words',         ar: 'الكلمات',    en: 'Words',         emoji: '📖', icon: BookOpen },
  { key: 'grammar',       ar: 'القواعد',    en: 'Grammar',       emoji: '📐', icon: Languages },
  { key: 'listening',     ar: 'الاستماع',   en: 'Listening',     emoji: '🎧', icon: Headphones },
  { key: 'texts',         ar: 'النصوص',     en: 'Texts',         emoji: '📄', icon: FileText },
  { key: 'phrases',       ar: 'العبارات',   en: 'Phrases',       emoji: '💬', icon: Quote },
  { key: 'conversations', ar: 'المحادثات',  en: 'Conversations', emoji: '🗣️', icon: MessageSquare },
];

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

const EducationHub = ({ addPoints }: EducationHubProps) => {
  const { lang, toggleLang } = useLang();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(null);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [completedAll, setCompletedAll] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('userPoints');
    if (saved) setPoints(parseInt(saved, 10));
  }, []);

  const EduLangToggle = () => (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-primary/10 transition-all text-xs font-semibold"
    >
      <Globe className="w-3.5 h-3.5" />
      {lang === 'ar' ? 'English' : 'العربية'}
    </button>
  );

  const exercises = useMemo(
    () => (level && activeModule ? content[level][activeModule] : []),
    [level, activeModule]
  );
  const ex = exercises[step];

  const reset = () => {
    setStep(0);
    setAnswer('');
    setFeedback(null);
    setCompletedAll(false);
  };

  const listenToCurrent = async () => {
    if (!ex) return;
    const { speak, stopSpeaking } = await import('@/lib/tts');
    stopSpeaking();
    const fallbackAr = ex.promptAr.split(':').pop()?.replace(/["🔊]/g, '').trim() || String(ex.correct);
    const fallbackEn = ex.promptEn.split(':').pop()?.replace(/["🔊]/g, '').trim() || String(ex.correct);
    const text = ex.audioWord || (lang === 'ar' ? fallbackAr : fallbackEn);
    const isArText = /[\u0600-\u06FF]/.test(text);
    speak(text, { lang: isArText ? 'ar' : 'en' });
  };

  const submit = (val: string | number) => {
    if (!ex) return;
    const isChoiceType =
      ex.type === 'choice' ||
      ex.type === 'fill' ||
      ex.type === 'match' ||
      ex.type === 'position' ||
      ex.type === 'listening';
    const correct = isChoiceType
      ? val === ex.correct
      : String(val).trim().toLowerCase() === String(ex.correct).toLowerCase();

    setFeedback(correct ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      setAnswer('');
      if (step + 1 >= exercises.length) {
        setCompletedAll(true);
        addPoints(MODULE_REWARD);
        setPoints(prev => prev + MODULE_REWARD);
        markEducationDailyChallenge();
        toast({ title: t(`+${MODULE_REWARD} نقطة! 🎓`, `+${MODULE_REWARD} points! 🎓`) });
      } else {
        setStep(step + 1);
      }
    }, 900);
  };

  /* ---------- Level select ---------- */
  if (!level) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold">{t('مركز التعلم الاحترافي', 'Education Hub')}</h2>
          </div>
          <EduLangToggle />
        </div>
        <p className="text-xs text-muted-foreground">
          {t('اختاري مستواكِ ليُصمَّم المحتوى لكِ', 'Pick your level to tailor the content')}
        </p>

        <div className="space-y-3">
          {(['kids', 'teen', 'adult'] as Level[]).map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
              <span className="text-3xl">{l === 'kids' ? '🧒' : l === 'teen' ? '👦' : '👩'}</span>
              <div className="flex-1 text-start">
                <div className="text-sm font-bold">
                  {l === 'kids'
                    ? t('أطفال (6-12)', 'Kids (6-12)')
                    : l === 'teen'
                    ? t('مراهقون (13-17)', 'Teens (13-17)')
                    : t('بالغون (+18)', 'Adults (18+)')}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {t('محتوى مخصص حسب العمر', 'Age-appropriate content')}
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Module select ---------- */
  if (!activeModule) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLevel(null)}
            className="text-primary text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t('تغيير المستوى', 'Change level')}
          </button>
          <EduLangToggle />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {moduleMeta.map(m => (
            <button
              key={m.key}
              onClick={() => { setActiveModule(m.key); reset(); }}
              className="glass-card rounded-2xl p-4 hover:bg-primary/5 transition-all active:scale-[0.98] text-start"
            >
              <div className="text-2xl mb-1">{m.emoji}</div>
              <div className="text-sm font-bold">{lang === 'ar' ? m.ar : m.en}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                +{MODULE_REWARD} {t('نقطة', 'pts')}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Completed ---------- */
  if (completedAll) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-6xl">🎓</div>
        <h3 className="text-lg font-bold">{t('ممتاز! أنهيتِ الوحدة', 'Excellent! Module complete')}</h3>
        <div className="text-sm text-primary font-semibold">+{MODULE_REWARD} ⭐</div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => { setActiveModule(null); reset(); }}
            className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold"
          >
            {t('وحدة أخرى', 'Another module')}
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold"
          >
            {t('أعيدي', 'Restart')}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Exercise ---------- */
  const meta = moduleMeta.find(m => m.key === activeModule)!;
  if (!ex) return null;

  const isChoiceLike =
    ex.type === 'choice' ||
    ex.type === 'fill' ||
    ex.type === 'match' ||
    ex.type === 'position' ||
    ex.type === 'listening';
  const isTextInput = ex.type === 'spell' || ex.type === 'speak';
  const showListenButton =
    !!ex.audioWord || ex.type === 'listening' || ex.type === 'speak' || activeModule === 'listening';

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveModule(null)}
          className="text-primary text-sm flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('الوحدات', 'Modules')}
        </button>
        <EduLangToggle />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">
          {meta.emoji} {lang === 'ar' ? meta.ar : meta.en}
        </h3>
        <span className="text-xs text-muted-foreground">
          {step + 1}/{exercises.length}
        </span>
      </div>

      {/* progress */}
      <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((step + 1) / exercises.length) * 100}%` }}
        />
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-3">
        {/* Teaching layer */}
        {(ex.teachAr || ex.teachEn) && (
          <div className="rounded-xl bg-primary/5 p-3 space-y-1">
            <div className="text-[11px] font-bold text-primary">
              {t('📘 شرح', '📘 Lesson')}
            </div>
            <p className="text-xs leading-relaxed whitespace-pre-line">
              {lang === 'ar' ? ex.teachAr : ex.teachEn}
            </p>
            {(ex.exampleAr || ex.exampleEn) && (
              <p className="text-[11px] text-muted-foreground italic">
                ✨ {lang === 'ar' ? ex.exampleAr : ex.exampleEn}
              </p>
            )}
          </div>
        )}

        {/* Prompt */}
        <p className="text-sm font-semibold whitespace-pre-line">
          {lang === 'ar' ? ex.promptAr : ex.promptEn}
        </p>

        {showListenButton && (
          <button
            onClick={listenToCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-primary/10 text-xs font-semibold"
          >
            <Volume2 className="w-3.5 h-3.5" />
            {t('استمعي', 'Listen')}
          </button>
        )}

        {(ex.hintAr || ex.hintEn) && (
          <p className="text-[11px] text-muted-foreground">
            💡 {lang === 'ar' ? ex.hintAr : ex.hintEn}
          </p>
        )}

        {/* Answer area: choice-like */}
        {isChoiceLike && (
          <div className="space-y-2">
            {(lang === 'ar' ? ex.optionsAr! : ex.optionsEn!).map((opt, i) => (
              <button
                key={i}
                onClick={() => submit(i)}
                disabled={feedback !== null}
                className={`w-full p-3 rounded-xl text-xs font-medium text-start transition-all active:scale-95 ${
                  feedback === null
                    ? 'bg-secondary/50 hover:bg-primary/10'
                    : i === ex.correct
                    ? 'bg-success/20 text-success ring-2 ring-success'
                    : 'bg-secondary/30 opacity-60'
                }`}
              >
                {['أ', 'ب', 'ج', 'د'][i]}. {opt}
              </button>
            ))}
          </div>
        )}

        {/* Answer area: text input */}
        {isTextInput && (
          <div className="space-y-2">
            {ex.type === 'speak' && (
              <button
                onClick={listenToCurrent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-primary/10 text-xs font-semibold"
              >
                <Mic className="w-3.5 h-3.5" />
                {t('استمعي للنطق الصحيح', 'Listen to correct pronunciation')}
              </button>
            )}
            <input
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={
                ex.type === 'speak'
                  ? t('اكتبي ما نطقتِ', 'Type what you said')
                  : t('اكتبي الكلمة', 'Type the word')
              }
              disabled={feedback !== null}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={() => submit(answer)}
              disabled={!answer || feedback !== null}
              className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              <SpellCheck className="w-4 h-4 inline-block me-1" />
              {t('تحقق', 'Check')}
            </button>
          </div>
        )}

        {/* Nuance / common mistakes */}
        {(ex.noteAr || ex.noteEn) && feedback && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-1">
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              {t('⚠️ تفرقة وملاحظات مهمة', '⚠️ Common Mistakes / Nuance')}
            </div>
            <p className="text-xs leading-relaxed">
              {lang === 'ar' ? ex.noteAr : ex.noteEn}
            </p>
          </div>
        )}

        {feedback && (
          <div
            className={`flex items-center gap-2 text-sm font-semibold ${
              feedback === 'correct' ? 'text-success' : 'text-destructive'
            }`}
          >
            {feedback === 'correct' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {feedback === 'correct' ? t('أحسنتِ!', 'Great!') : t('حاولي ثانية', 'Try again')}
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationHub;
