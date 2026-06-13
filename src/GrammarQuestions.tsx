import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

type Question = { id: string; level: 'easy'|'medium'|'hard'; q: string; options: string[]; answer: number };

// Arabic questions (40)
const arabicQuestions: Question[] = [
  { id:'ar1', level:'easy', q:'ما إعراب كلمة "محمدٌ" في جملة: محمدٌ مجتهدٌ؟', options:['مبتدأ مرفوع','خبر مرفوع','فاعل مرفوع','مفعول به منصوب'], answer:0 },
  { id:'ar2', level:'easy', q:'أيُّ الكلمات التالية جمع مذكر سالم؟', options:['مسلمون','رجال','كتب','أقلام'], answer:0 },
  { id:'ar3', level:'easy', q:'ما علامة نصب الاسم المفرد؟', options:['الفتحة','الكسرة','الضمة','الواو'], answer:0 },
  { id:'ar4', level:'easy', q:'في جملة "أكلَ الولدُ التفاحةَ"، ما إعراب "التفاحةَ"؟', options:['مفعول به منصوب','فاعل مرفوع','مبتدأ مرفوع','خبر منصوب'], answer:0 },
  { id:'ar5', level:'easy', q:'ما الفعل الماضي من "يكتب"؟', options:['كتَبَ','كاتَبَ','اكتَبَ','مكتوب'], answer:0 },
  { id:'ar6', level:'easy', q:'أيُّ الجمل التالية صحيحة نحوياً؟', options:['جاءَ الطلابُ','جاءَ الطلابَ','جاءَ الطلابِ','جاءتَ الطلابُ'], answer:0 },
  { id:'ar7', level:'easy', q:'ما مثنى كلمة "كتاب"؟', options:['كتابان','كتابون','كتابَين فقط','أكتاب'], answer:0 },
  { id:'ar8', level:'easy', q:'ما علامة رفع جمع المذكر السالم؟', options:['الواو','الألف','الياء','النون'], answer:0 },
  { id:'ar9', level:'easy', q:'"الشمسُ مشرقةٌ" — ما نوع الجملة؟', options:['اسمية','فعلية','شرطية','استفهامية'], answer:0 },
  { id:'ar10', level:'easy', q:'ما الضمير المنفصل للمتكلم المفرد؟', options:['أنا','نحن','أنتَ','هو'], answer:0 },
  { id:'ar11', level:'easy', q:'أيُّ الكلمات التالية اسم معرفة؟', options:['الكتابُ','كتابٌ','قلمٍ','ولدٍ'], answer:0 },
  { id:'ar12', level:'easy', q:'ما جمع كلمة "مدرسة"؟', options:['مدارس','مدرسون','مدرسات فقط','مدرستان'], answer:0 },
  { id:'ar13', level:'easy', q:'في جملة "ذهبَ أحمدُ"، ما إعراب "أحمدُ"؟', options:['فاعل مرفوع','مبتدأ','مفعول به','خبر'], answer:0 },
  { id:'ar14', level:'easy', q:'ما نوع "لا" في جملة "لا تكذب"؟', options:['ناهية جازمة','نافية','نهي','استفهام'], answer:0 },
  { id:'ar15', level:'easy', q:'أيُّ الأسماء التالية ممنوع من الصرف؟', options:['أحمد','محمد العلَم فقط','كتاب','قلم'], answer:0 },
  { id:'ar16', level:'medium', q:'ما المفعول المطلق في: "سافرتُ سفراً بعيداً"؟', options:['سفراً','سافرتُ','بعيداً','كلها'], answer:0 },
  { id:'ar17', level:'medium', q:'في جملة "إنَّ العلمَ نورٌ"، ما إعراب "العلمَ"؟', options:['اسم إنَّ منصوب','خبر إنَّ','فاعل','مبتدأ'], answer:0 },
  { id:'ar18', level:'medium', q:'ما الفرق بين "الحال" و"التمييز"؟', options:['الحال وصف هيئة الفاعل، التمييز يزيل الإبهام عن نسبة','هما نفس الشيء','الحال مرفوع والتمييز منصوب دائماً','لا فرق'], answer:0 },
  { id:'ar19', level:'medium', q:'في "ما زالَ الجوُّ باردًا"، ما نوع "ما زال"؟', options:['فعل ناقص من أخوات كان','حرف نفي','فعل تام','لا شيء مما ذكر'], answer:0 },
  { id:'ar20', level:'medium', q:'ما إعراب الاسم بعد حرف الجر؟', options:['مجرور','منصوب','مرفوع','مجزوم'], answer:0 },
  { id:'ar21', level:'medium', q:'أيُّ الأفعال التالية فعل مضارع منصوب؟', options:['لن يذهبَ','يذهبُ','لم يذهبْ','اذهبْ'], answer:0 },
  { id:'ar22', level:'medium', q:'ما الاسم الموصول لجمع المؤنث؟', options:['اللاتي','الذي','التي','الذين'], answer:0 },
  { id:'ar23', level:'medium', q:'في "كلَّمتُ الطالبَ المجتهدَ"، ما إعراب "المجتهدَ"؟', options:['نعت منصوب','خبر','حال','مفعول به ثانٍ'], answer:0 },
  { id:'ar24', level:'medium', q:'ما المقصود بـ"البدل" في النحو؟', options:['تابع يُكمِّل معنى المتبوع ويُغني عنه','توكيد المعنى','وصف الاسم','عطف الاسم'], answer:0 },
  { id:'ar25', level:'medium', q:'أيُّ الجمل تحتوي على توكيد لفظي؟', options:['جاء جاء محمدٌ','جاء محمدٌ نفسُه','جاء الرجلُ الكريمُ','جاء محمدٌ وأخوه'], answer:0 },
  { id:'ar26', level:'medium', q:'ما علامة جزم الفعل المضارع الصحيح الآخر؟', options:['السكون','الفتحة','حذف حرف العلة','حذف النون'], answer:0 },
  { id:'ar27', level:'medium', q:'في "أعجبني صوتُك"، ما الفاعل؟', options:['صوتُك','أعجبني','الكاف','أنا'], answer:0 },
  { id:'ar28', level:'medium', q:'ما نوع الجملة الواقعة بعد "أنَّ" المفتوحة الهمزة؟', options:['في محل نصب مفعول به','مستقلة','في محل رفع','لا محل لها'], answer:0 },
  { id:'ar29', level:'medium', q:'أيُّ الكلمات مصدر للفعل "انكسر"؟', options:['انكسار','كسر','كسرة','مكسور'], answer:0 },
  { id:'ar30', level:'medium', q:'ما إعراب "يا طالبُ" في النداء؟', options:['منادى مبني على الضم','منادى منصوب','منادى مجرور','مبتدأ'], answer:0 },
  { id:'ar31', level:'hard', q:'ما الفرق بين "أيُّهم" الاستفهامية و"أيُّهم" الموصولة في الإعراب؟', options:['الاستفهامية مبتدأ، الموصولة تعرب حسب موقعها','كلاهما مبتدأ','لا فرق','الموصولة مبتدأ فقط'], answer:0 },
  { id:'ar32', level:'hard', q:'في "لولا المطرُ لجفَّ الزرعُ"، ما إعراب "المطرُ"؟', options:['مبتدأ مرفوع خبره محذوف وجوباً','فاعل','مبتدأ خبره مذكور','اسم مجرور'], answer:0 },
  { id:'ar33', level:'hard', q:'أيُّ الجمل فيها حال جملة فعلية؟', options:['جاء أحمدُ يضحكُ','جاء أحمدُ ضاحكاً','جاء أحمدُ والشمسُ مشرقةٌ','جاء أحمدُ الكريمُ'], answer:0 },
  { id:'ar34', level:'hard', q:'ما الفعل الذي يرفع فاعلاً وينصب مفعولَين أحدهما أصله مبتدأ والآخر خبر؟', options:['ظنَّ وأخواتها','أعطى وأخواتها','كان وأخواتها','إنَّ وأخواتها'], answer:0 },
  { id:'ar35', level:'hard', q:'في "ما أجملَ السماءَ!"، ما نوع هذا الأسلوب؟', options:['تعجب بصيغة ما أفعلَ','تعجب بصيغة أفعِلْ به','نفي','استفهام'], answer:0 },
  { id:'ar36', level:'hard', q:'ما الفرق الإعرابي بين "كم" الخبرية و"كم" الاستفهامية؟', options:['الخبرية مجرور تمييزها، الاستفهامية منصوب تمييزها','لا فرق','كلاهما منصوب التمييز','كلاهما مجرور'], answer:0 },
  { id:'ar37', level:'hard', q:'في جملة اشتملت على "إذا الشرطية"، ما جواب الشرط إعرابياً؟', options:['جملة في محل جزم جواب الشرط','مرفوع','منصوب','مجزوم بالأداة مباشرة'], answer:0 },
  { id:'ar38', level:'hard', q:'ما المانع من صرف كلمة "مساجد"؟', options:['صيغة منتهى الجموع','العلمية والتأنيث','وزن الفعل','الوصفية وزيادة الألف والنون'], answer:0 },
  { id:'ar39', level:'hard', q:'أيُّ الجمل فيها مفعول لأجله؟', options:['جئتُ طلباً للعلم','جئتُ راكضاً','جئتُ وأنا متعجل','جئتُ يوم الجمعة'], answer:0 },
  { id:'ar40', level:'hard', q:'في "أقسمَ باللهِ لَيَجتهِدَنَّ"، اللام في "لَيَجتهِدَنَّ" هي؟', options:['لام الابتداء الواقعة في جواب القسم','لام التعليل','لام الأمر','لام الجحود'], answer:0 },
  { id:'ar41', level:'easy', q:'ما علامة جر الاسم المفرد؟', options:['الكسرة','الفتحة','الضمة','الياء'], answer:0 },
  { id:'ar42', level:'easy', q:'في جملة «شربَ الطفلُ الحليبَ»، ما إعراب «الحليبَ»؟', options:['مفعول به منصوب','فاعل مرفوع','مبتدأ','خبر'], answer:0 },
  { id:'ar43', level:'easy', q:'ما ضمير الغائبة المفردة؟', options:['أنتِ','هي','نحن','هو'], answer:1 },
  { id:'ar44', level:'easy', q:'أيُّ الأفعال مبني للمجهول؟', options:['كَتَبَ','يَكتُبُ','كُتِبَ','اكتُبْ'], answer:2 },
  { id:'ar45', level:'easy', q:'ما جمع التكسير من بين التالية؟', options:['مسلمون','كتب','معلمات','طالبان'], answer:1 },
  { id:'ar46', level:'medium', q:'في «لاَ تَكْسَلْ»، ما إعراب الفعل؟', options:['فعل مضارع مجزوم بلا الناهية','فعل ماضٍ','فعل أمر','فعل مضارع مرفوع'], answer:0 },
  { id:'ar47', level:'medium', q:'ما معنى «إعراب الجملة في محل»؟', options:['الجملة لها موضع من الإعراب لوقوعها موقع المفرد','الجملة مستقلة','الجملة بلا إعراب','الجملة الاعتراضية فقط'], answer:0 },
  { id:'ar48', level:'medium', q:'أيُّ الأسماء يُعرب بالحروف لا بالحركات؟', options:['المثنى وجمع المذكر السالم','الاسم المفرد','الاسم الممنوع من الصرف','المصدر'], answer:0 },
  { id:'ar49', level:'medium', q:'ما الفرق بين «كان» التامة و«كان» الناقصة؟', options:['التامة تكتفي بفاعل، الناقصة تحتاج اسماً وخبراً','لا فرق','التامة منصوبة دائماً','الناقصة لا خبر لها'], answer:0 },
  { id:'ar50', level:'medium', q:'في «خرجتُ والشمسُ طالعةٌ»، ما الجملة الواقعة حالاً؟', options:['الشمس طالعة','خرجت','والشمس','طالعة وحدها'], answer:0 },
  { id:'ar51', level:'hard', q:'ما الفرق الإعرابي بين «لَمَّا» الشرطية و«لَمَّا» الحينية؟', options:['الشرطية جازمة، الحينية ظرف زمان غير جازم','كلاهما جازمة','كلاهما ظرف','لا فرق'], answer:0 },
  { id:'ar52', level:'hard', q:'في أسلوب الاستثناء «قدِمَ الطلابُ إلا أحمدَ»، ما إعراب «أحمدَ»؟', options:['مستثنى منصوب','فاعل مرفوع','مجرور بإلا','بدل'], answer:0 },
  { id:'ar53', level:'hard', q:'ما وظيفة «إنَّما» في الجملة؟', options:['الحصر والتوكيد وهي حرف ناسخ','الاستفهام','الشرط','النفي فقط'], answer:0 },
  { id:'ar54', level:'hard', q:'أيُّ الجمل تحتوي على خبر محذوف وجوباً؟', options:['لولا المطرُ لجفَّ الزرعُ (خبر «لولا»)','محمدٌ قائمٌ','إنَّ الله غفورٌ','كان الجوُّ باردًا'], answer:0 },
  { id:'ar55', level:'hard', q:'ما دلالة «رُبَّ»؟', options:['التقليل أو التكثير حسب السياق','النفي دائماً','التوكيد','الاستفهام'], answer:0 },
];

