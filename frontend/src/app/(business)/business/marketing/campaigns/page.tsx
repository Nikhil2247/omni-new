'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader, DataTable, FilterSelect, StatusBadge, TwoLineCell, KpiCard, KpiGrid } from '@/components/dash';
import {
  Plus,
  Play,
  Pause,
  StopCircle,
  Trash2,
  Eye,
  Edit,
  Target,
  Megaphone,
  Eye as EyeIcon,
  MousePointerClick,
} from 'lucide-react';
import { useCampaigns, usePauseCampaign, useResumeCampaign, useStopCampaign, useCancelCampaign } from '@/hooks/queries/use-subscription';
import type { Campaign } from '@/lib/api/types/subscription.types';
import { CampaignStatus, CampaignType } from '@/lib/api/types/subscription.types';
import { toast } from 'sonner';
import { FeatureFlagGate, FeatureDisabledMessage, VendorFeatureGate } from '@/components/common';

const typeLabels: Record<CampaignType, string> = {
  PROFILE_BOOST: 'Profile Boost',
  ALBUM_PROMOTION: 'Album Promotion',
  BANNER_AD: 'Banner Ad',
  FEATURED_LISTING: 'Featured Listing',
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const { data: allCampaigns, isLoading } = useCampaigns(statusFilter === 'ALL' ? undefined : statusFilter);
  const campaigns = allCampaigns?.filter((c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase()));
  const list = allCampaigns ?? [];
  const activeCount = list.filter((c) => c.status === 'ACTIVE').length;
  const totalViews = list.reduce((n, c) => n + (c.impressions || 0), 0);
  const totalClicks = list.reduce((n, c) => n + (c.clicks || 0), 0);
  const pauseCampaign = usePauseCampaign();
  const resumeCampaign = useResumeCampaign();
  const stopCampaign = useStopCampaign();
  const cancelCampaign = useCancelCampaign();

  const handleAction = async (action: string, campaignId: string) => {
    try {
      switch (action) {
        case 'pause':
          await pauseCampaign.mutateAsync(campaignId);
          toast.success('Campaign paused successfully');
          break;
        case 'resume':
          await resumeCampaign.mutateAsync(campaignId);
          toast.success('Campaign resumed successfully');
          break;
        case 'stop':
          await stopCampaign.mutateAsync(campaignId);
          toast.success('Campaign stopped successfully');
          break;
        case 'cancel':
          await cancelCampaign.mutateAsync(campaignId);
          toast.success('Campaign deleted successfully');
          break;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to perform action');
    }
  };

  return (
    <VendorFeatureGate
      requiredTier="STARTER"
      upgradeTitle="Unlock Marketing Campaigns"
      upgradeDescription="Upgrade to Starter or higher to create advertising campaigns, promote your profile, and boost your visibility to event planners."
    >
      <FeatureFlagGate
        feature="marketing.campaigns"
        fallback={<FeatureDisabledMessage feature="Campaigns & Ads" backUrl="/business/marketing" backText="Back to Marketing" />}
      >
        <div className="space-y-3">
          <PageHeader
            title="Campaigns"
            actions={
              <Button asChild size="sm">
                <Link href="/business/marketing/campaigns/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            }
          />

          <KpiGrid>
            <KpiCard label="Campaigns" value={list.length} icon={Megaphone} loading={isLoading} />
            <KpiCard label="Active" value={activeCount} icon={Target} loading={isLoading} />
            <KpiCard label="Total views" value={formatNumber(totalViews)} icon={EyeIcon} loading={isLoading} />
            <KpiCard label="Total clicks" value={formatNumber(totalClicks)} icon={MousePointerClick} loading={isLoading} />
          </KpiGrid>

          <DataTable<Campaign>
            data={campaigns}
            isLoading={isLoading}
            rowKey={(c) => c.id}
            search={{ value: search, onChange: setSearch, placeholder: 'Search campaigns...' }}
            filters={
              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as CampaignStatus | 'ALL')}
                allValue="ALL"
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'SCHEDULED', label: 'Scheduled' },
                  { value: 'PAUSED', label: 'Paused' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'COMPLETED', label: 'Completed' },
                ]}
              />
            }
            exportFilename="campaigns"
            columnToggle
            emptyTitle="No campaigns yet"
            emptyIcon={Target}
            emptyAction={
              <Button asChild size="sm">
                <Link href="/business/marketing/campaigns/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            }
            columns={[
              {
                id: 'name',
                header: 'Campaign',
                label: 'Campaign',
                sortValue: (c) => c.name,
                exportValue: (c) => c.name,
                cell: (c) => <TwoLineCell title={c.name} subtitle={typeLabels[c.type]} />,
              },
              {
                id: 'status',
                header: 'Status',
                label: 'Status',
                sortValue: (c) => c.status,
                exportValue: (c) => c.status,
                cell: (c) => <StatusBadge status={c.status} />,
              },
              {
                id: 'views',
                header: 'Views',
                label: 'Views',
                hideBelow: 'md',
                align: 'right',
                sortValue: (c) => c.impressions,
                exportValue: (c) => c.impressions,
                cell: (c) => <span className="text-sm">{formatNumber(c.impressions)}</span>,
              },
              {
                id: 'clicks',
                header: 'Clicks',
                label: 'Clicks',
                hideBelow: 'md',
                align: 'right',
                sortValue: (c) => c.clicks,
                exportValue: (c) => c.clicks,
                cell: (c) => <span className="text-sm">{formatNumber(c.clicks)}</span>,
              },
              {
                id: 'conversions',
                header: 'Conv.',
                label: 'Conversions',
                hideBelow: 'lg',
                align: 'right',
                sortValue: (c) => c.conversions,
                exportValue: (c) => c.conversions,
                cell: (c) => <span className="text-sm">{c.conversions}</span>,
              },
              {
                id: 'budget',
                header: 'Budget used',
                label: 'Budget used',
                sortValue: (c) => (c.totalBudget ? c.creditsSpent / c.totalBudget : 0),
                exportValue: (c) => `${c.creditsSpent}/${c.totalBudget}`,
                cell: (c) => {
                  const pct = c.totalBudget ? Math.min((c.creditsSpent / c.totalBudget) * 100, 100) : 0;
                  return (
                    <div className="w-32">
                      <div className="text-muted-foreground mb-1 flex justify-between text-[11px]">
                        <span>
                          {c.creditsSpent} / {c.totalBudget}
                        </span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                },
              },
            ]}
            rowActions={(c) => [
              { label: 'View details', icon: Eye, href: `/business/marketing/campaigns/${c.id}` },
              {
                label: 'Edit',
                icon: Edit,
                href: `/business/marketing/campaigns/${c.id}/edit`,
                visible: c.status === 'DRAFT' || c.status === 'SCHEDULED',
              },
              {
                label: 'Pause',
                icon: Pause,
                onClick: () => handleAction('pause', c.id),
                visible: c.status === 'ACTIVE',
              },
              {
                label: 'Resume',
                icon: Play,
                onClick: () => handleAction('resume', c.id),
                visible: c.status === 'PAUSED',
              },
              {
                label: 'Stop',
                icon: StopCircle,
                danger: true,
                onClick: () => handleAction('stop', c.id),
                visible: c.status === 'ACTIVE' || c.status === 'PAUSED',
                confirm: {
                  title: 'Stop this campaign?',
                  description: `"${c.name}" will stop running and cannot be restarted.`,
                  confirmLabel: 'Stop campaign',
                },
              },
              {
                label: 'Delete',
                icon: Trash2,
                danger: true,
                onClick: () => handleAction('cancel', c.id),
                visible: c.status === 'DRAFT',
                confirm: {
                  title: 'Delete this campaign?',
                  description: `"${c.name}" will be permanently deleted. This cannot be undone.`,
                },
              },
            ]}
          />
        </div>
      </FeatureFlagGate>
    </VendorFeatureGate>
  );
}
