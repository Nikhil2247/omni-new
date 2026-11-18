'use client'

import { useEffect, useState } from 'react'
import { useOpsOperationalTasks, useUpdateTaskStatus, useDeleteOperationalTask } from '@/hooks/queries/use-ops'
import { trackDashboard } from '@/lib/analytics/umami'
import {
  Clock,
  CheckCircle,
  PlayCircle,
  Trash2,
  ListTodo,
  AlertTriangle,
  Eye,
  CalendarDays,
} from 'lucide-react'
import {
  PageHeader,
  DataTable,
  FilterSelect,
  StatusBadge,
  TwoLineCell,
  StatCard,
  StatGrid,
  type DataColumn,
} from '@/components/dash'

const priorityConfig: Record<string, { label: string }> = {
  URGENT: { label: 'Urgent' },
  HIGH: { label: 'High' },
  NORMAL: { label: 'Normal' },
  LOW: { label: 'Low' },
}

const statusConfig: Record<string, { label: string }> = {
  PENDING: { label: 'Pending' },
  ASSIGNED: { label: 'Assigned' },
  IN_PROGRESS: { label: 'In Progress' },
  COMPLETED: { label: 'Completed' },
  CANCELLED: { label: 'Cancelled' },
}

export default function OpsTasksPage() {
  const { data: tasks, isLoading, error } = useOpsOperationalTasks()
  const updateStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteOperationalTask()

  useEffect(() => {
    trackDashboard.sectionView('ops-tasks', 'ops')
  }, [])

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

  type Task = NonNullable<typeof tasks>[number]

  const columns: DataColumn<Task>[] = [
    {
      id: 'title',
      header: 'Task',
      label: 'Task',
      cell: (t) => {
        const due = t.dueDate ? new Date(t.dueDate) : null
        const overdue = !!due && due < now && t.status !== 'COMPLETED'
        return (
          <TwoLineCell
            title={
              <span className="flex items-center gap-1.5">
                {t.title}
                {overdue && <StatusBadge tone="danger">Overdue</StatusBadge>}
              </span>
            }
            subtitle={`Due: ${due ? due.toLocaleDateString() : 'No due date'}`}
          />
        )
      },
      sortValue: (t) => t.title,
      exportValue: (t) => t.title,
    },
    {
      id: 'priority',
      header: 'Priority',
      label: 'Priority',
      cell: (t) => <StatusBadge status={t.priority} />,
      sortValue: (t) => t.priority,
      exportValue: (t) => t.priority,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (t) => <StatusBadge status={t.status} />,
      sortValue: (t) => t.status,
      exportValue: (t) => t.status,
    },
    {
      id: 'due',
      header: 'Due date',
      label: 'Due date',
      hideBelow: 'md',
      cell: (t) => (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'),
      sortValue: (t) => (t.dueDate ? new Date(t.dueDate) : null),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3">
        <PageHeader title="Operational Tasks" />
        <DataTable data={[]} columns={columns} rowKey={(t) => t.id} isLoading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <PageHeader title="Operational Tasks" />
        <div className="text-sm text-destructive">Failed to load tasks. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Operational Tasks" />

      <StatGrid>
        <StatCard label="Total Tasks" value={tasks?.length || 0} icon={ListTodo} accent="text-primary" />
        <StatCard label="Pending" value={pendingCount} icon={Clock} accent="text-warning" />
        <StatCard label="In Progress" value={inProgressCount} icon={PlayCircle} accent="text-primary" />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} accent="text-destructive" />
      </StatGrid>

      <DataTable
        data={filteredTasks}
        columns={columns}
        rowKey={(t) => t.id}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search tasks...' }}
        filters={
          <>
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((v) => ({
                value: v,
                label: statusConfig[v].label,
              }))}
            />
            <FilterSelect
              label="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={Object.entries(priorityConfig).map(([value, c]) => ({ value, label: c.label }))}
            />
          </>
        }
        columnToggle
        exportFilename="operational-tasks"
        emptyTitle="No tasks found"
        emptyIcon={ListTodo}
        rowActions={(t) => [
          { label: 'View details', icon: Eye, href: `/ops/tasks/${t.id}` },
          { label: 'View event', icon: CalendarDays, href: `/ops/events/${t.activeEventId}` },
          {
            label: 'Start progress',
            icon: PlayCircle,
            onClick: () => handleStatusChange(t.id, 'IN_PROGRESS'),
            visible: t.status !== 'IN_PROGRESS' && t.status !== 'COMPLETED',
          },
          {
            label: 'Mark complete',
            icon: CheckCircle,
            onClick: () => handleStatusChange(t.id, 'COMPLETED'),
            visible: t.status !== 'COMPLETED',
          },
          {
            label: 'Delete task',
            icon: Trash2,
            danger: true,
            onClick: () => deleteTask.mutate(t.id),
            confirm: {
              title: 'Delete this task?',
              description: `"${t.title}" will be permanently deleted. This cannot be undone.`,
            },
          },
        ]}
      />
    </div>
  )
}
