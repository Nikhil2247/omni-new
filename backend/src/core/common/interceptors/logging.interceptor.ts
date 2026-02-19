// ============================================================================
// LOGGING INTERCEPTOR - Request/Response Logging
// ============================================================================
// Logs incoming requests and outgoing responses with timing and PII masking
// ============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

// Fields to mask in logs for privacy
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'refreshToken',
  'accessToken',
  'token',
  'apiKey',
  'secret',
  'phone',
  'phoneNumber',
  'ssn',
  'creditCard',
  'cardNumber',
];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const requestId = headers['x-request-id'] || this.generateRequestId();

    const startTime = Date.now();

    // Log incoming request
    const maskedBody = this.maskSensitiveData(request.body);
    this.logger.log(
      `[${requestId}] --> ${method} ${url} | IP: ${ip} | UA: ${userAgent.substring(0, 50)}`,
    );

    if (
      maskedBody &&
      typeof maskedBody === 'object' &&
      Object.keys(maskedBody).length > 0
    ) {
      this.logger.debug(`[${requestId}] Body: ${JSON.stringify(maskedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            `[${requestId}] <-- ${method} ${url} ${statusCode} | ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || error.statusCode || 500;

          this.logger.error(
            `[${requestId}] <-- ${method} ${url} ${statusCode} | ${duration}ms | ${error.message}`,
          );
        },
      }),
    );
  }

  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item));
    }

    const masked: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (
        SENSITIVE_FIELDS.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        masked[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
