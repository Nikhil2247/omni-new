import { useQuery } from '@tanstack/react-query'
import { userService } from '@/lib/api/services/user.service'

const userProfileKeys = {
  all: ['user-profile'] as const,
}

export function useUserProfile() {
  return useQuery({
    queryKey: userProfileKeys.all,
    queryFn: () => userService.getProfile(),
  })
}
