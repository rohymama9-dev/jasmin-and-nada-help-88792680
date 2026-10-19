import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Download, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import StealthHeartLock from './StealthHeartLock';

interface Sticker {
  id: string;
  emoji?: string;
  imageUrl?: string;
  nameAr: string;
  nameEn: string;
  category: 'comedy' | 'meme' | 'cute' | 'cool' | 'gamers' | 'barbie' | 'boys' | 'mine';
}

// ─────────────────────────────────────────────────────────────────────────────
//  Custom high-quality image stickers — listed FIRST
// ─────────────────────────────────────────────────────────────────────────────
const stickersList = [
  "1.webp", "1.1.webp", "2.webp", "2.1.webp", "3.webp", "3.1.webp",
  "4.webp", "4.1.webp", "5.webp", "5.1.webp", "6.webp", "6.1.webp",
  "7.webp", "7.1.webp", "8.webp", "8.1.webp", "9.webp", "9.1.webp",
  "10.1.webp", "20260415_1512_image.webp", "cat 2.webp", "cat.webp",
  "cats_memes8.webp", "lovers.webp", "memes1.webp", "memes2.webp",
  "memes3.webp", "memes4.webp", "memes5.webp", "memes6.webp",
  "memes7.webp", "pubg .webp", "SpongeBob.webp", "supercat.webp",
  "supercat2.webp"
];

const customImageStickers: Sticker[] = stickersList.map((fileName, index) => {
  return {
    id: `cs${index + 1}`,
    imageUrl: `/images/stickers/${fileName}`,
    nameAr: `ملصق ${index + 1}`,
    nameEn: `Sticker ${index + 1}`,
    category: 'mine' 
  };
});

