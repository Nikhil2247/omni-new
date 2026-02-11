import { useQuery } from '@tanstack/react-query'
import { publicService } from '@/lib/api/services/public.service'

const publicKeys = {
  systemStatus: () => ['public-system-status'] as const,
}

export function useSystemStatus() {
  return useQuery({
    queryKey: publicKeys.systemStatus(),
    queryFn: () => publicService.getSystemStatus(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}