// ============================================================================
// VISUAL REQUIREMENTS BUILDER - Ops Manager Tool
// ============================================================================
// Drag & drop requirement sheet builder for event planning
// ============================================================================

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, Search, GripVertical, Save } from 'lucide-react'
import { toast } from 'sonner'

interface RequirementItem {
  id: string
  category: string
  description: string
  quantity: number
  unit: string
  notes?: string
}

interface VisualRequirementsBuilderProps {
  activeEventId: string
  onSave?: (items: RequirementItem[]) => Promise<void>
}

const CATEGORIES = [
  { value: 'PHOTOGRAPHY', label: 'Photography', icon: '📸' },
  { value: 'VIDEOGRAPHY', label: 'Videography', icon: '🎥' },
  { value: 'DECORATION', label: 'Decoration', icon: '🎨' },
  { value: 'CATERING', label: 'Catering', icon: '🍽️' },
  { value: 'MUSIC', label: 'Music/DJ', icon: '🎵' },
  { value: 'VENUE', label: 'Venue', icon: '🏛️' },
  { value: 'SECURITY', label: 'Security', icon: '🛡️' },
  { value: 'TRANSPORT', label: 'Transportation', icon: '🚗' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎭' },
  { value: 'OTHER', label: 'Other', icon: '📋' },
]

const UNITS = ['unit', 'person', 'hour', 'day', 'set', 'package']

const QUICK_TEMPLATES = [
  {
    name: 'Wedding Basic',
    items: [
      { category: 'PHOTOGRAPHY', description: 'Wedding Photographer', quantity: 1, unit: 'person' },
      { category: 'VIDEOGRAPHY', description: 'Wedding Videographer', quantity: 1, unit: 'person' },
      { category: 'DECORATION', description: 'Stage Decoration', quantity: 1, unit: 'set' },
      { category: 'CATERING', description: 'Food & Beverages', quantity: 200, unit: 'person' },
      { category: 'MUSIC', description: 'DJ Services', quantity: 6, unit: 'hour' },
    ],
  },
  {
    name: 'Corporate Event',
    items: [
      { category: 'VENUE', description: 'Conference Hall', quantity: 1, unit: 'day' },
      { category: 'CATERING', description: 'Lunch & Snacks', quantity: 100, unit: 'person' },
      { category: 'SECURITY', description: 'Security Staff', quantity: 2, unit: 'person' },
      { category: 'ENTERTAINMENT', description: 'Entertainment Act', quantity: 1, unit: 'set' },
    ],
  },
]

export function VisualRequirementsBuilder({ activeEventId, onSave }: VisualRequirementsBuilderProps) {
  const [items, setItems] = useState<RequirementItem[]>([])
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItem, setNewItem] = useState<Partial<RequirementItem>>({
    category: '',
    description: '',
    quantity: 1,
    unit: 'unit',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [searchVendor, setSearchVendor] = useState('')

  const addItem = () => {
    if (!newItem.category || !newItem.description) {
      toast.error('Please fill in category and description')
      return
    }

    const item: RequirementItem = {
      id: `temp-${Date.now()}`,
      category: newItem.category!,
      description: newItem.description!,
      quantity: newItem.quantity || 1,
      unit: newItem.unit || 'unit',
      notes: newItem.notes,
    }

    setItems([...items, item])
    setNewItem({ category: '', description: '', quantity: 1, unit: 'unit' })
    setIsAddingItem(false)
    toast.success('Item added to requirement sheet')
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    toast.success('Item removed')
  }

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    const templateItems: RequirementItem[] = template.items.map((item, index) => ({
      id: `temp-${Date.now()}-${index}`,
      ...item,
    }))
    setItems(templateItems)
    toast.success(`Applied template: ${template.name}`)
  }

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one requirement')
      return
    }

    setIsSaving(true)
    try {
      await onSave?.(items)
      toast.success('Requirement sheet saved successfully')
    } catch (error) {
      toast.error('Failed to save requirement sheet')
    } finally {
      setIsSaving(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.icon || '📋'
  }

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">Requirement Sheet Builder</h2>
          <p className="text-muted-foreground">Create a detailed list of event requirements</p>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Sheet'}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Templates</CardTitle>
          <CardDescription>Start with a pre-built template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {QUICK_TEMPLATES.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(template)}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requirements ({items.length})</CardTitle>
          <CardDescription>
            Drag to reorder, click to edit, or remove items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No requirements added yet</p>
              <p className="text-sm">Add your first requirement below</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="cursor-move">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-2xl">{getCategoryIcon(item.category)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getCategoryLabel(item.category)}</Badge>
                    <span className="font-medium">{item.description}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Quantity: {item.quantity} {item.unit}
                    {item.notes && ` • ${item.notes}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}

          {/* Add Item Button */}
          {!isAddingItem && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddingItem(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          )}

          {/* Add Item Form */}
          {isAddingItem && (
            <div className="p-4 border-2 border-dashed rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., Wedding Photographer"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={newItem.unit}
                    onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional requirements or specifications"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={addItem} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingItem(false)
                    setNewItem({ category: '', description: '', quantity: 1, unit: 'unit' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Search Integration */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Find Vendors</CardTitle>
            <CardDescription>
              Search for vendors to fulfill your requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search vendors by category or service..."
                value={searchVendor}
                onChange={(e) => setSearchVendor(e.target.value)}
              />
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
