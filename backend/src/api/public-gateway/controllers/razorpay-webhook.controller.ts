// ============================================================================
// RAZORPAY WEBHOOK CONTROLLER - Public Gateway
// ============================================================================
// Handles incoming Razorpay webhook events for payment processing
// ============================================================================

import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { RazorpayService } from '../../../domain/subscription/services/razorpay.service';
import { BillingService } from '../../../domain/subscription/services/billing.service';
import { SubscriptionService } from '../../../domain/subscription/services/subscription.service';
import { UserSubscriptionService } from '../../../domain/subscription/services/user-subscription.service';
import { AdCreditService } from '../../../domain/subscription/services/ad-credit.service';
import { RazorpayWebhookPayload } from '../../../domain/subscription/dto/razorpay.dto';
import { CreditTransactionType } from '@prisma/client';

@ApiTags('Webhooks')
@Controller('webhooks')
@Public()
export class RazorpayWebhookController {
  private readonly logger = new Logger(RazorpayWebhookController.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly billingService: BillingService,
    private readonly subscriptionService: SubscriptionService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly adCreditService: AdCreditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('razorpay')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Handle Razorpay webhook events' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: RazorpayWebhookPayload,
  ) {
    this.logger.log(`Received Razorpay webhook: ${payload.event}`);

    // Verify webhook signature
    const rawBody = req.rawBody?.toString() || JSON.stringify(payload);
    const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      return { status: 'error', message: 'Invalid signature' };
    }

