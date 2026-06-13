/**
 * Free bilingual TTS wrapper around the browser's Web Speech API.
 *
 * For Arabic, we prefer Egyptian (ar-EG) voices when available — falling back to
 * any ar-* voice (ar-SA, ar-XA, etc.), then to the platform default. Voice
 * selection is best-effort: not every device ships ar-EG, but on modern Android,
 * iOS and Edge/Chrome desktop ar-EG-SalmaNeural / ar-EG-ShakirNeural are usually
 * present.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.resolve([]);
  }
  if (cachedVoices.length) return Promise.resolve(cachedVoices);

  const synth = window.speechSynthesis;
  const initial = synth.getVoices();
  if (initial.length) {
    cachedVoices = initial;
    return Promise.resolve(cachedVoices);
  }

  return new Promise(resolve => {
    const handler = () => {
      cachedVoices = synth.getVoices();
      synth.removeEventListener('voiceschanged', handler);
      resolve(cachedVoices);
    };
    synth.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      cachedVoices = synth.getVoices();
      resolve(cachedVoices);
    }, 800);
  });
};

const scoreArabic = (v: SpeechSynthesisVoice): number => {
  const lang = v.lang.toLowerCase();
  const name = v.name.toLowerCase();
  let s = 0;
  if (lang.startsWith('ar-eg')) s += 100;          // Egyptian — top priority
  else if (lang.startsWith('ar')) s += 40;
  if (/salma|shakir|hoda|laila|noura|nour|ahmed|hamed|nayf/.test(name)) s += 25;
  if (/neural|natural|premium|enhanced/.test(name)) s += 20;
  return s;
};

const scoreEnglish = (v: SpeechSynthesisVoice): number => {
  const lang = v.lang.toLowerCase();
  const name = v.name.toLowerCase();
  let s = 0;
  if (lang.startsWith('en-us')) s += 60;
  else if (lang.startsWith('en')) s += 30;
  if (/neural|natural|premium|enhanced|google/.test(name)) s += 20;
  return s;
};

const pickVoice = (
  voices: SpeechSynthesisVoice[],
  langPrefix: 'ar' | 'en',
): SpeechSynthesisVoice | undefined => {
  const candidates = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
  if (!candidates.length) return undefined;
  const scorer = langPrefix === 'ar' ? scoreArabic : scoreEnglish;
  return candidates.slice().sort((a, b) => scorer(b) - scorer(a))[0];
};

export type SpeakLang = 'ar' | 'en';

export const isSpeechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * Speak text in the chosen language. Cancels any ongoing speech so consecutive
 * taps don't queue up. For Arabic, uses Egyptian voice when available.
 */
export const speak = async (text: string, lang: SpeakLang = 'en', opts: SpeakOptions = {}) => {
  if (!isSpeechSupported() || !text) return;
  try {
    const synth = window.speechSynthesis;
    const voices = await loadVoices();
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const v = pickVoice(voices, lang);
    if (v) utter.voice = v;
    // Force ar-EG when speaking Arabic, regardless of selected voice — gives the
    // best chance of an Egyptian-sounding rendering on engines that synthesize
    // dialect from the lang tag.
    utter.lang = lang === 'ar' ? (v?.lang.toLowerCase().startsWith('ar') ? v.lang : 'ar-EG') : 'en-US';
    utter.rate = opts.rate ?? (lang === 'ar' ? 0.92 : 1.0);
    utter.pitch = opts.pitch ?? 1.0;
    utter.volume = opts.volume ?? 1.0;
    synth.speak(utter);
  } catch {
    /* best-effort */
  }
};

export const cancelSpeech = () => {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
};

/** Return the currently best Arabic voice label (for diagnostics / settings UI). */
export const getActiveArabicVoiceName = async (): Promise<string | null> => {
  const voices = await loadVoices();
  const v = pickVoice(voices, 'ar');
  return v ? `${v.name} (${v.lang})` : null;
};
