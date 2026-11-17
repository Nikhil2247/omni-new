// ============================================================================
// DRAG-DROP TASK MANAGER - Visual Task Management with Drag & Drop
// ============================================================================
// Comprehensive task management interface with drag-reordering, priority
// management, and quick actions for operational tasks
// ============================================================================

'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  GripVertical,
  Plus,
  Edit,
  Trash2,
  Clock,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Calendar,
  XCircle,
  User,
  Upload,
  Search,
  Filter,
} from 'lucide-react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TaskItem {
  id: string
  title: string
  description?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'PROOF_SUBMITTED' | 'COMPLETED' | 'CANCELLED'
  dueDate?: string
  assignedTo?: {
    id: string
    name: string
  }
  activeEventId?: string
  eventName?: string
}

interface DragDropTaskManagerProps {
  tasks: TaskItem[]
  onReorder?: (reorderedTasks: TaskItem[]) => void
  onStatusChange?: (taskId: string, newStatus: string) => void
  onUpdate?: (taskId: string, updatedTask: Partial<TaskItem>) => void
  onDelete?: (taskId: string) => void
  onCreate?: (newTask: Omit<TaskItem, 'id'>) => void
  isLoading?: boolean
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const priorityConfig: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: AlertCircle },
  HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20', icon: AlertCircle },
  NORMAL: { label: 'Normal', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: Clock },
  LOW: { label: 'Low', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: Clock },
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: Clock },
  ASSIGNED: { label: 'Assigned', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: User },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20', icon: PlayCircle },
  PROOF_SUBMITTED: { label: 'Proof Submitted', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20', icon: Upload },
  COMPLETED: { label: 'Completed', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: XCircle },
}

const PRIORITY_LEVELS = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const
const STATUS_LEVELS = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'COMPLETED', 'CANCELLED'] as const

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DragDropTaskManager({
  tasks: initialTasks,
  onReorder,
  onStatusChange,
  onUpdate,
  onDelete,
  onCreate,
  isLoading = false,
}: DragDropTaskManagerProps) {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'NORMAL' as TaskItem['priority'],
    dueDate: '',
  })

  // Update local state when prop changes
  useMemo(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // ========================================
  // FILTERING
  // ========================================
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = !searchTerm ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tasks, searchTerm, statusFilter, priorityFilter])

  // ========================================
  // STATISTICS
  // ========================================
  const stats = useMemo(() => {
    const now = new Date()
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'PENDING').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate || t.status === 'COMPLETED') return false
        return new Date(t.dueDate) < now
      }).length,
    }
  }, [tasks])

  // ========================================
  // DRAG & DROP HANDLERS
  // ========================================
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newTasks = [...filteredTasks]
    const draggedTask = newTasks[draggedIndex]
    newTasks.splice(draggedIndex, 1)
    newTasks.splice(index, 0, draggedTask)

    setTasks(newTasks)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    if (onReorder) {
      onReorder(filteredTasks)
    }
  }

  // ========================================
  // TASK ACTIONS
  // ========================================
  const handleQuickStatusChange = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as TaskItem['status'] } : t))
    onStatusChange?.(taskId, newStatus)
  }

  const handleEditClick = (task: TaskItem) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!selectedTask) return
    
    const updatedTask = {
      ...formData,
      dueDate: formData.dueDate || undefined,
    }
    
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...updatedTask } : t))
    onUpdate?.(selectedTask.id, updatedTask)
    setEditDialogOpen(false)
    setSelectedTask(null)
  }

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
      onDelete?.(taskId)
    }
  }

  const handleCreate = () => {
    const newTask = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      status: 'PENDING' as const,
      dueDate: formData.dueDate || undefined,
    }
    
    onCreate?.(newTask)
    setCreateDialogOpen(false)
    setFormData({
      title: '',
      description: '',
      priority: 'NORMAL',
      dueDate: '',
    })
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  const isOverdue = (task: TaskItem) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false
    return new Date(task.dueDate) < new Date()
  }

  const getNextStatus = (currentStatus: string): string => {
    const statusFlow = {
      PENDING: 'ASSIGNED',
      ASSIGNED: 'IN_PROGRESS',
      IN_PROGRESS: 'PROOF_SUBMITTED',
      PROOF_SUBMITTED: 'COMPLETED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'PENDING',
    }
    return statusFlow[currentStatus as keyof typeof statusFlow] || currentStatus
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
              </div>
              <PlayCircle className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={stats.overdue > 0 ? 'border-red-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Management</CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
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
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_LEVELS.map(status => (
                  <SelectItem key={status} value={status}>
                    {statusConfig[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {PRIORITY_LEVELS.map(priority => (
                  <SelectItem key={priority} value={priority}>
                    {priorityConfig[priority].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List with Drag & Drop */}
      <div className="space-y-2">
        {isLoading ? (
          <Card className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Tasks Found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first task to get started'}
              </p>
              {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task, index) => {
            const priority = priorityConfig[task.priority]
            const status = statusConfig[task.status]
            const StatusIcon = status.icon
            const PriorityIcon = priority.icon
            const overdue = isOverdue(task)

            return (
              <Card
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  transition-all hover:shadow-md cursor-move
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  ${overdue ? 'border-red-500/50' : 'hover:border-primary/50'}
                `}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="mt-1 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {overdue && (
                          <Badge variant="destructive" className="ml-2">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignedTo.name}
                          </span>
                        )}
                        {task.eventName && (
                          <span className="text-primary">{task.eventName}</span>
                        )}
                      </div>

                      {/* Badges & Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={priority.color}>
                          <PriorityIcon className="h-3 w-3 mr-1" />
                          {priority.label}
                        </Badge>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleQuickStatusChange(task.id, getNextStatus(task.status))}
                          title="Next Status"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(task.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new operational task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Task title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Task description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskItem['priority'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priorityConfig[priority].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskItem['priority'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priorityConfig[priority].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.title}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
