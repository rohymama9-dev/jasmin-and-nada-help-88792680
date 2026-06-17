import { useState } from 'react';
import { BookOpen, ArrowLeft, ArrowRight, Clock, Star, Lightbulb, X, Volume2, Sparkles } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import AdminUploadInline from './AdminUploadInline';
import UploadedLibrary from './UploadedLibrary';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { speak, stopSpeaking, isSpeaking } from '@/lib/tts';

interface Book {
  id: string;
  titleAr: string;
  titleEn: string;
  authorAr: string;
  authorEn: string;
  readTimeMin: number;
  rating: number;
  pagesAr?: { title: string; content: string; keyPoint: string }[];
  pagesEn?: { title: string; content: string; keyPoint: string }[];
  takeawayAr: string;
  takeawayEn: string;
  color: string;
  summaryAr?: string[];
  summaryEn?: string[];
  keyPointsAr?: string[];
  keyPointsEn?: string[];
}

const books: Book[] = [
  {
    id: '1', titleAr: 'لا تحزن', titleEn: "Don't Be Sad", authorAr: 'عائض القرني', authorEn: 'Aaidh al-Qarni',
    readTimeMin: 8, rating: 4.8, color: 'from-rose-400 to-pink-500',
    pagesAr: [
      {
        title: 'مقدمة في فن السعادة',
        content: 'كتاب "لا تحزن" يقدم وصفات عملية للسعادة مستمدة من القرآن الكريم والسنة النبوية. يبدأ الكتاب بتأكيد أن الحزن لا يغيّر الواقع ولا يعيد ما فات. الحزن يستنزف الطاقة ويضعف الإرادة ويمنع الإنسان من التقدم.',
        keyPoint: 'الحزن لا يغير الماضي بل يدمر الحاضر'
      },
      {
        title: 'الرضا والقضاء والقدر',
        content: 'يدعونا الكتاب إلى الرضا بقضاء الله والتفاؤل بالمستقبل. الرضا هو المفتاح الحقيقي للسكينة. عندما تؤمن أن كل ما يحدث هو لخير، تتلاشى الهموم وتبدأ في رؤية الفرص المتاحة أمامك.',
        keyPoint: 'الرضا هو جنة الدنيا ومستراح العابدين'
      },
      {
        title: 'كيف تواجه النقد والقلق',
        content: 'يتناول الكتاب كيف تتعامل مع النقد وكيف تتغلب على القلق. لا تجعل كلام الآخرين يهز ثقتك بنفسك. تعلم كيف تستفيد من النقد البناء وتتجاهل النقد الهدام الذي لا يهدف إلا لإحباطك.',
        keyPoint: 'ثقتك بنفسك تبدأ من داخلك وليس من أفواه الآخرين'
      }
    ],
    pagesEn: [
      {
        title: 'Introduction to Happiness',
        content: '"Don\'t Be Sad" offers practical prescriptions for happiness drawn from the Quran and Prophetic tradition. The book begins by affirming that sadness does not change reality or bring back what is lost. Sadness drains energy and weakens the will.',
        keyPoint: 'Sadness doesn\'t change the past, it destroys the present'
      },
      {
        title: 'Contentment and Destiny',
        content: 'The book calls us to accept God\'s decree and be optimistic about the future. Contentment is the true key to peace. When you believe that everything happens for a reason, worries vanish and opportunities appear.',
        keyPoint: 'Contentment is the paradise of this world'
      },
      {
        title: 'Facing Criticism and Anxiety',
        content: 'The book covers handling criticism and overcoming anxiety. Don\'t let others\' words shake your self-confidence. Learn to benefit from constructive criticism and ignore destructive comments.',
        keyPoint: 'Self-confidence starts from within, not from others'
      }
    ],
    takeawayAr: 'السعادة الحقيقية ليست في غياب المشاكل، بل في كيفية تعاملنا معها بالرضا والتوكل على الله.',
    takeawayEn: 'True happiness isn\'t the absence of problems, but how we handle them with contentment and trust in God.',
  },
  {
    id: '2', titleAr: 'الأب الغني والأب الفقير', titleEn: 'Rich Dad Poor Dad', authorAr: 'روبرت كيوساكي', authorEn: 'Robert Kiyosaki',
    readTimeMin: 10, rating: 4.5, color: 'from-sky-400 to-blue-500',
    pagesAr: [
      {
        title: 'الفرق بين الأصول والخصوم',
        content: 'يشرح الكتاب المفهوم الأهم في الثقافة المالية: الأصول تضع المال في جيبك (مثل العقارات المؤجرة والأسهم) بينما الخصوم تسحب المال منه (مثل القروض والسيارات بالتقسيط).',
        keyPoint: 'اشترِ الأصول وقلل الخصوم لتبني ثروتك'
      },
      {
        title: 'العقلية المالية والتعليم',
        content: 'الفرق بين الأب الغني والفقير كان في العقلية. الأب الفقير يقول "لا أستطيع تحمّل ذلك" بينما الأب الغني يسأل "كيف يمكنني تحمّل ذلك؟" هذا السؤال يحفز العقل للبحث عن حلول.',
        keyPoint: 'السؤال يفتح العقل، والعبارة تغلقه'
      },
      {
        title: 'اجعل المال يعمل من أجلك',
        content: 'معظم الناس يعملون من أجل المال، بينما الأغنياء يجعلون المال يعمل من أجلهم عبر بناء أنظمة وأصول تدر دخلاً سلبياً حتى وهم نائمون.',
        keyPoint: 'الهدف هو الحرية المالية وليس مجرد زيادة الراتب'
      }
    ],
    pagesEn: [
      {
        title: 'Assets vs Liabilities',
        content: 'The book explains the most important concept in financial literacy: assets put money in your pocket (rental properties, stocks) while liabilities take money out (loans, car payments).',
        keyPoint: 'Buy assets and minimize liabilities to build wealth'
      },
      {
        title: 'Financial Mindset and Education',
        content: 'The difference was mindset. Poor Dad says "I can\'t afford it" while Rich Dad asks "How can I afford it?" This question triggers the brain to search for solutions.',
        keyPoint: 'The question opens the mind, the statement closes it'
      },
      {
        title: 'Make Money Work for You',
        content: 'Most people work for money, while the rich make money work for them by building systems and assets that generate passive income.',
        keyPoint: 'The goal is financial freedom, not just a higher salary'
      }
    ],
    takeawayAr: 'لا تعمل من أجل المال — اجعل المال يعمل من أجلك عبر بناء أصول تدر دخلاً.',
    takeawayEn: 'Don\'t work for money — make money work for you by building income-generating assets.',
  },
  {
    id: '3', titleAr: 'العادات الذرية', titleEn: 'Atomic Habits', authorAr: 'جيمس كلير', authorEn: 'James Clear',
    readTimeMin: 9, rating: 4.9, color: 'from-emerald-400 to-green-500',
    pagesAr: [
      {
        title: 'قوة الـ 1%',
        content: 'يكشف جيمس كلير كيف أن تغييرات صغيرة بنسبة 1% يومياً تؤدي إلى نتائج مذهلة على المدى الطويل. إذا تحسنت 1% كل يوم لمدة سنة، ستكون أفضل بـ 37 ضعفاً. العادات هي الفائدة المركبة للتطوير الذاتي.',
        keyPoint: 'التحسن 1% يومياً = 37 ضعفاً في سنة واحدة'
      },
      {
        title: 'بناء الأنظمة لا الأهداف',
        content: 'أهم درس في الكتاب: لا تركز على الأهداف بل على الأنظمة. الهدف هو النتيجة التي تريدها، والنظام هو العملية التي تؤدي إليها. الفائزون والخاسرون لديهم نفس الأهداف — الفرق في الأنظمة التي يتبعونها.',
        keyPoint: 'لا ترتفع إلى مستوى أهدافك، بل تنخفض إلى مستوى أنظمتك'
      },
      {
        title: 'قوانين تغيير السلوك',
        content: 'النظام المكون من أربع خطوات لبناء عادات جيدة: 1) اجعلها واضحة 2) اجعلها جذابة 3) اجعلها سهلة 4) اجعلها مُرضية. ولتحطيم العادات السيئة، اعكس هذه القوانين الأربعة لتجعلها غير مرئية، غير جذابة، صعبة، وغير مرضية.',
        keyPoint: 'صمم بيئتك لتجعل العادات الجيدة أسهل والسيئة أصعب'
      }
    ],
    pagesEn: [
      {
        title: 'The Power of 1%',
        content: 'James Clear reveals how tiny 1% daily changes lead to remarkable results over time. If you improve 1% every day for a year, you\'ll be 37 times better. Habits are the compound interest of self-improvement.',
        keyPoint: '1% better daily = 37x improvement in a year'
      },
      {
        title: 'Systems Over Goals',
        content: 'The most important lesson: focus on systems, not goals. A goal is the result you want; a system is the process that leads to it. Winners and losers have the same goals — the difference is their systems.',
        keyPoint: 'You do not rise to the level of your goals, you fall to the level of your systems'
      },
      {
        title: 'Laws of Behavior Change',
        content: 'The 4-step system for building good habits: 1) Make it obvious 2) Make it attractive 3) Make it easy 4) Make it satisfying. To break bad habits: reverse these steps to make them invisible, unattractive, difficult, and unsatisfying.',
        keyPoint: 'Design your environment to make good habits easier and bad ones harder'
      }
    ],
    takeawayAr: 'لا تركز على الأهداف بل على النظام — الهوية تقود السلوك والعادات الصغيرة تصنع فرقاً هائلاً.',
    takeawayEn: 'Focus on systems, not goals — identity drives behavior and tiny habits make an enormous difference.',
  },
  {
    id: '4', titleAr: 'فن اللامبالاة', titleEn: 'The Subtle Art of Not Giving a F*ck', authorAr: 'مارك مانسون', authorEn: 'Mark Manson',
    readTimeMin: 7, rating: 4.3, color: 'from-amber-400 to-orange-500',
    pagesAr: [
      {
        title: 'اختيار ما يهم',
        content: 'يتحدى مارك مانسون ثقافة الإيجابية المزيفة. يرى أن الحياة الجيدة ليست في تجنب المشاكل بل في اختيار المشاكل التي تستحق المعاناة من أجلها. اللامبالاة لا تعني عدم الاهتمام، بل تعني الاهتمام بما هو أهم فقط.',
        keyPoint: 'اختر معاركك بعناية — لا يمكنك الاهتمام بكل شيء'
      },
      {
        title: 'المعاناة ضرورية',
        content: 'كل شيء يستحق الإنجاز يتطلب شكلاً من أشكال المعاناة. السؤال ليس "ماذا تريد أن تستمتع به؟" بل "ما المعاناة التي أنت مستعد لتحملها؟" القيمة تكمن في النضال من أجل ما نؤمن به.',
        keyPoint: 'المعاناة جزء طبيعي وضروري من الحياة'
      },
      {
        title: 'المسؤولية الكاملة',
        content: 'الكتاب يدعو إلى تحمل المسؤولية الكاملة عن حياتك. ليس بالضرورة أن كل شيء خطأك، لكن كل شيء مسؤوليتك. عندما تتحمل المسؤولية، تكتسب القوة لتغيير واقعك بدلاً من لعب دور الضحية.',
        keyPoint: 'تحمّل المسؤولية الكاملة عن استجابتك للظروف'
      }
    ],
    pagesEn: [
      {
        title: 'Choosing What Matters',
        content: 'Mark Manson challenges fake positivity culture. He argues that a good life is not about avoiding problems but choosing problems worth struggling for. Not giving a f*ck doesn\'t mean being indifferent; it means caring about what truly matters.',
        keyPoint: 'Choose your battles — you can\'t care about everything'
      },
      {
        title: 'Necessary Suffering',
        content: 'Everything worth achieving requires some form of suffering. The question is not "What do you want to enjoy?" but "What pain are you willing to sustain?" Value lies in the struggle for what we believe in.',
        keyPoint: 'Suffering is a natural and necessary part of life'
      },
      {
        title: 'Full Responsibility',
        content: 'The book calls for taking full responsibility for your life. Not everything is your fault, but everything is your responsibility. By taking responsibility, you gain the power to change your reality instead of playing the victim.',
        keyPoint: 'Take full responsibility for your response to circumstances'
      }
    ],
    takeawayAr: 'ركز طاقتك على ما يهمك فعلاً وتوقف عن محاولة إرضاء الجميع.',
    takeawayEn: 'Focus your energy on what truly matters and stop trying to please everyone.',
  },
  {
    id: '5', titleAr: 'قوة العادة', titleEn: 'The Power of Habit', authorAr: 'تشارلز دويج', authorEn: 'Charles Duhigg',
    readTimeMin: 8, rating: 4.4, color: 'from-violet-400 to-purple-500',
    pagesAr: [
      {
        title: 'حلقة العادة',
        content: 'يكشف تشارلز دويج كيف تعمل العادات من خلال حلقة من ثلاث خطوات: الإشارة (المحفز)، الروتين (السلوك)، والمكافأة (النتيجة). فهم هذه الحلقة هو مفتاح تغيير أي عادة في حياتك.',
        keyPoint: 'حلقة العادة: إشارة → روتين → مكافأة'
      },
      {
        title: 'العادات المحورية',
        content: 'العادات المحورية (Keystone Habits) هي عادات بسيطة يمكن أن تغير حياتك بالكامل. مثلاً، البدء بممارسة الرياضة بانتظام يؤدي تلقائياً لتحسين الغذاء والنوم والإنتاجية، لأنها تغير نظرتك لنفسك.',
        keyPoint: 'العادات المحورية تغير كل شيء في حياتك'
      },
      {
        title: 'الإرادة كعضلة',
        content: 'الإرادة ليست صفة ثابتة بل هي مثل العضلة — يمكن تقويتها بالتدريب لكنها تتعب مع كثرة الاستخدام. لذلك صمم حياتك بحيث تقلل الحاجة لاستخدام الإرادة في القرارات البسيطة.',
        keyPoint: 'الإرادة عضلة تحتاج تدريباً وراحة'
      }
    ],
    pagesEn: [
      {
        title: 'The Habit Loop',
        content: 'Charles Duhigg reveals how habits work through a three-step loop: Cue (the trigger), Routine (the behavior), and Reward (the benefit). Understanding this loop is the key to changing any habit.',
        keyPoint: 'Habit loop: Cue → Routine → Reward'
      },
      {
        title: 'Keystone Habits',
        content: 'Keystone Habits are small changes that transform your entire life. For example, regular exercise automatically leads to better eating, sleeping, and productivity because it changes how you see yourself.',
        keyPoint: 'Keystone habits change everything'
      },
      {
        title: 'Willpower as a Muscle',
        content: 'Willpower is like a muscle — it can be strengthened through training but it gets tired with overuse. Design your life to minimize the need for willpower in simple daily decisions.',
        keyPoint: 'Willpower is a muscle that needs training'
      }
    ],
    takeawayAr: 'لا يمكنك حذف عادة سيئة لكن يمكنك استبدالها — غيّر الروتين واحتفظ بالإشارة والمكافأة.',
    takeawayEn: 'You can\'t delete a bad habit but you can replace it — change the routine while keeping the cue and reward.',
  },
  {
    id: '6', titleAr: 'فكر وازدد ثراءً', titleEn: 'Think and Grow Rich', authorAr: 'نابليون هيل', authorEn: 'Napoleon Hill',
    readTimeMin: 9, rating: 4.6, color: 'from-teal-400 to-cyan-500',
    pagesAr: [
      {
        title: 'قوة الرغبة المشتعلة',
        content: 'درس نابليون هيل أن النجاح يبدأ برغبة مشتعلة وواضحة. الخطوة الأولى هي تحديد هدف محدد وموعد نهائي لتحقيقه. الرغبة ليست مجرد أمل، بل هي إيمان عميق يدفعك للعمل الدؤوب.',
        keyPoint: 'الرغبة المشتعلة تتفوق على كل العقبات'
      },
      {
        title: 'الإيحاء الذاتي والعقل الباطن',
        content: 'يؤكد الكتاب على قوة الإيحاء الذاتي. ما تكرره لنفسك وتؤمن به يصبح واقعك. العقل الباطن لا يفرق بين الحقيقة والخيال، لذا اغرسه بالأفكار الإيجابية عن النجاح والثروة.',
        keyPoint: 'العقل الباطن يحقق ما تؤمن به وتكرره'
      },
      {
        title: 'مجموعة العقل المدبر',
        content: 'النجاح العظيم لا يتحقق منفرداً. "العقل المدبر" هو تنسيق المعرفة والجهد بين شخصين أو أكثر يعملون نحو هدف محدد بروح من الانسجام. هذا التعاون يضاعف القوة العقلية.',
        keyPoint: 'أحط نفسك بمجموعة عقل مدبر تدعم رؤيتك'
      }
    ],
    pagesEn: [
      {
        title: 'The Power of Desire',
        content: 'Napoleon Hill taught that success begins with a clear, burning desire. Step one is defining a specific goal and a deadline. Desire isn\'t just hope; it\'s a deep belief that drives persistent action.',
        keyPoint: 'Burning desire overcomes all obstacles'
      },
      {
        title: 'Autosuggestion',
        content: 'The book emphasizes the power of autosuggestion. What you repeat to yourself and believe becomes your reality. The subconscious mind doesn\'t distinguish between truth and fiction, so plant thoughts of success.',
        keyPoint: 'The subconscious achieves what you believe and repeat'
      },
      {
        title: 'The Mastermind Group',
        content: 'Great success isn\'t achieved alone. A "Mastermind" is the coordination of knowledge and effort between two or more people working toward a specific goal in harmony. This cooperation multiplies mental power.',
        keyPoint: 'Surround yourself with a mastermind group'
      }
    ],
    takeawayAr: 'ما يمكن للعقل أن يتخيله ويؤمن به، يمكنه أن يحققه.',
    takeawayEn: 'Whatever the mind can conceive and believe, it can achieve.',
  },
  {
    id: '7', titleAr: 'الذكاء العاطفي', titleEn: 'Emotional Intelligence', authorAr: 'دانيال جولمان', authorEn: 'Daniel Goleman',
    readTimeMin: 8, rating: 4.5, color: 'from-indigo-400 to-blue-500',
    summaryAr: ['يكشف جولمان أن الذكاء العاطفي (EQ) أهم من الذكاء العقلي (IQ) في تحديد النجاح في الحياة والعمل.','الذكاء العاطفي يتكون من خمس مهارات: الوعي الذاتي، إدارة المشاعر، التحفيز الذاتي، التعاطف، والمهارات الاجتماعية.','الخبر السار: على عكس IQ، يمكن تطوير الذكاء العاطفي في أي عمر من خلال الممارسة والتدريب.'],
    summaryEn: ['Goleman reveals that Emotional Intelligence (EQ) is more important than IQ in determining success in life and work.','EQ consists of five skills: self-awareness, managing emotions, self-motivation, empathy, and social skills.','The good news: unlike IQ, emotional intelligence can be developed at any age through practice and training.'],
    pagesAr: [
      {
        title: 'الذكاء العاطفي مقابل الذكاء العقلي',
        content: 'يوضح دانيال جولمان أن الذكاء العاطفي هو العامل الحاسم في النجاح الحقيقي. بينما يمنحك الذكاء العقلي الوظيفة، فإن الذكاء العاطفي هو ما يجعلك تترقى وتنجح في قيادة الآخرين. يتضمن ذلك القدرة على فهم مشاعرك الخاصة والتحكم فيها، والقدرة على قراءة مشاعر الآخرين والتفاعل معها بفعالية.',
        keyPoint: 'الذكاء العاطفي هو مفتاح التميز في الحياة والعمل'
      },
      {
        title: 'المهارات الخمس للذكاء العاطفي',
        content: 'يتكون الذكاء العاطفي من خمسة أركان أساسية: الوعي الذاتي (معرفة ما تشعر به)، التنظيم الذاتي (التحكم في الانفعالات)، التحفيز (السعي وراء الأهداف بشغف)، التعاطف (فهم منظور الآخرين)، والمهارات الاجتماعية (بناء الروابط وحل النزاعات).',
        keyPoint: 'الوعي بالذات هو حجر الزاوية لكل نمو عاطفي'
      },
      {
        title: 'التعاطف والقيادة الاجتماعية',
        content: 'القدرة على التعاطف هي جوهر العلاقات الناجحة. القادة العظماء هم من يستطيعون وضع أنفسهم في مكان الآخرين. من خلال تطوير المهارات الاجتماعية، يمكنك بناء فرق عمل متناغمة وإدارة الخلافات بحكمة، مما يؤدي لنتائج أفضل للجميع.',
        keyPoint: 'التعاطف ليس ضعفاً، بل هو أعلى درجات الذكاء الاجتماعي'
      }
    ],
    pagesEn: [
      {
        title: 'EQ vs IQ',
        content: 'Daniel Goleman explains that Emotional Intelligence is the decisive factor in true success. While IQ might get you a job, EQ is what helps you get promoted and succeed in leading others. This involves the ability to understand and control your own emotions, and the ability to read and effectively respond to the emotions of others.',
        keyPoint: 'Emotional Intelligence is the key to excellence in life and work'
      },
      {
        title: 'The Five Skills of EQ',
        content: 'Emotional intelligence consists of five core pillars: Self-awareness (knowing what you feel), Self-regulation (controlling impulses), Motivation (pursuing goals with passion), Empathy (understanding others\' perspectives), and Social Skills (building connections and resolving conflicts).',
        keyPoint: 'Self-awareness is the cornerstone of all emotional growth'
      },
      {
        title: 'Empathy and Social Leadership',
        content: 'The ability to empathize is the heart of successful relationships. Great leaders are those who can put themselves in others\' shoes. By developing social skills, you can build harmonious teams and manage conflicts wisely, leading to better results for everyone.',
        keyPoint: 'Empathy is not weakness; it is the highest form of social intelligence'
      }
    ],
    keyPointsAr: ['EQ أهم من IQ للنجاح', 'الوعي الذاتي هو الأساس', 'التعاطف يبني علاقات قوية', 'يمكن تطوير الذكاء العاطفي في أي عمر'],
    keyPointsEn: ['EQ matters more than IQ for success', 'Self-awareness is the foundation', 'Empathy builds strong relationships', 'EQ can be developed at any age'],
    takeawayAr: 'من يتحكم في مشاعره يتحكم في مصيره — الذكاء العاطفي مهارة يمكن تعلمها.',
    takeawayEn: 'He who controls his emotions controls his destiny — emotional intelligence is a learnable skill.',
  },
  {
    id: '8', titleAr: 'الرجال من المريخ والنساء من الزهرة', titleEn: 'Men Are from Mars, Women Are from Venus', authorAr: 'جون غراي', authorEn: 'John Gray',
    readTimeMin: 7, rating: 4.2, color: 'from-pink-400 to-rose-500',
    summaryAr: ['يشرح جون غراي الاختلافات الأساسية بين الرجال والنساء في التفكير والتواصل والاحتياجات العاطفية.','الرجال يحتاجون "الكهف" — وقت للانسحاب والتفكير بمفردهم. النساء يحتجن "الحديث" — مشاركة المشاعر والتعبير.','فهم هذه الاختلافات لا يعني أن أحدهما أفضل — بل يعني أننا نتحدث لغات مختلفة ونحتاج ترجمة.'],
    summaryEn: ['John Gray explains fundamental differences between men and women in thinking, communication, and emotional needs.','Men need "the cave" — time to withdraw and think alone. Women need "talk" — sharing feelings and expression.','Understanding these differences doesn\'t mean one is better — it means we speak different languages and need translation.'],
    pagesAr: [
      {
        title: 'اختلاف لغات الحب والتواصل',
        content: 'يؤكد جون غراي أن الرجال والنساء يتحدثون لغات مختلفة من الناحية النفسية. عندما تشتكي المرأة، فهي غالباً ما تبحث عن التعاطف والإنصات، بينما يميل الرجل فوراً لتقديم حلول عملية، مما قد يسبب سوء تفاهم. الحل يكمن في إدراك أن كلاً منهما لديه أسلوب فريد في التعبير عن الاهتمام.',
        keyPoint: 'المرأة تريد من يسمعها، والرجل يريد من يثق بقدراته'
      },
      {
        title: 'مفهوم الكهف والمشاركة',
        content: 'عندما يواجه الرجل مشكلة، يميل للانسحاب إلى "كهفه" الخاص للتفكير بمفرده، بينما تفضل المرأة الحديث عن المشكلة لتشعر بالراحة. احترام هذه الاختلافات البيولوجية والنفسية يقلل من حدة التوتر في العلاقات الزوجية والاجتماعية.',
        keyPoint: 'احترم حاجة الرجل للصمت وحاجة المرأة للفضفضة'
      },
      {
        title: 'كيف تطلب الدعم وتحصل عليه',
        content: 'يعلمنا الكتاب كيفية طلب ما نحتاجه بطريقة يفهمها الطرف الآخر. الرجال يحتاجون أن يشعروا بأنهم مطلوبون ومقدرون، بينما تحتاج النساء أن يشعرن بأنهن محبوبات ومحترمات. التفاهم يبدأ من تقدير هذه الاحتياجات الأساسية.',
        keyPoint: 'التقدير هو وقود الرجل، والطمأنينة هي وقود المرأة'
      }
    ],
    pagesEn: [
      {
        title: 'Different Languages of Love',
        content: 'John Gray emphasizes that men and women speak different psychological languages. When a woman complains, she is often seeking empathy and listening, while a man immediately tends to offer practical solutions, which can cause misunderstanding. The solution lies in realizing that each has a unique style of expressing care.',
        keyPoint: 'Women want to be heard; men want to be trusted'
      },
      {
        title: 'The Cave vs. Sharing',
        content: 'When a man faces a problem, he tends to withdraw into his "cave" to think alone, while a woman prefers to talk about the problem to feel better. Respecting these biological and psychological differences reduces tension in marital and social relationships.',
        keyPoint: 'Respect a man\'s need for silence and a woman\'s need to talk'
      },
      {
        title: 'How to Ask for and Get Support',
        content: 'The book teaches us how to ask for what we need in a way the other party understands. Men need to feel needed and appreciated, while women need to feel loved and respected. Understanding starts from appreciating these basic needs.',
        keyPoint: 'Appreciation is a man\'s fuel; reassurance is a woman\'s fuel'
      }
    ],
    keyPointsAr: ['الرجال يحبون حل المشاكل، النساء يحببن التحدث عنها', 'الاختلاف طبيعي ولا يعني وجود خطأ', 'تعلم لغة الطرف الآخر هو مفتاح السعادة الزوجية', 'احترم حاجة الرجل للكهف وحاجة المرأة للفضفضة'],
    keyPointsEn: ['Men like solving problems, women like talking about them', 'Differences are natural and don\'t mean something is wrong', 'Learning the partner\'s language is the key to marital happiness', 'Respect a man\'s need for space and a woman\'s need to talk'],
    takeawayAr: 'التفاهم يبدأ من قبول الاختلافات وتقديرها بدلاً من محاولة تغيير الطرف الآخر.',
    takeawayEn: 'Understanding begins with accepting and appreciating differences instead of trying to change the partner.',
  },
  {
    id: '9', titleAr: 'قوة الآن', titleEn: 'The Power of Now', authorAr: 'إيكهارت تول', authorEn: 'Eckhart Tolle',
    readTimeMin: 8, rating: 4.7, color: 'from-amber-400 to-yellow-500',
    summaryAr: ['يدعو إيكهارت تول إلى التحرر من قبضة الماضي والقلق بشأن المستقبل عبر التركيز الكامل على اللحظة الحالية (الآن).','معظم معاناتنا تأتي من التفكير في أشياء حدثت وانتهت، أو أشياء لم تحدث بعد. "الآن" هو المكان الوحيد الذي توجد فيه الحياة والحقيقة.','يشرح كيف أن "الأنا" (Ego) تعيش على الدراما والقصص، بينما الوعي الحقيقي يوجد في السكون ومراقبة الأفكار دون الحكم عليها.'],
    summaryEn: ['Eckhart Tolle calls for liberation from the grip of the past and anxiety about the future by focusing entirely on the present moment (Now).','Most of our suffering comes from thinking about things that have happened and ended, or things that haven\'t happened yet. "Now" is the only place where life and truth exist.','He explains how the "Ego" thrives on drama and stories, while true awareness exists in stillness and observing thoughts without judgment.'],
    pagesAr: [
      {
        title: 'وهم الزمن والتحرر منه',
        content: 'يشرح تول أن الماضي والمستقبل هما مجرد أفكار في ذهنك، بينما اللحظة الحالية هي الحقيقة الوحيدة المتاحة. الماضي يمنحك الهوية والمستقبل يمنحك الوعد بالخلاص، لكن كلاهما يبعدك عن "الآن" حيث يكمن السلام الحقيقي والقوة الروحية.',
        keyPoint: 'الآن هو كل ما تملكه، والزمن هو مجرد وسيلة ذهنية'
      },
      {
        title: 'مراقبة العقل والتحرر من الأنا',
        content: 'أنت لست أفكارك، بل أنت الوعي الذي يراقب هذه الأفكار. الأنا (Ego) تعيش على التفكير المستمر والدراما. عندما تبدأ في مراقبة أفكارك دون الحكم عليها، تبدأ في التحرر من سيطرة العقل وتكتشف السكون العميق بداخلك.',
        keyPoint: 'كن الشاهد على أفكارك ولا تتماهى معها'
      },
      {
        title: 'التسليم وقوة الحضور',
        content: 'التسليم لا يعني الاستسلام السلبي، بل يعني قبول اللحظة الحالية كما هي دون مقاومة داخلية. عندما تقبل "ما هو كائن"، تنشأ طاقة جديدة تمكنك من العمل بفعالية ووضوح أكبر. الحضور التام هو مفتاح السعادة والتحرر من المعاناة.',
        keyPoint: 'السلام الداخلي يبدأ حيث تنتهي المقاومة'
      }
    ],
    pagesEn: [
      {
        title: 'The Illusion of Time',
        content: 'Tolle explains that the past and future are merely thoughts in your mind, while the present moment is the only reality available. The past gives you identity, and the future promises salvation, but both distance you from the "Now," where true peace and spiritual power reside.',
        keyPoint: 'The Now is all you ever have; time is just a mental tool'
      },
      {
        title: 'Observing the Mind and Ego',
        content: 'You are not your thoughts, but the consciousness observing them. The Ego thrives on constant thinking and drama. When you begin to observe your thoughts without judgment, you start to free yourself from the mind\'s control and discover deep stillness within.',
        keyPoint: 'Be the witness to your thoughts and don\'t identify with them'
      },
      {
        title: 'Surrender and the Power of Presence',
        content: 'Surrender doesn\'t mean passive giving up; it means accepting the present moment as it is without internal resistance. When you accept "what is," a new energy arises that enables you to act with greater effectiveness and clarity. Total presence is the key to happiness.',
        keyPoint: 'Inner peace begins where resistance ends'
      }
    ],
    keyPointsAr: ['اللحظة الحالية هي كل ما تملكه فعلياً', 'أنت لست أفكارك، بل أنت المراقب لها', 'المعاناة هي مقاومة لما هو موجود', 'السلام الداخلي يبدأ من قبول اللحظة كما هي'],
    keyPointsEn: ['The present moment is all you ever truly have', 'You are not your thoughts, you are the observer of them', 'Suffering is resistance to what is', 'Inner peace begins with accepting the moment as it is'],
    takeawayAr: 'تحرر من سجن أفكارك عبر العيش في "الآن" — ففيه تكمن القوة والسلام الحقيقي.',
    takeawayEn: 'Free yourself from the prison of your thoughts by living in the "Now" — therein lies true power and peace.',
  },
  {
    id: '10', titleAr: 'ذكاء مالي', titleEn: 'The Intelligent Investor', authorAr: 'بنجامين جراهام', authorEn: 'Benjamin Graham',
    readTimeMin: 12, rating: 4.8, color: 'from-emerald-600 to-green-700',
    summaryAr: ['يعتبر هذا الكتاب "إنجيل الاستثمار". يعلمك بنجامين جراهام فلسفة "استثمار القيمة" — شراء أصول بأقل من قيمتها الحقيقية.','يفرق بين المستثمر والمضارب. المستثمر يبحث عن الأمان والعائد طويل الأمد، بينما المضارب يراهن على تقلبات السوق القصيرة.','أشهر مفهوم في الكتاب هو "السيد سوق" (Mr. Market) الذي يتقلب مزاجه يومياً؛ المستثمر الذكي يستغل هذا التقلب ولا ينقاد له.'],
    summaryEn: ['This book is considered the "Bible of Investing." Benjamin Graham teaches the philosophy of "Value Investing" — buying assets for less than their intrinsic value.','He distinguishes between the investor and the speculator. The investor seeks safety and long-term return, while the speculator bets on short-term market fluctuations.','The most famous concept is "Mr. Market," who fluctuates in mood daily; the intelligent investor exploits this volatility and isn\'t driven by it.'],
    pagesAr: [
      {
        title: 'الاستثمار مقابل المضاربة',
        content: 'يحدد جراهام الفرق الجوهري بين المستثمر الذكي والمضارب. الاستثمار هو عملية تهدف لضمان رأس المال وتحقيق عائد معقول بناءً على تحليل شامل، بينما المضاربة هي مراهنة على تقلبات الأسعار. الأمان المالي يبدأ من تبني عقلية المستثمر طويل الأمد.',
        keyPoint: 'المستثمر يبحث عن القيمة، والمضارب يلاحق السعر'
      },
      {
        title: 'مفهوم السيد سوق (Mr. Market)',
        content: 'يصور جراهام السوق كشريك متقلب المزاج يعرض عليك شراء أو بيع أسهمك يومياً بأسعار مختلفة. المستثمر الذكي لا ينساق خلف مشاعر "السيد سوق" (سواء كان متفائلاً جداً أو متشائماً جداً)، بل يستغل هذه التقلبات لشراء الأصول عندما تكون رخيصة.',
        keyPoint: 'اجعل السوق خادماً لك وليس سيداً لقراراتك'
      },
      {
        title: 'هامش الأمان (Margin of Safety)',
        content: 'هذا هو المبدأ الأهم في الاستثمار. هامش الأمان يعني شراء السهم بسعر أقل بكثير من قيمته الحقيقية المقدرة. هذا يحميك من الأخطاء البشرية وتقلبات السوق غير المتوقعة، ويضمن لك تحقيق أرباح مجزية على المدى الطويل.',
        keyPoint: 'هامش الأمان هو الدرع الواقي لموالك'
      }
    ],
    pagesEn: [
      {
        title: 'Investment vs Speculation',
        content: 'Graham defines the essential difference between an intelligent investor and a speculator. Investment is a process aimed at ensuring capital safety and achieving a reasonable return based on thorough analysis, while speculation is betting on price fluctuations.',
        keyPoint: 'The investor seeks value; the speculator chases price'
      },
      {
        title: 'The Concept of Mr. Market',
        content: 'Graham portrays the market as a moody partner offering to buy or sell your shares daily at different prices. The intelligent investor doesn\'t follow "Mr. Market\'s" emotions, but exploits these fluctuations to buy assets when they are cheap.',
        keyPoint: 'Make the market your servant, not your master'
      },
      {
        title: 'Margin of Safety',
        content: 'This is the most important principle. Margin of safety means buying a stock at a price much lower than its estimated intrinsic value. This protects you from human errors and unexpected market fluctuations, ensuring long-term profit.',
        keyPoint: 'Margin of safety is the protective shield for your money'
      }
    ],
    keyPointsAr: ['اشترِ عندما يخاف الآخرون وبع عندما يطمعون', 'الاستثمار يتطلب الانضباط العاطفي قبل الذكاء العقلي', 'هامش الأمان هو أهم كلمة في الاستثمار', 'التركيز على القيمة الحقيقية وليس سعر السوق اللحظي'],
    keyPointsEn: ['Buy when others are fearful, sell when they are greedy', 'Investing requires emotional discipline more than intellectual brilliance', 'Margin of safety is the most important concept in investing', 'Focus on intrinsic value, not momentary market price'],
    takeawayAr: 'الاستثمار الناجح هو إدارة للمخاطر وليس بحثاً عن الربح السريع — ابحث عن القيمة وانضبط عاطفياً.',
    takeawayEn: 'Successful investing is about risk management, not chasing quick profit — seek value and remain emotionally disciplined.',
  },
  {
    id: '11', titleAr: 'العادات السبع للناس الأكثر فعالية', titleEn: 'The 7 Habits of Highly Effective People', authorAr: 'ستيفن كوفي', authorEn: 'Stephen Covey',
    readTimeMin: 15, rating: 4.9, color: 'from-blue-600 to-indigo-700',
    pagesAr: [
      {
        title: 'الاستقلالية: كن مبادراً',
        content: 'العادة الأولى هي المبادرة. الأشخاص المفعول بهم يركزون على الظروف الخارجية، بينما الأشخاص الفاعلون يركزون على "دائرة التأثير" الخاصة بهم. أنت لست ضحية للظروف، بل تملك حرية اختيار استجابتك.',
        keyPoint: 'ركز على ما يمكنك التحكم فيه'
      },
      {
        title: 'ابدأ والنهاية في ذهنك',
        content: 'العادة الثانية تدعوك لتحديد رؤية واضحة لحياتك. قبل أن تبدأ أي رحلة، يجب أن تعرف وجهتك. هذا يعني كتابة رسالة شخصية تحدد قيمك وأهدافك طويلة الأمد في كل مجالات حياتك.',
        keyPoint: 'الرؤية الواضحة تقود العمل الصحيح'
      },
      {
        title: 'الاعتماد المتبادل والمنفعة للجميع',
        content: 'تحقيق النجاح مع الآخرين يتطلب عقلية "الربح للجميع" (Win-Win). ابحث دائماً عن حلول تفيد كل الأطراف. ثم العادة الخامسة: اسعَ أولاً لأن تَفهم، ثم لأن تُفهم. التواصل الفعال يبدأ بالاستماع العميق.',
        keyPoint: 'التعاون الخلاق ينتج نتائج أعظم من العمل الفردي'
      }
    ],
    pagesEn: [
      {
        title: 'Independence: Be Proactive',
        content: 'The first habit is proactivity. Reactive people focus on external circumstances, while proactive people focus on their "Circle of Influence." You are not a victim of conditions; you have the freedom to choose your response.',
        keyPoint: 'Focus on what you can control'
      },
      {
        title: 'Begin with the End in Mind',
        content: 'The second habit calls for a clear vision of your life. Before starting any journey, you must know your destination. This means writing a personal mission statement that defines your values and long-term goals.',
        keyPoint: 'A clear vision drives the right action'
      },
      {
        title: 'Interdependence and Win-Win',
        content: 'Achieving success with others requires a "Win-Win" mindset. Always seek solutions that benefit all parties. Then Habit 5: Seek first to understand, then to be understood. Effective communication starts with deep listening.',
        keyPoint: 'Creative cooperation produces results greater than individual effort'
      }
    ],
    takeawayAr: 'النجاح المستدام يبدأ من تغيير الشخصية وتبني عادات مبنية على مبادئ ثابتة.',
    takeawayEn: 'Sustainable success starts with character change and adopting habits based on timeless principles.',
  },
  {
    id: '12', titleAr: 'لا يمكن إيذائي', titleEn: "Can't Hurt Me", authorAr: 'ديفيد غوغنز', authorEn: 'David Goggins',
    readTimeMin: 12, rating: 4.8, color: 'from-slate-700 to-slate-900',
    pagesAr: [
      {
        title: 'إتقان العقل',
        content: 'يروي ديفيد غوغنز رحلته المذهلة من طفل يعاني من السمنة إلى أن أصبح أقوى رجل في العالم. السر يكمن في "إتقان العقل". عندما يخبرك عقلك أنك انتهيت، فأنت قد استهلكت 40% فقط من طاقتك الحقيقية.',
        keyPoint: 'العقل هو أقوى سلاح تملكه'
      },
      {
        title: 'مرآة المساءلة',
        content: 'استخدم غوغنز "مرآة المساءلة" لمواجهة الحقيقة القاسية عن نفسه. الصدق المطلق مع الذات هو الخطوة الأولى للتغيير. لا تخف من نقاط ضعفك، بل استخدمها كوقود للنمو.',
        keyPoint: 'واجه نفسك بالحقيقة لتتغير'
      },
      {
        title: 'ثقافة المعاناة',
        content: 'النمو الحقيقي يحدث في منطقة عدم الراحة. غوغنز يدعو لتبني ثقافة المعاناة الإرادية لتقوية العقل. من خلال فعل الأشياء التي نكرهها يومياً، نبني صلابة ذهنية لا يمكن كسرها.',
        keyPoint: 'الانضباط هو مفتاح الحرية'
      }
    ],
    pagesEn: [
      {
        title: 'Mastering the Mind',
        content: 'David Goggins recounts his journey from an overweight child to the world\'s strongest man. The secret is "Mastering the Mind." When your mind tells you you\'re done, you\'ve only used 40% of your actual capacity.',
        keyPoint: 'The mind is the most powerful weapon you have'
      },
      {
        title: 'The Accountability Mirror',
        content: 'Goggins used the "Accountability Mirror" to face the brutal truth about himself. Absolute honesty with oneself is the first step to change. Don\'t fear your weaknesses; use them as fuel for growth.',
        keyPoint: 'Face the truth to change'
      },
      {
        title: 'Embracing Suffering',
        content: 'True growth happens in the discomfort zone. Goggins calls for embracing voluntary suffering to callous the mind. By doing things we hate every day, we build an unbreakable mental toughness.',
        keyPoint: 'Discipline is the key to freedom'
      }
    ],
    takeawayAr: 'أنت المسؤول الوحيد عن عظمة حياتك — لا تسمح للظروف بكسر إرادتك.',
    takeawayEn: 'You are solely responsible for the greatness of your life — don\'t let circumstances break your will.',
  },
  {
    id: '13', titleAr: 'الخيميائي', titleEn: 'The Alchemist', authorAr: 'باولو كويلو', authorEn: 'Paulo Coelho',
    readTimeMin: 10, rating: 4.7, color: 'from-yellow-500 to-orange-600',
    pagesAr: [
      {
        title: 'الأسطورة الشخصية والإشارات',
        content: 'يحكي الكتاب قصة سانتياغو، الراعي الذي يتبع حلمه بالبحث عن كنز. يعلمنا كويلو أن لكل منا "أسطورة شخصية" أو غاية في الحياة يجب تحقيقها. الكون يرسل لنا إشارات ليوجهنا، وعلينا أن نكون يقظين لقراءتها واتباعها بقلب مفتوح.',
        keyPoint: 'عندما ترغب في شيء، يتآمر الكون لمساعدتك'
      },
      {
        title: 'الخوف من الفشل والعقبات',
        content: 'أكبر عائق أمام تحقيق الأحلام ليس الفشل نفسه، بل الخوف من الفشل. يواجه سانتياغو العديد من التحديات في رحلته، لكنه يتعلم أن كل تجربة، حتى المؤلمة منها، هي درس ضروري لصقل روحه وإعداده للكنز الحقيقي.',
        keyPoint: 'الخوف من المعاناة أسوأ من المعاناة نفسها'
      },
      {
        title: 'الكنز الحقيقي في الداخل',
        content: 'في نهاية الرحلة، يكتشف سانتياغو أن الكنز لم يكن في المكان الذي توقعه، بل كان قريباً جداً منه. الدرس العظيم هو أن السعادة والكنز الحقيقي يكمنان في الرحلة نفسها وفي اكتشاف الذات والارتباط بروح العالم.',
        keyPoint: 'حيثما يكون قلبك، هناك ستجد كنزك'
      }
    ],
    pagesEn: [
      {
        title: 'Personal Legend and Signs',
        content: 'The book tells the story of Santiago, a shepherd who follows his dream of finding treasure. Coelho teaches that each of us has a "Personal Legend" or purpose in life. The universe sends us signs to guide us, and we must be alert to read and follow them.',
        keyPoint: 'When you want something, the universe conspires to help'
      },
      {
        title: 'Fear of Failure and Obstacles',
        content: 'The biggest obstacle to achieving dreams is not failure itself, but the fear of failure. Santiago faces many challenges, but he learns that every experience, even painful ones, is a necessary lesson to refine his soul.',
        keyPoint: 'The fear of suffering is worse than suffering itself'
      },
      {
        title: 'The True Treasure Within',
        content: 'At the end of the journey, Santiago discovers that the treasure was not where he expected, but very close to him. The great lesson is that true treasure lies in the journey itself and in self-discovery.',
        keyPoint: 'Wherever your heart is, there you will find your treasure'
      }
    ],
    takeawayAr: 'استمع لقلبك وتبع حلمك، فالكون يدعم من يجرؤ على مطاردة أسطورته الشخصية.',
    takeawayEn: 'Listen to your heart and follow your dream; the universe supports those who dare to chase their personal legend.',
  },
  {
    id: '14', titleAr: 'السحر الكبير', titleEn: 'Big Magic', authorAr: 'إليزابيث جيلبرت', authorEn: 'Elizabeth Gilbert',
    readTimeMin: 9, rating: 4.6, color: 'from-purple-500 to-pink-600',
    pagesAr: [
      {
        title: 'الإبداع ككائن حي',
        content: 'تقدم جيلبرت رؤية فريدة حيث تعتبر الأفكار كائنات حية طاقية تبحث عن شركاء بشريين لتجسيدها. إذا لم تستجب للفكرة، فستذهب لشخص آخر. الإبداع يتطلب الشجاعة والانفتاح لاستقبال هذه الأفكار والعمل معها بصبر.',
        keyPoint: 'الأفكار تبحث عنك، فكن مستعداً لها'
      },
      {
        title: 'الشجاعة في مواجهة الخوف',
        content: 'الخوف جزء طبيعي من العملية الإبداعية، لكن لا يجب أن يقود الحافلة. تدعو جيلبرت للعيش بجانب الخوف دون السماح له بالسيطرة على قراراتك. الإبداع هو فعل من أفعال الشجاعة يتطلب إظهار عملك للعالم رغم احتمالية النقد.',
        keyPoint: 'الفضول يجب أن يكون أقوى من الخوف'
      },
      {
        title: 'الإبداع من أجل المتعة',
        content: 'لا تأخذ الإبداع بجدية مفرطة تؤدي للإحباط. اصنع الأشياء لأنك تحب فعل ذلك، وليس فقط من أجل النتيجة أو النجاح المادي. "السحر الكبير" يحدث عندما تمارس شغفك ببهجة وحرية، مما يجعل حياتك أكثر غنى ومعنى.',
        keyPoint: 'عش حياة يقودها الفضول بدلاً من الخوف'
      }
    ],
    pagesEn: [
      {
        title: 'Creativity as a Living Being',
        content: 'Gilbert offers a unique view where ideas are energetic living beings seeking human partners to manifest. If you don\'t respond, the idea will go to someone else. Creativity requires courage and openness to receive these ideas.',
        keyPoint: 'Ideas are looking for you; be ready for them'
      },
      {
        title: 'Courage Facing Fear',
        content: 'Fear is a natural part of the creative process, but it shouldn\'t drive the bus. Gilbert calls for living alongside fear without letting it control your decisions. Creativity is an act of courage that requires showing your work.',
        keyPoint: 'Curiosity must be stronger than fear'
      },
      {
        title: 'Creating for Joy',
        content: 'Don\'t take creativity too seriously. Create things because you love doing it, not just for the result. "Big Magic" happens when you practice your passion with joy and freedom, making your life richer.',
        keyPoint: 'Live a life driven by curiosity, not fear'
      }
    ],
    takeawayAr: 'عش حياة يقودها الفضول بدلاً من الخوف، وافتح قلبك للسحر الكبير الكامن في الإبداع.',
    takeawayEn: 'Live a life driven by curiosity rather than fear, and open your heart to the big magic inherent in creativity.',
  },
  {
    id: '15', titleAr: 'الجرأة بعظمة', titleEn: 'Daring Greatly', authorAr: 'برينيه براون', authorEn: 'Brené Brown',
    readTimeMin: 11, rating: 4.7, color: 'from-rose-500 to-red-600',
    pagesAr: [
      {
        title: 'قوة الهشاشة والضعف',
        content: 'تستكشف براون كيف أن إظهار ضعفنا وهشاشتنا (Vulnerability) هو في الواقع قمة الشجاعة. الهشاشة ليست ضعفاً، بل هي مهد الابتكار والإبداع والارتباط الإنساني الحقيقي. عندما نتوقف عن حماية أنفسنا بالدروع، نبدأ في العيش بصدق.',
        keyPoint: 'الهشاشة هي منبع الشجاعة والارتباط'
      },
      {
        title: 'أسطورة المثالية والخجل',
        content: 'الخوف من النقد والسعي للمثالية هما دروع تعزلنا عن الآخرين. توضح براون أن الخجل ينمو في السر والصمت والحكم، والحل هو الحديث عنه بصدق. المثالية هي محاولة لإرضاء الآخرين، بينما الجرأة هي قبول عيوبنا والظهور كما نحن.',
        keyPoint: 'الكمال هو عدو الجرأة والصدق'
      },
      {
        title: 'النزول إلى الحلبة',
        content: 'الجرأة بعظمة تعني أن تكون "في الحلبة"، حيث تتعرض للفشل والنقد، لكنك تختار المشاركة والظهور. النجاح ليس في عدم السقوط، بل في امتلاك الشجاعة للوقوف مرة أخرى. هذا هو الطريق الوحيد لحياة مليئة بالمعنى والارتباط.',
        keyPoint: 'الجرأة هي الظهور والمشاركة بقلب مفتوح'
      }
    ],
    pagesEn: [
      {
        title: 'The Power of Vulnerability',
        content: 'Brown explores how showing our vulnerability is actually the height of courage. Vulnerability is not weakness; it is the cradle of innovation, creativity, and true human connection. When we stop protecting ourselves with armor, we begin to live authentically.',
        keyPoint: 'Vulnerability is the source of courage and connection'
      },
      {
        title: 'The Myth of Perfectionism',
        content: 'Fear of criticism and striving for perfection are shields that isolate us. Brown explains that shame thrives in secrecy and silence; the solution is speaking the truth. Perfectionism is an attempt to please others, while daring is accepting our flaws.',
        keyPoint: 'Perfectionism is the enemy of daring and authenticity'
      },
      {
        title: 'Stepping Into the Arena',
        content: 'Daring greatly means being "in the arena," where you are exposed to failure and criticism, but you choose to participate and show up. Success isn\'t in never falling, but in having the courage to stand again.',
        keyPoint: 'Daring is showing up and engaging with an open heart'
      }
    ],
    takeawayAr: 'الجرأة الحقيقية هي أن تكون مرئياً بضعفك وقوتك، فهذا هو الطريق الوحيد للارتباط الحقيقي.',
    takeawayEn: 'True daring is being visible in your weakness and strength; it\'s the only path to real connection.',
  },
  {
    id: '16', titleAr: 'كود نظيف', titleEn: 'Clean Code', authorAr: 'روبرت مارتن', authorEn: 'Robert Martin',
    readTimeMin: 14, rating: 4.9, color: 'from-emerald-600 to-teal-700',
    pagesAr: [
      {
        title: 'أهمية الكود النظيف',
        content: 'يشرح "العم بوب" أن الكود النظيف يقرأ كالنثر الجيد. الكود السيئ يبطئ العمل ويؤدي لتراكم "الديون التقنية". المبرمج المحترف يحرص على كتابة كود يسهل فهمه وصيانته من قبل الآخرين، لأن الكود يقرأ أكثر بكثير مما يكتب.',
        keyPoint: 'الكود النظيف هو علامة المبرمج المحترف'
      },
      {
        title: 'تسمية الأشياء والدوال',
        content: 'الأسماء يجب أن تعبر عن النية بوضوح. الدوال يجب أن تكون صغيرة وتؤدي شيئاً واحداً فقط وتفعله جيداً. تجنب الأسماء الغامضة والدوال الطويلة التي تقوم بمهام متعددة، فهذا يسهل عملية الاختبار وتصحيح الأخطاء لاحقاً.',
        keyPoint: 'الدوال يجب أن تفعل شيئاً واحداً فقط'
      },
      {
        title: 'قاعدة الكشافة والتعليقات',
        content: 'قاعدة الكشافة تقول: "اترك الكود أنظف مما وجدته". أما التعليقات، فيجب أن تكون الملاذ الأخير؛ الكود الجيد يجب أن يشرح نفسه بنفسه. الاختبارات الآلية (Unit Tests) هي جزء لا يتجزأ من الكود النظيف لضمان عدم تعطل النظام عند التعديل.',
        keyPoint: 'الكود الجيد يغني عن كثرة التعليقات'
      }
    ],
    pagesEn: [
      {
        title: 'Importance of Clean Code',
        content: '"Uncle Bob" explains that clean code reads like well-written prose. Bad code slows down work and leads to "technical debt." A professional programmer ensures code is easy to understand and maintain by others.',
        keyPoint: 'Clean code is the mark of a professional'
      },
      {
        title: 'Naming and Functions',
        content: 'Names should clearly reveal intent. Functions should be small and do only one thing. Avoid vague names and long functions; this makes testing and debugging much easier.',
        keyPoint: 'Functions should do one thing and do it well'
      },
      {
        title: 'Boy Scout Rule and Comments',
        content: 'The Boy Scout Rule: "Leave the code cleaner than you found it." Comments should be a last resort; good code should explain itself. Automated tests are integral to clean code to ensure stability.',
        keyPoint: 'Good code explains itself'
      }
    ],
    takeawayAr: 'المبرمج الجيد يكتب كوداً تفهمه الحواسيب، والمبرمج العظيم يكتب كوداً يفهمه البشر.',
    takeawayEn: 'A good programmer writes code computers understand; a great programmer writes code humans understand.',
  },
  {
    id: '17', titleAr: 'المبرمج البراغماتي', titleEn: 'The Pragmatic Programmer', authorAr: 'أندرو هانت', authorEn: 'Andrew Hunt',
    readTimeMin: 13, rating: 4.8, color: 'from-slate-600 to-gray-700',
    summaryAr: ['يقدم الكتاب نصائح عملية حول فلسفة البرمجة وتطوير الذات كمحترف تقني.','يتناول موضوعات مثل تجنب التكرار (DRY)، وأهمية التعلم المستمر، وكيفية بناء أنظمة مرنة.'],
    summaryEn: ['The book offers practical advice on programming philosophy and self-development as a technical professional.','It covers topics like avoiding repetition (DRY), the importance of continuous learning, and how to build flexible systems.'],
    keyPointsAr: ['لا تكرر نفسك (DRY)', 'استثمر في محفظتك المعرفية بانتظام', 'تحمل المسؤولية عن أخطائك البرمجية'],
    keyPointsEn: ['Don\'t Repeat Yourself (DRY)', 'Invest in your knowledge portfolio regularly', 'Take responsibility for your coding mistakes'],
    takeawayAr: 'البرمجة هي حرفة تتطلب التعلم المستمر والانضباط والاهتمام بالتفاصيل.',
    takeawayEn: 'Programming is a craft that requires continuous learning, discipline, and attention to detail.',
  },
  {
    id: '18', titleAr: 'المبتكرون', titleEn: 'The Innovators', authorAr: 'والتر إيزاكسون', authorEn: 'Walter Isaacson',
    readTimeMin: 15, rating: 4.7, color: 'from-cyan-600 to-blue-700',
    summaryAr: ['يروي إيزاكسون تاريخ الثورة الرقمية من خلال قصص الأشخاص الذين اخترعوا الكمبيوتر والإنترنت.','يؤكد الكتاب على أن الابتكار العظيم غالباً ما يكون نتيجة للتعاون الجماعي وليس عبقرية فردية واحدة.'],
    summaryEn: ['Isaacson recounts the history of the digital revolution through the stories of the people who invented the computer and the internet.','The book emphasizes that great innovation is often the result of collective collaboration, not just a single individual\'s genius.'],
    keyPointsAr: ['الابتكار هو رياضة جماعية', 'الجمع بين الفن والعلم هو سر العبقرية', 'الرؤية بدون تنفيذ هي مجرد هلوسة'],
    keyPointsEn: ['Innovation is a team sport', 'Combining art and science is the secret to genius', 'Vision without execution is just hallucination'],
    takeawayAr: 'أعظم الاختراعات البشرية ولدت من تلاقي العقول المبدعة والعمل الجماعي الدؤوب.',
    takeawayEn: 'The greatest human inventions were born from the meeting of creative minds and diligent teamwork.',
  },
  {
    id: '19', titleAr: 'من الصفر إلى الواحد', titleEn: 'Zero to One', authorAr: 'بيتر ثيل', authorEn: 'Peter Thiel',
    readTimeMin: 11, rating: 4.6, color: 'from-blue-700 to-indigo-800',
    summaryAr: ['يقدم بيتر ثيل رؤية فريدة حول كيفية بناء شركات تخلق أشياء جديدة تماماً (من 0 إلى 1) بدلاً من نسخ ما هو موجود.','يشجع رواد الأعمال على البحث عن "الأسرار" وبناء احتكارات قائمة على الابتكار التقني.'],
    summaryEn: ['Peter Thiel offers a unique vision on building companies that create entirely new things (from 0 to 1) instead of copying what exists.','He encourages entrepreneurs to search for "secrets" and build monopolies based on technical innovation.'],
    keyPointsAr: ['المنافسة هي للأسرى، الاحتكار هو للناجحين', 'ابحث عن الحقيقة التي يختلف معك فيها معظم الناس', 'كل شركة عظيمة هي فريدة من نوعها'],
    keyPointsEn: ['Competition is for losers; monopoly is for winners', 'Search for the truth that most people disagree with you on', 'Every great company is unique'],
    takeawayAr: 'المستقبل ينتمي لأولئك الذين يبنون أشياء لم يتخيلها أحد من قبل.',
    takeawayEn: 'The future belongs to those who build things no one has imagined before.',
  },
  {
    id: '20', titleAr: 'مشروع الفينيق', titleEn: 'The Phoenix Project', authorAr: 'جين كيم', authorEn: 'Gene Kim',
    readTimeMin: 14, rating: 4.7, color: 'from-orange-600 to-red-700',
    summaryAr: ['رواية تعليمية حول تقنية المعلومات وعمليات DevOps، تروي قصة مدير يواجه تحديات هائلة لإنقاذ مشروع تقني فاشل.','تشرح المفاهيم المعقدة لإدارة العمليات التقنية من خلال سرد قصصي مشوق.'],
    summaryEn: ['An educational novel about IT and DevOps, telling the story of a manager facing enormous challenges to save a failing tech project.','It explains complex technical operations management concepts through engaging storytelling.'],
    keyPointsAr: ['التدفق والتعليقات والتعلم المستمر هي أسس DevOps', 'تحديد العوائق هو الخطوة الأولى لتحسين الإنتاجية', 'التعاون بين التطوير والعمليات ضروري للنجاح'],
    keyPointsEn: ['Flow, Feedback, and Continuous Learning are foundations of DevOps', 'Identifying bottlenecks is the first step to improving productivity', 'Collaboration between Dev and Ops is essential for success'],
    takeawayAr: 'النجاح التقني لا يتعلق بالأدوات فقط، بل بكيفية تنظيم العمل وتدفق القيمة.',
    takeawayEn: 'Technical success isn\'t just about tools, but how work is organized and value flows.',
  },
  {
    id: '21', titleAr: 'التفكير، بسرعة وببطء', titleEn: 'Thinking, Fast and Slow', authorAr: 'دانيال كانيمان', authorEn: 'Daniel Kahneman',
    readTimeMin: 15, rating: 4.8, color: 'from-amber-600 to-yellow-700',
    summaryAr: ['يشرح عالم النفس الحائز على نوبل كيف يعمل عقلنا من خلال نظامين: النظام 1 (سريع وحدسي) والنظام 2 (بطيء ومنطقي).','يكشف عن التحيزات المعرفية التي تؤثر على قراراتنا اليومية وكيف يمكننا تحسين جودة تفكيرنا.'],
    summaryEn: ['The Nobel Prize-winning psychologist explains how our mind works through two systems: System 1 (fast and intuitive) and System 2 (slow and logical).','It reveals the cognitive biases that affect our daily decisions and how we can improve our thinking quality.'],
    keyPointsAr: ['نحن لسنا كائنات منطقية كما نظن', 'الحدس غالباً ما يخطئ في المسائل المعقدة', 'الوعي بالتحيزات هو الخطوة الأولى لتجنبها'],
    keyPointsEn: ['We are not as logical as we think', 'Intuition often fails in complex matters', 'Awareness of biases is the first step to avoiding them'],
    takeawayAr: 'تعرف على كيفية عمل عقلك لتتخذ قرارات أفضل وتتجنب فخاخ التفكير البديهي.',
    takeawayEn: 'Learn how your mind works to make better decisions and avoid intuitive thinking traps.',
  },
  {
    id: '22', titleAr: 'الإنسان يبحث عن المعنى', titleEn: "Man's Search for Meaning", authorAr: 'فيكتور فرانكل', authorEn: 'Viktor Frankl',
    readTimeMin: 10, rating: 4.9, color: 'from-gray-600 to-slate-800',
    summaryAr: ['يروي الطبيب النفسي فرانكل تجاربه في معسكرات الاعتقال، مستخلصاً منها أن المعنى هو الدافع الأساسي للإنسان للبقاء.','يقدم "العلاج بالمعنى" كطريقة للتغلب على المعاناة من خلال إيجاد هدف للحياة.'],
    summaryEn: ['Psychiatrist Frankl recounts his experiences in concentration camps, concluding that meaning is man\'s primary motivation for survival.','He presents "Logotherapy" as a way to overcome suffering by finding a purpose for life.'],
    keyPointsAr: ['يمكن سلب كل شيء من الإنسان إلا حريته في اختيار موقفه', 'من يملك "لماذا" للعيش يمكنه تحمل أي "كيف"', 'المعنى يولد من العمل أو الحب أو المعاناة'],
    keyPointsEn: ['Everything can be taken from a man but the freedom to choose his attitude', 'He who has a "why" to live can bear almost any "how"', 'Meaning is born from work, love, or suffering'],
    takeawayAr: 'الحرية الأخيرة للإنسان هي اختيار موقفه تجاه أي مجموعة من الظروف.',
    takeawayEn: 'The last of human freedoms is to choose one\'s attitude in any given set of circumstances.',
  },
  {
    id: '23', titleAr: 'التدفق', titleEn: 'Flow', authorAr: 'ميهالي تشيكسينتميهالي', authorEn: 'Mihaly Csikszentmihalyi',
    readTimeMin: 12, rating: 4.7, color: 'from-sky-500 to-indigo-600',
    summaryAr: ['يستكشف الكتاب حالة "التدفق" — وهي حالة من التركيز التام والاندماج في نشاط ما تجعلنا نشعر بالسعادة والرضا.','يشرح كيف يمكننا تحويل الأنشطة اليومية إلى تجارب ممتعة من خلال موازنة التحدي مع المهارة.'],
    summaryEn: ['The book explores the state of "Flow" — a state of total focus and immersion in an activity that makes us feel happy and satisfied.','It explains how we can transform daily activities into enjoyable experiences by balancing challenge with skill.'],
    keyPointsAr: ['السعادة ليست شيئاً يحدث، بل هي شيء نصنعه', 'التدفق يحدث عندما تتساوى المهارة مع التحدي', 'التحكم في الانتباه هو مفتاح جودة الحياة'],
    keyPointsEn: ['Happiness is not something that happens; it\'s something we create', 'Flow happens when skill meets challenge', 'Control of attention is the key to quality of life'],
    takeawayAr: 'جد حالة التدفق في عملك وحياتك لتصل إلى أقصى درجات السعادة والإنتاجية.',
    takeawayEn: 'Find the flow state in your work and life to reach peak happiness and productivity.',
  },
  {
    id: '24', titleAr: 'التأثير: سيكولوجية الإقناع', titleEn: 'Influence: The Psychology of Persuasion', authorAr: 'روبرت سيالديني', authorEn: 'Robert Cialdini',
    readTimeMin: 13, rating: 4.8, color: 'from-red-700 to-rose-800',
    summaryAr: ['يكشف سيالديني عن المبادئ النفسية الستة التي تجعل الناس يقولون "نعم": التبادل، الالتزام، الإجماع، الإعجاب، السلطة، والندرة.','يساعدك الكتاب على فهم كيف يتم إقناعنا وكيف يمكننا استخدام هذه المبادئ بأخلاقية.'],
    summaryEn: ['Cialdini reveals the six psychological principles that make people say "yes": Reciprocity, Commitment, Social Proof, Liking, Authority, and Scarcity.','The book helps you understand how we are persuaded and how we can use these principles ethically.'],
    keyPointsAr: ['الناس يميلون لرد الجميل (التبادل)', 'نحن نتبع ما يفعله الآخرون (الإجماع الاجتماعي)', 'الندرة تزيد من قيمة الأشياء في نظرنا'],
    keyPointsEn: ['People tend to return favors (Reciprocity)', 'We follow what others do (Social Proof)', 'Scarcity increases the perceived value of things'],
    takeawayAr: 'فهم سيكولوجية الإقناع يحميك من التلاعب ويجعلك أكثر فعالية في التواصل.',
    takeawayEn: 'Understanding the psychology of persuasion protects you from manipulation and makes you more effective in communication.',
  },
  {
    id: '25', titleAr: 'الهدوء: قوة الانطوائيين', titleEn: 'Quiet', authorAr: 'سوزان كين', authorEn: 'Susan Cain',
    readTimeMin: 11, rating: 4.7, color: 'from-blue-400 to-cyan-500',
    summaryAr: ['تدافع سوزان كين عن الانطوائيين في عالم لا يتوقف عن الكلام. توضح كيف أن المجتمع يسيء تقدير قدرات الأشخاص الهادئين.','يسلط الكتاب الضوء على إسهامات الانطوائيين العظيمة في الفن والعلم والقيادة.'],
    summaryEn: ['Susan Cain defends introverts in a world that can\'t stop talking. She explains how society undervalues the abilities of quiet people.','The book highlights the great contributions of introverts in art, science, and leadership.'],
    keyPointsAr: ['الهدوء ليس ضعفاً، بل هو نوع مختلف من القوة', 'الانطوائيون يميلون للتفكير العميق والإبداع المنفرد', 'نحتاج لتوازن بين طاقة الانطوائيين والمنفتحين'],
    keyPointsEn: ['Quiet is not weakness; it\'s a different kind of strength', 'Introverts tend toward deep thinking and solitary creativity', 'We need a balance between introvert and extrovert energy'],
    takeawayAr: 'لا تقلل من شأن القوة الكامنة في الصمت والتركيز الهادئ.',
    takeawayEn: 'Don\'t underestimate the inherent power in silence and quiet focus.',
  },
  {
    id: '26', titleAr: 'الشركة الناشئة المرنة', titleEn: 'The Lean Startup', authorAr: 'إريك ريس', authorEn: 'Eric Ries',
    readTimeMin: 12, rating: 4.6, color: 'from-blue-500 to-teal-500',
    summaryAr: ['يقدم إريك ريس منهجية علمية لبناء وإدارة الشركات الناشئة الناجحة في عصر يتسم بعدم اليقين.','تعتمد المنهجية على "التعلم المعتمد" ودورات البناء والقياس والتعلم السريعة.'],
    summaryEn: ['Eric Ries presents a scientific methodology for building and managing successful startups in an age of uncertainty.','The methodology relies on "validated learning" and rapid build-measure-learn cycles.'],
    keyPointsAr: ['ابنِ منتجاً أولياً حداً أدنى (MVP)', 'الفشل بسرعة هو وسيلة للتعلم والنجاح', 'القياس الحقيقي هو ما يدفع للنمو'],
    keyPointsEn: ['Build a Minimum Viable Product (MVP)', 'Failing fast is a way to learn and succeed', 'Real measurement is what drives growth'],
    takeawayAr: 'لا تضيع وقتك في بناء شيء لا يريده أحد — اختبر أفكارك بسرعة وتعلم من عملائك.',
    takeawayEn: 'Don\'t waste time building something nobody wants — test your ideas quickly and learn from your customers.',
  },
  {
    id: '27', titleAr: 'من جيد إلى عظيم', titleEn: 'Good to Great', authorAr: 'جيم كولينز', authorEn: 'Jim Collins',
    readTimeMin: 14, rating: 4.8, color: 'from-red-600 to-maroon-700',
    summaryAr: ['لماذا تنجح بعض الشركات في التحول من أداء جيد إلى أداء عظيم بينما تفشل شركات أخرى؟ جيم كولينز يقدم الإجابة من خلال دراسة استمرت سنوات.','يشرح مفاهيم مثل "القيادة من المستوى الخامس" و"مفهوم القنفذ" وأهمية الانضباط.'],
    summaryEn: ['Why do some companies succeed in making the leap from good to great while others fail? Jim Collins provides the answer through a years-long study.','He explains concepts like "Level 5 Leadership," the "Hedgehog Concept," and the importance of discipline.'],
    keyPointsAr: ['القيادة العظيمة تتسم بالتواضع والإرادة الصلبة', 'ضع الأشخاص المناسبين في الحافلة أولاً', 'واجه الحقائق القاسية ولا تفقد الإيمان أبداً'],
    keyPointsEn: ['Great leadership is characterized by humility and professional will', 'Get the right people on the bus first', 'Confront the brutal facts but never lose faith'],
    takeawayAr: 'العظمة ليست صدفة، بل هي نتيجة انضباط الأشخاص والتفكير والعمل.',
    takeawayEn: 'Greatness isn\'t a coincidence; it\'s the result of disciplined people, thought, and action.',
  },
  {
    id: '28', titleAr: 'استراتيجية المحيط الأزرق', titleEn: 'Blue Ocean Strategy', authorAr: 'دبليو تشان كيم', authorEn: 'W. Chan Kim',
    readTimeMin: 13, rating: 4.7, color: 'from-blue-400 to-cyan-600',
    summaryAr: ['يدعو الكتاب الشركات إلى الخروج من "المحيط الأحمر" المليء بالمنافسة الشرسة إلى "المحيط الأزرق" الخالي من المنافسين.','يشرح كيف يمكن خلق طلب جديد وتقديم قيمة فريدة تجعل المنافسة غير ذات جدوى.'],
    summaryEn: ['The book calls on companies to exit the "Red Ocean" full of fierce competition and enter the "Blue Ocean" where competition is irrelevant.','It explains how to create new demand and offer unique value that makes competition unnecessary.'],
    keyPointsAr: ['ابتكر قيمة جديدة بدلاً من التنافس على القيمة الحالية', 'اجعل المنافسة غير ذات صلة', 'التركيز على غير العملاء لخلق طلب جديد'],
    keyPointsEn: ['Create new value instead of competing over existing value', 'Make the competition irrelevant', 'Focus on non-customers to create new demand'],
    takeawayAr: 'لا تتنافس لتفوز — ابتكر لتنفرد وتخلق سوقك الخاص.',
    takeawayEn: 'Don\'t compete to win — innovate to stand alone and create your own market.',
  },
  {
    id: '29', titleAr: 'فارس الحذاء', titleEn: 'Shoe Dog', authorAr: 'فيل نايت', authorEn: 'Phil Knight',
    readTimeMin: 12, rating: 4.9, color: 'from-orange-500 to-amber-600',
    summaryAr: ['مذكرات مؤسس شركة "نايكي"، يروي فيها الصعوبات المالية والقانونية والشخصية التي واجهها لبناء إمبراطورية رياضية عالمية.','قصة ملهمة حول الإصرار والمخاطرة والبحث عن الشغف في عالم الأعمال.'],
    summaryEn: ['The memoir of Nike\'s founder, recounting the financial, legal, and personal struggles he faced to build a global sports empire.','An inspiring story of persistence, risk-taking, and searching for passion in the business world.'],
    keyPointsAr: ['الاستمرار هو السر — لا تتوقف حتى تصل', 'الأعمال ليست مجرد أرقام، بل هي علاقات وإيمان بالرؤية', 'كن جريئاً في مواجهة العواصف'],
    keyPointsEn: ['Keep going — don\'t stop until you get there', 'Business isn\'t just numbers; it\'s relationships and belief in the vision', 'Be bold in the face of storms'],
    takeawayAr: 'الطريق للنجاح مليء بالعثرات، لكن الإيمان برؤيتك هو ما سيجعلك تستمر.',
    takeawayEn: 'The path to success is full of obstacles, but belief in your vision is what will keep you going.',
  },
  {
    id: '30', titleAr: 'ابدأ بـ لماذا', titleEn: 'Start with Why', authorAr: 'سايمون سينك', authorEn: 'Simon Sinek',
    readTimeMin: 10, rating: 4.7, color: 'from-yellow-600 to-orange-700',
    pagesAr: [
      {
        title: 'الدائرة الذهبية',
        content: 'يشرح سايمون سينك أن معظم الناس والشركات يعرفون "ماذا" يفعلون، وبعضهم يعرف "كيف"، لكن القليل جداً يعرفون "لماذا" يفعلون ذلك. القادة الملهمون يبدأون دائماً من المركز (لماذا - الغرض والهدف)، وهذا هو ما يجذب الناس ويخلق ولاءً حقيقياً.',
        keyPoint: 'الناس لا يشترون ما تفعله، بل يشترون لماذا تفعله'
      },
      {
        title: 'الإلهام مقابل التلاعب',
        content: 'التلاعب (مثل الخصومات والخوف) قد يحقق مبيعات سريعة، لكنه لا يبني ولاءً. الإلهام يحدث عندما يتواصل القادة مع "لماذا" الخاصة بهم، مما يحفز الناس على العمل معهم لأنهم يؤمنون بنفس المبادئ. هذا النوع من القيادة يخلق فرق عمل مبدعة ومخلصة.',
        keyPoint: 'الولاء الحقيقي ينبع من المشاركة في المعنى'
      },
      {
        title: 'وضوح الغرض والنجاح',
        content: 'وضوح "لماذا" هو ما يضمن استمرارية النجاح وتجنب التخبط عند النمو. عندما تفقد الشركة اتصالها بغرضها الأساسي، تبدأ في التراجع. النجاح الحقيقي هو الحفاظ على التوازن بين الغرض الملهم والعمليات الفعالة والمنتجات الرائعة التي تعبر عن ذلك الغرض.',
        keyPoint: 'الوضوح في الهدف هو بوصلة النجاح الدائم'
      }
    ],
    pagesEn: [
      {
        title: 'The Golden Circle',
        content: 'Simon Sinek explains that most know "What" they do, some know "How," but very few know "Why." Inspiring leaders start from the center (Why - the purpose), which creates true loyalty.',
        keyPoint: 'People don\'t buy what you do, but why you do it'
      },
      {
        title: 'Inspiration vs Manipulation',
        content: 'Manipulation (discounts, fear) achieves quick sales but not loyalty. Inspiration happens when leaders connect with their "Why," motivating people who believe in the same principles.',
        keyPoint: 'True loyalty stems from shared meaning'
      },
      {
        title: 'Clarity of Purpose',
        content: 'Clarity of "Why" ensures long-term success and avoids confusion during growth. True success is balancing inspiring purpose with effective processes and great products.',
        keyPoint: 'Clarity in purpose is the compass of success'
      }
    ],
    takeawayAr: 'إذا كنت تريد إلهام الآخرين، ابدأ دائماً بالهدف والغاية قبل أي شيء آخر.',
    takeawayEn: 'If you want to inspire others, always start with the purpose and goal before anything else.',
  },
];

