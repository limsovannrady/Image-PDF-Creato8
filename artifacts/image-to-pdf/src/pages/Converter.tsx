import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, ArrowRight, Download, RefreshCcw, FileCheck2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import { ImageGrid } from '@/components/ImageGrid';
import { PdfSettingsPanel } from '@/components/PdfSettingsPanel';
import { ProcessedImage, processUploadedFile } from '@/lib/image-processing';
import { generatePDF, PdfSettings } from '@/lib/pdf-generator';

export default function Converter() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // PDF Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<PdfSettings>({
    pageSize: 'a4',
    orientation: 'portrait',
    margins: 'none',
    scaling: 'fit'
  });

  const previewRef = useRef<HTMLDivElement>(null);

  // Clean up object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, []);

  const handleFilesAdded = async (files: File[]) => {
    setIsProcessing(true);
    try {
      const processed = await Promise.all(files.map(processUploadedFile));
      setImages(prev => [...prev, ...processed]);
      // If we had a generated PDF, clear it since we modified images
      if (pdfUrl) setPdfUrl(null);
    } catch (error) {
      toast({
        title: "Error processing images",
        description: "Some files could not be read. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = (id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return newImages;
    });
    if (pdfUrl) setPdfUrl(null);
  };

  const handleRotate = (id: string, direction: 'cw' | 'ccw') => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        let newRot = img.rotation + (direction === 'cw' ? 90 : -90);
        // Normalize rotation to 0, 90, 180, 270
        newRot = ((newRot % 360) + 360) % 360;
        return { ...img, rotation: newRot };
      }
      return img;
    }));
    if (pdfUrl) setPdfUrl(null);
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    
    setIsGenerating(true);
    setProgress(0);
    setPdfUrl(null);

    try {
      const url = await generatePDF(images, settings, (prog, status) => {
        setProgress(prog);
        setProgressStatus(status);
      });
      setPdfUrl(url);
      
      toast({
        title: "Success!",
        description: "Your PDF is ready to download.",
      });
      
      // Scroll down to the result
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setImages([]);
    setPdfUrl(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 rounded-b-3xl mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight text-foreground">
              Doc<span className="text-primary">Flow</span>
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Intro / Upload Section */}
        <AnimatePresence mode="wait">
          {images.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              className="max-w-3xl mx-auto pt-12 lg:pt-24 text-center space-y-10"
            >
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-extrabold font-display tracking-tight leading-tight">
                  Convert images to PDF <br className="hidden md:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">
                    in full resolution.
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Secure, private, and lightning fast. All processing happens entirely in your browser without uploading your files to any server.
                </p>
              </div>
              
              <UploadZone onFilesAdded={handleFilesAdded} />
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Workspace Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={resetAll} size="sm" className="rounded-full">
                    <RefreshCcw className="w-4 h-4 mr-2" /> Start Over
                  </Button>
                  <p className="text-sm text-muted-foreground font-medium">
                    Output Quality: <strong className="text-foreground">Full HD (300 DPI equivalent)</strong>
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full sm:w-auto shadow-xl shadow-primary/20"
                >
                  {isGenerating ? "Converting..." : "Convert to PDF"} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Grid */}
              <ImageGrid 
                images={images}
                onReorder={setImages}
                onRemove={handleRemove}
                onRotate={handleRotate}
                onFilesAdded={handleFilesAdded}
              />

              {/* Settings */}
              <PdfSettingsPanel settings={settings} onChange={setSettings} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Overlay & Result */}
        <AnimatePresence>
          {isGenerating && !pdfUrl && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-card p-8 rounded-3xl shadow-2xl border border-border max-w-md w-full space-y-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h3 className="text-2xl font-bold">Creating your PDF</h3>
                <p className="text-muted-foreground">{progressStatus}</p>
                
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {pdfUrl && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 bg-card rounded-3xl border border-border shadow-xl overflow-hidden flex flex-col lg:flex-row"
              ref={previewRef}
            >
              <div className="p-8 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-border bg-muted/10 flex flex-col justify-center text-center lg:text-left space-y-6">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mx-auto lg:mx-0">
                  <FileCheck2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">Ready!</h2>
                  <p className="text-muted-foreground">Your PDF has been generated successfully with zero quality loss.</p>
                </div>
                
                <div className="space-y-3 pt-4">
                  <Button size="lg" className="w-full text-lg h-14" asChild>
                    <a href={pdfUrl} download="converted-document.pdf">
                      <Download className="w-5 h-5 mr-2" /> Download PDF
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => {
                    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}>
                    View Preview
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted w-full lg:w-2/3 h-[600px] p-4 flex items-center justify-center relative">
                {/* Fallback styling around the iframe */}
                <iframe 
                  src={`${pdfUrl}#toolbar=0`} 
                  className="w-full h-full rounded-xl shadow-sm bg-white"
                  title="PDF Preview"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </main>
    </div>
  );
}
