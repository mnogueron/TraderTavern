import { useRef, useState, type DragEvent } from 'react';
import { RiUploadCloud2Line } from '@remixicon/react';
import { cn } from '@/lib/utils';

type FileDropzoneProps = {
  accept?: string;
  disabled?: boolean;
  label: string;
  hint?: string;
  onFileSelected: (file: File) => void;
};

const FileDropzone = ({
  accept,
  disabled,
  label,
  hint,
  onFileSelected,
}: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (disabled) {
      return;
    }
    const file = event.dataTransfer.files[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDraggingOver(true);
        }
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input px-4 py-8 text-center transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-accent/50',
        isDraggingOver && 'border-ring bg-accent/50',
      )}
    >
      <RiUploadCloud2Line className="size-6 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
          event.target.value = '';
        }}
      />
    </div>
  );
};

export default FileDropzone;
