'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  useBusinessKyc,
  useKycDocuments,
  useKycDocumentTypes,
  useCreateOrUpdateKyc,
  useSubmitKyc,
  useUploadKycDocument,
  useDeleteKycDocument,
} from '@/hooks/queries/use-business'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader, DataTable, StatusBadge, TwoLineCell } from '@/components/dash'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import type { DocumentType, KYCStatus, DocumentStatus } from '@/lib/api/types/business.types'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { FeatureFlagGate, FeatureDisabledMessage } from '@/components/common'

const kycStatusConfig: Record<KYCStatus, { label: string; color: string; icon: typeof Clock; description: string }> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-muted text-foreground border-border',
    icon: Clock,
    description: 'Complete your business details and upload required documents',
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'bg-primary/10 text-primary border-primary/40',
    icon: Clock,
    description: 'Your verification is in queue for review',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'bg-warning/10 text-warning border-warning/40',
    icon: Eye,
    description: 'Our team is reviewing your documents',
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-success/10 text-success border-success/40',
    icon: CheckCircle,
    description: 'Your account is verified!',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-destructive/10 text-destructive border-destructive/40',
    icon: XCircle,
    description: 'Please review the feedback and resubmit',
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-warning/10 text-warning border-warning/40',
    icon: AlertTriangle,
    description: 'Your verification has expired. Please resubmit documents.',
  },
}

const documentStatusConfig: Record<DocumentStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending Review', color: 'bg-muted text-foreground' },
  VERIFIED: { label: 'Verified', color: 'bg-success/10 text-success' },
  REJECTED: { label: 'Rejected', color: 'bg-destructive/10 text-destructive' },
  EXPIRED: { label: 'Expired', color: 'bg-warning/10 text-warning' },
}

