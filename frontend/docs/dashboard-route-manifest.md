# Dashboard route manifest

Generated 2026-11-18 by import scan. Contract Phase 3 must preserve (URL, guards, query params).

121 files (114 pages, 7 layouts).

| URL | Kind | Group | Guards / roles | Query params | Hooks | Components |
|---|---|---|---|---|---|---|
| `/admin/audit` | page | (admin) | - | - | useAdminAudit | dashboard/index.ts<br>ui/input.tsx |
| `/admin/campaigns` | page | (admin) | - | - | useAdminCampaignCounts, useAdminCampaigns, useApproveCampaign, useRejectCampaign | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/tabs.tsx<br>ui/textarea.tsx |
| `/admin/dashboard` | page | (admin) | - | - | useAdminDashboard | charts/index.ts<br>dashboard/index.ts<br>ui/badge.tsx<br>ui/card.tsx<br>ui/skeleton.tsx |
| `/admin/insights` | page | (admin) | - | - | useAdminDashboard, usePlatformCounts, useRefreshPlatformCounts | charts/index.ts<br>dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/progress.tsx<br>ui/skeleton.tsx<br>ui/tabs.tsx |
| `/admin` | layout | (admin) | `<RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.ADMIN_SYSTEM]} redirectOnFail={true}>`<br>ROLES.ADMIN<br>ROLES.ADMIN_SYSTEM | - | - | auth/index.ts |
| `/admin/payments` | page | (admin) | - | - | useAdminPayments, useRefundPayment | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/textarea.tsx |
| `/admin/roles` | page | (admin) | - | - | useAdminRoles, useCreateRole, useDeleteRole | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/input.tsx |
| `/admin/settings/notifications` | page | (admin) | - | - | - | settings/notifications-form.tsx |
| `/admin/settings` | page | (admin) | - | - | useUmami | dashboard/index.ts<br>settings/settings-card.tsx |
| `/admin/settings/profile` | page | (admin) | - | - | - | settings/profile-form.tsx |
| `/admin/settings/security` | page | (admin) | - | - | - | settings/security-form.tsx |
| `/admin/subscriptions` | page | (admin) | - | - | useAdminSubscriptions, useCancelSubscription, useModifySubscription | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/checkbox.tsx<br>ui/dialog.tsx<br>ui/label.tsx<br>ui/select.tsx<br>ui/textarea.tsx |
| `/admin/users/[userId]` | page | (admin) | - | - | useAdminRoles, useAdminUser, useAssignUserRole, useUpdateUserStatus | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/select.tsx<br>ui/skeleton.tsx |
| `/admin/users` | page | (admin) | - | - | useAdminUsers | dashboard/index.ts |
| `/` | layout | (admin) | `<AuthGuard>`<br>`<RoleGuard allowedRoles={ROLE_GROUPS.STAFF} redirectOnFail={true}>`<br>ROLE_GROUPS.STAFF | - | - | auth/index.ts<br>layouts/dashboard/index.ts |
| `/marketing/analytics` | page | (admin) | `<RoleGuard allowedRoles={[ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER]} redirectOnFail={true}>`<br>ROLES.ADMIN_SYSTEM<br>ROLES.MARKETING_SERVICES_ADMIN<br>ROLES.MULTI_MEDIA_MANAGER | - | useBlogPosts, useUmami | auth/index.ts<br>dashboard/index.ts<br>ui/skeleton.tsx |
| `/marketing/campaigns/[campaignId]` | page | (admin) | - | - | useCancelMarketingCampaign, useMarketingCampaign, useMarketingCampaignStats, usePauseMarketingCampaign, useResumeMarketingCampaign, useUpdateMarketingCampaign | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/skeleton.tsx<br>ui/textarea.tsx |
| `/marketing/campaigns/new` | page | (admin) | - | - | - | dashboard/index.ts<br>ui/card.tsx |
| `/marketing/campaigns` | page | (admin) | - | - | useCancelMarketingCampaign, useMarketingCampaignList, usePauseMarketingCampaign, useResumeMarketingCampaign, useUmami, useUpdateMarketingCampaign | dashboard/index.ts<br>ui/button.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/textarea.tsx |
| `/marketing/categories` | page | (admin) | - | - | useMarketingCategories | dashboard/index.ts |
| `/marketing/content-writer/dashboard` | page | (admin) | `<RoleGuard allowedRoles={[ROLES.CONTENT_WRITER]} redirectOnFail={true} exactMatch>`<br>ROLES.CONTENT_WRITER | - | useBlogPosts | auth/index.ts<br>dashboard/index.ts<br>ui/button.tsx |
| `/marketing/content/[contentId]` | page | (admin) | ROLES.CONTENT_WRITER<br>ROLES.ADMIN_SYSTEM<br>ROLES.MARKETING_SERVICES_ADMIN | - | useAuthStore, useBlogPost, useDeleteBlogPost, usePublicBlogCategories, usePublicBlogTags, usePublishBlogPost, useUpdateBlogPost | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/checkbox.tsx<br>ui/file-upload.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/rich-text-editor.tsx<br>ui/scroll-area.tsx<br>ui/select.tsx<br>ui/skeleton.tsx<br>ui/textarea.tsx |
| `/marketing/content/blog` | page | (admin) | - | - | useBlogPosts | dashboard/index.ts<br>marketing/blog-health-indicator.tsx<br>ui/select.tsx |
| `/marketing/content/calendar` | page | (admin) | - | - | - | dashboard/index.ts<br>ui/card.tsx |
| `/marketing/content/drafts` | page | (admin) | - | - | useBlogPosts | dashboard/index.ts<br>marketing/blog-health-indicator.tsx<br>ui/select.tsx |
| `/marketing/content/new` | page | (admin) | - | - | useCreateBlogPost, usePublicBlogCategories, usePublicBlogTags | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/checkbox.tsx<br>ui/file-upload.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/rich-text-editor.tsx<br>ui/scroll-area.tsx<br>ui/select.tsx<br>ui/separator.tsx<br>ui/tabs.tsx<br>ui/textarea.tsx |
| `/marketing/content` | page | (admin) | ROLES.CONTENT_WRITER | - | useAuthStore, useBlogPosts, useDeleteBlogPost, usePublicBlogCategories, usePublicBlogTags, usePublishBlogPost, useUmami | dashboard/index.ts<br>marketing/blog-health-indicator.tsx<br>ui/button.tsx |
| `/marketing/content/pages` | page | (admin) | - | - | useBlogPosts | dashboard/index.ts |
| `/marketing/dashboard` | page | (admin) | `<RoleGuard allowedRoles={[ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER]} redirectOnFail={true} >`<br>ROLES.ADMIN_SYSTEM<br>ROLES.MARKETING_SERVICES_ADMIN<br>ROLES.MULTI_MEDIA_MANAGER | - | useBlogPosts, useMarketingCampaigns, useMarketingMedia, useMarketingPromotions | auth/index.ts<br>dashboard/index.ts<br>ui/card.tsx<br>ui/skeleton.tsx |
| `/marketing` | layout | (admin) | `<RoleGuard allowedRoles={ROLE_GROUPS.MARKETING} redirectOnFail={true}>`<br>ROLE_GROUPS.MARKETING | - | - | auth/index.ts |
| `/marketing/media` | page | (admin) | `<RoleGuard allowedRoles={[ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER]} redirectOnFail={true}>`<br>ROLES.ADMIN_SYSTEM<br>ROLES.MARKETING_SERVICES_ADMIN<br>ROLES.MULTI_MEDIA_MANAGER | - | useMarketingMedia, useUmami | auth/index.ts<br>dashboard/index.ts |
| `/marketing/media/upload` | page | (admin) | - | - | - | dashboard/index.ts<br>ui/card.tsx |
| `/marketing/promotions` | page | (admin) | - | - | useMarketingPromotions | dashboard/index.ts |
| `/marketing/settings/notifications` | page | (admin) | - | - | - | settings/notifications-form.tsx |
| `/marketing/settings` | page | (admin) | - | - | - | dashboard/index.ts |
| `/marketing/settings/profile` | page | (admin) | - | - | - | settings/profile-form.tsx |
| `/marketing/settings/security` | page | (admin) | - | - | - | settings/security-form.tsx |
| `/ops/agreements` | page | (admin) | - | - | useAcceptAgreement, useCreateVendorAgreement, useDeclineAgreement, useDeleteVendorAgreement, useOpsActiveEvents, useOpsAgreements, useOpsVendors, useSendAgreement | dashboard/index.ts<br>ui/button.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/select.tsx |
| `/ops/claims` | page | (admin) | - | - | useAdminClaimCounts, useAdminClaims, useApproveClaim, useRejectClaim | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/dialog.tsx<br>ui/label.tsx<br>ui/tabs.tsx<br>ui/textarea.tsx |
| `/ops/dashboard` | page | (admin) | ROLES.OPERATIONAL_ADMIN<br>ROLES.OPERATIONAL_MANAGER<br>ROLES.OPERATIONAL_ASSISTANT | - | useAuthStore | - |
| `/ops/disputes/[disputeId]` | page | (admin) | - | - | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/disputes` | page | (admin) | - | - | useAuthStore, useInvestigateDispute, useOpsDisputes, useResolveDispute, useUmami | dashboard/index.ts<br>ui/button.tsx<br>ui/dialog.tsx<br>ui/textarea.tsx |
| `/ops/events/[eventId]/agreements` | page | (admin) | - | - | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/events/[eventId]/invoices` | page | (admin) | - | vendorAgreementId | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/events/[eventId]/overview` | page | (admin) | - | - | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/events/[eventId]` | page | (admin) | - | - | useAssignManager, useDeleteActiveEvent, useOpsActiveEvent, useOpsAgreements, useOpsAllInvoices, useOpsManagers, useOpsOperationalTasks, useOpsQuotations, useOpsRequirements, useSendRequirementToClient, useUpdateActiveEvent, useUpdateActiveEventStatus | dashboard/index.ts<br>features/ops/ops-agreements-list.tsx<br>features/ops/ops-invoices-list.tsx<br>features/ops/ops-requirements-panel.tsx<br>features/ops/ops-tasks-list.tsx<br>features/ops/quotation-preview-dialog.tsx<br>features/ops/quotation-template.tsx<br>ui/alert-dialog.tsx<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/dropdown-menu.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/select.tsx<br>ui/skeleton.tsx<br>ui/tabs.tsx |
| `/ops/events/[eventId]/requirements` | page | (admin) | - | - | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/events/[eventId]/tasks` | page | (admin) | - | - | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/events/new` | page | (admin) | - | - | - | dashboard/index.ts<br>forms/ops/index.ts |
| `/ops/events` | page | (admin) | - | - | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/invoices/[id]` | page | (admin) | - | - | useMarkInvoicePaid, useQuery | dashboard/index.ts<br>features/ops/quotation-preview-dialog.tsx<br>features/ops/quotation-template.tsx<br>ui/alert-dialog.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/skeleton.tsx |
| `/ops/invoices` | page | (admin) | - | - | useDeleteInvoice, useMarkInvoicePaid, useOpsAllInvoices, useUmami | dashboard/index.ts<br>features/ops/quotation-preview-dialog.tsx<br>features/ops/quotation-template.tsx<br>ui/button.tsx<br>ui/dialog.tsx |
| `/ops/kyc/[kycId]` | page | (admin) | - | - | - | features/ops/index.ts |
| `/ops/kyc` | page | (admin) | - | - | useApproveKyc, useAuthStore, useOpsKycList, useOpsKycRealtime, useRejectKyc, useStartKycReview, useUmami | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/textarea.tsx |
| `/ops` | layout | (admin) | `<RoleGuard allowedRoles={ROLE_GROUPS.OPS} redirectOnFail={true}>`<br>ROLE_GROUPS.OPS | - | - | auth/index.ts |
| `/ops/leads/[leadId]` | page | (admin) | - | - | useAuthStore, useLeadConversion, useOpsLeadDetail, useOpsManagers | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/select.tsx<br>ui/separator.tsx |
| `/ops/leads` | page | (admin) | - | - | useAuthStore, useLeadConversion, useOpsLeads, useOpsManagers, useUmami | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/select.tsx |
| `/ops/manual-document` | page | (admin) | - | - | useConfirmAction, useUmami | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/select.tsx<br>ui/separator.tsx<br>ui/tabs.tsx<br>ui/textarea.tsx |
| `/ops/quotations` | page | (admin) | - | - | useAcceptQuotation, useConvertQuotationToInvoice, useCreateQuotation, useDeleteQuotation, useOpsActiveEvents, useOpsAgreements, useOpsQuotations, useRejectQuotation, useSendQuotation | dashboard/index.ts<br>features/ops/quotation-preview-dialog.tsx<br>features/ops/quotation-template.tsx<br>ui/button.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/select.tsx<br>ui/textarea.tsx |
| `/ops/reports` | page | (admin) | - | - | useOpsDashboardMetrics | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/progress.tsx |
| `/ops/requirements` | page | (admin) | - | - | useAddRequirementItem, useCreateRequirementSheet, useDeleteRequirementItem, useOpsActiveEvents, useOpsRequirements, useSendRequirementToClient, useUpdateRequirementItem | dashboard/index.ts<br>ui/button.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/select.tsx<br>ui/textarea.tsx |
| `/ops/reviews` | page | (admin) | - | - | useOpsActiveEvents | dashboard/index.ts<br>ui/button.tsx<br>ui/dialog.tsx |
| `/ops/settings/notifications` | page | (admin) | - | - | - | settings/notifications-form.tsx |
| `/ops/settings` | page | (admin) | - | - | - | dashboard/index.ts<br>settings/settings-card.tsx |
| `/ops/settings/profile` | page | (admin) | - | - | - | settings/profile-form.tsx |
| `/ops/settings/security` | page | (admin) | - | - | - | settings/security-form.tsx |
| `/ops/support/[ticketId]` | page | (admin) | - | - | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/support` | page | (admin) | - | - | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/tasks/[taskId]` | page | (admin) | - | - | useDeleteOperationalTask, useOpsOperationalTask, useUpdateOperationalTask, useUpdateTaskStatus | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/select.tsx<br>ui/separator.tsx<br>ui/textarea.tsx |
| `/ops/tasks` | page | (admin) | - | - | useDeleteOperationalTask, useOpsOperationalTasks, useUpdateTaskStatus | dashboard/index.ts |
| `/ops/team/assistants` | page | (admin) | - | - | useOpsAssistants | dashboard/index.ts<br>ui/button.tsx |
| `/ops/team/managers` | page | (admin) | - | - | useOpsManagers | dashboard/index.ts<br>ui/button.tsx |
| `/ops/vendors/[vendorId]` | page | (admin) | - | - | - | dashboard/index.ts<br>features/ops/index.ts |
| `/ops/vendors` | page | (admin) | - | - | useOpsVendors, useUmami | dashboard/index.ts<br>ui/card.tsx |
| `/sales/dashboard` | page | (admin) | - | - | - | dashboard/index.ts |
| `/sales` | layout | (admin) | `<RoleGuard allowedRoles={ROLE_GROUPS.SALES} redirectOnFail={true}>`<br>ROLE_GROUPS.SALES | - | - | auth/index.ts |
| `/sales/settings/notifications` | page | (admin) | - | - | - | settings/notifications-form.tsx |
| `/sales/settings` | page | (admin) | - | - | - | dashboard/index.ts |
| `/sales/settings/profile` | page | (admin) | - | - | - | settings/profile-form.tsx |
| `/sales/settings/security` | page | (admin) | - | - | - | settings/security-form.tsx |
| `/system/audit` | page | (admin) | - | - | useAdminAudit, useUmami | dashboard/index.ts<br>ui/input.tsx |
| `/system/config` | page | (admin) | - | - | useSystemConfig, useUmami, useUpdateSystemConfig | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/input.tsx<br>ui/skeleton.tsx<br>ui/switch.tsx |
| `/system/dashboard` | page | (admin) | - | - | useAdminAudit, useAdminDashboard | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/skeleton.tsx |
| `/system/features` | page | (admin) | - | - | useBulkUpdateFeatureFlags, useFeatureFlags, useUpdateFeatureFlag | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/collapsible.tsx<br>ui/input.tsx<br>ui/skeleton.tsx<br>ui/switch.tsx<br>ui/tabs.tsx |
| `/system/health` | page | (admin) | - | - | useSystemHealth, useUmami | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/skeleton.tsx |
| `/system` | layout | (admin) | `<RoleGuard allowedRoles={ROLE_GROUPS.SYSTEM} redirectOnFail={true}>`<br>ROLE_GROUPS.SYSTEM | - | - | auth/index.ts |
| `/system/roles` | page | (admin) | - | - | useAdminRoles, useCreateRole, useDeleteRole, useUmami | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/input.tsx |
| `/system/users/[userId]` | page | (admin) | - | - | useAdminRoles, useAdminUser, useAssignUserRole, useRevokeAllSessions, useRevokeSession, useUpdateUserStatus, useUserSessions | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/select.tsx<br>ui/separator.tsx<br>ui/skeleton.tsx |
| `/system/users/customers` | page | (admin) | - | - | useAdminUsers | dashboard/index.ts |
| `/system/users` | page | (admin) | - | - | useAdminUsers, useUmami | dashboard/index.ts |
| `/system/users/staff` | page | (admin) | ROLE_GROUPS.STAFF | - | useAdminUsers | dashboard/index.ts |
| `/system/users/vendors` | page | (admin) | - | - | useAdminUsers | dashboard/index.ts |
| `/business/agreements` | page | (business) | - | - | useAcceptAgreement, useBusinessAgreements, useBusinessProfile, useDeclineAgreement | dashboard/index.ts<br>ui/alert-dialog.tsx<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/textarea.tsx |
| `/business/analytics` | page | (business) | - | - | - | - |
| `/business/bookings/calendar` | page | (business) | - | - | - | - |
| `/business/checkout` | page | (business) | - | plan, billing | - | - |
| `/business/dashboard` | page | (business) | - | - | useAdCreditBalance, useAuthStore, useBusinessAgreements, useBusinessAnalyticsSummary, useBusinessLeads, useBusinessProfile, useBusinessReviews, useBusinessTasks, useCampaigns, useVendorSubscription | dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/progress.tsx<br>ui/skeleton.tsx |
| `/business/leads` | page | (business) | - | - | useAcceptLead, useBusinessLeads, useUpdateLeadStatus | common/vendor-feature-gate.tsx<br>dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/separator.tsx |
| `/business/marketing/campaigns/[campaignId]/edit` | page | (business) | - | - | useCampaign, useUpdateCampaign | campaigns/campaign-form.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/skeleton.tsx |
| `/business/marketing/campaigns/[campaignId]` | page | (business) | - | - | useCampaign, useCampaignStats, usePauseCampaign, useResumeCampaign, useStartCampaign, useStopCampaign | common/index.ts<br>dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/skeleton.tsx |
| `/business/marketing/campaigns/new` | page | (business) | - | - | useAdCreditBalance, useCreateCampaign | common/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/calendar.tsx<br>ui/form.tsx<br>ui/input.tsx<br>ui/popover.tsx<br>ui/textarea.tsx |
| `/business/marketing/campaigns` | page | (business) | - | - | useCampaigns, useCancelCampaign, usePauseCampaign, useResumeCampaign, useStopCampaign | common/index.ts<br>dashboard/index.ts<br>ui/button.tsx |
| `/business/marketing/credits` | page | (business) | - | - | useAdCreditBalance, useAdCreditHistory, useClaimMonthlyCredits, useSpendingSummary, useVendorSubscription | credits/purchase-credits-modal.tsx<br>dashboard/index.ts<br>ui/button.tsx<br>ui/skeleton.tsx |
| `/business/messages` | page | (business) | - | - | - | dashboard/index.ts<br>features/messaging/messaging-workspace.tsx |
| `/business/payment/failed` | page | (business) | - | error, orderId | - | ui/button.tsx<br>ui/card.tsx |
| `/business/payment/success` | page | (business) | - | paymentId, subscriptionId, credits | - | ui/button.tsx<br>ui/card.tsx |
| `/business/portfolio` | page | (business) | - | - | useAddMediaTags, useBusinessPortfolio, useBusinessProfile, useCreatePortfolioItem, useDeletePortfolioItem, useDeletePortfolioMediaItem, useMediaItemTags, useRemoveMediaTag, useUpdatePortfolioItem, useUpdatePortfolioMediaItem, useUploadMultiplePortfolioImages, useUploadPortfolioImage | common/image-cropper-dialog.tsx<br>dashboard/index.ts<br>ui/alert-dialog.tsx<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/dropdown-menu.tsx<br>ui/file-upload.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/progress.tsx<br>ui/select.tsx<br>ui/switch.tsx<br>ui/tabs.tsx<br>ui/textarea.tsx |
| `/business/profile` | page | (business) | - | - | useBusinessProfile, useCategories, useCities, useCreateBusinessProfile, useDeleteProfileBanner, useDeleteProfilePhoto, useGenerateSlug, useSubmitForVerification, useUpdateBusinessProfile, useUploadProfileBanner, useUploadProfilePhoto | common/image-cropper-dialog.tsx<br>common/index.ts<br>dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/dialog.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/select.tsx<br>ui/separator.tsx |
| `/business/reviews` | page | (business) | - | - | useBusinessProfile, useBusinessReviews, useRespondToReview | dashboard/index.ts<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/label.tsx<br>ui/textarea.tsx |
| `/business/services` | page | (business) | - | - | useBusinessProfile, useBusinessServices, useCreateService, useDeleteService, useSyncServiceItems, useUpdateService | dashboard/index.ts<br>features/services/service-items-form.tsx<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/dropdown-menu.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/switch.tsx<br>ui/textarea.tsx |
| `/business/settings/billing` | page | (business) | - | - | useAdCreditBalance, useAddBusinessPaymentMethod, useBusinessInvoices, useBusinessPaymentDetail, useBusinessPaymentHistory, useBusinessPaymentMethods, useDownloadBusinessInvoice, useRemoveBusinessPaymentMethod, useSetDefaultBusinessPaymentMethod | dashboard/index.ts<br>payment/index.ts<br>payment/refund-history.tsx<br>payment/refund-request-modal.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/skeleton.tsx<br>ui/table.tsx |
| `/business/settings/notifications` | page | (business) | - | - | - | settings/notifications-form.tsx |
| `/business/settings` | page | (business) | - | - | useUmami | dashboard/index.ts<br>settings/settings-card.tsx |
| `/business/settings/profile` | page | (business) | - | - | - | settings/profile-form.tsx |
| `/business/settings/security` | page | (business) | - | - | - | settings/security-form.tsx |
| `/business/settings/subscription` | page | (business) | - | - | useAdCreditBalance, useBusinessPaymentHistory, useUmami, useVendorCancelSubscription, useVendorDowngradePlan, useVendorPauseSubscription, useVendorPlans, useVendorReactivateSubscription, useVendorResumeSubscription, useVendorSubscription, useVendorUpgradePlan, useVendorUsage | dashboard/index.ts<br>subscription/cancel-modal.tsx<br>subscription/downgrade-modal.tsx<br>subscription/pause-subscription.tsx<br>subscription/upgrade-modal.tsx<br>ui/alert.tsx<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/progress.tsx<br>ui/separator.tsx<br>ui/skeleton.tsx |
| `/business/tasks` | page | (business) | - | - | useBusinessProfile, useBusinessTasks, useSubmitTaskProof, useUpdateTaskStatus | common/vendor-feature-gate.tsx<br>dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/dialog.tsx<br>ui/file-upload.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/textarea.tsx |
| `/business/verification` | page | (business) | - | - | useBusinessKyc, useCreateOrUpdateKyc, useDeleteKycDocument, useDropzone, useKycDocumentTypes, useKycDocuments, useSubmitKyc, useUploadKycDocument | common/index.ts<br>dashboard/index.ts<br>ui/badge.tsx<br>ui/button.tsx<br>ui/card.tsx<br>ui/input.tsx<br>ui/label.tsx<br>ui/progress.tsx<br>ui/select.tsx<br>ui/separator.tsx |
| `/business/wishlists/[boardId]` | page | (business) | - | - | - | - |
| `/business/wishlists` | page | (business) | - | - | - | - |
| `/` | layout | (business) | `<AuthGuard>`<br>`<RoleGuard allowedRoles={[ROLES.BUSINESS_ADMIN]} redirectOnFail={true}>`<br>`<OnboardingGuard>`<br>ROLES.BUSINESS_ADMIN | - | - | auth/index.ts<br>business/onboarding/index.ts<br>layouts/dashboard/index.ts |
