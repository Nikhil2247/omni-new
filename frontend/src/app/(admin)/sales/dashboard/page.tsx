'use client';

import { useEffect } from 'react';
import { trackDashboard } from '@/lib/analytics/umami';
import {
  Users,
  DollarSign,
  Target,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  UserPlus,
} from 'lucide-react';
import { PageHeader, StatCard, StatGrid, StatusBadge } from '@/components/dashboard';

export default function SalesDashboardPage() {
  useEffect(() => {
    trackDashboard.view('sales')
  }, [])

  return (
    <div className="space-y-3">
      <PageHeader title="Sales Dashboard" />

      {/* Stats Grid */}
      <StatGrid>
        <StatCard label="Monthly Revenue" value="₹128,450" icon={DollarSign} hint={<TrendHint trend="+23%" up comparison="vs last month" />} />
        <StatCard label="New Leads" value="342" icon={UserPlus} hint={<TrendHint trend="+18%" up comparison="vs last month" />} />
        <StatCard label="Conversion Rate" value="24.8%" icon={Target} hint={<TrendHint trend="+2.4%" up comparison="vs last month" />} />
        <StatCard label="Active Deals" value="67" icon={Briefcase} hint={<TrendHint trend="-5" up={false} comparison="from last week" />} />
      </StatGrid>

      {/* Main Content Grid */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Sales Pipeline */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Sales Pipeline</h2>
            <a href="/sales/pipeline" className="text-sm text-primary hover:underline">
              View full pipeline
            </a>
          </div>
          <div className="space-y-2">
            <PipelineStage
              name="New Leads"
              count={45}
              value="₹125,000"
              color="blue"
            />
            <PipelineStage
              name="Contacted"
              count={32}
              value="₹98,000"
              color="purple"
            />
            <PipelineStage
              name="Qualified"
              count={24}
              value="₹156,000"
              color="yellow"
            />
            <PipelineStage
              name="Proposal Sent"
              count={18}
              value="₹210,000"
              color="orange"
            />
            <PipelineStage
              name="Negotiation"
              count={12}
              value="₹180,000"
              color="pink"
            />
            <PipelineStage
              name="Closed Won"
              count={8}
              value="₹128,450"
              color="green"
            />
          </div>
        </div>

        {/* Quick Stats & Actions */}
        <div className="space-y-2">
          {/* Today's Tasks */}
          <div className="rounded-lg border bg-card p-3">
            <h2 className="mb-2 text-sm font-semibold">Today&apos;s Tasks</h2>
            <div className="space-y-2">
              <TaskItem
                title="Follow-up calls"
                count={8}
                icon={Phone}
              />
              <TaskItem
                title="Send proposals"
                count={5}
                icon={Mail}
              />
              <TaskItem
                title="Scheduled meetings"
                count={3}
                icon={Calendar}
              />
              <TaskItem
                title="Deals to close"
                count={2}
                icon={CheckCircle2}
              />
            </div>
          </div>

          {/* Target Progress */}
          <div className="rounded-lg border bg-card p-3">
            <h2 className="mb-2 text-sm font-semibold">Monthly Target</h2>
            <div className="space-y-2">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Revenue</span>
                  <span>₹128,450 / ₹150,000</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[85%] rounded-full bg-primary" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">85% achieved</p>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>New Customers</span>
                  <span>42 / 50</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[84%] rounded-full bg-green-500" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">84% achieved</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads & Deals */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Recent Leads */}
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Leads</h2>
            <a href="/sales/leads" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-2">
            <LeadItem
              name="Sarah Johnson"
              email="sarah@example.com"
              source="Website"
              value="₹5,000"
              status="new"
            />
            <LeadItem
              name="Michael Chen"
              email="michael@company.com"
              source="Referral"
              value="₹12,000"
              status="contacted"
            />
            <LeadItem
              name="Emily Davis"
              email="emily@business.org"
              source="Campaign"
              value="₹8,500"
              status="qualified"
            />
          </div>
        </div>

        {/* Hot Deals */}
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Hot Deals</h2>
            <a href="/sales/deals" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-2">
            <DealItem
              name="Corporate Event Package"
              company="Tech Corp"
              value="₹25,000"
              stage="Negotiation"
              probability={80}
            />
            <DealItem
              name="Wedding Premium Bundle"
              company="Johnson Family"
              value="₹18,000"
              stage="Proposal"
              probability={60}
            />
            <DealItem
              name="Annual Partnership"
              company="Events Plus"
              value="₹45,000"
              stage="Qualified"
              probability={40}
            />
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg border bg-card p-3">
        <h2 className="mb-2 text-sm font-semibold">Recent Activity</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <ActivityCard
            type="deal_won"
            title="Deal Closed"
            description="Wedding Package with Smith Family"
            value="₹15,000"
            time="1 hour ago"
          />
          <ActivityCard
            type="meeting"
            title="Meeting Scheduled"
            description="Follow-up with Tech Corp"
            value=""
            time="2 hours ago"
          />
          <ActivityCard
            type="lead"
            title="New Lead"
            description="From Spring Campaign"
            value="₹8,000 potential"
            time="3 hours ago"
          />
          <ActivityCard
            type="proposal"
            title="Proposal Sent"
            description="Corporate Event Package"
            value="₹25,000"
            time="5 hours ago"
          />
        </div>
      </div>
    </div>
  );
}

function TrendHint({ trend, up, comparison }: { trend: string; up: boolean; comparison: string }) {
  return (
    <span className={`flex items-center gap-1 ${up ? 'text-green-600' : 'text-red-600'}`}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {trend} {comparison}
    </span>
  );
}

function PipelineStage({
  name,
  count,
  value,
  color,
}: {
  name: string;
  count: number;
  value: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    green: 'bg-green-500',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`h-3 w-3 rounded-full ${colorClasses[color]}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-sm text-muted-foreground">{count} deals</span>
        </div>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function TaskItem({
  title,
  count,
  icon: Icon,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{title}</span>
      </div>
      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
        {count}
      </span>
    </div>
  );
}

function LeadItem({
  name,
  email,
  source,
  value,
  status,
}: {
  name: string;
  email: string;
  source: string;
  value: string;
  status: 'new' | 'contacted' | 'qualified';
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
          <p className="text-xs text-muted-foreground">Source: {source}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{value}</p>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function DealItem({
  name,
  company,
  value,
  stage,
  probability,
}: {
  name: string;
  company: string;
  value: string;
  stage: string;
  probability: number;
}) {
  return (
    <div className="py-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{company}</p>
        </div>
        <p className="text-sm font-medium">{value}</p>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{stage}</span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${probability}%` }}
            />
          </div>
          <span className="text-xs">{probability}%</span>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({
  type,
  title,
  description,
  value,
  time,
}: {
  type: 'deal_won' | 'meeting' | 'lead' | 'proposal';
  title: string;
  description: string;
  value: string;
  time: string;
}) {
  const typeConfig = {
    deal_won: { icon: CheckCircle2, color: 'text-green-600' },
    meeting: { icon: Calendar, color: 'text-blue-600' },
    lead: { icon: UserPlus, color: 'text-purple-600' },
    proposal: { icon: Mail, color: 'text-orange-600' },
  };
  const Icon = typeConfig[type].icon;

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${typeConfig[type].color}`} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {value && <p className="mt-1 text-sm font-medium">{value}</p>}
      <p className="mt-2 text-xs text-muted-foreground">{time}</p>
    </div>
  );
}
