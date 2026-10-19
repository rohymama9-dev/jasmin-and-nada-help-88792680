import { useLang } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const MotivationalMarquee = () => {
  const { lang } = useLang();
  
  const allAdvices = [
    { ar: 'اشرب كوباً من الماء كل ساعة لترطيب جسمك وعقلك.', en: 'Drink a glass of water every hour to hydrate your body and mind.' },
    { ar: 'الاستمرارية في العمل الصغير خير من الانقطاع في العمل الكبير.', en: 'Consistency in small tasks is better than inconsistency in large ones.' },
    { ar: 'خذ استراحة لمدة 5 دقائق كل ساعة لتحسين تركيزك.', en: 'Take a 5-minute break every hour to improve your focus.' },
    { ar: 'ابتسم في وجه الصعاب، فالتفاؤل هو نصف الحل.', en: 'Smile in the face of difficulties; optimism is half the solution.' },
    { ar: 'اجعل القراءة عادة يومية، ولو لصفحة واحدة.', en: 'Make reading a daily habit, even if it is just one page.' },
    { ar: 'التنفس العميق يقلل التوتر ويزيد من صفاء الذهن.', en: 'Deep breathing reduces stress and increases mental clarity.' },
    { ar: 'ابدأ يومك بأصعب مهمة، وستشعر بالإنجاز بقية اليوم.', en: 'Start your day with the hardest task, and you will feel accomplished the rest of the day.' },
    { ar: 'الامتنان هو مفتاح السعادة، فكر في 3 أشياء أنت ممتن لها اليوم.', en: 'Gratitude is the key to happiness; think of 3 things you are grateful for today.' },
    { ar: 'النوم الكافي هو الوقود الحقيقي لإنتاجيتك.', en: 'Sufficient sleep is the true fuel for your productivity.' },
    { ar: 'تحرك لمدة 10 دقائق يومياً لتحسين دورتك الدموية.', en: 'Move for 10 minutes a day to improve your blood circulation.' },
    { ar: 'قلل من وقت الشاشات قبل النوم بساعة لتنعم بنوم هادئ.', en: 'Reduce screen time an hour before bed for a peaceful sleep.' },
    { ar: 'تعلم كلمة جديدة كل يوم لتوسيع آفاقك.', en: 'Learn a new word every day to broaden your horizons.' },
    { ar: 'التنظيم يوفر الوقت، رتب مكان عملك قبل البدء.', en: 'Organization saves time; tidy your workspace before starting.' },
    { ar: 'لا تقارن بدايتك بنهاية الآخرين، لكل شخص رحلته الخاصة.', en: "Don't compare your beginning to others' endings; everyone has their own journey." },
    { ar: 'الصدق مع النفس هو أول خطوة نحو التغيير الحقيقي.', en: 'Being honest with yourself is the first step toward true change.' }
  ];

  // Get a different advice based on the day of the year + a random offset that changes on refresh
  const [adviceIndex, setAdviceIndex] = useState(0);

  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const randomOffset = Math.floor(Math.random() * allAdvices.length);
    setAdviceIndex((dayOfYear + randomOffset) % allAdvices.length);
  }, []);

  const currentAdvice = allAdvices[adviceIndex];

  return (
    <div className="bg-primary/5 border-y border-primary/10 py-3 overflow-hidden whitespace-nowrap relative group">
      <div className="flex animate-marquee group-hover:pause-animation">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="mx-12 text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary/40" />
            {lang === 'ar' ? currentAdvice.ar : currentAdvice.en}
          </span>
        ))}
      </div>
    </div>
  );
};

export default MotivationalMarquee;
