'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  ClipboardList,
  Handshake,
  UserPlus,
  FolderKanban,
  FileCheck,
  Store,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { useOpsDashboardMetrics } from '@/hooks/queries/use-ops-dashboard';
import {
  useOpsActiveEvents,
  useOpsOperationalTasks,
  useOpsAssistants,
} from '@/hooks/queries/use-ops';
import Link from 'next/link';
import { useMemo } from 'react';

/**
 * OPERATIONAL_MANAGER Dashboard - Event Execution
 *
 * Features:
 * - View assigned events
 * - Create Requirement Sheets
 * - Search & select vendors from Internal Database
 * - Negotiate & enter agreed amounts
 * - Send vendor agreements & track acceptance
 * - Create & delegate tasks to Ops Assistants/Vendors
 * - Review task submissions & approve/reject
 * - View event-level cost vs budget
 * - Add/manage Ops Assistants
 */
export function OpsManagerDashboard() {
  const { user } = useAuthStore();
  const { data: metrics, isLoading: metricsLoading } = useOpsDashboardMetrics();
  const { data: events, isLoading: eventsLoading } = useOpsActiveEvents();
  const { data: allTasks, isLoading: tasksLoading } = useOpsOperationalTasks();
  const { data: assistantsResponse, isLoading: assistantsLoading } = useOpsAssistants();

  const activeEventsTotal = metrics?.activeEvents.total ?? 0;
  const totalTasks = metrics?.tasks.totalAssigned ?? 0;
  const completedTasks = metrics?.tasks.completed ?? 0;
  const overdueTasks = metrics?.tasks.overdue ?? 0;
  const pendingTasks = totalTasks - completedTasks;

  // Filter for my events (assigned to current user as manager)
  const myEvents = useMemo(() => {
    if (!events) return [];
    return events.slice(0, 5); // Show first 5 events
  }, [events]);

  // Calculate agreements stats from events
  const agreementsStats = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let total = 0;
    // This would come from useOpsAgreements but we'd need to aggregate
    // For now using placeholder calculation
    return { pending, accepted, total };
  }, []);

  // Get assistants
  const assistants = useMemo(() => {
    const data = assistantsResponse?.data || [];
    return data.slice(0, 4); // Show first 4 assistants
  }, [assistantsResponse]);

  // Calculate tasks pending review (submitted but not completed)
  const tasksForReview = useMemo(() => {
    if (!allTasks) return [];
    return allTasks
      .filter(task => task.proofSubmittedAt && task.status !== 'COMPLETED' && task.status !== 'REJECTED')
      .slice(0, 3); // Show first 3 for review
  }, [allTasks]);

  // Calculate budget utilization from events
  const budgetUtilization = useMemo(() => {
    if (!events || events.length === 0) return 0;
    const totalBudget = events.reduce((sum, e) => sum + (Number(e.totalBudget) || 0), 0);
    const totalSpent = events.reduce((sum, e) => sum + (Number(e.totalSpend) || 0), 0);
    return totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  }, [events]);

  const isLoading = metricsLoading || eventsLoading || tasksLoading || assistantsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">Event Execution Hub</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.name || 'Ops Manager'} - Manage your assigned events
        </p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="My Events"
          value={String(activeEventsTotal)}
          icon={Calendar}
          subtitle={`${metrics?.activeEvents.byStatus?.IN_PROGRESS || 0} in progress`}
        />
        <StatCard
          title="Pending Tasks"
          value={String(pendingTasks)}
          icon={Clock}
          subtitle={`${overdueTasks} overdue`}
          urgent={overdueTasks > 0}
        />
        <StatCard
          title="Tasks to Review"
          value={String(tasksForReview.length)}
          icon={FileCheck}
          subtitle="Awaiting approval"
          urgent={tasksForReview.length > 0}
        />
        <StatCard
          title="My Team"
          value={String(assistants.length)}
          icon={Users}
          subtitle={`${assistants.length} assistants`}
        />
        <StatCard
          title="Budget Used"
          value={`${budgetUtilization}%`}
          icon={DollarSign}
          subtitle={`Across ${activeEventsTotal} events`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My Assigned Events */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Assigned Events</h2>
            <a href="/ops/events" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {myEvents.length > 0 ? (
              myEvents.map((event) => {
                const budget = Number(event.totalBudget) || 0;
                const spent = Number(event.totalSpend) || 0;
                const status = event.status === 'EXECUTION' ? 'in_progress' : 
                              event.status === 'COMPLETED' ? 'completed' : 'planning';
                
                return (
                  <EventItem
                    key={event.id}
                    eventId={event.id}
                    name={event.clientName}
                    eventDate={event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'TBD'}
                    budget={`$${budget.toLocaleString()}`}
                    spent={`$${spent.toLocaleString()}`}
                    status={status}
                    requirements={0} // Would need to fetch per event
                    requirementsFilled={0}
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No events assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Team */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
            <div className="space-y-2">
              <QuickAction
                icon={ClipboardList}
                label="Create Requirement Sheet"
                href="/ops/requirements/new"
              />
              <QuickAction
                icon={Store}
                label="Search Vendors"
                href="/ops/vendors/search"
              />
              <QuickAction
                icon={Handshake}
                label="Send Agreement"
                href="/ops/agreements/new"
              />
              <QuickAction
                icon={CheckSquare}
                label="Create Task"
                href="/ops/tasks/new"
              />
              <QuickAction
                icon={FolderKanban}
                label="Task Board"
                href="/ops/tasks/board"
              />
            </div>
          </div>

          {/* My Team */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Assistants</h2>
              <a href="/ops/team/assistants/new" className="text-sm text-primary hover:underline">
                + Add
              </a>
            </div>
            <div className="space-y-3">
              {assistants.length > 0 ? (
                assistants.map((assistant: any) => {
                  const name = assistant.firstName && assistant.lastName 
                    ? `${assistant.firstName} ${assistant.lastName}` 
                    : assistant.email;
                  const tasks = assistant.assignedTasksCount || 0;
                  const completed = assistant.completedTasksCount || 0;
                  
                  return (
                    <AssistantItem
                      key={assistant.id}
                      name={name}
                      tasks={tasks}
                      completed={completed}
                      status="active"
                    />
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No assistants assigned
                </p>
              )}
            </div>
            <a
              href="/ops/team/assistants"
              className="mt-4 block w-full rounded-md border py-2 text-center text-sm hover:bg-accent"
            >
              Manage Team
            </a>
          </div>
        </div>
      </div>

      {/* Vendor Agreements & Task Review */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Vendor Agreements */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vendor Agreements</h2>
            <a href="/ops/agreements" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-4">
            <AgreementItem
              vendor="Elegant Photography"
              event="Beach Wedding - Martinez"
              amount="₹3,500"
              status="pending"
              sentAt="2 hours ago"
            />
            <AgreementItem
              vendor="Floral Dreams"
              event="Beach Wedding - Martinez"
              amount="₹2,800"
              status="accepted"
              sentAt="1 day ago"
            />
            <AgreementItem
              vendor="DJ Beats"
              event="Corporate Gala"
              amount="₹1,500"
              status="pending"
              sentAt="3 hours ago"
            />
            <AgreementItem
              vendor="Delicious Catering"
              event="Anniversary Celebration"
              amount="₹4,200"
              status="declined"
              sentAt="2 days ago"
            />
          </div>
        </div>

        {/* Tasks Pending Review */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tasks Pending Review</h2>
            <a href="/ops/tasks/review" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {tasksForReview.length > 0 ? (
              tasksForReview.map((task) => {
                const submittedAt = task.proofSubmittedAt 
                  ? getTimeAgo(new Date(task.proofSubmittedAt))
                  : 'Just now';
                const eventName = task.activeEvent?.clientName || 'Unknown Event';
                const assignee = task.assignedToUserId ? 'Assistant' : 'Vendor';
                
                return (
                  <TaskReviewItem
                    key={task.id}
                    taskId={task.id}
                    task={task.title}
                    assignee={assignee}
                    event={eventName}
                    submittedAt={submittedAt}
                    hasAttachments={!!task.proofUrl}
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No tasks pending review</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost vs Budget Overview */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cost vs Budget - My Events</h2>
          <a href="/ops/reports/budget" className="text-sm text-primary hover:underline">
            Detailed Report
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {myEvents.slice(0, 3).length > 0 ? (
            myEvents.slice(0, 3).map((event) => {
              const budget = Number(event.totalBudget) || 0;
              const spent = Number(event.totalSpend) || 0;
              const committed = 0; // Would need vendor agreements data
              
              return (
                <BudgetCard
                  key={event.id}
                  event={event.clientName}
                  budget={budget}
                  spent={spent}
                  committed={committed}
                />
              );
            })
          ) : (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              <DollarSign className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>No budget data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  urgent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  subtitle: string;
  urgent?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${urgent ? 'border-orange-500' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className={`h-4 w-4 ${urgent ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className={`mt-1 text-xs ${urgent ? 'text-orange-500' : 'text-muted-foreground'}`}>
        {subtitle}
      </p>
    </div>
  );
}

// Helper function for time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function EventItem({
  eventId,
  name,
  eventDate,
  budget,
  spent,
  status,
  requirements,
  requirementsFilled,
}: {
  eventId: string;
  name: string;
  eventDate: string;
  budget: string;
  spent: string;
  status: 'planning' | 'in_progress' | 'completed';
  requirements: number;
  requirementsFilled: number;
}) {
  const statusConfig = {
    planning: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Planning' },
    in_progress: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Completed' },
  };

  const progress = requirements > 0 ? (requirementsFilled / requirements) * 100 : 0;

  return (
    <div className="rounded-md border p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{eventDate}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${statusConfig[status].color}`}>
          {statusConfig[status].label}
        </span>
      </div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>Budget: {budget}</span>
        <span>Spent: {spent}</span>
      </div>
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>Requirements</span>
        <span>{requirementsFilled}/{requirements}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={`/ops/events/${eventId}`} className="text-xs text-primary hover:underline">
          View Details
        </Link>
        <span className="text-muted-foreground">•</span>
        <Link href={`/ops/events/${eventId}/requirements`} className="text-xs text-primary hover:underline">
          Requirements
        </Link>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{label}</span>
    </a>
  );
}

function AssistantItem({
  name,
  tasks,
  completed,
  status,
}: {
  name: string;
  tasks: number;
  completed: number;
  status: 'active' | 'field' | 'offline';
}) {
  const statusColors = {
    active: 'bg-green-500',
    field: 'bg-blue-500',
    offline: 'bg-gray-400',
  };

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${statusColors[status]}`} />
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {completed}/{tasks} tasks done
          </p>
        </div>
      </div>
      <button className="text-xs text-primary hover:underline">Assign</button>
    </div>
  );
}

function AgreementItem({
  vendor,
  event,
  amount,
  status,
  sentAt,
}: {
  vendor: string;
  event: string;
  amount: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
}) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
    accepted: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle2 },
    declined: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertTriangle },
  };
  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <StatusIcon className={`h-4 w-4 ${status === 'pending' ? 'text-yellow-600' : status === 'accepted' ? 'text-green-600' : 'text-red-600'}`} />
        <div>
          <p className="text-sm font-medium">{vendor}</p>
          <p className="text-xs text-muted-foreground">{event}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{amount}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs ${statusConfig[status].color}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function TaskReviewItem({
  taskId,
  task,
  assignee,
  event,
  submittedAt,
  hasAttachments,
}: {
  taskId: string;
  task: string;
  assignee: string;
  event: string;
  submittedAt: string;
  hasAttachments: boolean;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{task}</p>
        {hasAttachments && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">📎</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {assignee} • {event} • {submittedAt}
      </p>
      <div className="mt-2 flex gap-2">
        <Link href={`/ops/tasks/${taskId}`}>
          <button className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90">
            Review
          </button>
        </Link>
      </div>
    </div>
  );
}

function BudgetCard({
  event,
  budget,
  spent,
  committed,
}: {
  event: string;
  budget: number;
  spent: number;
  committed: number;
}) {
  const remaining = budget - spent - committed;
  const spentPercent = (spent / budget) * 100;
  const committedPercent = (committed / budget) * 100;

  return (
    <div className="rounded-md border p-4">
      <p className="mb-2 font-medium">{event}</p>
      <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-muted">
        <div className="bg-green-500" style={{ width: `${spentPercent}%` }} />
        <div className="bg-yellow-500" style={{ width: `${committedPercent}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Spent</p>
          <p className="font-medium text-green-600">${spent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Committed</p>
          <p className="font-medium text-yellow-600">${committed.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Remaining</p>
          <p className={`font-medium ${remaining < 0 ? 'text-red-600' : ''}`}>
            ${remaining.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
