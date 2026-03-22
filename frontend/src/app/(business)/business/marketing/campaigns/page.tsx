'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Play,
  Pause,
  StopCircle,
  Trash2,
  Eye,
  Edit,
  TrendingUp,
  MousePointerClick,
  Target,
  DollarSign,
} from 'lucide-react';
import { useCampaigns, usePauseCampaign, useResumeCampaign, useStopCampaign, useCancelCampaign } from '@/hooks/queries/use-subscription';
import { CampaignStatus, CampaignType } from '@/lib/api/types/subscription.types';
import { toast } from 'sonner';
import { FeatureFlagGate, FeatureDisabledMessage } from '@/components/common';

const statusColors: Record<CampaignStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-teal-100 text-teal-800',
  REJECTED: 'bg-red-100 text-red-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

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
  const { data: campaigns, isLoading } = useCampaigns(statusFilter === 'ALL' ? undefined : statusFilter);
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
    <FeatureFlagGate
      feature="marketing.campaigns"
      fallback={<FeatureDisabledMessage feature="Campaigns & Ads" backUrl="/business/marketing" backText="Back to Marketing" />}
    >
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground">Manage your advertising campaigns</p>
          </div>
          <Link href="/business/marketing/campaigns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </Link>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as CampaignStatus | 'ALL')}>
          <TabsList className="mb-6">
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
            <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
            <TabsTrigger value="PAUSED">Paused</TabsTrigger>
            <TabsTrigger value="DRAFT">Draft</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-0">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : campaigns?.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first campaign to start promoting your business.
                  </p>
                  <Link href="/business/marketing/campaigns/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns?.map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <CardDescription>{typeLabels[campaign.type]}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[campaign.status]}>
                            {campaign.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/business/marketing/campaigns/${campaign.id}`}>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </Link>
                              {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                                <Link href={`/business/marketing/campaigns/${campaign.id}/edit`}>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </Link>
                              )}
                              {campaign.status === 'ACTIVE' && (
                                <DropdownMenuItem onClick={() => handleAction('pause', campaign.id)}>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause
                                </DropdownMenuItem>
                              )}
                              {campaign.status === 'PAUSED' && (
                                <DropdownMenuItem onClick={() => handleAction('resume', campaign.id)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Resume
                                </DropdownMenuItem>
                              )}
                              {(campaign.status === 'ACTIVE' || campaign.status === 'PAUSED') && (
                                <DropdownMenuItem onClick={() => handleAction('stop', campaign.id)}>
                                  <StopCircle className="mr-2 h-4 w-4" />
                                  Stop
                                </DropdownMenuItem>
                              )}
                              {campaign.status === 'DRAFT' && (
                                <DropdownMenuItem
                                  onClick={() => handleAction('cancel', campaign.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{formatNumber(campaign.impressions)} views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          <span>{formatNumber(campaign.clicks)} clicks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.creditsSpent} / {campaign.totalBudget}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.conversions} conv.</span>
                        </div>
                      </div>

                      {/* Budget Progress */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Budget Used</span>
                          <span>{Math.round((campaign.creditsSpent / campaign.totalBudget) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min((campaign.creditsSpent / campaign.totalBudget) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </FeatureFlagGate>
  );
}
