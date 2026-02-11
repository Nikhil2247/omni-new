'use client'

import Link from 'next/link'
import { useOpsDisputes, useInvestigateDispute, useResolveDispute } from '@/hooks/queries/use-ops'
import { useAuthStore } from '@/store/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Calendar, Search, Eye, PlayCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  INVESTIGATING: { label: 'Investigating', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  ESCALATED: { label: 'Escalated', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  CLOSED: { label: 'Closed', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
}

const typeLabels: Record<string, string> = {
  SERVICE_QUALITY: 'Service Quality',
  PRICING: 'Pricing Issue',
  NO_SHOW: 'No Show',
  HARASSMENT: 'Harassment',
  FRAUD: 'Fraud',
  OTHER: 'Other',
}

export default function OpsDisputesPage() {
  const { user } = useAuthStore()
  const { data: disputes, isLoading, error } = useOpsDisputes()
  const investigateDispute = useInvestigateDispute()
  const resolveDispute = useResolveDispute()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  const filteredDisputes = disputes?.filter((dispute) => {
    const matchesSearch = !searchTerm ||
      dispute.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const handleInvestigate = (id: string) => {
    investigateDispute.mutate(id)
  }

  const handleResolve = () => {
    if (selectedDisputeId && resolution && user?.id) {
      resolveDispute.mutate(
        { id: selectedDisputeId, resolution, resolvedBy: user.id },
        {
          onSuccess: () => {
            setResolveDialogOpen(false)
            setSelectedDisputeId(null)
            setResolution('')
          },
        }
      )
    }
  }

  const openResolveDialog = (id: string) => {
    setSelectedDisputeId(id)
    setResolveDialogOpen(true)
  }

  const openCount = disputes?.filter(d => d.status === 'OPEN').length || 0
  const investigatingCount = disputes?.filter(d => d.status === 'INVESTIGATING').length || 0
  const resolvedCount = disputes?.filter(d => d.status === 'RESOLVED').length || 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Disputes</h1>
          <p className="text-muted-foreground">Manage vendor disputes and complaints.</p>
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Disputes</h1>
        </div>
        <div className="text-sm text-destructive">Failed to load disputes. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Disputes</h1>
        <p className="text-muted-foreground">Manage vendor disputes and complaints.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-red-600">{openCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investigating</p>
                <p className="text-2xl font-bold text-yellow-600">{investigatingCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Eye className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search disputes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="INVESTIGATING">Investigating</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Disputes List */}
      {filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No disputes found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDisputes.map((dispute) => {
            const status = statusConfig[dispute.status] || { label: dispute.status, color: 'bg-gray-500/10 text-gray-700' }
            const typeLabel = typeLabels[dispute.type || ''] || dispute.type || 'Unknown'

            return (
              <Card key={dispute.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-red-500/10">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <p className="font-medium">{typeLabel}</p>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dispute.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        {dispute.resolvedAt && (
                          <span className="text-green-600">
                            Resolved {new Date(dispute.resolvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/ops/disputes/${dispute.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {dispute.status === 'OPEN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvestigate(dispute.id)}
                          disabled={investigateDispute.isPending}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Investigate
                        </Button>
                      )}
                      {dispute.status === 'INVESTIGATING' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openResolveDialog(dispute.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide a resolution summary for this dispute.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter resolution details..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolution || resolveDispute.isPending}
            >
              {resolveDispute.isPending ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
