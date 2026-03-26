// ============================================================================
// PAYMENT CONTROLLER - User API Gateway
// ============================================================================
// Authenticated endpoints for user payments via Razorpay
// Includes idempotency support and robust error handling
// ============================================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { RazorpayService } from '../../../domain/subscription/services/razorpay.service';
import { BillingService } from '../../../domain/subscription/services/billing.service';
import { UserSubscriptionService } from '../../../domain/subscription/services/user-subscription.service';
import { EventCreditService } from '../../../domain/subscription/services/event-credit.service';
import {
  CreateOrderDto,
  VerifyPaymentDto,
  CreateOrderResponseDto,
  PaymentVerificationResponseDto,
  PaymentPurpose,
} from '../../../domain/subscription/dto/razorpay.dto';
import {
  PaymentSignatureInvalidException,
  SubscriptionActivationFailedException,
} from '../../../domain/subscription/exceptions/payment.exceptions';

@Controller('payments')
@ApiTags('User Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly billingService: BillingService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly eventCreditService: EventCreditService,
  ) {}

  /**
   * Create a Razorpay order for payment
   * Supports idempotency via optional idempotencyKey in request body
   */
  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Razorpay order for payment' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: CreateOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order request',
  })
  @ApiResponse({
    status: 409,
    description: 'Order already exists (duplicate request)',
  })
  @ApiResponse({
    status: 500,
    description: 'Payment gateway error',
  })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CreateOrderResponseDto> {
    this.logger.log(
      `Creating order for user ${user.id}: amount=${dto.amount}, purpose=${dto.purpose}${dto.idempotencyKey ? `, idempotencyKey=${dto.idempotencyKey}` : ''}`,
    );

    const result = await this.razorpayService.createOrder(
      dto,
      user.id,
      undefined,
      dto.idempotencyKey,
    );

    if (result.isExisting) {
      this.logger.log(
        `Returning existing order ${result.orderId} for idempotency key`,
      );
    }

    return result;
  }

  /**
   * Verify payment after Razorpay checkout
   * Includes idempotency check - returns existing payment if already processed
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment after Razorpay checkout' })
  @ApiResponse({
    status: 200,
    description: 'Payment verification result',
    type: PaymentVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment data or signature',
  })
  @ApiResponse({
    status: 402,
    description: 'Payment required (capture failed)',
  })
  @ApiResponse({
    status: 409,
    description: 'Payment already processed',
  })
  async verifyPayment(
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<PaymentVerificationResponseDto> {
    this.logger.log(
      `Verifying payment for user ${user.id}: orderId=${dto.razorpay_order_id}, paymentId=${dto.razorpay_payment_id}`,
    );

    // Check if payment has already been processed (idempotency check)
    const existingPayment = await this.billingService.findProcessedPayment(
      dto.razorpay_payment_id,
    );

    if (existingPayment) {
      this.logger.log(
        `Payment ${dto.razorpay_payment_id} already processed, returning existing result`,
      );

      // Return existing payment details
      const existingSubscription = await this.userSubscriptionService.findActiveByUserId(
        user.id,
      );

      return {
        success: true,
        paymentId: dto.razorpay_payment_id,
        subscriptionId: existingSubscription?.id,
        message: 'Payment already processed',
        isExisting: true,
      };
    }

    // Verify signature
    const isValid = this.razorpayService.verifyPaymentSignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );

    if (!isValid) {
      this.logger.warn(
        `Invalid payment signature for order ${dto.razorpay_order_id}`,
      );
      throw new PaymentSignatureInvalidException(dto.razorpay_order_id);
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await this.razorpayService.fetchPayment(
      dto.razorpay_payment_id,
    );
    const orderDetails = await this.razorpayService.fetchOrder(
      dto.razorpay_order_id,
    );

    // Record payment in database with idempotency
    const { payment, isExisting } = await this.billingService.recordPayment({
      userId: user.id,
      amount: paymentDetails.amount / 100, // Convert paise to rupees
      currency: paymentDetails.currency,
      gatewayPaymentId: dto.razorpay_payment_id,
      gatewayOrderId: dto.razorpay_order_id,
      status: paymentDetails.status === 'captured' ? 'SUCCEEDED' : 'PENDING',
      method: paymentDetails.method,
      metadata: orderDetails.notes,
    });

    // If payment was already recorded, check subscription status
    if (isExisting) {
      this.logger.log(
        `Payment ${dto.razorpay_payment_id} was already recorded, checking downstream status`,
      );

      const existingSubscription = await this.userSubscriptionService.findActiveByUserId(
        user.id,
      );

      return {
        success: true,
        paymentId: dto.razorpay_payment_id,
        subscriptionId: existingSubscription?.id,
        message: 'Payment already recorded',
        isExisting: true,
      };
    }

    // Handle subscription activation if this was a subscription payment
    if (
      dto.planId &&
      orderDetails.notes?.purpose === PaymentPurpose.SUBSCRIPTION
    ) {
      try {
        const subscription =
          await this.userSubscriptionService.activateAfterPayment(
            user.id,
            dto.planId,
            payment.id,
          );

        this.logger.log(
          `Subscription ${subscription.id} activated for user ${user.id}`,
        );

        return {
          success: true,
          paymentId: dto.razorpay_payment_id,
          subscriptionId: subscription.id,
          message: 'Subscription activated successfully',
        };
      } catch (error) {
        this.logger.error(
          `Failed to activate subscription for user ${user.id}: ${error.message}`,
          error.stack,
        );
        throw new SubscriptionActivationFailedException(
          dto.razorpay_payment_id,
          error.message,
        );
      }
    }

    // Handle event credit purchase
    if (
      dto.productId &&
      orderDetails.notes?.purpose === PaymentPurpose.EVENT_CREDITS
    ) {
      try {
        const transaction = await this.eventCreditService.purchaseCredits(
          user.id,
          dto.productId,
          payment.id,
          dto.razorpay_payment_id,
        );

        this.logger.log(
          `Event credits purchased for user ${user.id}: ${transaction.amount} credits`,
        );

        return {
          success: true,
          paymentId: dto.razorpay_payment_id,
          creditsGranted: transaction.amount,
          message: `${transaction.amount} event credits added to your account`,
        };
      } catch (error) {
        this.logger.error(
          `Failed to add event credits for user ${user.id}: ${error.message}`,
          error.stack,
        );
        // Don't throw here - payment was successful, just log the error
        // Credits can be manually added later
        return {
          success: true,
          paymentId: dto.razorpay_payment_id,
          message: 'Payment successful. Credits will be added shortly.',
        };
      }
    }

    return {
      success: true,
      paymentId: dto.razorpay_payment_id,
      message: 'Payment verified successfully',
    };
  }

  /**
   * Get payment history
   */
  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of payments to retrieve (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
  })
  async getPaymentHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const parsedLimit = limit ? Math.min(Math.max(1, Number(limit)), 100) : 20;
    const parsedOffset = offset ? Math.max(0, Number(offset)) : 0;

    return this.billingService.getPaymentHistoryByUser(
      user.id,
      parsedLimit,
      parsedOffset,
    );
  }

  /**
   * Get payment details by ID
   */
  @Get(':paymentId')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({
    status: 200,
    description: 'Payment details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async getPayment(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.billingService.getPaymentById(paymentId, user.id);
  }
}
