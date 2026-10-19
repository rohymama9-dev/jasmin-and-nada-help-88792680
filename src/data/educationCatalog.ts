/**
 * Education catalog: 200 free lessons split across 6 categories,
 * ordered by difficulty within each category. Bilingual (AR/EN).
 *
 * Pronunciation is delivered at runtime via the browser's Web Speech API
 * (SpeechSynthesisUtterance) — no API keys, fully free.
 */

export type LessonCategory =
  | 'letters'
  | 'words'
  | 'grammar'
  | 'listening'
  | 'stories'
  | 'texts'
  | 'phrases'
  | 'conversations';

export interface Lesson {
  id: string;
  category: LessonCategory;
  /** 1 = easiest, 5 = hardest */
  difficulty: 1 | 2 | 3 | 4 | 5;
  titleAr: string;
  titleEn: string;
  /** Short body / what to read & pronounce, AR */
  bodyAr: string;
  /** Short body / what to read & pronounce, EN */
  bodyEn: string;
  /** Optional pronunciation hints (split into chunks for tap-to-hear) */
  itemsAr?: string[];
  itemsEn?: string[];
  /** Points awarded for completing once. Scales with difficulty. */
  points: number;
}

const ARABIC_LETTERS = [
  'ا','ب','ت','ث','ج','ح','خ','د','ذ','ر',
  'ز','س','ش','ص','ض','ط','ظ','ع','غ','ف',
  'ق','ك','ل','م','ن','ه','و','ي',
];
const ENGLISH_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// --- Letters: 40 lessons (28 Arabic + 12 English groups of 2-3) ---
const lettersLessons: Lesson[] = [
  ...ARABIC_LETTERS.map<Lesson>((l, i) => ({
    id: `letters-ar-${i + 1}`,
    category: 'letters',
    difficulty: (Math.min(5, 1 + Math.floor(i / 7)) as 1 | 2 | 3 | 4 | 5),
    titleAr: `الحرف ${l}`,
    titleEn: `Letter ${l}`,
    bodyAr: `تعرّفي على الحرف ${l} وكيف يُلفظ في بداية الكلمة ووسطها وآخرها.`,
    bodyEn: `Meet the Arabic letter ${l}. Listen and repeat.`,
    itemsAr: [l, `${l}ـ`, `ـ${l}ـ`, `ـ${l}`],
    itemsEn: [l],
    points: 2,
  })),
  ...Array.from({ length: 12 }, (_, i) => {
    const start = i * 2;
    const group = ENGLISH_LETTERS.slice(start, start + 3).join(' · ');
    return {
      id: `letters-en-${i + 1}`,
      category: 'letters' as const,
      difficulty: Math.min(5, 1 + Math.floor(i / 3)) as 1 | 2 | 3 | 4 | 5,
      titleAr: `حروف انجليزية: ${group}`,
      titleEn: `English letters: ${group}`,
      bodyAr: `استمعي إلى نطق هذه الحروف.`,
      bodyEn: `Listen to the pronunciation of these letters.`,
      itemsAr: ENGLISH_LETTERS.slice(start, start + 3),
      itemsEn: ENGLISH_LETTERS.slice(start, start + 3),
      points: 2,
    };
  }),
];

// --- Words: 50 lessons (everyday vocabulary) ---
const WORD_PAIRS: { ar: string; en: string }[] = [
  { ar: 'بيت', en: 'house' }, { ar: 'مدرسة', en: 'school' }, { ar: 'كتاب', en: 'book' },
  { ar: 'قلم', en: 'pen' }, { ar: 'ماء', en: 'water' }, { ar: 'خبز', en: 'bread' },
  { ar: 'تفاحة', en: 'apple' }, { ar: 'برتقال', en: 'orange' }, { ar: 'موز', en: 'banana' },
  { ar: 'طائر', en: 'bird' }, { ar: 'سمكة', en: 'fish' }, { ar: 'قطة', en: 'cat' },
  { ar: 'كلب', en: 'dog' }, { ar: 'حصان', en: 'horse' }, { ar: 'بقرة', en: 'cow' },
  { ar: 'شمس', en: 'sun' }, { ar: 'قمر', en: 'moon' }, { ar: 'نجمة', en: 'star' },
  { ar: 'سماء', en: 'sky' }, { ar: 'أرض', en: 'earth' }, { ar: 'بحر', en: 'sea' },
  { ar: 'جبل', en: 'mountain' }, { ar: 'نهر', en: 'river' }, { ar: 'شجرة', en: 'tree' },
  { ar: 'وردة', en: 'rose' }, { ar: 'لون أحمر', en: 'red color' }, { ar: 'لون أزرق', en: 'blue color' },
  { ar: 'لون أصفر', en: 'yellow color' }, { ar: 'لون أخضر', en: 'green color' }, { ar: 'صباح', en: 'morning' },
  { ar: 'مساء', en: 'evening' }, { ar: 'ليلة', en: 'night' }, { ar: 'يوم', en: 'day' },
  { ar: 'أسبوع', en: 'week' }, { ar: 'شهر', en: 'month' }, { ar: 'سنة', en: 'year' },
  { ar: 'أم', en: 'mother' }, { ar: 'أب', en: 'father' }, { ar: 'أخ', en: 'brother' },
  { ar: 'أخت', en: 'sister' }, { ar: 'صديق', en: 'friend' }, { ar: 'معلم', en: 'teacher' },
  { ar: 'طبيب', en: 'doctor' }, { ar: 'مهندس', en: 'engineer' }, { ar: 'سيارة', en: 'car' },
  { ar: 'طائرة', en: 'plane' }, { ar: 'قطار', en: 'train' }, { ar: 'حافلة', en: 'bus' },
  { ar: 'دراجة', en: 'bicycle' }, { ar: 'مفتاح', en: 'key' },
];
const wordsLessons: Lesson[] = WORD_PAIRS.map((w, i) => ({
  id: `words-${i + 1}`,
  category: 'words',
  difficulty: Math.min(5, 1 + Math.floor(i / 12)) as 1 | 2 | 3 | 4 | 5,
  titleAr: `كلمة: ${w.ar}`,
  titleEn: `Word: ${w.en}`,
  bodyAr: `كلمة جديدة: ${w.ar} — تعني بالإنجليزية: ${w.en}.`,
  bodyEn: `New word: ${w.en} — in Arabic: ${w.ar}.`,
  itemsAr: [w.ar],
  itemsEn: [w.en],
  points: 3,
}));

