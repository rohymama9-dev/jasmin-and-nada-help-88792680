import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

export type ParsedDocumentPage = {
  page: number;
  text: string;
};

export type ParsedDocument = {
  pages: ParsedDocumentPage[];
  text: string;
  source: 'pdf' | 'txt' | 'docx' | 'image';
  html?: string;
  previewUrl?: string;
  imageSize?: { width: number; height: number };
  ocrWords?: OcrWordBox[];
  notices: string[];
};

export type OcrWordBox = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

export type OcrExtraction = {
  text: string;
  words: OcrWordBox[];
  notices: string[];
};

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export const normalizeArabicText = (text: string): string => {
  if (!text) return '';

  // Only remove zero-width spaces, DO NOT remove BIDI control characters (e.g., \u200E, \u200F, \u202A-\u202E)
  let cleaned = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  return normalizeWhitespace(cleaned);
};

export const isPdfFile = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

export const isDocxFile = (file: File) =>
  file.type === DOCX_MIME || file.name.toLowerCase().endsWith('.docx');

export const isTextFile = (file: File) =>
  file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt');

export const isImageFile = (file: File) => file.type.startsWith('image/');

const loadImageSize = (file: File) =>
  new Promise<{ url: string; width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ url, width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
    image.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });

const textToHtml = (text: string) => {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return `<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;line-height:1.8">${escaped}</pre>`;
};

const preprocessImageForOcr = async (file: File): Promise<Blob> => {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = imageUrl;
    });

    const scale = Math.min(2.5, Math.max(1.4, 1800 / Math.max(image.naturalWidth || image.width, 1)));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.drawImage(image, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height);
    const pixels = data.data;

    for (let index = 0; index < pixels.length; index += 4) {
      const gray = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
      const contrast = gray > 160 ? 255 : gray < 90 ? 0 : gray;
      pixels[index] = contrast;
      pixels[index + 1] = contrast;
      pixels[index + 2] = contrast;
    }

    ctx.putImageData(data, 0, 0);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Blob unavailable'))), 'image/png', 1),
    );
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

export const extractPdfText = async (file: File): Promise<ParsedDocumentPage[]> => {
  const buffer = await file.arrayBuffer();
  const buildPages = async (useRemoteAssets: boolean) => {
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      ...(useRemoteAssets
        ? {
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/',
          }
        : {}),
    });
    return await loadingTask.promise;
  };

  let pdf;
  try {
    pdf = await buildPages(false);
  } catch {
    pdf = await buildPages(true);
  }
  const pages: ParsedDocumentPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    let pageText = '';
    let lastY = -1;

    for (const item of content.items as Array<{ str?: string; transform: number[]; hasEOL?: boolean }>) {
      if (!item.str) continue;
      if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) pageText += ' ';
      else if (lastY !== -1 && item.hasEOL) pageText += ' ';
      pageText += item.str.replace(/[\u200B-\u200D\uFEFF]/g, '');
      lastY = item.transform[5];
    }

    pages.push({ page: pageNum, text: normalizeArabicText(pageText) });
  }

  return pages;
};

export const extractDocxText = async (file: File) => {
  const mammothModule = await import('mammoth');
  const mammoth = (mammothModule.default ?? mammothModule) as {
    convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages?: Array<{ message: string }> }>;
    extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages?: Array<{ message: string }> }>;
  };
  const arrayBuffer = await file.arrayBuffer();
  const [textResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ arrayBuffer }),
    mammoth.convertToHtml({ arrayBuffer }),
  ]);
  const text = normalizeArabicText(textResult.value || '');
  return {
    text,
    html: htmlResult.value || textToHtml(text),
    notices: [...(textResult.messages || []), ...(htmlResult.messages || [])].map(message => message.message),
  };
};

export const extractImageText = async (file: File): Promise<OcrExtraction> => {
  const notices: string[] = [];

  try {
    const tesseractModule = await import('tesseract.js');
    const worker = await tesseractModule.createWorker();

    try {
      await worker.loadLanguage('ara+eng');
      await worker.initialize('ara+eng');
      const processedImage = await preprocessImageForOcr(file);
      let recognition;
      try {
        recognition = await worker.recognize(processedImage);
      } catch {
        recognition = await worker.recognize(file);
      }
      const { data } = recognition;
      const text = normalizeArabicText(data?.text || '');
      const words = (data?.words || [])
        .filter(word => normalizeWhitespace(word.text || '').length > 0)
        .map(word => ({
          text: normalizeWhitespace(word.text || ''),
          confidence: Number(word.confidence || 0),
          bbox: {
            x0: word.bbox?.x0 || 0,
            y0: word.bbox?.y0 || 0,
            x1: word.bbox?.x1 || 0,
            y1: word.bbox?.y1 || 0,
          },
        }));

      if (!text) {
        notices.push('لم يتم استخراج نص واضح من الصورة الحالية.');
      }

      return { text, words, notices };
    } finally {
      await worker.terminate();
    }
  } catch {
    notices.push('تعذر تشغيل OCR الآن. يمكن إعادة المحاولة بعد اكتمال تنزيل بيانات اللغة أو مع صورة أوضح.');
    return { text: '', words: [], notices };
  }
};

export const parseSupportedDocument = async (file: File): Promise<ParsedDocument> => {
  if (isPdfFile(file)) {
    const pages = await extractPdfText(file);
    return {
      pages,
      text: pages.map(page => page.text).join('\n'),
      source: 'pdf',
      html: textToHtml(pages.map(page => page.text).join('\n\n')),
      notices: [],
    };
  }

  if (isDocxFile(file)) {
    const result = await extractDocxText(file);
    return {
      pages: [{ page: 1, text: result.text }],
      text: result.text,
      source: 'docx',
      html: result.html,
      notices: result.notices,
    };
  }

  if (isImageFile(file)) {
    const [{ url, width, height }, ocr] = await Promise.all([loadImageSize(file), extractImageText(file)]);
    return {
      pages: [{ page: 1, text: ocr.text }],
      text: ocr.text,
      source: 'image',
      html: textToHtml(ocr.text),
      previewUrl: url,
      imageSize: { width, height },
      ocrWords: ocr.words,
      notices: ocr.notices,
    };
  }

  const text = normalizeArabicText(await file.text());
  return {
    pages: [{ page: 1, text }],
    text,
    source: isTextFile(file) ? 'txt' : 'txt',
    html: textToHtml(text),
    notices: [],
  };
};
