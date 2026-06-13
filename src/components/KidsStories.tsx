import { useState } from 'react';
import { BookOpenText, ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import StoryQuiz, { QuizQuestion } from './StoryQuiz';
import AdminUploadInline from './AdminUploadInline';
import UploadedLibrary from './UploadedLibrary';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { speak, stopSpeaking } from '@/lib/tts';

interface Story {
  id: string;
  titleAr: string;
  titleEn: string;
  emoji: string;
  category: 'prophets' | 'morals' | 'adventure' | 'fantasy';
  contentAr: string[];
  contentEn: string[];
  quiz: QuizQuestion[];
}

const STORY_REFLECTION_PROMPT_AR = 'ماذا استفدت من هذه القصه';
const STORY_REFLECTION_PROMPT_EN = 'What did you benefit from this story?';

const stories: Story[] = [
  { id: 'elephant', titleAr: 'الفيل أبرهة', titleEn: 'The Elephant of Abraha', emoji: '🐘', category: 'prophets',
    contentAr: ['في زمن بعيد، أراد ملك اسمه أبرهة أن يهدم الكعبة المشرفة. جمع جيشاً كبيراً وأحضر معه فيلاً ضخماً.', 'عندما وصلوا قرب مكة، أخذ أبرهة إبل أهل مكة. فذهب عبد المطلب جد النبي ﷺ إليه وطلب إبله.', 'قال أبرهة: "جئتَ تطلب الإبل ولا تدافع عن الكعبة؟" فقال عبد المطلب: "أنا رب الإبل، وللبيت رب يحميه."', 'وعندما تقدم الجيش نحو الكعبة، أرسل الله طيراً أبابيل ترميهم بحجارة من سجيل. فأهلكهم الله جميعاً. 🕊️', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Long ago, a king named Abraha wanted to destroy the Holy Kaaba. He gathered a large army and brought a mighty elephant.', 'When they reached near Mecca, Abraha seized the camels of the people. Abdul Muttalib went to him and asked for his camels.', 'Abraha said: "You ask for camels but do not ask about the house?"', 'When the army advanced towards the Kaaba, Allah sent flocks of birds throwing stones of shale at them, destroying them all. 🕊️', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'من أراد هدم الكعبة؟', questionEn: 'Who wanted to destroy the Kaaba?', optionsAr: ['أبرهة','عبد المطلب','قريش'], optionsEn: ['Abraha','Abdul Muttalib','Quraysh'], correctIndex: 0 },
      { questionAr: 'ماذا أرسل الله لتدمير جيش أبرهة؟', questionEn: 'What did Allah send to destroy Abraha\'s army?', optionsAr: ['فيضان','طيور أبابيل','زلزال'], optionsEn: ['A flood','Flocks of birds','An earthquake'], correctIndex: 1 },
      { questionAr: 'ماذا طلب عبد المطلب من أبرهة؟', questionEn: 'What did Abdul Muttalib ask Abraha for?', optionsAr: ['السلام','إبله','الذهب'], optionsEn: ['Peace','His camels','Gold'], correctIndex: 1 },
    ] },
  { id: 'nooh', titleAr: 'سفينة نوح', titleEn: 'Noah\'s Ark', emoji: '🚢', category: 'prophets',
    contentAr: ['أرسل الله نبيه نوحاً ليدعو قومه إلى عبادة الله وحده. دعاهم ليلاً ونهاراً لمدة 950 سنة!', 'لكن قومه رفضوا واستكبروا. كانوا يضعون أصابعهم في آذانهم.', 'أمر الله نوحاً أن يبني سفينة كبيرة. وكان قومه يسخرون منه.', 'ثم جاء الطوفان العظيم. نجا نوح ومن آمن معه في السفينة. ⛵', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Allah sent Prophet Noah to call his people to worship Allah alone. He called them for 950 years!', 'But his people refused and were arrogant. They put their fingers in their ears.', 'Allah commanded Noah to build a great ark. His people mocked him.', 'Then the great flood came. Noah and the believers were saved in the ark. ⛵', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'كم سنة دعا نوح قومه؟', questionEn: 'How many years did Noah call his people?', optionsAr: ['100','950','500'], optionsEn: ['100','950','500'], correctIndex: 1 },
      { questionAr: 'ماذا بنى نوح؟', questionEn: 'What did Noah build?', optionsAr: ['قصراً','سفينة','مسجداً'], optionsEn: ['A palace','An ark','A mosque'], correctIndex: 1 },
    ] },
  { id: 'yusuf', titleAr: 'يوسف الصديق', titleEn: 'Joseph the Truthful', emoji: '⭐', category: 'prophets',
    contentAr: ['كان يوسف ابن يعقوب. رأى في المنام أحد عشر كوكباً والشمس والقمر يسجدون له.', 'حسده إخوته وألقوه في بئر عميق.', 'وجده مسافرون وباعوه في مصر. دخل السجن ظلماً لكنه صبر.', 'فسّر حلم الملك فأصبح عزيز مصر! وعاد إخوته إليه فسامحهم. ✨', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Joseph was the son of Jacob. He dreamed that eleven stars, the sun, and the moon were prostrating to him.', 'His brothers were jealous and threw him into a deep well.', 'Travelers found him and sold him in Egypt. He was imprisoned unjustly but remained patient.', 'He interpreted the king\'s dream and became the powerful minister of Egypt! His brothers returned and he forgave them. ✨', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'من والد يوسف؟', questionEn: 'Who was Joseph\'s father?', optionsAr: ['إبراهيم','يعقوب','نوح'], optionsEn: ['Abraham','Jacob','Noah'], correctIndex: 1 },
      { questionAr: 'أين ألقاه إخوته؟', questionEn: 'Where did his brothers throw him?', optionsAr: ['في النهر','في البئر','في البحر'], optionsEn: ['In a river','In a well','In the sea'], correctIndex: 1 },
    ] },
  { id: 'musa', titleAr: 'موسى والبحر', titleEn: 'Moses and the Sea', emoji: '🌊', category: 'prophets',
    contentAr: ['أرسل الله موسى لفرعون ليطلق بني إسرائيل.', 'أرسل الله تسع آيات عظيمة لكن فرعون لم يؤمن.', 'هرب موسى وقومه ليلاً فتبعهم فرعون بجيشه.', 'ضرب موسى البحر بعصاه فانفلق! ونجا موسى وأهلك الله فرعون. 🌊', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Allah sent Moses to Pharaoh to free the Children of Israel.', 'Allah sent nine great signs but Pharaoh refused to believe.', 'Moses fled with his people at night, Pharaoh chased with his army.', 'Moses struck the sea with his staff — it split! Moses was saved and Pharaoh was destroyed. 🌊', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا استخدم موسى لشق البحر؟', questionEn: 'What did Moses use to split the sea?', optionsAr: ['سيفاً','عصاه','يده'], optionsEn: ['A sword','His staff','His hand'], correctIndex: 1 },
    ] },
  { id: 'ibrahim', titleAr: 'إبراهيم والنار', titleEn: 'Abraham and the Fire', emoji: '🔥', category: 'prophets',
    contentAr: ['كان إبراهيم فتى ذكياً يعبد الله وحده. حطم أصنام قومه.', 'غضب قومه وقرروا حرقه في نار عظيمة.', 'ألقوه في النار لكن الله أمرها: "كوني برداً وسلاماً على إبراهيم".', 'خرج سالماً! وأثبت أن الله وحده هو الحامي. ☀️', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Abraham was a wise youth who worshipped Allah alone. He smashed his people\'s idols.', 'His people were angry and decided to burn him in a great fire.', 'They threw him into the fire, but Allah commanded it: "Be cool and peaceful for Abraham."', 'He came out completely safe! proving that Allah alone is the Protector. ☀️', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا فعل إبراهيم بالأصنام؟', questionEn: 'What did Abraham do to the idols?', optionsAr: ['عبدها','حطمها','باعها'], optionsEn: ['Worshipped them','Smashed them','Sold them'], correctIndex: 1 },
    ] },
  { id: 'ant', titleAr: 'نملة سليمان', titleEn: 'Solomon\'s Ant', emoji: '🐜', category: 'morals',
    contentAr: ['كان سليمان نبياً وملكاً عظيماً. أعطاه الله القدرة على فهم لغة الحيوانات.', 'ذات يوم كان يمشي مع جيشه بوادي النمل.', 'سمع نملة صغيرة تنادي: "يا أيها النمل ادخلوا مساكنكم!"', 'تبسم سليمان وشكر الله. علمتنا النملة حماية من نحب! 🌿', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Solomon was a great prophet and king. Allah gave him the ability to understand animal language.', 'One day, he was walking with his army through the Valley of Ants.', 'He heard a tiny ant calling: "O ants, enter your homes!"', 'Solomon smiled and thanked Allah. The ant taught us to protect those we love! 🌿', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ما القدرة التي أعطاها الله لسليمان؟', questionEn: 'What ability did Allah give Solomon?', optionsAr: ['الطيران','فهم لغة الحيوانات','القوة الخارقة'], optionsEn: ['Flying','Understanding animals','Super strength'], correctIndex: 1 },
    ] },
  { id: 'lion', titleAr: 'الأسد والفأر', titleEn: 'The Lion and the Mouse', emoji: '🦁', category: 'morals',
    contentAr: ['كان أسد نائماً في الغابة. جاء فأر صغير يلعب على ظهره.', 'استيقظ الأسد وأمسك بالفأر. قال الفأر: "أرجوك أطلقني وسأساعدك يوماً!"', 'ضحك الأسد لكنه أطلقه.', 'بعد أيام وقع الأسد في شبكة صياد. جاء الفأر وقطع الشبكة! لا تحتقر أحداً. 🐭', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['A big lion was sleeping in the forest. A small mouse played on his back.', 'The lion caught the mouse. The mouse said: "Please let me go, I will help you one day!"', 'The lion laughed but let him go.', 'Days later, the lion fell into a hunter\'s net. The mouse came and chewed through the net! Never underestimate anyone. 🐭', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'كيف أنقذ الفأر الأسد？', questionEn: 'How did the mouse save the lion?', optionsAr: ['قطع الشبكة بأسنانه','نادى الحيوانات','فتح القفل'], optionsEn: ['Chewed through the net','Called other animals','Opened the lock'], correctIndex: 0 },
    ] },
  { id: 'tortoise', titleAr: 'السلحفاة والأرنب', titleEn: 'The Tortoise and the Hare', emoji: '🐢', category: 'morals',
    contentAr: ['تحدى الأرنب السريع السلحفاة في سباق.', 'ركض الأرنب بسرعة ثم نام تحت شجرة.', 'السلحفاة استمرت تمشي ولم تتوقف.', 'وصلت السلحفاة أولاً! المثابرة تغلب السرعة. 🏆', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['The fast hare challenged the slow tortoise to a race.', 'The hare ran fast then napped under a tree.', 'The tortoise kept walking and never stopped.', 'The tortoise arrived first! Persistence beats speed. 🏆', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'لماذا خسر الأرنب؟', questionEn: 'Why did the hare lose?', optionsAr: ['نام','تاه','أكل'], optionsEn: ['He slept','He got lost','He ate'], correctIndex: 0 },
    ] },
  { id: 'honesty', titleAr: 'الصدق ينجي', titleEn: 'Honesty Saves', emoji: '💎', category: 'morals',
    contentAr: ['وجد أحمد محفظة مليئة بالمال على الطريق.', 'فكّر: "لو أخذتها لاشتريت ما أريد!" لكنه تذكر أن الصدق أفضل.', 'بحث عن صاحبها ووجده.', 'كافأه الرجل وقال: "الأمانة كنز." الصدق دائماً ينجي! ✨', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Ahmed found a wallet full of money on the road.', 'He thought about keeping it, but remembered honesty is better.', 'He searched for the owner and found him.', 'The man rewarded him: "Honesty is a treasure." Honesty always pays! ✨', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا وجد أحمد؟', questionEn: 'What did Ahmed find?', optionsAr: ['كتاباً','محفظة','هاتفاً'], optionsEn: ['A book','A wallet','A phone'], correctIndex: 1 },
    ] },
  { id: 'starfish', titleAr: 'نجم البحر', titleEn: 'The Starfish', emoji: '⭐', category: 'morals',
    contentAr: ['رجل يمشي على الشاطئ رأى آلاف نجوم البحر ملقاة على الرمال.', 'رأى طفلاً يلتقطها ويرميها في الماء واحدة تلو الأخرى.', 'قال الرجل: "لن تستطيع إنقاذها كلها!"', 'رمى الطفل نجمة وقال: "لكنني أنقذت هذه!" كل عمل خير يصنع فرقاً. 🌟', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['A man walking on the beach saw thousands of starfish stranded on the sand.', 'He saw a child throwing them back in the water, one by one.', 'The man said: "You cannot save them all!"', 'The child threw another starfish and said: "But I saved this one!" Every good deed makes a difference. 🌟', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ما الدرس من القصة؟', questionEn: 'What is the moral?', optionsAr: ['كل عمل خير مهم','النجوم جميلة','البحر خطير'], optionsEn: ['Every good deed matters','Stars are beautiful','The sea is dangerous'], correctIndex: 0 },
    ] },
  { id: 'dragon', titleAr: 'التنين الصديق', titleEn: 'The Friendly Dragon', emoji: '🐉', category: 'fantasy',
    contentAr: ['في أرض بعيدة، عاش تنين اسمه نور. كان ينفث زهوراً بدلاً من النار!', 'خاف منه أهل القرية لكنه كان طيباً.', 'أنقذ نور القرية من فيضان بأجنحته القوية.', 'أصبح بطل القرية! لا تحكم على الآخرين من مظهرهم. 🌺', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['In a faraway land lived a dragon named Noor. He breathed flowers instead of fire!', 'The villagers were scared, but he was kind.', 'Noor saved the village from a flood with his strong wings.', 'Noor became the hero! Do not judge others by their appearance. 🌺', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا كان ينفث التنين نور؟', questionEn: 'What did Noor breathe?', optionsAr: ['ناراً','زهوراً','ماءً'], optionsEn: ['Fire','Flowers','Water'], correctIndex: 1 },
    ] },
  { id: 'flyingcarpet', titleAr: 'البساط السحري', titleEn: 'The Magic Carpet', emoji: '🧞', category: 'fantasy',
    contentAr: ['وجدت ليلى بساطاً قديماً في سوق العتيق. عندما جلست عليه، طار!', 'حلّقت فوق المدن والجبال والمحيطات.', 'زارت أطفالاً في كل مكان وشاركتهم الفرح.', 'أجمل الرحلات هي التي نشارك فيها السعادة. ✈️', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Layla found an old carpet in the antique market. When she sat on it, it flew!', 'She soared over cities, mountains, and oceans.', 'She visited children everywhere and shared joy.', 'The best journeys are those where we share happiness. ✈️', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'أين وجدت ليلى البساط؟', questionEn: 'Where did Layla find the carpet?', optionsAr: ['في بيتها','في سوق العتيق','في الغابة'], optionsEn: ['At home','In the antique market','In the forest'], correctIndex: 1 },
    ] },
  { id: 'moonrabbit', titleAr: 'أرنب القمر', titleEn: 'The Moon Rabbit', emoji: '🐰', category: 'fantasy',
    contentAr: ['في ليلة مقمرة، رأت سارة أرنباً فضياً يقفز من القمر!', 'قال الأرنب: "أنا حارس الأحلام. أبحث عن طفل شجاع."', 'ذهبت سارة معه وأنقذت النجوم المفقودة.', 'كل ليلة ترى الأرنب يبتسم لها من القمر. 🌙', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['On a moonlit night, Sara saw a silver rabbit jumping from the moon!', 'The rabbit said: "I am the Dream Guardian. I seek a brave child."', 'Sara went with him and rescued the lost stars.', 'Every night she sees the rabbit smiling from the moon. 🌙', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'من هو الأرنب الفضي؟', questionEn: 'Who is the silver rabbit?', optionsAr: ['حارس الأحلام','ملك القمر','صياد النجوم'], optionsEn: ['Dream Guardian','Moon King','Star Hunter'], correctIndex: 0 },
    ] },
  { id: 'treeofwisdom', titleAr: 'شجرة الحكمة', titleEn: 'The Wisdom Tree', emoji: '🌳', category: 'fantasy',
    contentAr: ['في الغابة المسحورة كانت شجرة تتحدث! كل ورقة تحمل حكمة.', 'ذهب الأطفال ليسمعوا نصائحها.', 'قالت: "أعظم سحر هو الكلمة الطيبة."', 'نشر الأطفال الكلمات الطيبة في كل مكان. 🍃', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['In the enchanted forest stood a talking tree! Each leaf held wisdom.', 'Children came to hear its advice.', 'It said: "The greatest magic is a kind word."', 'The children spread kind words everywhere. 🍃', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ما أعظم سحر حسب الشجرة؟', questionEn: 'What is the greatest magic?', optionsAr: ['المال','الكلمة الطيبة','القوة'], optionsEn: ['Money','A kind word','Power'], correctIndex: 1 },
    ] },
  { id: 'submarine', titleAr: 'الغواصة الصغيرة', titleEn: 'The Little Submarine', emoji: '🤿', category: 'adventure',
    contentAr: ['بنى عمر غواصة صغيرة من أدوات قديمة.', 'غاص في أعماق البحر واكتشف مدينة مرجانية.', 'صادق الأسماك والدلافين.', 'عاد بكنز حقيقي: حب البحر وحمايته. 🐬', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Omar built a small submarine from old tools.', 'He dove deep and discovered an amazing coral city.', 'He befriended fish and dolphins.', 'He returned with a real treasure: love for the sea and its protection. 🐬', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا اكتشف عمر؟', questionEn: 'What did Omar discover?', optionsAr: ['ذهباً','مدينة مرجانية','جزيرة'], optionsEn: ['Gold','A coral city','An island'], correctIndex: 1 },
    ] },
  { id: 'kindrobot', titleAr: 'الروبوت الطيب', titleEn: 'The Kind Robot', emoji: '🤖', category: 'adventure',
    contentAr: ['صنعت نورة روبوتاً اسمه "صديق" من قطع إلكترونية.', 'صديق يساعد كل من يحتاج.', 'أنقذ قطة عالقة في يوم عاصف.', 'أفضل اختراع هو ما يساعد الناس. 💡', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Noura built a robot named "Sadiq" from electronic parts.', 'Sadiq helped everyone in need.', 'He rescued a stuck cat on a stormy day.', 'The best invention is the one that helps people. 💡', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ما اسم الروبوت؟', questionEn: 'What was the robot\'s name?', optionsAr: ['بطل','صديق','نور'], optionsEn: ['Hero','Sadiq','Noor'], correctIndex: 1 },
    ] },
  { id: 'explorer', titleAr: 'المستكشف الصغير', titleEn: 'The Little Explorer', emoji: '🧭', category: 'adventure',
    contentAr: ['سامي وجد خريطة قديمة في علية جده.', 'تبع الخريطة عبر الغابة والنهر.', 'وجد كهفاً مخفياً فيه صندوق قديم.', 'الكنز كان كتاباً مليئاً بحكم الأجداد! المعرفة أعظم كنز. 📖', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Sami found an old map in his grandfather\'s attic.', 'He followed the map through the forest and the river.', 'He found a hidden cave with an old box inside.', 'The treasure was a book full of ancestors\' wisdom! Knowledge is the greatest treasure. 📖', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا كان الكنز？', questionEn: 'What was the treasure?', optionsAr: ['ذهب','كتاب حكمة','خريطة أخرى'], optionsEn: ['Gold','A book of wisdom','Another map'], correctIndex: 1 },
    ] },
  { id: 'cloudkingdom', titleAr: 'مملكة الغيوم', titleEn: 'Cloud Kingdom', emoji: '☁️', category: 'fantasy',
    contentAr: ['في يوم مشمس، صعدت مريم سلماً من قوس قزح إلى السماء!', 'وجدت مملكة من الغيوم فيها قصور وحدائق عائمة.', 'كل غيمة تحمل حلماً مختلفاً. التقت بحارس الأحلام.', 'عادت مريم تؤمن أن كل حلم ممكن التحقيق إذا آمنت به. 🌈', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['On a sunny day, Mariam climbed a rainbow ladder to the sky!', 'She found a kingdom of clouds with floating castles and gardens.', 'Each cloud held a different dream. She met the Dream Keeper.', 'She returned believing every dream is possible if you believe in it. 🌈', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'كيف صعدت مريم؟', questionEn: 'How did Mariam go up?', optionsAr: ['طائرة','سلم قوس قزح','بالون'], optionsEn: ['Airplane','Rainbow ladder','Balloon'], correctIndex: 1 },
    ] },
  { id: 'timeclock', titleAr: 'ساعة الزمن', titleEn: 'The Time Clock', emoji: '⏰', category: 'fantasy',
    contentAr: ['وجد خالد ساعة قديمة غريبة في صندوق جده.', 'عندما أدارها، عاد بالزمن إلى الماضي!', 'رأى جده طفلاً يلعب في الحقول.', 'تعلّم خالد أن الوقت ثمين وأن كل لحظة لا تتكرر. ⏳', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Khaled found a strange old clock in his grandfather\'s box.', 'When he turned it, he went back in time!', 'He saw his grandfather as a child playing in the fields.', 'Khaled learned that time is precious and every moment is unique. ⏳', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا حدث عندما أدار خالد الساعة؟', questionEn: 'What happened when Khaled turned the clock?', optionsAr: ['توقف الزمن','عاد للماضي','طار في السماء'], optionsEn: ['Time stopped','He went to the past','He flew'], correctIndex: 1 },
    ] },
  { id: 'paintingworld', titleAr: 'عالم الألوان', titleEn: 'The Painting World', emoji: '🎨', category: 'fantasy',
    contentAr: ['رسمت هند لوحة جميلة لعالم خيالي.', 'فجأة بدأت الألوان تتحرك ودخلت هند في اللوحة!', 'في عالم الألوان, كل لون يمنحك قوة مختلفة.', 'عادت هند وعرفت أن الإبداع هو أقوى سلاح. 🖌️', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Hind painted a beautiful picture of an imaginary world.', 'Suddenly the colors moved and she entered the painting!', 'In the color world, each color gives a different power.', 'She returned knowing creativity is the strongest weapon. 🖌️', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ما الدرس من القصة؟', questionEn: 'What is the lesson?', optionsAr: ['الإبداع قوة','الألوان خطرة','الرسم صعب'], optionsEn: ['Creativity is power','Colors are dangerous','Painting is hard'], correctIndex: 0 },
    ] },
  { id: 'gardenspirit', titleAr: 'روح الحديقة', titleEn: 'The Garden Spirit', emoji: '🌻', category: 'adventure',
    contentAr: ['كانت لمى تعتني بحديقة جدتها كل يوم بحب.', 'ذات ليلة، ظهرت لها جنية صغيرة تشكرها على رعاية الزهور.', 'أعطتها الجنية بذرة سحرية تنبت أي نبتة تتمناها.', 'زرعت لمى شجرة فاكهة ووزعت ثمارها على جيرانها. العطاء أجمل ما في الحياة. 🌺', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Lama cared for her grandmother\'s garden every day with love.', 'One night, a tiny fairy appeared to thank her for taking care of the flowers.', 'The fairy gave her a magic seed that grows any plant she wishes.', 'Lama planted a fruit tree and distributed its fruits to her neighbors. Giving is the most beautiful thing in life. 🌺', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا أعطت الجنية للمى؟', questionEn: 'What did the fairy give Lama?', optionsAr: ['ذهباً','بذرة سحرية','كتاباً'], optionsEn: ['Gold','A magic seed','A book'], correctIndex: 1 },
    ] },
  { id: 'whale', titleAr: 'يونس والحوت', titleEn: 'Jonah and the Whale', emoji: '🐋', category: 'prophets',
    contentAr: ['أرسل الله يونس ليدعو قومه، لكنه غادر غاضباً وركب سفينة.', 'هبت عاصفة قوية، فألقي يونس في البحر وابتلعه حوت ضخم.', 'في بطن الحوت، نادى يونس: "لا إله إلا أنت سبحانك إني كنت من الظالمين".', 'سمع الله دعاءه وأخرجه الحوت سالماً إلى الشاطئ. 🌊', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Allah sent Jonah to call his people, but he left in anger and boarded a ship.', 'A great storm hit, Jonah was cast into the sea and swallowed by a huge whale.', 'Inside the whale, Jonah called: "There is no god but You, Glory be to You, I was of the wrongdoers."', 'Allah heard his prayer and the whale safely brought him to the shore. 🌊', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا ابتلع يونس؟', questionEn: 'What swallowed Jonah?', optionsAr: ['قرش','حوت','سفينة'], optionsEn: ['A shark','A whale','A ship'], correctIndex: 1 },
    ] },
  { id: 'fox', titleAr: 'الغراب والثعلب', titleEn: 'The Crow and the Fox', emoji: '🦊', category: 'morals',
    contentAr: ['وقف غراب فوق شجرة ومعه قطعة جبن. جاء ثعلب مكار وأراد الجبن.', 'قال الثعلب: "يا لك من طائر جميل! صوتك بالتأكيد رائع."', 'فتح الغراب فمه ليغني، فسقطت الجبن وأخذها الثعلب.', 'لا تصدق كل من يمدحك من أجل مصلحته! 🧀', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['A crow stood on a tree with a piece of cheese. A cunning fox came and wanted the cheese.', 'The fox said: "What a beautiful bird! Your voice must be wonderful."', 'The crow opened his mouth to sing, the cheese fell and the fox took it.', 'Do not believe everyone who praises you for their own benefit! 🧀', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا أراد الثعلب من الغراب؟', questionEn: 'What did the fox want from the crow?', optionsAr: ['الجبن','الغناء','الصداقة'], optionsEn: ['Cheese','Singing','Friendship'], correctIndex: 0 },
    ] },
  { id: 'genie', titleAr: 'المصباح السحري', titleEn: 'The Magic Lamp', emoji: '🏮', category: 'adventure',
    contentAr: ['وجد علاء الدين مصباحاً قديماً مغطى بالتراب. مسحه فخرج منه جني!', 'قال الجني: "شبيك لبيك، اطلب ما تشاء!"', 'طلب علاء الدين أن يساعد الفقراء في مدينته.', 'العطاء هو أعظم أمنية يمكن تحقيقها. ✨', 'هذه القصة تقول لنا أن نكون طيبين ونساعد الآخرين.', 'كل نهاية تحمل درساً مهماً.'],
    contentEn: ['Aladdin found an old dusty lamp. He rubbed it and a genie came out!', 'The genie said: "Your wish is my command!"', 'Aladdin asked to help the poor in his city.', 'Giving is the greatest wish that can be fulfilled. ✨', 'This story reminds us to be kind and help others.', 'Every ending holds an important lesson.'],
    quiz: [
      { questionAr: 'ماذا خرج من المصباح؟', questionEn: 'What came out of the lamp?', optionsAr: ['دخان','جني','ذهب'], optionsEn: ['Smoke','A genie','Gold'], correctIndex: 1 },
    ] },
];

