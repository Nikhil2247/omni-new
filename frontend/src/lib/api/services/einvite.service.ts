// ============================================================================
// E-INVITE SERVICE
// ============================================================================

import { apiClient } from '../client';
import type {
  EInvite,
  EInviteTemplate,
  EInviteSent,
  EInviteCategory,
  CreateEInviteInput,
  UpdateEInviteInput,
  SendEInviteInput,
  BulkSendEInviteInput,
  SendEInviteResponse,
  PublicEInvite,
} from '../types/einvite.types';

const USER_BASE = '/user/einvites';
const PUBLIC_BASE = '/public/einvites';

export const einviteService = {
  // ============================================================================
  // TEMPLATE ENDPOINTS
  // ============================================================================

  async getTemplates(category?: EInviteCategory): Promise<EInviteTemplate[]> {
    const params = category ? { category } : {};
    const { data } = await apiClient.get(`${USER_BASE}/templates`, { params });
    // Unwrap backend response format
    return (data?.data || data) as EInviteTemplate[];
  },

  async getTemplateById(id: string): Promise<EInviteTemplate> {
    const { data } = await apiClient.get(`${USER_BASE}/templates/${id}`);
    return (data?.data || data) as EInviteTemplate;
  },

  // ============================================================================
  // E-INVITE CRUD ENDPOINTS
  // ============================================================================

  async create(input: CreateEInviteInput): Promise<EInvite> {
    const { data } = await apiClient.post(USER_BASE, input);
    return (data?.data || data) as EInvite;
  },

  async getByEventId(eventId: string): Promise<EInvite | null> {
    try {
      const { data } = await apiClient.get(`${USER_BASE}/event/${eventId}`);
      return (data?.data || data) as EInvite | null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getById(id: string): Promise<EInvite> {
    const { data } = await apiClient.get(`${USER_BASE}/${id}`);
    return (data?.data || data) as EInvite;
  },

  async update(id: string, input: UpdateEInviteInput): Promise<EInvite> {
    const { data } = await apiClient.patch(`${USER_BASE}/${id}`, input);
    return (data?.data || data) as EInvite;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${USER_BASE}/${id}`);
  },

  // ============================================================================
  // PUBLISH ENDPOINTS
  // ============================================================================

  async publish(id: string): Promise<EInvite> {
    const { data } = await apiClient.post(`${USER_BASE}/${id}/publish`);
    return (data?.data || data) as EInvite;
  },

  async unpublish(id: string): Promise<EInvite> {
    const { data } = await apiClient.post(`${USER_BASE}/${id}/unpublish`);
    return (data?.data || data) as EInvite;
  },

  async regenerateShareCode(id: string): Promise<EInvite> {
    const { data } = await apiClient.post(`${USER_BASE}/${id}/regenerate-code`);
    return (data?.data || data) as EInvite;
  },

  // ============================================================================
  // SEND ENDPOINTS
  // ============================================================================

  async sendToGuests(id: string, input: SendEInviteInput): Promise<EInviteSent[]> {
    const { data } = await apiClient.post(`${USER_BASE}/${id}/send`, input);
    return (data?.data || data) as EInviteSent[];
  },

  async sendToAllGuests(id: string, input: BulkSendEInviteInput): Promise<SendEInviteResponse> {
    const { data } = await apiClient.post(`${USER_BASE}/${id}/send-all`, input);
    return (data?.data || data) as SendEInviteResponse;
  },

  async getSentHistory(id: string): Promise<EInviteSent[]> {
    const { data } = await apiClient.get(`${USER_BASE}/${id}/sent-history`);
    return (data?.data || data) as EInviteSent[];
  },

  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  async getPublicTemplates(category?: EInviteCategory): Promise<EInviteTemplate[]> {
    const params = category ? { category } : {};
    const { data } = await apiClient.get(`${PUBLIC_BASE}/templates`, { params });
    return (data?.data || data) as EInviteTemplate[];
  },

  async viewByShareCode(shareCode: string): Promise<PublicEInvite> {
    const { data } = await apiClient.get(`${PUBLIC_BASE}/view/${shareCode}`);
    return (data?.data || data) as PublicEInvite;
  },

  async trackView(shareCode: string, guestId?: string): Promise<void> {
    const params = guestId ? { guestId } : {};
    await apiClient.post(`${PUBLIC_BASE}/view/${shareCode}/track`, null, { params });
  },

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  getShareUrl(shareCode: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/einvite/${shareCode}`;
  },

  getWhatsAppShareUrl(shareCode: string, eventName?: string): string {
    const shareUrl = this.getShareUrl(shareCode);
    const message = eventName
      ? `You're invited to ${eventName}! View the invitation: ${shareUrl}`
      : `You're invited! View the invitation: ${shareUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  },
};
