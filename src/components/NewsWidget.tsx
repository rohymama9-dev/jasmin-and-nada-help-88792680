import { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const mockNews = [
  { ar: '🌍 اكتشاف علمي جديد: طريقة لتنقية المياه بالطاقة الشمسية', en: '🌍 New scientific discovery: solar-powered water purification method' },
  { ar: '🎓 طالبة سعودية تحصد الميدالية الذهبية في أولمبياد الرياضيات', en: '🎓 Saudi student wins gold medal in Math Olympiad' },
  { ar: '🌱 مبادرة عالمية لزراعة مليار شجرة بحلول 2030', en: '🌱 Global initiative to plant 1 billion trees by 2030' },
  { ar: '🏥 تطوير لقاح جديد يقضي على مرض نادر بنسبة 95%', en: '🏥 New vaccine developed with 95% effectiveness against rare disease' },
  { ar: '🤝 متطوعون يبنون 100 منزل للعائلات المحتاجة', en: '🤝 Volunteers build 100 homes for families in need' },
  { ar: '🚀 إطلاق أول قمر صناعي عربي لرصد التغير المناخي', en: '🚀 First Arab satellite launched to monitor climate change' },
  { ar: '📚 مكتبة رقمية مجانية تصل إلى مليون كتاب', en: '📚 Free digital library reaches 1 million books' },
  { ar: '🎨 فنانة شابة تفوز بجائزة عالمية في الفن الرقمي', en: '🎨 Young artist wins international digital art award' },
];

const NewsWidget = () => {
  const { lang } = useLang();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIdx(i => (i + 1) % mockNews.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card rounded-2xl p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-2">
        <Newspaper size={16} className="text-primary" />
        <h3 className="font-semibold text-foreground text-sm">{lang === 'ar' ? 'أخبار إيجابية' : 'Good News'}</h3>
      </div>
      <div className="overflow-hidden">
        <p key={idx} className="text-sm text-foreground animate-slide-up leading-relaxed">
          {lang === 'ar' ? mockNews[idx].ar : mockNews[idx].en}
        </p>
      </div>
      <div className="flex gap-1 mt-2 justify-center">
        {mockNews.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-primary w-4' : 'bg-border'}`} />
        ))}
      </div>
    </div>
  );
};

export default NewsWidget;
