'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, DollarSign, Wallet, Sparkles, ChevronRight, Loader2, LayoutGrid, List as ListIcon } from 'lucide-react'
import { BUDGET_TEMPLATES, type BudgetTemplate } from '@/lib/data/recommended-templates'
import { Badge } from '@/components/ui/badge'
import { useAddBudgetItem, useBudget, useCreateBudget, useDeleteBudgetItem, useUpdateBudgetItem } from '@/hooks/queries/use-budget'
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
        <p className="text-sm text-destructive">Unable to load budget.</p>
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
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Set Your Budget</h1>
                <p className="text-muted-foreground">Track expenses and stay within your budget</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowCreateBudgetDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Budget
              </Button>
            </div>
          </div>
        </div>

        {/* Recommended Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Recommended Budget Distributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
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
                  className="group flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Wallet className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium group-hover:text-primary">{template.name}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {template.items.length} categories
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
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium mb-2">Budget Distribution:</p>
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

          <Button size="sm" onClick={() => setShowAddItemDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Budget Item
          </Button>
        </div>
      </motion.div>

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
          <Card className="border-muted/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">All Budget Items</CardTitle>
              <CardDescription className="text-xs">
                {allItems.filter((item: any) => item.isPaid).length} of {allItems.length} paid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-lg border border-muted/60">
                <div className="grid grid-cols-12 bg-muted/50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
                      className={`grid grid-cols-12 items-center gap-2 border-t px-3 py-2 text-sm ${
                        item.isPaid ? 'bg-green-50/40 dark:bg-green-950/20' : 'hover:bg-muted/40'
                      }`}
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
                          {item.notes && <p className="truncate text-xs text-muted-foreground">{item.notes}</p>}
                        </div>
                      </div>
                      <div className="col-span-2 truncate text-xs text-muted-foreground">{item.category || 'Uncategorized'}</div>
                      <div className="col-span-2 text-right text-xs text-muted-foreground">
                        {item.estimatedCost ? formatCurrency(Number(item.estimatedCost)) : '-'}
                      </div>
                      <div className="col-span-2 text-right text-xs font-medium">
                        {item.actualCost ? formatCurrency(Number(item.actualCost)) : '-'}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        {item.isPaid && <span className="text-xs text-green-600 dark:text-green-400">Paid</span>}
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
                      className={`rounded-lg border p-3 ${
                        item.isPaid ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/20' : 'hover:bg-muted/40'
                      }`}
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
                              {item.isPaid && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                                  Paid
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.category || 'Uncategorized'}</p>
                            {item.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              {item.estimatedCost && (
                                <span className="text-muted-foreground">
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
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
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
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`group relative rounded-xl border p-3 transition-all ${
                      item.isPaid
                        ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-900/30 dark:from-green-950/30 dark:to-emerald-950/20'
                        : 'bg-card hover:border-primary/50 hover:shadow-lg'
                    }`}
                  >
                    <div className="absolute right-2 top-2 flex items-center gap-1">
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
                      <Badge variant="secondary" className="mb-2 text-[10px] px-1.5 py-0">
                        {item.category || 'Other'}
                      </Badge>
                      <p className="text-sm font-medium line-clamp-2 leading-tight">{item.name}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-muted/50">
                      <p className="text-base font-bold">{formatCurrency(cost)}</p>
                      <div className="flex items-center justify-between mt-1">
                        {item.estimatedCost && item.actualCost && Number(item.actualCost) !== Number(item.estimatedCost) ? (
                          <span className={`text-[10px] ${Number(item.actualCost) > Number(item.estimatedCost) ? 'text-red-600' : 'text-green-600'}`}>
                            Est: {formatCurrency(Number(item.estimatedCost))}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {item.actualCost ? 'Actual' : 'Estimated'}
                          </span>
                        )}
                        {item.isPaid && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[9px] px-1 py-0">
                            Paid
                          </Badge>
                        )}
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No budget items yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add your first item to start tracking expenses</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
