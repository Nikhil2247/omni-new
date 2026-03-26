// ============================================================================
// E-INVITE HOOKS
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { einviteService } from '@/lib/api/services/einvite.service';
import type {
  EInviteCategory,
  CreateEInviteInput,
  UpdateEInviteInput,
  SendEInviteInput,
  BulkSendEInviteInput,
} from '@/lib/api/types/einvite.types';

// Query Keys
export const einviteKeys = {
  all: ['einvites'] as const,
  templates: (category?: EInviteCategory) => [...einviteKeys.all, 'templates', category] as const,
  template: (id: string) => [...einviteKeys.all, 'template', id] as const,
  byEvent: (eventId: string) => [...einviteKeys.all, 'event', eventId] as const,
  byId: (id: string) => [...einviteKeys.all, id] as const,
  sentHistory: (id: string) => [...einviteKeys.all, id, 'sent'] as const,
  public: (shareCode: string) => [...einviteKeys.all, 'public', shareCode] as const,
};

// ============================================================================
// TEMPLATE HOOKS
// ============================================================================

export function useEInviteTemplates(category?: EInviteCategory) {
  return useQuery({
    queryKey: einviteKeys.templates(category),
    queryFn: () => einviteService.getTemplates(category),
    staleTime: 5 * 60 * 1000, // Templates don't change often
  });
}

export function useEInviteTemplate(id: string) {
  return useQuery({
    queryKey: einviteKeys.template(id),
    queryFn: () => einviteService.getTemplateById(id),
    enabled: !!id,
  });
}

// ============================================================================
// E-INVITE CRUD HOOKS
// ============================================================================

export function useEInviteByEvent(eventId: string) {
  return useQuery({
    queryKey: einviteKeys.byEvent(eventId),
    queryFn: () => einviteService.getByEventId(eventId),
    enabled: !!eventId,
  });
}

export function useEInvite(id: string) {
  return useQuery({
    queryKey: einviteKeys.byId(id),
    queryFn: () => einviteService.getById(id),
    enabled: !!id,
  });
}

export function useCreateEInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEInviteInput) => einviteService.create(input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: einviteKeys.byEvent(variables.eventId) });
      queryClient.setQueryData(einviteKeys.byId(data.id), data);
    },
  });
}

export function useUpdateEInvite(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEInviteInput) => einviteService.update(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(einviteKeys.byId(id), data);
      queryClient.invalidateQueries({ queryKey: einviteKeys.byEvent(data.eventId) });
    },
  });
}

export function useDeleteEInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => einviteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: einviteKeys.all });
    },
  });
}

// ============================================================================
// PUBLISH HOOKS
// ============================================================================

export function usePublishEInvite(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => einviteService.publish(id),
    onSuccess: (data) => {
      queryClient.setQueryData(einviteKeys.byId(id), data);
      queryClient.invalidateQueries({ queryKey: einviteKeys.byEvent(data.eventId) });
    },
  });
}

export function useUnpublishEInvite(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => einviteService.unpublish(id),
    onSuccess: (data) => {
      queryClient.setQueryData(einviteKeys.byId(id), data);
      queryClient.invalidateQueries({ queryKey: einviteKeys.byEvent(data.eventId) });
    },
  });
}

export function useRegenerateShareCode(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => einviteService.regenerateShareCode(id),
    onSuccess: (data) => {
      queryClient.setQueryData(einviteKeys.byId(id), data);
    },
  });
}

// ============================================================================
// SEND HOOKS
// ============================================================================

export function useSendEInvite(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendEInviteInput) => einviteService.sendToGuests(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: einviteKeys.sentHistory(id) });
      queryClient.invalidateQueries({ queryKey: einviteKeys.byId(id) });
    },
  });
}

export function useBulkSendEInvite(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkSendEInviteInput) => einviteService.sendToAllGuests(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: einviteKeys.sentHistory(id) });
      queryClient.invalidateQueries({ queryKey: einviteKeys.byId(id) });
    },
  });
}

export function useEInviteSentHistory(id: string) {
  return useQuery({
    queryKey: einviteKeys.sentHistory(id),
    queryFn: () => einviteService.getSentHistory(id),
    enabled: !!id,
  });
}

// ============================================================================
// PUBLIC HOOKS
// ============================================================================

export function usePublicEInvite(shareCode: string) {
  return useQuery({
    queryKey: einviteKeys.public(shareCode),
    queryFn: () => einviteService.viewByShareCode(shareCode),
    enabled: !!shareCode,
    retry: false,
  });
}

export function useTrackEInviteView() {
  return useMutation({
    mutationFn: ({ shareCode, guestId }: { shareCode: string; guestId?: string }) =>
      einviteService.trackView(shareCode, guestId),
  });
}
