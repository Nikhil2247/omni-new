import { useQuery } from '@tanstack/react-query'
import { userService } from '@/lib/api/services/user.service'

const userProfileKeys = {
  all: ['user-profile'] as const,
  addresses: ['user-addresses'] as const,
}

export function useUserProfile() {
  return useQuery({
    queryKey: userProfileKeys.all,
    queryFn: () => userService.getProfile(),
  })
}

export function useUserAddresses() {
  return useQuery({
    queryKey: userProfileKeys.addresses,
    queryFn: () => userService.getAddresses(),
  })
}
