import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { ProcessedImage } from '@/lib/image-processing';
import { SortableImageItem } from './SortableImageItem';
import { UploadZone } from './UploadZone';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageGridProps {
  images: ProcessedImage[];
  onReorder: (images: ProcessedImage[]) => void;
  onRemove: (id: string) => void;
  onRotate: (id: string, direction: 'cw' | 'ccw') => void;
  onFilesAdded: (files: File[]) => void;
}

export function ImageGrid({ images, onReorder, onRemove, onRotate, onFilesAdded }: ImageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires a 5px drag to initiate to allow clicks on buttons
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      onReorder(arrayMove(images, oldIndex, newIndex));
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Arrange Pages</h2>
          <p className="text-muted-foreground text-sm mt-1">Drag and drop to reorder. The first image will be page 1.</p>
        </div>
        <div className="text-sm font-medium bg-muted px-3 py-1.5 rounded-full">
          {images.length} {images.length === 1 ? 'Image' : 'Images'}
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={images.map(img => img.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <SortableImageItem
                    image={image}
                    index={index}
                    onRemove={onRemove}
                    onRotate={onRotate}
                  />
                </motion.div>
              ))}
              
              {/* Always show compact upload zone at the end */}
              <motion.div
                key="add-more"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <UploadZone onFilesAdded={onFilesAdded} compact />
              </motion.div>
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