// ─────────────────────────────────────────────────────────────────────────────
//  Existing emoji stickers — unchanged, appended after custom images
// ─────────────────────────────────────────────────────────────────────────────
const emojiStickers: Sticker[] = [
  { id: 'c1',  emoji: '😂', nameAr: 'ضحك',        nameEn: 'LOL',           category: 'comedy' },
  { id: 'c2',  emoji: '🤣', nameAr: 'هستيريا',     nameEn: 'ROFL',          category: 'comedy' },
  { id: 'c3',  emoji: '😜', nameAr: 'مزح',        nameEn: 'Joking',        category: 'comedy' },
  { id: 'c4',  emoji: '🤪', nameAr: 'مجنون',      nameEn: 'Crazy',         category: 'comedy' },
  { id: 'c5',  emoji: '😹', nameAr: 'قطة ضاحكة',  nameEn: 'Laughing Cat',  category: 'comedy' },
  { id: 'c6',  emoji: '🙃', nameAr: 'ساخر',       nameEn: 'Sarcastic',     category: 'comedy' },
  { id: 'c7',  emoji: '🤡', nameAr: 'مهرج',       nameEn: 'Clown',         category: 'comedy' },
  { id: 'c8',  emoji: '😏', nameAr: 'ماكر',       nameEn: 'Smirk',         category: 'comedy' },
  { id: 'c9',  emoji: '🤭', nameAr: 'ضحكة خفيفة', nameEn: 'Chuckle',       category: 'comedy' },
  { id: 'c10', emoji: '😆', nameAr: 'قهقهة',      nameEn: 'Grinning',      category: 'comedy' },
  { id: 'm1',  emoji: '💀',  nameAr: 'ميت ضحك', nameEn: 'Dead',       category: 'meme' },
  { id: 'm2',  emoji: '🗿',  nameAr: 'حجر',     nameEn: 'Stone Face', category: 'meme' },
  { id: 'm3',  emoji: '👁️', nameAr: 'عين',     nameEn: 'Eye',        category: 'meme' },
  { id: 'm4',  emoji: '🫠',  nameAr: 'ذايب',    nameEn: 'Melting',    category: 'meme' },
  { id: 'm5',  emoji: '🤌',  nameAr: 'إيطالي',  nameEn: 'Italian',    category: 'meme' },
  { id: 'm6',  emoji: '🧢',  nameAr: 'كاب',     nameEn: 'Cap',        category: 'meme' },
  { id: 'm7',  emoji: '💅',  nameAr: 'أنيق',    nameEn: 'Slay',       category: 'meme' },
  { id: 'm8',  emoji: '🤠',  nameAr: 'كاوبوي',  nameEn: 'Cowboy',     category: 'meme' },
  { id: 'm9',  emoji: '🫡',  nameAr: 'تحية',    nameEn: 'Salute',     category: 'meme' },
  { id: 'm10', emoji: '🤓',  nameAr: 'نيرد',    nameEn: 'Nerd',       category: 'meme' },
  { id: 'u1', emoji: '🥺', nameAr: 'رجاءً',    nameEn: 'Please',    category: 'cute' },
  { id: 'u2', emoji: '🐱', nameAr: 'قطة',      nameEn: 'Kitty',     category: 'cute' },
  { id: 'u3', emoji: '🌸', nameAr: 'زهرة',     nameEn: 'Blossom',   category: 'cute' },
  { id: 'u4', emoji: '💖', nameAr: 'حب',       nameEn: 'Love',      category: 'cute' },
  { id: 'u5', emoji: '🧸', nameAr: 'دبدوب',    nameEn: 'Teddy',     category: 'cute' },
  { id: 'u6', emoji: '🦄', nameAr: 'يونيكورن', nameEn: 'Unicorn',   category: 'cute' },
  { id: 'u7', emoji: '🐶', nameAr: 'كلب',      nameEn: 'Puppy',     category: 'cute' },
  { id: 'u8', emoji: '🦋', nameAr: 'فراشة',    nameEn: 'Butterfly', category: 'cute' },
  { id: 'o1', emoji: '😎', nameAr: 'كول',    nameEn: 'Cool',      category: 'cool' },
  { id: 'o2', emoji: '🔥', nameAr: 'نار',    nameEn: 'Fire',      category: 'cool' },
  { id: 'o3', emoji: '💪', nameAr: 'قوة',    nameEn: 'Strong',    category: 'cool' },
  { id: 'o4', emoji: '🚀', nameAr: 'صاروخ',  nameEn: 'Rocket',    category: 'cool' },
  { id: 'o5', emoji: '⚡', nameAr: 'برق',    nameEn: 'Lightning', category: 'cool' },
  { id: 'o6', emoji: '👑', nameAr: 'تاج',    nameEn: 'Crown',     category: 'cool' },
  { id: 'o7', emoji: '🎯', nameAr: 'هدف',    nameEn: 'Bullseye',  category: 'cool' },
  { id: 'o8', emoji: '🏆', nameAr: 'كأس',    nameEn: 'Trophy',    category: 'cool' },
  { id: 'g1',  emoji: '🎮', nameAr: 'يد التحكم',  nameEn: 'Controller',  category: 'gamers' },
  { id: 'g2',  emoji: '🕹️', nameAr: 'جويستيك',   nameEn: 'Joystick',    category: 'gamers' },
  { id: 'g3',  emoji: '👾', nameAr: 'وحش بكسل',   nameEn: 'Pixel Alien', category: 'gamers' },
  { id: 'g4',  emoji: '🎯', nameAr: 'تصويب',      nameEn: 'Headshot',    category: 'gamers' },
  { id: 'g5',  emoji: '💥', nameAr: 'انفجار',     nameEn: 'Boom',        category: 'gamers' },
  { id: 'g6',  emoji: '🏅', nameAr: 'وسام',       nameEn: 'Achievement', category: 'gamers' },
  { id: 'g7',  emoji: '⚔️', nameAr: 'سيوف',      nameEn: 'PvP',         category: 'gamers' },
  { id: 'g8',  emoji: '🛡️', nameAr: 'درع',       nameEn: 'Shield',      category: 'gamers' },
  { id: 'g9',  emoji: '🧙', nameAr: 'ساحر',       nameEn: 'Wizard',      category: 'gamers' },
  { id: 'g10', emoji: '🐲', nameAr: 'تنين',       nameEn: 'Dragon',      category: 'gamers' },
  { id: 'g11', emoji: '💎', nameAr: 'جوهرة',      nameEn: 'Loot',        category: 'gamers' },
  { id: 'g12', emoji: '🔫', nameAr: 'مسدس',       nameEn: 'Blaster',     category: 'gamers' },
  { id: 'b1',  emoji: '👛', nameAr: 'حقيبة وردية', nameEn: 'Pink Purse', category: 'barbie' },
  { id: 'b2',  emoji: '👗', nameAr: 'فستان',       nameEn: 'Dress',      category: 'barbie' },
  { id: 'b3',  emoji: '👠', nameAr: 'كعب عالي',    nameEn: 'Heels',      category: 'barbie' },
  { id: 'b4',  emoji: '💄', nameAr: 'أحمر شفاه',   nameEn: 'Lipstick',   category: 'barbie' },
  { id: 'b5',  emoji: '💕', nameAr: 'قلوب',        nameEn: 'Hearts',     category: 'barbie' },
  { id: 'b6',  emoji: '🌷', nameAr: 'تيوليب',      nameEn: 'Tulip',      category: 'barbie' },
  { id: 'b7',  emoji: '🎀', nameAr: 'فيونكة',      nameEn: 'Bow',        category: 'barbie' },
  { id: 'b8',  emoji: '🦄', nameAr: 'يونيكورن',    nameEn: 'Unicorn',    category: 'barbie' },
  { id: 'b9',  emoji: '✨', nameAr: 'بريق',        nameEn: 'Sparkle',    category: 'barbie' },
  { id: 'b10', emoji: '🌈', nameAr: 'قوس قزح',     nameEn: 'Rainbow',    category: 'barbie' },
  { id: 'b11', emoji: '🧚', nameAr: 'جنية',        nameEn: 'Fairy',      category: 'barbie' },
  { id: 'b12', emoji: '👑', nameAr: 'أميرة',       nameEn: 'Princess',   category: 'barbie' },
  { id: 'a1',  emoji: '🦸', nameAr: 'بطل خارق',   nameEn: 'Superhero',  category: 'boys' },
  { id: 'a2',  emoji: '🥷', nameAr: 'نينجا',       nameEn: 'Ninja',      category: 'boys' },
  { id: 'a3',  emoji: '🏎️', nameAr: 'سيارة سباق', nameEn: 'Race Car',   category: 'boys' },
  { id: 'a4',  emoji: '🛸', nameAr: 'صحن طائر',    nameEn: 'UFO',        category: 'boys' },
  { id: 'a5',  emoji: '🦖', nameAr: 'ديناصور',     nameEn: 'T-Rex',      category: 'boys' },
  { id: 'a6',  emoji: '⚽', nameAr: 'كرة قدم',     nameEn: 'Soccer',     category: 'boys' },
  { id: 'a7',  emoji: '🏀', nameAr: 'سلة',         nameEn: 'Basketball', category: 'boys' },
  { id: 'a8',  emoji: '🤖', nameAr: 'روبوت',       nameEn: 'Robot',      category: 'boys' },
  { id: 'a9',  emoji: '🚀', nameAr: 'صاروخ',       nameEn: 'Rocket',     category: 'boys' },
  { id: 'a10', emoji: '🦈', nameAr: 'قرش',         nameEn: 'Shark',      category: 'boys' },
  { id: 'a11', emoji: '🎸', nameAr: 'جيتار',       nameEn: 'Guitar',     category: 'boys' },
  { id: 'a12', emoji: '🛹', nameAr: 'سكيت',        nameEn: 'Skate',      category: 'boys' },
];

