import { useCallback, useState, useRef } from 'react'
import { cn } from '~/lib/utils'

interface DropZoneProps {
  accept: string
  label: string
  description: string
  onFile: (file: File) => void
  file: File | null
  isLoading?: boolean
}

export function DropZone({
  accept,
  label,
  description,
  onFile,
  file,
  isLoading,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) onFile(droppedFile)
    },
    [onFile],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) onFile(selectedFile)
    },
    [onFile],
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
        isDragOver && 'border-primary bg-primary/10',
        !isDragOver && !file && 'border-border hover:border-muted-foreground',
        file && 'border-secondary bg-secondary/10',
        isLoading && 'pointer-events-none opacity-50',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Processing...</p>
      ) : file ? (
        <div className="text-center">
          <p className="text-sm font-medium text-secondary">{file.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(file.size / (1024 * 1024)).toFixed(1)} MB
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      )}
    </div>
  )
}
