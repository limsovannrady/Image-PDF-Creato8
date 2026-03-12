import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  compact?: boolean;
}

export function UploadZone({ onFilesAdded, compact = false }: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesAdded(acceptedFiles);
    }
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer group flex items-center justify-center p-6 h-full min-h-[200px]",
          isDragActive ? "border-primary bg-primary/5" : "border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-primary/50",
          isDragReject && "border-destructive bg-destructive/5"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-background shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Add More Images
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer group",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.02] shadow-xl shadow-primary/10" 
            : "border-border hover:border-primary/50 bg-card hover:bg-primary/5 hover:shadow-lg",
          isDragReject && "border-destructive bg-destructive/5"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center z-10 relative">
          <motion.div 
            animate={{ y: isDragActive ? -10 : 0 }}
            className="w-20 h-20 mb-6 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
          >
            {isDragActive ? (
              <UploadCloud className="w-10 h-10" />
            ) : (
              <ImageIcon className="w-10 h-10" />
            )}
          </motion.div>
          
          <h3 className="text-2xl font-bold mb-3 text-foreground">
            {isDragActive ? "Drop images here..." : "Drag & drop images here"}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Upload JPG, PNG, or WEBP images. Up to 50MB per file. 
            High-quality processing guaranteed.
          </p>
          
          <div className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:scale-105 transition-all">
            Browse Files
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </motion.div>
  );
}
