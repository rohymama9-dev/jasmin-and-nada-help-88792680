import { useState } from 'react';
import { Send, MessageCircle, ExternalLink } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const KHAMSAT_URL = 'https://khamsat.com/user/yasmin_a21';
const AUTO_REPLY =
  'مرحباً بك، شكراً لتواصلك! يمكنك الاطلاع على خدماتي الرقمية الاحترافية وطلبها مباشرة عبر حسابي في منصة خمسات: ' +
  KHAMSAT_URL;

interface Msg { from: 'me' | 'admin'; text: string; ts: number }

const ContactAdmin = () => {
  const { lang } = useLang();
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    setMsgs(prev => [
      ...prev,
      { from: 'me', text: t, ts: now },
      { from: 'admin', text: AUTO_REPLY, ts: now + 1 },
    ]);
    setText('');
  };

  return (
    <div className="glass-card rounded-2xl p-6 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-3">
        <MessageCircle className="text-primary-foreground" size={28} />
      </div>
      <h3 className="font-bold text-lg mb-2">{lang === 'ar' ? 'هذه الخدمة مغلقة مؤقتاً' : 'This service is temporarily closed'}</h3>
      <p className="text-sm text-muted-foreground mb-4">{lang === 'ar' ? 'ستعود قريباً 🔧' : 'Coming soon 🔧'}</p>
    </div>
  );
};

export default ContactAdmin;