// --- Grammar: 30 lessons (short rules, AR + EN) ---
const GRAMMAR_RULES: { titleAr: string; titleEn: string; ruleAr: string; ruleEn: string }[] = [
  { titleAr: 'المفرد والجمع', titleEn: 'Singular & Plural', ruleAr: 'بيت / بيوت — كتاب / كتب', ruleEn: 'house / houses — book / books' },
  { titleAr: 'المذكر والمؤنث', titleEn: 'Masculine & Feminine', ruleAr: 'معلم (ذكر) — معلمة (أنثى)', ruleEn: 'teacher (m) — teacher (f) in Arabic uses ـة' },
  { titleAr: 'الضمائر', titleEn: 'Pronouns', ruleAr: 'أنا — أنتَ — أنتِ — هو — هي — نحن', ruleEn: 'I — You — He — She — We — They' },
  { titleAr: 'الفعل الماضي', titleEn: 'Past Tense', ruleAr: 'كتبَ، قرأَ، ذهبَ', ruleEn: 'wrote, read, went' },
  { titleAr: 'الفعل المضارع', titleEn: 'Present Tense', ruleAr: 'يكتبُ، يقرأُ، يذهبُ', ruleEn: 'writes, reads, goes' },
  { titleAr: 'فعل الأمر', titleEn: 'Imperative', ruleAr: 'اكتبْ، اقرأْ، اذهبْ', ruleEn: 'write!, read!, go!' },
  { titleAr: 'حروف الجر', titleEn: 'Prepositions', ruleAr: 'في، على، إلى، من، عن', ruleEn: 'in, on, to, from, about' },
  { titleAr: 'أدوات التعريف', titleEn: 'Articles', ruleAr: 'الـ التعريف: البيت، الكتاب', ruleEn: 'a / an / the' },
  { titleAr: 'الجملة الاسمية', titleEn: 'Nominal Sentence', ruleAr: 'الكتابُ مفيدٌ', ruleEn: 'The book is useful.' },
  { titleAr: 'الجملة الفعلية', titleEn: 'Verbal Sentence', ruleAr: 'يقرأ الطالبُ الدرسَ', ruleEn: 'The student reads the lesson.' },
  { titleAr: 'الصفات', titleEn: 'Adjectives', ruleAr: 'بيتٌ كبيرٌ، وردةٌ جميلةٌ', ruleEn: 'big house, beautiful flower' },
  { titleAr: 'المضاف والمضاف إليه', titleEn: 'Possession', ruleAr: 'كتابُ الطالبِ', ruleEn: "the student's book" },
  { titleAr: 'النفي', titleEn: 'Negation', ruleAr: 'لا، ليس، ما، لم، لن', ruleEn: 'no, not, never, won\'t' },
  { titleAr: 'السؤال', titleEn: 'Questions', ruleAr: 'هل، ما، من، أين، متى، لماذا، كيف', ruleEn: 'do, what, who, where, when, why, how' },
  { titleAr: 'العطف', titleEn: 'Conjunctions', ruleAr: 'و، أو، ثم، لكن', ruleEn: 'and, or, then, but' },
  { titleAr: 'الأعداد ١-١٠', titleEn: 'Numbers 1-10', ruleAr: 'واحد، اثنان، ثلاثة، أربعة، خمسة', ruleEn: 'one, two, three, four, five' },
  { titleAr: 'الأعداد ١١-٢٠', titleEn: 'Numbers 11-20', ruleAr: 'أحد عشر، اثنا عشر، ثلاثة عشر', ruleEn: 'eleven, twelve, thirteen' },
  { titleAr: 'المثنى', titleEn: 'Dual', ruleAr: 'كتابان — كتابَين', ruleEn: 'two books (Arabic dual form)' },
  { titleAr: 'جمع المؤنث السالم', titleEn: 'Feminine Plural', ruleAr: 'معلمات، طالبات', ruleEn: 'female teachers, female students' },
  { titleAr: 'جمع المذكر السالم', titleEn: 'Masculine Plural', ruleAr: 'معلمون، طالبون', ruleEn: 'male teachers, male students' },
  { titleAr: 'إنّ وأخواتها', titleEn: 'Inna & sisters', ruleAr: 'إنَّ، أنَّ، كأنَّ، لكنَّ، ليتَ، لعلَّ', ruleEn: 'Indeed, that, as if, but, wish, perhaps' },
  { titleAr: 'كان وأخواتها', titleEn: 'Kaana & sisters', ruleAr: 'كان، صار، أصبح، أمسى', ruleEn: 'was, became, became, became (evening)' },
  { titleAr: 'الفاعل', titleEn: 'Subject', ruleAr: 'يقرأ الطالبُ — الطالبُ فاعل', ruleEn: 'The student reads — student is subject' },
  { titleAr: 'المفعول به', titleEn: 'Object', ruleAr: 'قرأ الطالبُ الدرسَ — الدرسَ مفعول', ruleEn: 'The student read the lesson — lesson is object' },
  { titleAr: 'النعت', titleEn: 'Adjective Agreement', ruleAr: 'البيتُ الكبيرُ', ruleEn: 'The big house' },
  { titleAr: 'الحال', titleEn: 'Circumstantial', ruleAr: 'جاء الطالبُ مسرعاً', ruleEn: 'The student came hurrying.' },
  { titleAr: 'التمييز', titleEn: 'Specifier', ruleAr: 'اشتريت كيلو تفاحاً', ruleEn: 'I bought a kilo of apples.' },
  { titleAr: 'البدل', titleEn: 'Apposition', ruleAr: 'جاء أخي محمدٌ', ruleEn: 'My brother Muhammad came.' },
  { titleAr: 'الاستثناء', titleEn: 'Exception', ruleAr: 'حضر الطلابُ إلا واحداً', ruleEn: 'The students came except one.' },
  { titleAr: 'الشرط', titleEn: 'Conditional', ruleAr: 'إنْ تجتهدْ تنجحْ', ruleEn: 'If you work hard, you will succeed.' },
];
const grammarLessons: Lesson[] = GRAMMAR_RULES.map((g, i) => ({
  id: `grammar-${i + 1}`,
  category: 'grammar',
  difficulty: Math.min(5, 1 + Math.floor(i / 6)) as 1 | 2 | 3 | 4 | 5,
  titleAr: g.titleAr,
  titleEn: g.titleEn,
  bodyAr: g.ruleAr,
  bodyEn: g.ruleEn,
  itemsAr: g.ruleAr.split(/[،,]/).map(s => s.trim()).filter(Boolean),
  itemsEn: g.ruleEn.split(/[,،]/).map(s => s.trim()).filter(Boolean),
  points: 4,
}));

