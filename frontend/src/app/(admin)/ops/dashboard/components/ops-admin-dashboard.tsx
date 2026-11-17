'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  Receipt,
  UserPlus,
  CalendarDays,
} from 'lucide-react';
import { useOpsLeads } from '@/hooks/queries/use-leads';
import { useOpsActiveEvents, useOpsOperationalTasks, useOpsManagers, useOpsAssistants } from '@/hooks/queries/use-ops';

/**
 * OPERATIONAL_ADMIN Dashboard - Control Tower
 *
 * Features:
 * - Manage operations team (add managers/assistants)
 * - Convert CRM leads to Active Events
 * - Create Direct Booking events
 * - Assign Ops Managers to events
 * - View Global Calendar & Financial Dashboard
 * - KYC/KYB approval/rejection
 * - Dispute resolution
 * - Vendor verification
 */
export function OpsAdminDashboard() {
  const { user } = useAuthStore();
  const { data: leadsResponse } = useOpsLeads();
  const { data: eventsResponse } = useOpsActiveEvents();
  const { data: tasksResponse } = useOpsOperationalTasks();
  const { data: managersResponse } = useOpsManagers();
  const { data: assistantsResponse } = useOpsAssistants();

  const leads = leadsResponse?.data || [];
  const events = eventsResponse || [];
  const tasks = tasksResponse || [];
  const managers = managersResponse?.data || [];
  const assistants = assistantsResponse?.data || [];

  // Calculate metrics from real data
  const activeEventsTotal = events.length;
  const pendingLeadsCount = leads.filter(lead => lead.status === 'NEW' || lead.status === 'CONTACTED').length;
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    return new Date(task.dueDate) < new Date();
  }).length;
  const unassignedEvents = events.filter(event => !event.opsManagerId).length;
  
  const totalManagers = managers.length;
  const totalAssistants = assistants.length;

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div>
        <h1 className="text-lg font-semibold">Control Tower</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.name || 'Ops Admin'} - Full operational oversight
        </p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Events"
          value={String(activeEventsTotal)}
          icon={Calendar}
          trend={unassignedEvents > 0 ? `${unassignedEvents} unassigned` : 'All assigned'}
          trendUp={unassignedEvents === 0}
        />
        <StatCard
          title="Pending Leads"
          value={String(pendingLeadsCount)}
          icon={Users}
          trend="Ready to convert"
          trendUp={true}
          urgent={pendingLeadsCount > 0}
        />
        <StatCard
          title="Overdue Tasks"
          value={String(overdueTasks)}
          icon={Clock}
          trend="Requires follow-up"
          trendUp={false}
          urgent={overdueTasks > 0}
        />
        <StatCard
          title="Total Revenue"
          value="-"
          icon={DollarSign}
          trend="Coming soon"
          trendUp={true}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Leads Ready for Conversion */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Leads</h2>
            <a href="/ops/leads" className="text-sm text-primary hover:underline">
              View all leads ({leads.length})
            </a>
          </div>
          {leads.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No leads available
            </div>
          ) : (
            <div className="space-y-4">
              {leads.slice(0, 3).map((lead) => {
                // Map backend lead status to UI status
                const mapStatus = (backendStatus?: string): 'new' | 'contacted' | 'qualified' | 'converted' => {
                  const status = backendStatus?.toUpperCase();
                  if (status === 'NEW') return 'new';
                  if (status === 'CONTACTED') return 'contacted';
                  if (status === 'QUALIFIED') return 'qualified';
                  if (status === 'CONVERTED') return 'converted';
                  return 'new';
                };
                
                return (
                  <LeadItem
                    key={lead.id}
                    name={lead.planner?.firstName && lead.planner?.lastName 
                      ? `${lead.planner.firstName} ${lead.planner.lastName}` 
                      : lead.planner?.email || 'Unknown'}
                    source={lead.source || 'Unknown'}
                    budget={lead.budget ? `$${Number(lead.budget).toLocaleString()}` : 'Not specified'}
                    eventDate={lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : 'TBD'}
                    status={mapStatus(lead.status)}
                  />
                );
              })}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <a
              href="/ops/leads"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Manage Leads
            </a>
            <a
              href="/ops/events/new"
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              Create Direct Booking
            </a>
          </div>
        </div>

        {/* Team Overview */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ops Team</h2>
            </div>
            <div className="space-y-3">
              <TeamStatItem 
                label="Ops Managers" 
                count={totalManagers} 
                active={totalManagers} 
              />
              <TeamStatItem 
                label="Ops Assistants" 
                count={totalAssistants} 
                active={totalAssistants} 
              />
            </div>
            <div className="mt-4 space-y-2">
              <a
                href="/ops/team/managers"
                className="block w-full rounded-md border py-2 text-center text-sm hover:bg-accent"
              >
                View Managers
              </a>
              <a
                href="/ops/team/assistants"
                className="block w-full rounded-md border py-2 text-center text-sm hover:bg-accent"
              >
                View Assistants
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
            <div className="space-y-2">
              <QuickAction
                icon={UserPlus}
                label="Create Direct Booking"
                href="/ops/events/new"
              />
              <QuickAction
                icon={CalendarDays}
                label="Global Calendar"
                href="/ops/calendar"
              />
              <QuickAction
                icon={Receipt}
                label="Invoice Center"
                href="/ops/invoices"
              />
              <QuickAction
                icon={BarChart3}
                label="Team Analytics"
                href="/ops/team/analytics"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events Needing Assignment & Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Unassigned Events */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Unassigned Events</h2>
            <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {unassignedEvents} pending
            </span>
          </div>
          {unassignedEvents === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              All events are assigned
            </div>
          ) : (
            <div className="space-y-4">
              {events
                .filter(event => !event.opsManagerId)
                .slice(0, 2)
                .map((event) => (
                  <UnassignedEventItem
                    key={event.id}
                    eventId={event.id}
                    name={event.clientName || 'Unknown Client'}
                    eventDate={event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBD'}
                    budget={event.totalBudget ? `$${Number(event.totalBudget).toLocaleString()}` : 'Not set'}
                    managers={managers}
                  />
                ))}
            </div>
          )}
          <div className="mt-4">
            <a
              href="/ops/events"
              className="text-sm text-primary hover:underline"
            >
              View all events →
            </a>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Recent Tasks</h2>
          {tasks.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No tasks assigned yet
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.slice(0, 3).map((task) => (
                <TaskItem
                  key={task.id}
                  title={task.title}
                  status={task.status}
                  dueDate={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
                  priority={task.priority || 'MEDIUM'}
                />
              ))}
            </div>
          )}
          <div className="mt-4">
            <a
              href="/ops/tasks"
              className="text-sm text-primary hover:underline"
            >
              View all tasks →
            </a>
          </div>
        </div>
      </div>

      {/* Manager Performance */}
      <div className="grid gap-4 lg:grid-cols-1">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Manager Performance</h2>
            <a href="/ops/team/managers" className="text-sm text-primary hover:underline">
              View all managers →
            </a>
          </div>
          {managers.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No managers available
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {managers.slice(0, 4).map((manager) => (
                <ManagerItem
                  key={manager.id}
                  name={manager.firstName && manager.lastName 
                    ? `${manager.firstName} ${manager.lastName}` 
                    : manager.email}
                  events={manager.managedEventsCount || 0}
                  completion={85}
                />
              ))}
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
  trend,
  trendUp,
  urgent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
  urgent?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${urgent ? 'border-orange-500' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className={`h-4 w-4 ${urgent ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className={`mt-1 text-xs ${trendUp ? 'text-green-600' : urgent ? 'text-orange-500' : 'text-muted-foreground'}`}>
        {trend}
      </p>
    </div>
  );
}

function LeadItem({
  name,
  source,
  budget,
  eventDate,
  status,
}: {
  name: string;
  source: string;
  budget: string;
  eventDate: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
}) {
  const statusConfig = {
    new: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'New' },
    contacted: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Contacted' },
    qualified: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Qualified' },
    converted: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Converted' },
  };

  const config = statusConfig[status] || statusConfig.new;

  return (
    <div className="flex items-center justify-between rounded-md border p-4">
      <div className="flex items-center gap-4">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            {source} • {eventDate}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium">{budget}</p>
        <span className={`rounded-full px-2 py-1 text-xs ${config.color}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

function TeamStatItem({ label, count, active }: { label: string; count: number; active: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{count}</span>
        <span className="text-xs text-green-600">({active} active)</span>
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

function UnassignedEventItem({
  eventId,
  name,
  eventDate,
  budget,
  managers,
}: {
  eventId: string;
  name: string;
  eventDate: string;
  budget: string;
  managers: any[];
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium">{name}</p>
        <p className="text-sm font-medium">{budget}</p>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{eventDate}</p>
      <div className="flex items-center gap-2">
        <a
          href={`/ops/events/${eventId}`}
          className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
        >
          View & Assign
        </a>
      </div>
    </div>
  );
}

function TaskItem({
  title,
  status,
  dueDate,
  priority,
}: {
  title: string;
  status: string;
  dueDate: string;
  priority: string;
}) {
  const priorityColors: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[status] || statusColors.PENDING}`}>
          {status}
        </span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">Due: {dueDate}</p>
        </div>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-xs ${priorityColors[priority] || priorityColors.MEDIUM}`}>
        {priority}
      </span>
    </div>
  );
}

function ManagerItem({
  name,
  events,
  completion,
}: {
  name: string;
  events: number;
  completion: number;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
          {name.charAt(0)}
        </div>
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{events} events</span>
        <span className="text-xs font-medium text-green-600">{completion}%</span>
      </div>
    </div>
  );
}
