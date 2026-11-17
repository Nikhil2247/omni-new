'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useOpsKycList, useStartKycReview, useApproveKyc, useRejectKyc } from '@/hooks/queries/use-ops'
import { useOpsKycRealtime } from '@/hooks/use-ops-kyc-realtime'
import { useAuthStore } from '@/store/auth-store'
import { useUmami } from '@/hooks/use-umami'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Building2,
  User,
  CreditCard,
  FileCheck,
  AlertCircle,
} from 'lucide-react'
import type { OpsKycRecord, OpsKycDocument } from '@/lib/api/types/ops.types'

const kycStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: Clock },
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: FileCheck },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20', icon: Eye },
  APPROVED: { label: 'Approved', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: ShieldCheck },
  REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: ShieldX },
}

const docTypeConfig: Record<string, { label: string; icon: React.ElementType; required: boolean }> = {
  BUSINESS_LICENSE: { label: 'Business License', icon: Building2, required: true },
  ID_DOCUMENT: { label: 'ID Document', icon: User, required: true },
  TAX_CERTIFICATE: { label: 'Tax Certificate', icon: CreditCard, required: false },
  INSURANCE: { label: 'Insurance', icon: ShieldCheck, required: false },
  ADDRESS_PROOF: { label: 'Address Proof', icon: FileText, required: false },
  OTHER: { label: 'Other', icon: FileText, required: false },
}

const docStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  VERIFIED: { label: 'Verified', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
}

export default function OpsKycPage() {
  const { user } = useAuthStore()
  const { data: kycList, isLoading, error } = useOpsKycList()
  const startReview = useStartKycReview()
  const approveKyc = useApproveKyc()
  const rejectKyc = useRejectKyc()
  const { track } = useUmami()

  // Subscribe to real-time KYC updates
  const { isConnected } = useOpsKycRealtime()

  useEffect(() => {
    track('ops:kyc:page_view', { section: 'kyc_management' })
  }, [])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedKyc, setSelectedKyc] = useState<OpsKycRecord | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<OpsKycDocument | null>(null)

  const filteredKyc = kycList?.filter((kyc) => {
    const matchesSearch = !searchTerm ||
      kyc.vendorProfile?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || kyc.status === statusFilter
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

  const openRejectDialog = (kyc: OpsKycRecord) => {
    setSelectedKyc(kyc)
    setRejectDialogOpen(true)
  }

  const handleReject = () => {
    if (selectedKyc?.id && rejectReason && user?.id) {
      rejectKyc.mutate(
        { id: selectedKyc.id, reviewerId: user.id, reason: rejectReason },
        {
          onSuccess: () => {
            setRejectDialogOpen(false)
            setSelectedKyc(null)
            setRejectReason('')
          },
        }
      )
    }
  }

  const openDocumentViewer = (doc: OpsKycDocument) => {
    setSelectedDocument(doc)
    setDocumentViewerOpen(true)
  }

  const pendingCount = kycList?.filter(k => k.status === 'PENDING' || k.status === 'SUBMITTED').length || 0
  const underReviewCount = kycList?.filter(k => k.status === 'UNDER_REVIEW').length || 0
  const approvedCount = kycList?.filter(k => k.status === 'APPROVED').length || 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">KYC Verification</h1>
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

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">KYC Verification</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="py-4 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
            <p className="text-destructive font-medium">Failed to load KYC records</p>
            <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">KYC Verification</h1>
          <p className="text-muted-foreground">Review and verify vendor KYC documents.</p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live updates
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
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
                <p className="text-sm text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold text-purple-600">{underReviewCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
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
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{kycList?.length || 0}</p>
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
            placeholder="Search by business name or ID..."
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
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KYC List */}
      {filteredKyc.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No KYC records found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'KYC submissions will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredKyc.map((kyc) => {
            const statusConfig = kycStatusConfig[kyc.status] || kycStatusConfig.PENDING
            const StatusIcon = statusConfig.icon

            return (
              <Card key={kyc.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {kyc.vendorProfile?.businessName || kyc.businessName || 'Unnamed Vendor'}
                        </CardTitle>
                        <CardDescription>
                          KYC ID: {kyc.id.substring(0, 12)}...
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Business Details</TabsTrigger>
                      <TabsTrigger value="documents">
                        Documents
                        {kyc.documents && kyc.documents.length > 0 && (
                          <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                            {kyc.documents.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Business Type</p>
                          <p className="font-medium">{kyc.businessType || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Registration No.</p>
                          <p className="font-medium">{kyc.registrationNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tax ID</p>
                          <p className="font-medium">{kyc.taxId || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Submitted</p>
                          <p className="font-medium">
                            {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : '-'}
                          </p>
                        </div>
                        {kyc.businessAddress && (
                          <div className="col-span-2 md:col-span-4">
                            <p className="text-muted-foreground">Business Address</p>
                            <p className="font-medium">{kyc.businessAddress}</p>
                          </div>
                        )}
                        {kyc.rejectionReason && (
                          <div className="col-span-2 md:col-span-4">
                            <p className="text-muted-foreground text-red-600">Rejection Reason</p>
                            <p className="font-medium text-red-700">{kyc.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="documents" className="mt-4">
                      {!kyc.documents || kyc.documents.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                          <p>No documents uploaded yet</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Type</TableHead>
                              <TableHead>File Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {kyc.documents.map((doc) => {
                              const docType = docTypeConfig[doc.type] || docTypeConfig.OTHER
                              const docStatus = docStatusConfig[doc.status] || docStatusConfig.PENDING
                              const DocIcon = docType.icon

                              return (
                                <TableRow key={doc.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <DocIcon className="h-4 w-4 text-muted-foreground" />
                                      <span>{docType.label}</span>
                                      {docType.required && (
                                        <Badge variant="outline" className="text-xs">Required</Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {doc.fileName}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={docStatus.color}>
                                      {docStatus.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDocumentViewer(doc)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                      >
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t">
                    <Link href={`/ops/kyc/${kyc.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                    {(kyc.status === 'PENDING' || kyc.status === 'SUBMITTED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartReview(kyc.id)}
                        disabled={startReview.isPending}
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Start Review
                      </Button>
                    )}
                    {kyc.status === 'UNDER_REVIEW' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(kyc.id)}
                          disabled={approveKyc.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openRejectDialog(kyc)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {kyc.status === 'APPROVED' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-sm font-medium">KYC Verified</span>
                      </div>
                    )}
                    {kyc.status === 'REJECTED' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <ShieldX className="h-5 w-5" />
                        <span className="text-sm font-medium">KYC Rejected</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this KYC submission.
              The vendor will be notified and can resubmit their documents.
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

      {/* Document Viewer Dialog */}
      <Dialog open={documentViewerOpen} onOpenChange={setDocumentViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument && docTypeConfig[selectedDocument.type]?.label}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.fileName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-[400px] bg-muted rounded-lg overflow-hidden">
            {selectedDocument && (
              selectedDocument.mimeType.startsWith('image/') ? (
                <img
                  src={selectedDocument.url}
                  alt={selectedDocument.fileName}
                  className="w-full h-full object-contain"
                />
              ) : selectedDocument.mimeType === 'application/pdf' ? (
                <iframe
                  src={selectedDocument.url}
                  className="w-full h-[500px]"
                  title={selectedDocument.fileName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Preview not available for this file type</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <a href={selectedDocument.url} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </a>
                  </Button>
                </div>
              )
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={selectedDocument?.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </a>
            </Button>
            <Button onClick={() => setDocumentViewerOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
