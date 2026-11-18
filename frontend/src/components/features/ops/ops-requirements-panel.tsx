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
  Plus,
  FileText,
  Pencil,
  Trash2,
  Loader2,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  DataTable,
  StatCard,
  StatGrid,
  StatusBadge,
  TwoLineCell,
  type DataColumn,
} from '@/components/dash'

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

const STATUS_CONFIG: Record<string, { label: string }> = {
  PENDING: { label: 'Pending' },
  SOURCING: { label: 'Sourcing' },
  VENDOR_ASSIGNED: { label: 'Vendor Assigned' },
  FULFILLED: { label: 'Fulfilled' },
}

const PRIORITY_CONFIG: Record<string, { label: string }> = {
  LOW: { label: 'Low' },
  NORMAL: { label: 'Normal' },
  HIGH: { label: 'High' },
  URGENT: { label: 'Urgent' },
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
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p className="font-medium">Failed to load requirements</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <FileText className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">No requirement sheet found</p>
        {showCreateSheet && (
          <Button size="sm" onClick={handleCreateSheet} disabled={createSheet.isPending}>
            {createSheet.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="mr-1 h-4 w-4" />
            Create Requirement Sheet
          </Button>
        )}
      </div>
    )
  }

  type ReqItem = NonNullable<typeof data.items>[number]

  const columns: DataColumn<ReqItem>[] = [
    {
      id: 'description',
      header: 'Requirement',
      label: 'Requirement',
      cell: (item) => <TwoLineCell title={item.description} subtitle={item.category} />,
      sortValue: (item) => item.description,
      exportValue: (item) => `${item.category}: ${item.description}`,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (item) => (
        <StatusBadge status={item.status}>{(STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING).label}</StatusBadge>
      ),
      sortValue: (item) => item.status,
      exportValue: (item) => item.status,
    },
    {
      id: 'priority',
      header: 'Priority',
      label: 'Priority',
      hideBelow: 'md',
      cell: (item) => (
        <StatusBadge status={item.priority || 'NORMAL'}>
          {(PRIORITY_CONFIG[item.priority || 'NORMAL'] || PRIORITY_CONFIG.NORMAL).label}
        </StatusBadge>
      ),
      sortValue: (item) => item.priority,
      exportValue: (item) => item.priority || 'NORMAL',
    },
    {
      id: 'quantity',
      header: 'Qty',
      label: 'Qty',
      align: 'right',
      cell: (item) => item.quantity,
      sortValue: (item) => item.quantity,
    },
    {
      id: 'budget',
      header: 'Est. budget',
      label: 'Est. budget',
      align: 'right',
      cell: (item) => (item.estimatedBudget ? `$${Number(item.estimatedBudget).toLocaleString()}` : '-'),
      sortValue: (item) => (item.estimatedBudget ? Number(item.estimatedBudget) : null),
      exportValue: (item) => (item.estimatedBudget ? Number(item.estimatedBudget) : ''),
    },
  ]

  const totalEstimatedBudget = data.items?.reduce((sum, item) => sum + (Number(item.estimatedBudget) || 0), 0) || 0
  const fulfilledCount = data.items?.filter(item => item.status === 'FULFILLED').length || 0

  return (
    <div className="space-y-3">
      <StatGrid className="lg:grid-cols-3">
        <StatCard label="Total Items" value={data.items?.length || 0} icon={Package} />
        <StatCard label="Fulfilled" value={fulfilledCount} icon={CheckCircle2} accent="text-success" />
        <StatCard label="Est. Total" value={`$${totalEstimatedBudget.toLocaleString()}`} icon={DollarSign} accent="text-primary" />
      </StatGrid>

      {data.notes && (
        <div className="rounded-lg border bg-card px-3 py-2 text-sm">
          <span className="text-muted-foreground">Notes: </span>
          {data.notes}
        </div>
      )}

      <DataTable
        data={data.items}
        columns={columns}
        rowKey={(item) => item.id}
        exportFilename="requirements"
        emptyTitle="No requirements added yet"
        emptyIcon={Package}
        toolbarRight={
          <Button size="sm" className="h-8" onClick={() => setIsAddItemDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Requirement
          </Button>
        }
        rowActions={(item) => [
          { label: 'Edit', icon: Pencil, onClick: () => handleEditClick(item) },
          {
            label: 'Delete requirement',
            icon: Trash2,
            danger: true,
            onClick: () => handleDeleteItem(item.id),
            confirm: {
              title: 'Delete requirement?',
              description: 'This requirement will be permanently deleted. This action cannot be undone.',
            },
          },
        ]}
      />

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Requirement</DialogTitle>
            <DialogDescription>Add a new vendor requirement for this event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the requirement..."
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the requirement..."
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
