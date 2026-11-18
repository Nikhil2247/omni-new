'use client';

// DEV-ONLY preview of the dashboard kit (Phase 1). Removed in Phase 5.
import * as React from 'react';
import { notFound } from 'next/navigation';
import { Plus, Users, IndianRupee, CalendarDays, Activity, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaLineChart,
  BarChart,
  DataTable,
  DetailGrid,
  DetailSheet,
  DonutChart,
  FilterSelect,
  PageHeader,
  StatCard,
  StatGrid,
  StatusBadge,
  UserCell,
  type DataColumn,
} from '@/components/dash';

interface Row {
  id: string;
  name: string;
  email: string;
  status: string;
  amount: number;
}

const STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'IN_PROGRESS', 'ARCHIVED', 'COMPLETED'];
const ROWS: Row[] = Array.from({ length: 37 }, (_, i) => ({
  id: String(i + 1),
  name: `Sample user ${i + 1}`,
  email: `user${i + 1}@example.com`,
  status: STATUSES[i % STATUSES.length],
  amount: (i + 1) * 1250,
}));

const TREND = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => ({ month: m, revenue: 40 + i * 9, leads: 20 + ((i * 7) % 15) }));

export default function DashKitPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const data = ROWS.filter(
    (r) => (status === 'all' || r.status === status) && r.name.toLowerCase().includes(q.toLowerCase())
  );

  const columns: DataColumn<Row>[] = [
    { id: 'name', header: 'User', cell: (r) => <UserCell name={r.name} subtitle={r.email} />, sortValue: (r) => r.name, label: 'User' },
    { id: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status, label: 'Status' },
    { id: 'amount', header: 'Amount', align: 'right', cell: (r) => <span className="tabular">{r.amount.toLocaleString('en-IN')}</span>, sortValue: (r) => r.amount, label: 'Amount' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PageHeader
        title="Dashboard kit preview"
        actions={
          <>
            <Button variant="outline" onClick={() => setLoading((v) => !v)}>
              Toggle loading
            </Button>
            <Button>
              <Plus /> New item
            </Button>
          </>
        }
      />

      <StatGrid>
        <StatCard label="Total users" value="1,284" icon={Users} delta={4.2} />
        <StatCard label="Revenue" value="₹4.2L" icon={IndianRupee} delta={-1.8} />
        <StatCard label="Events" value="86" icon={CalendarDays} hint="12 this week" />
        <StatCard label="Loading" value="-" icon={Activity} loading />
      </StatGrid>

      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="success">success</StatusBadge>
        <StatusBadge tone="warning">warning</StatusBadge>
        <StatusBadge tone="destructive">destructive</StatusBadge>
        <StatusBadge tone="info">info</StatusBadge>
        <StatusBadge tone="muted">muted</StatusBadge>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue and leads</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaLineChart
              data={TREND}
              xAxisKey="month"
              dataKeys={[
                { key: 'revenue', label: 'Revenue', color: 'var(--chart-1)' },
                { key: 'leads', label: 'Leads', color: 'var(--chart-2)' },
              ]}
              height={200}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Split</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={[
                { name: 'Active', value: 60 },
                { name: 'Pending', value: 25 },
                { name: 'Other', value: 15 },
              ]}
              height={200}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <BarChart data={TREND.map((t) => ({ name: t.month, value: t.leads }))} height={160} />
        </CardContent>
      </Card>

      <DataTable
        className="min-h-64 flex-1"
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        isLoading={loading}
        search={{ value: q, onChange: setQ, placeholder: 'Search users...' }}
        filters={<FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />}
        columnToggle
        exportFilename="kit-sample"
        selectable
        onRowClick={() => setOpen(true)}
        rowActions={() => [
          { label: 'View', icon: Eye, onClick: () => setOpen(true) },
          { label: 'Edit', icon: Pencil },
          { label: 'Delete', icon: Trash2, danger: true, confirm: { title: 'Delete sample?' }, onClick: () => undefined },
        ]}
      />

      <DetailSheet open={open} onOpenChange={setOpen} title="Sample user" subtitle="user1@example.com" badge={<StatusBadge status="ACTIVE" />} onEdit={() => setOpen(false)}>
        <DetailGrid
          items={[
            { label: 'Name', value: 'Sample user' },
            { label: 'Email', value: 'user1@example.com' },
            { label: 'Role', value: 'Admin' },
            { label: 'City', value: '' },
          ]}
        />
      </DetailSheet>
    </div>
  );
}
