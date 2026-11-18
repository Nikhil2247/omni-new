'use client';

import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  Receipt,
  UserPlus,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { useOpsLeads } from '@/hooks/queries/use-leads';
import { PageHeader, StatCard as KpiCard } from '@/components/dash';
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
    <div className="space-y-3">
      <PageHeader title="Control Tower" />

      {/* Primary Stats Grid */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Leads Ready for Conversion */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Leads</h2>
            <a href="/ops/leads" className="text-sm text-primary hover:underline">
              View all leads ({leads.length})
            </a>
          </div>
          {leads.length === 0 ? (
            <div className="py-3 text-center text-muted-foreground">
              No leads available
            </div>
          ) : (
            <div className="space-y-3">
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
          <div className="mt-2 flex gap-2">
            <a
              href="/ops/leads"
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Manage Leads
            </a>
            <a
              href="/ops/events/new"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Create Direct Booking
            </a>
          </div>
        </div>

        {/* Team Overview */}
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Ops Team</h2>
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
            <div className="mt-2 space-y-2">
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
          <div className="rounded-lg border bg-card p-3">
            <h2 className="mb-2 text-sm font-semibold">Quick Actions</h2>
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
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Unassigned Events */}
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Unassigned Events</h2>
            <span className="rounded-full bg-warning/10 px-2 py-1 text-xs text-warning">
              {unassignedEvents} pending
            </span>
          </div>
          {unassignedEvents === 0 ? (
            <div className="py-3 text-center text-muted-foreground">
              All events are assigned
            </div>
          ) : (
            <div className="space-y-3">
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
          <div className="mt-2">
            <a
              href="/ops/events"
              className="text-sm text-primary hover:underline"
            >
              View all events →
            </a>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="rounded-lg border bg-card p-3">
          <h2 className="mb-2 text-sm font-semibold">Recent Tasks</h2>
          {tasks.length === 0 ? (
            <div className="py-3 text-center text-muted-foreground">
              No tasks assigned yet
            </div>
          ) : (
            <div className="space-y-3">
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
          <div className="mt-2">
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
      <div className="grid gap-3 lg:grid-cols-1">
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Manager Performance</h2>
            <a href="/ops/team/managers" className="text-sm text-primary hover:underline">
              View all managers →
            </a>
          </div>
          {managers.length === 0 ? (
            <div className="py-3 text-center text-muted-foreground">
              No managers available
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
  icon,
  trend,
  trendUp,
  urgent,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
  urgent?: boolean;
}) {
  return (
    <KpiCard
      label={title}
      value={value}
      icon={icon}
      accent={urgent ? 'text-warning' : undefined}
      hint={<span className={trendUp ? 'text-success' : urgent ? 'text-warning' : undefined}>{trend}</span>}
      className={urgent ? 'border-warning/40' : undefined}
    />
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
    new: { color: 'bg-primary/10 text-primary', label: 'New' },
    contacted: { color: 'bg-warning/10 text-warning', label: 'Contacted' },
    qualified: { color: 'bg-success/10 text-success', label: 'Qualified' },
    converted: { color: 'bg-primary/10 text-primary', label: 'Converted' },
  };

  const config = statusConfig[status] || statusConfig.new;

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-3">
        <input type="checkbox" className="h-4 w-4 rounded border-border" />
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
        <span className="text-xs text-success">({active} active)</span>
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
    <div className="rounded-md border p-3">
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
    HIGH: 'bg-destructive/10 text-destructive',
    MEDIUM: 'bg-warning/10 text-warning',
    LOW: 'bg-success/10 text-success',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-muted text-foreground',
    IN_PROGRESS: 'bg-primary/10 text-primary',
    COMPLETED: 'bg-success/10 text-success',
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
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
          {name.charAt(0)}
        </div>
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{events} events</span>
        <span className="text-xs font-medium text-success">{completion}%</span>
      </div>
    </div>
  );
}
