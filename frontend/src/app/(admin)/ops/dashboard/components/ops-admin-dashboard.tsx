'use client';

import Link from 'next/link';
import {
  Calendar,
  Users,
  Clock,
  BarChart3,
  Receipt,
  UserPlus,
  CalendarDays,
  ClipboardList,
  Sparkles,
  UserCog,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOpsLeads } from '@/hooks/queries/use-leads';
import { useOpsActiveEvents, useOpsOperationalTasks, useOpsManagers, useOpsAssistants } from '@/hooks/queries/use-ops';
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

/**
 * OPERATIONAL_ADMIN Dashboard - Control Tower
 *
 * Manage the ops team, convert CRM leads to active events, create direct bookings,
 * assign ops managers to events and jump to calendar, invoices and analytics.
 */
export function OpsAdminDashboard() {
  const { user } = useAuth();
  const { data: leadsResponse, isLoading: leadsLoading } = useOpsLeads();
  const { data: eventsResponse, isLoading: eventsLoading } = useOpsActiveEvents();
  const { data: tasksResponse, isLoading: tasksLoading } = useOpsOperationalTasks();
  const { data: managersResponse, isLoading: managersLoading } = useOpsManagers();
  const { data: assistantsResponse, isLoading: assistantsLoading } = useOpsAssistants();

  const leads = leadsResponse?.data || [];
  const events = eventsResponse || [];
  const tasks = tasksResponse || [];
  const managers = managersResponse?.data || [];
  const assistants = assistantsResponse?.data || [];

  // Calculate metrics from real data
  const activeEventsTotal = events.length;
  const pendingLeadsCount = leads.filter((lead) => lead.status === 'NEW' || lead.status === 'CONTACTED').length;
  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    return new Date(task.dueDate) < new Date();
  }).length;
  const unassignedList = events.filter((event) => !event.opsManagerId);
  const unassignedEvents = unassignedList.length;

  const totalManagers = managers.length;
  const totalAssistants = assistants.length;

  const firstName = user?.name?.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const widgets: BoardWidget[] = [
    {
      id: 'leads',
      title: 'Recent leads',
      span: 8,
      content: (
        <Panel
          title="Recent leads"
          icon={Users}
          action={{ label: `View all (${leads.length})`, href: '/ops/leads' }}
        >
          {leadsLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <PanelEmpty icon={Users}>No leads available</PanelEmpty>
          ) : (
            <ListStack>
              {leads.slice(0, 5).map((lead) => {
                const name =
                  lead.planner?.firstName && lead.planner?.lastName
                    ? `${lead.planner.firstName} ${lead.planner.lastName}`
                    : lead.planner?.email || 'Unknown';
                const budget = lead.budget ? `$${Number(lead.budget).toLocaleString()}` : 'Budget not specified';
                const eventDate = lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : 'TBD';
                return (
                  <ListRow
                    key={lead.id}
                    icon={Users}
                    tone="primary"
                    href="/ops/leads"
                    title={name}
                    meta={`${lead.source || 'Unknown'} • ${eventDate} • ${budget}`}
                    trailing={<StatusBadge status={lead.status || 'NEW'} />}
                  />
                );
              })}
            </ListStack>
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
            <QuickActionTile icon={UserPlus} label="Create Direct Booking" hint="Start an event without a lead" href="/ops/events/new" />
            <QuickActionTile icon={CalendarDays} label="Global Calendar" hint="All events at a glance" href="/ops/calendar" />
            <QuickActionTile icon={Receipt} label="Invoice Center" hint="Review and send invoices" href="/ops/invoices" />
            <QuickActionTile icon={BarChart3} label="Team Analytics" hint="How the team is performing" href="/ops/team/analytics" />
          </div>
        </Panel>
      ),
    },
    {
      id: 'unassigned-events',
      title: 'Unassigned events',
      span: 6,
      content: (
        <Panel
          title="Unassigned events"
          icon={Calendar}
          description={`${unassignedEvents} pending`}
          action={{ label: 'View all events', href: '/ops/events' }}
        >
          {eventsLoading ? (
            <Skeleton className="h-16" />
          ) : unassignedEvents === 0 ? (
            <PanelEmpty icon={Calendar}>All events are assigned</PanelEmpty>
          ) : (
            <ListStack>
              {unassignedList.slice(0, 4).map((event) => (
                <ListRow
                  key={event.id}
                  href={`/ops/events/${event.id}`}
                  title={event.clientName || 'Unknown Client'}
                  meta={`${event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBD'} • ${
                    event.totalBudget ? `$${Number(event.totalBudget).toLocaleString()}` : 'Budget not set'
                  }`}
                  trailing={
                    <Button asChild size="sm" variant="outline">
                      <span>View &amp; Assign</span>
                    </Button>
                  }
                />
              ))}
            </ListStack>
          )}
        </Panel>
      ),
    },
    {
      id: 'tasks',
      title: 'Recent tasks',
      span: 6,
      content: (
        <Panel title="Recent tasks" icon={ClipboardList} action={{ label: 'View all tasks', href: '/ops/tasks' }}>
          {tasksLoading ? (
            <Skeleton className="h-16" />
          ) : tasks.length === 0 ? (
            <PanelEmpty icon={ClipboardList}>No tasks assigned yet</PanelEmpty>
          ) : (
            <ListStack>
              {tasks.slice(0, 5).map((task) => (
                <ListRow
                  key={task.id}
                  href="/ops/tasks"
                  title={task.title}
                  meta={`Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'} • ${
                    task.priority || 'MEDIUM'
                  } priority`}
                  trailing={<StatusBadge status={task.status} />}
                />
              ))}
            </ListStack>
          )}
        </Panel>
      ),
    },
    {
      id: 'team',
      title: 'Ops team',
      span: 4,
      content: (
        <Panel title="Ops team" icon={UserCog}>
          {managersLoading || assistantsLoading ? (
            <Skeleton className="h-16" />
          ) : (
            <ListStack>
              <ListRow
                href="/ops/team/managers"
                title="Ops Managers"
                trailing={<span className="tabular text-sm font-semibold">{totalManagers}</span>}
              />
              <ListRow
                href="/ops/team/assistants"
                title="Ops Assistants"
                trailing={<span className="tabular text-sm font-semibold">{totalAssistants}</span>}
              />
            </ListStack>
          )}
        </Panel>
      ),
    },
    {
      id: 'managers',
      title: 'Manager workload',
      span: 8,
      content: (
        <Panel title="Manager workload" icon={Users} action={{ label: 'View all managers', href: '/ops/team/managers' }}>
          {managersLoading ? (
            <Skeleton className="h-16" />
          ) : managers.length === 0 ? (
            <PanelEmpty icon={Users}>No managers available</PanelEmpty>
          ) : (
            <ListStack>
              {managers.slice(0, 5).map((manager) => (
                <ListRow
                  key={manager.id}
                  href="/ops/team/managers"
                  title={manager.firstName && manager.lastName ? `${manager.firstName} ${manager.lastName}` : manager.email}
                  meta={`${manager.managedEventsCount || 0} events`}
                />
              ))}
            </ListStack>
          )}
        </Panel>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DashboardHero
        eyebrow="Operations"
        title={firstName ? `${greeting}, ${firstName}` : 'Control Tower'}
        subtitle="Convert leads, assign managers and keep every event on track."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/ops/events/new">
                <Plus className="size-3.5" /> Create Direct Booking
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/ops/leads">Manage Leads</Link>
            </Button>
          </>
        }
        aside={
          <>
            <HeroChip icon={Calendar} label="Unassigned events" value={eventsLoading ? '…' : unassignedEvents} />
            <HeroChip icon={Clock} label="Overdue tasks" value={tasksLoading ? '…' : overdueTasks} />
          </>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Active events"
          value={activeEventsTotal}
          icon={Calendar}
          loading={eventsLoading}
          hint={unassignedEvents > 0 ? `${unassignedEvents} unassigned` : 'All assigned'}
          href="/ops/events"
        />
        <KpiCard
          label="Pending leads"
          value={pendingLeadsCount}
          icon={Users}
          loading={leadsLoading}
          hint="Ready to convert"
          href="/ops/leads"
        />
        <KpiCard
          label="Overdue tasks"
          value={overdueTasks}
          icon={Clock}
          loading={tasksLoading}
          hint="Requires follow-up"
          href="/ops/tasks"
        />
        <KpiCard
          label="Ops team"
          value={totalManagers + totalAssistants}
          icon={UserCog}
          loading={managersLoading || assistantsLoading}
          hint={`${totalManagers} managers, ${totalAssistants} assistants`}
          href="/ops/team/managers"
        />
      </KpiGrid>

      <WidgetBoard storageKey="ops-admin-dashboard" widgets={widgets} />
    </div>
  );
}
