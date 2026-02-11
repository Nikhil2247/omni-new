import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { onboardingService } from '@/lib/api/services/onboarding.service'
import { useAuthStore } from '@/store/auth-store'
import type {
  SubmitVibeQuizInput,
  CreateWeddingIdentityInput,
  UpdateWeddingIdentityInput,
  InvitePartnerInput,
} from '@/lib/api/types/onboarding.types'

const onboardingKeys = {
  all: ['onboarding'] as const,
  status: () => [...onboardingKeys.all, 'status'] as const,
  vibeQuiz: () => [...onboardingKeys.all, 'vibe-quiz'] as const,
  vibeQuizImages: () => [...onboardingKeys.vibeQuiz(), 'images'] as const,
  vibeQuizStatus: () => [...onboardingKeys.vibeQuiz(), 'status'] as const,
  weddingIdentity: () => [...onboardingKeys.all, 'wedding-identity'] as const,
}

// Onboarding Status
export function useOnboardingStatus() {
  return useQuery({
    queryKey: onboardingKeys.status(),
    queryFn: () => onboardingService.getOnboardingStatus(),
  })
}

// Vibe Quiz
export function useVibeQuizImages() {
  return useQuery({
    queryKey: onboardingKeys.vibeQuizImages(),
    queryFn: () => onboardingService.getVibeQuizImages(),
  })
}

export function useVibeQuizStatus() {
  return useQuery({
    queryKey: onboardingKeys.vibeQuizStatus(),
    queryFn: () => onboardingService.getVibeQuizStatus(),
  })
}

export function useSubmitVibeQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SubmitVibeQuizInput) => onboardingService.submitVibeQuiz(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.vibeQuizStatus() })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status() })
    },
  })
}

// Wedding Identity
export function useWeddingIdentity() {
  const { isAuthenticated, hasHydrated } = useAuthStore()
  return useQuery({
    queryKey: onboardingKeys.weddingIdentity(),
    queryFn: () => onboardingService.getWeddingIdentity(),
    enabled: hasHydrated && isAuthenticated,
  })
}

export function useCreateWeddingIdentity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateWeddingIdentityInput) => onboardingService.createWeddingIdentity(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.weddingIdentity() })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status() })
    },
  })
}

export function useUpdateWeddingIdentity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateWeddingIdentityInput) => onboardingService.updateWeddingIdentity(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.weddingIdentity() })
    },
  })
}

export function useInvitePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: InvitePartnerInput) => onboardingService.invitePartner(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.weddingIdentity() })
    },
  })
}

export function useAcceptPartnerInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => onboardingService.acceptPartnerInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.weddingIdentity() })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status() })
    },
  })
}
