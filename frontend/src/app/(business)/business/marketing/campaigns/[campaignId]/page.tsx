'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DollarSign,
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

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

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
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
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
        <div className="container py-8">
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
      <div className="container py-8">
      <Link
        href="/business/marketing/campaigns"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{campaign.description}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'DRAFT' && (
            <>
              <Link href={`/business/marketing/campaigns/${campaign.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button onClick={handleStart} disabled={startCampaign.isPending}>
                <Play className="mr-2 h-4 w-4" />
                Start Campaign
              </Button>
            </>
          )}
          {campaign.status === 'ACTIVE' && (
            <>
              <Button variant="outline" onClick={handlePause} disabled={pauseCampaign.isPending}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button variant="destructive" onClick={handleStop} disabled={stopCampaign.isPending}>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}
          {campaign.status === 'PAUSED' && (
            <>
              <Button onClick={handleResume} disabled={resumeCampaign.isPending}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
              <Button variant="destructive" onClick={handleStop} disabled={stopCampaign.isPending}>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(campaign.impressions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(campaign.clicks)}</div>
            {stats && (
              <p className="text-xs text-muted-foreground">
                {(stats.ctr * 100).toFixed(2)}% CTR
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(campaign.conversions)}</div>
            {stats && (
              <p className="text-xs text-muted-foreground">
                {(stats.conversionRate * 100).toFixed(2)}% conv. rate
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(campaign.creditsSpent)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatNumber(campaign.totalBudget)} budget
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{typeLabels[campaign.type] || campaign.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Budget</span>
              <span className="font-medium">{campaign.dailyBudget} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Budget</span>
              <span className="font-medium">{campaign.totalBudget} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{format(new Date(campaign.startDate), 'PPP')}</span>
            </div>
            {campaign.endDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">{format(new Date(campaign.endDate), 'PPP')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost per Click</span>
                  <span className="font-medium">
                    {stats.costPerClick?.toFixed(2) || 'N/A'} credits
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost per Conversion</span>
                  <span className="font-medium">
                    {stats.costPerConversion?.toFixed(2) || 'N/A'} credits
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget Utilization</span>
                  <span className="font-medium">
                    {Math.round((campaign.creditsSpent / campaign.totalBudget) * 100)}%
                  </span>
                </div>
              </>
            )}

            {/* Budget Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Budget Progress</span>
                <span>
                  {campaign.creditsSpent} / {campaign.totalBudget}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min((campaign.creditsSpent / campaign.totalBudget) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </FeatureFlagGate>
  );
}
