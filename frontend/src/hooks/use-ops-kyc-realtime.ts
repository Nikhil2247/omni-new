// ============================================================================
// USE OPS KYC REALTIME - Real-time KYC Updates for Ops Dashboard
// ============================================================================
// Subscribes to WebSocket events for KYC updates and invalidates queries
// ============================================================================

'use client'

import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from '@/providers/websocket-provider'
import { opsKeys } from '@/hooks/queries/use-ops'
import { toast } from 'sonner'
import type { KycEvent } from '@/lib/websocket/notification-client'

interface UseOpsKycRealtimeOptions {
  /** Whether to show toast notifications for KYC events */
  showToasts?: boolean
  /** Custom callback for KYC events */
  onEvent?: (event: KycEvent) => void
}

/**
 * Hook for real-time KYC updates in the ops dashboard.
 * Subscribes to the ops:kyc room and invalidates queries when events occur.
 */
export function useOpsKycRealtime(options: UseOpsKycRealtimeOptions = {}) {
  const { showToasts = true, onEvent } = options
  const queryClient = useQueryClient()
  const { isConnected, subscribeToOpsKyc, unsubscribeFromOpsKyc, onKycEvent } = useWebSocket()

  const handleKycEvent = useCallback((event: KycEvent) => {
    console.log('[useOpsKycRealtime] KYC event received:', event)

    // Invalidate KYC queries to refresh data
    queryClient.invalidateQueries({ queryKey: opsKeys.kycList() })
    if (event.kycId) {
      queryClient.invalidateQueries({ queryKey: opsKeys.kycById(event.kycId) })
    }
    if (event.vendorProfileId) {
      queryClient.invalidateQueries({ queryKey: opsKeys.kyc(event.vendorProfileId) })
    }

    // Show toast notification
    if (showToasts) {
      switch (event.type) {
        case 'kyc:submitted':
          toast.info('New KYC Submission', {
            description: event.legalName
              ? `${event.legalName} has submitted their KYC documents for review.`
              : 'A vendor has submitted their KYC documents for review.',
          })
          break
        case 'kyc:created':
          toast.info('KYC Record Created', {
            description: 'A new KYC verification record has been created.',
          })
          break
        case 'kyc:approved':
          toast.success('KYC Approved', {
            description: event.legalName
              ? `KYC verification for ${event.legalName} has been approved.`
              : 'A KYC verification has been approved.',
          })
          break
        case 'kyc:rejected':
          toast.warning('KYC Rejected', {
            description: event.legalName
              ? `KYC verification for ${event.legalName} has been rejected.${event.rejectionReason ? ` Reason: ${event.rejectionReason}` : ''}`
              : 'A KYC verification has been rejected.',
          })
          break
        case 'kyc:document:uploaded':
          toast.info('KYC Document Uploaded', {
            description: event.documentType
              ? `A new ${event.documentType.toLowerCase().replace('_', ' ')} document has been uploaded.`
              : 'A new KYC document has been uploaded.',
          })
          break
      }
    }

    // Call custom callback if provided
    onEvent?.(event)
  }, [queryClient, showToasts, onEvent])

  useEffect(() => {
    if (!isConnected) {
      console.log('[useOpsKycRealtime] WebSocket not connected, waiting...')
      return
    }

    console.log('[useOpsKycRealtime] Subscribing to ops:kyc room')
    subscribeToOpsKyc()
    const unsubscribe = onKycEvent(handleKycEvent)

    return () => {
      console.log('[useOpsKycRealtime] Cleaning up ops:kyc subscription')
      unsubscribe()
      unsubscribeFromOpsKyc()
    }
  }, [isConnected, subscribeToOpsKyc, unsubscribeFromOpsKyc, onKycEvent, handleKycEvent])

  return {
    isConnected,
  }
}
