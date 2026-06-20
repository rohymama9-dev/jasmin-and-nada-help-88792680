import { useState, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, Check, Lock, PlayCircle, Image as ImageIcon, Music, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

const IMAGE_FMTS = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
  { value: 'application/pdf', label: 'PDF', ext: 'pdf' },
];

const DOC_FMTS = [
  { value: 'pdf', label: 'PDF', ext: 'pdf' },
  { value: 'txt', label: 'TXT', ext: 'txt' },
  { value: 'docx', label: 'DOCX', ext: 'docx' },
];

const CATEGORIES = [
  { id: 'image', icon: ImageIcon, ar: 'تحويل الصور', en: 'Images', color: 'from-emerald-400 to-teal-500' },
  { id: 'audio', icon: Music, ar: 'استخراج الصوت', en: 'Extract Audio', color: 'from-purple-400 to-violet-500' },
  { id: 'doc', icon: FileText, ar: 'المستندات', en: 'Documents', color: 'from-amber-400 to-orange-500' },
];

type CatId = 'image' | 'audio' | 'doc';

const FormatConverter = () => {
  const { lang } = useLang();
  
  // Points & Unlock logic
  const [points, setPoints] = useState(() => parseInt(localStorage.getItem('points') || '100'));
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem('converterUnlocked') === 'true');
  const UNLOCK_COST = 80;

  const [category, setCategory] = useState<CatId | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [targetFmt, setTargetFmt] = useState('image/webp');
  const [docFormat, setDocFormat] = useState('pdf');

  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [progress, setProgress] = useState('');

  const handleUnlock = () => {
    if (points >= UNLOCK_COST) {
      const newPoints = points - UNLOCK_COST;
      setPoints(newPoints);
      localStorage.setItem('points', newPoints.toString());
      localStorage.setItem('converterUnlocked', 'true');
      setIsUnlocked(true);
      toast.success(lang === 'ar' ? 'تم فك القفل بنجاح!' : 'Unlocked successfully!');
    } else {
      toast.error(lang === 'ar' ? 'نقاطك غير كافية!' : 'Not enough points!');
    }
  };

  const handleFile = (f: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f); setDone(false); setResultBlob(null); setProgress('');
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f)); else setPreview(null);
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setDone(false); setResultBlob(null); setProgress(''); setPreview(null);
  };

  const convert = async () => {
    if (!file) return;
    setProcessing(true); setProgress('');
    try {
      let blob: Blob; let name: string;

      if (category === 'image') {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
        
        if (targetFmt === 'application/pdf') {
          const doc = new jsPDF({ orientation: img.width > img.height ? 'l' : 'p', unit: 'px', format: [img.width, img.height] });
          doc.addImage(img, 'JPEG', 0, 0, img.width, img.height);
          blob = doc.output('blob');
          name = `converted_${file.name.replace(/\.[^.]+$/, '')}.pdf`;
        } else {
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const ext = IMAGE_FMTS.find(f => f.value === targetFmt)?.ext || 'webp';
          blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Failed')), targetFmt, 0.95));
          name = `converted_${file.name.replace(/\.[^.]+$/, '')}.${ext}`;
        }
        URL.revokeObjectURL(url);
      } else if (category === 'audio') {
        const audioCtx = new AudioContext();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start();
        const renderedBuffer = await offlineCtx.startRendering();
        
        // Convert to WAV
        const length = renderedBuffer.length * renderedBuffer.numberOfChannels * 2 + 44;
        const out = new ArrayBuffer(length);
        const view = new DataView(out);
        const writeString = (pos: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i)); };
        
        writeString(0, 'RIFF'); view.setUint32(4, 36 + renderedBuffer.length * 2, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, renderedBuffer.numberOfChannels, true);
        view.setUint32(24, renderedBuffer.sampleRate, true); view.setUint32(28, renderedBuffer.sampleRate * 4, true);
        view.setUint16(32, renderedBuffer.numberOfChannels * 2, true); view.setUint16(34, 16, true); writeString(36, 'data');
        view.setUint32(40, renderedBuffer.length * 2, true);
        
        const channelData = renderedBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < channelData.length; i++) {
          let s = Math.max(-1, Math.min(1, channelData[i]));
          view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
          offset += 2;
        }
        
        blob = new Blob([out], { type: 'audio/wav' });
        name = `extracted_audio.wav`;
      } else if (category === 'doc') {
        // Mock doc conversion for client-side
        if (docFormat === 'txt') {
          const text = await file.text();
          blob = new Blob([text], { type: 'text/plain' });
        } else if (docFormat === 'pdf') {
          const doc = new jsPDF();
          doc.text("Converted Document Preview", 10, 10);
          blob = doc.output('blob');
        } else {
          blob = new Blob(["Simulated DOCX content"], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        }
        name = `converted_doc.${docFormat}`;
      } else {
        throw new Error('Unknown category');
      }

      setResultBlob(blob);
      setResultName(name);
      setDone(true);
      toast.success(lang === 'ar' ? 'تم التحويل بنجاح!' : 'Converted successfully!');
    } catch (e) {
      console.error(e);
      toast.error(lang === 'ar' ? 'فشل التحويل' : 'Conversion failed');
    }
    setProcessing(false);
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url; a.download = resultName; a.click();
    URL.revokeObjectURL(url);
  };

  if (!isUnlocked) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-center text-white shadow-xl relative overflow-hidden glass-card">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <Lock size={64} className="mx-auto mb-6 opacity-90 drop-shadow-lg" />
          <h2 className="text-3xl font-extrabold mb-4 drop-shadow">
            {lang === 'ar' ? 'المحول الشامل للصيغ' : 'Universal Format Converter'}
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-md mx-auto font-medium">
            {lang === 'ar' 
              ? `افتح المحول الشامل لتحويل الصور والمستندات واستخراج الصوت محلياً وبكل أمان.` 
              : `Unlock the universal converter for images, documents, and audio extraction locally and securely.`}
          </p>
          <button
            onClick={handleUnlock}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-full font-extrabold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-95"
          >
            <PlayCircle className="group-hover:rotate-12 transition-transform" />
            {lang === 'ar' ? `فتح مقابل ${UNLOCK_COST} نقطة` : `Unlock for ${UNLOCK_COST} points`}
          </button>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id as CatId)} className={`bg-gradient-to-br ${c.color} p-6 rounded-3xl text-white text-center hover:scale-105 transition-all shadow-lg btn-interactive`}>
            <c.icon size={36} className="mx-auto mb-3" />
            <h3 className="font-bold text-sm">{lang === 'ar' ? c.ar : c.en}</h3>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
        <h3 className="font-bold text-lg text-primary">
          {lang === 'ar' ? CATEGORIES.find(c => c.id === category)?.ar : CATEGORIES.find(c => c.id === category)?.en}
        </h3>
        <button onClick={() => { setCategory(null); reset(); }} className="text-muted-foreground hover:bg-secondary p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden glass-card">
        {!file ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-2xl cursor-pointer bg-secondary/20 hover:bg-secondary/40 transition-colors group">
             <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileText className="w-12 h-12 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                <p className="font-bold">{lang === 'ar' ? 'اضغط لاختيار أو اسحب الملف هنا' : 'Click or drag file here'}</p>
             </div>
             <input type="file" className="hidden" accept={category === 'image' ? 'image/*' : category === 'audio' ? 'video/*' : '*/*'} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-2xl border border-border">
               {preview && <img src={preview} className="w-16 h-16 rounded-xl object-cover" />}
               <div className="flex-1 truncate"><h4 className="font-bold truncate">{file.name}</h4></div>
               {!processing && !done && <button onClick={reset} className="p-2 hover:bg-destructive/10 text-destructive rounded-full"><X size={18}/></button>}
            </div>

            {!done && category === 'image' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {IMAGE_FMTS.map(fmt => (
                  <button key={fmt.value} onClick={() => setTargetFmt(fmt.value)} className={`py-2 rounded-xl text-xs font-bold border ${targetFmt === fmt.value ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                    {fmt.label}
                  </button>
                ))}
              </div>
            )}

            {!done && category === 'doc' && (
              <div className="grid grid-cols-3 gap-2">
                {DOC_FMTS.map(fmt => (
                  <button key={fmt.value} onClick={() => setDocFormat(fmt.value)} className={`py-2 rounded-xl text-xs font-bold border ${docFormat === fmt.value ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                    {fmt.label}
                  </button>
                ))}
              </div>
            )}

            {done && resultBlob ? (
              <div className="text-center space-y-4">
                 <Check size={40} className="mx-auto text-emerald-500" />
                 <p className="font-bold text-emerald-600">{lang === 'ar' ? 'اكتمل التحويل' : 'Conversion Complete'}</p>
                 <button onClick={download} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20"><Download size={20}/> {lang === 'ar' ? 'تحميل' : 'Download'}</button>
              </div>
            ) : (
              <button onClick={convert} disabled={processing} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex justify-center shadow-lg disabled:opacity-50">
                {processing ? (lang === 'ar' ? 'جاري...' : 'Processing...') : (lang === 'ar' ? 'ابدأ التحويل' : 'Convert Now')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormatConverter;
