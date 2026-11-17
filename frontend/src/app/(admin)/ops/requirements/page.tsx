"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useOpsActiveEvents,
  useOpsRequirements,
  useCreateRequirementSheet,
  useAddRequirementItem,
  useUpdateRequirementItem,
  useDeleteRequirementItem,
  useSendRequirementToClient,
} from "@/hooks/queries/use-ops";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  Plus,
  ClipboardList,
  Calendar,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  Clock,
  Package,
  XCircle,
  Send,
  Loader2,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const categoryOptions = [
  "Catering",
  "Photography",
  "Videography",
  "Decoration",
  "Flowers",
  "Music/DJ",
  "Lighting",
  "Transportation",
  "Venue",
  "Cake",
  "Entertainment",
  "Equipment",
  "Staff",
  "Other",
];

const priorityOptions = ["LOW", "NORMAL", "HIGH", "URGENT"];

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
  SOURCING: { label: "Sourcing", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  QUOTED: { label: "Quoted", color: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20" },
  APPROVED: { label: "Approved", color: "bg-green-500/10 text-green-700 border-green-500/20" },
  FULFILLED: {
    label: "Fulfilled",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-700 border-red-500/20" },
};

const approvalStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Draft", color: "bg-gray-500/10 text-gray-700 border-gray-500/20", icon: <ClipboardList className="h-3 w-3" /> },
  PENDING: { label: "Awaiting Approval", color: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: <Clock className="h-3 w-3" /> },
  APPROVED: { label: "Client Approved", color: "bg-green-500/10 text-green-700 border-green-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED: { label: "Client Rejected", color: "bg-red-500/10 text-red-700 border-red-500/20", icon: <XCircle className="h-3 w-3" /> },
};

export default function OpsRequirementsPage() {
  const { data: events, isLoading: eventsLoading } = useOpsActiveEvents();
  const createSheet = useCreateRequirementSheet();
  const addItem = useAddRequirementItem();
  const updateItem = useUpdateRequirementItem();
  const deleteItem = useDeleteRequirementItem();
  const sendToClient = useSendRequirementToClient();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch requirements for selected event
  const { data: requirements, isLoading: reqLoading } = useOpsRequirements(selectedEventId || "");

  // Dialog states
  const [createSheetDialogOpen, setCreateSheetDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [sendToClientDialogOpen, setSendToClientDialogOpen] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    category: string;
    description: string;
    quantity: number;
    priority: string;
    status: string;
    estimatedBudget?: string | number | null;
  } | null>(null);

  const [newSheetNotes, setNewSheetNotes] = useState("");
  const [newItem, setNewItem] = useState({
    category: "",
    description: "",
    quantity: 1,
    priority: "NORMAL",
    estimatedBudget: "",
  });

  const filteredEvents =
    events?.filter((event) => {
      const matchesSearch =
        !searchTerm ||
        event.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventType?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }) || [];

  const handleCreateSheet = () => {
    if (!selectedEventId) return;

    createSheet.mutate(
      {
        activeEventId: selectedEventId,
        notes: newSheetNotes || undefined,
      },
      {
        onSuccess: () => {
          setCreateSheetDialogOpen(false);
          setNewSheetNotes("");
        },
      }
    );
  };

  const handleAddItem = () => {
    if (!requirements?.id) return;

    addItem.mutate(
      {
        sheetId: requirements.id,
        payload: {
          category: newItem.category,
          description: newItem.description,
          quantity: newItem.quantity,
          priority: newItem.priority,
          estimatedBudget: newItem.estimatedBudget ? Number(newItem.estimatedBudget) : undefined,
        },
      },
      {
        onSuccess: () => {
          setAddItemDialogOpen(false);
          setNewItem({
            category: "",
            description: "",
            quantity: 1,
            priority: "NORMAL",
            estimatedBudget: "",
          });
        },
      }
    );
  };

  const handleUpdateItem = () => {
    if (!selectedItem) return;

    updateItem.mutate(
      {
        itemId: selectedItem.id,
        payload: {
          category: selectedItem.category,
          description: selectedItem.description,
          quantity: selectedItem.quantity,
          priority: selectedItem.priority,
          status: selectedItem.status,
          estimatedBudget: selectedItem.estimatedBudget
            ? Number(selectedItem.estimatedBudget)
            : undefined,
        },
      },
      {
        onSuccess: () => {
          setEditItemDialogOpen(false);
          setSelectedItem(null);
        },
      }
    );
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Are you sure you want to delete this requirement item?")) {
      deleteItem.mutate(itemId);
    }
  };

  const openEditDialog = (item: {
    id: string;
    category: string;
    description: string;
    quantity: number;
    priority?: string;
    status: string;
    estimatedBudget?: string | number | null;
  }) => {
    setSelectedItem({
      ...item,
      priority: item.priority || "NORMAL",
    });
    setEditItemDialogOpen(true);
  };

  const handleSendToClient = () => {
    if (!requirements?.id) return;

    sendToClient.mutate(
      { id: requirements.id, message: sendMessage || undefined },
      {
        onSuccess: () => {
          setSendToClientDialogOpen(false);
          setSendMessage("");
        },
      }
    );
  };

  const getApprovalLink = () => {
    if (!requirements?.approvalToken) return null;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/quote-approval/${requirements.approvalToken}`;
  };

  const copyApprovalLink = () => {
    const link = getApprovalLink();
    if (link) {
      navigator.clipboard.writeText(link);
    }
  };

  const selectedEvent = events?.find((e) => e.id === selectedEventId);

  if (eventsLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Requirements Management</h1>
          <p className="text-muted-foreground">Manage event requirements and sourcing items.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="bg-muted h-4 w-1/2 rounded" />
            </CardHeader>
            <CardContent>
              <div className="bg-muted h-32 rounded" />
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardContent className="p-4">
              <div className="bg-muted h-32 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Requirements Management</h1>
        <p className="text-muted-foreground">Manage event requirements and sourcing items.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Events List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[600px] space-y-2 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-4 text-center">
                  <Calendar className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <p className="text-muted-foreground text-sm">No events found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className={`hover:border-primary/50 cursor-pointer transition-all ${
                    selectedEventId === event.id ? "border-primary ring-primary ring-1" : ""
                  }`}
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{event.clientName || "Unnamed Client"}</p>
                        <p className="text-muted-foreground text-xs">
                          {event.eventType || "Event"}
                        </p>
                        <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {event.eventDate
                            ? new Date(event.eventDate).toLocaleDateString()
                            : "No date"}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.status?.replace(/_/g, " ") || "Unknown"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right: Requirements Panel */}
        <div className="space-y-4 lg:col-span-2">
          {!selectedEventId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <p className="text-lg font-medium">Select an Event</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Choose an event from the list to view or manage its requirements.
                </p>
              </CardContent>
            </Card>
          ) : reqLoading ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="bg-muted h-6 w-1/3 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-muted h-16 rounded" />
                  <div className="bg-muted h-16 rounded" />
                </div>
              </CardContent>
            </Card>
          ) : !requirements ? (
            <Card>
              <CardHeader>
                <CardTitle>No Requirement Sheet</CardTitle>
                <CardDescription>This event doesn't have a requirement sheet yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-4 text-center">
                  <ClipboardList className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p className="text-muted-foreground mb-4">
                    Create a requirement sheet to start tracking items needed for this event.
                  </p>
                  <Button onClick={() => setCreateSheetDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Requirement Sheet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Requirement Sheet Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>Requirement Sheet</CardTitle>
                        {requirements.approvalStatus && (
                          <Badge
                            variant="outline"
                            className={approvalStatusConfig[requirements.approvalStatus]?.color}
                          >
                            {approvalStatusConfig[requirements.approvalStatus]?.icon}
                            <span className="ml-1">
                              {approvalStatusConfig[requirements.approvalStatus]?.label}
                            </span>
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {selectedEvent?.clientName} - {selectedEvent?.eventType}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/ops/events/${selectedEventId}`}>
                        <Button variant="outline" size="sm">
                          View Event
                        </Button>
                      </Link>
                      {requirements.approvalStatus !== "APPROVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSendToClientDialogOpen(true)}
                          disabled={!requirements.items || requirements.items.length === 0}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {requirements.approvalStatus === "PENDING" ? "Resend" : "Send to Client"}
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setAddItemDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Approval Link Section */}
                  {requirements.approvalStatus === "PENDING" && requirements.approvalToken && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            Awaiting Client Approval
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Sent on{" "}
                            {requirements.sentToClientAt
                              ? new Date(requirements.sentToClientAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Input
                              readOnly
                              value={getApprovalLink() || ""}
                              className="text-xs bg-white dark:bg-slate-800"
                            />
                            <Button size="sm" variant="outline" onClick={copyApprovalLink}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(getApprovalLink() || "", "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approved Section */}
                  {requirements.approvalStatus === "APPROVED" && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Approved by Client
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Approved on{" "}
                            {requirements.clientApprovedAt
                              ? new Date(requirements.clientApprovedAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejected Section */}
                  {requirements.approvalStatus === "REJECTED" && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-800 dark:text-red-200">
                            Rejected by Client
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            Rejected on{" "}
                            {requirements.clientRejectedAt
                              ? new Date(requirements.clientRejectedAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                          {requirements.rejectionReason && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                              Reason: {requirements.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {requirements.notes && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-muted-foreground text-sm">{requirements.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Total Items</p>
                        <p className="text-2xl font-bold">{requirements.items?.length || 0}</p>
                      </div>
                      <Package className="text-muted-foreground h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {requirements.items?.filter((i) => i.status === "PENDING").length || 0}
                        </p>
                      </div>
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Fulfilled</p>
                        <p className="text-2xl font-bold text-green-600">
                          {requirements.items?.filter((i) => i.status === "FULFILLED").length || 0}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Est. Total</p>
                        <p className="text-2xl font-bold">
                          $
                          {requirements.items
                            ?.reduce((sum, i) => sum + (Number(i.estimatedBudget) || 0), 0)
                            .toLocaleString() || 0}
                        </p>
                      </div>
                      <span className="text-muted-foreground">$</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Requirement Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {!requirements?.items || requirements.items.length === 0 ? (
                    <div className="py-4 text-center">
                      <Package className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                      <p className="text-muted-foreground">No items added yet.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setAddItemDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requirements?.items?.map((item) => {
                        const itemStatus = statusConfig[item.status] || {
                          label: item.status,
                          color: "bg-gray-500/10 text-gray-700",
                        };
                        return (
                          <div
                            key={item.id}
                            className="flex items-start justify-between rounded-lg border p-4"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.category}</span>
                                <Badge variant="outline" className={itemStatus.color}>
                                  {itemStatus.label}
                                </Badge>
                                {item.priority === "URGENT" && (
                                  <Badge variant="destructive" className="text-xs">
                                    Urgent
                                  </Badge>
                                )}
                                {item.priority === "HIGH" && (
                                  <Badge variant="default" className="bg-orange-500 text-xs">
                                    High
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground text-sm">{item.description}</p>
                              <div className="text-muted-foreground flex items-center gap-4 text-xs">
                                <span>Qty: {item.quantity}</span>
                                {item.estimatedBudget && (
                                  <span>Est: ${Number(item.estimatedBudget).toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Create Sheet Dialog */}
      <Dialog open={createSheetDialogOpen} onOpenChange={setCreateSheetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Requirement Sheet</DialogTitle>
            <DialogDescription>
              Create a new requirement sheet for {selectedEvent?.clientName}'s event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any initial notes about the requirements..."
                value={newSheetNotes}
                onChange={(e) => setNewSheetNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSheetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSheet} disabled={createSheet.isPending}>
              {createSheet.isPending ? "Creating..." : "Create Sheet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Requirement Item</DialogTitle>
            <DialogDescription>Add a new item to the requirement sheet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newItem.category}
                onValueChange={(value) => setNewItem((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the requirement..."
                value={newItem.description}
                onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newItem.priority}
                  onValueChange={(value) => setNewItem((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">Estimated Budget (Optional)</Label>
              <Input
                id="estimatedBudget"
                type="number"
                min="0"
                placeholder="0"
                value={newItem.estimatedBudget}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, estimatedBudget: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={addItem.isPending || !newItem.category || !newItem.description}
            >
              {addItem.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Requirement Item</DialogTitle>
            <DialogDescription>Update this requirement item.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={selectedItem.category}
                  onValueChange={(value) =>
                    setSelectedItem((prev) => prev && { ...prev, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedItem.description}
                  onChange={(e) =>
                    setSelectedItem((prev) => prev && { ...prev, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    value={selectedItem.quantity}
                    onChange={(e) =>
                      setSelectedItem(
                        (prev) => prev && { ...prev, quantity: parseInt(e.target.value) || 1 }
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={selectedItem.priority}
                    onValueChange={(value) =>
                      setSelectedItem((prev) => prev && { ...prev, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedItem.status}
                    onValueChange={(value) =>
                      setSelectedItem((prev) => prev && { ...prev, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusConfig).map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusConfig[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-estimatedBudget">Estimated Budget</Label>
                  <Input
                    id="edit-estimatedBudget"
                    type="number"
                    min="0"
                    value={selectedItem.estimatedBudget || ""}
                    onChange={(e) =>
                      setSelectedItem(
                        (prev) =>
                          prev && {
                            ...prev,
                            estimatedBudget: e.target.value ? Number(e.target.value) : null,
                          }
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} disabled={updateItem.isPending}>
              {updateItem.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Client Dialog */}
      <Dialog open={sendToClientDialogOpen} onOpenChange={setSendToClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Client for Approval</DialogTitle>
            <DialogDescription>
              Send this requirement sheet to {selectedEvent?.clientName} for approval. They will
              receive a link to view and approve the quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Total Items</span>
                <span className="font-bold">{requirements?.items?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Estimated Total</span>
                <span className="font-bold text-green-600">
                  {requirements?.items
                    ?.reduce((sum, i) => sum + (Number(i.estimatedBudget) || 0), 0)
                    .toLocaleString("en-IN")}{" "}
                  Rs
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sendMessage">Message (Optional)</Label>
              <Textarea
                id="sendMessage"
                placeholder="Add a personal message to include in the email..."
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendToClientDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendToClient} disabled={sendToClient.isPending}>
              {sendToClient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send for Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
