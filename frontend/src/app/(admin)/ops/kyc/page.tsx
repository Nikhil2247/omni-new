'use client'

import { useState, useEffect } from 'react'
import { useOpsKycList, useStartKycReview, useApproveKyc, useRejectKyc } from '@/hooks/queries/use-ops'
import { useOpsKycRealtime } from '@/hooks/use-ops-kyc-realtime'
import { useAuthStore } from '@/store/auth-store'
import { useUmami } from '@/hooks/use-umami'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PageHeader,
  DataTable,
  FilterSelect,
  StatusBadge,
  TwoLineCell,
  StatCard,
  StatGrid,
  type DataColumn,
} from '@/components/dash'
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Clock,
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

const kycStatusConfig: Record<string, { label: string; icon: React.ElementType }> = {
  NOT_STARTED: { label: 'Not Started', icon: Clock },
  PENDING: { label: 'Pending', icon: Clock },
  SUBMITTED: { label: 'Submitted', icon: FileCheck },
  UNDER_REVIEW: { label: 'Under Review', icon: Eye },
  APPROVED: { label: 'Approved', icon: ShieldCheck },
  REJECTED: { label: 'Rejected', icon: ShieldX },
}

const docTypeConfig: Record<string, { label: string; icon: React.ElementType; required: boolean }> = {
  BUSINESS_LICENSE: { label: 'Business License', icon: Building2, required: true },
  ID_DOCUMENT: { label: 'ID Document', icon: User, required: true },
  TAX_CERTIFICATE: { label: 'Tax Certificate', icon: CreditCard, required: false },
  INSURANCE: { label: 'Insurance', icon: ShieldCheck, required: false },
  ADDRESS_PROOF: { label: 'Address Proof', icon: FileText, required: false },
  OTHER: { label: 'Other', icon: FileText, required: false },
}

