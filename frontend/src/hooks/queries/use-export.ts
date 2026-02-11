// ============================================================================
// EXPORT HOOKS
// ============================================================================

import { useMutation } from '@tanstack/react-query'
import { exportService } from '@/lib/api/services/export.service'
import type { ExportFormat, ExportType } from '@/lib/api/types/export.types'

interface UseExportOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useExportChecklist(options?: UseExportOptions) {
  return useMutation({
    mutationFn: ({ id, format, filename }: { id: string; format: ExportFormat; filename?: string }) =>
      format === 'pdf'
        ? exportService.downloadChecklistPdf(id, filename)
        : exportService.downloadChecklistCsv(id, filename),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}

export function useExportGuestlist(options?: UseExportOptions) {
  return useMutation({
    mutationFn: ({ id, format, filename }: { id: string; format: ExportFormat; filename?: string }) =>
      format === 'pdf'
        ? exportService.downloadGuestlistPdf(id, filename)
        : exportService.downloadGuestlistCsv(id, filename),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}

export function useExportBudget(options?: UseExportOptions) {
  return useMutation({
    mutationFn: ({ id, format, filename }: { id: string; format: ExportFormat; filename?: string }) =>
      format === 'pdf'
        ? exportService.downloadBudgetPdf(id, filename)
        : exportService.downloadBudgetCsv(id, filename),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}

export function useExport(options?: UseExportOptions) {
  return useMutation({
    mutationFn: ({ type, id, format, filename }: { type: ExportType; id: string; format: ExportFormat; filename?: string }) =>
      exportService.download(type, id, format, filename),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
