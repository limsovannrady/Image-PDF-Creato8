import { PDFDocument, PageSizes } from 'pdf-lib';
import type { ProcessedImage } from './image-processing';
import { getRotatedImageBlob } from './image-processing';

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

const MARGIN_POINTS = {
  none: 0,
  small: 20, // ~0.28 inches
  medium: 40, // ~0.55 inches
  large: 72, // 1 inch
};

const STANDARD_SIZES = {
  a4: PageSizes.A4,
  letter: PageSizes.Letter,
  legal: PageSizes.Legal,
};

// Sleep utility to prevent UI blocking
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export const generatePDF = async (
  images: ProcessedImage[],
  settings: PdfSettings,
  onProgress: (progress: number, status: string) => void
): Promise<string> => {
  try {
    onProgress(5, "Initializing PDF engine...");
    await yieldToMain();
    
    const pdfDoc = await PDFDocument.create();
    
    for (let i = 0; i < images.length; i++) {
      const imgData = images[i];
      onProgress(10 + Math.floor((i / images.length) * 80), `Processing image ${i + 1} of ${images.length}...`);
      await yieldToMain();

      let imageBytes: Uint8Array;
      let isPng = imgData.type === 'image/png';
      
      // If rotated or WebP, process via canvas first to bake in rotation/convert format
      if (imgData.rotation !== 0 || imgData.type === 'image/webp') {
        const targetFormat = isPng ? 'image/png' : 'image/jpeg';
        imageBytes = await getRotatedImageBlob(imgData.previewUrl, imgData.rotation, targetFormat);
        // Force jpeg extension if webp was converted
        if (imgData.type === 'image/webp') isPng = false; 
      } else {
        // Use original bytes directly to prevent any compression loss
        const arrayBuffer = await imgData.file.arrayBuffer();
        imageBytes = new Uint8Array(arrayBuffer);
      }

      let pdfImage;
      try {
        pdfImage = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
      } catch (e) {
        // Fallback if parsing fails (sometimes PNGs have weird chunks)
        const fallbackBytes = await getRotatedImageBlob(imgData.previewUrl, 0, 'image/jpeg');
        pdfImage = await pdfDoc.embedJpg(fallbackBytes);
      }

      const imgDims = pdfImage.scale(1);
      const margin = MARGIN_POINTS[settings.margins];
      
      let pageWidth = 0;
      let pageHeight = 0;

      // Determine Page Size
      if (settings.pageSize === 'original') {
        pageWidth = imgDims.width + (margin * 2);
        pageHeight = imgDims.height + (margin * 2);
      } else {
        const standardSize = STANDARD_SIZES[settings.pageSize];
        pageWidth = settings.orientation === 'portrait' ? standardSize[0] : standardSize[1];
        pageHeight = settings.orientation === 'portrait' ? standardSize[1] : standardSize[0];
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);

      let finalWidth = imgDims.width;
      let finalHeight = imgDims.height;
      let x = margin;
      let y = margin;

      // Calculate Scaling
      if (settings.pageSize !== 'original') {
        const scaleX = contentWidth / imgDims.width;
        const scaleY = contentHeight / imgDims.height;
        
        if (settings.scaling === 'fit') {
          const scale = Math.min(scaleX, scaleY);
          finalWidth = imgDims.width * scale;
          finalHeight = imgDims.height * scale;
          // Center it
          x = margin + (contentWidth - finalWidth) / 2;
          y = margin + (contentHeight - finalHeight) / 2;
        } 
        else if (settings.scaling === 'fill') {
          const scale = Math.max(scaleX, scaleY);
          finalWidth = imgDims.width * scale;
          finalHeight = imgDims.height * scale;
          // Center it (will crop overflow visually in standard viewers, though PDF doesn't strictly clip unless we define a clip path. For simplicity, we just draw it centered and overflowing)
          x = margin + (contentWidth - finalWidth) / 2;
          y = margin + (contentHeight - finalHeight) / 2;
        }
        else if (settings.scaling === 'original') {
          // Center it without scaling
          x = margin + (contentWidth - finalWidth) / 2;
          y = margin + (contentHeight - finalHeight) / 2;
        }
      }

      page.drawImage(pdfImage, {
        x,
        y,
        width: finalWidth,
        height: finalHeight,
      });
    }

    onProgress(95, "Saving PDF document...");
    await yieldToMain();
    
    const pdfBytes = await pdfDoc.save();
    
    onProgress(100, "Done!");
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
    
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw new Error("Failed to generate PDF. Make sure all images are valid.");
  }
};