const stickers: Sticker[] = [...customImageStickers, ...emojiStickers];

const categories = [
  { key: 'all',    labelAr: 'الكل',        labelEn: 'All',          emoji: '🎨' },
  { key: 'mine',   labelAr: 'ملصقاتي',     labelEn: 'Mine',         emoji: '📱' },
  { key: 'comedy', labelAr: 'كوميدي',      labelEn: 'Comedy',       emoji: '😂' },
  { key: 'meme',   labelAr: 'ميمز',        labelEn: 'Memes',        emoji: '💀' },
  { key: 'cute',   labelAr: 'كيوت',        labelEn: 'Cute',         emoji: '🥺' },
  { key: 'cool',   labelAr: 'كول',         labelEn: 'Cool',         emoji: '😎' },
  { key: 'gamers', labelAr: 'جيمرز',       labelEn: 'Gamers',       emoji: '🎮' },
  { key: 'barbie', labelAr: 'باربي/بنات',  labelEn: 'Barbie/Girls', emoji: '🎀' },
  { key: 'boys',   labelAr: 'أولاد أكشن', labelEn: 'Boys Action',  emoji: '🦸' },
];

const LOCAL_KEY = 'sticker-device-v1';
const DELETED_LOCAL_KEY = 'deleted-stickers-v1';

