export interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
  rotation: number;
  name: string;
  type: string;
}

export const processUploadedFile = async (file: File): Promise<ProcessedImage> => {
  const previewUrl = URL.createObjectURL(file);

  const { width, height } = await new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = previewUrl;
    }
  );

  return {
    id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    file,
    previewUrl,
    width,
    height,
    size: file.size,
    rotation: 0,
    name: file.name,
    type: file.type,
  };
};

export const getRotatedImageBlob = async (
  imageSrc: string,
  rotation: number,
  type: string = 'image/jpeg'
): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const isVertical = rotation === 90 || rotation === 270;
      canvas.width = isVertical ? img.height : img.width;
      canvas.height = isVertical ? img.width : img.height;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const exportType = type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = exportType === 'image/jpeg' ? 0.95 : undefined;

      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject);
        },
        exportType,
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image for rotation'));
    img.src = imageSrc;
  });
};
