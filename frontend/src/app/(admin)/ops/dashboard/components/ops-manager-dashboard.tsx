'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  DollarSign,
  ClipboardList,
  Handshake,
  FolderKanban,
  FileCheck,
  Store,
  CheckSquare,
  Loader2,
  Paperclip,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useOpsDashboardMetrics } from '@/hooks/queries/use-ops-dashboard';
import { useOpsActiveEvents, useOpsOperationalTasks, useOpsAssistants } from '@/hooks/queries/use-ops';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DashboardHero,
  HeroChip,
  KpiCard,
  KpiGrid,
  ListRow,
  ListStack,
  Panel,
  PanelEmpty,
  QuickActionTile,
  StatusBadge,
  WidgetBoard,
  type BoardWidget,
} from '@/components/dash';

/**
 * OPERATIONAL_MANAGER Dashboard - Event Execution
 *
 * Features:
 * - View assigned events
 * - Create Requirement Sheets
 * - Search & select vendors from Internal Database
 * - Send vendor agreements & track acceptance
 * - Create & delegate tasks to Ops Assistants/Vendors
 * - Review task submissions & approve/reject
 * - View event-level cost vs budget
 * - Add/manage Ops Assistants
 */
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function OpsManagerDashboard() {
  const { user } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useOpsDashboardMetrics();
  const { data: events, isLoading: eventsLoading } = useOpsActiveEvents();
  const { data: allTasks, isLoading: tasksLoading } = useOpsOperationalTasks();
  const { data: assistantsResponse, isLoading: assistantsLoading } = useOpsAssistants();

  const activeEventsTotal = metrics?.activeEvents.total ?? 0;
  const totalTasks = metrics?.tasks.totalAssigned ?? 0;
  const completedTasks = metrics?.tasks.completed ?? 0;
  const overdueTasks = metrics?.tasks.overdue ?? 0;
  const pendingTasks = totalTasks - completedTasks;

  // Show the first 5 assigned events
  const myEvents = useMemo(() => (events ? events.slice(0, 5) : []), [events]);

  const assistants = useMemo(() => {
    const data = assistantsResponse?.data || [];
    return data.slice(0, 4);
  }, [assistantsResponse]);

  // Tasks pending review (proof submitted but not completed/rejected)
  const tasksForReview = useMemo(() => {
    if (!allTasks) return [];
    return allTasks
      .filter((task) => task.proofSubmittedAt && task.status !== 'COMPLETED' && task.status !== 'REJECTED')
      .slice(0, 3);
  }, [allTasks]);

  const budgetUtilization = useMemo(() => {
    if (!events || events.length === 0) return 0;
    const totalBudget = events.reduce((sum, e) => sum + (Number(e.totalBudget) || 0), 0);
    const totalSpent = events.reduce((sum, e) => sum + (Number(e.totalSpend) || 0), 0);
    return totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  }, [events]);

  const isLoading = metricsLoading || eventsLoading || tasksLoading || assistantsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const widgets: BoardWidget[] = [
    {
      id: 'assigned-events',
      title: 'My assigned events',
      span: 8,
      content: (
        <Panel title="My assigned events" icon={Calendar} action={{ label: 'View all', href: '/ops/events' }}>
          {myEvents.length > 0 ? (
            <ListStack>
              {myEvents.map((event) => {
                const budget = Number(event.totalBudget) || 0;
                const spent = Number(event.totalSpend) || 0;
                const date = event.eventDate
                  ? new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'TBD';
                return (
                  <ListRow
                    key={event.id}
                    href={`/ops/events/${event.id}`}
                    icon={Calendar}
                    tone="primary"
                    title={event.clientName}
                    meta={`${date} · Budget ${inr(budget)} · Spent ${inr(spent)}`}
                    trailing={<StatusBadge status={event.status} />}
                  />
                );
              })}
            </ListStack>
          ) : (
            <PanelEmpty icon={Calendar}>No events assigned yet</PanelEmpty>
          )}
        </Panel>
      ),
    },
    {
      id: 'quick-actions',
      title: 'Quick actions',
      span: 4,
      content: (
        <Panel title="Quick actions" icon={Sparkles}>
          <div className="space-y-2">
            <QuickActionTile icon={ClipboardList} label="Create requirement sheet" href="/ops/requirements/new" />
            <QuickActionTile icon={Store} label="Search vendors" href="/ops/vendors/search" />
            <QuickActionTile icon={Handshake} label="Send agreement" href="/ops/agreements/new" />
            <QuickActionTile icon={CheckSquare} label="Create task" href="/ops/tasks/new" />
            <QuickActionTile icon={FolderKanban} label="Task board" href="/ops/tasks/board" />
          </div>
        </Panel>
      ),
    },
    {
      id: 'task-review',
      title: 'Tasks pending review',
      span: 6,
      content: (
        <Panel title="Tasks pending review" icon={FileCheck} action={{ label: 'View all', href: '/ops/tasks/review' }}>
          {tasksForReview.length > 0 ? (
            <ListStack>
              {tasksForReview.map((task) => {
                const submittedAt = task.proofSubmittedAt ? getTimeAgo(new Date(task.proofSubmittedAt)) : 'Just now';
                const eventName = task.activeEvent?.clientName || 'Unknown Event';
                const assignee = task.assignedToUserId ? 'Assistant' : 'Vendor';
                return (
                  <ListRow
                    key={task.id}
                    href={`/ops/tasks/${task.id}`}
                    icon={task.proofUrl ? Paperclip : FileCheck}
                    title={task.title}
                    meta={`${assignee} · ${eventName} · ${submittedAt}`}
                    trailing={<span className="text-primary text-xs font-medium">Review</span>}
                  />
                );
              })}
            </ListStack>
          ) : (
            <PanelEmpty icon={CheckCircle2}>No tasks pending review</PanelEmpty>
          )}
        </Panel>
      ),
    },
    {
      id: 'assistants',
      title: 'My assistants',
      span: 6,
      content: (
        <Panel
          title="My assistants"
          icon={Users}
          action={{ label: 'Manage team', href: '/ops/team/assistants' }}
          headerRight={
            <Link href="/ops/team/assistants/new" className="text-primary flex items-center gap-1 text-xs font-medium hover:underline">
              <UserPlus className="size-3.5" aria-hidden /> Add
            </Link>
          }
        >
          {assistants.length > 0 ? (
            <ListStack>
              {assistants.map((assistant: any) => {
                const name =
                  assistant.firstName && assistant.lastName ? `${assistant.firstName} ${assistant.lastName}` : assistant.email;
                const tasks = assistant.assignedTasksCount || 0;
                const completed = assistant.completedTasksCount || 0;
                return (
                  <ListRow
                    key={assistant.id}
                    icon={Users}
                    title={name}
                    meta={`${completed}/${tasks} tasks done`}
                  />
                );
              })}
            </ListStack>
          ) : (
            <PanelEmpty icon={Users} action={{ label: 'Add an assistant', href: '/ops/team/assistants/new' }}>
              No assistants assigned
            </PanelEmpty>
          )}
        </Panel>
      ),
    },
    {
      id: 'cost-vs-budget',
      title: 'Cost vs budget',
      span: 12,
      content: (
        <Panel title="Cost vs budget - my events" icon={DollarSign} action={{ label: 'Detailed report', href: '/ops/reports/budget' }}>
          {myEvents.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {myEvents.slice(0, 3).map((event) => {
                const budget = Number(event.totalBudget) || 0;
                const spent = Number(event.totalSpend) || 0;
                const remaining = budget - spent;
                const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                return (
                  <div key={event.id} className="rounded-lg border p-3">
                    <p className="mb-2 truncate text-sm font-medium">{event.clientName}</p>
                    <div className="bg-muted mb-2 h-2 overflow-hidden rounded-full">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="tabular font-medium">{inr(budget)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="tabular font-medium">{inr(spent)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className={`tabular font-medium ${remaining < 0 ? 'text-destructive' : ''}`}>
                          {inr(remaining)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <PanelEmpty icon={DollarSign}>No budget data available</PanelEmpty>
          )}
        </Panel>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DashboardHero
        eyebrow="Event execution"
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        subtitle="Track your events, review submitted work and keep spend on budget."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/ops/tasks/new">
                <CheckSquare className="size-3.5" /> New task
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/ops/requirements/new">
                <ClipboardList className="size-3.5" /> Requirement sheet
              </Link>
            </Button>
          </>
        }
        aside={
          <>
            <HeroChip icon={Clock} label="Overdue tasks" value={overdueTasks} />
            <HeroChip icon={FileCheck} label="Awaiting review" value={tasksForReview.length} />
          </>
        }
      />

      <KpiGrid cols={5}>
        <KpiCard
          label="My events"
          value={activeEventsTotal}
          icon={Calendar}
          hint={`${metrics?.activeEvents.byStatus?.IN_PROGRESS || 0} in progress`}
          href="/ops/events"
        />
        <KpiCard label="Pending tasks" value={pendingTasks} icon={Clock} hint={`${overdueTasks} overdue`} href="/ops/tasks/board" />
        <KpiCard
          label="Tasks to review"
          value={tasksForReview.length}
          icon={FileCheck}
          hint="Awaiting approval"
          href="/ops/tasks/review"
        />
        <KpiCard label="My team" value={assistants.length} icon={Users} hint={`${assistants.length} assistants`} href="/ops/team/assistants" />
        <KpiCard
          label="Budget used"
          value={`${budgetUtilization}%`}
          icon={DollarSign}
          hint={`Across ${activeEventsTotal} events`}
          href="/ops/reports/budget"
        />
      </KpiGrid>

      <WidgetBoard storageKey="ops-manager-dashboard" widgets={widgets} />
    </div>
  );
}

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