// English questions (40)
const englishQuestions: Question[] = [
  { id:'en1', level:'easy', q:"Choose the correct sentence:", options:["She don't like coffee","She doesn't like coffee","She not like coffee","She isn't like coffee"], answer:1 },
  { id:'en2', level:'easy', q:'Which is the correct past tense of "go"?', options:['Went','Goed','Gone','Goes'], answer:0 },
  { id:'en3', level:'easy', q:'Choose the correct article: ___ apple a day keeps the doctor away.', options:['An','A','The','—'], answer:0 },
  { id:'en4', level:'easy', q:'Which sentence uses the Present Continuous correctly?', options:['She is reading a book','She reading a book','She reads a book now','She has read a book now'], answer:0 },
  { id:'en5', level:'easy', q:'Choose the plural of "child":', options:['Children','Childs','Childes','Child'], answer:0 },
  { id:'en6', level:'easy', q:'"He ___ to school every day." Choose the correct verb:', options:['goes','go','going','gone'], answer:0 },
  { id:'en7', level:'easy', q:'Which word is an adjective?', options:['Beautiful','Quickly','Run','Happiness'], answer:0 },
  { id:'en8', level:'easy', q:'Choose the comparative form of "good":', options:['Better','Gooder','More good','Best'], answer:0 },
  { id:'en9', level:'easy', q:'Which sentence is in the passive voice?', options:['The cake was eaten by Ali','Ali ate the cake','Ali eats the cake','Ali is eating the cake'], answer:0 },
  { id:'en10', level:'easy', q:'"I have lived here ___ 2010." Choose the correct preposition:', options:['since','for','from','by'], answer:0 },
  { id:'en11', level:'easy', q:'Which is a countable noun?', options:['Book','Water','Rice','Happiness'], answer:0 },
  { id:'en12', level:'easy', q:'Choose the correct question tag: "She is a doctor, ___?"', options:["isn't she","is she","wasn't she","doesn't she"], answer:0 },
  { id:'en13', level:'easy', q:'Which sentence uses "there is" correctly?', options:['There is a cat on the roof','There is cats on the roof','There are a cat on the roof','There is some cats'], answer:0 },
  { id:'en14', level:'easy', q:'"___ he come tomorrow?" — Choose the correct auxiliary:', options:['Will','Does','Is','Was'], answer:0 },
  { id:'en15', level:'easy', q:'Which word is a conjunction?', options:['Although','Quickly','Beautiful','Table'], answer:0 },
  { id:'en16', level:'medium', q:'Choose the correct conditional: "If I ___ you, I would study harder."', options:['were','was','am','be'], answer:0 },
  { id:'en17', level:'medium', q:'Which sentence uses the Present Perfect correctly?', options:['I have seen that film twice','I saw that film twice already','I have saw that film twice','I did see that film twice'], answer:0 },
  { id:'en18', level:'medium', q:'"She suggested ___ early." Choose the correct form:', options:['leaving','to leave','leave','left'], answer:0 },
  { id:'en19', level:'medium', q:'Which is the correct reported speech of: He said "I am tired"?', options:['He said he was tired','He said he is tired','He said I am tired','He told I was tired'], answer:0 },
  { id:'en20', level:'medium', q:'Choose the correct relative pronoun: "The man ___ car was stolen called the police."', options:['whose','who','which','that'], answer:0 },
  { id:'en21', level:'medium', q:'Which sentence uses a gerund as a subject?', options:['Swimming is good exercise','To swim is good exercise','She swims daily','She is swimming'], answer:0 },
  { id:'en22', level:'medium', q:'"By the time she arrived, he ___ left." Choose the correct tense:', options:['had already','has already','already','was already'], answer:0 },
  { id:'en23', level:'medium', q:'Choose the correct form: "I wish I ___ more time."', options:['had','have','will have','had had'], answer:0 },
  { id:'en24', level:'medium', q:'Which sentence has a dangling modifier?', options:['Walking down the street, the trees looked beautiful','She walked down the street looking at trees','The beautiful trees lined the street','She admired the trees while walking'], answer:0 },
  { id:'en25', level:'medium', q:'"Neither the students nor the teacher ___ ready." Choose the correct verb:', options:['was','were','is','are'], answer:0 },
  { id:'en26', level:'medium', q:'Choose the correct preposition: "She is good ___ mathematics."', options:['at','in','on','for'], answer:0 },
  { id:'en27', level:'medium', q:'Which sentence uses the subjunctive mood correctly?', options:['I suggest that he be present','I suggest that he is present','I suggest that he was present','I suggest that he will be present'], answer:0 },
  { id:'en28', level:'medium', q:'"The more you practice, ___ you become." Complete the sentence:', options:['the better','the more better','better','more better'], answer:0 },
  { id:'en29', level:'medium', q:'Choose the correct form: "She ___ for two hours when he called."', options:['had been waiting','was waiting','waited','has waited'], answer:0 },
  { id:'en30', level:'medium', q:'Which is an example of a split infinitive?', options:['To boldly go','To go boldly','Going boldly','Boldly going'], answer:0 },
  { id:'en31', level:'hard', q:'Choose the sentence with correct subject-verb agreement:', options:['Each of the students has submitted their assignment','Each of the students have submitted their assignment','Each of the students are submitting','Each student have submitted'], answer:0 },
  { id:'en32', level:'hard', q:'Which correctly uses the inversion after a negative adverb?', options:['Rarely had I seen such beauty','Rarely I had seen such beauty','Rarely I saw such beauty','Rarely have seen such beauty'], answer:0 },
  { id:'en33', level:'hard', q:'"She ___ rather stay home than go to the party." Choose correctly:', options:['would','will','should','could'], answer:0 },
  { id:'en34', level:'hard', q:'Which sentence contains a misplaced modifier?', options:['I almost drove my kids to school every day','I drove my kids to school almost every day','Every day I drove my kids to school','My kids were driven to school daily'], answer:0 },
  { id:'en35', level:'hard', q:'Choose the correct use of the ellipsis in grammar:', options:['She can play piano and her brother can too (omitting "play piano")','She can play piano… and also guitar','She can play… the piano','She… can play piano'], answer:0 },
  { id:'en36', level:'hard', q:'What is the function of "having finished" in: "Having finished his work, he left"?', options:['Perfect participial phrase showing prior action','Gerund phrase as subject','Present participle showing simultaneous action','Passive infinitive'], answer:0 },
  { id:'en37', level:'hard', q:'"It is imperative that she ___ on time." Choose the correct verb form:', options:['arrive','arrives','arrived','will arrive'], answer:0 },
  { id:'en38', level:'hard', q:'Which sentence uses a cleft structure?', options:['It was John who broke the window','John broke the window','The window was broken by John','John had broken the window'], answer:0 },
  { id:'en39', level:'hard', q:'Choose the sentence with correct parallel structure:', options:['She likes hiking, swimming, and to run','She likes hiking, swimming, and running','She likes to hike, swimming, and run','She likes hike, swim, and running'], answer:0 },
  { id:'en40', level:'hard', q:'"No sooner ___ he arrived than the meeting started." Choose correctly:', options:['had','has','did','was'], answer:0 },
  { id:'en41', level:'easy', q:'Which is the correct superlative of "bad"?', options:['Worse','Baddest','Worst','More bad'], answer:2 },
  { id:'en42', level:'easy', q:'"They ___ playing football now." Choose correctly:', options:['is','am','are','be'], answer:2 },
  { id:'en43', level:'easy', q:'Which sentence is grammatically correct?', options:['He go to school','He goes to school','He going to school','He goed to school'], answer:1 },
  { id:'en44', level:'easy', q:'"I ___ never eaten sushi." Fill in:', options:['have','has','had','am'], answer:0 },
  { id:'en45', level:'easy', q:'Which word is a preposition?', options:['Run','Blue','Under','Quickly'], answer:2 },
  { id:'en46', level:'medium', q:'Choose the correct passive: "Someone stole my bag."', options:['My bag was stolen','My bag is stolen','My bag has stolen','My bag stolen'], answer:0 },
  { id:'en47', level:'medium', q:"I'm used to ___ up early.", options:['wake','woke','waking','woken'], answer:2 },
  { id:'en48', level:'medium', q:'Which sentence has a correct mixed conditional?', options:['If I had studied, I would be a doctor now','If I have studied, I would be a doctor','If I studied, I would have been a doctor now','If I had studied, I would have been a doctor'], answer:0 },
  { id:'en49', level:'medium', q:'Choose the correct form: "He insisted ___ the truth."', options:['on telling','to tell','telling','tell'], answer:0 },
  { id:'en50', level:'medium', q:'"___ do you call this in English?" Correct question word:', options:['How','What','Which','Who'], answer:1 },
  { id:'en51', level:'hard', q:'Which sentence uses the Past Perfect Continuous correctly?', options:['She had been studying for hours when he called','She was studying for hours when he called','She has been studying for hours when he called','She studied for hours when he called'], answer:0 },
  { id:'en52', level:'hard', q:'What is the function of "as" in: "As she entered, the crowd fell silent"?', options:['Temporal conjunction (simultaneous action)','Reason conjunction','Comparison','Result'], answer:0 },
  { id:'en53', level:'hard', q:'Correct sentence with fronting for emphasis:', options:['Never before had I felt so proud','Never before I had felt so proud','Never before I felt so proud','Never before have felt so proud'], answer:0 },
  { id:'en54', level:'hard', q:'"She barely ___ when the alarm went off."', options:['had fallen asleep','fell asleep','has fallen asleep','was falling asleep'], answer:0 },
  { id:'en55', level:'hard', q:'Word class of "however" in: "He was tired; however, he continued"?', options:['Conjunction','Conjunctive adverb','Preposition','Pronoun'], answer:1 },
];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GrammarQuestions = ({ onScore = () => {} }: { onScore?: (n:number)=>void }) => {
  const { lang } = useLang();
  const [language, setLanguage] = useState<'ar'|'en'>(lang === 'ar' ? 'ar' : 'en');
  const arByLevel = useMemo(() => ({
    easy: shuffle(arabicQuestions.filter(q=>q.level==='easy')),
    medium: shuffle(arabicQuestions.filter(q=>q.level==='medium')),
    hard: shuffle(arabicQuestions.filter(q=>q.level==='hard')),
  }), []);
  const enByLevel = useMemo(() => ({
    easy: shuffle(englishQuestions.filter(q=>q.level==='easy')),
    medium: shuffle(englishQuestions.filter(q=>q.level==='medium')),
    hard: shuffle(englishQuestions.filter(q=>q.level==='hard')),
  }), []);

  const [level, setLevel] = useState<'easy'|'medium'|'hard'>('easy');
  const [index, setIndex] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // No-repeat queue: shuffled copy of the current pool, exhausted before reshuffling
  const [queue, setQueue] = useState<Question[]>(() => {
    const pool = (lang === 'ar' ? arabicQuestions : englishQuestions).filter(q => q.level === 'easy');
    return shuffle([...pool]);
  });

  const total = queue.length;

  useEffect(() => {
    // Reset and reshuffle whenever language or level changes
    const pool = language === 'ar' ? arByLevel[level] : enByLevel[level];
    setQueue(shuffle([...pool]));
    setIndex(0);
    setSessionScore(0);
    setUsedIds(new Set());
    setAnswered(false);
    setSelectedIndex(null);
  }, [language, level]);

  const current = queue[index] ?? null;

  const choose = (i:number) => {
    if (!current || answered) return;
    setSelectedIndex(i);
    setAnswered(true);
    const correct = current.answer;
    if (i === correct) {
      toast.success(language === 'ar' ? '✅ إجابة صحيحة' : '✅ Correct');
      setSessionScore(s => s + 1);
      onScore(1);
    } else {
      const correctText = current.options[correct];
      toast.error(language === 'ar' ? `❌ خطأ — الإجابة: ${correctText}` : `❌ Wrong — Ans: ${correctText}`);
    }
    setUsedIds(prev => new Set(prev).add(current.id));
  };

  const next = () => {
    setAnswered(false);
    setSelectedIndex(null);
    if (index + 1 < queue.length) {
      setIndex(i => i + 1);
    } else {
      // All questions shown — reshuffle and restart this level
      const pool = language === 'ar' ? arByLevel[level] : enByLevel[level];
      setQueue(shuffle([...pool]));
      setIndex(0);
      setSessionScore(0);
      setUsedIds(new Set());
      toast.info(language === 'ar' ? '🔁 تمت جميع الأسئلة — إعادة التشغيل' : '🔁 All done — reshuffling');
    }
  };

  const levelDone = index + 1 >= total;

  const badgeColor = (l:'easy'|'medium'|'hard') => l === 'easy' ? 'bg-green-500' : l === 'medium' ? 'bg-orange-500' : 'bg-red-600';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{language==='ar'?'أسئلة القواعد':'Grammar Questions'}</p>
          <p className="text-xs text-muted-foreground">{index+1}/{total}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLanguage('ar')} className={`px-3 py-1 rounded-xl ${language==='ar' ? 'gradient-primary text-primary-foreground' : 'bg-secondary'}`}>العربية</button>
          <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-xl ${language==='en' ? 'gradient-primary text-primary-foreground' : 'bg-secondary'}`}>English</button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setLevel('easy')} className={`px-3 py-1 rounded-md ${level==='easy' ? 'ring-2 ring-green-300' : 'bg-secondary'}`}>Easy</button>
        <button onClick={() => setLevel('medium')} className={`px-3 py-1 rounded-md ${level==='medium' ? 'ring-2 ring-orange-300' : 'bg-secondary'}`}>Medium</button>
        <button onClick={() => setLevel('hard')} className={`px-3 py-1 rounded-md ${level==='hard' ? 'ring-2 ring-red-300' : 'bg-secondary'}`}>Hard</button>
        <div className="ml-auto text-xs text-muted-foreground">Score: {sessionScore}</div>
      </div>

      {current ? (
        <>
          <div className="rounded-2xl p-4 bg-primary/5 text-center">
            <div className={`inline-block px-2 py-1 text-white text-[11px] font-bold rounded ${badgeColor(current.level)}`}>{current.level.toUpperCase()}</div>
            <p className="mt-3 text-lg font-bold">{current.q}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {current.options.map((opt, i) => {
              let cls = 'py-2 px-3 rounded-xl text-start ';
              if (answered) {
                if (i === current.answer) cls += 'bg-green-500 text-white';
                else if (i === selectedIndex) cls += 'bg-red-500 text-white';
                else cls += 'bg-secondary';
              } else {
                cls += 'bg-secondary hover:bg-secondary/80';
              }
              return (
                <button key={i} onClick={() => choose(i)} disabled={answered} className={cls}>
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button onClick={() => next()} disabled={levelDone} className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground">{language==='ar'?'التالي':'Next'}</button>
          </div>
        </>
      ) : (
        <div className="text-center p-4">{language==='ar'?'لا توجد أسئلة':'No questions'}</div>
      )}

      {levelDone && (
        <div className="p-3 rounded-xl bg-primary/10 text-center">
          <p className="font-bold">{language==='ar'?'انتهت هذه المرحلة':'Level complete'}</p>
          <p className="text-sm text-muted-foreground">{language==='ar'?`درجتك: ${sessionScore}/${total}`:`Your score: ${sessionScore}/${total}`}</p>
          {level !== 'hard' && <button onClick={() => { setLevel(level === 'easy' ? 'medium' : 'hard'); setIndex(0); setSessionScore(0); }} className="mt-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground">{language==='ar'?'الانتقال للمرحلة التالية':'Try next level'}</button>}
        </div>
      )}
    </div>
  );
};

export default GrammarQuestions;