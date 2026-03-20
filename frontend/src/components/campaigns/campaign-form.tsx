'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CampaignType, Campaign } from '@/lib/api/types/subscription.types';

const campaignSchema = z.object({
  type: z.enum(['PROFILE_BOOST', 'ALBUM_PROMOTION', 'BANNER_AD', 'FEATURED_LISTING']),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  dailyBudget: z.number().min(1, 'Daily budget must be at least 1'),
  totalBudget: z.number().min(1, 'Total budget must be at least 1'),
  startDate: z.date(),
  endDate: z.date().optional(),
}).refine(data => data.totalBudget >= data.dailyBudget, {
  message: 'Total budget must be greater than or equal to daily budget',
  path: ['totalBudget'],
}).refine(data => !data.endDate || data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  initialData?: Campaign;
  onSubmit: (data: CampaignFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CampaignForm({ initialData, onSubmit, isSubmitting }: CampaignFormProps) {
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: initialData ? {
      type: initialData.type,
      name: initialData.name,
      description: initialData.description || '',
      dailyBudget: initialData.dailyBudget,
      totalBudget: initialData.totalBudget,
      startDate: new Date(initialData.startDate),
      endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
    } : {
      type: 'PROFILE_BOOST',
      name: '',
      description: '',
      dailyBudget: 100,
      totalBudget: 1000,
      startDate: new Date(),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PROFILE_BOOST">Profile Boost</SelectItem>
                  <SelectItem value="ALBUM_PROMOTION">Album Promotion</SelectItem>
                  <SelectItem value="BANNER_AD">Banner Ad</SelectItem>
                  <SelectItem value="FEATURED_LISTING">Featured Listing</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose how you want to promote your business
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Campaign" {...field} />
              </FormControl>
              <FormDescription>
                A memorable name for your campaign
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
                  placeholder="Describe your campaign goals..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dailyBudget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Budget (Credits)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Maximum credits to spend per day
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalBudget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Budget (Credits)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Campaign stops when this is spent
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
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
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>No end date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            initialData ? 'Update Campaign' : 'Create Campaign'
          )}
        </Button>
      </form>
    </Form>
  );
}
