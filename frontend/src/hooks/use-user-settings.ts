import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, type UpdateProfilePayload, type ChangePasswordPayload, type SetPasswordPayload, type NotificationPreferences, type Verify2FAPayload } from '@/lib/api/services/user.service'
import { toast } from 'sonner'

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update profile')
    },
  })
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userService.changePassword(payload),
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to change password')
    },
  })
}

/**
 * Hook to set password (for OAuth users who don't have a password)
 */
export function useSetPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SetPasswordPayload) => userService.setPassword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      toast.success('Password set successfully. You can now login with email and password.')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to set password')
    },
  })
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      userService.updateNotificationPreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.success('Notification preferences updated')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update preferences')
    },
  })
}

/**
 * Hook to enable 2FA
 */
export function useEnable2FA() {
  return useMutation({
    mutationFn: () => userService.enable2FA(),
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to enable 2FA')
    },
  })
}

/**
 * Hook to verify and complete 2FA setup
 */
export function useVerify2FA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Verify2FAPayload) => userService.verify2FA(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      toast.success('Two-factor authentication enabled')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Invalid verification code')
    },
  })
}

/**
 * Hook to disable 2FA
 */
export function useDisable2FA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => userService.disable2FA(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      toast.success('Two-factor authentication disabled')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to disable 2FA')
    },
  })
}
