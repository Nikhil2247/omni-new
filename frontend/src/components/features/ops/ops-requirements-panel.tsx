'use client'

import { useState } from 'react'
import {
  useOpsRequirements,
  useCreateRequirementSheet,
  useAddRequirementItem,
  useUpdateRequirementItem,
  useDeleteRequirementItem,
} from '@/hooks/queries/use-ops'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

const CATEGORIES = [
  'Photography',
  'Videography',
  'Decoration',
  'Catering',
  'Music & DJ',
  'Florist',
  'Venue',
  'Transportation',
  'Makeup & Hair',
  'Lighting',
  'Security',
  'Other',
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
  SOURCING: { label: 'Sourcing', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: <Package className="h-3 w-3" /> },
  VENDOR_ASSIGNED: { label: 'Vendor Assigned', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
  FULFILLED: { label: 'Fulfilled', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  URGENT: { label: 'Urgent', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
}

interface OpsRequirementsPanelProps {
  activeEventId: string
  showCreateSheet?: boolean
}

export function OpsRequirementsPanel({ activeEventId, showCreateSheet = true }: OpsRequirementsPanelProps) {
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({
    category: '',
    description: '',
    quantity: '1',
    estimatedBudget: '',
    notes: '',
    priority: 'NORMAL',
  })

  const { data, isLoading, error } = useOpsRequirements(activeEventId)
  const createSheet = useCreateRequirementSheet()
  const addItem = useAddRequirementItem()
  const updateItem = useUpdateRequirementItem()
  const deleteItem = useDeleteRequirementItem()

  const resetForm = () => {
    setItemForm({
      category: '',
      description: '',
      quantity: '1',
      estimatedBudget: '',
      notes: '',
      priority: 'NORMAL',
    })
  }

  const handleCreateSheet = async () => {
    await createSheet.mutateAsync({ activeEventId })
  }

  const handleAddItem = async () => {
    if (!data?.id) return
    await addItem.mutateAsync({
      sheetId: data.id,
      payload: {
        category: itemForm.category,
        description: itemForm.description,
        quantity: Number(itemForm.quantity) || 1,
        estimatedBudget: itemForm.estimatedBudget ? Number(itemForm.estimatedBudget) : undefined,
        notes: itemForm.notes || undefined,
      },
    })
    setIsAddItemDialogOpen(false)
    resetForm()
  }

  const handleEditClick = (item: { id: string; category: string; description: string; quantity: number; estimatedBudget?: string | number | null; priority?: string }) => {
    setEditingItemId(item.id)
    setItemForm({
      category: item.category,
      description: item.description,
      quantity: String(item.quantity),
      estimatedBudget: item.estimatedBudget ? String(item.estimatedBudget) : '',
      notes: '',
      priority: item.priority || 'NORMAL',
    })
    setIsEditItemDialogOpen(true)
  }

  const handleUpdateItem = async () => {
    if (!editingItemId) return
    await updateItem.mutateAsync({
      itemId: editingItemId,
      payload: {
        category: itemForm.category,
        description: itemForm.description,
        quantity: Number(itemForm.quantity) || 1,
        estimatedBudget: itemForm.estimatedBudget ? Number(itemForm.estimatedBudget) : undefined,
        notes: itemForm.notes || undefined,
      },
    })
    setIsEditItemDialogOpen(false)
    setEditingItemId(null)
    resetForm()
  }

  const handleDeleteItem = async (itemId: string) => {
    await deleteItem.mutateAsync(itemId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-destructive">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="font-medium">Failed to load requirements</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium mb-2">No requirement sheet found</p>
        <p className="text-sm text-muted-foreground mb-4">Create a requirement sheet to start adding vendor requirements.</p>
        {showCreateSheet && (
          <Button onClick={handleCreateSheet} disabled={createSheet.isPending}>
            {createSheet.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="mr-2 h-4 w-4" />
            Create Requirement Sheet
          </Button>
        )}
      </div>
    )
  }

  const totalEstimatedBudget = data.items?.reduce((sum, item) => sum + (Number(item.estimatedBudget) || 0), 0) || 0
  const fulfilledCount = data.items?.filter(item => item.status === 'FULFILLED').length || 0

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{data.items?.length || 0}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Fulfilled</p>
            <p className="text-2xl font-bold text-green-600">{fulfilledCount}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Est. Total</p>
            <p className="text-2xl font-bold text-blue-600">${totalEstimatedBudget.toLocaleString()}</p>
          </div>
        </div>

        <Button onClick={() => setIsAddItemDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Requirement
        </Button>
      </div>

      {/* Notes */}
      {data.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm mt-1">{data.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Requirements List */}
      {data.items?.length === 0 ? (
        <Card>
          <CardContent className="py-4 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No requirements added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Add Requirement" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items?.map((item) => {
            const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING
            const priority = PRIORITY_CONFIG[item.priority || 'NORMAL'] || PRIORITY_CONFIG.NORMAL

            return (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{item.category}</Badge>
                        <Badge variant="outline" className={status.color}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                        {item.priority && item.priority !== 'NORMAL' && (
                          <Badge variant="outline" className={priority.color}>
                            {priority.label}
                          </Badge>
                        )}
                      </div>

                      <p className="font-medium">{item.description}</p>

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span>Qty: {item.quantity}</span>
                        </div>
                        {item.estimatedBudget && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>${Number(item.estimatedBudget).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this requirement? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteItem(item.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Requirement</DialogTitle>
            <DialogDescription>Add a new vendor requirement for this event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the requirement..."
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedBudget">Estimated Budget</Label>
                <Input
                  id="estimatedBudget"
                  type="number"
                  min="0"
                  placeholder="₹0"
                  value={itemForm.estimatedBudget}
                  onChange={(e) => setItemForm({ ...itemForm, estimatedBudget: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={itemForm.priority} onValueChange={(v) => setItemForm({ ...itemForm, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddItemDialogOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={addItem.isPending || !itemForm.category || !itemForm.description}
            >
              {addItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Requirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Requirement</DialogTitle>
            <DialogDescription>Update the requirement details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the requirement..."
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estimatedBudget">Estimated Budget</Label>
                <Input
                  id="edit-estimatedBudget"
                  type="number"
                  min="0"
                  placeholder="₹0"
                  value={itemForm.estimatedBudget}
                  onChange={(e) => setItemForm({ ...itemForm, estimatedBudget: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={itemForm.priority} onValueChange={(v) => setItemForm({ ...itemForm, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditItemDialogOpen(false); setEditingItemId(null); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateItem}
              disabled={updateItem.isPending || !itemForm.category || !itemForm.description}
            >
              {updateItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
