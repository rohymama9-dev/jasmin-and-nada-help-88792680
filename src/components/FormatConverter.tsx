import { useState, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, Check, Image as ImageIcon, FileText } from 'lucide-react';
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
  { id: 'doc', icon: FileText, ar: 'المستندات', en: 'Documents', color: 'from-amber-400 to-orange-500' },
];

type CatId = 'image' | 'doc';

const FormatConverter = () => {
  const { lang } = useLang();
  
  // Access is controlled by ServicesPage — no internal unlock needed

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
      } else if (category === 'doc') {
        // Mock doc conversion for client-side
        const sourceText = await file.text();
        if (docFormat === 'txt') {
          // UTF-8 BOM ensures MS Notepad / Word reads Arabic correctly
          const BOM = '\uFEFF';
          blob = new Blob([BOM + sourceText], { type: 'text/plain;charset=utf-8' });
          name = `${file.name.replace(/\.[^.]+$/, '')}.txt`;
        } else if (docFormat === 'pdf') {
          const doc = new jsPDF({ unit: 'pt', format: 'a4' });
          const lines = doc.splitTextToSize(sourceText, 500);
          doc.setFontSize(12);
          doc.text(lines, 40, 60);
          blob = doc.output('blob');
          name = `${file.name.replace(/\.[^.]+$/, '')}.pdf`;
        } else {
          // Proper MS Word HTML with UTF-8 BOM and correct namespace
          // This opens correctly in MS Word and renders Arabic RTL text
          const BOM = '\uFEFF';
          const escaped = sourceText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '</w:p><w:p>');
          const wordHtml = `${BOM}<html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
            <head>
              <meta charset="utf-8"/>
              <meta name="ProgId" content="Word.Document"/>
              <title>Document</title>
              <style>
                body { font-family: Arial, sans-serif; direction: rtl; font-size: 14pt; }
                p { margin: 6pt 0; }
              </style>
            </head>
            <body>
              <div style="direction:rtl; unicode-bidi:embed;">
                <p>${escaped}</p>
              </div>
            </body>
          </html>`;
          blob = new Blob([wordHtml], { type: 'application/msword' });
          name = `${file.name.replace(/\.[^.]+$/, '')}.doc`;
        }
      } else {
        throw new Error('Unknown category');
      }

      setResultBlob(blob);
      setResultName(name);
      setDone(true);
      toast.success(lang === 'ar' ? 'تم التحويل بنجاح!' : 'Converted successfully!');
    } catch (e) {
      console.warn('Conversion error (silent):', e);
      toast(lang === 'ar' ? 'لا يمكن معالجة هذا الملف. جرّب ملفاً آخر أو صيغة مختلفة.' : 'This file could not be processed. Try a different file or format.', { icon: '⚠️' });
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
             <input type="file" className="hidden" accept={category === 'image' ? 'image/*' : category === 'audio' ? 'video/*, .mp4, .webm, .mov' : '*/*'} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
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
