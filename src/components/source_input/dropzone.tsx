import { useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface DropZoneProps {
  onDrop: (files: File[]) => void
}

export function DropZone({ onDrop }: DropZoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      onDrop(acceptedFiles)
    },
    [onDrop]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/json": [".json"],
      "text/csv": [".csv"]
    }
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-muted-foreground">Drop the files here ...</p>
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground">Drag and drop files here, or click to select files</p>
          <p className="text-sm text-muted-foreground">Supported formats: .txt, .md, .json, .csv</p>
        </div>
      )}
    </div>
  )
} 