// --- Listening: 30 lessons (short phrases to listen and repeat) ---
const LISTEN: { ar: string; en: string }[] = [
  { ar: 'صباح الخير', en: 'Good morning' },
  { ar: 'مساء الخير', en: 'Good evening' },
  { ar: 'كيف حالك؟', en: 'How are you?' },
  { ar: 'أنا بخير، شكراً', en: 'I am fine, thank you' },
  { ar: 'ما اسمك؟', en: 'What is your name?' },
  { ar: 'اسمي…', en: 'My name is…' },
  { ar: 'تشرفت بمعرفتك', en: 'Nice to meet you' },
  { ar: 'من فضلك', en: 'Please' },
  { ar: 'شكراً جزيلاً', en: 'Thank you very much' },
  { ar: 'عفواً', en: 'You\'re welcome' },
  { ar: 'آسف', en: 'I am sorry' },
  { ar: 'أين الحمام؟', en: 'Where is the bathroom?' },
  { ar: 'كم الساعة؟', en: 'What time is it?' },
  { ar: 'كم السعر؟', en: 'How much is it?' },
  { ar: 'أنا جائع', en: 'I am hungry' },
  { ar: 'أنا عطشان', en: 'I am thirsty' },
  { ar: 'أحبك', en: 'I love you' },
  { ar: 'أهلاً وسهلاً', en: 'Welcome' },
  { ar: 'مع السلامة', en: 'Goodbye' },
  { ar: 'إلى اللقاء', en: 'See you later' },
  { ar: 'هل تتحدث الإنجليزية؟', en: 'Do you speak English?' },
  { ar: 'لا أفهم', en: 'I do not understand' },
  { ar: 'تكلم ببطء من فضلك', en: 'Please speak slowly' },
  { ar: 'أين المحطة؟', en: 'Where is the station?' },
  { ar: 'كم تبعد؟', en: 'How far is it?' },
  { ar: 'أحتاج المساعدة', en: 'I need help' },
  { ar: 'اتصل بالطبيب', en: 'Call the doctor' },
  { ar: 'الطقس جميل اليوم', en: 'The weather is beautiful today' },
  { ar: 'الكتاب على الطاولة', en: 'The book is on the table' },
  { ar: 'أراك غداً', en: 'See you tomorrow' },
];
const listeningLessons: Lesson[] = LISTEN.map((s, i) => ({
  id: `listening-${i + 1}`,
  category: 'listening',
  difficulty: Math.min(5, 1 + Math.floor(i / 6)) as 1 | 2 | 3 | 4 | 5,
  titleAr: `استماع: ${s.ar.slice(0, 18)}`,
  titleEn: `Listen: ${s.en}`,
  bodyAr: s.ar,
  bodyEn: s.en,
  itemsAr: [s.ar],
  itemsEn: [s.en],
  points: 3,
}));