const businessTypes = [
  { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'LLP', label: 'Limited Liability Partnership (LLP)' },
  { value: 'PRIVATE_LIMITED', label: 'Private Limited Company' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited Company' },
  { value: 'OTHER', label: 'Other' },
]

export default function VerificationPage() {
  const { data: kyc, isLoading: kycLoading, error: kycError } = useBusinessKyc()
  const { data: documents = [], isLoading: docsLoading } = useKycDocuments()
  const { data: documentTypes } = useKycDocumentTypes()

  const createOrUpdateKyc = useCreateOrUpdateKyc()
  const submitKyc = useSubmitKyc()
  const uploadDocument = useUploadKycDocument()
  const deleteDocument = useDeleteKycDocument()

  const [formData, setFormData] = useState({
    legalName: '',
    businessType: '',
    taxId: '',
  })
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | ''>('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // Initialize form with KYC data
  useState(() => {
    if (kyc) {
      setFormData({
        legalName: kyc.legalName || '',
        businessType: kyc.businessType || '',
        taxId: kyc.taxId || '',
      })
    }
  })

  const canEdit = !kyc || kyc.status === 'PENDING' || kyc.status === 'REJECTED'
  const canSubmit = kyc && kyc.status === 'PENDING' && documents.length >= 2 // At least 2 required docs

  // Check if required documents are uploaded
  const requiredTypes = documentTypes?.required?.map((d) => d.type) || ['BUSINESS_LICENSE', 'ID_DOCUMENT']
  const uploadedTypes = new Set(documents.map((d) => d.type))
  const hasAllRequired = requiredTypes.every((type) => uploadedTypes.has(type))

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!selectedDocType) {
        toast.error('Please select a document type first')
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }

      setUploadProgress(0)
      try {
        await uploadDocument.mutateAsync({
          file,
          type: selectedDocType,
        })
        toast.success('Document uploaded successfully')
        setSelectedDocType('')
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to upload document')
      } finally {
        setUploadProgress(null)
      }
    },
    [selectedDocType, uploadDocument]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: !canEdit || !selectedDocType,
  })

  const handleSaveDetails = async () => {
    if (!formData.legalName || !formData.businessType) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await createOrUpdateKyc.mutateAsync({
        legalName: formData.legalName,
        businessType: formData.businessType,
        taxId: formData.taxId || undefined,
      })
      toast.success('Business details saved')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save details')
    }
  }

  const handleSubmitKyc = async () => {
    if (!hasAllRequired) {
      toast.error('Please upload all required documents first')
      return
    }

    try {
      await submitKyc.mutateAsync()
      toast.success('Verification submitted successfully!')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit verification')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument.mutateAsync(documentId)
      toast.success('Document deleted')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete document')
    }
  }

  if (kycLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const status = kyc?.status || 'PENDING'
  const statusInfo = kycStatusConfig[status]
  const StatusIcon = statusInfo.icon

  return (
    <FeatureFlagGate
      feature="vendor.onboarding"
      fallback={
        <FeatureDisabledMessage
          feature="KYC Verification"
          description="KYC verification is currently unavailable. Please check back later."
          backUrl="/business/dashboard"
          backText="Go to Dashboard"
        />
      }
    >
      <div className="container max-w-4xl py-2 space-y-3">
      {/* Header */}
      <PageHeader title="KYC Verification" />

      {/* Status Card */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${statusInfo.color}`}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Verification Status</h3>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{statusInfo.description}</p>
              {kyc?.rejectionReason && status === 'REJECTED' && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/40 rounded-lg">
                  <p className="text-sm text-destructive">
                    <strong>Rejection Reason:</strong> {kyc.rejectionReason}
                  </p>
                </div>
              )}
              {kyc?.expiryDate && status === 'APPROVED' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Valid until: {new Date(kyc.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
            {status === 'APPROVED' && (
              <ShieldCheck className="h-8 w-8 text-success" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Business Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Business Name *</Label>
              <Input
                id="legalName"
                placeholder="Enter legal business name"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID / GSTIN (Optional)</Label>
            <Input
              id="taxId"
              placeholder="Enter tax identification number"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          {canEdit && (
            <Button
              onClick={handleSaveDetails}
              disabled={createOrUpdateKyc.isPending}
            >
              {createOrUpdateKyc.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Details'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Required Documents Checklist */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Required Documents</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {documentTypes?.required?.map((docType) => {
                const isUploaded = uploadedTypes.has(docType.type)
                const doc = documents.find((d) => d.type === docType.type)
                return (
                  <div
                    key={docType.type}
                    className={`flex items-center gap-2 p-3 rounded-lg border ${
                      isUploaded ? 'bg-success/10 border-success/40' : 'bg-muted border-border'
                    }`}
                  >
                    {isUploaded ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{docType.name}</p>
                      <p className="text-xs text-muted-foreground">{docType.description}</p>
                    </div>
                    {doc && (
                      <Badge className={documentStatusConfig[doc.status].color} variant="secondary">
                        {documentStatusConfig[doc.status].label}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Upload Section */}
          {canEdit && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Select Document Type</Label>
                <Select
                  value={selectedDocType}
                  onValueChange={(value) => setSelectedDocType(value as DocumentType)}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Choose document type to upload" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes?.required?.map((docType) => (
                      <SelectItem key={docType.type} value={docType.type}>
                        {docType.name} (Required)
                      </SelectItem>
                    ))}
                    {documentTypes?.optional?.map((docType) => (
                      <SelectItem key={docType.type} value={docType.type}>
                        {docType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : selectedDocType
                    ? 'border-border hover:border-primary cursor-pointer'
                    : 'border-border bg-muted cursor-not-allowed'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                {selectedDocType ? (
                  <>
                    <p className="font-medium">
                      {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PDF, JPEG, PNG, or WebP (max 10MB)
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Select a document type above to upload
                  </p>
                )}
                {uploadProgress !== null && (
                  <Progress value={uploadProgress} className="mt-4 w-full max-w-xs mx-auto" />
                )}
              </div>
            </div>
          )}

          {/* Uploaded Documents List */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Uploaded Documents</h4>
              <DataTable<(typeof documents)[number]>
                data={documents}
                rowKey={(d) => d.id}
                maxHeight="360px"
                columns={[
                  {
                    id: 'type',
                    header: 'Document',
                    label: 'Document',
                    sortValue: (d) => d.type,
                    exportValue: (d) => d.type,
                    cell: (d) => (
                      <TwoLineCell
                        title={
                          documentTypes?.required?.find((t) => t.type === d.type)?.name ||
                          documentTypes?.optional?.find((t) => t.type === d.type)?.name ||
                          d.type.replace('_', ' ')
                        }
                        subtitle={d.notes && d.status === 'REJECTED' ? `Reason: ${d.notes}` : d.fileName || 'Document'}
                      />
                    ),
                  },
                  {
                    id: 'uploaded',
                    header: 'Uploaded',
                    label: 'Uploaded',
                    hideBelow: 'sm',
                    sortValue: (d) => new Date(d.createdAt),
                    cell: (d) => <span className="text-muted-foreground text-sm">{new Date(d.createdAt).toLocaleDateString()}</span>,
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    label: 'Status',
                    sortValue: (d) => d.status,
                    cell: (d) => <StatusBadge status={d.status}>{documentStatusConfig[d.status].label}</StatusBadge>,
                  },
                ]}
                rowActions={(d) => [
                  {
                    label: 'View',
                    icon: Eye,
                    visible: !!d.url,
                    onClick: () => {
                      const viewUrl = getMinioViewUrl(d.url!)
                      if (viewUrl) window.open(viewUrl, '_blank')
                    },
                  },
                  {
                    label: 'Delete',
                    icon: Trash2,
                    danger: true,
                    visible: canEdit,
                    disabled: deleteDocument.isPending,
                    onClick: () => handleDeleteDocument(d.id),
                    confirm: {
                      title: 'Delete this document?',
                      description: 'The uploaded document will be permanently removed.',
                    },
                  },
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      {canEdit && kyc && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Ready to Submit?</h3>
                <p className="text-sm text-muted-foreground">
                  {hasAllRequired
                    ? 'All required documents uploaded. Submit for review.'
                    : 'Please upload all required documents before submitting.'}
                </p>
              </div>
              <Button
                onClick={handleSubmitKyc}
                disabled={!hasAllRequired || submitKyc.isPending}
              >
                {submitKyc.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Submit for Verification
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </FeatureFlagGate>
  )
}
