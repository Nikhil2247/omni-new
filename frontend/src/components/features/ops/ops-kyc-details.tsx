'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOpsKycById, useOpsVendorOnboarding, useStartKycReview, useApproveKyc, useRejectKyc } from '@/hooks/queries/use-ops'
import { useAuthStore } from '@/store/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  Clock,
  Eye,
  CheckCircle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Store,
  FileText,
  Download,
  ExternalLink,
  Building2,
  User,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  FileCheck,
  Loader2,
  FileSignature,
  Landmark,
  ScrollText,
  UserCircle,
  CircleDot,
} from 'lucide-react'
import type { OpsKycDocument } from '@/lib/api/types/ops.types'

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

const contractStatusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
  PENDING_SIGNATURE: { label: 'Pending Signature', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  ACTIVE: { label: 'Active', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  SUSPENDED: { label: 'Suspended', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  TERMINATED: { label: 'Terminated', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  EXPIRED: { label: 'Expired', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
}

const consentTypeLabels: Record<string, string> = {
  TERMS_AND_CONDITIONS: 'Terms & Conditions',
  PRIVACY_POLICY: 'Privacy Policy',
  PLATFORM_AGREEMENT: 'Platform Agreement',
  MARKETING_COMMUNICATIONS: 'Marketing Communications',
  DATA_PROCESSING: 'Data Processing',
  COMMISSION_AGREEMENT: 'Commission Agreement',
}

export function OpsKycDetails({ kycId }: { kycId: string }) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: kyc, isLoading: isKycLoading, error: kycError } = useOpsKycById(kycId)

  // Get vendor profile ID from KYC data to fetch onboarding data
  const vendorProfileId = kyc?.vendorProfileId || ''
  const { data: onboardingData, isLoading: isOnboardingLoading } = useOpsVendorOnboarding(vendorProfileId)

  const startReview = useStartKycReview()
  const approveKyc = useApproveKyc()
  const rejectKyc = useRejectKyc()

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<OpsKycDocument | null>(null)

  const handleStartReview = () => {
    if (user?.id && kyc?.id) {
      startReview.mutate({ id: kyc.id, reviewerId: user.id })
    }
  }

  const handleApprove = () => {
    if (user?.id && kyc?.id) {
      approveKyc.mutate({ id: kyc.id, reviewerId: user.id })
    }
  }

  const handleReject = () => {
    if (kyc?.id && rejectReason && user?.id) {
      rejectKyc.mutate(
        { id: kyc.id, reviewerId: user.id, reason: rejectReason },
        {
          onSuccess: () => {
            setRejectDialogOpen(false)
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

  if (isKycLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (kycError || !kyc) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
          <p className="text-destructive font-medium">Failed to load KYC record</p>
          <p className="text-sm text-muted-foreground mt-1">The record may not exist or you may not have permission to view it.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/ops/kyc')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to KYC List
          </Button>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = kycStatusConfig[kyc.status] || kycStatusConfig.PENDING
  const StatusIcon = statusConfig.icon
  const onboardingStatus = onboardingData?.onboardingStatus
  const profileSummary =
    onboardingData?.profile?.description?.trim() ||
    onboardingData?.profile?.tagline?.trim() ||
    null

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/ops/kyc')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to KYC List
      </Button>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {kyc.vendorProfile?.businessName || kyc.businessName || 'Unnamed Vendor'}
                </CardTitle>
                <CardDescription>
                  KYC ID: {kyc.id}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={`${statusConfig.color} text-sm px-3 py-1`}>
              <StatusIcon className="h-4 w-4 mr-1.5" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Onboarding Progress */}
          {onboardingStatus && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Onboarding Progress</span>
                <span className="text-sm text-muted-foreground">
                  {onboardingStatus.completedSteps} of {onboardingStatus.totalSteps} steps completed
                </span>
              </div>
              <Progress value={onboardingStatus.progress} className="h-2 mb-3" />
              <div className="flex flex-wrap gap-2">
                {Object.entries(onboardingStatus.steps).map(([key, step]) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className={step.completed
                      ? 'bg-green-500/10 text-green-700 border-green-500/20'
                      : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <CircleDot className="h-3 w-3 mr-1" />
                    )}
                    {step.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            {(kyc.status === 'PENDING' || kyc.status === 'SUBMITTED') && (
              <Button
                variant="outline"
                onClick={handleStartReview}
                disabled={startReview.isPending}
              >
                {startReview.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Start Review
              </Button>
            )}
            {kyc.status === 'UNDER_REVIEW' && (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={approveKyc.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {approveKyc.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve KYC
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject KYC
                </Button>
              </>
            )}
            {kyc.status === 'APPROVED' && (
              <div className="flex items-center gap-2 text-green-600">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-medium">KYC Verified</span>
              </div>
            )}
            {kyc.status === 'REJECTED' && (
              <div className="flex items-center gap-2 text-red-600">
                <ShieldX className="h-5 w-5" />
                <span className="font-medium">KYC Rejected</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-1">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="kyc" className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">KYC</span>
                {kyc.documents && kyc.documents.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {kyc.documents.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="consents" className="flex items-center gap-1">
                <ScrollText className="h-4 w-4" />
                <span className="hidden sm:inline">Consents</span>
              </TabsTrigger>
              <TabsTrigger value="contract" className="flex items-center gap-1">
                <FileSignature className="h-4 w-4" />
                <span className="hidden sm:inline">Contract</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center gap-1">
                <Landmark className="h-4 w-4" />
                <span className="hidden sm:inline">Bank</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-4">
              {isOnboardingLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : onboardingData?.profile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Business Name</p>
                      <p className="font-medium">{onboardingData.profile.businessName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Slug</p>
                      <p className="font-medium">{onboardingData.profile.slug || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant="outline">{onboardingData.profile.status || '-'}</Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Email</p>
                      <p className="font-medium">{onboardingData.profile.contactEmail || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Phone</p>
                      <p className="font-medium">{onboardingData.profile.contactPhone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created At</p>
                      <p className="font-medium">
                        {onboardingData.profile.createdAt ? new Date(onboardingData.profile.createdAt).toLocaleString() : '-'}
                      </p>
                    </div>
                  </div>
                  {/* <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{profileSummary || '-'}</p>
                  </div> */}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <UserCircle className="mx-auto h-10 w-10 mb-3 opacity-50" />
                  <p className="font-medium">No profile data available</p>
                </div>
              )}
            </TabsContent>

            {/* KYC Tab */}
            <TabsContent value="kyc" className="mt-4 space-y-4">
              {/* Business Details */}
              <div>
                <h4 className="font-medium mb-4">Business Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Business Name</p>
                      <p className="font-medium">{kyc.vendorProfile?.businessName || kyc.businessName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Business Type</p>
                      <p className="font-medium">{kyc.businessType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Number</p>
                      <p className="font-medium">{kyc.registrationNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tax ID</p>
                      <p className="font-medium">{kyc.taxId || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted At</p>
                      <p className="font-medium">
                        {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reviewed At</p>
                      <p className="font-medium">
                        {kyc.reviewedAt ? new Date(kyc.reviewedAt).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created At</p>
                      <p className="font-medium">
                        {kyc.createdAt ? new Date(kyc.createdAt).toLocaleString() : '-'}
                      </p>
                    </div>
                  </div>
                  {kyc.businessAddress && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Business Address</p>
                      <p className="font-medium">{kyc.businessAddress}</p>
                    </div>
                  )}
                  {kyc.rejectionReason && (
                    <div className="md:col-span-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">Rejection Reason</p>
                      <p className="text-red-700 mt-1">{kyc.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-medium mb-4">Documents</h4>
                {!kyc.documents || kyc.documents.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
                    <p className="font-medium">No documents uploaded yet</p>
                    <p className="text-sm mt-1">The vendor has not uploaded any KYC documents.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
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
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {doc.fileName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={docStatus.color}>
                                {docStatus.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '-'}
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
              </div>
            </TabsContent>

            {/* Consents Tab */}
            <TabsContent value="consents" className="mt-4">
              {isOnboardingLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : onboardingData?.consentStatus ? (
                <div className="space-y-4">
                  {Object.entries(onboardingData.consentStatus).map(([type, status]) => (
                    <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {status.hasConsent ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium">{consentTypeLabels[type] || type}</p>
                          {status.hasConsent && status.version && (
                            <p className="text-sm text-muted-foreground">Version: {status.version}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={status.hasConsent
                            ? 'bg-green-500/10 text-green-700 border-green-500/20'
                            : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                          }
                        >
                          {status.hasConsent ? 'Consented' : 'Not Consented'}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {/* Consent History */}
                  {onboardingData.consents && onboardingData.consents.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Consent History</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Given At</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {onboardingData.consents.map((consent) => (
                            <TableRow key={consent.id}>
                              <TableCell className="font-medium">
                                {consentTypeLabels[consent.consentType] || consent.consentType}
                              </TableCell>
                              <TableCell>{consent.version}</TableCell>
                              <TableCell>
                                {new Date(consent.givenAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={consent.withdrawnAt
                                    ? 'bg-red-500/10 text-red-700 border-red-500/20'
                                    : 'bg-green-500/10 text-green-700 border-green-500/20'
                                  }
                                >
                                  {consent.withdrawnAt ? 'Withdrawn' : 'Active'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <ScrollText className="mx-auto h-10 w-10 mb-3 opacity-50" />
                  <p className="font-medium">No consent data available</p>
                </div>
              )}
            </TabsContent>

            {/* Contract Tab */}
            <TabsContent value="contract" className="mt-4">
              {isOnboardingLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : onboardingData?.contract ? (
                <div className="space-y-4">
                  {/* Contract Status */}
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className={contractStatusConfig[onboardingData.contract.status || '']?.color || 'bg-gray-500/10 text-gray-700 border-gray-500/20'}
                    >
                      {contractStatusConfig[onboardingData.contract.status || '']?.label || onboardingData.contract.status || 'Unknown'}
                    </Badge>
                    {onboardingData.contract.signedByVendor && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Signed by Vendor</span>
                      </div>
                    )}
                    {onboardingData.contract.signedByPlatform && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Signed by Platform</span>
                      </div>
                    )}
                  </div>

                  {/* Contract Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Contract Number</p>
                        <p className="font-medium">{onboardingData.contract.contractNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Commission Rate</p>
                        <p className="font-medium">
                          {onboardingData.contract.commissionRate != null
                            ? `${onboardingData.contract.commissionRate}%`
                            : '-'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payout Frequency</p>
                        <p className="font-medium">{onboardingData.contract.payoutFrequency || '-'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Payout Hold Days</p>
                        <p className="font-medium">{onboardingData.contract.payoutHoldDays ?? '-'} days</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Minimum Payout Amount</p>
                        <p className="font-medium">
                          {onboardingData.contract.minPayoutAmount != null
                            ? `${onboardingData.contract.minPayoutAmount}`
                            : '-'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Signed At</p>
                        <p className="font-medium">
                          {onboardingData.contract.signedAt
                            ? new Date(onboardingData.contract.signedAt).toLocaleString()
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Effective Date</p>
                        <p className="font-medium">
                          {onboardingData.contract.effectiveDate
                            ? new Date(onboardingData.contract.effectiveDate).toLocaleDateString()
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Expiry Date</p>
                        <p className="font-medium">
                          {onboardingData.contract.expiryDate
                            ? new Date(onboardingData.contract.expiryDate).toLocaleDateString()
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <FileSignature className="mx-auto h-10 w-10 mb-3 opacity-50" />
                  <p className="font-medium">No contract created yet</p>
                </div>
              )}
            </TabsContent>

            {/* Bank Details Tab */}
            <TabsContent value="bank" className="mt-4">
              {isOnboardingLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : onboardingData?.contract && (
                onboardingData.contract.bankAccountNumber || onboardingData.contract.upiId
              ) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Account Name</p>
                      <p className="font-medium">{onboardingData.contract.bankAccountName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Account Number</p>
                      <p className="font-medium font-mono">{onboardingData.contract.bankAccountNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{onboardingData.contract.bankName || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">IFSC Code</p>
                      <p className="font-medium font-mono">{onboardingData.contract.bankIfscCode || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">UPI ID</p>
                      <p className="font-medium">{onboardingData.contract.upiId || '-'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Landmark className="mx-auto h-10 w-10 mb-3 opacity-50" />
                  <p className="font-medium">No bank details provided yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
        <DialogContent className="max-w-4xl max-h-[90vh]">
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
              selectedDocument.mimeType?.startsWith('image/') ? (
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
