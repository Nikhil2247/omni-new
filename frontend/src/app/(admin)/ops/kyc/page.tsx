'use client'

import { useState, useEffect } from 'react'
import { useOpsVendors, useOpsKycByVendor, useStartKycReview, useApproveKyc, useRejectKyc } from '@/hooks/queries/use-ops'
import { useAuthStore } from '@/store/auth-store'
import { useUmami } from '@/hooks/use-umami'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Clock,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  PlayCircle,
  Store,
} from 'lucide-react'

const kycStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: Clock },
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: Eye },
  APPROVED: { label: 'Approved', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: ShieldCheck },
  REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: ShieldX },
}

export default function OpsKycPage() {
  const { user } = useAuthStore()
  const { data: vendors, isLoading: vendorsLoading, error: vendorsError } = useOpsVendors()
  const startReview = useStartKycReview()
  const { track } = useUmami()

  useEffect(() => {
    track('ops:kyc:page_view', { section: 'kyc_management' })
  }, [])
  const approveKyc = useApproveKyc()
  const rejectKyc = useRejectKyc()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedKycId, setSelectedKycId] = useState<string | null>(null)

  // Get KYC for selected vendor
  const { data: selectedKyc, isLoading: kycLoading } = useOpsKycByVendor(selectedVendorId || '')

  const filteredVendors = vendors?.filter((vendor) => {
    const matchesSearch = !searchTerm ||
      vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const handleStartReview = (kycId: string) => {
    if (user?.id) {
      startReview.mutate({ id: kycId, reviewerId: user.id })
    }
  }

  const handleApprove = (kycId: string) => {
    if (user?.id) {
      approveKyc.mutate({ id: kycId, reviewerId: user.id })
    }
  }

  const openRejectDialog = (kycId: string) => {
    setSelectedKycId(kycId)
    setRejectDialogOpen(true)
  }

  const handleReject = () => {
    if (selectedKycId && rejectReason && user?.id) {
      rejectKyc.mutate(
        { id: selectedKycId, reviewerId: user.id, reason: rejectReason },
        {
          onSuccess: () => {
            setRejectDialogOpen(false)
            setSelectedKycId(null)
            setRejectReason('')
          },
        }
      )
    }
  }

  const pendingCount = vendors?.filter(v => v.status === 'PENDING_VERIFICATION').length || 0
  const verifiedCount = vendors?.filter(v => v.status === 'ACTIVE').length || 0

  if (vendorsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">Review and verify vendor KYC documents.</p>
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (vendorsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">KYC Verification</h1>
        </div>
        <div className="text-sm text-destructive">Failed to load vendors. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground">Review and verify vendor KYC documents.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <ShieldAlert className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                <p className="text-2xl font-bold">{vendors?.length || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
            <SelectItem value="ACTIVE">Active (Verified)</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vendors List */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Vendor List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Vendors</h2>
          {filteredVendors.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No vendors found.</p>
              </CardContent>
            </Card>
          ) : (
            filteredVendors.map((vendor) => (
              <Card
                key={vendor.id}
                className={`cursor-pointer transition-colors hover:border-primary/50 ${
                  selectedVendorId === vendor.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedVendorId(vendor.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{vendor.businessName || 'Unnamed Vendor'}</p>
                        <p className="text-xs text-muted-foreground">ID: {vendor.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        vendor.status === 'ACTIVE'
                          ? 'bg-green-500/10 text-green-700 border-green-500/20'
                          : vendor.status === 'PENDING_VERIFICATION'
                          ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                          : 'bg-gray-500/10 text-gray-700 border-gray-500/20'
                      }
                    >
                      {vendor.status?.replace(/_/g, ' ') || 'Unknown'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Right: KYC Details */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">KYC Details</h2>
          {!selectedVendorId ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Select a vendor to view KYC details</p>
              </CardContent>
            </Card>
          ) : kycLoading ? (
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ) : !selectedKyc ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ShieldX className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No KYC record found for this vendor</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The vendor has not submitted KYC documents yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">KYC Record</CardTitle>
                  <Badge
                    variant="outline"
                    className={kycStatusConfig[selectedKyc.status]?.color || 'bg-gray-500/10 text-gray-700'}
                  >
                    {kycStatusConfig[selectedKyc.status]?.label || selectedKyc.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">KYC ID</p>
                    <p className="font-medium">{selectedKyc.id.substring(0, 12)}...</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendor ID</p>
                    <p className="font-medium">{selectedKyc.vendorProfileId.substring(0, 12)}...</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {selectedKyc.submittedAt
                        ? new Date(selectedKyc.submittedAt).toLocaleString()
                        : 'Not submitted'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reviewed</p>
                    <p className="font-medium">
                      {selectedKyc.reviewedAt
                        ? new Date(selectedKyc.reviewedAt).toLocaleString()
                        : 'Not reviewed'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedKyc.status === 'PENDING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartReview(selectedKyc.id)}
                      disabled={startReview.isPending}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Start Review
                    </Button>
                  )}
                  {selectedKyc.status === 'UNDER_REVIEW' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(selectedKyc.id)}
                        disabled={approveKyc.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openRejectDialog(selectedKyc.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedKyc.status === 'APPROVED' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-sm font-medium">KYC Verified</span>
                    </div>
                  )}
                  {selectedKyc.status === 'REJECTED' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <ShieldX className="h-5 w-5" />
                      <span className="text-sm font-medium">KYC Rejected</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this KYC submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || rejectKyc.isPending}
            >
              {rejectKyc.isPending ? 'Rejecting...' : 'Reject KYC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
