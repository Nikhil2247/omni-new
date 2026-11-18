'use client';

import { useAuthStore } from '@/store/auth-store';
import { PageHeader, StatCard as KpiCard } from '@/components/dashboard';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileCheck,
  Headphones,
  Shield,
  Calendar,
  MapPin,
  Camera,
  FileText,
  TrendingUp,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { useOpsDashboardMetrics } from '@/hooks/queries/use-ops-dashboard';
import { useOpsOperationalTasks, useOpsKycList, useOpsDisputes, useOpsSupportTickets } from '@/hooks/queries/use-ops';
import Link from 'next/link';
import { useMemo } from 'react';

/**
 * OPERATIONAL_ASSISTANT Dashboard - Field Work
 *
 * Features:
 * - Receive assigned tasks on mobile
 * - Execute field work (collections, setups, verifications)
 * - Upload proof attachments (photos, PDFs, receipts)
 * - Submit tasks for manager review
 * - Process KYC documents
 * - First-line dispute handling
 * - Content moderation
 * - User support tickets
 */
export function OpsAssistantDashboard() {
  const { user } = useAuthStore();
  const { data: metrics, isLoading: metricsLoading } = useOpsDashboardMetrics();
  const { data: allTasks, isLoading: tasksLoading } = useOpsOperationalTasks();
  const { data: kycRecords, isLoading: kycLoading } = useOpsKycList();
  const { data: disputes, isLoading: disputesLoading } = useOpsDisputes();
  const { data: tickets, isLoading: ticketsLoading } = useOpsSupportTickets();

  const totalTasks = metrics?.tasks.totalAssigned ?? 0;
  const completedTasks = metrics?.tasks.completed ?? 0;
  const overdueTasks = metrics?.tasks.overdue ?? 0;
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);

  // Filter tasks by current user and status
  const myTasks = useMemo(() => {
    if (!allTasks || !user?.id) return { urgent: [], other: [], submitted: [] };
    
    const now = new Date();
    const userTasks = allTasks.filter(t => t.assignedToUserId === user.id);
    
    const urgent = userTasks.filter(t => {
      if (t.status === 'COMPLETED' || t.status === 'REJECTED') return false;
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDue <= 24 && hoursUntilDue > 0; // Due within 24 hours
    }).slice(0, 2);
    
    const other = userTasks.filter(t => {
      if (t.status === 'COMPLETED' || t.status === 'REJECTED') return false;
      if (!t.dueDate) return true;
      const dueDate = new Date(t.dueDate);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDue > 24;
    }).slice(0, 3);
    
    const submitted = userTasks.filter(t => 
      t.proofSubmittedAt && t.status !== 'COMPLETED' && t.status !== 'REJECTED'
    ).slice(0, 3);
    
    return { urgent, other, submitted };
  }, [allTasks, user?.id]);

  // Processing queue counts
  const processingQueue = useMemo(() => {
    return {
      kyc: kycRecords?.filter(k => k.status === 'PENDING' || k.status === 'UNDER_REVIEW').length ?? 0,
      moderation: 0, // Would need content moderation endpoint
      tickets: tickets?.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length ?? 0,
      disputes: disputes?.filter(d => d.status === 'OPEN' || d.status === 'INVESTIGATING').length ?? 0,
    };
  }, [kycRecords, tickets, disputes]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    if (!allTasks || !user?.id) return { completed: 0, onTime: 0, proofs: 0, avgResponse: '0h' };
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekTasks = allTasks.filter(t => 
      t.assignedToUserId === user.id && 
      t.completedAt && 
      new Date(t.completedAt) >= weekAgo
    );
    
    const completed = weekTasks.length;
    const onTimeCount = weekTasks.filter(t => {
      if (!t.dueDate || !t.completedAt) return false;
      return new Date(t.completedAt) <= new Date(t.dueDate);
    }).length;
    const onTimeRate = completed > 0 ? Math.round((onTimeCount / completed) * 100) : 0;
    const proofsCount = weekTasks.filter(t => t.proofUrl).length;
    
    return {
      completed,
      onTime: onTimeRate,
      proofs: proofsCount,
      avgResponse: '2.3h' // Would need to calculate from actual timestamps
    };
  }, [allTasks, user?.id]);

  const isLoading = metricsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader title="My Tasks" />

      {/* Primary Stats Grid */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Tasks"
          value={String(pendingTasks)}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="In Progress"
          value={String(myTasks.urgent.length + myTasks.other.length)}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Completed Today"
          value={String(completedTasks)}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Awaiting Review"
          value={String(myTasks.submitted.length)}
          icon={FileCheck}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 space-y-3">
          {/* Urgent Tasks */}
          <div className="rounded-lg border border-orange-500 bg-card p-3">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h2 className="text-sm font-semibold">Urgent Tasks</h2>
            </div>
            <div className="space-y-3">
              {myTasks.urgent.length > 0 ? (
                myTasks.urgent.map((task) => (
                  <TaskCard
                    key={task.id}
                    taskId={task.id}
                    title={task.title}
                    event={task.activeEvent?.clientName || 'Event'}
                    location={task.description || 'Location TBD'}
                    dueTime={task.dueDate ? formatDueTime(new Date(task.dueDate)) : 'ASAP'}
                    priority="urgent"
                    type={getCategoryType(task.category)}
                  />
                ))
              ) : (
                <div className="text-center py-3 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No urgent tasks - Great job!</p>
                </div>
              )}
            </div>
          </div>

          {/* Other Tasks */}
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Other Tasks</h2>
              <a href="/ops/tasks" className="text-sm text-primary hover:underline">
                View all
              </a>
            </div>
            <div className="space-y-3">
              {myTasks.other.length > 0 ? (
                myTasks.other.map((task) => (
                  <TaskCard
                    key={task.id}
                    taskId={task.id}
                    title={task.title}
                    event={task.activeEvent?.clientName || 'Event'}
                    location={task.description || 'Location TBD'}
                    dueTime={task.dueDate ? formatDueTime(new Date(task.dueDate)) : 'No deadline'}
                    priority={task.priority === 'HIGH' ? 'urgent' : task.priority === 'MEDIUM' ? 'normal' : 'low'}
                    type={getCategoryType(task.category)}
                  />
                ))
              ) : (
                <div className="text-center py-3 text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No upcoming tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Tasks Awaiting Review */}
          <div className="rounded-lg border bg-card p-3">
            <h2 className="mb-2 text-sm font-semibold">Submitted - Awaiting Review</h2>
            <div className="space-y-3">
              {myTasks.submitted.length > 0 ? (
                myTasks.submitted.map((task) => (
                  <SubmittedTask
                    key={task.id}
                    title={task.title}
                    submittedAt={task.proofSubmittedAt ? getTimeAgo(new Date(task.proofSubmittedAt)) : 'Just now'}
                    attachments={task.proofUrl ? 1 : 0}
                    status={task.status === 'COMPLETED' ? 'approved' : task.status === 'REJECTED' ? 'rejected' : 'pending'}
                  />
                ))
              ) : (
                <p className="text-center py-3 text-sm text-muted-foreground">No submitted tasks</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Quick Upload */}
          <div className="rounded-lg border bg-card p-3">
            <h2 className="mb-2 text-sm font-semibold">Quick Upload</h2>
            <div className="rounded-lg border-2 border-dashed p-3 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag & drop files or click to upload
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Photos, PDFs, receipts
              </p>
              <button className="mt-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
                Select Files
              </button>
            </div>
          </div>

          {/* Processing Queue */}
          <div className="rounded-lg border bg-card p-3">
            <h2 className="mb-2 text-sm font-semibold">Processing Queue</h2>
            <div className="space-y-3">
              <ProcessingItem
                icon={FileCheck}
                label="KYC Documents"
                count={processingQueue.kyc}
                href="/ops/kyc"
              />
              <ProcessingItem
                icon={Shield}
                label="Content Moderation"
                count={processingQueue.moderation}
                href="/ops/moderation"
              />
              <ProcessingItem
                icon={Headphones}
                label="Support Tickets"
                count={processingQueue.tickets}
                href="/ops/tickets"
              />
              <ProcessingItem
                icon={AlertTriangle}
                label="Disputes"
                count={processingQueue.disputes}
                href="/ops/disputes"
              />
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Today&apos;s Schedule</h2>
              <a href="/ops/calendar" className="text-sm text-primary hover:underline">
                Calendar
              </a>
            </div>
            <div className="space-y-3">
              <ScheduleItem
                time="2:00 PM"
                title="Venue deposit collection"
                location="Grand Ballroom"
              />
              <ScheduleItem
                time="4:00 PM"
                title="Catering setup verification"
                location="Tech Convention Center"
              />
              <ScheduleItem
                time="5:30 PM"
                title="Team check-in call"
                location="Virtual"
              />
            </div>
          </div>

          {/* My Stats */}
          <div className="rounded-lg border bg-card p-3">
            <h2 className="mb-2 text-sm font-semibold">This Week</h2>
            <div className="space-y-3">
              <WeekStatItem label="Tasks Completed" value={String(weeklyStats.completed)} />
              <WeekStatItem label="On-Time Rate" value={`${weeklyStats.onTime}%`} />
              <WeekStatItem label="Proofs Uploaded" value={String(weeklyStats.proofs)} />
              <WeekStatItem label="Avg Response Time" value={weeklyStats.avgResponse} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'yellow' | 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };

  return <KpiCard label={title} value={value} icon={icon} accent={colorClasses[color]} />;
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

function TaskCard({
  taskId,
  title,
  event,
  location,
  dueTime,
  priority,
  type,
}: {
  taskId: string;
  title: string;
  event: string;
  location: string;
  dueTime: string;
  priority: 'urgent' | 'normal' | 'low';
  type: 'collection' | 'verification' | 'documentation' | 'confirmation';
}) {
  const priorityColors = {
    urgent: 'border-l-4 border-l-red-500',
    normal: 'border-l-4 border-l-blue-500',
    low: 'border-l-4 border-l-gray-400',
  };

  const typeIcons = {
    collection: FileText,
    verification: CheckSquare,
    documentation: Camera,
    confirmation: CheckCircle2,
  };

  const TypeIcon = typeIcons[type];

  return (
    <div className={`rounded-md border bg-background p-3 ${priorityColors[priority]}`}>
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <TypeIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{event}</p>
          </div>
        </div>
        {priority === 'urgent' && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
            Urgent
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {dueTime}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={`/ops/tasks/${taskId}`}>
          <button className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90">
            Start Task
          </button>
        </Link>
        <Link href={`/ops/tasks/${taskId}`}>
          <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}

function SubmittedTask({
  title,
  submittedAt,
  attachments,
  status,
}: {
  title: string;
  submittedAt: string;
  attachments: number;
  status: 'pending' | 'approved' | 'rejected';
}) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Pending Review' },
    approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rejected' },
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {submittedAt} • {attachments} attachments
        </p>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-xs ${statusConfig[status].color}`}>
        {statusConfig[status].label}
      </span>
    </div>
  );
}

function ProcessingItem({
  icon: Icon,
  label,
  count,
  href,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
        {count}
      </span>
    </a>
  );
}

function ScheduleItem({
  time,
  title,
  location,
}: {
  time: string;
  title: string;
  location: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-16 shrink-0 text-sm font-medium">{time}</div>
      <div className="flex-1">
        <p className="text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{location}</p>
      </div>
    </div>
  );
}

function WeekStatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
