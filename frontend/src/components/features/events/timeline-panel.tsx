'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreateTimeline, useTimeline, useUpdateTimeline, useAddTimelineItem, useUpdateTimelineItem, useDeleteTimelineItem } from '@/hooks/queries/use-timeline'
import { Button } from '@/components/ui/button'
import { Brush, Chip, Eyebrow, Ico, ICONS, PaintedNum, Paper, SketchButton, skPaper } from '@/components/sketch'
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
import { Clock, Calendar, Plus, Edit, Trash2, Settings, ChevronRight, Loader2, LayoutGrid, List as ListIcon } from 'lucide-react'
import { TIMELINE_TEMPLATES, type TimelineTemplate } from '@/lib/data/recommended-templates'
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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Paper className="px-6 py-8 text-center">
          <p className="text-rose text-sm font-semibold">Unable to load timeline.</p>
        </Paper>
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
        <Paper className="px-6 py-6">
          <Eyebrow>Timeline</Eyebrow>
          <h2 className="font-display mt-2.5 text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.05] font-semibold tracking-tight">
            Create Your <Brush>Timeline</Brush>
          </h2>
          <p className="text-ink-soft mt-2">Plan your event day schedule</p>
          <div className="mt-5 flex gap-3">
            <SketchButton onClick={() => setIsCreateTimelineOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Custom Timeline
            </SketchButton>
          </div>
        </Paper>

        {/* Recommended Templates */}
        <Paper alt className="px-6 py-5">
          <h2 className="font-display text-xl font-semibold">Recommended Schedules</h2>
          <p className="text-ink-soft mt-1 mb-4 text-sm">
            Start with a pre-built schedule and customize it to your needs
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {TIMELINE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onCreateFromTemplate(template)}
                disabled={isCreatingFromTemplate || createTimeline.isPending}
                className={skPaper({
                  className:
                    'group flex items-start gap-3 px-4 py-3.5 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
                })}
              >
                <PaintedNum>
                  {isCreatingFromTemplate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                </PaintedNum>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display font-semibold">{template.name}</p>
                    <Chip>{template.items.length} items</Chip>
                  </div>
                  <p className="text-ink-soft line-clamp-1 text-sm">{template.description}</p>
                </div>
                <ChevronRight className="text-ink-soft h-5 w-5 shrink-0" />
              </button>
            ))}
          </div>
        </Paper>

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
        <Paper className="px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <SketchButton
                size="sm"
                variant={viewMode === 'card' ? 'solid' : 'line'}
                aria-pressed={viewMode === 'card'}
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Card View
              </SketchButton>
              <SketchButton
                size="sm"
                variant={viewMode === 'list' ? 'solid' : 'line'}
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
              >
                <ListIcon className="h-3.5 w-3.5" />
                List View
              </SketchButton>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SketchButton variant="line" size="sm" onClick={() => setIsEditTimelineOpen(true)}>
                <Settings className="h-4 w-4" />
                Settings
              </SketchButton>
              <SketchButton
                size="sm"
                onClick={() => {
                  setEditingItem(null)
                  setIsItemFormOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Add Item
              </SketchButton>
            </div>
          </div>
        </Paper>
      </motion.div>

      {/* List View */}
      {viewMode === 'list' ? (
        <motion.div variants={itemVariants}>
          <Paper className="px-5 py-4">
            <h2 className="font-display text-xl font-semibold">{data.name}</h2>
            <p className="text-ink-soft mb-1 text-sm">{allItems.length} schedule items</p>

            <ul>
              <AnimatePresence mode="popLayout">
                {allItems.map((item: any) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-line flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-dashed py-3 last:border-b-0"
                  >
                    <b className="font-display w-24 shrink-0 text-base">{formatTimeDisplay(item.scheduledTime)}</b>
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="font-semibold">{item.title}</p>
                      {item.description && <p className="text-ink-soft text-sm">{item.description}</p>}
                    </div>
                    {item.duration ? <Chip>{item.duration} min</Chip> : null}
                    <div className="flex gap-1">
                      <SketchButton
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${item.title}`}
                        onClick={() => {
                          setEditingItem(item)
                          setIsItemFormOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </SketchButton>
                      <SketchButton
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${item.title}`}
                        onClick={() => setDeleteItemId(item.id)}
                      >
                        <Trash2 className="text-rose h-4 w-4" />
                      </SketchButton>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {allItems.length === 0 && <EmptyItems />}
          </Paper>
        </motion.div>
      ) : (
        /* Card View - vertical dotted timeline */
        <motion.div variants={itemVariants}>
          {allItems.length > 0 ? (
            <Paper className="px-5 py-5">
              <h2 className="font-display mb-3 text-xl font-semibold">{data.name}</h2>
              <ol className="relative grid gap-5 pl-[30px] before:absolute before:top-1.5 before:bottom-1.5 before:left-[8px] before:border-l-[3px] before:border-dotted before:border-ink-soft">
                <AnimatePresence mode="popLayout">
                  {allItems.map((item: any) => (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="relative before:absolute before:top-[6px] before:-left-[29px] before:size-[15px] before:rounded-[50%_46%_52%_48%] before:bg-blue"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <b className="font-display block text-lg leading-tight">{formatTimeDisplay(item.scheduledTime)}</b>
                          <p className="font-semibold">{item.title}</p>
                          {item.description && <p className="text-ink-soft mt-0.5 text-sm">{item.description}</p>}
                          {item.duration ? (
                            <Chip className="mt-2">
                              <Clock className="h-3 w-3" />
                              {item.duration} min
                            </Chip>
                          ) : null}
                        </div>
                        <div className="flex gap-1">
                          <SketchButton
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${item.title}`}
                            onClick={() => {
                              setEditingItem(item)
                              setIsItemFormOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </SketchButton>
                          <SketchButton
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${item.title}`}
                            onClick={() => setDeleteItemId(item.id)}
                          >
                            <Trash2 className="text-rose h-4 w-4" />
                          </SketchButton>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            </Paper>
          ) : (
            <Paper className="px-5 py-4">
              <EmptyItems />
            </Paper>
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


function EmptyItems() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Ico d={ICONS.clock} className="text-blue mb-3 h-10 w-10" />
      <p className="font-display text-lg font-semibold">No schedule items yet</p>
      <p className="text-ink-soft mt-1 text-sm">Add your first item to get started</p>
    </div>
  )
}
