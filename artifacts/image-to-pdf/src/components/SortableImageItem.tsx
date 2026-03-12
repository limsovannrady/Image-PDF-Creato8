import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProcessedImage } from '@/lib/image-processing';
import { formatBytes } from '@/lib/utils';
import { GripHorizontal, RotateCw, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface SortableImageItemProps {
  image: ProcessedImage;
  index: number;
  onRemove: (id: string) => void;
  onRotate: (id: string, direction: 'cw' | 'ccw') => void;
}

export function SortableImageItem({ image, index, onRemove, onRotate }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden transition-all duration-200",
        isDragging && "shadow-2xl shadow-primary/20 border-primary/50 opacity-90 scale-105"
      )}
    >
      {/* Drag Handle & Page Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div 
          {...attributes} 
          {...listeners}
          className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white cursor-grab active:cursor-grabbing hover:bg-black/60 transition-colors"
        >
          <GripHorizontal className="w-4 h-4" />
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white text-xs font-bold font-display">
          Pg {index + 1}
        </div>
      </div>

      {/* Image Preview Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30 flex items-center justify-center p-4">
        {/* We apply rotation via CSS for instant feedback, real rotation happens in PDF generation */}
        <img 
          src={image.previewUrl} 
          alt={image.name}
          className="max-w-full max-h-full object-contain drop-shadow-md transition-transform duration-300"
          style={{ transform: `rotate(${image.rotation}deg)` }}
        />
        
        {/* Action Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 z-10 backdrop-blur-[2px]">
          <Button 
            size="icon" 
            variant="glass" 
            className="rounded-full w-10 h-10"
            onClick={() => onRotate(image.id, 'ccw')}
            title="Rotate Left"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </Button>
          <Button 
            size="icon" 
            variant="glass" 
            className="rounded-full w-10 h-10"
            onClick={() => onRotate(image.id, 'cw')}
            title="Rotate Right"
          >
            <RotateCw className="w-4 h-4 text-white" />
          </Button>
          <Button 
            size="icon" 
            variant="destructive" 
            className="rounded-full w-10 h-10 shadow-lg"
            onClick={() => onRemove(image.id)}
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Image Metadata */}
      <div className="p-4 border-t border-border/50 bg-card/50">
        <p className="text-sm font-semibold truncate text-foreground mb-1" title={image.name}>
          {image.name}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{image.width} × {image.height}</span>
          <span>{formatBytes(image.size)}</span>
        </div>
      </div>
    </div>
  );
}
