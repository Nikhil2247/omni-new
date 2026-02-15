import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

async function emptyDatabase() {
  console.log('🧹 Emptying database...')

  await prisma.payment.deleteMany()
  await prisma.invoiceLineItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.usageRecord.deleteMany()
  await prisma.paymentMethod.deleteMany()
  await prisma.subscriptionStatusHistory.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.planPrice.deleteMany()
  await prisma.planFeature.deleteMany()
  await prisma.subscriptionPlan.deleteMany()

  await prisma.blogPostTag.deleteMany()
  await prisma.blogPost.deleteMany()
  await prisma.blogTag.deleteMany()
  await prisma.blogCategory.deleteMany()

  await prisma.taskAttachment.deleteMany()
  await prisma.operationalTask.deleteMany()
  await prisma.provisionalInvoice.deleteMany()
  await prisma.vendorAgreement.deleteMany()
  await prisma.requirementItem.deleteMany()
  await prisma.requirementSheet.deleteMany()
  await prisma.eventNote.deleteMany()
  await prisma.activeEvent.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.dispute.deleteMany()
  await prisma.kYCDocument.deleteMany()
  await prisma.vendorKYC.deleteMany()

  await prisma.whatsAppMessage.deleteMany()
  await prisma.whatsAppTemplate.deleteMany()
  await prisma.weddingPartner.deleteMany()
  await prisma.weddingIdentity.deleteMany()
  await prisma.vibeQuizSelection.deleteMany()
  await prisma.vibeQuizResult.deleteMany()
  await prisma.vibeQuizImage.deleteMany()
  await prisma.guestUpload.deleteMany()
  await prisma.eventMemory.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.timeline.deleteMany()
  await prisma.budgetItem.deleteMany()
  await prisma.budget.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.guestlist.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.checklist.deleteMany()
  await prisma.eventVendor.deleteMany()
  await prisma.event.deleteMany()
  await prisma.checklistTemplate.deleteMany()
  await prisma.eventType.deleteMany()

  await prisma.messageAttachment.deleteMany()
  await prisma.messageReaction.deleteMany()
  await prisma.messageReceipt.deleteMany()
  await prisma.messageDeletion.deleteMany()
  await prisma.conversationParticipant.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.leadStatusHistory.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.vendorFollow.deleteMany()

  await prisma.vendorBadge.deleteMany()
  await prisma.vendorBadgeDefinition.deleteMany()
  await prisma.reviewMedia.deleteMany()
  await prisma.vendorReview.deleteMany()
  await prisma.pricingTier.deleteMany()
  await prisma.service.deleteMany()
  await prisma.mediaItem.deleteMany()
  await prisma.portfolio.deleteMany()
  await prisma.serviceArea.deleteMany()
  await prisma.vendorTag.deleteMany()
  await prisma.businessHour.deleteMany()
  await prisma.vendorProfile.deleteMany()
  await prisma.serviceType.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.category.deleteMany()

  await prisma.vendorMetrics.deleteMany()
  await prisma.userEngagement.deleteMany()
  await prisma.searchQuery.deleteMany()
  await prisma.profileView.deleteMany()
  await prisma.platformMetrics.deleteMany()

  await prisma.notification.deleteMany()
  await prisma.loginActivity.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.userSession.deleteMany()
  await prisma.userRoleAssignment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()

  await prisma.address.deleteMany()
  await prisma.city.deleteMany()
  await prisma.state.deleteMany()
  await prisma.country.deleteMany()

  await prisma.featureFlag.deleteMany()
  await prisma.systemConfig.deleteMany()

  console.log('✅ Database is now empty')
}

emptyDatabase()
  .catch((error) => {
    console.error('❌ Empty database failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
