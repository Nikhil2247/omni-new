export type CropAreaPixels = {
  x: number
  y: number
  width: number
  height: number
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = src
  })

const getOutputType = (inputType?: string) => {
  if (inputType === 'image/png') return 'image/png'
  if (inputType === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

const getOutputName = (fileName: string, outputType: string) => {
  const base = fileName.replace(/\.[^/.]+$/, '')
  if (outputType === 'image/png') return `${base}.png`
  if (outputType === 'image/webp') return `${base}.webp`
  return `${base}.jpg`
}

export const resizeImageFile = async (
  file: File,
  options: {
    maxWidth: number
    maxHeight: number
    quality?: number
  },
) => {
  const { maxWidth, maxHeight, quality = 0.9 } = options
  const src = await readFileAsDataUrl(file)
  const image = await loadImage(src)

  const widthRatio = maxWidth / image.width
  const heightRatio = maxHeight / image.height
  const ratio = Math.min(widthRatio, heightRatio, 1)

  const targetWidth = Math.max(1, Math.round(image.width * ratio))
  const targetHeight = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Failed to process image')

  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const outputType = getOutputType(file.type)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, quality),
  )

  if (!blob) throw new Error('Failed to process image')

  return new File([blob], getOutputName(file.name, outputType), {
    type: outputType,
    lastModified: Date.now(),
  })
}

export const cropAndResizeImageFile = async (
  file: File,
  cropAreaPixels: CropAreaPixels,
  options: {
    outputWidth: number
    outputHeight: number
    quality?: number
  },
) => {
  const { outputWidth, outputHeight, quality = 0.9 } = options
  const src = await readFileAsDataUrl(file)
  const image = await loadImage(src)

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Failed to process image')

  context.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    outputWidth,
    outputHeight,
  )

  const outputType = getOutputType(file.type)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, quality),
  )

  if (!blob) throw new Error('Failed to process image')

  return new File([blob], getOutputName(file.name, outputType), {
    type: outputType,
    lastModified: Date.now(),
  })
}