// --- Stories: 25 lessons ---
const STORIES: { titleAr: string; titleEn: string; ar: string; en: string }[] = [
  { titleAr: 'الأرنب والسلحفاة', titleEn: 'The Tortoise and the Hare',
    ar: 'تسابق الأرنب والسلحفاة. غرّ الأرنب نفسه فنام، فسبقته السلحفاة بثباتها.',
    en: 'A hare and a tortoise raced. The hare grew proud and slept, so the patient tortoise won.' },
  { titleAr: 'الأسد والفأر', titleEn: 'The Lion and the Mouse',
    ar: 'أنقذ فأرٌ صغير أسداً وقع في شرَك. فعرف الأسد أن المعروف لا يُنسى.',
    en: 'A small mouse saved a lion caught in a trap. Even the smallest can help the strong.' },
  { titleAr: 'الراعي الكاذب', titleEn: 'The Boy Who Cried Wolf',
    ar: 'كذب الراعي مرّتين، فلما جاء الذئب فعلاً لم يصدّقه أحد.',
    en: 'A boy lied twice about a wolf. When the wolf truly came, no one believed him.' },
  { titleAr: 'النملة والصرصور', titleEn: 'The Ant and the Grasshopper',
    ar: 'جمعت النملة طعامها للشتاء، وغنّى الصرصور. حلّ الشتاء فجاع.',
    en: 'The ant gathered food for winter while the grasshopper sang. Winter came and he was hungry.' },
  { titleAr: 'الذئب والحملان', titleEn: 'The Wolf and the Lambs',
    ar: 'حذّرت الأم أبناءها فلم يفتحوا الباب للذئب فنجَوا.',
    en: 'The mother warned her lambs; they did not open the door to the wolf and were saved.' },
  { titleAr: 'الثعلب والعنب', titleEn: 'The Fox and the Grapes',
    ar: 'حاول الثعلب الوصول إلى العنب فلم يستطع، فقال: إنه حامض!',
    en: 'A fox could not reach the grapes and said: They are sour anyway!' },
  { titleAr: 'الراعي والأمانة', titleEn: 'The Honest Shepherd',
    ar: 'اختبر الملك راعياً فوجده صادقاً، فأعطاه مكافأة كبيرة.',
    en: 'A king tested a shepherd and found him honest, then gave him a great reward.' },
  { titleAr: 'الفلاح المجتهد', titleEn: 'The Diligent Farmer',
    ar: 'حرث الفلاح أرضه وزرعها، فحصد محصولاً وفيراً.',
    en: 'A farmer plowed and planted, then harvested an abundant crop.' },
  { titleAr: 'الصياد الذكي', titleEn: 'The Clever Fisherman',
    ar: 'استعمل الصياد طعماً جديداً فاصطاد سمكة كبيرة.',
    en: 'A fisherman used new bait and caught a big fish.' },
  { titleAr: 'القطة والفأر', titleEn: 'Cat and Mouse',
    ar: 'تتبعت القطة الفأر فاختبأ في حفرته الصغيرة.',
    en: 'The cat chased the mouse, who hid in his tiny hole.' },
  { titleAr: 'العصفور الذكي', titleEn: 'The Smart Sparrow',
    ar: 'وضع العصفور حصى في إبريق ليصل إلى الماء.',
    en: 'A sparrow dropped pebbles into a jug to raise the water.' },
  { titleAr: 'الطفل المحسن', titleEn: 'The Kind Child',
    ar: 'تصدّق الطفل بطعامه على عصفور جائع.',
    en: 'A child gave his food to a hungry bird.' },
  { titleAr: 'الأم والابن', titleEn: 'Mother and Son',
    ar: 'علّمت الأم ابنها الصدق، فصار رجلاً محبوباً.',
    en: 'A mother taught her son honesty, and he became a beloved man.' },
  { titleAr: 'الصديقان', titleEn: 'The Two Friends',
    ar: 'وقع صديق في حفرة، فأنقذه صديقه دون تردد.',
    en: 'A friend fell into a pit; the other rescued him without hesitation.' },
  { titleAr: 'الحمار والملح', titleEn: 'The Donkey and the Salt',
    ar: 'حمل الحمار ملحاً وعبر النهر فذاب الملح، فظن الذكاء فحمل قطناً فابتلّ وثقل.',
    en: 'A donkey crossed a river with salt and felt lighter; later with cotton it grew heavy.' },
  { titleAr: 'الديك الفصيح', titleEn: 'The Eloquent Rooster',
    ar: 'صاح الديك في الفجر فأيقظ الفلاحين للعمل.',
    en: 'The rooster crowed at dawn and woke the farmers.' },
  { titleAr: 'النحلة المجتهدة', titleEn: 'The Busy Bee',
    ar: 'تعمل النحلة من الصباح حتى المساء لتجمع العسل.',
    en: 'The bee works from dawn till dusk gathering honey.' },
  { titleAr: 'الفراشة الجميلة', titleEn: 'The Beautiful Butterfly',
    ar: 'كانت الفراشة يرقة، ثم أصبحت كائناً ملوّناً يطير.',
    en: 'The butterfly was once a caterpillar, then became a colorful flyer.' },
  { titleAr: 'الفيل والنملة', titleEn: 'Elephant and Ant',
    ar: 'لا يهم حجمك، الذكاء أهم من القوة.',
    en: 'Size does not matter — wit beats strength.' },
  { titleAr: 'الشمعة والظلام', titleEn: 'Candle and Darkness',
    ar: 'شمعة صغيرة تكفي لإنارة غرفة كبيرة.',
    en: 'A small candle is enough to light a large room.' },
  { titleAr: 'البذرة والشجرة', titleEn: 'The Seed and the Tree',
    ar: 'كل شجرة عظيمة بدأت بذرة صغيرة.',
    en: 'Every great tree began as a tiny seed.' },
  { titleAr: 'النور بعد الظلمة', titleEn: 'Light After Darkness',
    ar: 'بعد كل ليل فجر، وبعد كل ضيق فرج.',
    en: 'After every night, a dawn; after every hardship, ease.' },
  { titleAr: 'العامل المخلص', titleEn: 'The Loyal Worker',
    ar: 'أتقن عمله فترقّى في عمله.',
    en: 'He mastered his craft and was promoted.' },
  { titleAr: 'الكتاب الصديق', titleEn: 'The Book Friend',
    ar: 'الكتاب أوفى الأصدقاء.',
    en: 'A book is the most loyal friend.' },
  { titleAr: 'العصفور الحر', titleEn: 'The Free Bird',
    ar: 'لا يُسعد العصفورَ شيءٌ كما تُسعده الحرية.',
    en: 'Nothing pleases a bird like freedom.' },
];
const storiesLessons: Lesson[] = STORIES.map((s, i) => ({
  id: `stories-${i + 1}`,
  category: 'stories',
  difficulty: Math.min(5, 1 + Math.floor(i / 5)) as 1 | 2 | 3 | 4 | 5,
  titleAr: s.titleAr,
  titleEn: s.titleEn,
  bodyAr: s.ar,
  bodyEn: s.en,
  itemsAr: [s.ar],
  itemsEn: [s.en],
  points: 5,
}));

