import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface UploadedFile {
  originalName: string
  filename: string
  path: string
  size: number
  mimeType: string
  bucket: string
  url: string
  thumbnailUrl?: string
  thumbnailPath?: string
  width?: number
  height?: number
  metadata?: Record<string, string>
}

export interface UploadOptions {
  category: string
  generateThumbnail?: boolean
  quality?: number
  maxWidth?: number
  maxHeight?: number
  metadata?: Record<string, string>
}

export interface PresignedUrlResponse {
  uploadUrl: string
  filePath: string
  fileUrl: string
}

export const uploadService = {
  /**
   * Upload a single image file with automatic WebP conversion
   */
  uploadImage: async (
    file: File,
    options: UploadOptions
  ): Promise<UploadedFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', options.category)

    if (options.generateThumbnail !== undefined) {
      formData.append('generateThumbnail', String(options.generateThumbnail))
    }
    if (options.quality !== undefined) {
      formData.append('quality', String(options.quality))
    }
    if (options.maxWidth !== undefined) {
      formData.append('maxWidth', String(options.maxWidth))
    }
    if (options.maxHeight !== undefined) {
      formData.append('maxHeight', String(options.maxHeight))
    }
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata))
    }

    const { data } = await apiClient.post<UploadedFile>(
      API_ENDPOINTS.UPLOAD.IMAGE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return data
  },

  /**
   * Upload multiple image files with automatic WebP conversion
   */
  uploadImages: async (
    files: File[],
    options: UploadOptions
  ): Promise<UploadedFile[]> => {
    const formData = new FormData()

    files.forEach((file) => {
      formData.append('files', file)
    })

    formData.append('category', options.category)

    if (options.generateThumbnail !== undefined) {
      formData.append('generateThumbnail', String(options.generateThumbnail))
    }
    if (options.quality !== undefined) {
      formData.append('quality', String(options.quality))
    }
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata))
    }

    const { data } = await apiClient.post<UploadedFile[]>(
      `${API_ENDPOINTS.UPLOAD.IMAGE}/multiple`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return data
  },

  /**
   * Upload a generic file (non-image)
   */
  uploadFile: async (
    file: File,
    options: UploadOptions
  ): Promise<UploadedFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', options.category)

    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata))
    }

    const { data } = await apiClient.post<UploadedFile>(
      API_ENDPOINTS.UPLOAD.FILE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return data
  },

  /**
   * Get a presigned URL for direct browser upload
   */
  getPresignedUrl: async (
    filename: string,
    mimeType: string,
    category: string
  ): Promise<PresignedUrlResponse> => {
    const { data } = await apiClient.post<PresignedUrlResponse>(
      API_ENDPOINTS.UPLOAD.PRESIGNED,
      {
        filename,
        mimeType,
        category,
      }
    )

    return data
  },

  /**
   * Upload directly to presigned URL (for large files)
   */
  uploadToPresignedUrl: async (
    uploadUrl: string,
    file: File
  ): Promise<void> => {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })
  },
}
