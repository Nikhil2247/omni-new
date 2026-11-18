'use client'

import { useState, useCallback, useRef } from 'react'
import NextImage from 'next/image'
import { useDropzone, type Accept } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Progress } from './progress'
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

export interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: Accept
  maxFiles?: number
  maxSize?: number // in bytes
  multiple?: boolean
  disabled?: boolean
  className?: string
  showPreview?: boolean
  autoUpload?: boolean
  uploadButtonLabel?: string
  children?: React.ReactNode
}

export interface UploadedFilePreview {
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function FileUpload({
  onUpload,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'],
  },
  maxFiles = 10,
  maxSize = 25 * 1024 * 1024, // 25MB
  multiple = true,
  disabled = false,
  className,
  showPreview = true,
  autoUpload = true,
  uploadButtonLabel = 'Upload Selected',
  children,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFilePreview[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const uploadFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (!selectedFiles.length) return

      setIsUploading(true)

      try {
        setFiles((prev) =>
          prev.map((filePreview) =>
            selectedFiles.includes(filePreview.file)
              ? { ...filePreview, status: 'uploading' as const, progress: 30, error: undefined }
              : filePreview,
          ),
        )

        await onUpload(selectedFiles)

        setFiles((prev) =>
          prev.map((filePreview) =>
            selectedFiles.includes(filePreview.file)
              ? { ...filePreview, status: 'success' as const, progress: 100, error: undefined }
              : filePreview,
          ),
        )

        setTimeout(() => {
          setFiles((prev) => prev.filter((filePreview) => filePreview.status !== 'success'))
        }, 2000)
      } catch (error) {
        setFiles((prev) =>
          prev.map((filePreview) =>
            selectedFiles.includes(filePreview.file)
              ? {
                  ...filePreview,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : filePreview,
          ),
        )
      } finally {
        setIsUploading(false)
      }
    },
    [onUpload],
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      // Create preview items
      const newFiles: UploadedFilePreview[] = acceptedFiles.map((file) => ({
        file,
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
        progress: 0,
        status: 'pending' as const,
      }))

      setFiles((prev) => [...prev, ...newFiles])

      if (autoUpload) {
        await uploadFiles(acceptedFiles)
      }
    },
    [autoUpload, uploadFiles]
  )

  const hasPendingUploads = files.some((filePreview) => filePreview.status === 'pending' || filePreview.status === 'error')

  const handleManualUpload = async () => {
    const pendingFiles = files
      .filter((filePreview) => filePreview.status === 'pending' || filePreview.status === 'error')
      .map((filePreview) => filePreview.file)

    await uploadFiles(pendingFiles)
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    multiple,
    disabled: disabled || isUploading,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      if (newFiles[index]?.preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
    if (file.type.startsWith('video/')) return <Video className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          !isDragActive && !isDragReject && 'border-muted-foreground/25 hover:border-primary/50',
          (disabled || isUploading) && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />

        {children || (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              {isUploading ? (
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
              ) : (
                <Upload className="h-7 w-7 text-primary" />
              )}
            </div>
            <p className="text-sm font-medium text-center">
              {isDragActive
                ? isDragReject
                  ? 'Some files are not allowed'
                  : 'Drop files here...'
                : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </>
        )}
      </div>

      {!autoUpload && hasPendingUploads && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleManualUpload}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              uploadButtonLabel
            )}
          </Button>
        </div>
      )}

      {/* File previews */}
      {showPreview && files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((item, index) => (
            <div
              key={`${item.file.name}-${index}`}
              className="relative rounded-lg border bg-card overflow-hidden"
            >
              {/* Preview image or icon */}
              <div className="aspect-square bg-muted flex items-center justify-center">
                {item.preview ? (
                  <NextImage
                    src={item.preview}
                    alt={item.file.name}
                    width={400}
                    height={400}
                    unoptimized={true}
                    priority={true}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {getFileIcon(item.file)}
                    <span className="text-xs">
                      {item.file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Status overlay */}
              {item.status !== 'pending' && (
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center bg-black/50',
                    item.status === 'success' && 'bg-success/20',
                    item.status === 'error' && 'bg-destructive/20'
                  )}
                >
                  {item.status === 'uploading' && (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  )}
                </div>
              )}

              {/* File info */}
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(item.file.size)}
                </p>
                {item.status === 'uploading' && (
                  <Progress value={item.progress} className="h-1 mt-1" />
                )}
                {item.status === 'error' && item.error && (
                  <p className="text-xs text-destructive mt-1">{item.error}</p>
                )}
              </div>

              {/* Remove button */}
              {item.status !== 'uploading' && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Simple inline file input component
export function FileInput({
  onChange,
  accept,
  multiple = false,
  disabled = false,
  className,
  children,
}: {
  onChange: (files: FileList | null) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => onChange(e.target.files)}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={className}
        onClick={() => inputRef.current?.click()}
      >
        {children || (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </>
        )}
      </Button>
    </>
  )
}
