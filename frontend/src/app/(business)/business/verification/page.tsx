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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

const kycStatusConfig: Record<KYCStatus, { label: string; color: string; icon: typeof Clock; description: string }> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
    description: 'Complete your business details and upload required documents',
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock,
    description: 'Your verification is in queue for review',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Eye,
    description: 'Our team is reviewing your documents',
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
    description: 'Your account is verified!',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
    description: 'Please review the feedback and resubmit',
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: AlertTriangle,
    description: 'Your verification has expired. Please resubmit documents.',
  },
}

const documentStatusConfig: Record<DocumentStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending Review', color: 'bg-gray-100 text-gray-700' },
  VERIFIED: { label: 'Verified', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expired', color: 'bg-orange-100 text-orange-700' },
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
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground mt-1">
          Complete your business verification to unlock all features
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${statusInfo.color}`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Verification Status</h3>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{statusInfo.description}</p>
              {kyc?.rejectionReason && status === 'REJECTED' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
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
              <ShieldCheck className="h-12 w-12 text-green-500" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Business Details
          </CardTitle>
          <CardDescription>
            Provide your legal business information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
          <CardDescription>
            Upload required documents for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                      isUploaded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {isUploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
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
            <div className="space-y-4">
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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : selectedDocType
                    ? 'border-gray-300 hover:border-primary cursor-pointer'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
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
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {documentTypes?.required?.find((d) => d.type === doc.type)?.name ||
                            documentTypes?.optional?.find((d) => d.type === doc.type)?.name ||
                            doc.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileName || 'Document'} - {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                        {doc.notes && doc.status === 'REJECTED' && (
                          <p className="text-xs text-red-600 mt-1">Reason: {doc.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={documentStatusConfig[doc.status].color} variant="secondary">
                        {documentStatusConfig[doc.status].label}
                      </Badge>
                      {doc.url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const viewUrl = getMinioViewUrl(doc.url!)
                            if (viewUrl) window.open(viewUrl, '_blank')
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={deleteDocument.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      {canEdit && kyc && (
        <Card>
          <CardContent className="pt-6">
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
                size="lg"
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
  )
}
