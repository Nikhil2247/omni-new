'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateTimeline, useTimeline, useUpdateTimeline, useAddTimelineItem, useUpdateTimelineItem, useDeleteTimelineItem } from '@/hooks/queries/use-timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, Calendar, Plus, Edit, Trash2, Settings } from 'lucide-react'
import { TimelineForm } from '@/components/forms/timeline-form'
import { TimelineItemForm } from '@/components/forms/timeline-item-form'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const createTimelineSchema = z.object({
  name: z.string().min(2, 'Timeline name is required'),
  eventDate: z.string().min(1, 'Event date is required'),
})

type CreateTimelineValues = z.infer<typeof createTimelineSchema>

export function TimelinePanel({ eventId, defaultDate }: { eventId: string; defaultDate?: string | null }) {
  const [isEditTimelineOpen, setIsEditTimelineOpen] = useState(false)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)

  const { data, isLoading, error } = useTimeline(eventId)
  const createTimeline = useCreateTimeline()
  const updateTimeline = useUpdateTimeline(eventId)
  const addItem = useAddTimelineItem(eventId)
  const updateItem = useUpdateTimelineItem(eventId)
  const deleteItem = useDeleteTimelineItem(eventId)

  const timelineForm = useForm<CreateTimelineValues>({
    resolver: zodResolver(createTimelineSchema),
    defaultValues: {
      name: '',
      eventDate: defaultDate ? defaultDate.slice(0, 10) : '',
    },
  })

  const onCreateTimeline = async (values: CreateTimelineValues) => {
    await createTimeline.mutateAsync({
      eventId,
      name: values.name,
      eventDate: values.eventDate,
    })
    timelineForm.reset()
  }

  const handleUpdateTimeline = async (values: any) => {
    if (data?.id) {
      await updateTimeline.mutateAsync({
        id: data.id,
        updates: {
          name: values.name,
          eventDate: values.eventDate,
        },
      })
    }
  }

  const handleAddItem = async (values: any) => {
    if (data?.id) {
      await addItem.mutateAsync({
        timelineId: data.id,
        item: {
          title: values.title,
          description: values.description,
          scheduledTime: values.scheduledTime,
          duration: values.duration,
        },
      })
    }
  }

  const handleUpdateItem = async (values: any) => {
    if (data?.id && editingItem?.id) {
      await updateItem.mutateAsync({
        timelineId: data.id,
        itemId: editingItem.id,
        updates: {
          title: values.title,
          description: values.description,
          scheduledTime: values.scheduledTime,
          duration: values.duration,
        },
      })
      setEditingItem(null)
    }
  }

  const handleDeleteItem = async () => {
    if (data?.id && deleteItemId) {
      await deleteItem.mutateAsync({
        timelineId: data.id,
        itemId: deleteItemId,
      })
      setDeleteItemId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">Unable to load timeline.</div>
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create a timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...timelineForm}>
            <form onSubmit={timelineForm.handleSubmit(onCreateTimeline)} className="space-y-4">
              <FormField
                control={timelineForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeline name</FormLabel>
                    <FormControl>
                      <Input placeholder="Wedding day schedule" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={timelineForm.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createTimeline.isPending}>
                {createTimeline.isPending ? 'Creating...' : 'Create timeline'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-rose-950/30 p-6">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{data.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(data.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditTimelineOpen(true)}
              className="bg-white/50 dark:bg-black/20"
            >
              <Settings className="mr-2 h-4 w-4" />
              Edit Timeline
            </Button>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Timeline Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule ({data.items?.length || 0} items)
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingItem(null)
                setIsItemFormOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.items?.length ? (
            <div className="space-y-3">
              {data.items.map((item: any, index: number) => (
                <div
                  key={item.id || index}
                  className="group relative flex gap-4 rounded-lg border p-4 transition-all hover:shadow-md"
                >
                  {/* Time Badge */}
                  <div className="flex shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 px-3 py-2">
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {item.time || item.scheduledTime || ''}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-semibold transition-colors group-hover:text-primary">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    )}
                    {item.duration && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Duration: {item.duration} minutes
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item)
                        setIsItemFormOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteItemId(item.id || '')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No timeline items yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add items to create your event schedule
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingItem(null)
                  setIsItemFormOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forms and Dialogs */}
      <TimelineForm
        open={isEditTimelineOpen}
        onOpenChange={setIsEditTimelineOpen}
        eventId={eventId}
        timeline={data}
        onSubmit={handleUpdateTimeline}
        mode="edit"
      />

      <TimelineItemForm
        open={isItemFormOpen}
        onOpenChange={(open) => {
          setIsItemFormOpen(open)
          if (!open) setEditingItem(null)
        }}
        item={editingItem}
        onSubmit={editingItem ? handleUpdateItem : handleAddItem}
        mode={editingItem ? 'edit' : 'create'}
      />

      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
