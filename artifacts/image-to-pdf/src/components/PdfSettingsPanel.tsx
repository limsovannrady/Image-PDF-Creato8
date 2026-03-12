import { FileText, LayoutTemplate, Maximize, Settings2 } from 'lucide-react';
import type { PdfSettings } from '@/lib/pdf-generator';
import { cn } from '@/lib/utils';

interface PdfSettingsPanelProps {
  settings: PdfSettings;
  onChange: (settings: PdfSettings) => void;
}

export function PdfSettingsPanel({ settings, onChange }: PdfSettingsPanelProps) {
  const updateSetting = <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <Settings2 className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold">Document Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Page Size */}
        <div className="space-y-4">
          <Label className="text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" /> Page Size
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(['a4', 'letter', 'legal', 'original'] as const).map((size) => (
              <button
                key={size}
                onClick={() => updateSetting('pageSize', size)}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-2",
                  settings.pageSize === size
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-transparent bg-muted/50 hover:bg-muted text-foreground"
                )}
              >
                {size === 'a4' ? 'A4' : size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orientation */}
        <div className="space-y-4">
          <Label className="text-muted-foreground flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" /> Orientation
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(['portrait', 'landscape'] as const).map((ori) => (
              <button
                key={ori}
                onClick={() => updateSetting('orientation', ori)}
                disabled={settings.pageSize === 'original'}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-2",
                  settings.pageSize === 'original' && "opacity-50 cursor-not-allowed",
                  settings.orientation === ori
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-transparent bg-muted/50 hover:bg-muted text-foreground"
                )}
              >
                {ori.charAt(0).toUpperCase() + ori.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Margins */}
        <div className="space-y-4">
          <Label className="text-muted-foreground flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current rounded-sm p-0.5"><div className="w-full h-full bg-current opacity-30"/></div> 
            Margins
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(['none', 'small', 'medium', 'large'] as const).map((margin) => (
              <button
                key={margin}
                onClick={() => updateSetting('margins', margin)}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-2",
                  settings.margins === margin
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-transparent bg-muted/50 hover:bg-muted text-foreground"
                )}
              >
                {margin.charAt(0).toUpperCase() + margin.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Scaling */}
        <div className="space-y-4">
          <Label className="text-muted-foreground flex items-center gap-2">
            <Maximize className="w-4 h-4" /> Scaling
          </Label>
          <div className="flex flex-col gap-2">
            {(['fit', 'fill', 'original'] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => updateSetting('scaling', scale)}
                disabled={settings.pageSize === 'original'}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 text-left",
                  settings.pageSize === 'original' && "opacity-50 cursor-not-allowed",
                  settings.scaling === scale
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-transparent bg-muted/50 hover:bg-muted text-foreground"
                )}
              >
                {scale === 'fit' && "Fit to Page (No crop)"}
                {scale === 'fill' && "Fill Page (May crop)"}
                {scale === 'original' && "Keep Original Pixels"}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {settings.pageSize === 'original' && (
        <p className="mt-4 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg flex items-center gap-2">
          When Page Size is "Original", orientation and scaling settings are ignored. The PDF pages will perfectly match your image dimensions.
        </p>
      )}
    </div>
  );
}

function Label({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <label className={cn("text-sm font-semibold uppercase tracking-wider", className)}>
      {children}
    </label>
  );
}
