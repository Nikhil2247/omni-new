'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckSquare, Calendar, Award, ListChecks, Sparkles, ChevronRight, Loader2, LayoutGrid, List as ListIcon } from 'lucide-react'
import { CHECKLIST_TEMPLATES, type ChecklistTemplate } from '@/lib/data/recommended-templates'
import { useAddChecklistItem, useChecklist, useCreateChecklist, useDeleteChecklistItem, useUpdateChecklistItem } from '@/hooks/queries/use-checklists'
import { useExportChecklist } from '@/hooks/queries/use-export'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 border-dashed border-destructive/50 bg-destructive/5 p-8 text-center"
      >
        <p className="text-sm text-destructive">Unable to load checklist.</p>
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
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <CheckSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create Your Checklist</h1>
                <p className="text-muted-foreground">Never miss a task with organized to-dos</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowCreateChecklistDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Checklist
              </Button>
            </div>
          </div>
        </div>

        {/* Recommended Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Recommended Checklists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
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
                  className="group flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <ListChecks className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium group-hover:text-primary">{template.name}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {template.items.length} tasks
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
            <ExportDropdown
              type="checklist"
              id={data.id}
              filename={`checklist-${(data.name || 'checklist').toLowerCase().replace(/\s+/g, '-')}`}
              onExport={async (format) => {
                await exportChecklist.mutateAsync({ id: data.id, format })
              }}
              disabled={exportChecklist.isPending}
            />
            <Button size="sm" onClick={() => setShowAddTaskDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>
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
          <Card className="border-muted/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{data.name}</CardTitle>
              <CardDescription className="text-xs">
                {completedCount} of {totalCount} completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-lg border border-muted/60">
                <div className="grid grid-cols-12 bg-muted/50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="col-span-5">Task</div>
                  <div className="col-span-3">Due Date</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <AnimatePresence mode="popLayout">
                  {allItems.map((item: any) => {
                    const dueDate = item.dueDate ? new Date(item.dueDate) : null
                    const isOverdue = dueDate && !item.isCompleted && dueDate < new Date()

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`grid grid-cols-12 items-center gap-2 border-t px-3 py-2 text-sm ${
                          item.isCompleted ? 'bg-green-50/40 dark:bg-green-950/20' : isOverdue ? 'bg-red-50/40 dark:bg-red-950/20' : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="col-span-5 flex min-w-0 items-center gap-2">
                          <Checkbox
                            checked={item.isCompleted}
                            onCheckedChange={(checked) =>
                              updateItem.mutate({
                                itemId: item.id,
                                input: { isCompleted: Boolean(checked) },
                              })
                            }
                          />
                          <div className="min-w-0">
                            <p className={`truncate font-medium ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{item.title}</p>
                            {item.description && <p className="truncate text-xs text-muted-foreground">{item.description}</p>}
                          </div>
                        </div>
                        <div className="col-span-3 text-xs text-muted-foreground">
                          {dueDate ? (
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {isOverdue && ' (Overdue)'}
                            </span>
                          ) : '-'}
                        </div>
                        <div className="col-span-2">
                          {item.isCompleted ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">Done</Badge>
                          ) : isOverdue ? (
                            <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                          )}
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItem.mutate(item.id)}
                            className="h-7 w-7"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                <AnimatePresence mode="popLayout">
                  {allItems.map((item: any) => {
                    const dueDate = item.dueDate ? new Date(item.dueDate) : null
                    const isOverdue = dueDate && !item.isCompleted && dueDate < new Date()

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-lg border p-3 ${
                          item.isCompleted ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/20' : isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20' : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <Checkbox
                              checked={item.isCompleted}
                              onCheckedChange={(checked) =>
                                updateItem.mutate({
                                  itemId: item.id,
                                  input: { isCompleted: Boolean(checked) },
                                })
                              }
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{item.title}</p>
                              {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                              {dueDate && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <Calendar className="h-3 w-3" />
                                  <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                    {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    {isOverdue && ' (Overdue)'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItem.mutate(item.id)}
                            className="h-8 w-8 shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {totalCount === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <ListChecks className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Add your first task to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Card View - Grid Layout */
        <motion.div variants={itemVariants}>
          {totalCount > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {allItems.map((item: any) => {
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
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`group relative rounded-xl border p-3 transition-all ${
                        item.isCompleted
                          ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-900/30 dark:from-green-950/30 dark:to-emerald-950/20'
                          : isOverdue
                          ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:border-red-900/30 dark:from-red-950/30 dark:to-orange-950/20'
                          : isDueSoon
                          ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:border-orange-900/30 dark:from-orange-950/30 dark:to-amber-950/20'
                          : 'bg-card hover:border-primary/50 hover:shadow-lg'
                      }`}
                    >
                      <div className="absolute right-2 top-2 flex items-center gap-1">
                        <Checkbox
                          checked={item.isCompleted}
                          onCheckedChange={(checked) =>
                            updateItem.mutate({
                              itemId: item.id,
                              input: { isCompleted: Boolean(checked) },
                            })
                          }
                          className="h-4 w-4"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem.mutate(item.id)}
                          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>

                      <div className="pr-14">
                        {item.isCompleted ? (
                          <Badge className="mb-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0">
                            Done
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive" className="mb-2 text-[10px] px-1.5 py-0">
                            Overdue
                          </Badge>
                        ) : isDueSoon ? (
                          <Badge className="mb-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] px-1.5 py-0">
                            Due Soon
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="mb-2 text-[10px] px-1.5 py-0">
                            Pending
                          </Badge>
                        )}
                        <p className={`text-sm font-medium line-clamp-2 leading-tight ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </p>
                      </div>

                      {(dueDate || item.description) && (
                        <div className="mt-3 pt-2 border-t border-muted/50">
                          {dueDate && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                          {item.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <ListChecks className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add your first task to get started</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
