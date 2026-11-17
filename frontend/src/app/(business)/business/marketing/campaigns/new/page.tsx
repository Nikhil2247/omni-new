'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Loader2,
  Check,
  TrendingUp,
  Image,
  Megaphone,
  Star,
  Coins,
  Rocket,
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateCampaign, useAdCreditBalance } from '@/hooks/queries/use-subscription';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { FeatureFlagGate, FeatureDisabledMessage } from '@/components/common';

const campaignSchema = z.object({
  type: z.enum(['PROFILE_BOOST', 'ALBUM_PROMOTION', 'BANNER_AD', 'FEATURED_LISTING']),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  dailyBudget: z.number().min(1, 'Daily budget must be at least 1'),
  totalBudget: z.number().min(1, 'Total budget must be at least 1'),
  startDate: z.date(),
  endDate: z.date().optional(),
}).refine(data => data.totalBudget >= data.dailyBudget, {
  message: 'Total budget must be >= daily budget',
  path: ['totalBudget'],
}).refine(data => !data.endDate || data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const campaignTypes = [
  {
    id: 'PROFILE_BOOST',
    name: 'Profile Boost',
    description: 'Increase your profile visibility in search results and get more inquiries',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  {
    id: 'ALBUM_PROMOTION',
    name: 'Album Promotion',
    description: 'Showcase your best work to more event planners looking for vendors',
    icon: Image,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  {
    id: 'BANNER_AD',
    name: 'Banner Ad',
    description: 'Display eye-catching banner ads across the platform',
    icon: Megaphone,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
  },
  {
    id: 'FEATURED_LISTING',
    name: 'Featured Listing',
    description: 'Get premium placement on homepage and category pages',
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
  },
];

const steps = [
  { id: 1, name: 'Type', description: 'Choose campaign type' },
  { id: 2, name: 'Details', description: 'Name your campaign' },
  { id: 3, name: 'Budget', description: 'Set budget & schedule' },
];

// Helper to get today at start of day for date comparison
const today = startOfDay(new Date());

// Trigger confetti celebration
function triggerConfetti() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const createCampaign = useCreateCampaign();
  const { data: balance } = useAdCreditBalance();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      type: 'PROFILE_BOOST',
      name: '',
      description: '',
      dailyBudget: 100,
      totalBudget: 1000,
      startDate: new Date(),
    },
  });

  const selectedType = form.watch('type');
  const selectedTypeConfig = campaignTypes.find(t => t.id === selectedType);
  const availableCredits = balance?.balance || 0;
  const totalBudget = form.watch('totalBudget');
  const hasInsufficientCredits = availableCredits < totalBudget;

  const handleSubmit = async (data: CampaignFormData) => {
    if (hasInsufficientCredits) {
      toast.error(`Insufficient credits. You need ${data.totalBudget} credits but only have ${availableCredits}.`);
      return;
    }

    try {
      const campaign = await createCampaign.mutateAsync({
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
      });

      // Trigger confetti celebration
      triggerConfetti();
      toast.success('Campaign created successfully!');

      // Navigate after a brief delay for confetti effect
      setTimeout(() => {
        router.push(`/business/marketing/campaigns/${campaign.id}`);
      }, 1500);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create campaign';
      toast.error(errorMessage);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    if (currentStep === 1) return !!selectedType;
    if (currentStep === 2) return !!form.watch('name');
    return true;
  };

  return (
    <FeatureFlagGate
      feature="marketing.campaigns"
      fallback={<FeatureDisabledMessage feature="Campaigns & Ads" backUrl="/business/marketing/campaigns" backText="Back to Campaigns" />}
    >
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        {/* Header */}
        <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/business/marketing/campaigns"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg border bg-background hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                  <h1 className="text-xl font-semibold">Create Campaign</h1>
                  <p className="text-sm text-muted-foreground">Set up a new advertising campaign</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
                <Coins className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Balance: </span>
                  <span className="font-semibold">{availableCredits.toLocaleString()} credits</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="container py-4">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      currentStep > step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.id
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <div className="hidden sm:block">
                    <p className={cn(
                      'text-sm font-medium',
                      currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-1 mx-4 rounded-full transition-colors',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Step 1: Campaign Type */}
            {currentStep === 1 && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-4">
                  <h2 className="text-base font-bold mb-2">What type of campaign?</h2>
                  <p className="text-muted-foreground">Choose how you want to promote your business</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {campaignTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => form.setValue('type', type.id as any)}
                        className={cn(
                          'relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md',
                          isSelected
                            ? `${type.borderColor} ${type.bgColor}/30 shadow-md`
                            : 'border-border bg-background hover:border-muted-foreground/30'
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className={cn('p-3 rounded-xl', type.bgColor)}>
                            <Icon className={cn('h-6 w-6', type.color)} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{type.name}</h3>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-4">
                  <h2 className="text-base font-bold mb-2">Campaign Details</h2>
                  <p className="text-muted-foreground">Give your campaign a name and description</p>
                </div>
                <div className="bg-background rounded-xl border p-4 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                    {selectedTypeConfig && (
                      <>
                        <div className={cn('p-2 rounded-lg', selectedTypeConfig.bgColor)}>
                          <selectedTypeConfig.icon className={cn('h-4 w-4', selectedTypeConfig.color)} />
                        </div>
                        <span className="font-medium">{selectedTypeConfig.name}</span>
                      </>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Summer Wedding Promotion"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A memorable name to identify your campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your campaign goals and target audience..."
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Budget & Schedule */}
            {currentStep === 3 && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-4">
                  <h2 className="text-base font-bold mb-2">Budget & Schedule</h2>
                  <p className="text-muted-foreground">Set your spending limits and campaign duration</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-5">
                  {/* Main Form */}
                  <div className="lg:col-span-3 bg-background rounded-xl border p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-4">Budget</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="dailyBudget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Daily Budget</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min={1}
                                    className="h-12 pr-16"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    credits
                                  </span>
                                </div>
                              </FormControl>
                              <FormDescription>Maximum spend per day</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="totalBudget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Budget</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min={1}
                                    className="h-12 pr-16"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    credits
                                  </span>
                                </div>
                              </FormControl>
                              <FormDescription>Campaign stops when exhausted</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    <div>
                      <h3 className="font-semibold mb-4">Schedule</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        'h-12 justify-start text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => startOfDay(date) < today}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Date (Optional)</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        'h-12 justify-start text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, 'PPP') : 'No end date'}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date <= form.getValues('startDate')}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                Leave empty to run until budget is exhausted
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Sidebar */}
                  <div className="lg:col-span-2">
                    <div className="bg-background rounded-xl border p-4 sticky top-24">
                      <h3 className="font-semibold mb-4">Campaign Summary</h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-medium">{selectedTypeConfig?.name}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium truncate max-w-[140px]">
                            {form.watch('name') || '-'}
                          </span>
                        </div>
                        <div className="h-px bg-border" />
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Daily Budget</span>
                          <span className="font-medium">{form.watch('dailyBudget')} credits</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Total Budget</span>
                          <span className="font-medium">{totalBudget} credits</span>
                        </div>
                        <div className="h-px bg-border" />
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Your Balance</span>
                          <span className={cn(
                            'font-semibold',
                            hasInsufficientCredits ? 'text-red-600' : 'text-green-600'
                          )}>
                            {availableCredits.toLocaleString()} credits
                          </span>
                        </div>
                      </div>

                      {hasInsufficientCredits && (
                        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
                          <p className="text-sm text-red-700 mb-2">
                            Insufficient credits for this campaign.
                          </p>
                          <Link
                            href="/business/marketing/credits"
                            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                          >
                            <Coins className="h-3.5 w-3.5 mr-1.5" />
                            Buy More Credits
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="max-w-4xl mx-auto mt-8">
              <div className="flex items-center justify-between p-4 rounded-xl bg-background border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createCampaign.isPending || hasInsufficientCredits}
                    className="gap-2 min-w-[160px]"
                  >
                    {createCampaign.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4" />
                        Launch Campaign
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
      </div>
    </FeatureFlagGate>
  );
}
