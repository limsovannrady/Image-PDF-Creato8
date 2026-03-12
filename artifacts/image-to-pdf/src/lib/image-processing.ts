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

// Convert File to an Image element to get dimensions
export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
};

// Process an uploaded file into our state model
export const processUploadedFile = async (file: File): Promise<ProcessedImage> => {
  const img = await loadImage(file);
  const previewUrl = img.src; // Keep the URL for preview
  
  return {
    id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    file,
    previewUrl,
    width: img.naturalWidth,
    height: img.naturalHeight,
    size: file.size,
    rotation: 0,
    name: file.name,
    type: file.type,
  };
};

// Applies rotation to an image via Canvas and returns a new Blob (PNG/JPEG)
// This is needed because pdf-lib's native rotation rotates around the corner, 
// which complicates positioning. Baking the rotation into the image is easier.
export const getRotatedImageBlob = async (
  imageSrc: string, 
  rotation: number, 
  type: string = 'image/jpeg'
): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Calculate new dimensions based on rotation
      const isVertical = rotation === 90 || rotation === 270 || rotation === -90 || rotation === -270;
      canvas.width = isVertical ? img.height : img.width;
      canvas.height = isVertical ? img.width : img.height;

      // Translate and rotate
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      // Export as requested format (fallback to jpeg if webp which pdf-lib doesn't support directly)
      const exportType = type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = exportType === 'image/jpeg' ? 0.95 : undefined; // High quality
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob"));
          return;
        }
        blob.arrayBuffer().then(buffer => {
          resolve(new Uint8Array(buffer));
        });
      }, exportType, quality);
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
};
