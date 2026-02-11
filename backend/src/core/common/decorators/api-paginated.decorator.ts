// ============================================================================
// API PAGINATED DECORATOR - Swagger Paginated Response Documentation
// ============================================================================
// Decorator for documenting paginated API responses in Swagger
// ============================================================================

import { applyDecorators, Type } from '@nestjs/common'
import { ApiOkResponse, ApiQuery, getSchemaPath } from '@nestjs/swagger'

export interface PaginatedResponseSchema {
  data: any[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function ApiPaginatedResponse<T extends Type<any>>(model: T) {
  return applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' }),
    ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' }),
    ApiOkResponse({
      description: 'Paginated response',
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number', example: 100 },
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 20 },
                  totalPages: { type: 'number', example: 5 },
                  hasNextPage: { type: 'boolean', example: true },
                  hasPreviousPage: { type: 'boolean', example: false },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        ],
      },
    }),
  )
}

export function ApiCursorPaginatedResponse<T extends Type<any>>(model: T) {
  return applyDecorators(
    ApiQuery({ name: 'cursor', required: false, type: String, description: 'Cursor for pagination' }),
    ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of items to fetch' }),
    ApiOkResponse({
      description: 'Cursor paginated response',
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  nextCursor: { type: 'string', nullable: true },
                  hasMore: { type: 'boolean', example: true },
                  count: { type: 'number', example: 20 },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        ],
      },
    }),
  )
}
