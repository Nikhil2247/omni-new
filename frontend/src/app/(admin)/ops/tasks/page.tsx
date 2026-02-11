'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useOpsOperationalTasks, useUpdateTaskStatus, useDeleteOperationalTask } from '@/hooks/queries/use-ops'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertCircle,
  Clock,
  Search,
  MoreVertical,
  CheckCircle,
  PlayCircle,
  Trash2,
  ListTodo,
  AlertTriangle,
  Calendar,
} from 'lucide-react'

const priorityConfig: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  LOW: { label: 'Low', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  ASSIGNED: { label: 'Assigned', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
  COMPLETED: { label: 'Completed', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
}

export default function OpsTasksPage() {
  const { data: tasks, isLoading, error } = useOpsOperationalTasks()
  const updateStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteOperationalTask()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch = !searchTerm ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  }) || []

  const now = new Date()
  const pendingCount = tasks?.filter(t => t.status === 'PENDING').length || 0
  const inProgressCount = tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0
  const overdueCount = tasks?.filter(t => {
    if (!t.dueDate || t.status === 'COMPLETED') return false
    return new Date(t.dueDate) < now
  }).length || 0

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateStatus.mutate({ id: taskId, status: newStatus })
  }

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(taskId)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Operational Tasks</h1>
          <p className="text-muted-foreground">Manage and track operational tasks.</p>
        </div>
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
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Operational Tasks</h1>
        </div>
        <div className="text-sm text-destructive">Failed to load tasks. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operational Tasks</h1>
          <p className="text-muted-foreground">Manage and track operational tasks.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks?.length || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ListTodo className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">{inProgressCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <PlayCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? 'border-red-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600" />
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
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ListTodo className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No tasks found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const priority = priorityConfig[task.priority] || { label: task.priority, color: 'bg-gray-500/10 text-gray-700' }
            const status = statusConfig[task.status] || { label: task.status, color: 'bg-gray-500/10 text-gray-700' }
            const dueDate = task.dueDate ? new Date(task.dueDate) : null
            const isOverdue = dueDate && dueDate < now && task.status !== 'COMPLETED'

            return (
              <Card
                key={task.id}
                className={`transition-all hover:shadow-sm ${isOverdue ? 'border-red-500/50' : 'hover:border-primary/50'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/ops/tasks/${task.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {task.title}
                        </Link>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {dueDate ? dueDate.toLocaleDateString() : 'No due date'}
                        </span>
                        <Link
                          href={`/ops/events/${task.activeEventId}`}
                          className="hover:text-primary hover:underline"
                        >
                          View Event
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={priority.color}>
                        {priority.label}
                      </Badge>
                      <Badge variant="outline" className={status.color}>
                        {status.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/ops/tasks/${task.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {task.status !== 'IN_PROGRESS' && task.status !== 'COMPLETED' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Start Progress
                            </DropdownMenuItem>
                          )}
                          {task.status !== 'COMPLETED' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(task.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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
    </div>
  )
}
