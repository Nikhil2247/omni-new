'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { publicService } from '@/lib/api/services/public.service'
import type { PortfolioMediaSearchParams } from '@/lib/api/types/portfolio-media.types'

interface UseInfiniteMediaOptions extends Omit<PortfolioMediaSearchParams, 'page'> {
  enabled?: boolean
}

export function useInfiniteMedia(options: UseInfiniteMediaOptions = {}) {
  const { enabled = true, limit = 20, ...params } = options

  const query = useInfiniteQuery({
    queryKey: ['discovery-media', 'infinite', params, limit],
    queryFn: async ({ pageParam = 1 }) => {
      return publicService.getDiscoveryMedia({
        ...params,
        page: pageParam,
        limit,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNextPage) {
        return lastPage.meta.page + 1
      }
      return undefined
    },
    enabled,
  })

  // Flatten all pages into a single array
  const items = query.data?.pages.flatMap((page) => page.data) ?? []

  // Total count from the first page
  const total = query.data?.pages[0]?.meta.total ?? 0

  return {
    ...query,
    items,
    total,
  }
}

// Hook that combines infinite query with intersection observer
export function useInfiniteMediaWithIntersection(options: UseInfiniteMediaOptions = {}) {
  const infiniteQuery = useInfiniteMedia(options)

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  })

  useEffect(() => {
    if (inView && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
      infiniteQuery.fetchNextPage()
    }
  }, [inView, infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, infiniteQuery.fetchNextPage])

  return {
    ...infiniteQuery,
    loadMoreRef: ref,
  }
}
