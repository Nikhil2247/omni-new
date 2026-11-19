'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileCheck,
  FileText,
  Headphones,
  ListChecks,
  MapPin,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useOpsDashboardMetrics } from '@/hooks/queries/use-ops-dashboard';
import { useOpsOperationalTasks, useOpsKycList, useOpsDisputes, useOpsSupportTickets } from '@/hooks/queries/use-ops';

/**
 * OPERATIONAL_ASSISTANT Dashboard - Field Work
 *
 * Execute assigned field tasks, upload proof, submit for manager review, and handle the
 * first-line queues (KYC, disputes, support tickets).
 */
export function OpsAssistantDashboard() {
  const { user } = useAuthStore();
  const { data: metrics, isLoading: metricsLoading } = useOpsDashboardMetrics();
  const { data: allTasks, isLoading: tasksLoading } = useOpsOperationalTasks();
  const { data: kycRecords } = useOpsKycList();
  const { data: disputes } = useOpsDisputes();
  const { data: tickets } = useOpsSupportTickets();

  const totalTasks = metrics?.tasks.totalAssigned ?? 0;
  const completedTasks = metrics?.tasks.completed ?? 0;
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);
  const overdueTasks = metrics?.tasks.overdue ?? 0;

  // Filter tasks by current user and status
  const myTasks = useMemo(() => {
    if (!allTasks || !user?.id) return { urgent: [], other: [], submitted: [] };

    const now = new Date();
    const userTasks = allTasks.filter((t) => t.assignedToUserId === user.id);

    const urgent = userTasks
      .filter((t) => {
        if (t.status === 'COMPLETED' || t.status === 'REJECTED') return false;
        if (!t.dueDate) return false;
        const hoursUntilDue = (new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilDue <= 24 && hoursUntilDue > 0; // Due within 24 hours
      })
      .slice(0, 2);

    const other = userTasks
      .filter((t) => {
        if (t.status === 'COMPLETED' || t.status === 'REJECTED') return false;
        if (!t.dueDate) return true;
        const hoursUntilDue = (new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilDue > 24;
      })
      .slice(0, 3);

    const submitted = userTasks
      .filter((t) => t.proofSubmittedAt && t.status !== 'COMPLETED' && t.status !== 'REJECTED')
      .slice(0, 3);

    return { urgent, other, submitted };
  }, [allTasks, user?.id]);

  // Processing queue counts
  const processingQueue = useMemo(
    () => ({
      kyc: kycRecords?.filter((k) => k.status === 'PENDING' || k.status === 'UNDER_REVIEW').length ?? 0,
      tickets: tickets?.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length ?? 0,
      disputes: disputes?.filter((d) => d.status === 'OPEN' || d.status === 'INVESTIGATING').length ?? 0,
    }),
    [kycRecords, tickets, disputes]
  );

  // Weekly stats (derived from the user's completed tasks)
  const weeklyStats = useMemo(() => {
    if (!allTasks || !user?.id) return { completed: 0, onTime: 0, proofs: 0 };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekTasks = allTasks.filter(
      (t) => t.assignedToUserId === user.id && t.completedAt && new Date(t.completedAt) >= weekAgo
    );

    const completed = weekTasks.length;
    const onTimeCount = weekTasks.filter((t) => {
      if (!t.dueDate || !t.completedAt) return false;
      return new Date(t.completedAt) <= new Date(t.dueDate);
    }).length;

    return {
      completed,
      onTime: completed > 0 ? Math.round((onTimeCount / completed) * 100) : 0,
      proofs: weekTasks.filter((t) => t.proofUrl).length,
    };
  }, [allTasks, user?.id]);

  const isLoading = metricsLoading || tasksLoading;

  const firstName = user?.name?.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const renderTask = (task: (typeof myTasks.urgent)[number], fallbackDue: string, showStart = true) => (
    <TaskRow
      key={task.id}
      taskId={task.id}
      title={task.title}
      event={task.activeEvent?.clientName || 'Event'}
      location={task.description || 'Location TBD'}
      dueTime={task.dueDate ? formatDueTime(new Date(task.dueDate)) : fallbackDue}
      type={getCategoryType(task.category)}
      showStart={showStart}
    />
  );

  const loadingRows = (
    <div className="space-y-2">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );

  const widgets: BoardWidget[] = [
    {
      id: 'due-today',
      title: 'Due today',
      span: 8,
      content: (
        <Panel
          title="Due today"
          icon={AlertTriangle}
          description="Tasks due within 24 hours"
          action={{ label: 'View all', href: '/ops/tasks' }}
        >
          {isLoading ? (
            loadingRows
          ) : myTasks.urgent.length > 0 ? (
            <ListStack>{myTasks.urgent.map((task) => renderTask(task, 'ASAP'))}</ListStack>
          ) : (
            <PanelEmpty icon={CheckCircle2}>Nothing due today. Great job!</PanelEmpty>
          )}
        </Panel>
      ),
    },
    {
      id: 'quick-actions',
      title: 'Quick actions',
      span: 4,
      content: (
        <Panel title="Quick actions" icon={ListChecks}>
          <div className="space-y-2">
            <QuickActionTile icon={CheckSquare} label="My tasks" hint="Start or continue field work" href="/ops/tasks" />
            <QuickActionTile icon={FileCheck} label="KYC documents" hint="Process pending reviews" href="/ops/kyc" />
            <QuickActionTile icon={Calendar} label="Calendar" hint="See your schedule" href="/ops/calendar" />
          </div>
        </Panel>
      ),
    },
    {
      id: 'next-up',
      title: 'Next up',
      span: 8,
      content: (
        <Panel title="Next up" icon={Clock} description="Upcoming and open tasks" action={{ label: 'View all', href: '/ops/tasks' }}>
          {isLoading ? (
            loadingRows
          ) : myTasks.other.length > 0 ? (
            <ListStack>{myTasks.other.map((task) => renderTask(task, 'No deadline'))}</ListStack>
          ) : (
            <PanelEmpty icon={Clock}>No upcoming tasks.</PanelEmpty>
          )}
        </Panel>
      ),
    },
    {
      id: 'queue',
      title: 'Processing queue',
      span: 4,
      content: (
        <Panel title="Processing queue" icon={FileCheck}>
          <ListStack>
            <ListRow
              icon={FileCheck}
              href="/ops/kyc"
              title="KYC documents"
              trailing={<span className="tabular text-sm font-semibold">{processingQueue.kyc}</span>}
            />
            <ListRow icon={Shield} href="/ops/moderation" title="Content moderation" />
            <ListRow
              icon={Headphones}
              href="/ops/tickets"
              title="Support tickets"
              trailing={<span className="tabular text-sm font-semibold">{processingQueue.tickets}</span>}
            />
            <ListRow
              icon={AlertTriangle}
              href="/ops/disputes"
              title="Disputes"
              trailing={<span className="tabular text-sm font-semibold">{processingQueue.disputes}</span>}
            />
          </ListStack>
        </Panel>
      ),
    },
    {
      id: 'submitted',
      title: 'Awaiting review',
      span: 7,
      content: (
        <Panel title="Awaiting review" icon={FileCheck} description="Proof submitted to your manager">
          {isLoading ? (
            loadingRows
          ) : myTasks.submitted.length > 0 ? (
            <ListStack>
              {myTasks.submitted.map((task) => (
                <ListRow
                  key={task.id}
                  href={`/ops/tasks/${task.id}`}
                  title={task.title}
                  meta={`${task.proofSubmittedAt ? getTimeAgo(new Date(task.proofSubmittedAt)) : 'Just now'} • ${task.proofUrl ? 1 : 0} attachments`}
                  trailing={<StatusBadge status="PENDING">Pending review</StatusBadge>}
                />
              ))}
            </ListStack>
          ) : (
            <PanelEmpty icon={FileCheck}>No submitted tasks.</PanelEmpty>
          )}
        </Panel>
      ),
    },
    {
      id: 'week',
      title: 'This week',
      span: 5,
      content: (
        <Panel title="This week" icon={CheckCircle2}>
          <ListStack>
            <WeekStat label="Tasks completed" value={String(weeklyStats.completed)} />
            <WeekStat label="On-time rate" value={`${weeklyStats.onTime}%`} />
            <WeekStat label="Proofs uploaded" value={String(weeklyStats.proofs)} />
          </ListStack>
        </Panel>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DashboardHero
        eyebrow="Field operations"
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        subtitle="Your tasks for today, and what to do next."
        actions={
          <Button asChild size="sm">
            <Link href="/ops/tasks">
              <CheckSquare className="size-3.5" /> My tasks
            </Link>
          </Button>
        }
        aside={
          <>
            <HeroChip icon={AlertTriangle} label="Due today" value={isLoading ? '…' : myTasks.urgent.length} />
            <HeroChip icon={Clock} label="Pending" value={isLoading ? '…' : pendingTasks} />
          </>
        }
      />

      <KpiGrid>
        <KpiCard label="Pending tasks" value={pendingTasks} icon={Clock} loading={isLoading} href="/ops/tasks" />
        <KpiCard label="Overdue" value={overdueTasks} icon={ListChecks} loading={isLoading} href="/ops/tasks" />
        <KpiCard label="Completed (all time)" value={completedTasks} icon={CheckCircle2} loading={isLoading} href="/ops/tasks" />
        <KpiCard label="Awaiting review" value={myTasks.submitted.length} icon={FileCheck} loading={isLoading} href="/ops/tasks" />
      </KpiGrid>

      <WidgetBoard storageKey="ops-assistant-dashboard" widgets={widgets} />
    </div>
  );
}

const TYPE_ICONS: Record<ReturnType<typeof getCategoryType>, LucideIcon> = {
  collection: FileText,
  verification: CheckSquare,
  documentation: Camera,
  confirmation: CheckCircle2,
};

function TaskRow({
  taskId,
  title,
  event,
  location,
  dueTime,
  type,
  showStart,
}: {
  taskId: string;
  title: string;
  event: string;
  location: string;
  dueTime: string;
  type: ReturnType<typeof getCategoryType>;
  showStart: boolean;
}) {
  const TypeIcon = TYPE_ICONS[type];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <TypeIcon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{event}</p>
        <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 text-xs">
          <span className="flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            <span className="max-w-[16rem] truncate">{location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden />
            {dueTime}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {showStart ? (
          <Button asChild size="sm">
            <Link href={`/ops/tasks/${taskId}`}>Start task</Link>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline">
          <Link href={`/ops/tasks/${taskId}`}>Details</Link>
        </Button>
      </div>
    </div>
  );
}

function WeekStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="tabular text-sm font-semibold">{value}</span>
    </div>
  );
}

// Helper functions
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

function formatDueTime(date: Date): string {
  const now = new Date();
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) return 'Overdue';
  if (diffHours < 24) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diffHours < 48) {
    return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function getCategoryType(category: string | null | undefined): 'collection' | 'verification' | 'documentation' | 'confirmation' {
  if (!category) return 'confirmation';
  const cat = category.toLowerCase();
  if (cat.includes('collect') || cat.includes('payment')) return 'collection';
  if (cat.includes('verify') || cat.includes('check')) return 'verification';
  if (cat.includes('photo') || cat.includes('document')) return 'documentation';
  return 'confirmation';
}
