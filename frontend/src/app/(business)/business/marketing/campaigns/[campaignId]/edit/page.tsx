'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { CampaignForm } from '@/components/campaigns/campaign-form';
import { useCampaign, useUpdateCampaign } from '@/hooks/queries/use-subscription';
import { toast } from 'sonner';

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const { data: campaign, isLoading } = useCampaign(campaignId);
  const updateCampaign = useUpdateCampaign();

  const handleSubmit = async (data: any) => {
    try {
      await updateCampaign.mutateAsync({
        campaignId,
        payload: {
          name: data.name,
          description: data.description,
          dailyBudget: data.dailyBudget,
          totalBudget: data.totalBudget,
          endDate: data.endDate?.toISOString(),
        },
      });

      toast.success('Campaign updated successfully');
      router.push(`/business/marketing/campaigns/${campaignId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update campaign');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-3">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-semibold mb-2">Campaign not found</h2>
            <Link href="/business/marketing/campaigns">
              <Button>Back to Campaigns</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only allow editing of DRAFT or SCHEDULED campaigns
  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    return (
      <div className="space-y-3">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-semibold mb-2">Cannot edit this campaign</h2>
            <p className="text-muted-foreground mb-4">
              Only draft or scheduled campaigns can be edited.
            </p>
            <Link href={`/business/marketing/campaigns/${campaignId}`}>
              <Button>View Campaign</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-2">
      <Link
        href={`/business/marketing/campaigns/${campaignId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Campaign
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignForm
            initialData={campaign}
            onSubmit={handleSubmit}
            isSubmitting={updateCampaign.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
