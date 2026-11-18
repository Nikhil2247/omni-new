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
  Plus,
  Pencil,
  Eye,
  Trash2,
  Loader2,
  ListTodo,
  AlertCircle,
  CheckCircle2,
  Play,
  Upload,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import {
  DataTable,
  StatCard,
  StatGrid,
  StatusBadge,
  TwoLineCell,
  type DataColumn,
} from '@/components/dash'

const STATUS_CONFIG: Record<string, { label: string }> = {
  PENDING: { label: 'Pending' },
  ASSIGNED: { label: 'Assigned' },
  IN_PROGRESS: { label: 'In Progress' },
  PROOF_SUBMITTED: { label: 'Proof Submitted' },
  COMPLETED: { label: 'Completed' },
  REJECTED: { label: 'Rejected' },
}

const PRIORITY_CONFIG: Record<string, { label: string }> = {
  LOW: { label: 'Low' },
  NORMAL: { label: 'Normal' },
  HIGH: { label: 'High' },
  URGENT: { label: 'Urgent' },
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

  const now = new Date()
  type OpsTask = NonNullable<typeof data>[number]

  const columns: DataColumn<OpsTask>[] = [
    {
      id: 'title',
      header: 'Task',
      label: 'Task',
      cell: (task) => {
        const due = task.dueDate ? new Date(task.dueDate) : null
        const overdue = !!due && due < now && task.status !== 'COMPLETED'
        return (
          <TwoLineCell
            title={
              <span className="flex items-center gap-1.5">
                {task.title}
                {overdue && <StatusBadge tone="danger">Overdue</StatusBadge>}
              </span>
            }
            subtitle={task.description ? <span className="line-clamp-1">{task.description}</span> : task.category}
          />
        )
      },
      sortValue: (task) => task.title,
      exportValue: (task) => task.title,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (task) => (
        <StatusBadge status={task.status}>
          {(STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING).label}
        </StatusBadge>
      ),
      sortValue: (task) => task.status,
      exportValue: (task) => task.status,
    },
    {
      id: 'priority',
      header: 'Priority',
      label: 'Priority',
      cell: (task) => (
        <StatusBadge status={task.priority}>
          {(PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.NORMAL).label}
        </StatusBadge>
      ),
      sortValue: (task) => task.priority,
      exportValue: (task) => task.priority,
    },
    {
      id: 'category',
      header: 'Category',
      label: 'Category',
      hideBelow: 'lg',
      cell: (task) => task.category || '-',
      sortValue: (task) => task.category,
    },
    {
      id: 'due',
      header: 'Due',
      label: 'Due',
      cell: (task) => (task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'TBD'),
      sortValue: (task) => (task.dueDate ? new Date(task.dueDate) : null),
    },
    {
      id: 'event',
      header: 'Event',
      label: 'Event',
      hideBelow: 'md',
      cell: (task) =>
        task.activeEvent ? (
          <Link href={`/ops/events/${task.activeEventId}`} className="text-primary hover:underline">
            {task.activeEvent.clientName}
          </Link>
        ) : (
          '-'
        ),
      sortValue: (task) => task.activeEvent?.clientName,
      exportValue: (task) => task.activeEvent?.clientName,
    },
  ]

  if (error) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p className="font-medium">Failed to load tasks</p>
      </div>
    )
  }

  const totalTasks = data?.length || 0
  const completedTasks = data?.filter(t => t.status === 'COMPLETED').length || 0
  const overdueTasks = data?.filter(t => {
    if (t.status === 'COMPLETED') return false
    return t.dueDate && new Date(t.dueDate) < now
  }).length || 0
  const inProgressTasks = data?.filter(t => t.status === 'IN_PROGRESS').length || 0

  return (
    <div className="space-y-3">
      <StatGrid>
        <StatCard label="Total Tasks" value={totalTasks} icon={ListTodo} />
        <StatCard label="Completed" value={completedTasks} icon={CheckCircle2} accent="text-success" />
        <StatCard label="In Progress" value={inProgressTasks} icon={Play} accent="text-warning" />
        <StatCard label="Overdue" value={overdueTasks} icon={AlertCircle} accent="text-destructive" />
      </StatGrid>

      <DataTable
        data={data}
        columns={columns}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFilename="tasks"
        emptyTitle="No tasks found"
        emptyIcon={ListTodo}
        toolbarRight={
          showCreateButton && activeEventId ? (
            <Button size="sm" className="h-8" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Task
            </Button>
          ) : undefined
        }
        rowActions={(task) => [
          {
            label: 'Start',
            icon: Play,
            onClick: () => handleStart(task.id),
            disabled: startTask.isPending,
            visible: task.status === 'PENDING' || task.status === 'ASSIGNED',
          },
          {
            label: 'Submit proof',
            icon: Upload,
            onClick: () => handleProofClick(task.id),
            visible: task.status === 'IN_PROGRESS',
          },
          {
            label: 'Review',
            icon: ThumbsUp,
            onClick: () => handleReviewClick(task.id),
            visible: task.status === 'PROOF_SUBMITTED',
          },
          { label: 'View details', icon: Eye, href: `/ops/tasks/${task.id}` },
          {
            label: 'Edit',
            icon: Pencil,
            onClick: () => handleEditClick(task),
            visible: task.status !== 'COMPLETED',
          },
          {
            label: 'Delete task',
            icon: Trash2,
            danger: true,
            onClick: () => handleDelete(task.id),
            confirm: {
              title: 'Delete task?',
              description: `"${task.title}" will be permanently deleted. This action cannot be undone.`,
            },
          },
        ]}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new operational task for this event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe the task..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Task Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the task..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="proofUrl">Proof URL</Label>
              <Input
                id="proofUrl"
                placeholder="Link to proof (image, document, etc.)"
                value={proofForm.proofUrl}
                onChange={(e) => setProofForm({ ...proofForm, proofUrl: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
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
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Decision</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={reviewForm.approved ? 'default' : 'outline'}
                  className={reviewForm.approved ? 'bg-success hover:bg-success' : ''}
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
            <div className="space-y-1.5">
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
