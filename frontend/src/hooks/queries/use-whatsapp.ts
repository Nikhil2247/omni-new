import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { whatsappService } from '@/lib/api/services/whatsapp.service'
import type {
  SendWhatsAppInviteInput,
  SendWhatsAppBulkInput,
} from '@/lib/api/types/whatsapp.types'

const whatsappKeys = {
  all: ['whatsapp'] as const,
  templates: () => [...whatsappKeys.all, 'templates'] as const,
  history: (guestlistId: string) => [...whatsappKeys.all, 'history', guestlistId] as const,
  summary: (guestlistId: string) => [...whatsappKeys.all, 'summary', guestlistId] as const,
}

// Templates
export function useWhatsAppTemplates() {
  return useQuery({
    queryKey: whatsappKeys.templates(),
    queryFn: () => whatsappService.getTemplates(),
  })
}

// History
export function useWhatsAppHistory(guestlistId: string) {
  return useQuery({
    queryKey: whatsappKeys.history(guestlistId),
    queryFn: () => whatsappService.getHistory(guestlistId),
    enabled: !!guestlistId,
  })
}

// Summary
export function useWhatsAppSummary(guestlistId: string) {
  return useQuery({
    queryKey: whatsappKeys.summary(guestlistId),
    queryFn: () => whatsappService.getSummary(guestlistId),
    enabled: !!guestlistId,
  })
}

// Send Invite
export function useSendWhatsAppInvite(guestlistId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SendWhatsAppInviteInput) => whatsappService.sendInvite(input),
    onSuccess: () => {
      if (guestlistId) {
        queryClient.invalidateQueries({ queryKey: whatsappKeys.history(guestlistId) })
        queryClient.invalidateQueries({ queryKey: whatsappKeys.summary(guestlistId) })
      }
    },
  })
}

// Send Bulk Invites
export function useSendWhatsAppBulk(guestlistId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SendWhatsAppBulkInput) => whatsappService.sendBulkInvites(input),
    onSuccess: () => {
      if (guestlistId) {
        queryClient.invalidateQueries({ queryKey: whatsappKeys.history(guestlistId) })
        queryClient.invalidateQueries({ queryKey: whatsappKeys.summary(guestlistId) })
      }
    },
  })
}