// --- Texts: 25 lessons (longer reading passages) ---
const TEXTS: { titleAr: string; titleEn: string; ar: string; en: string }[] = [
  { titleAr: 'فصل الربيع', titleEn: 'The Spring Season',
    ar: 'الربيع فصل جميل، تنبت فيه الأزهار وتعود الحياة إلى الطبيعة.',
    en: 'Spring is a beautiful season when flowers bloom and life returns to nature.' },
  { titleAr: 'فصل الصيف', titleEn: 'The Summer Season',
    ar: 'الصيف حار وطويل النهار. نسبح في البحر ونأكل البطيخ.',
    en: 'Summer is hot with long days. We swim in the sea and eat watermelon.' },
  { titleAr: 'فصل الخريف', titleEn: 'Autumn Season',
    ar: 'تسقط أوراق الشجر في الخريف ويبرد الجو شيئاً فشيئاً.',
    en: 'In autumn leaves fall and the weather slowly cools.' },
  { titleAr: 'فصل الشتاء', titleEn: 'Winter Season',
    ar: 'يتساقط المطر والثلج في الشتاء، ونلبس الملابس الدافئة.',
    en: 'Rain and snow fall in winter and we wear warm clothes.' },
  { titleAr: 'يوم في المدرسة', titleEn: 'A Day at School',
    ar: 'أصل المدرسة باكراً، أتعلم القراءة والحساب وأحب اللعب مع أصدقائي.',
    en: 'I arrive at school early, learn reading and math, and love playing with my friends.' },
  { titleAr: 'وصف العائلة', titleEn: 'My Family',
    ar: 'عائلتي صغيرة: أبي وأمي وأخي وأنا. نحب بعضنا كثيراً.',
    en: 'My family is small: father, mother, brother, and me. We love each other very much.' },
  { titleAr: 'في السوق', titleEn: 'At the Market',
    ar: 'ذهبت إلى السوق مع أمي واشترينا الفاكهة والخضار.',
    en: 'I went to the market with my mother and bought fruits and vegetables.' },
  { titleAr: 'رحلة إلى البحر', titleEn: 'A Trip to the Sea',
    ar: 'سافرنا إلى البحر، رأينا الموج والسفن وجمعنا الصدف.',
    en: 'We traveled to the sea, saw waves and ships, and collected shells.' },
  { titleAr: 'الحديقة العامة', titleEn: 'The Park',
    ar: 'في الحديقة أشجار وأزهار، وأطفال يلعبون على الأرجوحة.',
    en: 'In the park there are trees, flowers, and children playing on the swings.' },
  { titleAr: 'مكتبة المدينة', titleEn: 'The City Library',
    ar: 'مكتبة المدينة كبيرة، فيها كتب كثيرة في كل المجالات.',
    en: 'The city library is huge, with many books on every topic.' },
  { titleAr: 'صديقي الجديد', titleEn: 'My New Friend',
    ar: 'تعرفت على صديق جديد في الحي، نلعب ونتعلم معاً.',
    en: 'I met a new friend in the neighborhood; we play and learn together.' },
  { titleAr: 'الطبيب اللطيف', titleEn: 'The Kind Doctor',
    ar: 'زرت الطبيب فعالجني وأعطاني دواءً وأرشدني لشرب الماء.',
    en: 'I visited the doctor; he treated me, gave medicine, and told me to drink water.' },
  { titleAr: 'في المطعم', titleEn: 'At the Restaurant',
    ar: 'طلبنا طعاماً لذيذاً وتناولنا العصير، ثم شكرنا النادل.',
    en: 'We ordered tasty food, drank juice, and thanked the waiter.' },
  { titleAr: 'هواياتي', titleEn: 'My Hobbies',
    ar: 'أحب القراءة والرسم وركوب الدراجة في عطلة نهاية الأسبوع.',
    en: 'I love reading, drawing, and biking on weekends.' },
  { titleAr: 'حلمي في المستقبل', titleEn: 'My Future Dream',
    ar: 'أحلم أن أكون طبيباً لأساعد المرضى وأخفف آلامهم.',
    en: 'I dream of being a doctor to help patients and ease their pain.' },
  { titleAr: 'النظافة من الإيمان', titleEn: 'Cleanliness',
    ar: 'النظافة سلوك يومي يبدأ بغسل اليدين وترتيب الغرفة.',
    en: 'Cleanliness is a daily habit starting with washing hands and tidying the room.' },
  { titleAr: 'احترام الكبير', titleEn: 'Respecting Elders',
    ar: 'نحترم الكبير ونساعده ونصغي إليه.',
    en: 'We respect elders, help them, and listen to them.' },
  { titleAr: 'العمل التطوعي', titleEn: 'Volunteering',
    ar: 'نتعاون في تنظيف الحي وزرع الأشجار.',
    en: 'We cooperate to clean the neighborhood and plant trees.' },
  { titleAr: 'الرياضة والصحة', titleEn: 'Sports and Health',
    ar: 'الرياضة تقوي الجسم وتنشط العقل.',
    en: 'Sports strengthen the body and energize the mind.' },
  { titleAr: 'الغذاء الصحي', titleEn: 'Healthy Food',
    ar: 'نأكل الفواكه والخضار ونقلل من السكريات.',
    en: 'We eat fruits and vegetables and reduce sweets.' },
  { titleAr: 'ماء الحياة', titleEn: 'Water of Life',
    ar: 'الماء عماد الحياة، علينا الحفاظ عليه.',
    en: 'Water is life — we must preserve it.' },
  { titleAr: 'حماية البيئة', titleEn: 'Protecting the Environment',
    ar: 'لا نرمي النفايات ونزرع المزيد من الأشجار.',
    en: 'We do not litter and plant more trees.' },
  { titleAr: 'العلم نور', titleEn: 'Knowledge is Light',
    ar: 'العلم نور والجهل ظلام.',
    en: 'Knowledge is light; ignorance is darkness.' },
  { titleAr: 'الصبر مفتاح الفرج', titleEn: 'Patience is Key',
    ar: 'بالصبر تتحقق الأحلام.',
    en: 'With patience, dreams come true.' },
  { titleAr: 'العمل بإتقان', titleEn: 'Mastery in Work',
    ar: 'إتقان العمل يرفع صاحبه ويحقق له النجاح.',
    en: 'Mastery elevates a person and brings success.' },
];
const textsLessons: Lesson[] = TEXTS.map((s, i) => ({
  id: `texts-${i + 1}`,
  category: 'texts',
  difficulty: Math.min(5, 1 + Math.floor(i / 5)) as 1 | 2 | 3 | 4 | 5,
  titleAr: s.titleAr,
  titleEn: s.titleEn,
  bodyAr: s.ar,
  bodyEn: s.en,
  itemsAr: s.ar.split(/[.،,]/).map(t => t.trim()).filter(Boolean),
  itemsEn: s.en.split(/[.,]/).map(t => t.trim()).filter(Boolean),
  points: 6,
}));