// ─────────────────────────────────────────────────────────────────────────────
const COPYRIGHT_OWNER = 'NadaHelps.com';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Uint8Array, off: number, len: number): number {
  let c = 0xffffffff;
  for (let i = off; i < off + len; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeTEXtChunk(keyword: string, value: string): Uint8Array {
  const enc  = new TextEncoder();
  const kw   = enc.encode(keyword);
  const val  = enc.encode(value);
  const data = new Uint8Array(kw.length + 1 + val.length);
  data.set(kw, 0);
  data[kw.length] = 0x00;
  data.set(val, kw.length + 1);

  const chunk = new Uint8Array(12 + data.length);
  const view  = new DataView(chunk.buffer);
  view.setUint32(0, data.length, false);
  chunk[4] = 0x74; chunk[5] = 0x45;
  chunk[6] = 0x58; chunk[7] = 0x74;
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk, 4, 4 + data.length), false);
  return chunk;
}

function injectPngTextChunks(pngBuf: ArrayBuffer, owner: string): Uint8Array {
  const IHDR_END = 33;
  const src      = new Uint8Array(pngBuf);

  const chunks = [
    makeTEXtChunk('Copyright', `© ${new Date().getFullYear()} ${owner}`),
    makeTEXtChunk('Author',    owner),
    makeTEXtChunk('Software',  owner),
    makeTEXtChunk('Comment',   `Created by ${owner}`),
  ];
  const extraBytes = chunks.reduce((s, c) => s + c.length, 0);

  const out = new Uint8Array(src.length + extraBytes);
  out.set(src.subarray(0, IHDR_END), 0);
  let pos = IHDR_END;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  out.set(src.subarray(IHDR_END), pos);
  return out;
}

async function buildCopyrightedPng(sourceUrl: string): Promise<string> {
  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const el  = new Image();
    el.crossOrigin = 'anonymous';
    el.onload  = () => resolve(el);
    el.onerror = reject;
    el.src = sourceUrl;
  });

  const canvas  = document.createElement('canvas');
  canvas.width  = img.naturalWidth  || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const pngBlob: Blob = await new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
  );
  const pngBuffer = await pngBlob.arrayBuffer();
  const taggedBytes = injectPngTextChunks(pngBuffer, COPYRIGHT_OWNER);
const finalBlob = new Blob([taggedBytes as any], { type: 'image/webp' });
  return URL.createObjectURL(finalBlob);
}

