'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreateTimeline, useTimeline, useUpdateTimeline, useAddTimelineItem, useUpdateTimelineItem, useDeleteTimelineItem } from '@/hooks/queries/use-timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, Calendar, Plus, Edit, Trash2, Settings, Sparkles, ChevronRight, Loader2, LayoutGrid, List as ListIcon } from 'lucide-react'
import { TIMELINE_TEMPLATES, type TimelineTemplate } from '@/lib/data/recommended-templates'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { TimelineForm } from '@/components/forms/timeline-form'
import { TimelineItemForm } from '@/components/forms/timeline-item-form'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
}

// Format time from "14:30" to "2:30 PM"
function formatTimeDisplay(time?: string): string {
  if (!time) return ''

  // Handle already formatted time (e.g., "2:30 PM")
  if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
    return time
  }

  // Parse HH:MM format
  const [hours, minutes] = time.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return time

  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function TimelinePanel({ eventId, defaultDate }: { eventId: string; defaultDate?: string | null }) {
  const [isCreateTimelineOpen, setIsCreateTimelineOpen] = useState(false)
  const [isEditTimelineOpen, setIsEditTimelineOpen] = useState(false)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  const { data, isLoading, error } = useTimeline(eventId)
  const createTimeline = useCreateTimeline()
  const updateTimeline = useUpdateTimeline(eventId)
  const addItem = useAddTimelineItem(eventId)
  const updateItem = useUpdateTimelineItem(eventId)
  const deleteItem = useDeleteTimelineItem(eventId)
  const resolvedTimelineId = (data as any)?.id ?? (data as any)?.timelineId

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
    setIsCreateTimelineOpen(false)
  }

  const onCreateFromTemplate = async (template: TimelineTemplate) => {
    setIsCreatingFromTemplate(true)
    try {
      const eventDate = defaultDate?.slice(0, 10) || new Date().toISOString().slice(0, 10)
      const result = await createTimeline.mutateAsync({
        eventId,
        name: template.name,
        eventDate,
      })

      if (result?.id) {
        for (const item of template.items) {
          await addItem.mutateAsync({
            timelineId: result.id,
            item: {
              title: item.title,
              description: item.description,
              scheduledTime: item.scheduledTime,
              duration: item.duration,
            },
          })
        }
        toast.success(`Timeline created with ${template.items.length} items!`)
      } else {
        toast.error('Failed to create timeline - no ID returned')
      }
    } catch (err) {
      console.error('Failed to create timeline from template:', err)
      toast.error('Failed to create timeline')
    } finally {
      setIsCreatingFromTemplate(false)
    }
  }

  const handleUpdateTimeline = async (values: any) => {
    if (!resolvedTimelineId) {
      toast.error('Timeline ID missing. Refresh the page and try again.')
      throw new Error('Timeline ID missing')
    }

    try {
      await updateTimeline.mutateAsync({
        id: resolvedTimelineId,
        updates: {
          name: values.name,
          eventDate: values.eventDate,
        },
      })
      toast.success('Timeline updated')
    } catch {
      toast.error('Failed to update timeline')
      throw new Error('Failed to update timeline')
    }
  }

  const handleAddItem = async (values: any) => {
    if (!resolvedTimelineId) {
      toast.error('Timeline ID missing. Refresh the page and try again.')
      throw new Error('Timeline ID missing')
    }

    try {
      await addItem.mutateAsync({
        timelineId: resolvedTimelineId,
        item: {
          title: values.title,
          description: values.description,
          scheduledTime: values.scheduledTime,
          duration: values.duration,
        },
      })
      toast.success('Timeline item added')
    } catch {
      toast.error('Failed to add timeline item')
      throw new Error('Failed to add timeline item')
    }
  }

  const handleUpdateItem = async (values: any) => {
    if (!resolvedTimelineId) {
      toast.error('Timeline ID missing. Refresh the page and try again.')
      throw new Error('Timeline ID missing')
    }

    if (!editingItem?.id) {
      toast.error('Timeline item ID missing. Re-open the item and try again.')
      throw new Error('Timeline item ID missing')
    }

    try {
      await updateItem.mutateAsync({
        timelineId: resolvedTimelineId,
        itemId: editingItem.id,
        updates: {
          title: values.title,
          description: values.description,
          scheduledTime: values.scheduledTime,
          duration: values.duration,
        },
      })
      toast.success('Timeline item updated')
      setEditingItem(null)
    } catch {
      toast.error('Failed to update timeline item')
      throw new Error('Failed to update timeline item')
    }
  }

  const handleDeleteItem = async () => {
    if (resolvedTimelineId && deleteItemId) {
      try {
        await deleteItem.mutateAsync({
          timelineId: resolvedTimelineId,
          itemId: deleteItemId,
        })
        toast.success('Timeline item deleted')
        setDeleteItemId(null)
      } catch {
        toast.error('Failed to delete timeline item')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 border-dashed border-destructive/50 bg-destructive/5 p-8 text-center"
      >
        <p className="text-sm text-destructive">Unable to load timeline.</p>
      </motion.div>
    )
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 dark:from-sky-950/30 dark:via-cyan-950/30 dark:to-blue-950/30 p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create Your Timeline</h1>
                <p className="text-muted-foreground">Plan your event day schedule</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setIsCreateTimelineOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Timeline
              </Button>
            </div>
          </div>
        </div>

        {/* Recommended Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-500" />
              Recommended Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Start with a pre-built schedule and customize it to your needs
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {TIMELINE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onCreateFromTemplate(template)}
                  disabled={isCreatingFromTemplate || createTimeline.isPending}
                  className="group flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                    {isCreatingFromTemplate ? (
                      <Loader2 className="h-5 w-5 text-sky-600 animate-spin" />
                    ) : (
                      <Calendar className="h-5 w-5 text-sky-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium group-hover:text-primary">{template.name}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {template.items.length} items
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{template.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Timeline Dialog */}
        <Dialog open={isCreateTimelineOpen} onOpenChange={setIsCreateTimelineOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Timeline</DialogTitle>
              <DialogDescription>Create a custom schedule for this event.</DialogDescription>
            </DialogHeader>
            <Form {...timelineForm}>
              <form onSubmit={timelineForm.handleSubmit(onCreateTimeline)} className="space-y-4">
                <FormField
                  control={timelineForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeline name</FormLabel>
                      <FormControl>
                        <Input placeholder="Wedding Day Schedule" {...field} />
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
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateTimelineOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTimeline.isPending}>
                    {createTimeline.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.div>
    )
  }

  const allItems = (data.items || []).slice().sort((a: any, b: any) => {
    // Sort by scheduled time
    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime)
    }
    if (a.scheduledTime) return -1
    if (b.scheduledTime) return 1
    return 0
  })

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* View Toggle & Add Button */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-xl border bg-background p-1 shadow-sm">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              onClick={() => setViewMode('card')}
              className="h-8 gap-1.5 px-3"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Card View
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="h-8 gap-1.5 px-3"
            >
              <ListIcon className="h-3.5 w-3.5" />
              List View
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditTimelineOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button size="sm" onClick={() => {
              setEditingItem(null)
              setIsItemFormOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </motion.div>

      {/* List View */}
      {viewMode === 'list' ? (
        <motion.div variants={itemVariants}>
          <Card className="border-muted/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{data.name}</CardTitle>
              <CardDescription className="text-xs">
                {allItems.length} schedule items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-lg border border-muted/60">
                <div className="grid grid-cols-12 bg-muted/50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="col-span-2">Time</div>
                  <div className="col-span-4">Event</div>
                  <div className="col-span-2">Duration</div>
                  <div className="col-span-2">Description</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <AnimatePresence mode="popLayout">
                  {allItems.map((item: any) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-12 items-center gap-2 border-t px-3 py-2 text-sm hover:bg-muted/40"
                    >
                      <div className="col-span-2">
                        <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-xs font-bold">
                          {formatTimeDisplay(item.scheduledTime)}
                        </Badge>
                      </div>
                      <div className="col-span-4 min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                      </div>
                      <div className="col-span-2 text-xs text-muted-foreground">
                        {item.duration ? `${item.duration} min` : '-'}
                      </div>
                      <div className="col-span-2 text-xs text-muted-foreground truncate">
                        {item.description || '-'}
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingItem(item)
                            setIsItemFormOpen(true)
                          }}
                          className="h-7 w-7"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteItemId(item.id)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                <AnimatePresence mode="popLayout">
                  {allItems.map((item: any) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-lg border p-3 hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-xs font-bold shrink-0">
                            {formatTimeDisplay(item.scheduledTime)}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.title}</p>
                            {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                            {item.duration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Duration: {item.duration} min
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingItem(item)
                              setIsItemFormOpen(true)
                            }}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItemId(item.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {allItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No schedule items yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Add your first item to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Card View - Grid Layout */
        <motion.div variants={itemVariants}>
          {allItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {allItems.map((item: any) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group relative rounded-xl border p-3 transition-all bg-card hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingItem(item)
                          setIsItemFormOpen(true)
                        }}
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteItemId(item.id)}
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>

                    <div className="pr-14">
                      <Badge className="mb-2 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-[10px] px-1.5 py-0 font-bold">
                        {formatTimeDisplay(item.scheduledTime)}
                      </Badge>
                      <p className="text-sm font-medium line-clamp-2 leading-tight">{item.title}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-muted/50">
                      {item.duration && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{item.duration} min</span>
                        </div>
                      )}
                      {item.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                      )}
                      {!item.duration && !item.description && (
                        <p className="text-[10px] text-muted-foreground">No details</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No schedule items yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add your first item to get started</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

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
    </motion.div>
  )
}
