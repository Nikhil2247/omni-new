"use client";

import { useState } from "react";
import {
  useBusinessProfile,
  useBusinessServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
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
} from "lucide-react";
import type {
  VendorService,
  CreateServiceRequest,
  UpdateServiceRequest,
} from "@/lib/api/types/business.types";

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
  });

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
    });
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    if (!profile) return;

    const normalizedDuration = formData.duration
      ? toMinutes(formData.duration, formData.durationUnit)
      : undefined;

    createService.mutate(
      {
        vendorProfileId: profile.id,
        name: formData.name,
        description: formData.description || undefined,
        basePrice: parseFloat(formData.basePrice),
        priceUnit: formData.priceUnit,
        duration: normalizedDuration,
        isActive: formData.isActive,
        features: formData.features
          ? formData.features.split("\n").filter((f) => f.trim())
          : undefined,
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

    updateService.mutate(
      {
        id: selectedService.id,
        payload: {
          name: formData.name,
          description: formData.description || undefined,
          basePrice: parseFloat(formData.basePrice),
          priceUnit: formData.priceUnit,
          duration: normalizedDuration,
          isActive: formData.isActive,
          features: formData.features
            ? formData.features.split("\n").filter((f) => f.trim())
            : undefined,
        },
      },
      {
        onSuccess: () => {
          setShowEditDialog(false);
          setSelectedService(null);
          resetForm();
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteService.mutate(id);
    }
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

  if (profileLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your service offerings</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h3 className="text-lg font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-2">
              Please create your business profile first before adding services.
            </p>
            <Button className="mt-4" onClick={() => (window.location.href = "/business/profile")}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your service offerings and packages</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Services List */}
      {servicesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : !services || services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">No Services Yet</h3>
            <p className="text-muted-foreground mt-2">
              Add your first service to start showcasing your offerings.
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className={!service.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={service.isActive ? "default" : "secondary"}
                        className={service.isActive ? "bg-green-100 text-green-700" : ""}
                      >
                        {service.isActive ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(service)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                        {service.isActive ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(service.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {service.description && (
                  <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                    {service.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">
                        {formatPrice(getServiceBasePrice(service), getServicePriceUnit(service))}
                      </span>
                    </div>
                    {service.duration && (
                      <div className="text-muted-foreground flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        {service.duration} min
                      </div>
                    )}
                  </div>

                  {service.features && service.features.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-muted-foreground mb-2 text-xs">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {service.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Service Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>Create a new service offering for your customers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <div className="grid grid-cols-2 gap-4">
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
              disabled={createService.isPending || !formData.name || !formData.basePrice}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update your service details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration</Label>
              <div className="grid grid-cols-2 gap-4">
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
              disabled={updateService.isPending || !formData.name || !formData.basePrice}
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
