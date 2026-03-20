'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { useOnboarding } from '../onboarding-context'
import {
  useCreateOrUpdateKyc,
  useSubmitKyc,
  useKycDocuments,
  useKycDocumentTypes,
  useUploadKycDocument,
  useDeleteKycDocument,
} from '@/hooks/queries/use-business'
import { toast } from 'sonner'
import type { DocumentType } from '@/lib/api/types/business.types'

interface KycStepProps {
  onComplete: () => void
}

export function KycStep({ onComplete }: KycStepProps) {
  const { kyc, hasSubmittedKyc, isKycRejected } = useOnboarding()
  const { data: documents, isLoading: isLoadingDocs } = useKycDocuments()
  const { data: documentTypes, isLoading: isLoadingTypes } = useKycDocumentTypes()
  const { mutate: createOrUpdateKyc, isPending: isSavingKyc } = useCreateOrUpdateKyc()
  const { mutate: submitKyc, isPending: isSubmitting } = useSubmitKyc()
  const { mutate: uploadDocument, isPending: isUploading } = useUploadKycDocument()
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteKycDocument()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | ''>('')

  const [formData, setFormData] = useState({
    legalName: '',
    businessType: '',
    taxId: '',
  })

  // Initialize form with existing KYC data
  useEffect(() => {
    if (kyc) {
      setFormData({
        legalName: kyc.legalName || '',
        businessType: kyc.businessType || '',
        taxId: kyc.taxId || '',
      })
    }
  }, [kyc])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveBasicInfo = () => {
    if (!formData.legalName?.trim()) {
      toast.error('Legal business name is required')
      return
    }
    if (!formData.businessType) {
      toast.error('Business type is required')
      return
    }

    createOrUpdateKyc(formData, {
      onSuccess: () => {
        toast.success('KYC information saved')
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to save KYC info')
      },
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedDocType) {
      toast.error('Please select a document type first')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    uploadDocument(
      { file, type: selectedDocType as DocumentType },
      {
        onSuccess: () => {
          toast.success('Document uploaded successfully')
          setSelectedDocType('')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to upload document')
        },
      }
    )
  }

  const handleDeleteDocument = (documentId: string) => {
    deleteDocument(documentId, {
      onSuccess: () => {
        toast.success('Document deleted')
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to delete document')
      },
    })
  }

  const handleSubmitKyc = () => {
    // Check if all required documents are uploaded
    const requiredTypes = documentTypes?.required || []
    const uploadedTypes = new Set(documents?.map((d) => d.type) || [])
    const missingTypes = requiredTypes.filter((rt) => !uploadedTypes.has(rt.type))

    if (missingTypes.length > 0) {
      toast.error(`Please upload: ${missingTypes.map((t) => t.name).join(', ')}`)
      return
    }

    submitKyc(undefined, {
      onSuccess: () => {
        toast.success('KYC submitted for verification!')
        onComplete()
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to submit KYC')
      },
    })
  }

  const requiredDocs = documentTypes?.required || []
  const optionalDocs = documentTypes?.optional || []
  const uploadedDocs = documents || []

  const getDocumentStatus = (type: DocumentType) => {
    const doc = uploadedDocs.find((d) => d.type === type)
    if (!doc) return null
    return doc
  }

  const uploadProgress = requiredDocs.length > 0
    ? Math.round((requiredDocs.filter((rd) => getDocumentStatus(rd.type)).length / requiredDocs.length) * 100)
    : 0

  const canSubmit = requiredDocs.every((rd) => getDocumentStatus(rd.type)) && formData.legalName && formData.businessType

  // If already submitted, show pending message
  if (hasSubmittedKyc && !isKycRejected) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h3 className="font-semibold mb-2">KYC Submitted!</h3>
          <p className="text-sm text-muted-foreground">
            Your documents are being reviewed. You&apos;ll be notified once the verification is complete.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>KYC Verification</CardTitle>
        </div>
        <CardDescription>
          Verify your business identity to build trust with potential clients.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Rejection Alert */}
        {isKycRejected && kyc?.rejectionReason && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Rejection Reason:</strong> {kyc.rejectionReason}
              <br />
              Please correct the issues and resubmit.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Document Upload Progress</span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Business Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Business Name *</Label>
              <Input
                id="legalName"
                placeholder="As registered with authorities"
                value={formData.legalName}
                onChange={(e) => handleChange('legalName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => handleChange('businessType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                  <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                  <SelectItem value="LLP">LLP</SelectItem>
                  <SelectItem value="PRIVATE_LIMITED">Private Limited</SelectItem>
                  <SelectItem value="PUBLIC_LIMITED">Public Limited</SelectItem>
                  <SelectItem value="FREELANCER">Freelancer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">GST/Tax ID (Optional)</Label>
            <Input
              id="taxId"
              placeholder="GST Number or PAN"
              value={formData.taxId}
              onChange={(e) => handleChange('taxId', e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            onClick={handleSaveBasicInfo}
            disabled={isSavingKyc}
          >
            {isSavingKyc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Info
          </Button>
        </div>

        {/* Required Documents */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Required Documents</h3>
          <div className="space-y-3">
            {requiredDocs.map((docType) => {
              const uploaded = getDocumentStatus(docType.type)
              return (
                <div
                  key={docType.type}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    uploaded ? 'border-green-200 bg-green-50' : 'border-dashed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`h-5 w-5 ${uploaded ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium">{docType.name}</p>
                      <p className="text-xs text-muted-foreground">{docType.description}</p>
                    </div>
                  </div>
                  {uploaded ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Uploaded
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(uploaded.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline">Required</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-4 p-4 rounded-lg border-2 border-dashed">
          <h3 className="text-sm font-semibold">Upload Document</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as DocumentType)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {[...requiredDocs, ...optionalDocs].map((dt) => (
                  <SelectItem key={dt.type} value={dt.type}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={!selectedDocType || isUploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, or PNG. Max 10MB.
              </p>
            </div>
          </div>
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ensure all documents are clear and readable. Blurry or incomplete documents may be rejected.
          </AlertDescription>
        </Alert>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSubmitKyc}
          disabled={!canSubmit || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit for Verification'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
