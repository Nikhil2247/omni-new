'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useOpsOperationalTask,
  useUpdateTaskStatus,
  useUpdateOperationalTask,
  useDeleteOperationalTask,
} from '@/hooks/queries/use-ops'

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  PlayCircle,
  XCircle,
  AlertTriangle,
  Upload,
  FileText,
  User,
  Building2,
  ExternalLink,
  Edit,
  Trash2,
} from 'lucide-react'

const priorityConfig: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  LOW: { label: 'Low', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: Clock },
  ASSIGNED: { label: 'Assigned', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: User },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20', icon: PlayCircle },
  PROOF_SUBMITTED: { label: 'Proof Submitted', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20', icon: Upload },
  COMPLETED: { label: 'Completed', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: XCircle },
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.taskId as string

  // Validate that taskId is a valid UUID to prevent API errors
  const isValidUUID = useMemo(() => UUID_REGEX.test(taskId), [taskId])

  const { data: task, isLoading, error } = useOpsOperationalTask(isValidUUID ? taskId : '')
  const updateStatus = useUpdateTaskStatus()
  const updateTask = useUpdateOperationalTask()
  const deleteTask = useDeleteOperationalTask()

  const [proofDialogOpen, setProofDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const [proofData, setProofData] = useState({ proofUrl: '', proofNotes: '' })
  const [reviewNotes, setReviewNotes] = useState('')
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    priority: '',
    dueDate: '',
  })

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ id: taskId, status: newStatus })
  }

  const handleStartTask = () => handleStatusChange('IN_PROGRESS')

  const openProofDialog = () => {
    setProofData({ proofUrl: task?.proofUrl || '', proofNotes: task?.proofNotes || '' })
    setProofDialogOpen(true)
  }

  const handleSubmitProof = () => {
    handleStatusChange('PROOF_SUBMITTED')
    setProofDialogOpen(false)
  }

  const openReviewDialog = () => {
    setReviewNotes(task?.reviewNotes || '')
    setReviewDialogOpen(true)
  }

  const handleApproveTask = () => {
    updateStatus.mutate(
      { id: taskId, status: 'COMPLETED', reviewNotes },
      { onSuccess: () => setReviewDialogOpen(false) }
    )
  }

  const handleRejectTask = () => {
    updateStatus.mutate(
      { id: taskId, status: 'IN_PROGRESS', reviewNotes: `Rejected: ${reviewNotes}` },
      { onSuccess: () => setReviewDialogOpen(false) }
    )
  }

  const openEditDialog = () => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      })
      setEditDialogOpen(true)
    }
  }

  const handleSaveEdit = () => {
    updateTask.mutate(
      {
        id: taskId,
        payload: {
          title: editData.title,
          description: editData.description || undefined,
          priority: editData.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
          dueDate: editData.dueDate || undefined,
        },
      },
      { onSuccess: () => setEditDialogOpen(false) }
    )
  }

  const handleDeleteTask = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(taskId, { onSuccess: () => router.push('/ops/tasks') })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ops/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          </div>
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-40 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isValidUUID || error || !task) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ops/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {!isValidUUID ? 'Invalid Task ID' : 'Error Loading Task'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {!isValidUUID
                ? 'The task ID provided is not valid.'
                : 'Failed to load task details.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[task.status] || { label: task.status, color: 'bg-gray-500/10', icon: Clock }
  const priority = priorityConfig[task.priority] || { label: task.priority, color: 'bg-gray-500/10' }
  const StatusIcon = status.icon
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground">Task ID: {task.id.substring(0, 12)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={priority.color}>{priority.label}</Badge>
          <Badge variant="outline" className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Task Details</CardTitle>
                  <CardDescription>Task information and description</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={openEditDialog}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {task.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{task.category || 'General'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {dueDate ? dueDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'No due date'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {task.assignedToUserId && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Assigned to User</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{task.assignedToUserId.substring(0, 8)}...</p>
                    </div>
                  </div>
                )}
                {task.assignedToVendorId && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Assigned to Vendor</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/ops/vendors/${task.assignedToVendorId}`} className="font-medium text-primary hover:underline">
                        View Vendor
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Proof of Completion
              </CardTitle>
              <CardDescription>Submit proof when the task is completed</CardDescription>
            </CardHeader>
            <CardContent>
              {task.proofUrl || task.proofSubmittedAt ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Proof Submitted</span>
                    </div>
                    {task.proofSubmittedAt && (
                      <p className="text-sm text-muted-foreground">Submitted on {new Date(task.proofSubmittedAt).toLocaleString()}</p>
                    )}
                  </div>
                  {task.proofUrl && (
                    <a href={task.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="h-4 w-4" />
                      View Proof
                    </a>
                  )}
                  {task.proofNotes && <p className="text-sm">{task.proofNotes}</p>}
                </div>
              ) : task.status === 'IN_PROGRESS' ? (
                <div className="text-center py-6">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">Submit proof when the task is completed.</p>
                  <Button onClick={openProofDialog}>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Proof
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No proof submitted yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {task.reviewNotes && (
            <Card>
              <CardHeader><CardTitle>Review Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{task.reviewNotes}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(task.status === 'PENDING' || task.status === 'ASSIGNED') && (
                <Button className="w-full" onClick={handleStartTask}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Task
                </Button>
              )}
              {task.status === 'IN_PROGRESS' && (
                <Button className="w-full" onClick={openProofDialog}>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Proof
                </Button>
              )}
              {task.status === 'PROOF_SUBMITTED' && (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={openReviewDialog}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Review & Approve
                </Button>
              )}
              {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                <Button variant="outline" className="w-full" onClick={() => handleStatusChange('CANCELLED')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Task
                </Button>
              )}
              <Separator />
              <Button variant="destructive" className="w-full" onClick={handleDeleteTask}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </Button>
            </CardContent>
          </Card>

          {task.activeEvent && (
            <Card>
              <CardHeader><CardTitle className="text-base">Event Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{task.activeEvent.clientName || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Event Type</p>
                  <p className="font-medium">{task.activeEvent.eventType || 'N/A'}</p>
                </div>
                {task.activeEvent.eventDate && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Event Date</p>
                    <p className="font-medium">{new Date(task.activeEvent.eventDate).toLocaleDateString()}</p>
                  </div>
                )}
                <Link href={`/ops/events/${task.activeEventId}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">View Event</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">{task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
                {task.startedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Started</p>
                      <p className="text-xs text-muted-foreground">{new Date(task.startedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {task.proofSubmittedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                    <div>
                      <p className="text-sm font-medium">Proof Submitted</p>
                      <p className="text-xs text-muted-foreground">{new Date(task.proofSubmittedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {task.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-xs text-muted-foreground">{new Date(task.completedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Proof of Completion</DialogTitle>
            <DialogDescription>Provide evidence that this task has been completed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proofUrl">Proof URL</Label>
              <Input id="proofUrl" placeholder="https://..." value={proofData.proofUrl} onChange={(e) => setProofData((p) => ({ ...p, proofUrl: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proofNotes">Notes</Label>
              <Textarea id="proofNotes" placeholder="Describe the completion..." value={proofData.proofNotes} onChange={(e) => setProofData((p) => ({ ...p, proofNotes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProofDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitProof}>Submit Proof</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Task Completion</DialogTitle>
            <DialogDescription>Review the submitted proof and approve or reject.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">Review Notes</Label>
              <Textarea id="reviewNotes" placeholder="Add comments..." value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectTask}>Reject</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveTask}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={editData.title} onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={editData.description} onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={editData.priority} onValueChange={(v) => setEditData((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input id="edit-dueDate" type="datetime-local" value={editData.dueDate} onChange={(e) => setEditData((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateTask.isPending || !editData.title}>
              {updateTask.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
