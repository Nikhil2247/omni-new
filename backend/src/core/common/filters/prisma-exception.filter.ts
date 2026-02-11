// ============================================================================
// PRISMA EXCEPTION FILTER - Prisma 7
// ============================================================================
// Catches Prisma client errors and converts them to appropriate HTTP responses
// ============================================================================

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { Prisma } from '@prisma/client'

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name)

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest()

    this.logger.error(
      `Prisma Error [${exception.code}]: ${exception.message}`,
      exception.stack,
    )

    const errorResponse = this.mapPrismaError(exception)

    response.status(errorResponse.statusCode).json({
      statusCode: errorResponse.statusCode,
      message: errorResponse.message,
      error: errorResponse.error,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number
    message: string
    error: string
  } {
    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target as string[] | undefined
        const field = target?.join(', ') || 'field'
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${field} already exists`,
          error: 'Conflict',
        }
      }

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'The requested record was not found',
          error: 'Not Found',
        }

      case 'P2003': {
        const field = exception.meta?.field_name as string | undefined
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid reference: ${field || 'related record'} does not exist`,
          error: 'Bad Request',
        }
      }

      case 'P2011': {
        const constraint = exception.meta?.constraint as string | undefined
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Required field missing: ${constraint || 'unknown'}`,
          error: 'Bad Request',
        }
      }

      case 'P2006':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid data provided for one or more fields',
          error: 'Bad Request',
        }

      case 'P2001':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record to update does not exist',
          error: 'Not Found',
        }

      case 'P2016':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record to delete does not exist',
          error: 'Not Found',
        }

      case 'P2024':
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database connection timeout. Please try again later.',
          error: 'Service Unavailable',
        }

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected database error occurred',
          error: 'Internal Server Error',
        }
    }
  }
}

@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaValidationExceptionFilter.name)

  catch(exception: Prisma.PrismaClientValidationError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest()

    this.logger.error(`Prisma Validation Error: ${exception.message}`, exception.stack)

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid data provided',
      error: 'Validation Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}

@Catch(Prisma.PrismaClientInitializationError)
export class PrismaInitializationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaInitializationExceptionFilter.name)

  catch(exception: Prisma.PrismaClientInitializationError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest()

    this.logger.error(
      `Prisma Initialization Error: ${exception.message}`,
      exception.stack,
    )

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Database connection error. Please try again later.',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