    try {
      switch (payload.event) {
        case 'payment.authorized':
          await this.handlePaymentAuthorized(payload);
          break;

        case 'payment.captured':
          await this.handlePaymentCaptured(payload);
          break;

        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;

        case 'refund.created':
          await this.handleRefundCreated(payload);
          break;

        case 'refund.processed':
          await this.handleRefundProcessed(payload);
          break;

        case 'subscription.activated':
          await this.handleSubscriptionActivated(payload);
          break;

        case 'subscription.charged':
          await this.handleSubscriptionCharged(payload);
          break;

        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(payload);
          break;

        case 'subscription.paused':
          await this.handleSubscriptionPaused(payload);
          break;

        case 'subscription.resumed':
          await this.handleSubscriptionResumed(payload);
          break;

        default:
          this.logger.log(`Unhandled webhook event: ${payload.event}`);
      }

      return { status: 'ok', event: payload.event };
    } catch (error) {
      this.logger.error(
        `Error processing webhook ${payload.event}: ${error.message}`,
        error.stack,
      );
      return { status: 'error', message: error.message };
    }
  }

  // ============================================================================
  // Payment Event Handlers
  // ============================================================================

  private async handlePaymentAuthorized(payload: RazorpayWebhookPayload) {
    const payment = payload.payload.payment?.entity;
    if (!payment) return;

    this.logger.log(`Payment authorized: ${payment.id}`);

    // Auto-capture the payment (or you can do manual capture based on business logic)
    try {
      await this.razorpayService.capturePayment(
        payment.id,
        payment.amount,
        payment.currency,
      );
    } catch (error) {
      this.logger.error(`Failed to capture payment ${payment.id}: ${error.message}`);
    }
  }

  private async handlePaymentCaptured(payload: RazorpayWebhookPayload) {
    const payment = payload.payload.payment?.entity;
    if (!payment) return;

    this.logger.log(`Payment captured: ${payment.id}`);

    // Update payment status in database
    await this.billingService.updatePaymentStatus(payment.id, 'SUCCEEDED', {
      capturedAt: new Date(),
      method: payment.method,
    });

    // Emit success event
    this.eventEmitter.emit('payment.succeeded', {
      paymentId: payment.id,
      orderId: payment.order_id,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency,
      notes: payment.notes,
    });

    // Process based on payment purpose
    const purpose = payment.notes?.purpose;
    const userId = payment.notes?.userId;
    const vendorProfileId = payment.notes?.vendorProfileId;

    if (purpose === 'SUBSCRIPTION' && payment.notes?.planId) {
      if (vendorProfileId) {
        // Vendor subscription
        await this.subscriptionService.activateAfterPayment(
          vendorProfileId,
          payment.notes.planId,
          payment.id,
        );
      } else if (userId) {
        // User subscription
        await this.userSubscriptionService.activateAfterPayment(
          userId,
          payment.notes.planId,
          payment.id,
        );
      }
    }

    if (purpose === 'AD_CREDITS' && vendorProfileId && payment.notes?.credits) {
      await this.adCreditService.grantCredits(
        vendorProfileId,
        parseInt(payment.notes.credits, 10),
        CreditTransactionType.PURCHASE,
        payment.id,
        `Credit purchase via webhook - Payment: ${payment.id}`,
      );
    }
  }

  private async handlePaymentFailed(payload: RazorpayWebhookPayload) {
    const payment = payload.payload.payment?.entity;
    if (!payment) return;

    this.logger.warn(
      `Payment failed: ${payment.id} - ${payment.error_description}`,
    );

    // Update payment status in database
    await this.billingService.updatePaymentStatus(payment.id, 'FAILED', {
      errorCode: payment.error_code,
      errorDescription: payment.error_description,
    });

    // Emit failure event
    this.eventEmitter.emit('payment.failed', {
      paymentId: payment.id,
      orderId: payment.order_id,
      errorCode: payment.error_code,
      errorDescription: payment.error_description,
      notes: payment.notes,
    });
  }

  // ============================================================================
  // Refund Event Handlers
  // ============================================================================

  private async handleRefundCreated(payload: RazorpayWebhookPayload) {
    const refund = payload.payload.refund?.entity;
    if (!refund) return;

    this.logger.log(
      `Refund created: ${refund.id} for payment ${refund.payment_id}`,
    );

    await this.billingService.recordRefund(
      refund.payment_id,
      refund.id,
      refund.amount / 100, // Convert from paise to rupees
      'PENDING',
    );
  }

  private async handleRefundProcessed(payload: RazorpayWebhookPayload) {
    const refund = payload.payload.refund?.entity;
    if (!refund) return;

    this.logger.log(`Refund processed: ${refund.id}`);

    await this.billingService.updateRefundStatus(
      refund.id,
      refund.status === 'processed' ? 'COMPLETED' : 'FAILED',
    );

    this.eventEmitter.emit('refund.completed', {
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100,
    });
  }

  // ============================================================================
  // Subscription Event Handlers (for Razorpay Subscriptions API)
  // ============================================================================

  private async handleSubscriptionActivated(payload: RazorpayWebhookPayload) {
    const subscription = payload.payload.subscription?.entity;
    if (!subscription) return;

    this.logger.log(`Subscription activated: ${subscription.id}`);

    // Handle recurring subscription activation if using Razorpay subscriptions
    this.eventEmitter.emit('razorpay.subscription.activated', {
      subscriptionId: subscription.id,
      planId: subscription.plan_id,
      currentStart: subscription.current_start,
      currentEnd: subscription.current_end,
    });
  }

  private async handleSubscriptionCharged(payload: RazorpayWebhookPayload) {
    const subscription = payload.payload.subscription?.entity;
    if (!subscription) return;

    this.logger.log(`Subscription charged: ${subscription.id}`);

    // Handle recurring charge
    this.eventEmitter.emit('razorpay.subscription.charged', {
      subscriptionId: subscription.id,
      currentStart: subscription.current_start,
      currentEnd: subscription.current_end,
    });
  }

  private async handleSubscriptionCancelled(payload: RazorpayWebhookPayload) {
    const subscription = payload.payload.subscription?.entity;
    if (!subscription) return;

    this.logger.log(`Subscription cancelled: ${subscription.id}`);

    this.eventEmitter.emit('razorpay.subscription.cancelled', {
      subscriptionId: subscription.id,
    });
  }

  private async handleSubscriptionPaused(payload: RazorpayWebhookPayload) {
    const subscription = payload.payload.subscription?.entity;
    if (!subscription) return;

    this.logger.log(`Subscription paused: ${subscription.id}`);

    this.eventEmitter.emit('razorpay.subscription.paused', {
      subscriptionId: subscription.id,
    });
  }

  private async handleSubscriptionResumed(payload: RazorpayWebhookPayload) {
    const subscription = payload.payload.subscription?.entity;
    if (!subscription) return;

    this.logger.log(`Subscription resumed: ${subscription.id}`);

    this.eventEmitter.emit('razorpay.subscription.resumed', {
      subscriptionId: subscription.id,
    });
  }
}