const docStatusConfig: Record<string, { label: string }> = {
  PENDING: { label: 'Pending' },
  VERIFIED: { label: 'Verified' },
  REJECTED: { label: 'Rejected' },
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
  const [docsKyc, setDocsKyc] = useState<OpsKycRecord | null>(null)

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

  const columns: DataColumn<OpsKycRecord>[] = [
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      cell: (kyc) => (
        <TwoLineCell
          title={kyc.vendorProfile?.businessName || kyc.businessName || 'Unnamed Vendor'}
          subtitle={`KYC ID: ${kyc.id.substring(0, 12)}...`}
        />
      ),
      sortValue: (kyc) => kyc.vendorProfile?.businessName || kyc.businessName,
      exportValue: (kyc) => kyc.vendorProfile?.businessName || kyc.businessName,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (kyc) => (
        <StatusBadge status={kyc.status}>{(kycStatusConfig[kyc.status] || kycStatusConfig.PENDING).label}</StatusBadge>
      ),
      sortValue: (kyc) => kyc.status,
      exportValue: (kyc) => kyc.status,
    },
    {
      id: 'type',
      header: 'Business type',
      label: 'Business type',
      hideBelow: 'md',
      cell: (kyc) => kyc.businessType || '-',
      sortValue: (kyc) => kyc.businessType,
    },
    {
      id: 'registration',
      header: 'Registration No.',
      label: 'Registration No.',
      hideBelow: 'lg',
      cell: (kyc) => kyc.registrationNumber || '-',
      sortValue: (kyc) => kyc.registrationNumber,
    },
    {
      id: 'taxId',
      header: 'Tax ID',
      label: 'Tax ID',
      hideBelow: 'xl',
      cell: (kyc) => kyc.taxId || '-',
      sortValue: (kyc) => kyc.taxId,
    },
    {
      id: 'documents',
      header: 'Docs',
      label: 'Docs',
      align: 'right',
      cell: (kyc) => kyc.documents?.length ?? 0,
      sortValue: (kyc) => kyc.documents?.length ?? 0,
    },
    {
      id: 'submitted',
      header: 'Submitted',
      label: 'Submitted',
      hideBelow: 'md',
      cell: (kyc) => (kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : '-'),
      sortValue: (kyc) => (kyc.submittedAt ? new Date(kyc.submittedAt) : null),
    },
  ]

  const documentColumns: DataColumn<OpsKycDocument>[] = [
    {
      id: 'type',
      header: 'Document Type',
      label: 'Document Type',
      cell: (doc) => {
        const docType = docTypeConfig[doc.type] || docTypeConfig.OTHER
        const DocIcon = docType.icon
        return (
          <div className="flex items-center gap-2">
            <DocIcon className="h-4 w-4 text-muted-foreground" />
            <span>{docType.label}</span>
            {docType.required && <StatusBadge tone="neutral">Required</StatusBadge>}
          </div>
        )
      },
      sortValue: (doc) => doc.type,
      exportValue: (doc) => doc.type,
    },
    {
      id: 'fileName',
      header: 'File Name',
      label: 'File Name',
      cell: (doc) => <span className="text-muted-foreground">{doc.fileName}</span>,
      sortValue: (doc) => doc.fileName,
      exportValue: (doc) => doc.fileName,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (doc) => (
        <StatusBadge status={doc.status}>{(docStatusConfig[doc.status] || docStatusConfig.PENDING).label}</StatusBadge>
      ),
      sortValue: (doc) => doc.status,
      exportValue: (doc) => doc.status,
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3">
        <PageHeader title="KYC Verification" />
        <DataTable data={[]} columns={columns} rowKey={(k) => k.id} isLoading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <PageHeader title="KYC Verification" />
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Failed to load KYC records. Please try refreshing the page.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="KYC Verification"
        actions={
          isConnected ? (
            <div className="flex items-center gap-1.5 text-xs text-success">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/30 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              Live updates
            </div>
          ) : undefined
        }
      />

      <StatGrid>
        <StatCard label="Pending Review" value={pendingCount} icon={ShieldAlert} accent="text-warning" />
        <StatCard label="Under Review" value={underReviewCount} icon={Eye} accent="text-primary" />
        <StatCard label="Approved" value={approvedCount} icon={ShieldCheck} accent="text-success" />
        <StatCard label="Total" value={kycList?.length || 0} icon={Store} accent="text-primary" />
      </StatGrid>

      <DataTable
        data={filteredKyc}
        columns={columns}
        rowKey={(kyc) => kyc.id}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search business name or ID...' }}
        filters={
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((v) => ({
              value: v,
              label: kycStatusConfig[v].label,
            }))}
          />
        }
        columnToggle
        exportFilename="kyc-records"
        emptyTitle="No KYC records found"
        emptyIcon={ShieldAlert}
        rowActions={(kyc) => [
          { label: 'View details', icon: Eye, href: `/ops/kyc/${kyc.id}` },
          { label: 'Documents', icon: FileText, onClick: () => setDocsKyc(kyc) },
          {
            label: 'Start review',
            icon: PlayCircle,
            onClick: () => handleStartReview(kyc.id),
            disabled: startReview.isPending,
            visible: kyc.status === 'PENDING' || kyc.status === 'SUBMITTED',
          },
          {
            label: 'Approve',
            icon: CheckCircle,
            onClick: () => handleApprove(kyc.id),
            disabled: approveKyc.isPending,
            visible: kyc.status === 'UNDER_REVIEW',
          },
          {
            label: 'Reject',
            icon: XCircle,
            danger: true,
            onClick: () => openRejectDialog(kyc),
            visible: kyc.status === 'UNDER_REVIEW',
          },
        ]}
      />

      {/* KYC Documents Dialog */}
      <Dialog open={!!docsKyc} onOpenChange={(open) => !open && setDocsKyc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {docsKyc?.vendorProfile?.businessName || docsKyc?.businessName || 'Documents'}
            </DialogTitle>
          </DialogHeader>
          <DataTable
            data={docsKyc?.documents ?? []}
            columns={documentColumns}
            rowKey={(doc) => doc.id}
            defaultPageSize={10}
            emptyTitle="No documents uploaded yet"
            emptyIcon={FileText}
            maxHeight="50dvh"
            rowActions={(doc) => [
              { label: 'Preview', icon: Eye, onClick: () => openDocumentViewer(doc) },
              { label: 'Open in new tab', icon: ExternalLink, href: doc.url },
            ]}
          />
        </DialogContent>
      </Dialog>

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
          <div className="space-y-3">
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
                  <FileText className="h-16 w-16 text-muted-foreground mb-2" />
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
