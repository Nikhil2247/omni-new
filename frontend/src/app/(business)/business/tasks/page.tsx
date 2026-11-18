'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { trackDashboard } from '@/lib/analytics/umami'
import { useBusinessProfile, useBusinessTasks, useUpdateTaskStatus, useSubmitTaskProof } from '@/hooks/queries/use-business'
import { VendorFeatureGate } from '@/components/common/vendor-feature-gate'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, DataTable, FilterSelect, StatusBadge, TwoLineCell, StatCard, StatGrid } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'
import {
  CheckSquare,
  Clock,
  PlayCircle,
  CheckCircle,
  XCircle,
  Upload,
  AlertTriangle,
  Eye,
  Loader2,
} from 'lucide-react'
import type { BusinessTask } from '@/lib/api/types/business.types'

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  ASSIGNED: { label: 'Assigned', color: 'bg-blue-100 text-blue-700', icon: CheckSquare },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-700', icon: PlayCircle },
  PROOF_SUBMITTED: { label: 'Proof Submitted', color: 'bg-indigo-100 text-indigo-700', icon: Upload },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
}

function TasksPageContent() {
  useEffect(() => {
    trackDashboard.sectionView('tasks', 'vendor')
  }, [])

  const { data: profile, isLoading: profileLoading } = useBusinessProfile()
  const { data: tasks, isLoading: tasksLoading } = useBusinessTasks(profile?.id || '')
  const updateTaskStatus = useUpdateTaskStatus()
  const submitTaskProof = useSubmitTaskProof()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTask, setSelectedTask] = useState<BusinessTask | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showProofDialog, setShowProofDialog] = useState(false)
  const [proofFiles, setProofFiles] = useState<File[]>([])
  const [proofNotes, setProofNotes] = useState('')

  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = !searchTerm ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.activeEvent?.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const openDetails = (task: BusinessTask) => {
    setSelectedTask(task)
    setShowDetailsDialog(true)
  }

  const openProofDialog = (task: BusinessTask) => {
    setSelectedTask(task)
    setProofFiles([])
    setProofNotes('')
    setShowProofDialog(true)
  }

  const handleStartTask = async (task: BusinessTask) => {
    await updateTaskStatus.mutateAsync({
      id: task.id,
      status: 'IN_PROGRESS',
    })
  }

  const handleSubmitProof = async () => {
    if (!selectedTask || proofFiles.length === 0) return

    await submitTaskProof.mutateAsync({
      id: selectedTask.id,
      files: proofFiles,
      notes: proofNotes || undefined,
    })

    setShowProofDialog(false)
    setSelectedTask(null)
    setProofFiles([])
    setProofNotes('')
  }

  // Stats
  const totalTasks = tasks?.length || 0
  const pendingTasks = tasks?.filter(t => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length || 0
  const completedTasks = tasks?.filter(t => t.status === 'COMPLETED').length || 0
  const overdueTasks = tasks?.filter(t => {
    if (!t.dueDate || t.status === 'COMPLETED' || t.status === 'CANCELLED') return false
    return new Date(t.dueDate) < new Date()
  }).length || 0

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-3">
        <PageHeader title="Assigned Tasks" />
        <Card>
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
            <h3 className="text-sm font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Please create your business profile first.
            </p>
            <Button size="sm" className="mt-3" onClick={() => window.location.href = '/business/profile'}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Assigned Tasks" />

      <StatGrid>
        <StatCard label="Total Tasks" value={totalTasks} icon={CheckSquare} />
        <StatCard label="Pending" value={pendingTasks} icon={Clock} accent="text-yellow-600" />
        <StatCard label="Completed" value={completedTasks} icon={CheckCircle} accent="text-green-600" />
        <StatCard label="Overdue" value={overdueTasks} icon={AlertTriangle} accent="text-red-600" />
      </StatGrid>

      <DataTable<BusinessTask>
        data={filteredTasks}
        isLoading={tasksLoading}
        rowKey={(t) => t.id}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search tasks...' }}
        filters={
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(statusConfig).map(([value, c]) => ({ value, label: c.label }))}
          />
        }
        exportFilename="tasks"
        columnToggle
        emptyTitle={tasks?.length === 0 ? "You don't have any tasks assigned yet." : 'No tasks match your search criteria.'}
        emptyIcon={CheckSquare}
        columns={[
          {
            id: 'title',
            header: 'Task',
            label: 'Task',
            sortValue: (t) => t.title,
            exportValue: (t) => t.title,
            cell: (t) => <TwoLineCell title={t.title} subtitle={t.description} />,
            className: 'max-w-[320px]',
          },
          {
            id: 'event',
            header: 'Event',
            label: 'Event',
            hideBelow: 'md',
            sortValue: (t) => t.activeEvent?.clientName ?? '',
            exportValue: (t) => t.activeEvent?.clientName ?? '',
            cell: (t) => <span className="text-sm">{t.activeEvent?.clientName || 'N/A'}</span>,
          },
          {
            id: 'due',
            header: 'Due',
            label: 'Due',
            sortValue: (t) => (t.dueDate ? new Date(t.dueDate) : null),
            exportValue: (t) => t.dueDate ?? '',
            cell: (t) => {
              const overdue =
                t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
              return t.dueDate ? (
                <span className={overdue ? 'text-sm font-medium text-red-600' : 'text-sm'}>
                  {format(new Date(t.dueDate), 'MMM d, yyyy')}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )
            },
          },
          {
            id: 'priority',
            header: 'Priority',
            label: 'Priority',
            hideBelow: 'lg',
            sortValue: (t) => t.priority,
            exportValue: (t) => t.priority,
            cell: (t) => <StatusBadge status={t.priority}>{(priorityConfig[t.priority] || priorityConfig.NORMAL).label}</StatusBadge>,
          },
          {
            id: 'status',
            header: 'Status',
            label: 'Status',
            sortValue: (t) => t.status,
            exportValue: (t) => statusConfig[t.status]?.label ?? t.status,
            cell: (t) => <StatusBadge status={t.status}>{statusConfig[t.status]?.label}</StatusBadge>,
          },
        ]}
        rowActions={(t) => [
          {
            label: 'Start',
            icon: PlayCircle,
            onClick: () => handleStartTask(t),
            visible: t.status === 'ASSIGNED',
            disabled: updateTaskStatus.isPending,
          },
          {
            label: 'Submit proof',
            icon: Upload,
            onClick: () => openProofDialog(t),
            visible: t.status === 'IN_PROGRESS',
          },
          { label: 'View', icon: Eye, onClick: () => openDetails(t) },
        ]}
      />

      {/* Task Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask?.activeEvent?.clientName} - {selectedTask?.activeEvent?.eventType}
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={statusConfig[selectedTask.status]?.color || ''}>
                  {statusConfig[selectedTask.status]?.label || selectedTask.status}
                </Badge>
                <Badge variant="outline" className={priorityConfig[selectedTask.priority]?.color || ''}>
                  {priorityConfig[selectedTask.priority]?.label || selectedTask.priority}
                </Badge>
              </div>

              {selectedTask.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {selectedTask.dueDate
                      ? format(new Date(selectedTask.dueDate), 'MMMM d, yyyy')
                      : 'No due date'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedTask.category || 'General'}</p>
                </div>
              </div>

              {selectedTask.proofSubmittedAt && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Proof Submission</h4>
                  <p className="text-sm text-muted-foreground">
                    Submitted: {format(new Date(selectedTask.proofSubmittedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                  {selectedTask.proofUrl && (
                    <a
                      href={selectedTask.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Proof
                    </a>
                  )}
                  {selectedTask.proofNotes && (
                    <p className="text-sm mt-2">{selectedTask.proofNotes}</p>
                  )}
                </div>
              )}

              {selectedTask.reviewNotes && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Review Notes</h4>
                  <p className="text-sm">{selectedTask.reviewNotes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Created: {format(new Date(selectedTask.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  {selectedTask.startedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Started: {format(new Date(selectedTask.startedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {selectedTask.completedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Completed: {format(new Date(selectedTask.completedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Proof Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Task Proof</DialogTitle>
            <DialogDescription>
              Upload photos or files to prove task completion for &quot;{selectedTask?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Upload Proof Files *</Label>
              <FileUpload
                onUpload={async (files) => setProofFiles(files)}
                accept={{
                  'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
                  'application/pdf': ['.pdf'],
                }}
                maxFiles={5}
                maxSize={10 * 1024 * 1024}
                multiple={true}
              />
              {proofFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {proofFiles.length} file(s) selected
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof-notes">Notes (optional)</Label>
              <Textarea
                id="proof-notes"
                placeholder="Add any notes about the completed work..."
                rows={3}
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProofDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitProof}
              disabled={submitTaskProof.isPending || proofFiles.length === 0}
            >
              {submitTaskProof.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Proof'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BusinessTasksPage() {
  return (
    <VendorFeatureGate
      requiredTier="STARTER"
      upgradeTitle="Unlock Task Management"
      upgradeDescription="Upgrade to Starter or higher to view and manage tasks assigned to you by event organizers. Track progress, submit proofs, and collaborate efficiently."
    >
      <TasksPageContent />
    </VendorFeatureGate>
  )
}
