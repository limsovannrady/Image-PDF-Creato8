import type { ProcessedImage } from './image-processing';

export type PageSizeOption = 'a4' | 'letter' | 'legal' | 'original';
export type OrientationOption = 'portrait' | 'landscape';
export type MarginOption = 'none' | 'small' | 'medium' | 'large';
export type ScalingOption = 'fit' | 'fill' | 'original';

export interface PdfSettings {
  pageSize: PageSizeOption;
  orientation: OrientationOption;
  margins: MarginOption;
  scaling: ScalingOption;
}

const MARGIN_MM: Record<MarginOption, number> = {
  none: 0,
  small: 5,
  medium: 10,
  large: 25.4,
};

const PAGE_FORMATS: Record<string, string> = {
  a4: 'a4',
  letter: 'letter',
  legal: 'legal',
};

const yieldToMain = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (_e) => reject(new Error('Failed to load image'));
    img.src = src;
  });

const imageToCanvas = async (
  imgData: ProcessedImage
): Promise<{ dataUrl: string; width: number; height: number; format: 'JPEG' | 'PNG' }> => {
  const el = await loadImageElement(imgData.previewUrl);

  const rotation = imgData.rotation;
  const isVertical = rotation === 90 || rotation === 270;
  const cw = isVertical ? el.naturalHeight : el.naturalWidth;
  const ch = isVertical ? el.naturalWidth : el.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.translate(cw / 2, ch / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(el, -el.naturalWidth / 2, -el.naturalHeight / 2);

  const isPng = imgData.type === 'image/png';
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, 0.95);

  return { dataUrl, width: cw, height: ch, format: isPng ? 'PNG' : 'JPEG' };
};

export const generatePDF = async (
  images: ProcessedImage[],
  settings: PdfSettings,
  onProgress: (progress: number, status: string) => void
): Promise<string> => {
  onProgress(5, 'Loading PDF engine...');
  await yieldToMain();

  // Dynamic import to avoid startup crashes
  const { jsPDF } = await import('jspdf');

  onProgress(10, 'Initializing...');
  await yieldToMain();

  let pdf: InstanceType<typeof jsPDF> | null = null;

  for (let i = 0; i < images.length; i++) {
    const imgData = images[i];
    onProgress(
      15 + Math.floor((i / images.length) * 75),
      `Processing image ${i + 1} of ${images.length}...`
    );
    await yieldToMain();

    const { dataUrl, width: imgPx, height: imgPx2, format } = await imageToCanvas(imgData);
    const imgWMm = (imgPx * 25.4) / 96;
    const imgHMm = (imgPx2 * 25.4) / 96;

    let pageW: number;
    let pageH: number;

    if (settings.pageSize === 'original') {
      pageW = imgWMm;
      pageH = imgHMm;
    } else {
      const orientation = settings.orientation === 'landscape' ? 'l' : 'p';
      const temp = new jsPDF({ orientation, unit: 'mm', format: PAGE_FORMATS[settings.pageSize] });
      pageW = temp.internal.pageSize.getWidth();
      pageH = temp.internal.pageSize.getHeight();
    }

    if (pdf === null) {
      pdf = new jsPDF({
        orientation: pageW >= pageH ? 'l' : 'p',
        unit: 'mm',
        format: [pageW, pageH],
        compress: false,
      });
    } else {
      pdf.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');
    }

    const margin = MARGIN_MM[settings.margins];
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;

    let drawW = imgWMm;
    let drawH = imgHMm;
    let drawX = margin;
    let drawY = margin;

    if (settings.pageSize !== 'original') {
      if (settings.scaling === 'fit') {
        const scale = Math.min(contentW / imgWMm, contentH / imgHMm);
        drawW = imgWMm * scale;
        drawH = imgHMm * scale;
        drawX = margin + (contentW - drawW) / 2;
        drawY = margin + (contentH - drawH) / 2;
      } else if (settings.scaling === 'fill') {
        const scale = Math.max(contentW / imgWMm, contentH / imgHMm);
        drawW = imgWMm * scale;
        drawH = imgHMm * scale;
        drawX = margin + (contentW - drawW) / 2;
        drawY = margin + (contentH - drawH) / 2;
      } else {
        // original size, centered
        drawX = margin + (contentW - imgWMm) / 2;
        drawY = margin + (contentH - imgHMm) / 2;
      }
    }

    pdf.addImage(dataUrl, format, drawX, drawY, drawW, drawH, undefined, 'NONE');
  }

  onProgress(95, 'Saving PDF...');
  await yieldToMain();

  if (!pdf) throw new Error('No images were processed');

  const output = pdf.output('blob');
  onProgress(100, 'Done!');
  return URL.createObjectURL(output);
};
