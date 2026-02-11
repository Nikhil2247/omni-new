// ============================================================================
// EXPORT TYPES
// ============================================================================

export type ExportFormat = 'pdf' | 'csv'

export type ExportType = 'checklist' | 'guestlist' | 'budget'

export interface ExportOptions {
  type: ExportType
  format: ExportFormat
  id: string
}

export interface EmailExportInput {
  email: string
  format: ExportFormat
}

export interface EmailExportResponse {
  success: boolean
  message: string
}
