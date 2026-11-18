'use client'

import { useState } from 'react'
import {
  useOpsAgreements,
  useCreateVendorAgreement,
  useUpdateVendorAgreement,
  useSendAgreement,
  useAcceptAgreement,
  useDeclineAgreement,
  useDeleteVendorAgreement,
  useOpsVendors,
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
  Pencil,
  Eye,
  Trash2,
  Loader2,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Send,
  X,
  FileText,
  Receipt,
} from 'lucide-react'
import {
  DataTable,
  StatCard,
  StatGrid,
  StatusBadge,
  TwoLineCell,
  type DataColumn,
} from '@/components/dash'

const STATUS_CONFIG: Record<string, { label: string }> = {
  DRAFT: { label: 'Draft' },
  NEGOTIATING: { label: 'Negotiating' },
  PENDING_SIGNATURE: { label: 'Pending Signature' },
  LOCKED: { label: 'Locked' },
  FULFILLED: { label: 'Fulfilled' },
  CANCELLED: { label: 'Cancelled' },
  DECLINED: { label: 'Declined' },
}

interface OpsAgreementsListProps {
  activeEventId: string
  showCreateButton?: boolean
}

export function OpsAgreementsList({ activeEventId, showCreateButton = true }: OpsAgreementsListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false)
  const [editingAgreementId, setEditingAgreementId] = useState<string | null>(null)
  const [decliningAgreementId, setDecliningAgreementId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [agreementForm, setAgreementForm] = useState({
    vendorProfileId: '',
    vendorName: '',
    agreedAmount: '',
    advancePaid: '',
    contractTerms: '',
    specialRequirements: '',
  })

  const { data, isLoading, error } = useOpsAgreements(activeEventId)
  const { data: vendors } = useOpsVendors()
  const createAgreement = useCreateVendorAgreement()
  const updateAgreement = useUpdateVendorAgreement()
  const sendAgreement = useSendAgreement()
  const acceptAgreement = useAcceptAgreement()
  const declineAgreement = useDeclineAgreement()
  const deleteAgreement = useDeleteVendorAgreement()

  const resetForm = () => {
    setAgreementForm({
      vendorProfileId: '',
      vendorName: '',
      agreedAmount: '',
      advancePaid: '',
      contractTerms: '',
      specialRequirements: '',
    })
  }

  const handleCreate = async () => {
    await createAgreement.mutateAsync({
      activeEventId,
      vendorProfileId: agreementForm.vendorProfileId,
      vendorName: agreementForm.vendorName,
      agreedAmount: Number(agreementForm.agreedAmount),
      advancePaid: agreementForm.advancePaid ? Number(agreementForm.advancePaid) : undefined,
      contractTerms: agreementForm.contractTerms || undefined,
      specialRequirements: agreementForm.specialRequirements || undefined,
    })
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors?.find(v => v.id === vendorId)
    setAgreementForm({
      ...agreementForm,
      vendorProfileId: vendorId,
      vendorName: vendor?.businessName || '',
    })
  }

  const handleEditClick = (agreement: {
    id: string;
    vendorProfileId: string;
    vendorName: string;
    agreedAmount?: number | null;
    advancePaid?: number | null;
  }) => {
    setEditingAgreementId(agreement.id)
    setAgreementForm({
      vendorProfileId: agreement.vendorProfileId,
      vendorName: agreement.vendorName,
      agreedAmount: agreement.agreedAmount ? String(agreement.agreedAmount) : '',
      advancePaid: agreement.advancePaid ? String(agreement.advancePaid) : '',
      contractTerms: '',
      specialRequirements: '',
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingAgreementId) return
    await updateAgreement.mutateAsync({
      id: editingAgreementId,
      payload: {
        agreedAmount: agreementForm.agreedAmount ? Number(agreementForm.agreedAmount) : undefined,
        advancePaid: agreementForm.advancePaid ? Number(agreementForm.advancePaid) : undefined,
        contractTerms: agreementForm.contractTerms || undefined,
        specialRequirements: agreementForm.specialRequirements || undefined,
      },
    })
    setIsEditDialogOpen(false)
    setEditingAgreementId(null)
    resetForm()
  }

  const handleSend = async (id: string) => {
    await sendAgreement.mutateAsync(id)
  }

  const handleAccept = async (id: string) => {
    await acceptAgreement.mutateAsync(id)
  }

  const handleDeclineClick = (id: string) => {
    setDecliningAgreementId(id)
    setIsDeclineDialogOpen(true)
  }

  const handleDecline = async () => {
    if (!decliningAgreementId) return
    await declineAgreement.mutateAsync({ id: decliningAgreementId, reason: declineReason })
    setIsDeclineDialogOpen(false)
    setDecliningAgreementId(null)
    setDeclineReason('')
  }

  const handleDelete = async (id: string) => {
    await deleteAgreement.mutateAsync(id)
  }

  type Agreement = NonNullable<typeof data>[number]

  const columns: DataColumn<Agreement>[] = [
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      cell: (a) => (
        <TwoLineCell
          title={a.vendorName}
          subtitle={
            a.vendorProfile?.businessName && a.vendorProfile.businessName !== a.vendorName
              ? a.vendorProfile.businessName
              : undefined
          }
        />
      ),
      sortValue: (a) => a.vendorName,
      exportValue: (a) => a.vendorName,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (a) => (
        <StatusBadge status={a.status || 'DRAFT'}>
          {(STATUS_CONFIG[a.status || 'DRAFT'] || STATUS_CONFIG.DRAFT).label}
        </StatusBadge>
      ),
      sortValue: (a) => a.status,
      exportValue: (a) => a.status,
    },
    {
      id: 'agreed',
      header: 'Agreed',
      label: 'Agreed',
      align: 'right',
      cell: (a) => `$${(Number(a.agreedAmount) || 0).toLocaleString()}`,
      sortValue: (a) => Number(a.agreedAmount) || 0,
    },
    {
      id: 'advance',
      header: 'Advance',
      label: 'Advance',
      align: 'right',
      hideBelow: 'md',
      cell: (a) => `$${(Number(a.advancePaid) || 0).toLocaleString()}`,
      sortValue: (a) => Number(a.advancePaid) || 0,
    },
    {
      id: 'balance',
      header: 'Balance',
      label: 'Balance',
      align: 'right',
      hideBelow: 'md',
      cell: (a) => `$${((Number(a.agreedAmount) || 0) - (Number(a.advancePaid) || 0)).toLocaleString()}`,
      sortValue: (a) => (Number(a.agreedAmount) || 0) - (Number(a.advancePaid) || 0),
    },
    {
      id: 'dates',
      header: 'Sent / Accepted',
      label: 'Sent / Accepted',
      hideBelow: 'lg',
      cell: (a) => (
        <span className="text-xs text-muted-foreground">
          {a.sentAt ? new Date(a.sentAt).toLocaleDateString() : '-'} /{' '}
          {a.acceptedAt ? new Date(a.acceptedAt).toLocaleDateString() : '-'}
        </span>
      ),
      exportValue: (a) =>
        `${a.sentAt ? new Date(a.sentAt).toLocaleDateString() : ''} / ${a.acceptedAt ? new Date(a.acceptedAt).toLocaleDateString() : ''}`,
    },
  ]

  if (error) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p className="font-medium">Failed to load agreements</p>
      </div>
    )
  }

  const totalAgreed = data?.reduce((sum, a) => sum + (Number(a.agreedAmount) || 0), 0) || 0
  const totalAdvance = data?.reduce((sum, a) => sum + (Number(a.advancePaid) || 0), 0) || 0
  const lockedCount = data?.filter(a => a.status === 'LOCKED' || a.status === 'FULFILLED').length || 0

  return (
    <div className="space-y-3">
      <StatGrid>
        <StatCard label="Total Agreements" value={data?.length || 0} icon={FileText} />
        <StatCard label="Locked" value={lockedCount} icon={CheckCircle2} accent="text-success" />
        <StatCard label="Total Value" value={`$${totalAgreed.toLocaleString()}`} icon={DollarSign} accent="text-primary" />
        <StatCard label="Advance Paid" value={`$${totalAdvance.toLocaleString()}`} icon={DollarSign} accent="text-warning" />
      </StatGrid>

      <DataTable
        data={data}
        columns={columns}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        exportFilename="vendor-agreements"
        emptyTitle="No vendor agreements yet"
        emptyIcon={Users}
        toolbarRight={
          showCreateButton ? (
            <Button size="sm" className="h-8" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Agreement
            </Button>
          ) : undefined
        }
        rowActions={(a) => [
          {
            label: 'Send',
            icon: Send,
            onClick: () => handleSend(a.id),
            disabled: sendAgreement.isPending,
            visible: a.status === 'DRAFT' || a.status === 'NEGOTIATING',
          },
          {
            label: 'Accept',
            icon: CheckCircle2,
            onClick: () => handleAccept(a.id),
            disabled: acceptAgreement.isPending,
            visible: a.status === 'PENDING_SIGNATURE',
          },
          {
            label: 'Decline',
            icon: X,
            onClick: () => handleDeclineClick(a.id),
            visible: a.status === 'PENDING_SIGNATURE',
          },
          {
            label: 'Edit',
            icon: Pencil,
            onClick: () => handleEditClick(a),
            visible: a.status !== 'LOCKED' && a.status !== 'FULFILLED' && a.status !== 'CANCELLED',
          },
          {
            label: 'View invoices',
            icon: Receipt,
            href: `/ops/events/${activeEventId}/invoices?vendorAgreementId=${a.id}`,
          },
          {
            label: 'View contract',
            icon: Eye,
            href: a.contractUrl || undefined,
            visible: !!a.contractUrl,
          },
          {
            label: 'Delete agreement',
            icon: Trash2,
            danger: true,
            onClick: () => handleDelete(a.id),
            confirm: {
              title: 'Delete agreement?',
              description: `The agreement with ${a.vendorName} will be permanently deleted. This action cannot be undone.`,
            },
          },
        ]}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Vendor Agreement</DialogTitle>
            <DialogDescription>Create a new agreement with a vendor for this event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="vendor">Select Vendor</Label>
              <Select value={agreementForm.vendorProfileId} onValueChange={handleVendorSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.businessName || vendor.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                placeholder="Vendor display name"
                value={agreementForm.vendorName}
                onChange={(e) => setAgreementForm({ ...agreementForm, vendorName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="agreedAmount">Agreed Amount</Label>
                <Input
                  id="agreedAmount"
                  type="number"
                  min="0"
                  placeholder="₹0"
                  value={agreementForm.agreedAmount}
                  onChange={(e) => setAgreementForm({ ...agreementForm, agreedAmount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="advancePaid">Advance Paid</Label>
                <Input
                  id="advancePaid"
                  type="number"
                  min="0"
                  placeholder="₹0"
                  value={agreementForm.advancePaid}
                  onChange={(e) => setAgreementForm({ ...agreementForm, advancePaid: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contractTerms">Contract Terms (Optional)</Label>
              <Textarea
                id="contractTerms"
                placeholder="Key terms and conditions..."
                value={agreementForm.contractTerms}
                onChange={(e) => setAgreementForm({ ...agreementForm, contractTerms: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specialRequirements">Special Requirements (Optional)</Label>
              <Textarea
                id="specialRequirements"
                placeholder="Any special requirements..."
                value={agreementForm.specialRequirements}
                onChange={(e) => setAgreementForm({ ...agreementForm, specialRequirements: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createAgreement.isPending || !agreementForm.vendorProfileId || !agreementForm.vendorName || !agreementForm.agreedAmount}
            >
              {createAgreement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Agreement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Agreement</DialogTitle>
            <DialogDescription>Update the agreement details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-agreedAmount">Agreed Amount</Label>
                <Input
                  id="edit-agreedAmount"
                  type="number"
                  min="0"
                  placeholder="₹0"
                  value={agreementForm.agreedAmount}
                  onChange={(e) => setAgreementForm({ ...agreementForm, agreedAmount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-advancePaid">Advance Paid</Label>
                <Input
                  id="edit-advancePaid"
                  type="number"
                  min="0"
                  placeholder="₹0"
                  value={agreementForm.advancePaid}
                  onChange={(e) => setAgreementForm({ ...agreementForm, advancePaid: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-contractTerms">Contract Terms (Optional)</Label>
              <Textarea
                id="edit-contractTerms"
                placeholder="Key terms and conditions..."
                value={agreementForm.contractTerms}
                onChange={(e) => setAgreementForm({ ...agreementForm, contractTerms: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-specialRequirements">Special Requirements (Optional)</Label>
              <Textarea
                id="edit-specialRequirements"
                placeholder="Any special requirements..."
                value={agreementForm.specialRequirements}
                onChange={(e) => setAgreementForm({ ...agreementForm, specialRequirements: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingAgreementId(null); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateAgreement.isPending}>
              {updateAgreement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Agreement</DialogTitle>
            <DialogDescription>Provide a reason for declining this agreement.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="space-y-1.5">
              <Label htmlFor="declineReason">Reason (Optional)</Label>
              <Textarea
                id="declineReason"
                placeholder="Why is this agreement being declined?"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeclineDialogOpen(false); setDecliningAgreementId(null); setDeclineReason('') }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={declineAgreement.isPending}
            >
              {declineAgreement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Decline Agreement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
