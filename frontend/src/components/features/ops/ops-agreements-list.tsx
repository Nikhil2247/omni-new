'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  X,
  FileCheck,
  FileText,
  Receipt,
  Building,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: <FileText className="h-3 w-3" /> },
  NEGOTIATING: { label: 'Negotiating', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
  PENDING_SIGNATURE: { label: 'Pending Signature', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: <Send className="h-3 w-3" /> },
  LOCKED: { label: 'Locked', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
  FULFILLED: { label: 'Fulfilled', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', icon: <FileCheck className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: <X className="h-3 w-3" /> },
  DECLINED: { label: 'Declined', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: <X className="h-3 w-3" /> },
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
        <p className="font-medium">Failed to load agreements</p>
      </div>
    )
  }

  const totalAgreed = data?.reduce((sum, a) => sum + (Number(a.agreedAmount) || 0), 0) || 0
  const totalAdvance = data?.reduce((sum, a) => sum + (Number(a.advancePaid) || 0), 0) || 0
  const lockedCount = data?.filter(a => a.status === 'LOCKED' || a.status === 'FULFILLED').length || 0

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Agreements</p>
            <p className="text-2xl font-bold">{data?.length || 0}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Locked</p>
            <p className="text-2xl font-bold text-green-600">{lockedCount}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-blue-600">${totalAgreed.toLocaleString()}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Advance Paid</p>
            <p className="text-2xl font-bold text-orange-600">${totalAdvance.toLocaleString()}</p>
          </div>
        </div>

        {showCreateButton && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Agreement
          </Button>
        )}
      </div>

      {/* Agreements List */}
      {!data?.length ? (
        <Card>
          <CardContent className="py-4 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No vendor agreements yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create agreements with vendors for this event.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((agreement) => {
            const status = STATUS_CONFIG[agreement.status || 'DRAFT'] || STATUS_CONFIG.DRAFT
            const agreedAmount = Number(agreement.agreedAmount) || 0
            const advancePaid = Number(agreement.advancePaid) || 0
            const balanceDue = agreedAmount - advancePaid

            const canSend = agreement.status === 'DRAFT' || agreement.status === 'NEGOTIATING'
            const canAccept = agreement.status === 'PENDING_SIGNATURE'
            const canDecline = agreement.status === 'PENDING_SIGNATURE'
            const canEdit = agreement.status !== 'LOCKED' && agreement.status !== 'FULFILLED' && agreement.status !== 'CANCELLED'

            return (
              <Card key={agreement.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded bg-primary/10">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{agreement.vendorName}</span>
                        <Badge variant="outline" className={status.color}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>

                      {agreement.vendorProfile?.businessName && agreement.vendorProfile.businessName !== agreement.vendorName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Business: {agreement.vendorProfile.businessName}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">${agreedAmount.toLocaleString()}</span>
                          <span className="text-muted-foreground">agreed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-600">${advancePaid.toLocaleString()}</span>
                          <span className="text-muted-foreground">advance</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-600">${balanceDue.toLocaleString()}</span>
                          <span className="text-muted-foreground">balance</span>
                        </div>
                      </div>

                      {(agreement.sentAt || agreement.acceptedAt) && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {agreement.sentAt && (
                            <span>Sent: {new Date(agreement.sentAt).toLocaleDateString()}</span>
                          )}
                          {agreement.acceptedAt && (
                            <span>Accepted: {new Date(agreement.acceptedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canSend && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSend(agreement.id)}
                          disabled={sendAgreement.isPending}
                        >
                          {sendAgreement.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="mr-1 h-3 w-3" />
                              Send
                            </>
                          )}
                        </Button>
                      )}
                      {canAccept && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAccept(agreement.id)}
                          disabled={acceptAgreement.isPending}
                        >
                          {acceptAgreement.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Accept
                            </>
                          )}
                        </Button>
                      )}
                      {canDecline && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineClick(agreement.id)}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Decline
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && (
                            <DropdownMenuItem onClick={() => handleEditClick(agreement)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/ops/events/${activeEventId}/invoices?vendorAgreementId=${agreement.id}`}>
                              <Receipt className="mr-2 h-4 w-4" />
                              View Invoices
                            </Link>
                          </DropdownMenuItem>
                          {agreement.contractUrl && (
                            <DropdownMenuItem asChild>
                              <a href={agreement.contractUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
                                View Contract
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
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
                                <AlertDialogTitle>Delete Agreement</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this vendor agreement? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(agreement.id)}
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
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Vendor Agreement</DialogTitle>
            <DialogDescription>Create a new agreement with a vendor for this event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                placeholder="Vendor display name"
                value={agreementForm.vendorName}
                onChange={(e) => setAgreementForm({ ...agreementForm, vendorName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="contractTerms">Contract Terms (Optional)</Label>
              <Textarea
                id="contractTerms"
                placeholder="Key terms and conditions..."
                value={agreementForm.contractTerms}
                onChange={(e) => setAgreementForm({ ...agreementForm, contractTerms: e.target.value })}
              />
            </div>
            <div className="space-y-2">
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="edit-contractTerms">Contract Terms (Optional)</Label>
              <Textarea
                id="edit-contractTerms"
                placeholder="Key terms and conditions..."
                value={agreementForm.contractTerms}
                onChange={(e) => setAgreementForm({ ...agreementForm, contractTerms: e.target.value })}
              />
            </div>
            <div className="space-y-2">
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
          <div className="py-4">
            <div className="space-y-2">
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
