'use client'

import { useEffect, useMemo, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cropAndResizeImageFile } from '@/lib/utils/image-processing'

export interface ImageCropperDialogProps {
  open: boolean
  file: File | null
  title: string
  description?: string
  aspect: number
  outputWidth: number
  outputHeight: number
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File, previewUrl: string) => void | Promise<void>
  cropShape?: 'rect' | 'round'
}

export function ImageCropperDialog({
  open,
  file,
  title,
  description,
  aspect,
  outputWidth,
  outputHeight,
  onOpenChange,
  onConfirm,
  cropShape = 'rect',
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const sourceUrl = useMemo(() => {
    if (!file) return ''
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => {
      if (sourceUrl.startsWith('blob:')) {
        URL.revokeObjectURL(sourceUrl)
      }
    }
  }, [sourceUrl])

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
      setIsProcessing(false)
    }
  }, [open])

  const handleConfirm = async () => {
    if (!file || !croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const processedFile = await cropAndResizeImageFile(file, croppedAreaPixels, {
        outputWidth,
        outputHeight,
      })
      const previewUrl = URL.createObjectURL(processedFile)
      await onConfirm(processedFile, previewUrl)
      onOpenChange(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative h-80 w-full overflow-hidden rounded-lg border bg-muted">
            {sourceUrl ? (
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                onZoomChange={setZoom}
                cropShape={cropShape}
                showGrid={true}
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Zoom</Label>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(values) => setZoom(values[0] || 1)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!file || !croppedAreaPixels || isProcessing}>
            {isProcessing ? 'Processing...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
