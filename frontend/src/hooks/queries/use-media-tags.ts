import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mediaTagService } from '@/lib/api/services/media-tag.service'
import type { AddMediaTagsPayload, RemoveMediaTagPayload, MediaTag } from '@/lib/api/types/media-tag.types'

export const mediaTagKeys = {
  all: ['media-tags'] as const,
  list: (query?: string) => [...mediaTagKeys.all, 'list', query || ''] as const,
  media: (mediaItemId: string) => [...mediaTagKeys.all, 'media', mediaItemId] as const,
}

export function useMediaTags(query?: string) {
  return useQuery<MediaTag[]>({
    queryKey: mediaTagKeys.list(query),
    queryFn: () => mediaTagService.list(query),
  })
}

export function useMediaItemTags(mediaItemId: string) {
  return useQuery<MediaTag[]>({
    queryKey: mediaTagKeys.media(mediaItemId),
    queryFn: () => mediaTagService.listForMedia(mediaItemId),
    enabled: !!mediaItemId,
  })
}

export function useAddMediaTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddMediaTagsPayload) => mediaTagService.add(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: mediaTagKeys.media(payload.mediaItemId) })
    },
  })
}

export function useRemoveMediaTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RemoveMediaTagPayload) => mediaTagService.remove(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: mediaTagKeys.media(payload.mediaItemId) })
    },
  })
}