const BookSummaries = () => {
  const { lang, dir } = useLang();
  const { isAdmin } = useIsAdmin();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (selectedBook) {
    const title = lang === 'ar' ? selectedBook.titleAr : selectedBook.titleEn;
    const author = lang === 'ar' ? selectedBook.authorAr : selectedBook.authorEn;
    const pages = (lang === 'ar' ? selectedBook.pagesAr : selectedBook.pagesEn) ?? [];
    const takeaway = lang === 'ar' ? selectedBook.takeawayAr : selectedBook.takeawayEn;

    return (
      <div className="fixed inset-0 z-50 bg-[#f4f1ea] dark:bg-slate-900 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedBook(null)} className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <BackArrow size={18} /><span className="text-sm font-bold uppercase tracking-wider">{lang === 'ar' ? 'رجوع' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-4">
               <button
                type="button"
                onClick={() => {
                  if (isSpeaking()) { stopSpeaking(); return; }
                  speak(pages.map(p => p.title + '. ' + p.content).join(' '));
                }}
                className="flex items-center gap-2 text-xs font-bold text-primary dark:text-primary-foreground px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-primary/10 hover:bg-primary/5 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                <Volume2 size={16} />
                {lang === 'ar' ? 'استماع للكتاب' : 'Listen to Book'}
              </button>
              <button onClick={() => setSelectedBook(null)} className="p-2 rounded-full bg-white dark:bg-slate-800 text-foreground dark:text-white shadow-sm border border-border"><X size={16} /></button>
            </div>
          </div>

          {/* Book Header Card */}
          <div className={`w-full rounded-3xl bg-gradient-to-br ${selectedBook.color} p-8 shadow-2xl relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BookOpen size={28} className="text-white" />
                </div>
                <div className="h-[1px] flex-1 bg-white/20" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{title}</h2>
              <p className="text-white/90 text-lg mt-2 font-medium">{author}</p>
              <div className="flex items-center gap-4 mt-6">
                <div className="px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={12} /> {selectedBook.readTimeMin} {lang === 'ar' ? 'دقائق' : 'MINS'}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" /> {selectedBook.rating}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Pages Display */}
          <div className="space-y-12 pb-20">
            {pages.map((page, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-0 shadow-2xl rounded-3xl overflow-hidden border border-border bg-white dark:bg-slate-800 min-h-[400px] relative">
                {/* Center Spine */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 z-10 shadow-inner" />
                
                {/* Left Page: Title & Explanation */}
                <div className={`p-10 md:p-14 ${lang === 'ar' ? 'order-1' : 'order-2'} relative bg-white dark:bg-slate-800`}>
                  <div className="absolute top-6 left-6 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
                    {lang === 'ar' ? `صفحة ${idx * 2 + 1}` : `PAGE ${idx * 2 + 2}`}
                  </div>
                  <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <h3 className="text-2xl font-black text-foreground dark:text-white border-b-4 border-primary/20 pb-2 inline-block">
                      {page.title}
                    </h3>
                    <div className="text-lg text-muted-foreground dark:text-slate-300 leading-relaxed text-justify indent-8 font-serif">
                      {page.content}
                    </div>
                  </div>
                </div>

                {/* Right Page: Key Point */}
                <div className={`p-10 md:p-14 ${lang === 'ar' ? 'order-2' : 'order-1'} relative bg-[#fafafa] dark:bg-slate-700 border-l border-border/50 flex flex-col justify-center`}>
                  <div className="absolute top-6 right-6 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
                    {lang === 'ar' ? `صفحة ${idx * 2 + 2}` : `PAGE ${idx * 2 + 1}`}
                  </div>
                  <div className="space-y-6 text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Lightbulb size={32} />
                    </div>
                    <p className="text-xs font-black text-primary uppercase tracking-widest">{lang === 'ar' ? 'نقطة جوهرية' : 'Key Point'}</p>
                    <h4 className="text-2xl font-black text-foreground dark:text-white leading-tight">
                      {page.keyPoint}
                    </h4>
                  </div>
                </div>
              </div>
            ))}

            {/* Final Takeaway Page */}
            <div className="p-12 rounded-[3rem] bg-gradient-to-br from-primary to-primary/80 text-white text-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
               <Sparkles size={60} className="mx-auto mb-6 opacity-50" />
               <p className="text-xs font-black uppercase tracking-[0.3em] mb-4 opacity-80">{lang === 'ar' ? 'الخلاصة النهائية' : 'Final Takeaway'}</p>
               <h3 className="text-3xl font-black leading-tight italic">
                 "{takeaway}"
               </h3>
            </div>
          </div>
          <div className="h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{lang === 'ar' ? 'ملخصات الكتب' : 'Book Summaries'} 📚</h2>
        <span className="text-xs text-muted-foreground">{books.length} {lang === 'ar' ? 'كتاب' : 'books'}</span>
      </div>

      {isAdmin && (
        <AdminUploadInline
          category="summary"
          accept=".pdf,application/pdf"
          labelAr="ملخص PDF"
          labelEn="PDF Summary"
        />
      )}

      <UploadedLibrary category="summary" />

      {books.map(book => (
        <button key={book.id} onClick={() => setSelectedBook(book)}
          className="w-full glass-card rounded-2xl p-4 text-start flex items-center gap-4 hover:bg-primary/5 transition-all active:scale-[0.98]">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${book.color} flex items-center justify-center shrink-0`}>
            <BookOpen size={20} className="text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{lang === 'ar' ? book.titleAr : book.titleEn}</p>
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? book.authorAr : book.authorEn}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} /> {book.readTimeMin} {lang === 'ar' ? 'د' : 'm'}
          </div>
        </button>
      ))}
    </div>
  );
};

export default BookSummaries;