// --- Phrases: 25 lessons (useful daily phrases) ---
const PHRASES: { ar: string; en: string }[] = [
  { ar: 'أحتاج إلى مساعدة', en: 'I need help' },
  { ar: 'هل يمكنني الدخول؟', en: 'May I come in?' },
  { ar: 'انتظر من فضلك', en: 'Please wait' },
  { ar: 'أتمنى لك يوماً سعيداً', en: 'Have a nice day' },
  { ar: 'بالتوفيق', en: 'Good luck' },
  { ar: 'لا تقلق', en: 'Do not worry' },
  { ar: 'أحب الطعام', en: 'I love the food' },
  { ar: 'الطقس بارد اليوم', en: 'It is cold today' },
  { ar: 'الطقس حار', en: 'It is hot' },
  { ar: 'أين تعمل؟', en: 'Where do you work?' },
  { ar: 'أعمل في المدرسة', en: 'I work at the school' },
  { ar: 'كم عمرك؟', en: 'How old are you?' },
  { ar: 'من أين أنت؟', en: 'Where are you from?' },
  { ar: 'أنا من العراق', en: 'I am from Iraq' },
  { ar: 'سعدت برؤيتك', en: 'Glad to see you' },
  { ar: 'أراك قريباً', en: 'See you soon' },
  { ar: 'تصبح على خير', en: 'Good night' },
  { ar: 'صباح النور', en: 'Morning of light' },
  { ar: 'هل أنت متعب؟', en: 'Are you tired?' },
  { ar: 'أنا سعيد', en: 'I am happy' },
  { ar: 'أنا حزين قليلاً', en: 'I am a little sad' },
  { ar: 'أحتاج إلى راحة', en: 'I need rest' },
  { ar: 'لنذهب للمشي', en: 'Let us go for a walk' },
  { ar: 'هل تحب القهوة؟', en: 'Do you like coffee?' },
  { ar: 'الشاي أفضل', en: 'Tea is better' },
];
const phrasesLessons: Lesson[] = PHRASES.map((p, i) => ({
  id: `phrases-${i + 1}`,
  category: 'phrases',
  difficulty: Math.min(5, 1 + Math.floor(i / 5)) as 1 | 2 | 3 | 4 | 5,
  titleAr: `عبارة: ${p.ar}`,
  titleEn: `Phrase: ${p.en}`,
  bodyAr: p.ar,
  bodyEn: p.en,
  itemsAr: p.ar.split(' '),
  itemsEn: p.en.split(' '),
  points: 4,
}));

