/**
 * Free, native browser Text-to-Speech using the Web Speech API.
 * Auto-detects Arabic vs English from text and picks the best installed voice.
 */

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/;

export type TTSLang = 'ar' | 'en' | 'auto';

export const detectLang = (text: string): 'ar' | 'en' => (ARABIC_RE.test(text) ? 'ar' : 'en');

/** Lazily resolves voices — many browsers populate the list asynchronously. */
const getVoices = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise(resolve => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const ready = window.speechSynthesis.getVoices();
    if (ready.length) { resolve(ready); return; }
    const handler = () => {
      resolve(window.speechSynthesis.getVoices());
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Fallback timeout
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });

const pickVoice = (voices: SpeechSynthesisVoice[], lang: 'ar' | 'en') => {
  const tag = lang === 'ar' ? 'ar' : 'en';
  // Prefer regional defaults, then any matching tag
  const preferred = lang === 'ar' ? ['ar-SA', 'ar-EG', 'ar-XA'] : ['en-US', 'en-GB', 'en-AU'];
  for (const code of preferred) {
    const v = voices.find(x => x.lang.toLowerCase() === code.toLowerCase());
    if (v) return v;
  }
  return voices.find(v => v.lang.toLowerCase().startsWith(tag));
};

export interface SpeakOpts {
  lang?: TTSLang;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export const speak = async (text: string, opts: SpeakOpts = {}) => {
  if (!text?.trim()) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[tts] Web Speech API not supported');
    return;
  }
  window.speechSynthesis.cancel();

  const detected = opts.lang && opts.lang !== 'auto' ? opts.lang : detectLang(text);
  const voices = await getVoices();
  const voice = pickVoice(voices, detected);

  const u = new SpeechSynthesisUtterance(text);
  u.lang = detected === 'ar' ? 'ar-SA' : 'en-US';
  if (voice) u.voice = voice;
  u.rate = opts.rate ?? (detected === 'ar' ? 0.85 : 0.95);
  u.pitch = opts.pitch ?? 1;
  if (opts.onEnd) u.onend = opts.onEnd;
  window.speechSynthesis.speak(u);
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeaking = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
