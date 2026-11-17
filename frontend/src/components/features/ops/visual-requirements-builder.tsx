// ============================================================================
// VISUAL REQUIREMENTS BUILDER - Ops Manager Tool
// ============================================================================
// Drag & drop requirement sheet builder integrated with backend
// ============================================================================

'use client'

import { useState } from 'react'
import {
  useOpsRequirements,
  useCreateRequirementSheet,
  useAddRequirementItem,
  useDeleteRequirementItem,
} from '@/hooks/queries/use-ops'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Trash2, GripVertical, Loader2, FileText, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface VisualRequirementsBuilderProps {
  activeEventId: string
}

const CATEGORIES = [
  { value: 'Photography', label: 'Photography', icon: '📸' },
  { value: 'Videography', label: 'Videography', icon: '🎥' },
  { value: 'Decoration', label: 'Decoration', icon: '🎨' },
  { value: 'Catering', label: 'Catering', icon: '🍽️' },
  { value: 'Music & DJ', label: 'Music & DJ', icon: '🎵' },
  { value: 'Venue', label: 'Venue', icon: '🏛️' },
  { value: 'Security', label: 'Security', icon: '🛡️' },
  { value: 'Transportation', label: 'Transportation', icon: '🚗' },
  { value: 'Entertainment', label: 'Entertainment', icon: '🎭' },
  { value: 'Other', label: 'Other', icon: '📋' },
]

const QUICK_TEMPLATES = [
  {
    name: 'Wedding Basic',
    items: [
      { category: 'Photography', description: 'Wedding Photographer', quantity: 1 },
      { category: 'Videography', description: 'Wedding Videographer', quantity: 1 },
      { category: 'Decoration', description: 'Stage Decoration', quantity: 1 },
      { category: 'Catering', description: 'Food & Beverages', quantity: 200 },
      { category: 'Music & DJ', description: 'DJ Services', quantity: 1 },
    ],
  },
  {
    name: 'Corporate Event',
    items: [
      { category: 'Venue', description: 'Conference Hall', quantity: 1 },
      { category: 'Catering', description: 'Lunch & Snacks', quantity: 100 },
      { category: 'Security', description: 'Security Staff', quantity: 2 },
      { category: 'Entertainment', description: 'Entertainment Act', quantity: 1 },
    ],
  },
]

export function VisualRequirementsBuilder({ activeEventId }: VisualRequirementsBuilderProps) {
  const { data, isLoading, error } = useOpsRequirements(activeEventId)
  const createSheet = useCreateRequirementSheet()
  const addItem = useAddRequirementItem()
  const deleteItem = useDeleteRequirementItem()
  
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [newItem, setNewItem] = useState({
    category: '',
    description: '',
    quantity: 1,
    estimatedBudget: '',
    priority: 'NORMAL',
  })
  const [createSheetNotes, setCreateSheetNotes] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const resetNewItem = () => {
    setNewItem({
      category: '',
      description: '',
      quantity: 1,
      estimatedBudget: '',
      priority: 'NORMAL',
    })
  }

  const handleCreateSheet = async () => {
    try {
      await createSheet.mutateAsync({
        activeEventId,
        notes: createSheetNotes || undefined,
      })
      setShowCreateDialog(false)
      setCreateSheetNotes('')
      toast.success('Requirement sheet created!')
    } catch (error) {
      toast.error('Failed to create requirement sheet')
    }
  }

  const handleAddItem = async () => {
    if (!data?.id) {
      toast.error('Please create a requirement sheet first')
      return
    }
    if (!newItem.category || !newItem.description) {
      toast.error('Please fill in category and description')
      return
    }

    try {
      await addItem.mutateAsync({
        sheetId: data.id,
        payload: {
          category: newItem.category,
          description: newItem.description,
          quantity: newItem.quantity,
          estimatedBudget: newItem.estimatedBudget ? Number(newItem.estimatedBudget) : undefined,
          priority: newItem.priority,
        },
      })
      setIsAddingItem(false)
      resetNewItem()
      toast.success('Requirement added!')
    } catch (error) {
      toast.error('Failed to add requirement')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this requirement?')) return
    try {
      await deleteItem.mutateAsync(itemId)
      toast.success('Requirement deleted')
    } catch (error) {
      toast.error('Failed to delete requirement')
    }
  }

  const applyTemplate = async (templateName: string) => {
    const template = QUICK_TEMPLATES.find(t => t.name === templateName)
    if (!template || !data?.id) return

    try {
      for (const item of template.items) {
        await addItem.mutateAsync({
          sheetId: data.id,
          payload: {
            category: item.category,
            description: item.description,
            quantity: item.quantity,
          },
        })
      }
      toast.success(`${templateName} template applied!`)
    } catch (error) {
      toast.error('Failed to apply template')
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          Failed to load requirements
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No Requirement Sheet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create a requirement sheet to start building your event requirements visually.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Requirement Sheet
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Requirement Sheet</DialogTitle>
                <DialogDescription>
                  Start organizing vendor requirements for this event.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any initial notes about the requirements..."
                    value={createSheetNotes}
                    onChange={(e) => setCreateSheetNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSheet} disabled={createSheet.isPending}>
                  {createSheet.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Sheet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Quick Templates */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Visual Requirements Builder
          </h3>
          <p className="text-sm text-muted-foreground">Drag to reorder, click to add items</p>
        </div>
        <div className="flex items-center gap-2">
          {QUICK_TEMPLATES.map((template) => (
            <Button
              key={template.name}
              variant="outline"
              size="sm"
              onClick={() => applyTemplate(template.name)}
              disabled={addItem.isPending}
            >
              {template.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-3">
        {data.items && data.items.length > 0 ? (
          data.items.map((item, index) => {
            const cat = CATEGORIES.find(c => c.value === item.category)
            return (
              <Card
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                className={`
                  transition-all cursor-move hover:shadow-md
                  ${draggedIndex === index ? 'opacity-50' : ''}
                `}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab active:cursor-grabbing" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{cat?.icon || '📋'}</span>
                        <Badge variant="secondary">{item.category}</Badge>
                        {item.priority && item.priority !== 'NORMAL' && (
                          <Badge variant={item.priority === 'URGENT' ? 'destructive' : 'default'}>
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{item.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        {item.estimatedBudget && (
                          <span>Budget: ${Number(item.estimatedBudget).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground mb-4">No requirements added yet</p>
              <p className="text-sm text-muted-foreground">Try using a quick template or add items manually</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Item Button/Form */}
      {!isAddingItem ? (
        <Button onClick={() => setIsAddingItem(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Requirement
        </Button>
      ) : (
        <Card className="border-primary">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={newItem.category}
                onValueChange={(v) => setNewItem({ ...newItem, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the requirement..."
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Budget</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="₹0"
                  value={newItem.estimatedBudget}
                  onChange={(e) => setNewItem({ ...newItem, estimatedBudget: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newItem.priority}
                  onValueChange={(v) => setNewItem({ ...newItem, priority: v })}
                >
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
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAddItem}
                disabled={addItem.isPending || !newItem.category || !newItem.description}
                className="flex-1"
              >
                {addItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Requirement
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingItem(false)
                  resetNewItem()
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
