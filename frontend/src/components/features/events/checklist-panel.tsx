'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckSquare, Calendar, ListChecks, ChevronRight, Loader2, LayoutGrid, List as ListIcon } from 'lucide-react'
import { CHECKLIST_TEMPLATES, type ChecklistTemplate } from '@/lib/data/recommended-templates'
import { useAddChecklistItem, useChecklist, useCreateChecklist, useDeleteChecklistItem, useUpdateChecklistItem } from '@/hooks/queries/use-checklists'
import { useExportChecklist } from '@/hooks/queries/use-export'
import { Button } from '@/components/ui/button'
import { Brush, BrushBar, Chip, Eyebrow, Ico, ICONS, PaintedNum, Paper, SketchButton, Stamp, skPaper } from '@/components/sketch'
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportDropdown } from '@/components/common/export-dropdown'
import { toast } from 'sonner'

const createChecklistSchema = z.object({
  name: z.string().min(2, 'Checklist name is required'),
})

type CreateChecklistValues = z.infer<typeof createChecklistSchema>

const addItemSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
})

type AddItemValues = z.infer<typeof addItemSchema>

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

export function ChecklistPanel({ eventId }: { eventId: string }) {
  const [showCreateChecklistDialog, setShowCreateChecklistDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  const { data, isLoading, error } = useChecklist(eventId)
  const createChecklist = useCreateChecklist()
  const addItem = useAddChecklistItem(eventId, data?.id)
  const updateItem = useUpdateChecklistItem(eventId)
  const deleteItem = useDeleteChecklistItem(eventId)
  const exportChecklist = useExportChecklist({
    onSuccess: () => toast.success('Export downloaded'),
    onError: () => toast.error('Export failed'),
  })

  const checklistForm = useForm<CreateChecklistValues>({
    resolver: zodResolver(createChecklistSchema),
    defaultValues: { name: '' },
  })

  const itemForm = useForm<AddItemValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: { title: '', description: '', dueDate: '' },
  })

  const onCreateChecklist = async (values: CreateChecklistValues) => {
    await createChecklist.mutateAsync({ eventId, name: values.name })
    checklistForm.reset()
    setShowCreateChecklistDialog(false)
  }

  const onAddItem = async (values: AddItemValues) => {
    await addItem.mutateAsync({
      title: values.title,
      description: values.description || undefined,
      dueDate: values.dueDate || undefined,
    })
    itemForm.reset()
    setShowAddTaskDialog(false)
  }

  const onCreateFromTemplate = async (template: ChecklistTemplate, name: string) => {
    setIsCreatingFromTemplate(true)
    try {
      const result = await createChecklist.mutateAsync({
        eventId,
        name,
      })

      if (result?.id) {
        for (const item of template.items) {
          await addItem.mutateAsync({
            checklistId: result.id,
            title: item.title,
            description: item.description || undefined,
          })
        }
        toast.success(`Checklist created with ${template.items.length} tasks!`)
      } else {
        toast.error('Failed to create checklist - no ID returned')
      }
    } catch (err) {
      console.error('Failed to create checklist from template:', err)
      toast.error('Failed to create checklist')
    } finally {
      setIsCreatingFromTemplate(false)
      setShowTemplateDialog(false)
      setSelectedTemplate(null)
      checklistForm.reset()
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
          <p className="text-rose text-sm font-semibold">Unable to load checklist.</p>
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
          <Eyebrow>Checklist</Eyebrow>
          <h2 className="font-display mt-2.5 text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.05] font-semibold tracking-tight">
            Create Your <Brush>Checklist</Brush>
          </h2>
          <p className="text-ink-soft mt-2">Never miss a task with organized to-dos</p>
          <div className="mt-5 flex gap-3">
            <SketchButton onClick={() => setShowCreateChecklistDialog(true)}>
              <Plus className="h-4 w-4" />
              Create Custom Checklist
            </SketchButton>
          </div>
        </Paper>

        {/* Recommended Templates */}
        <Paper alt className="px-6 py-5">
          <h2 className="font-display text-xl font-semibold">Recommended Checklists</h2>
          <p className="text-ink-soft mt-1 mb-4 text-sm">
            Start with a pre-built checklist and customize it to your needs
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHECKLIST_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template)
                  setShowTemplateDialog(true)
                }}
                disabled={isCreatingFromTemplate || createChecklist.isPending}
                className={skPaper({
                  className:
                    'group flex items-start gap-3 px-4 py-3.5 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
                })}
              >
                <PaintedNum tone="green">
                  <ListChecks className="h-4 w-4" />
                </PaintedNum>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display font-semibold">{template.name}</p>
                    <Chip>{template.items.length} tasks</Chip>
                  </div>
                  <p className="text-ink-soft line-clamp-1 text-sm">{template.description}</p>
                </div>
                <ChevronRight className="text-ink-soft h-5 w-5 shrink-0" />
              </button>
            ))}
          </div>
        </Paper>

        {/* Custom Checklist Dialog */}
        <Dialog open={showCreateChecklistDialog} onOpenChange={setShowCreateChecklistDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Checklist</DialogTitle>
              <DialogDescription>Set up your checklist for this event.</DialogDescription>
            </DialogHeader>
            <Form {...checklistForm}>
              <form onSubmit={checklistForm.handleSubmit(onCreateChecklist)} className="space-y-4">
                <FormField
                  control={checklistForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Checklist name</FormLabel>
                      <FormControl>
                        <Input placeholder="Wedding Planning Checklist" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateChecklistDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createChecklist.isPending}>
                    {createChecklist.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Template Checklist Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Use {selectedTemplate?.name} Template</DialogTitle>
              <DialogDescription>
                This will create a checklist with {selectedTemplate?.items.length} pre-defined tasks.
              </DialogDescription>
            </DialogHeader>

            <Form {...checklistForm}>
              <form
                onSubmit={checklistForm.handleSubmit((values) => {
                  if (selectedTemplate) {
                    onCreateFromTemplate(selectedTemplate, values.name)
                  }
                })}
                className="space-y-4"
              >
                <FormField
                  control={checklistForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Checklist name</FormLabel>
                      <FormControl>
                        <Input placeholder={selectedTemplate?.name || 'My Checklist'} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedTemplate && (
                  <div className="rounded-lg border bg-muted/30 p-3 max-h-48 overflow-y-auto">
                    <p className="text-xs font-medium mb-2">Tasks included:</p>
                    <div className="space-y-1">
                      {selectedTemplate.items.slice(0, 8).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <CheckSquare className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{item.title}</span>
                        </div>
                      ))}
                      {selectedTemplate.items.length > 8 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{selectedTemplate.items.length - 8} more tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isCreatingFromTemplate}
                    onClick={() => {
                      setShowTemplateDialog(false)
                      setSelectedTemplate(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingFromTemplate || createChecklist.isPending}>
                    {isCreatingFromTemplate ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating tasks...
                      </>
                    ) : createChecklist.isPending ? (
                      'Creating...'
                    ) : (
                      'Create Checklist'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.div>
    )
  }

  const completedCount = data.items?.filter((item: any) => item.isCompleted).length || 0
  const totalCount = data.items?.length || 0
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isComplete = progress === 100 && totalCount > 0

  const allItems = (data.items || []).slice().sort((a: any, b: any) => {
    // Sort by completion status first (incomplete first), then by due date
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    if (a.dueDate) return -1
    if (b.dueDate) return 1
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
              <ExportDropdown
                type="checklist"
                id={data.id}
                filename={`checklist-${(data.name || 'checklist').toLowerCase().replace(/\s+/g, '-')}`}
                onExport={async (format) => {
                  await exportChecklist.mutateAsync({ id: data.id, format })
                }}
                disabled={exportChecklist.isPending}
              />
              <SketchButton size="sm" onClick={() => setShowAddTaskDialog(true)}>
                <Plus className="h-4 w-4" />
                Add Task
              </SketchButton>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="sk-eyebrow">Overall progress</span>
              <span className="flex items-center gap-2 font-semibold">
                {isComplete && <Stamp>All done</Stamp>}
                {progress}%
              </span>
            </div>
            <BrushBar value={progress} tone="green" />
          </div>
        </Paper>
      </motion.div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add new task</DialogTitle>
            <DialogDescription>Add a task to your checklist.</DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onAddItem)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={itemForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task title</FormLabel>
                      <FormControl>
                        <Input placeholder="Book photographer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Additional details..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddTaskDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addItem.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {addItem.isPending ? 'Adding...' : 'Add task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* List View */}
      {viewMode === 'list' ? (
        <motion.div variants={itemVariants}>
          <Paper className="px-5 py-4">
            <h2 className="font-display text-xl font-semibold">{data.name}</h2>
            <p className="text-ink-soft mb-1 text-sm">
              {completedCount} of {totalCount} completed
            </p>

            <ul>
              <AnimatePresence mode="popLayout">
                {allItems.map((item: any) => {
                  const dueDate = item.dueDate ? new Date(item.dueDate) : null
                  const isOverdue = dueDate && !item.isCompleted && dueDate < new Date()

                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-line flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-dashed py-3 last:border-b-0"
                    >
                      <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
                        <input
                          type="checkbox"
                          className="sk-check"
                          aria-label={`Mark "${item.title}" as ${item.isCompleted ? 'not done' : 'done'}`}
                          checked={!!item.isCompleted}
                          onChange={(e) =>
                            updateItem.mutate({
                              itemId: item.id,
                              input: { isCompleted: e.target.checked },
                            })
                          }
                        />
                        <div className="min-w-0">
                          <p className={`font-semibold ${item.isCompleted ? 'text-ink-soft line-through' : ''}`}>{item.title}</p>
                          {item.description && <p className="text-ink-soft truncate text-sm">{item.description}</p>}
                        </div>
                      </div>
                      <div className="text-ink-soft flex items-center gap-1.5 text-sm">
                        {dueDate ? (
                          <>
                            <Calendar className="h-3.5 w-3.5" />
                            <span className={isOverdue ? 'text-rose font-semibold' : ''}>
                              {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </>
                        ) : (
                          '-'
                        )}
                      </div>
                      <div>
                        {item.isCompleted ? (
                          <Stamp>Done</Stamp>
                        ) : isOverdue ? (
                          <Stamp tone="late">Overdue</Stamp>
                        ) : (
                          <Stamp tone="wait">Pending</Stamp>
                        )}
                      </div>
                      <SketchButton
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete task ${item.title}`}
                        onClick={() => deleteItem.mutate(item.id)}
                      >
                        <Trash2 className="text-rose h-4 w-4" />
                      </SketchButton>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>

            {totalCount === 0 && <EmptyTasks />}
          </Paper>
        </motion.div>
      ) : (
        /* Card View - Grid Layout */
        <motion.div variants={itemVariants}>
          {totalCount > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {allItems.map((item: any, idx: number) => {
                  const dueDate = item.dueDate ? new Date(item.dueDate) : null
                  const isOverdue = dueDate && !item.isCompleted && dueDate < new Date()
                  const isDueSoon = dueDate && !item.isCompleted && dueDate > new Date() &&
                    (dueDate.getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -2 }}
                      className={skPaper({ alt: idx % 2 === 1, className: 'group relative px-4 py-3.5' })}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="sk-check mt-0.5"
                          aria-label={`Mark "${item.title}" as ${item.isCompleted ? 'not done' : 'done'}`}
                          checked={!!item.isCompleted}
                          onChange={(e) =>
                            updateItem.mutate({
                              itemId: item.id,
                              input: { isCompleted: e.target.checked },
                            })
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5">
                            {item.isCompleted ? (
                              <Stamp>Done</Stamp>
                            ) : isOverdue ? (
                              <Stamp tone="late">Overdue</Stamp>
                            ) : isDueSoon ? (
                              <Stamp tone="wait">Due Soon</Stamp>
                            ) : (
                              <Stamp tone="wait">Pending</Stamp>
                            )}
                          </div>
                          <p className={`font-semibold leading-tight ${item.isCompleted ? 'text-ink-soft line-through' : ''}`}>
                            {item.title}
                          </p>
                        </div>
                        <SketchButton
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete task ${item.title}`}
                          onClick={() => deleteItem.mutate(item.id)}
                          className="shrink-0 opacity-60 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <Trash2 className="text-rose h-4 w-4" />
                        </SketchButton>
                      </div>

                      {(dueDate || item.description) && (
                        <div className="border-line mt-3 border-t-2 border-dashed pt-2">
                          {dueDate && (
                            <div className="text-ink-soft flex items-center gap-1.5 text-xs">
                              <Calendar className="h-3 w-3" />
                              <span className={isOverdue ? 'text-rose font-semibold' : ''}>
                                {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                          {item.description && (
                            <p className="text-ink-soft mt-1 line-clamp-2 text-xs">{item.description}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <Paper className="px-5 py-4">
              <EmptyTasks />
            </Paper>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

function EmptyTasks() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Ico d={ICONS.planner} className="text-blue mb-3 h-10 w-10" />
      <p className="font-display text-lg font-semibold">No tasks yet</p>
      <p className="text-ink-soft mt-1 text-sm">Add your first task to get started</p>
    </div>
  )
}
