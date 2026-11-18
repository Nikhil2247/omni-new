"use client";

import { useEffect, useState } from "react";
import { trackDashboard } from '@/lib/analytics/umami';
import {
  useBusinessProfile,
  useBusinessServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useSyncServiceItems,
} from "@/hooks/queries/use-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
} from "lucide-react";
import type {
  VendorService,
  ServiceItem,
  CreateServiceRequest,
  UpdateServiceRequest,
  CreateServiceItemRequest,
} from "@/lib/api/types/business.types";
import { PageHeader, DataTable, FilterSelect, StatusBadge, TwoLineCell } from "@/components/dashboard";
import { ServiceItemsForm } from "@/components/features/services/service-items-form";

const PRICE_UNITS = [
  { value: "per_hour", label: "Per Hour" },
  { value: "per_day", label: "Per Day" },
  { value: "per_event", label: "Per Event" },
  { value: "fixed", label: "Fixed Price" },
  { value: "per_person", label: "Per Person" },
  { value: "per_unit", label: "Per Unit" },
];

const DURATION_UNITS = [
  { value: "hours", label: "Hours" },
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
] as const;

const toMinutes = (duration: string, unit: (typeof DURATION_UNITS)[number]["value"]) => {
  const numericDuration = Number(duration);
  if (!Number.isFinite(numericDuration) || numericDuration <= 0) {
    return undefined;
  }

  switch (unit) {
    case "hours":
      return Math.round(numericDuration * 60);
    case "day":
      return Math.round(numericDuration * 24 * 60);
    case "month":
      return Math.round(numericDuration * 30 * 24 * 60);
    default:
      return Math.round(numericDuration);
  }
};

const fromMinutes = (minutes: number, unit: (typeof DURATION_UNITS)[number]["value"]) => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "";
  }

  switch (unit) {
    case "hours":
      return (minutes / 60).toString();
    case "day":
      return (minutes / (24 * 60)).toString();
    case "month":
      return (minutes / (30 * 24 * 60)).toString();
    default:
      return minutes.toString();
  }
};

