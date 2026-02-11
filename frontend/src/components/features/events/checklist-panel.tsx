'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckSquare, Calendar, Clock, Award, ListChecks, Sparkles } from 'lucide-react'
import { useAddChecklistItem, useChecklist, useCreateChecklist, useDeleteChecklistItem, useUpdateChecklistItem } from '@/hooks/queries/use-checklists'
import { useExportChecklist } from '@/hooks/queries/use-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportDropdown } from '@/components/common/export-dropdown'
import { Progress } from '@/components/ui/progress'
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
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
}

export function ChecklistPanel({ eventId }: { eventId: string }) {
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
  }

  const onAddItem = async (values: AddItemValues) => {
    await addItem.mutateAsync({
      title: values.title,
      description: values.description || undefined,
      dueDate: values.dueDate || undefined,
    })
    itemForm.reset()
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
      >
        <Card className="overflow-hidden border-2">
          <div className="relative overflow-hidden bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg"
              >
                <CheckSquare className="h-10 w-10 text-white" />
              </motion.div>
              <CardTitle className="mb-2 text-center text-2xl">Create your first checklist</CardTitle>
              <CardDescription className="text-center">
                Organize your wedding tasks and never miss a detail
              </CardDescription>
            </div>
          </div>
          <CardContent className="p-6">
            <Form {...checklistForm}>
              <form onSubmit={checklistForm.handleSubmit(onCreateChecklist)} className="space-y-4">
                <FormField
                  control={checklistForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Checklist name</FormLabel>
                      <FormControl>
                        <Input placeholder="Wedding Venue Checklist" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createChecklist.isPending} className="w-full">
                  {createChecklist.isPending ? 'Creating...' : 'Create checklist'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const completedCount = data.items?.filter(item => item.isCompleted).length || 0
  const totalCount = data.items?.length || 0
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isComplete = progress === 100 && totalCount > 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Stats Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="relative overflow-hidden bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            
            <div className="relative z-10 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ${
                      isComplete 
                        ? 'bg-linear-to-br from-green-500 to-emerald-600' 
                        : 'bg-linear-to-br from-blue-500 to-indigo-600'
                    }`}
                  >
                    {isComplete ? (
                      <Award className="h-6 w-6 text-white" />
                    ) : (
                      <CheckSquare className="h-6 w-6 text-white" />
                    )}
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold">{data.name}</h1>
                    <p className="text-xs text-muted-foreground">
                      {completedCount} of {totalCount} tasks completed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Progress Circle */}
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <svg className="h-20 w-20 -rotate-90 transform">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        className="text-muted/20"
                        strokeWidth="6"
                        fill="none"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke={isComplete ? "url(#gradient-green)" : "url(#gradient-blue)"}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 226.19" }}
                        animate={{ strokeDasharray: `${(progress / 100) * 226.19} 226.19` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                          <stop offset="100%" stopColor="rgb(99, 102, 241)" />
                        </linearGradient>
                        <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                          <stop offset="100%" stopColor="rgb(16, 185, 129)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span 
                        key={progress}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xl font-bold"
                      >
                        {progress}%
                      </motion.span>
                    </div>
                  </div>

                  <ExportDropdown
                    type="checklist"
                    id={data.id}
                    filename={`checklist-${(data.name || 'checklist').toLowerCase().replace(/\s+/g, '-')}`}
                    onExport={async (format) => {
                      await exportChecklist.mutateAsync({ id: data.id, format })
                    }}
                    disabled={exportChecklist.isPending}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Task Card */}
      <motion.div variants={itemVariants}>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Add New Task</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
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
                <Button type="submit" disabled={addItem.isPending} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {addItem.isPending ? 'Adding...' : 'Add task'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tasks List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Tasks</CardTitle>
              </div>
              {totalCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  {completedCount}/{totalCount}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {totalCount > 0 ? (
              <motion.div layout className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {data.items?.map((item) => {
                    const dueDate = item.dueDate ? new Date(item.dueDate) : null
                    const isOverdue = dueDate && !item.isCompleted && dueDate < new Date()
                    const isDueSoon = dueDate && !item.isCompleted && dueDate > new Date() && 
                      (dueDate.getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        variants={itemVariants}
                        exit="exit"
                        whileHover={{ scale: 1.01, x: 4 }}
                        className={`group flex items-start justify-between gap-4 rounded-lg border p-3 transition-all ${
                          item.isCompleted 
                            ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/20' 
                            : isOverdue
                            ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20'
                            : isDueSoon
                            ? 'border-orange-200 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-950/20'
                            : 'hover:border-primary/50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="pt-1">
                            <Checkbox
                              checked={item.isCompleted}
                              onCheckedChange={(checked) =>
                                updateItem.mutate({
                                  itemId: item.id,
                                  input: { isCompleted: Boolean(checked) },
                                })
                              }
                              className="h-5 w-5"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className={`font-medium transition-all ${
                              item.isCompleted 
                                ? 'line-through text-muted-foreground' 
                                : ''
                            }`}>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                            {dueDate && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Calendar className="h-3 w-3" />
                                <span className={
                                  item.isCompleted
                                    ? 'text-muted-foreground'
                                    : isOverdue
                                    ? 'font-medium text-red-600 dark:text-red-400'
                                    : isDueSoon
                                    ? 'font-medium text-orange-600 dark:text-orange-400'
                                    : 'text-muted-foreground'
                                }>
                                  Due {dueDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                  {isOverdue && ' (Overdue)'}
                                  {isDueSoon && ' (Due soon)'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem.mutate(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <ListChecks className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add your first task to get started</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