// --- Conversations: 20 lessons (multi-line dialogues) ---
const CONVERSATIONS: { titleAr: string; titleEn: string; ar: string[]; en: string[] }[] = [
  { titleAr: 'تحية أولى', titleEn: 'First Greeting',
    ar: ['مرحباً!', 'أهلاً، كيف حالك؟', 'بخير شكراً، وأنت؟'],
    en: ['Hello!', 'Hi, how are you?', 'Fine thanks, and you?'] },
  { titleAr: 'في المقهى', titleEn: 'At the Café',
    ar: ['أريد قهوة من فضلك', 'سكر؟', 'بدون سكر شكراً'],
    en: ['I want a coffee please', 'Sugar?', 'No sugar thanks'] },
  { titleAr: 'سؤال عن الطريق', titleEn: 'Asking Directions',
    ar: ['أين المكتبة؟', 'إلى اليمين ثم للأمام', 'شكراً جزيلاً'],
    en: ['Where is the library?', 'Right then straight', 'Thank you very much'] },
  { titleAr: 'لقاء صديق', titleEn: 'Meeting a Friend',
    ar: ['لم نلتقِ منذ زمن!', 'صحيح، اشتقت لك', 'لنتقابل هذا الأسبوع'],
    en: ['Long time no see!', 'Right, I missed you', 'Let us meet this week'] },
  { titleAr: 'في المطعم', titleEn: 'At the Restaurant',
    ar: ['ما الطبق الخاص؟', 'كبسة لذيذة', 'أطلبه من فضلك'],
    en: ['What is the special?', 'Delicious kabsa', 'I will order it please'] },
  { titleAr: 'حجز فندق', titleEn: 'Hotel Booking',
    ar: ['أريد غرفة لليلتين', 'مفردة أم مزدوجة؟', 'مفردة من فضلك'],
    en: ['I want a room for two nights', 'Single or double?', 'Single please'] },
  { titleAr: 'في المتجر', titleEn: 'At the Store',
    ar: ['كم سعر هذا؟', 'عشرة دنانير', 'سآخذه'],
    en: ['How much is this?', 'Ten dinars', 'I will take it'] },
  { titleAr: 'موعد طبيب', titleEn: 'Doctor Appointment',
    ar: ['أشعر بألم في رأسي', 'منذ متى؟', 'منذ أمس'],
    en: ['My head hurts', 'Since when?', 'Since yesterday'] },
  { titleAr: 'مكالمة هاتفية', titleEn: 'Phone Call',
    ar: ['ألو، من معي؟', 'معك أحمد', 'أهلاً أحمد، كيف حالك؟'],
    en: ['Hello, who is this?', 'This is Ahmed', 'Hi Ahmed, how are you?'] },
  { titleAr: 'في المدرسة', titleEn: 'At School',
    ar: ['ما درسنا اليوم؟', 'لدينا رياضيات', 'أحب الرياضيات'],
    en: ['What is our lesson today?', 'We have math', 'I love math'] },
  { titleAr: 'دعوة', titleEn: 'An Invitation',
    ar: ['تعالي إلى منزلي', 'متى؟', 'يوم الجمعة'],
    en: ['Come to my home', 'When?', 'On Friday'] },
  { titleAr: 'تقديم نفسك', titleEn: 'Introducing Yourself',
    ar: ['اسمي سارة', 'تشرفت بك', 'وأنا أيضاً'],
    en: ['My name is Sara', 'Nice to meet you', 'You too'] },
  { titleAr: 'في السوق', titleEn: 'At the Market',
    ar: ['كيلو طماطم من فضلك', 'تفضل', 'كم الحساب؟'],
    en: ['One kilo of tomatoes please', 'Here you are', 'How much?'] },
  { titleAr: 'في الباص', titleEn: 'On the Bus',
    ar: ['هل هذا الباص يذهب للوسط؟', 'نعم', 'بكم التذكرة؟'],
    en: ['Does this bus go downtown?', 'Yes', 'How much is the ticket?'] },
  { titleAr: 'تأخير', titleEn: 'Being Late',
    ar: ['آسف على التأخير', 'لا بأس', 'لن يتكرر'],
    en: ['Sorry for being late', 'No problem', 'It will not happen again'] },
  { titleAr: 'تهنئة', titleEn: 'Congratulations',
    ar: ['مبروك النجاح!', 'شكراً جزيلاً', 'تستحقه'],
    en: ['Congrats on your success!', 'Thank you so much', 'You deserve it'] },
  { titleAr: 'شكر', titleEn: 'Thanks',
    ar: ['شكراً على المساعدة', 'العفو', 'في أي وقت'],
    en: ['Thanks for the help', 'You are welcome', 'Anytime'] },
  { titleAr: 'وداع', titleEn: 'Farewell',
    ar: ['يجب أن أذهب', 'مع السلامة', 'إلى اللقاء'],
    en: ['I must go', 'Goodbye', 'See you'] },
  { titleAr: 'الطقس', titleEn: 'The Weather',
    ar: ['كيف الطقس اليوم؟', 'مشمس وجميل', 'لنخرج'],
    en: ['How is the weather today?', 'Sunny and nice', 'Let us go out'] },
  { titleAr: 'في الحديقة', titleEn: 'At the Park',
    ar: ['ما أجمل الحديقة!', 'الزهور رائعة', 'لنجلس قليلاً'],
    en: ['What a beautiful park!', 'The flowers are wonderful', 'Let us sit a bit'] },
];
const conversationsLessons: Lesson[] = CONVERSATIONS.map((c, i) => ({
  id: `conversations-${i + 1}`,
  category: 'conversations',
  difficulty: Math.min(5, 1 + Math.floor(i / 4)) as 1 | 2 | 3 | 4 | 5,
  titleAr: c.titleAr,
  titleEn: c.titleEn,
  bodyAr: c.ar.join(' — '),
  bodyEn: c.en.join(' — '),
  itemsAr: c.ar,
  itemsEn: c.en,
  points: 6,
}));

