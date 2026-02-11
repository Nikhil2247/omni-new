// ============================================================================
// EXPORT SERVICE
// ============================================================================

import { apiClient } from '../client'
import type { ExportFormat, ExportType, EmailExportInput, EmailExportResponse } from '../types/export.types'

const BASE = '/user/export'

// Helper to trigger file download from blob
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const exportService = {
  // ==================== CHECKLIST EXPORTS ====================

  async downloadChecklistPdf(checklistId: string, filename?: string): Promise<void> {
    const response = await apiClient.get(`${BASE}/checklist/${checklistId}/pdf`, {
      responseType: 'blob',
    })
    downloadBlob(response.data, filename || `checklist-${checklistId}.pdf`)
  },

  async downloadChecklistCsv(checklistId: string, filename?: string): Promise<void> {
    const response = await apiClient.get(`${BASE}/checklist/${checklistId}/csv`, {
      responseType: 'blob',
    })
    downloadBlob(response.data, filename || `checklist-${checklistId}.csv`)
  },

  // ==================== GUESTLIST EXPORTS ====================

  async downloadGuestlistPdf(guestlistId: string, filename?: string): Promise<void> {
    const response = await apiClient.get(`${BASE}/guestlist/${guestlistId}/pdf`, {
      responseType: 'blob',
    })
    downloadBlob(response.data, filename || `guestlist-${guestlistId}.pdf`)
  },

  async downloadGuestlistCsv(guestlistId: string, filename?: string): Promise<void> {
    const response = await apiClient.get(`${BASE}/guestlist/${guestlistId}/csv`, {
      responseType: 'blob',
    })
    downloadBlob(response.data, filename || `guestlist-${guestlistId}.csv`)
  },

  // ==================== BUDGET EXPORTS ====================

  async downloadBudgetPdf(budgetId: string, filename?: string): Promise<void> {
    const response = await apiClient.get(`${BASE}/budget/${budgetId}/pdf`, {
      responseType: 'blob',
    })
    downloadBlob(response.data, filename || `budget-${budgetId}.pdf`)
  },

  async downloadBudgetCsv(budgetId: string, filename?: string): Promise<void> {
    const response = await apiClient.get(`${BASE}/budget/${budgetId}/csv`, {
      responseType: 'blob',
    })
    downloadBlob(response.data, filename || `budget-${budgetId}.csv`)
  },

  // ==================== GENERIC METHODS ====================

  async download(type: ExportType, id: string, format: ExportFormat, filename?: string): Promise<void> {
    const response = await apiClient.get(`${BASE}/${type}/${id}/${format}`, {
      responseType: 'blob',
    })
    const extension = format === 'pdf' ? 'pdf' : 'csv'
    downloadBlob(response.data, filename || `${type}-${id}.${extension}`)
  },
}
