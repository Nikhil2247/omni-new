'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import type { ExportFormat, ExportType } from '@/lib/api/types/export.types'

interface ExportDropdownProps {
  type: ExportType
  id: string
  filename?: string
  onExport: (format: ExportFormat) => Promise<void>
  disabled?: boolean
}

export function ExportDropdown({
  type,
  id,
  filename,
  onExport,
  disabled = false,
}: ExportDropdownProps) {
  const [loading, setLoading] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    try {
      setLoading(format)
      await onExport(format)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(null)
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'checklist':
        return 'Checklist'
      case 'guestlist':
        return 'Guest List'
      case 'budget':
        return 'Budget'
      default:
        return 'Data'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || loading !== null}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={loading !== null}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Download PDF</span>
          {loading === 'pdf' && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={loading !== null}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Download CSV</span>
          {loading === 'csv' && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