export default function BusinessServicesPage() {
  useEffect(() => {
    trackDashboard.sectionView('services', 'vendor')
  }, [])

  const { data: profile, isLoading: profileLoading } = useBusinessProfile();
  const { data: services, isLoading: servicesLoading } = useBusinessServices(profile?.id || "");
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<VendorService | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    priceUnit: "per_event",
    duration: "",
    durationUnit: "hours" as (typeof DURATION_UNITS)[number]["value"],
    isActive: true,
    features: "",
    hasItems: false,
    items: [] as (ServiceItem | CreateServiceItemRequest & { id?: string })[],
  });
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceStatus, setServiceStatus] = useState("all");
  const syncServiceItems = useSyncServiceItems();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      basePrice: "",
      priceUnit: "per_event",
      duration: "",
      durationUnit: "hours",
      isActive: true,
      features: "",
      hasItems: false,
      items: [],
    });
  };

  const getServiceBasePrice = (service: VendorService) => {
    const rawValue = (service as any)?.basePrice ?? (service as any)?.startingPrice ?? 0;
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    return Number.isFinite(value) ? value : 0;
  };

  const getServicePriceUnit = (service: VendorService) => {
    const unit = (service as any)?.priceUnit;
    return unit || "per_event";
  };

  const openEditDialog = (service: VendorService) => {
    const basePrice = getServiceBasePrice(service);
    const durationUnit: (typeof DURATION_UNITS)[number]["value"] = "hours";
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      basePrice: basePrice.toString(),
      priceUnit: getServicePriceUnit(service),
      duration: service.duration ? fromMinutes(service.duration, durationUnit) : "",
      durationUnit,
      isActive: service.isActive,
      features: service.features?.join("\n") || "",
      hasItems: service.hasItems || false,
      items: service.items || [],
    });
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    if (!profile) return;

    const normalizedDuration = formData.duration
      ? toMinutes(formData.duration, formData.durationUnit)
      : undefined;

    // Prepare items for creation
    const itemsPayload = formData.hasItems && formData.items.length > 0
      ? formData.items.map((item, index) => ({
          name: item.name,
          description: item.description || undefined,
          imageUrl: item.imageUrl || undefined,
          price: item.price,
          currency: item.currency || "INR",
          unit: item.unit || undefined,
          minQuantity: item.minQuantity || 1,
          maxQuantity: item.maxQuantity || undefined,
          isRequired: item.isRequired || false,
          sortOrder: item.sortOrder ?? index,
        }))
      : undefined;

    createService.mutate(
      {
        vendorProfileId: profile.id,
        name: formData.name,
        description: formData.description || undefined,
        basePrice: formData.hasItems ? undefined : parseFloat(formData.basePrice),
        pricingType: formData.hasItems ? "ITEM_BASED" : undefined,
        priceUnit: formData.priceUnit,
        duration: normalizedDuration,
        isActive: formData.isActive,
        hasItems: formData.hasItems,
        features: formData.features
          ? formData.features.split("\n").filter((f) => f.trim())
          : undefined,
        items: itemsPayload,
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          resetForm();
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!selectedService) return;

    const normalizedDuration = formData.duration
      ? toMinutes(formData.duration, formData.durationUnit)
      : undefined;

    // Prepare items for sync
    const itemsToSync = formData.hasItems
      ? formData.items.map((item, index) => ({
          id: 'id' in item ? item.id : undefined,
          name: item.name,
          description: item.description || undefined,
          imageUrl: item.imageUrl || undefined,
          price: item.price,
          currency: item.currency || "INR",
          unit: item.unit || undefined,
          minQuantity: item.minQuantity || 1,
          maxQuantity: item.maxQuantity || undefined,
          isRequired: item.isRequired || false,
          sortOrder: item.sortOrder ?? index,
        }))
      : [];

    updateService.mutate(
      {
        id: selectedService.id,
        payload: {
          name: formData.name,
          description: formData.description || undefined,
          basePrice: formData.hasItems ? undefined : parseFloat(formData.basePrice),
          pricingType: formData.hasItems ? "ITEM_BASED" : undefined,
          priceUnit: formData.priceUnit,
          duration: normalizedDuration,
          isActive: formData.isActive,
          hasItems: formData.hasItems,
          features: formData.features
            ? formData.features.split("\n").filter((f) => f.trim())
            : undefined,
        },
      },
      {
        onSuccess: () => {
          // If service has items, sync them
          if (formData.hasItems && itemsToSync.length > 0) {
            syncServiceItems.mutate({
              serviceId: selectedService.id,
              items: itemsToSync,
            });
          }
          setShowEditDialog(false);
          setSelectedService(null);
          resetForm();
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteService.mutate(id);
  };

  const handleToggleActive = (service: VendorService) => {
    updateService.mutate({
      id: service.id,
      payload: { isActive: !service.isActive },
    });
  };

  const formatPrice = (price: number, unit: string | undefined | null) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price || 0);
    if (!unit) return formatted;
    const unitLabel = PRICE_UNITS.find((u) => u.value === unit)?.label || unit;
    return `${formatted} ${unitLabel.toLowerCase()}`;
  };

  const filteredServices = (services ?? []).filter((s) => {
    if (serviceStatus === "active" && !s.isActive) return false;
    if (serviceStatus === "inactive" && s.isActive) return false;
    const q = serviceSearch.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q);
  });

  if (profileLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-3">
        <PageHeader title="Services" />
        <Card>
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
            <h3 className="text-sm font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Please create your business profile first before adding services.
            </p>
            <Button size="sm" className="mt-3" onClick={() => (window.location.href = "/business/profile")}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Services"
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Service
          </Button>
        }
      />

      <DataTable<VendorService>
        data={filteredServices}
        isLoading={servicesLoading}
        rowKey={(s) => s.id}
        search={{ value: serviceSearch, onChange: setServiceSearch, placeholder: "Search services..." }}
        filters={
          <FilterSelect
            label="Status"
            value={serviceStatus}
            onChange={setServiceStatus}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        }
        exportFilename="services"
        columnToggle
        emptyTitle="No services yet"
        emptyIcon={Package}
        emptyAction={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Your First Service
          </Button>
        }
        columns={[
          {
            id: "name",
            header: "Service",
            label: "Service",
            sortValue: (s) => s.name,
            exportValue: (s) => s.name,
            cell: (s) => (
              <TwoLineCell
                title={s.name}
                subtitle={
                  s.hasItems && s.items && s.items.length > 0
                    ? `${s.items.length} menu items`
                    : s.description || undefined
                }
              />
            ),
          },
          {
            id: "price",
            header: "Price",
            label: "Price",
            sortValue: (s) => getServiceBasePrice(s),
            exportValue: (s) => getServiceBasePrice(s),
            cell: (s) => (
              <span className="text-sm font-medium">
                {s.hasItems && s.items && s.items.length > 0
                  ? `${formatPrice(Math.min(...s.items.map((i) => i.price)), null)} - ${formatPrice(
                      Math.max(...s.items.map((i) => i.price)),
                      null
                    )}`
                  : formatPrice(getServiceBasePrice(s), getServicePriceUnit(s))}
              </span>
            ),
          },
          {
            id: "duration",
            header: "Duration",
            label: "Duration",
            hideBelow: "md",
            sortValue: (s) => s.duration ?? 0,
            exportValue: (s) => s.duration ?? "",
            cell: (s) => <span className="text-sm">{s.duration ? `${s.duration} min` : "-"}</span>,
          },
          {
            id: "features",
            header: "Features",
            label: "Features",
            hideBelow: "lg",
            exportValue: (s) => s.features?.join("; ") ?? "",
            cell: (s) => (
              <span className="text-muted-foreground block max-w-[260px] truncate text-sm">
                {s.features && s.features.length > 0 ? s.features.join(", ") : "-"}
              </span>
            ),
          },
          {
            id: "status",
            header: "Status",
            label: "Status",
            sortValue: (s) => (s.isActive ? "Active" : "Inactive"),
            exportValue: (s) => (s.isActive ? "Active" : "Inactive"),
            cell: (s) => <StatusBadge tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Inactive"}</StatusBadge>,
          },
        ]}
        rowActions={(s) => [
          { label: "Edit", icon: Edit, onClick: () => openEditDialog(s) },
          {
            label: s.isActive ? "Deactivate" : "Activate",
            icon: s.isActive ? XCircle : CheckCircle,
            onClick: () => handleToggleActive(s),
          },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onClick: () => handleDelete(s.id),
            confirm: {
              title: "Delete this service?",
              description: `"${s.name}" will be permanently removed. This cannot be undone.`,
            },
          },
        ]}
      />

      {/* Create Service Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className={formData.hasItems ? "max-w-2xl max-h-[90vh] overflow-y-auto" : "max-w-lg"}>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>Create a new service offering for your customers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Wedding Photography Package"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what's included in this service..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Has Items Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="hasItems" className="font-medium">Add Menu/Items</Label>
                <p className="text-xs text-muted-foreground">
                  Enable to add individual items with prices (e.g., food menu, product list)
                </p>
              </div>
              <Switch
                id="hasItems"
                checked={formData.hasItems}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, hasItems: checked }))
                }
              />
            </div>

            {/* Show items form if hasItems is enabled */}
            {formData.hasItems && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <ServiceItemsForm
                  items={formData.items}
                  onChange={(items) => setFormData((prev) => ({ ...prev, items }))}
                />
              </div>
            )}

            {/* Only show base price if no items */}
            {!formData.hasItems && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price *</Label>
                  <div className="relative">
                    <Input
                      id="basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-2"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, basePrice: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceUnit">Price Unit</Label>
                  <select
                    id="priceUnit"
                    className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.priceUnit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priceUnit: e.target.value }))}
                  >
                    {PRICE_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g., 2"
                  value={formData.duration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                />
                <select
                  id="durationUnit"
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  value={formData.durationUnit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationUnit: e.target.value as (typeof DURATION_UNITS)[number]["value"],
                    }))
                  }
                >
                  {DURATION_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                placeholder="8 hours coverage&#10;500+ edited photos&#10;Online gallery"
                rows={4}
                value={formData.features}
                onChange={(e) => setFormData((prev) => ({ ...prev, features: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createService.isPending || !formData.name || (!formData.hasItems && !formData.basePrice)}
            >
              {createService.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Service"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={formData.hasItems ? "max-w-2xl max-h-[90vh] overflow-y-auto" : "max-w-lg"}>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update your service details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Service Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Has Items Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-hasItems" className="font-medium">Add Menu/Items</Label>
                <p className="text-xs text-muted-foreground">
                  Enable to add individual items with prices (e.g., food menu, product list)
                </p>
              </div>
              <Switch
                id="edit-hasItems"
                checked={formData.hasItems}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, hasItems: checked }))
                }
              />
            </div>

            {/* Show items form if hasItems is enabled */}
            {formData.hasItems && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <ServiceItemsForm
                  items={formData.items}
                  onChange={(items) => setFormData((prev) => ({ ...prev, items }))}
                />
              </div>
            )}

            {/* Only show base price if no items */}
            {!formData.hasItems && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-basePrice">Base Price *</Label>
                  <div className="relative">
                    <Input
                      id="edit-basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-2"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, basePrice: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priceUnit">Price Unit</Label>
                  <select
                    id="edit-priceUnit"
                    className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.priceUnit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priceUnit: e.target.value }))}
                  >
                    {PRICE_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="edit-duration"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.duration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                />
                <select
                  id="edit-durationUnit"
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  value={formData.durationUnit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationUnit: e.target.value as (typeof DURATION_UNITS)[number]["value"],
                    }))
                  }
                >
                  {DURATION_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-features">Features (one per line)</Label>
              <Textarea
                id="edit-features"
                rows={4}
                value={formData.features}
                onChange={(e) => setFormData((prev) => ({ ...prev, features: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">Active</Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateService.isPending || syncServiceItems.isPending || !formData.name || (!formData.hasItems && !formData.basePrice)}
            >
              {updateService.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
