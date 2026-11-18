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
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  TwoLineCell,
  StatCard,
  StatGrid,
  type DataColumn,
} from "@/components/dash";
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
  Plus,
  ClipboardList,
  Calendar,
  Edit,
  Trash2,
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

const statusConfig: Record<string, { label: string }> = {
  PENDING: { label: "Pending" },
  SOURCING: { label: "Sourcing" },
  QUOTED: { label: "Quoted" },
  APPROVED: { label: "Approved" },
  FULFILLED: { label: "Fulfilled" },
  CANCELLED: { label: "Cancelled" },
};

const approvalStatusConfig: Record<string, { label: string }> = {
  DRAFT: { label: "Draft" },
  PENDING: { label: "Awaiting Approval" },
  APPROVED: { label: "Client Approved" },
  REJECTED: { label: "Client Rejected" },
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
    deleteItem.mutate(itemId);
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

  type EventRow = NonNullable<typeof events>[number];
  type ReqItem = NonNullable<NonNullable<typeof requirements>["items"]>[number];

  const eventColumns: DataColumn<EventRow>[] = [
    {
      id: "event",
      header: "Event",
      label: "Event",
      cell: (event) => (
        <div className="flex items-center gap-2">
          <span
            className={`size-1.5 shrink-0 rounded-full ${selectedEventId === event.id ? "bg-primary" : "bg-transparent"}`}
          />
          <TwoLineCell
            title={event.clientName || "Unnamed Client"}
            subtitle={`${event.eventType || "Event"} · ${event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "No date"}`}
          />
        </div>
      ),
      sortValue: (event) => event.clientName,
      exportValue: (event) => event.clientName,
    },
    {
      id: "status",
      header: "Status",
      label: "Status",
      cell: (event) => <StatusBadge status={event.status || "Unknown"} />,
      sortValue: (event) => event.status,
      exportValue: (event) => event.status,
    },
  ];

  const itemColumns: DataColumn<ReqItem>[] = [
    {
      id: "item",
      header: "Requirement",
      label: "Requirement",
      cell: (item) => <TwoLineCell title={item.category} subtitle={item.description} />,
      sortValue: (item) => item.category,
      exportValue: (item) => `${item.category}: ${item.description}`,
    },
    {
      id: "status",
      header: "Status",
      label: "Status",
      cell: (item) => (
        <StatusBadge status={item.status}>
          {(statusConfig[item.status] || { label: item.status }).label}
        </StatusBadge>
      ),
      sortValue: (item) => item.status,
      exportValue: (item) => item.status,
    },
    {
      id: "priority",
      header: "Priority",
      label: "Priority",
      hideBelow: "md",
      cell: (item) => <StatusBadge status={item.priority || "NORMAL"} />,
      sortValue: (item) => item.priority,
      exportValue: (item) => item.priority || "NORMAL",
    },
    {
      id: "quantity",
      header: "Qty",
      label: "Qty",
      align: "right",
      cell: (item) => item.quantity,
      sortValue: (item) => item.quantity,
    },
    {
      id: "budget",
      header: "Est. budget",
      label: "Est. budget",
      align: "right",
      cell: (item) =>
        item.estimatedBudget ? `$${Number(item.estimatedBudget).toLocaleString()}` : "-",
      sortValue: (item) => (item.estimatedBudget ? Number(item.estimatedBudget) : null),
      exportValue: (item) => (item.estimatedBudget ? Number(item.estimatedBudget) : ""),
    },
  ];

  if (eventsLoading) {
    return (
      <div className="space-y-3">
        <PageHeader title="Requirements Management" />
        <DataTable data={[]} columns={eventColumns} rowKey={(e) => e.id} isLoading />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Requirements Management"
        actions={
          selectedEventId && requirements ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/ops/events/${selectedEventId}`}>View Event</Link>
              </Button>
              {requirements.approvalStatus !== "APPROVED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSendToClientDialogOpen(true)}
                  disabled={!requirements.items || requirements.items.length === 0}
                >
                  <Send className="mr-1 h-4 w-4" />
                  {requirements.approvalStatus === "PENDING" ? "Resend" : "Send to Client"}
                </Button>
              )}
              <Button size="sm" onClick={() => setAddItemDialogOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Item
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Left: Events */}
        <DataTable
          data={filteredEvents}
          columns={eventColumns}
          rowKey={(e) => e.id}
          search={{ value: searchTerm, onChange: setSearchTerm, placeholder: "Search events..." }}
          emptyTitle="No events found"
          emptyIcon={Calendar}
          onRowClick={(event) => setSelectedEventId(event.id)}
          defaultPageSize={10}
          pageSizeOptions={[10, 20, 50]}
        />

        {/* Right: Requirements */}
        <div className="space-y-3 lg:col-span-2">
          {!selectedEventId ? (
            <div className="rounded-lg border bg-card py-8 text-center">
              <ClipboardList className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
              <p className="font-medium">Select an event</p>
            </div>
          ) : reqLoading ? (
            <DataTable data={[]} columns={itemColumns} rowKey={(i) => i.id} isLoading />
          ) : !requirements ? (
            <div className="rounded-lg border bg-card py-8 text-center">
              <ClipboardList className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
              <p className="font-medium">No requirement sheet for {selectedEvent?.clientName}</p>
              <Button size="sm" className="mt-3" onClick={() => setCreateSheetDialogOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Create Requirement Sheet
              </Button>
            </div>
          ) : (
            <>
              {/* Approval state */}
              {(requirements.approvalStatus || requirements.notes) && (
                <div className="space-y-2">
                  {requirements.approvalStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{selectedEvent?.clientName}</span>
                      <StatusBadge status={requirements.approvalStatus}>
                        {approvalStatusConfig[requirements.approvalStatus]?.label}
                      </StatusBadge>
                    </div>
                  )}

                  {requirements.approvalStatus === "PENDING" && requirements.approvalToken && (
                    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-warning">
                            Awaiting Client Approval - sent on{" "}
                            {requirements.sentToClientAt
                              ? new Date(requirements.sentToClientAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              readOnly
                              value={getApprovalLink() || ""}
                              className="h-8 bg-white text-xs"
                            />
                            <Button size="sm" variant="outline" className="h-8" onClick={copyApprovalLink}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => window.open(getApprovalLink() || "", "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {requirements.approvalStatus === "APPROVED" && (
                    <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="font-medium text-success">
                        Approved by Client on{" "}
                        {requirements.clientApprovedAt
                          ? new Date(requirements.clientApprovedAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  )}

                  {requirements.approvalStatus === "REJECTED" && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="font-medium text-destructive">
                          Rejected by Client on{" "}
                          {requirements.clientRejectedAt
                            ? new Date(requirements.clientRejectedAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      {requirements.rejectionReason && (
                        <p className="mt-1 text-destructive">
                          Reason: {requirements.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}

                  {requirements.notes && (
                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                      <p className="text-muted-foreground text-sm">{requirements.notes}</p>
                    </div>
                  )}
                </div>
              )}

              <StatGrid>
                <StatCard label="Total Items" value={requirements.items?.length || 0} icon={Package} />
                <StatCard
                  label="Pending"
                  value={requirements.items?.filter((i) => i.status === "PENDING").length || 0}
                  icon={Clock}
                  accent="text-warning"
                />
                <StatCard
                  label="Fulfilled"
                  value={requirements.items?.filter((i) => i.status === "FULFILLED").length || 0}
                  icon={CheckCircle}
                  accent="text-success"
                />
                <StatCard
                  label="Est. Total"
                  value={`$${
                    requirements.items
                      ?.reduce((sum, i) => sum + (Number(i.estimatedBudget) || 0), 0)
                      .toLocaleString() || 0
                  }`}
                />
              </StatGrid>

              <DataTable
                data={requirements.items}
                columns={itemColumns}
                rowKey={(item) => item.id}
                exportFilename="requirement-items"
                emptyTitle="No items added yet"
                emptyIcon={Package}
                rowActions={(item) => [
                  { label: "Edit", icon: Edit, onClick: () => openEditDialog(item) },
                  {
                    label: "Delete item",
                    icon: Trash2,
                    danger: true,
                    onClick: () => handleDeleteItem(item.id),
                    confirm: {
                      title: "Delete requirement item?",
                      description: "This requirement item will be permanently deleted. This action cannot be undone.",
                    },
                  },
                ]}
              />
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
          <div className="space-y-3">
            <div className="space-y-1.5">
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
          <div className="space-y-3">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the requirement..."
                value={newItem.description}
                onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            <div className="space-y-3">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Total Items</span>
                <span className="font-bold">{requirements?.items?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Estimated Total</span>
                <span className="font-bold text-success">
                  {requirements?.items
                    ?.reduce((sum, i) => sum + (Number(i.estimatedBudget) || 0), 0)
                    .toLocaleString("en-IN")}{" "}
                  Rs
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
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
