"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import type { ServiceItem, CreateServiceItemRequest } from "@/lib/api/types/business.types";

interface ServiceItemsFormProps {
  items: (ServiceItem | CreateServiceItemRequest & { id?: string })[];
  onChange: (items: (ServiceItem | CreateServiceItemRequest & { id?: string })[]) => void;
  readOnly?: boolean;
}

const UNIT_OPTIONS = [
  { value: "", label: "No unit" },
  { value: "per piece", label: "Per Piece" },
  { value: "per plate", label: "Per Plate" },
  { value: "per kg", label: "Per KG" },
  { value: "per person", label: "Per Person" },
  { value: "per unit", label: "Per Unit" },
  { value: "per hour", label: "Per Hour" },
  { value: "per day", label: "Per Day" },
];

export function ServiceItemsForm({ items, onChange, readOnly = false }: ServiceItemsFormProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<(ServiceItem | CreateServiceItemRequest & { id?: string }) | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    unit: "",
    minQuantity: "1",
    maxQuantity: "",
    isRequired: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      price: "",
      unit: "",
      minQuantity: "1",
      maxQuantity: "",
      isRequired: false,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setEditingItem(null);
    setShowAddDialog(true);
  };

  const openEditDialog = (item: ServiceItem | CreateServiceItemRequest & { id?: string }) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      price: item.price?.toString() || "",
      unit: item.unit || "",
      minQuantity: item.minQuantity?.toString() || "1",
      maxQuantity: item.maxQuantity?.toString() || "",
      isRequired: item.isRequired || false,
    });
    setShowAddDialog(true);
  };

  const handleSave = () => {
    const newItem: CreateServiceItemRequest & { id?: string } = {
      ...(editingItem && 'id' in editingItem ? { id: editingItem.id } : {}),
      name: formData.name,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      price: parseFloat(formData.price),
      unit: formData.unit || undefined,
      minQuantity: parseInt(formData.minQuantity) || 1,
      maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : undefined,
      isRequired: formData.isRequired,
      sortOrder: editingItem?.sortOrder ?? items.length,
    };

    if (editingItem) {
      // Update existing item
      const updatedItems = items.map((item) =>
        (item === editingItem || ('id' in item && 'id' in editingItem && item.id === editingItem.id))
          ? { ...item, ...newItem }
          : item
      );
      onChange(updatedItems);
    } else {
      // Add new item
      onChange([...items, newItem]);
    }

    setShowAddDialog(false);
    resetForm();
    setEditingItem(null);
  };

  const handleDelete = (itemToDelete: ServiceItem | CreateServiceItemRequest & { id?: string }) => {
    onChange(items.filter((item) => item !== itemToDelete));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Menu Items</Label>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No items added yet. Add menu items to your service.
            </p>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <Card key={('id' in item ? item.id : null) || `new-${index}`} className="relative">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {!readOnly && (
                    <div className="cursor-grab text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                  )}

                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.name}</span>
                      {item.isRequired && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="font-medium">
                      {formatPrice(item.price)}
                      {item.unit && <span className="text-muted-foreground text-sm">/{item.unit.replace('per ', '')}</span>}
                    </div>
                    {item.minQuantity && item.minQuantity > 1 && (
                      <p className="text-xs text-muted-foreground">
                        Min: {item.minQuantity}
                      </p>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Menu Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the item details." : "Add a new item to this service."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name *</Label>
              <Input
                id="item-name"
                placeholder="e.g., Paneer Tikka"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                placeholder="Brief description of the item..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Image URL hidden for now
            <div className="space-y-2">
              <Label htmlFor="item-imageUrl">Image URL</Label>
              <Input
                id="item-imageUrl"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>
            */}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">Price *</Label>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-unit">Unit</Label>
                <select
                  id="item-unit"
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  value={formData.unit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-minQuantity">Min Quantity</Label>
                <Input
                  id="item-minQuantity"
                  type="number"
                  min="1"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minQuantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-maxQuantity">Max Quantity</Label>
                <Input
                  id="item-maxQuantity"
                  type="number"
                  min="1"
                  placeholder="No limit"
                  value={formData.maxQuantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxQuantity: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="item-isRequired">Required Item</Label>
                <p className="text-xs text-muted-foreground">Must be included in every order</p>
              </div>
              <Switch
                id="item-isRequired"
                checked={formData.isRequired}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isRequired: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!formData.name || !formData.price}
            >
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
