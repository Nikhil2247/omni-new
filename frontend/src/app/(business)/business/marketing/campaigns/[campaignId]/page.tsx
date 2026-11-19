'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, KpiCard, KpiGrid, PageHeader, Panel, StatusBadge } from '@/components/dash';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Play,
  Pause,
  StopCircle,
  Edit,
  TrendingUp,
  MousePointerClick,
  Target,
  Coins,
} from 'lucide-react';
import {
  useCampaign,
  useCampaignStats,
  useStartCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useStopCampaign,
} from '@/hooks/queries/use-subscription';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FeatureFlagGate, FeatureDisabledMessage } from '@/components/common';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

const typeLabels: Record<string, string> = {
  PROFILE_BOOST: 'Profile Boost',
  ALBUM_PROMOTION: 'Album Promotion',
  BANNER_AD: 'Banner Ad',
  FEATURED_LISTING: 'Featured Listing',
};

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;

  const { data: campaign, isLoading } = useCampaign(campaignId);
  const { data: stats } = useCampaignStats(campaignId);

  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const resumeCampaign = useResumeCampaign();
  const stopCampaign = useStopCampaign();

  const [stopOpen, setStopOpen] = useState(false);

  const handleStart = async () => {
    try {
      await startCampaign.mutateAsync(campaignId);
      toast.success('Campaign started successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start campaign');
    }
  };

  const handlePause = async () => {
    try {
      await pauseCampaign.mutateAsync(campaignId);
      toast.success('Campaign paused successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to pause campaign');
    }
  };

  const handleResume = async () => {
    try {
      await resumeCampaign.mutateAsync(campaignId);
      toast.success('Campaign resumed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resume campaign');
    }
  };

  const handleStop = async () => {
    try {
      await stopCampaign.mutateAsync(campaignId);
      toast.success('Campaign stopped successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop campaign');
    }
  };

  if (isLoading) {
    return (
      <FeatureFlagGate
        feature="marketing.campaigns"
        fallback={<FeatureDisabledMessage feature="Campaigns & Ads" backUrl="/business/marketing/campaigns" backText="Back to Campaigns" />}
      >
        <div className="container py-2">
          <Skeleton className="mb-3 h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </FeatureFlagGate>
    );
  }

  if (!campaign) {
    return (
      <FeatureFlagGate
        feature="marketing.campaigns"
        fallback={<FeatureDisabledMessage feature="Campaigns & Ads" backUrl="/business/marketing/campaigns" backText="Back to Campaigns" />}
      >
        <div className="container py-2">
          <Card>
            <CardContent className="py-10 text-center">
              <h2 className="text-xl font-semibold mb-2">Campaign not found</h2>
              <Link href="/business/marketing/campaigns">
                <Button>Back to Campaigns</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </FeatureFlagGate>
    );
  }

  return (
    <FeatureFlagGate
      feature="marketing.campaigns"
      fallback={<FeatureDisabledMessage feature="Campaigns & Ads" backUrl="/business/marketing/campaigns" backText="Back to Campaigns" />}
    >
      <div className="space-y-3">
      <PageHeader
        leading={
          <Link
            href="/business/marketing/campaigns"
            aria-label="Back to campaigns"
            className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
        title={
          <span className="flex items-center gap-2">
            {campaign.name}
            <StatusBadge status={campaign.status} />
          </span>
        }
        actions={
          <>
            {campaign.status === 'DRAFT' && (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/business/marketing/campaigns/${campaign.id}/edit`}>
                    <Edit className="mr-1.5 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button size="sm" onClick={handleStart} disabled={startCampaign.isPending}>
                  <Play className="mr-1.5 h-4 w-4" />
                  Start campaign
                </Button>
              </>
            )}
            {campaign.status === 'ACTIVE' && (
              <>
                <Button variant="outline" size="sm" onClick={handlePause} disabled={pauseCampaign.isPending}>
                  <Pause className="mr-1.5 h-4 w-4" />
                  Pause
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setStopOpen(true)} disabled={stopCampaign.isPending}>
                  <StopCircle className="mr-1.5 h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
            {campaign.status === 'PAUSED' && (
              <>
                <Button size="sm" onClick={handleResume} disabled={resumeCampaign.isPending}>
                  <Play className="mr-1.5 h-4 w-4" />
                  Resume
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setStopOpen(true)} disabled={stopCampaign.isPending}>
                  <StopCircle className="mr-1.5 h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </>
        }
      />

      <KpiGrid>
        <KpiCard label="Impressions" icon={TrendingUp} value={formatNumber(campaign.impressions)} />
        <KpiCard
          label="Clicks"
          icon={MousePointerClick}
          value={formatNumber(campaign.clicks)}
          hint={stats ? `${(stats.ctr * 100).toFixed(2)}% CTR` : undefined}
        />
        <KpiCard
          label="Conversions"
          icon={Target}
          value={formatNumber(campaign.conversions)}
          hint={stats ? `${(stats.conversionRate * 100).toFixed(2)}% conv. rate` : undefined}
        />
        <KpiCard
          label="Credits spent"
          icon={Coins}
          value={formatNumber(campaign.creditsSpent)}
          hint={`of ${formatNumber(campaign.totalBudget)} budget`}
        />
      </KpiGrid>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Campaign details">
          <DetailRow label="Type" value={typeLabels[campaign.type] || campaign.type} />
          <DetailRow label="Daily budget" value={`${campaign.dailyBudget} credits`} />
          <DetailRow label="Total budget" value={`${campaign.totalBudget} credits`} />
          <DetailRow label="Start date" value={format(new Date(campaign.startDate), 'PPP')} />
          {campaign.endDate && <DetailRow label="End date" value={format(new Date(campaign.endDate), 'PPP')} />}
        </Panel>

        <Panel title="Performance">
          {stats && (
            <>
              <DetailRow label="Cost per click" value={`${stats.costPerClick?.toFixed(2) || 'N/A'} credits`} />
              <DetailRow label="Cost per conversion" value={`${stats.costPerConversion?.toFixed(2) || 'N/A'} credits`} />
              <DetailRow
                label="Budget utilization"
                value={`${Math.round((campaign.creditsSpent / campaign.totalBudget) * 100)}%`}
              />
            </>
          )}
          <div className="pt-3">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Budget progress</span>
              <span className="tabular font-medium">
                {campaign.creditsSpent} / {campaign.totalBudget}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${campaign.totalBudget ? Math.min((campaign.creditsSpent / campaign.totalBudget) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        </Panel>
      </div>
      <ConfirmDialog
        open={stopOpen}
        onOpenChange={setStopOpen}
        title="Stop this campaign?"
        description="The campaign will stop running and cannot be restarted."
        confirmLabel="Stop campaign"
        onConfirm={handleStop}
      />
      </div>
    </FeatureFlagGate>
  );
}
