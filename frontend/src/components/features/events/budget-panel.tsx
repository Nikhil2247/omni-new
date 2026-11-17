'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Wallet, Sparkles, ChevronRight, Loader2, LayoutGrid, List as ListIcon } from 'lucide-react'
import { BUDGET_TEMPLATES, type BudgetTemplate } from '@/lib/data/recommended-templates'
import { BrushBar, Ico, ICONS, Paper, SketchButton, Stamp } from '@/components/sketch'
import { useAddBudgetItem, useBudget, useCreateBudget, useDeleteBudgetItem, useUpdateBudgetItem } from '@/hooks/queries/use-budget'
import { Button } from '@/components/ui/button'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useState } from 'react'

const createBudgetSchema = z.object({
  totalBudget: z.string().min(1, 'Total budget is required'),
})

type CreateBudgetValues = z.infer<typeof createBudgetSchema>

const addItemSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Item name is required'),
  estimatedCost: z.string().optional(),
  actualCost: z.string().optional(),
  isPaid: z.boolean().optional(),
  notes: z.string().optional(),
})

type AddItemValues = z.infer<typeof addItemSchema>

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

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

export function BudgetPanel({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useBudget(eventId)
  const createBudget = useCreateBudget()
  const addItem = useAddBudgetItem(eventId, data?.id)
  const updateItem = useUpdateBudgetItem(eventId)
  const deleteItem = useDeleteBudgetItem(eventId)
  const [showCreateBudgetDialog, setShowCreateBudgetDialog] = useState(false)
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | null>(null)
  const [showTemplateBudgetDialog, setShowTemplateBudgetDialog] = useState(false)
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  const budgetForm = useForm<CreateBudgetValues>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: { totalBudget: '' },
  })

  const itemForm = useForm<AddItemValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: { category: '', name: '', estimatedCost: '', actualCost: '', isPaid: false, notes: '' },
  })

  const onCreateBudget = async (values: CreateBudgetValues) => {
    await createBudget.mutateAsync({
      eventId,
      totalBudget: Number(values.totalBudget),
    })
    budgetForm.reset()
    setShowCreateBudgetDialog(false)
  }

  const onAddItem = async (values: AddItemValues) => {
    await addItem.mutateAsync({
      category: values.category,
      name: values.name,
      estimatedCost: values.estimatedCost ? Number(values.estimatedCost) : undefined,
      actualCost: values.actualCost ? Number(values.actualCost) : undefined,
      isPaid: values.isPaid ?? false,
      notes: values.notes || undefined,
    })
    itemForm.reset()
    setShowAddItemDialog(false)
  }

  const onCreateFromTemplate = async (template: BudgetTemplate, totalBudget: number) => {
    setIsCreatingFromTemplate(true)
    try {
      const result = await createBudget.mutateAsync({
        eventId,
        totalBudget,
      })

      // Add template items with calculated estimated costs based on percentage
      if (result?.id) {
        for (const item of template.items) {
          await addItem.mutateAsync({
            budgetId: result.id, // Pass the new budget ID
            category: item.category,
            name: item.name,
            estimatedCost: Math.round(totalBudget * (item.percentageOfTotal / 100)),
            isPaid: false,
          })
        }
        toast.success(`Budget created with ${template.items.length} items!`)
      } else {
        toast.error('Failed to create budget - no ID returned')
      }
    } catch (err) {
      console.error('Failed to create budget from template:', err)
      toast.error('Failed to create budget')
    } finally {
      setIsCreatingFromTemplate(false)
      setShowTemplateBudgetDialog(false)
      setSelectedTemplate(null)
      budgetForm.reset()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sk-paper px-5 py-8 text-center"
      >
        <p className="text-rose text-sm">Unable to load budget.</p>
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
        <Paper className="px-6 py-7">
          <div className="flex items-center gap-4">
            <Ico d={ICONS.wallet} className="h-14 w-14 shrink-0" />
            <div>
              <h2 className="font-display text-2xl font-semibold">Set Your Budget</h2>
              <p className="text-ink-soft">Track expenses and stay within your budget</p>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <SketchButton onClick={() => setShowCreateBudgetDialog(true)}>
              <Plus className="h-4 w-4" />
              Create Custom Budget
            </SketchButton>
          </div>
        </Paper>

        {/* Recommended Templates */}
        <Paper className="px-6 py-5">
          <h3 className="font-display mb-2 flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="text-gold h-5 w-5" />
            Recommended Budget Distributions
          </h3>
          <div>
            <p className="text-ink-soft mb-4 text-sm">
              Start with a pre-built budget distribution and customize it to your needs
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {BUDGET_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setShowTemplateBudgetDialog(true)
                  }}
                  disabled={isCreatingFromTemplate || createBudget.isPending}
                  className="group border-line hover:bg-blue-wash flex items-start gap-3 border-b-2 border-dashed px-2 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="bg-blue-wash text-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{template.name}</p>
                      <span className="sk-chip text-[10px]">
                        {template.items.length} categories
                      </span>
                    </div>
                    <p className="text-ink-soft line-clamp-1 text-sm">{template.description}</p>
                  </div>
                  <ChevronRight className="text-ink-soft h-5 w-5 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </Paper>

        {/* Custom Budget Dialog */}
        <Dialog open={showCreateBudgetDialog} onOpenChange={setShowCreateBudgetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Budget</DialogTitle>
              <DialogDescription>Set the total budget for this event.</DialogDescription>
            </DialogHeader>

            <Form {...budgetForm}>
              <form onSubmit={budgetForm.handleSubmit(onCreateBudget)} className="space-y-4">
                <FormField
                  control={budgetForm.control}
                  name="totalBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total budget</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="500000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateBudgetDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBudget.isPending}>
                    {createBudget.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Template Budget Dialog */}
        <Dialog open={showTemplateBudgetDialog} onOpenChange={setShowTemplateBudgetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Use {selectedTemplate?.name} Template</DialogTitle>
              <DialogDescription>
                Enter your total budget and we&apos;ll distribute it according to the template breakdown.
              </DialogDescription>
            </DialogHeader>

            <Form {...budgetForm}>
              <form
                onSubmit={budgetForm.handleSubmit((values) => {
                  if (selectedTemplate) {
                    onCreateFromTemplate(selectedTemplate, Number(values.totalBudget))
                  }
                })}
                className="space-y-4"
              >
                <FormField
                  control={budgetForm.control}
                  name="totalBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total budget</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="500000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedTemplate && (
                  <div className="bg-blue-wash rounded-lg p-3">
                    <p className="mb-2 text-xs font-medium">Budget Distribution:</p>
                    <div className="space-y-1">
                      {selectedTemplate.items.slice(0, 5).map((item) => (
                        <div key={item.category} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{item.category}</span>
                          <span className="font-medium">{item.percentageOfTotal}%</span>
                        </div>
                      ))}
                      {selectedTemplate.items.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{selectedTemplate.items.length - 5} more categories
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
                      setShowTemplateBudgetDialog(false)
                      setSelectedTemplate(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingFromTemplate || createBudget.isPending}>
                    {isCreatingFromTemplate ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating items...
                      </>
                    ) : createBudget.isPending ? (
                      'Creating...'
                    ) : (
                      'Create Budget'
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

  const totalBudget = Number(data.totalBudget)
  const calculatedSpent = (data.items || []).reduce((sum: number, item: any) => {
    if (!item?.isPaid) return sum
    const paidAmount = Number(item.actualCost ?? item.estimatedCost ?? 0)
    return sum + (Number.isFinite(paidAmount) ? paidAmount : 0)
  }, 0)
  const totalSpent = calculatedSpent
  const remaining = totalBudget - totalSpent

  // Group items by category
  const itemsByCategory = (data.items || []).reduce((acc: Record<string, any[]>, item: any) => {
    const category = item.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, any[]>)

  const categorySummaries = (Object.entries(itemsByCategory) as Array<[string, any[]]>).map(([category, items]) => ({
    category,
    planned: items.reduce((sum: number, i: any) => sum + (Number(i.estimatedCost ?? i.actualCost ?? 0) || 0), 0),
    spent: items.reduce((sum: number, i: any) => {
      if (!i?.isPaid) return sum
      const paid = Number(i.actualCost ?? i.estimatedCost ?? 0)
      return sum + (Number.isFinite(paid) ? paid : 0)
    }, 0),
  }))

  const allItems = (data.items || []).slice().sort((a: any, b: any) => {
    const byCategory = String(a.category || '').localeCompare(String(b.category || ''))
    if (byCategory !== 0) return byCategory
    return String(a.name || '').localeCompare(String(b.name || ''))
  })

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Add Item Trigger */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex gap-2">
            <SketchButton
              size="sm"
              variant={viewMode === 'card' ? 'solid' : 'line'}
              onClick={() => setViewMode('card')}
              aria-pressed={viewMode === 'card'}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Card View
            </SketchButton>
            <SketchButton
              size="sm"
              variant={viewMode === 'list' ? 'solid' : 'line'}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
            >
              <ListIcon className="h-3.5 w-3.5" />
              List View
            </SketchButton>
          </div>

          <SketchButton size="sm" onClick={() => setShowAddItemDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Budget Item
          </SketchButton>
        </div>
      </motion.div>

      {/* Spent vs planned by category */}
      {categorySummaries.length > 0 && (
        <motion.div variants={itemVariants}>
          <Paper className="px-5 py-4">
            <h3 className="font-display mb-3 text-xl font-semibold">By category</h3>
            <div>
              {categorySummaries.map((c) => {
                const pct = c.planned > 0 ? (c.spent / c.planned) * 100 : 0
                return (
                  <div key={c.category} className="border-line border-b-2 border-dashed py-3 last:border-b-0">
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span className="font-medium">{c.category}</span>
                      <span className="text-ink-soft text-xs">
                        {formatCurrency(c.spent)} spent of {formatCurrency(c.planned)} planned
                      </span>
                    </div>
                    <BrushBar value={pct} tone={c.spent > c.planned && c.planned > 0 ? 'gold' : 'green'} />
                  </div>
                )
              })}
            </div>
          </Paper>
        </motion.div>
      )}

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
            <DialogDescription>Add a new expense line item for this event budget.</DialogDescription>
          </DialogHeader>

          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onAddItem)} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <FormField
                  control={itemForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Venue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item</FormLabel>
                      <FormControl>
                        <Input placeholder="Hall booking" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="100000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={itemForm.control}
                  name="actualCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Cost</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="95000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex items-end gap-3 pb-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="mt-0!">Mark as paid</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={itemForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} className="min-h-16" placeholder="Additional details..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddItemDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addItem.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {addItem.isPending ? 'Adding...' : 'Add item'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {viewMode === 'list' ? (
        <motion.div variants={itemVariants}>
          <Paper className="px-5 py-4">
            <div className="mb-3">
              <h3 className="font-display text-xl font-semibold">All Budget Items</h3>
              <p className="text-ink-soft text-xs">
                {allItems.filter((item: any) => item.isPaid).length} of {allItems.length} paid
              </p>
            </div>
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="sk-eyebrow border-ink/40 grid grid-cols-12 border-b-2 px-3 py-2">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2 text-right">Estimated</div>
                  <div className="col-span-2 text-right">Actual</div>
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
                      className="border-line grid grid-cols-12 items-center gap-2 border-b-2 border-dashed px-3 py-2.5 text-sm"
                    >
                      <div className="col-span-4 flex min-w-0 items-center gap-2">
                        <Checkbox
                          checked={item.isPaid}
                          onCheckedChange={(checked) =>
                            updateItem.mutate({
                              itemId: item.id,
                              input: { isPaid: Boolean(checked) },
                            })
                          }
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.name}</p>
                          {item.notes && <p className="text-ink-soft truncate text-xs">{item.notes}</p>}
                        </div>
                      </div>
                      <div className="text-ink-soft col-span-2 truncate text-xs">{item.category || 'Uncategorized'}</div>
                      <div className="text-ink-soft col-span-2 text-right text-xs">
                        {item.estimatedCost ? formatCurrency(Number(item.estimatedCost)) : '-'}
                      </div>
                      <div className="col-span-2 text-right text-xs font-medium">
                        {item.actualCost ? formatCurrency(Number(item.actualCost)) : '-'}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        {item.isPaid && <Stamp>Paid</Stamp>}
                        <SketchButton
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem.mutate(item.id)}
                          aria-label="Delete budget item"
                        >
                          <Trash2 className="text-rose h-3.5 w-3.5" />
                        </SketchButton>
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
                      className="border-line border-b-2 border-dashed py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <Checkbox
                            checked={item.isPaid}
                            onCheckedChange={(checked) =>
                              updateItem.mutate({
                                itemId: item.id,
                                input: { isPaid: Boolean(checked) },
                              })
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{item.name}</p>
                              {item.isPaid && <Stamp>Paid</Stamp>}
                            </div>
                            <p className="text-ink-soft mt-0.5 text-xs">{item.category || 'Uncategorized'}</p>
                            {item.notes && <p className="text-ink-soft mt-1 line-clamp-2 text-xs">{item.notes}</p>}
                            <div className="mt-2 flex items-center gap-3 text-xs">
                              {item.estimatedCost && (
                                <span className="text-ink-soft">
                                  Est: {formatCurrency(Number(item.estimatedCost))}
                                </span>
                              )}
                              {item.actualCost && (
                                <span className="font-medium">
                                  Actual: {formatCurrency(Number(item.actualCost))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <SketchButton
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem.mutate(item.id)}
                          className="shrink-0"
                          aria-label="Delete budget item"
                        >
                          <Trash2 className="text-rose h-4 w-4" />
                        </SketchButton>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </Paper>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <AnimatePresence mode="popLayout">
              {allItems.map((item: any) => {
                const cost = Number(item.actualCost || item.estimatedCost) || 0

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -2 }}
                    className="sk-paper group relative px-3.5 py-3"
                  >
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <Checkbox
                        checked={item.isPaid}
                        onCheckedChange={(checked) =>
                          updateItem.mutate({
                            itemId: item.id,
                            input: { isPaid: Boolean(checked) },
                          })
                        }
                        className="h-4 w-4"
                      />
                      <SketchButton
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem.mutate(item.id)}
                        aria-label="Delete budget item"
                      >
                        <Trash2 className="text-rose h-3 w-3" />
                      </SketchButton>
                    </div>

                    <div className="pr-16">
                      <span className="sk-chip mb-2 text-[10px]">{item.category || 'Other'}</span>
                      <p className="line-clamp-2 text-sm leading-tight font-medium">{item.name}</p>
                    </div>

                    <div className="border-line mt-3 border-t-2 border-dashed pt-2">
                      <p className="font-display text-lg font-semibold">{formatCurrency(cost)}</p>
                      <div className="mt-1 flex items-center justify-between">
                        {item.estimatedCost && item.actualCost && Number(item.actualCost) !== Number(item.estimatedCost) ? (
                          <span className={`text-[11px] ${Number(item.actualCost) > Number(item.estimatedCost) ? 'text-rose' : 'text-leaf-deep'}`}>
                            Est: {formatCurrency(Number(item.estimatedCost))}
                          </span>
                        ) : (
                          <span className="text-ink-soft text-[11px]">
                            {item.actualCost ? 'Actual' : 'Estimated'}
                          </span>
                        )}
                        {item.isPaid && <Stamp>Paid</Stamp>}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {allItems.length === 0 && (
        <motion.div variants={itemVariants}>
          <Paper className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <Ico d={ICONS.wallet} className="mb-3 h-12 w-12" />
            <p className="font-display text-xl font-semibold">No budget items yet</p>
            <p className="text-ink-soft mt-1 text-sm">Add your first item to start tracking expenses</p>
          </Paper>
        </motion.div>
      )}
    </motion.div>
  )
}