export const ALL_LESSONS: Lesson[] = [
  ...lettersLessons,        // 40
  ...wordsLessons,          // 50
  ...grammarLessons,        // 30
  ...listeningLessons,      // 30
  ...storiesLessons,        // 25
  ...textsLessons,          // 25
  ...phrasesLessons,        // 25
  ...conversationsLessons,  // 20
];                          // = 245

if (ALL_LESSONS.length < 200 && typeof console !== 'undefined') {
  console.warn(`[education] expected 200+ lessons, got ${ALL_LESSONS.length}`);
}

export const CATEGORY_META: Record<LessonCategory, { ar: string; en: string; emoji: string; color: string }> = {
  letters:       { ar: 'الحروف',     en: 'Letters',       emoji: '🔡', color: 'from-rose-400 to-pink-500' },
  words:         { ar: 'الكلمات',    en: 'Words',         emoji: '📝', color: 'from-amber-400 to-orange-500' },
  grammar:       { ar: 'القواعد',    en: 'Grammar',       emoji: '📚', color: 'from-emerald-400 to-teal-600' },
  listening:     { ar: 'الاستماع',   en: 'Listening',     emoji: '🎧', color: 'from-sky-400 to-blue-600' },
  stories:       { ar: 'القصص',      en: 'Stories',       emoji: '📖', color: 'from-violet-400 to-purple-600' },
  texts:         { ar: 'النصوص',     en: 'Texts',         emoji: '📜', color: 'from-fuchsia-400 to-rose-600' },
  phrases:       { ar: 'العبارات',   en: 'Phrases',       emoji: '💬', color: 'from-cyan-400 to-blue-500' },
  conversations: { ar: 'المحادثات',  en: 'Conversations', emoji: '🗣️', color: 'from-indigo-400 to-violet-600' },
};

export const lessonsByCategory = (cat: LessonCategory) =>
  ALL_LESSONS.filter(l => l.category === cat).sort((a, b) => a.difficulty - b.difficulty);