const categories = [
  { key: 'all', labelAr: 'الكل', labelEn: 'All', emoji: '📚' },
  { key: 'prophets', labelAr: 'الأنبياء', labelEn: 'Prophets', emoji: '🕌' },
  { key: 'morals', labelAr: 'أخلاقية', labelEn: 'Moral', emoji: '💡' },
  { key: 'adventure', labelAr: 'مغامرات', labelEn: 'Adventure', emoji: '🧭' },
  { key: 'fantasy', labelAr: 'خيالية', labelEn: 'Fantasy', emoji: '🐉' },
];

interface KidsStoriesProps {
  points: number;
  addPoints: (n: number) => void;
}

const KidsStories = ({ addPoints }: KidsStoriesProps) => {
  const { t, lang, dir } = useLang();
  const { isAdmin } = useIsAdmin();
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showQuiz, setShowQuiz] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('app-stories-read') || '[]'); } catch { return []; }
  });
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const filtered = activeCategory === 'all' ? stories : stories.filter(s => s.category === activeCategory);

  const finishStory = () => {
    if (activeStory && !readIds.includes(activeStory.id)) {
      const next = [...readIds, activeStory.id];
      setReadIds(next);
      localStorage.setItem('app-stories-read', JSON.stringify(next));
      addPoints(2);
    }
    setShowQuiz(true);
  };

  const handleQuizComplete = (score: number) => {
    addPoints(score);
  };

  if (activeStory) {
    if (showQuiz && activeStory.quiz.length > 0) {
      return (
        <div className="pb-4">
          <button onClick={() => { setActiveStory(null); setShowQuiz(false); }} className="flex items-center gap-2 text-primary mb-4">
            <BackArrow size={18} /><span className="text-sm font-medium">{t('back')}</span>
          </button>
          <div className="text-center mb-4">
            <span className="text-4xl">{activeStory.emoji}</span>
            <h3 className="text-lg font-bold text-foreground mt-2">{lang === 'ar' ? 'اختبار القصة' : 'Story Quiz'}</h3>
          </div>
          <StoryQuiz questions={activeStory.quiz} onComplete={handleQuizComplete} />
        </div>
      );
    }

    const content = lang === 'ar' ? activeStory.contentAr : activeStory.contentEn;
    const isLastPage = currentPage === content.length - 1;
    const isReflectionPage = currentPage === content.length - 2;
    const isPraisePage = currentPage === content.length - 1;
    const praiseMessage = lang === 'ar'
      ? 'أحسنتم صنعاً يا أبطال! لقد أبدعتم'
      : 'Wonderful job. Your reflection is thoughtful, and now you can start the questions.';
    return (
      <div className="pb-4">
        <button onClick={() => { setActiveStory(null); setShowQuiz(false); }} className="flex items-center gap-2 text-primary mb-4">
          <BackArrow size={18} /><span className="text-sm font-medium">{t('back')}</span>
        </button>
        <div className="text-center mb-4">
          <span className="text-5xl">{activeStory.emoji}</span>
          <h3 className="text-lg font-bold text-foreground mt-2">{lang === 'ar' ? activeStory.titleAr : activeStory.titleEn}</h3>
        </div>
        <div className="glass-card rounded-2xl p-6 min-h-[200px] mb-3 relative">
          <button
            type="button"
            onClick={() => { stopSpeaking(); speak(isReflectionPage ? (lang === 'ar' ? STORY_REFLECTION_PROMPT_AR : STORY_REFLECTION_PROMPT_EN) : content[currentPage]); }}
            className="absolute top-3 end-3 flex items-center gap-1 text-xs font-semibold text-primary px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all active:scale-95"
            aria-label={lang === 'ar' ? 'استمع' : 'Listen'}
          >
            <Volume2 size={14} />
            {lang === 'ar' ? 'استماع' : 'Listen'}
          </button>
          {isReflectionPage ? (
            <div className="space-y-4 pt-6 animate-slide-up">
              <p className="text-base leading-relaxed text-foreground font-semibold" key={currentPage}>
                {lang === 'ar' ? STORY_REFLECTION_PROMPT_AR : STORY_REFLECTION_PROMPT_EN}
              </p>
              <textarea
                value={reflectionText}
                onChange={(event) => {
                  setReflectionText(event.target.value);
                  setReflectionSaved(false);
                }}
                placeholder={lang === 'ar' ? 'اكتبي ما تعلمته من القصة...' : 'Write what you learned from the story...'}
                className="w-full min-h-[120px] rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => {
                  if (!reflectionText.trim()) return;
                  setReflectionSaved(true);
                }}
                className="px-5 py-2 rounded-xl gradient-primary text-primary-foreground font-medium shadow-lg"
              >
                {lang === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          ) : isPraisePage ? (
            <div className="space-y-4 pt-6 text-center animate-slide-up">
              <p className="text-lg font-bold text-success">{praiseMessage}</p>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'استمري في القراءة والتفكير الجميل.' : 'Keep reading and reflecting beautifully.'}
              </p>
            </div>
          ) : (
            <p className="text-base leading-relaxed text-foreground animate-slide-up pt-6" key={currentPage}>{content[currentPage]}</p>
          )}
        </div>
        <div className="flex justify-center gap-2 mb-4">
          {content.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentPage ? 'gradient-primary w-6' : 'bg-border'}`} />
          ))}
        </div>
        <div className="flex gap-3">
          {currentPage > 0 && (
            <button onClick={() => setCurrentPage(p => p - 1)} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium">{t('back')}</button>
          )}
          {isLastPage ? (
            <button onClick={finishStory} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-medium shadow-lg">
              {activeStory.quiz.length > 0 ? (lang === 'ar' ? 'ابدأ الاختبار 📝' : 'Start Quiz 📝') : `${t('finishStory')} +2 ⭐`}
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={isReflectionPage && !reflectionSaved}
              className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              {t('next')} →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <BookOpenText size={22} className="text-primary" />
        <h2 className="text-xl font-bold text-foreground">{t('stories')}</h2>
        <span className="text-xs text-muted-foreground ml-auto">{stories.length} {lang === 'ar' ? 'قصة' : 'stories'}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.key ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
            {cat.emoji} {lang === 'ar' ? cat.labelAr : cat.labelEn}
          </button>
        ))}
      </div>
      {isAdmin && (
        <AdminUploadInline
          category="story"
          accept=".pdf,application/pdf,image/*"
          labelAr="قصة جديدة"
          labelEn="New story"
        />
      )}
      <UploadedLibrary category="story" />

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(story => (
          <button key={story.id} onClick={() => { setActiveStory(story); setCurrentPage(0); setShowQuiz(false); setReflectionText(''); setReflectionSaved(false); }}
            className="glass-card rounded-2xl p-4 text-start hover:bg-primary/5 transition-all active:scale-[0.97] relative">
            <span className="text-4xl block mb-2">{story.emoji}</span>
            <p className="font-semibold text-foreground text-sm leading-tight">{lang === 'ar' ? story.titleAr : story.titleEn}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {categories.find(c => c.key === story.category)?.[lang === 'ar' ? 'labelAr' : 'labelEn']}
            </p>
            {readIds.includes(story.id) && <span className="absolute top-2 right-2 text-success text-xs">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KidsStories;
