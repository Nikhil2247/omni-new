'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useBusinessProfile, useBusinessTasks, useUpdateTaskStatus, useSubmitTaskProof } from '@/hooks/queries/use-business'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Search,
  Filter,
  Eye,
  Loader2,
  Calendar,
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

export default function BusinessTasksPage() {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Assigned Tasks</h1>
          <p className="text-muted-foreground">View tasks assigned to you</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-2">
              Please create your business profile first.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/business/profile'}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Assigned Tasks</h1>
        <p className="text-muted-foreground">Tasks assigned to you by event organizers</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="PROOF_SUBMITTED">Proof Submitted</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {tasksLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Tasks Found</h3>
            <p className="text-muted-foreground mt-2">
              {tasks?.length === 0
                ? 'You don\'t have any tasks assigned yet.'
                : 'No tasks match your search criteria.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const status = statusConfig[task.status] || statusConfig.PENDING
            const priority = priorityConfig[task.priority] || priorityConfig.NORMAL
            const StatusIcon = status.icon
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() &&
              task.status !== 'COMPLETED' && task.status !== 'CANCELLED'

            return (
              <Card key={task.id} className={isOverdue ? 'border-red-300' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge className={status.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className={priority.color}>
                          {priority.label}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Event:</span>
                          <span>{task.activeEvent?.clientName || 'N/A'}</span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Due:</span>
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {task.category && (
                          <Badge variant="secondary">{task.category}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {task.status === 'ASSIGNED' && (
                        <Button
                          size="sm"
                          onClick={() => handleStartTask(task)}
                          disabled={updateTaskStatus.isPending}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Start
                        </Button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          onClick={() => openProofDialog(task)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Proof
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openDetails(task)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
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

          <div className="space-y-4 py-4">
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
