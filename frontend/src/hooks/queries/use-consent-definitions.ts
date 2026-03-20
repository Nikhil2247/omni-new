// ============================================================================
// USE CONSENT DEFINITIONS - React Query Hooks for Consent Definitions
// ============================================================================

import { useQuery } from '@tanstack/react-query'
import { publicService } from '@/lib/api/services/public.service'
import type { ConsentType } from '@/lib/api/types/business.types'

export const consentDefinitionKeys = {
  all: ['consent-definitions'] as const,
  users: () => [...consentDefinitionKeys.all, 'users'] as const,
  vendors: () => [...consentDefinitionKeys.all, 'vendors'] as const,
  required: (type: 'user' | 'vendor') =>
    [...consentDefinitionKeys.all, 'required', type] as const,
  byType: (type: ConsentType, version?: string) =>
    [...consentDefinitionKeys.all, 'type', type, version] as const,
  byId: (id: string) => [...consentDefinitionKeys.all, 'id', id] as const,
}

/**
 * Get all consent definitions for users
 */
export function useUserConsentDefinitions() {
  return useQuery({
    queryKey: consentDefinitionKeys.users(),
    queryFn: publicService.getUserConsentDefinitions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Get all consent definitions for vendors
 */
export function useVendorConsentDefinitions() {
  return useQuery({
    queryKey: consentDefinitionKeys.vendors(),
    queryFn: publicService.getVendorConsentDefinitions,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Get required consent definitions
 */
export function useRequiredConsentDefinitions(type: 'user' | 'vendor' = 'user') {
  return useQuery({
    queryKey: consentDefinitionKeys.required(type),
    queryFn: () => publicService.getRequiredConsentDefinitions(type),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Get a specific consent definition by type
 */
export function useConsentDefinitionByType(
  consentType: ConsentType,
  version?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: consentDefinitionKeys.byType(consentType, version),
    queryFn: () => publicService.getConsentDefinitionByType(consentType, version),
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Get a specific consent definition by ID
 */
export function useConsentDefinitionById(id: string, enabled = true) {
  return useQuery({
    queryKey: consentDefinitionKeys.byId(id),
    queryFn: () => publicService.getConsentDefinitionById(id),
    enabled: !!id && enabled,
    staleTime: 1000 * 60 * 5,
  })
}
