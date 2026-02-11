'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Wallet, PiggyBank, Edit2, Check, X } from 'lucide-react'
import { useAddBudgetItem, useBudget, useCreateBudget, useDeleteBudgetItem, useUpdateBudgetItem } from '@/hooks/queries/use-budget'
import { useExportBudget } from '@/hooks/queries/use-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportDropdown } from '@/components/common/export-dropdown'
import { Progress } from '@/components/ui/progress'
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
  const exportBudget = useExportBudget({
    onSuccess: () => toast.success('Export downloaded'),
    onError: () => toast.error('Export failed'),
  })

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
      >
        <Card className="overflow-hidden border-2">
          <div className="relative overflow-hidden bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 to-emerald-600 shadow-lg"
              >
                <DollarSign className="h-10 w-10 text-white" />
              </motion.div>
              <CardTitle className="mb-2 text-center text-2xl">Set your event budget</CardTitle>
              <CardDescription className="text-center">
                Track expenses and stay within your budget
              </CardDescription>
            </div>
          </div>
          <CardContent className="p-6">
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
                <Button type="submit" disabled={createBudget.isPending} className="w-full">
                  {createBudget.isPending ? 'Creating...' : 'Create budget'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const totalBudget = Number(data.totalBudget)
  const totalSpent = Number(data.totalSpent)
  const remaining = totalBudget - totalSpent
  const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const isOverBudget = percentUsed > 100

  // Group items by category
  const itemsByCategory = (data.items || []).reduce((acc, item) => {
    const category = item.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof data.items>)

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
          <div className="relative overflow-hidden bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            
            <div className="relative z-10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ${
                    isOverBudget 
                      ? 'bg-linear-to-br from-red-500 to-orange-600' 
                      : 'bg-linear-to-br from-green-500 to-emerald-600'
                  }`}
                >
                  <DollarSign className="h-6 w-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold">Budget Overview</h1>
                  <p className="text-xs text-muted-foreground">
                    {percentUsed}% of budget used
                  </p>
                </div>
                <ExportDropdown
                  type="budget"
                  id={data.id}
                  filename="budget"
                  onExport={async (format) => {
                    await exportBudget.mutateAsync({ id: data.id, format })
                  }}
                  disabled={exportBudget.isPending}
                />
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-medium">
                    {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/50 dark:bg-black/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentUsed, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${
                      isOverBudget
                        ? 'bg-linear-to-r from-red-500 to-orange-600'
                        : percentUsed > 80
                        ? 'bg-linear-to-r from-orange-500 to-yellow-600'
                        : 'bg-linear-to-r from-green-500 to-emerald-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="mt-2 text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                  <Wallet className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="mt-2 text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30">
                  <TrendingUp className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className={`mt-2 text-2xl font-bold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  remaining < 0 
                    ? 'bg-red-100 dark:bg-red-900/30' 
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  <PiggyBank className={`h-7 w-7 ${
                    remaining < 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Add Item Card */}
      <motion.div variants={itemVariants}>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Add Budget Item</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Form {...itemForm}>
              <form onSubmit={itemForm.handleSubmit(onAddItem)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
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
                <div className="grid gap-4 md:grid-cols-2">
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
                        <Textarea rows={2} placeholder="Additional details..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={addItem.isPending} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {addItem.isPending ? 'Adding...' : 'Add item'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Items by Category */}
      <AnimatePresence mode="popLayout">
        {Object.entries(itemsByCategory).map(([category, items]) => {
          const categoryTotal = items.reduce((sum, item) => sum + (Number(item.actualCost || item.estimatedCost) || 0), 0)
          const categoryPaid = items.filter(item => item.isPaid).length

          return (
            <motion.div
              key={category}
              variants={itemVariants}
              exit="exit"
              layout
            >
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{category}</CardTitle>
                      <CardDescription>
                        {categoryPaid} of {items.length} paid • {formatCurrency(categoryTotal)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => {
                        const cost = Number(item.actualCost || item.estimatedCost) || 0
                        const variance = item.actualCost && item.estimatedCost 
                          ? Number(item.actualCost) - Number(item.estimatedCost) 
                          : 0

                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            whileHover={{ scale: 1.01, x: 4 }}
                            className={`group flex items-center justify-between gap-4 rounded-lg border p-3 transition-all ${
                              item.isPaid 
                                ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/20' 
                                : 'hover:border-primary/50 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Checkbox
                                checked={item.isPaid}
                                onCheckedChange={(checked) =>
                                  updateItem.mutate({
                                    itemId: item.id,
                                    input: { isPaid: Boolean(checked) },
                                  })
                                }
                                className="h-5 w-5"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                                )}
                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                  {item.estimatedCost && (
                                    <span>Est: {formatCurrency(Number(item.estimatedCost))}</span>
                                  )}
                                  {item.actualCost && (
                                    <span className="font-medium text-foreground">
                                      Actual: {formatCurrency(Number(item.actualCost))}
                                    </span>
                                  )}
                                  {variance !== 0 && (
                                    <span className={variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                                      {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(cost)}</p>
                                {item.isPaid && (
                                  <p className="text-xs text-green-600 dark:text-green-400">Paid</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteItem.mutate(item.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {Object.keys(itemsByCategory).length === 0 && (
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