function buildEmojiDataUrl(emoji: string): Promise<string> {
  return new Promise(resolve => {
    const size = 256;
    const c    = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx  = c.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);
    ctx.font         = `${size * 0.78}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + 6);
    resolve(c.toDataURL('image/png'));
  });
}

// ─────────────────────────────────────────────────────────────────────────────

interface LongPressEvents {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const useLongPress = (callback: () => void, ms = 3000): LongPressEvents => {
  const timerRef = useRef<any>(null);

  const start = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => { callback(); timerRef.current = null; }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  return {
    onMouseDown:   start,
    onMouseUp:     stop,
    onMouseLeave:  stop,
    onTouchStart:  start,
    onTouchEnd:    stop,
    onTouchCancel: stop,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
};

// ─────────────────────────────────────────────────────────────────────────────

const StickerStore = () => {
  const { lang } = useLang();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [cat, setCat]             = useState('all');
  const [device, setDevice]       = useState<Sticker[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  // State for the Image Preview Modal
  const [previewSticker, setPreviewSticker] = useState<Sticker | null>(null);

  useEffect(() => {
    try {
      const rawDevice = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as Sticker[];
      setDevice(rawDevice);
      
      const rawDeleted = JSON.parse(localStorage.getItem(DELETED_LOCAL_KEY) || '[]') as string[];
      setDeletedIds(rawDeleted);
    } catch { /* */ }
  }, []);

  const persistDevice = (next: Sticker[]) => {
    setDevice(next);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  };

  const onUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const item: Sticker = {
        id:       `mine-${Date.now()}`,
        imageUrl: String(reader.result),
        nameAr:   file.name.replace(/\.[^.]+$/, ''),
        nameEn:   file.name.replace(/\.[^.]+$/, ''),
        category: 'mine',
      };
      persistDevice([item, ...device]);
      toast({ title: lang === 'ar' ? 'تمت إضافة الملصق ✨' : 'Sticker added ✨' });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (device.some(s => s.id === id)) {
      persistDevice(device.filter(s => s.id !== id));
    } else {
      const newDeletedIds = [...deletedIds, id];
      setDeletedIds(newDeletedIds);
      localStorage.setItem(DELETED_LOCAL_KEY, JSON.stringify(newDeletedIds));
    }
    toast({ title: lang === 'ar' ? 'تم الحذف نهائياً 🗑️' : 'Deleted permanently 🗑️' });
  };

  const downloadSticker = async (sticker: Sticker) => {
    setDownloading(sticker.id);
    try {
      const sourceUrl = sticker.imageUrl
        ?? (sticker.emoji ? await buildEmojiDataUrl(sticker.emoji) : null);

      if (!sourceUrl) return;

      const objectUrl = await buildCopyrightedPng(sourceUrl);

      const a      = document.createElement('a');
      a.href       = objectUrl;
      a.download   = `${sticker.nameEn.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      toast({ title: lang === 'ar' ? 'تم التحميل بنجاح 🎉' : 'Downloaded successfully 🎉' });
    } catch (err) {
      console.error('Download error:', err);
      toast({ title: lang === 'ar' ? 'فشل التحميل' : 'Download failed', variant: 'destructive' });
    } finally {
      setDownloading(null);
    }
  };

  const all = [...device, ...stickers].filter(s => !deletedIds.includes(s.id));
  const filtered = cat === 'all' ? all : all.filter(s => s.category === cat);

  const heartLongPress = useLongPress(() => {
    setIsDeleteMode(prev => !prev);
    toast({ 
      title: lang === 'ar' 
        ? (!isDeleteMode ? 'تم تفعيل وضع الحذف 🗑️' : 'تم إغلاق وضع الحذف') 
        : (!isDeleteMode ? 'Delete mode enabled 🗑️' : 'Delete mode disabled') 
    });
  }, 1500);

  return (
    <div className="space-y-4 relative">
      {/* ── Image Preview Modal ── */}
      {previewSticker && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-24 bg-black/90 px-4 backdrop-blur-sm"
          onClick={() => setPreviewSticker(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2"
            aria-label="Close Preview"
          >
            <X size={36} />
          </button>
          
          {/* محتوى النافذة مجمع في كونتينر لمنع الإغلاق عند الضغط عليه */}
          <div 
            className="flex flex-col items-center gap-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full aspect-square flex items-center justify-center">
              {previewSticker.imageUrl ? (
                <img 
                  src={previewSticker.imageUrl} 
                  alt={previewSticker.nameEn} 
                  className="max-w-full max-h-[50vh] object-contain drop-shadow-2xl rounded-lg"
                />
              ) : (
                <span className="text-[150px] leading-none select-none drop-shadow-2xl">
                  {previewSticker.emoji}
                </span>
              )}
            </div>
            
            <h4 className="text-white text-xl font-bold text-center">
              {lang === 'ar' ? previewSticker.nameAr : previewSticker.nameEn}
            </h4>

            {/* زر التحميل داخل النافذة المكبرة */}
            <button
              onClick={() => downloadSticker(previewSticker)}
              disabled={downloading === previewSticker.id}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 mt-2"
            >
              {downloading === previewSticker.id ? (
                <span className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={24} />
              )}
              {lang === 'ar' ? 'تحميل الملصق' : 'Download Sticker'}
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎨</span>
        <h3 className="font-bold text-foreground">
          {lang === 'ar' ? 'متجر الملصقات' : 'Sticker Store'}
        </h3>
        <button
          {...heartLongPress}
          className={`p-1 transition-colors active:scale-90 touch-none select-none ${isDeleteMode ? 'text-red-500 animate-pulse' : 'text-primary hover:text-red-500'}`}
          aria-label="Toggle Delete Mode"
        >
          <Heart size={20} className="fill-current" />
        </button>
        <span className="text-xs text-muted-foreground ml-auto">
          {all.length} {lang === 'ar' ? 'ملصق' : 'stickers'}
        </span>
      </div>

      {/* ── Category pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              cat === c.key
                ? 'gradient-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {c.emoji} {lang === 'ar' ? c.labelAr : c.labelEn}
          </button>
        ))}
      </div>

      {/* ── Hidden file input for user uploads ── */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />

      {/* ── Sticker grid ── */}
      <div className="grid grid-cols-4 gap-2">
        {filtered.map(sticker => (
          <div
            key={sticker.id}
            className="relative bg-secondary/50 rounded-xl p-2 flex flex-col items-center gap-1"
          >
            {/* Thumbnail - أصبح هو فقط القابل للضغط لفتح النافذة المكبرة */}
            <div 
              className="w-full aspect-square rounded-lg overflow-hidden bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
              onClick={() => setPreviewSticker(sticker)}
            >
              {sticker.imageUrl ? (
                <img
                  src={sticker.imageUrl}
                  alt={lang === 'ar' ? sticker.nameAr : sticker.nameEn}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-3xl leading-none select-none">
                  {sticker.emoji}
                </span>
              )}
            </div>

            {/* Name label */}
            <p className="text-[10px] text-muted-foreground truncate w-full text-center leading-tight mt-1">
              {lang === 'ar' ? sticker.nameAr : sticker.nameEn}
            </p>

            {/* Download button - رجعنا زر التحميل القديم تحت الملصق مباشرة */}
            <button
              onClick={() => downloadSticker(sticker)}
              disabled={downloading === sticker.id}
              aria-label={lang === 'ar' ? 'تحميل' : 'Download'}
              className="w-full flex items-center justify-center gap-1 py-1 rounded-lg gradient-primary text-primary-foreground text-[10px] font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-1"
            >
              {downloading === sticker.id ? (
                <span className="w-2.5 h-2.5 border border-white/80 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={10} />
              )}
              {lang === 'ar' ? 'تحميل' : 'Download'}
            </button>

            {/* Remove button — appears ONLY when isDeleteMode is active */}
            {isDeleteMode && (
              <button
                onClick={() => handleDelete(sticker.id)}
                aria-label="remove"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-[14px] flex items-center justify-center shadow-lg z-10 transition-transform active:scale-90 hover:scale-110"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Keep supabase types reachable without runtime cost */}
      <StealthHeartLock
        storageKey="sticker-device-upload-unlocked"
        onUploadClick={() => fileRef.current?.click()}
      />
    </div>
  );
};

export default StickerStore;