// ============================================================================
// HTTP EXCEPTION FILTER - Global Exception Handler
// ============================================================================
// Catches all HTTP exceptions and formats consistent error responses
// ============================================================================

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

interface ErrorResponse {
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
  method: string
  requestId?: string
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    // Extract message from exception response
    let message: string | string[]
    let error: string

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse
      error = HttpStatus[status] || 'Error'
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, any>
      message = responseObj.message || exception.message
      error = responseObj.error || HttpStatus[status] || 'Error'
    } else {
      message = exception.message
      error = HttpStatus[status] || 'Error'
    }

    // Get request ID if available
    const requestId = (request.headers['x-request-id'] as string) || undefined

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(requestId && { requestId }),
    }

    // Log error with appropriate level
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status}: ${JSON.stringify(message)}`,
        exception.stack,
      )
    } else if (status >= 400) {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status}: ${JSON.stringify(message)}`,
      )
    }

    response.status(status).json(errorResponse)
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status = HttpStatus.INTERNAL_SERVER_ERROR
    const message = 'An unexpected error occurred'

    // Log the actual error for debugging
    this.logger.error(
      `[${request.method}] ${request.url} - Unhandled Exception`,
      exception instanceof Error ? exception.stack : String(exception),
    )

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    }

    response.status(status).json(errorResponse)
  }
}
