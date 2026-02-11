'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useOpsOperationalTasks,
  useCreateOperationalTask,
  useUpdateOperationalTask,
  useStartTask,
  useSubmitTaskProof,
  useReviewTask,
  useDeleteOperationalTask,
  useOpsAssistants,
} from '@/hooks/queries/use-ops'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  ListTodo,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Upload,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: <Clock className="h-3 w-3" /> },
  ASSIGNED: { label: 'Assigned', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: <User className="h-3 w-3" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: <Play className="h-3 w-3" /> },
  PROOF_SUBMITTED: { label: 'Proof Submitted', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20', icon: <Upload className="h-3 w-3" /> },
  COMPLETED: { label: 'Completed', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: <ThumbsDown className="h-3 w-3" /> },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  URGENT: { label: 'Urgent', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
}

const CATEGORIES = [
  'Setup',
  'Coordination',
  'Logistics',
  'Catering',
  'Decoration',
  'Photography',
  'Entertainment',
  'Security',
  'Cleanup',
  'Other',
]

interface OpsTasksListProps {
  activeEventId?: string
  showCreateButton?: boolean
}

export function OpsTasksList({ activeEventId, showCreateButton = true }: OpsTasksListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [proofTaskId, setProofTaskId] = useState<string | null>(null)
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null)
  const [proofForm, setProofForm] = useState({ proofUrl: '', proofNotes: '' })
  const [reviewForm, setReviewForm] = useState({ approved: true, reviewNotes: '' })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'NORMAL',
    dueDate: '',
    assignedToUserId: '',
    assignedToVendorId: '',
  })

  const { data: assistantsResponse } = useOpsAssistants()
  const assistants = assistantsResponse?.data || []

  const { data, isLoading, error } = useOpsOperationalTasks(
    activeEventId ? { activeEventId } : undefined
  )
  const createTask = useCreateOperationalTask()
  const updateTask = useUpdateOperationalTask()
  const startTask = useStartTask()
  const submitProof = useSubmitTaskProof()
  const reviewTask = useReviewTask()
  const deleteTask = useDeleteOperationalTask()

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      category: '',
      priority: 'NORMAL',
      dueDate: '',
      assignedToUserId: '',
      assignedToVendorId: '',
    })
  }

  const handleCreate = async () => {
    if (!activeEventId) return
    await createTask.mutateAsync({
      activeEventId,
      title: taskForm.title,
      description: taskForm.description || undefined,
      category: taskForm.category || undefined,
      priority: taskForm.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
      dueDate: taskForm.dueDate || undefined,
      assignedToUserId: taskForm.assignedToUserId || undefined,
      assignedToVendorId: taskForm.assignedToVendorId || undefined,
      assignedBy: 'current-user', // This should come from auth context
    })
    setIsCreateDialogOpen(false)
    resetTaskForm()
  }

  const handleEditClick = (task: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    priority: string;
    dueDate?: string | null;
    assignedToUserId?: string | null;
    assignedToVendorId?: string | null;
  }) => {
    setEditingTaskId(task.id)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      category: task.category || '',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      assignedToUserId: task.assignedToUserId || '',
      assignedToVendorId: task.assignedToVendorId || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingTaskId) return
    await updateTask.mutateAsync({
      id: editingTaskId,
      payload: {
        title: taskForm.title || undefined,
        description: taskForm.description || undefined,
        category: taskForm.category || undefined,
        priority: taskForm.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
        dueDate: taskForm.dueDate || undefined,
        assignedToUserId: taskForm.assignedToUserId || undefined,
        assignedToVendorId: taskForm.assignedToVendorId || undefined,
      },
    })
    setIsEditDialogOpen(false)
    setEditingTaskId(null)
    resetTaskForm()
  }

  const handleStart = async (id: string) => {
    await startTask.mutateAsync(id)
  }

  const handleProofClick = (id: string) => {
    setProofTaskId(id)
    setProofForm({ proofUrl: '', proofNotes: '' })
    setIsProofDialogOpen(true)
  }

  const handleSubmitProof = async () => {
    if (!proofTaskId) return
    await submitProof.mutateAsync({
      id: proofTaskId,
      proofUrl: proofForm.proofUrl || undefined,
      proofNotes: proofForm.proofNotes || undefined,
    })
    setIsProofDialogOpen(false)
    setProofTaskId(null)
    setProofForm({ proofUrl: '', proofNotes: '' })
  }

  const handleReviewClick = (id: string) => {
    setReviewTaskId(id)
    setReviewForm({ approved: true, reviewNotes: '' })
    setIsReviewDialogOpen(true)
  }

  const handleReview = async () => {
    if (!reviewTaskId) return
    await reviewTask.mutateAsync({
      id: reviewTaskId,
      approved: reviewForm.approved,
      reviewNotes: reviewForm.reviewNotes || undefined,
    })
    setIsReviewDialogOpen(false)
    setReviewTaskId(null)
    setReviewForm({ approved: true, reviewNotes: '' })
  }

  const handleDelete = async (id: string) => {
    await deleteTask.mutateAsync(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-destructive">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="font-medium">Failed to load tasks</p>
      </div>
    )
  }

  const now = new Date()
  const totalTasks = data?.length || 0
  const completedTasks = data?.filter(t => t.status === 'COMPLETED').length || 0
  const overdueTasks = data?.filter(t => {
    if (t.status === 'COMPLETED') return false
    return t.dueDate && new Date(t.dueDate) < now
  }).length || 0
  const inProgressTasks = data?.filter(t => t.status === 'IN_PROGRESS').length || 0

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{inProgressTasks}</p>
          </div>
          {overdueTasks > 0 && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
              </div>
            </>
          )}
        </div>

        {showCreateButton && activeEventId && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Tasks List */}
      {!data?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ListTodo className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No tasks found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeEventId ? 'Create tasks for this event.' : 'No tasks available.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((task) => {
            const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING
            const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.NORMAL
            const dueDate = task.dueDate ? new Date(task.dueDate) : null
            const isOverdue = dueDate && dueDate < now && task.status !== 'COMPLETED'

            const canStart = task.status === 'PENDING' || task.status === 'ASSIGNED'
            const canSubmitProof = task.status === 'IN_PROGRESS'
            const canReview = task.status === 'PROOF_SUBMITTED'
            const canEdit = task.status !== 'COMPLETED'

            return (
              <Card key={task.id} className={`transition-all hover:shadow-sm ${isOverdue ? 'border-red-500/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{task.title}</span>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className={status.color}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                        <Badge variant="outline" className={priority.color}>
                          {priority.label}
                        </Badge>
                        {task.category && (
                          <Badge variant="secondary">{task.category}</Badge>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {dueDate ? dueDate.toLocaleDateString() : 'TBD'}</span>
                        </div>
                        {task.activeEvent && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Event:</span>
                            <Link
                              href={`/ops/events/${task.activeEventId}`}
                              className="text-primary hover:underline"
                            >
                              {task.activeEvent.clientName}
                            </Link>
                          </div>
                        )}
                      </div>

                      {task.proofUrl && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Proof:</span>
                          <a
                            href={task.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            View Submission
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canStart && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStart(task.id)}
                          disabled={startTask.isPending}
                        >
                          {startTask.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" />
                              Start
                            </>
                          )}
                        </Button>
                      )}
                      {canSubmitProof && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProofClick(task.id)}
                        >
                          <Upload className="mr-1 h-3 w-3" />
                          Submit Proof
                        </Button>
                      )}
                      {canReview && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleReviewClick(task.id)}
                        >
                          <ThumbsUp className="mr-1 h-3 w-3" />
                          Review
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && (
                            <DropdownMenuItem onClick={() => handleEditClick(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/ops/tasks/${task.id}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this task? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(task.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new operational task for this event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe the task..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={taskForm.category} onValueChange={(v) => setTaskForm({ ...taskForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedToUserId">Assign to Assistant</Label>
                <Select
                  value={taskForm.assignedToUserId}
                  onValueChange={(value) => setTaskForm({ ...taskForm, assignedToUserId: value })}
                >
                  <SelectTrigger id="assignedToUserId">
                    <SelectValue placeholder="Select assistant (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.firstName && assistant.lastName
                          ? `${assistant.firstName} ${assistant.lastName}`
                          : assistant.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedToVendorId">Assign to Vendor (ID)</Label>
                <Input
                  id="assignedToVendorId"
                  placeholder="Vendor ID (optional)"
                  value={taskForm.assignedToVendorId}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedToVendorId: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetTaskForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createTask.isPending || !taskForm.title}
            >
              {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Task Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the task..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={taskForm.category} onValueChange={(v) => setTaskForm({ ...taskForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="datetime-local"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingTaskId(null); resetTaskForm() }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateTask.isPending}>
              {updateTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Proof Dialog */}
      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Proof</DialogTitle>
            <DialogDescription>Upload proof of task completion for review.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proofUrl">Proof URL</Label>
              <Input
                id="proofUrl"
                placeholder="Link to proof (image, document, etc.)"
                value={proofForm.proofUrl}
                onChange={(e) => setProofForm({ ...proofForm, proofUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proofNotes">Notes (Optional)</Label>
              <Textarea
                id="proofNotes"
                placeholder="Additional notes about completion..."
                value={proofForm.proofNotes}
                onChange={(e) => setProofForm({ ...proofForm, proofNotes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsProofDialogOpen(false); setProofTaskId(null); setProofForm({ proofUrl: '', proofNotes: '' }) }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitProof} disabled={submitProof.isPending}>
              {submitProof.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Task</DialogTitle>
            <DialogDescription>Approve or reject the submitted proof.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={reviewForm.approved ? 'default' : 'outline'}
                  className={reviewForm.approved ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setReviewForm({ ...reviewForm, approved: true })}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant={!reviewForm.approved ? 'destructive' : 'outline'}
                  onClick={() => setReviewForm({ ...reviewForm, approved: false })}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                placeholder={reviewForm.approved ? 'Great work!' : 'Reason for rejection...'}
                value={reviewForm.reviewNotes}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsReviewDialogOpen(false); setReviewTaskId(null); setReviewForm({ approved: true, reviewNotes: '' }) }}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewTask.isPending}
              variant={reviewForm.approved ? 'default' : 'destructive'}
            >
              {reviewTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewForm.approved ? 'Approve Task' : 'Reject Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
