// ============================================================================
// PAYMENT CONTROLLER - Business API Gateway
// ============================================================================
// Authenticated endpoints for business/vendor payments via Razorpay
// Handles subscription payments and ad credit purchases
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
  ForbiddenException,
  ConflictException,
  BadRequestException,
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
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { RazorpayService } from '../../../domain/subscription/services/razorpay.service';
import { BillingService } from '../../../domain/subscription/services/billing.service';
import { SubscriptionService } from '../../../domain/subscription/services/subscription.service';
import { AdCreditService } from '../../../domain/subscription/services/ad-credit.service';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import {
  CreateOrderDto,
  VerifyPaymentDto,
  CreateOrderResponseDto,
  PaymentVerificationResponseDto,
  PaymentPurpose,
} from '../../../domain/subscription/dto/razorpay.dto';
import { CreditTransactionType } from '@prisma/client';
import {
  PaymentAlreadyProcessedException,
  PaymentSignatureInvalidException,
  SubscriptionActivationFailedException,
  CreditGrantFailedException,
} from '../../../domain/subscription/exceptions/payment.exceptions';

@Controller('payments')
@ApiTags('Business Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class BusinessPaymentController {
  private readonly logger = new Logger(BusinessPaymentController.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly billingService: BillingService,
    private readonly subscriptionService: SubscriptionService,
    private readonly adCreditService: AdCreditService,
    private readonly vendorProfileService: VendorProfileService,
  ) {}

  /**
   * Helper to get and validate vendor profile for current user
   */
  private async getVendorProfileId(userId: string): Promise<string> {
    const profile = await this.vendorProfileService.findByUserId(userId);
    if (!profile) {
      throw new ForbiddenException('Vendor profile required');
    }
    return profile.id;
  }

  /**
   * Create a Razorpay order for business payment
   * Supports idempotency via optional idempotencyKey in request body
   */
  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Razorpay order for business payment' })
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
    status: 403,
    description: 'Vendor profile required',
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
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(
      `Creating order for vendor ${vendorProfileId}: amount=${dto.amount}, purpose=${dto.purpose}${dto.idempotencyKey ? `, idempotencyKey=${dto.idempotencyKey}` : ''}`,
    );

    const result = await this.razorpayService.createOrder(
      dto,
      user.id,
      vendorProfileId,
      dto.idempotencyKey,
    );

    // If this is an existing order (idempotent response), return 200 instead of 201
    // Note: We still return the order details for client convenience
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
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 409,
    description: 'Payment already processed',
  })
  async verifyPayment(
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<PaymentVerificationResponseDto> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(
      `Verifying payment for vendor ${vendorProfileId}: orderId=${dto.razorpay_order_id}, paymentId=${dto.razorpay_payment_id}`,
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
      const existingSubscription = await this.subscriptionService.findActiveByVendorProfile(
        vendorProfileId,
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
    const purpose = orderDetails.notes?.purpose as PaymentPurpose;

    // Record payment in database with idempotency
    const { payment, isExisting } = await this.billingService.recordPayment({
      userId: user.id,
      vendorProfileId,
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

      const existingSubscription = await this.subscriptionService.findActiveByVendorProfile(
        vendorProfileId,
      );

      return {
        success: true,
        paymentId: dto.razorpay_payment_id,
        subscriptionId: existingSubscription?.id,
        message: 'Payment already recorded',
        isExisting: true,
      };
    }

    // Handle based on payment purpose
    if (purpose === PaymentPurpose.SUBSCRIPTION && dto.planId) {
      try {
        const subscription = await this.subscriptionService.activateAfterPayment(
          vendorProfileId,
          dto.planId,
          payment.id,
        );

        this.logger.log(
          `Subscription ${subscription.id} activated for vendor ${vendorProfileId}`,
        );

        return {
          success: true,
          paymentId: dto.razorpay_payment_id,
          subscriptionId: subscription.id,
          message: 'Subscription activated successfully',
        };
      } catch (error) {
        this.logger.error(
          `Failed to activate subscription for vendor ${vendorProfileId}: ${error.message}`,
          error.stack,
        );
        throw new SubscriptionActivationFailedException(
          dto.razorpay_payment_id,
          error.message,
        );
      }
    }

    if (purpose === PaymentPurpose.AD_CREDITS && dto.credits) {
      try {
        await this.adCreditService.grantCredits(
          vendorProfileId,
          dto.credits,
          CreditTransactionType.PURCHASE,
          payment.id,
          `Credit purchase - Payment: ${dto.razorpay_payment_id}`,
        );

        this.logger.log(
          `Granted ${dto.credits} credits to vendor ${vendorProfileId}`,
        );

        return {
          success: true,
          paymentId: dto.razorpay_payment_id,
          creditsGranted: dto.credits,
          message: 'Ad credits added successfully',
        };
      } catch (error) {
        this.logger.error(
          `Failed to grant credits for vendor ${vendorProfileId}: ${error.message}`,
          error.stack,
        );
        throw new CreditGrantFailedException(
          dto.razorpay_payment_id,
          dto.credits,
          error.message,
        );
      }
    }

    return {
      success: true,
      paymentId: dto.razorpay_payment_id,
      message: 'Payment verified successfully',
    };
  }

  /**
   * Get business payment history
   */
  @Get('history')
  @ApiOperation({ summary: 'Get business payment history' })
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
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  async getPaymentHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const parsedLimit = limit ? Math.min(Math.max(1, Number(limit)), 100) : 20;
    const parsedOffset = offset ? Math.max(0, Number(offset)) : 0;

    return this.billingService.getVendorPaymentHistory(
      vendorProfileId,
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
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async getPayment(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    return this.billingService.getVendorPaymentById(paymentId, vendorProfileId);
  }
}
