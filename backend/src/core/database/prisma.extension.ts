// ============================================================================
// PRISMA EXTENSION - Prisma 7 Client Extensions
// ============================================================================
// Custom extensions for the Prisma client
// ============================================================================

import { Prisma, PrismaClient } from '@prisma/client'

/**
 * Soft Delete Extension
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  model: {
    $allModels: {
      async softDelete<T>(
        this: T,
        where: Prisma.Args<T, 'update'>['where'],
      ): Promise<Prisma.Result<T, Prisma.Args<T, 'update'>, 'update'>> {
        const context = Prisma.getExtensionContext(this)
        // @ts-expect-error - Dynamic model access
        return context.update({
          where,
          data: { deletedAt: new Date() },
        })
      },

      async restore<T>(
        this: T,
        where: Prisma.Args<T, 'update'>['where'],
      ): Promise<Prisma.Result<T, Prisma.Args<T, 'update'>, 'update'>> {
        const context = Prisma.getExtensionContext(this)
        // @ts-expect-error - Dynamic model access
        return context.update({
          where,
          data: { deletedAt: null },
        })
      },
    },
  },
})

/**
 * Pagination Extension
 */
export const paginationExtension = Prisma.defineExtension({
  name: 'pagination',
  model: {
    $allModels: {
      async paginate<T, A>(
        this: T,
        args: Prisma.Exact<A, Prisma.Args<T, 'findMany'>> & {
          page?: number
          perPage?: number
        },
      ): Promise<{
        data: Prisma.Result<T, A, 'findMany'>
        meta: {
          total: number
          page: number
          perPage: number
          totalPages: number
          hasNextPage: boolean
          hasPrevPage: boolean
        }
      }> {
        const context = Prisma.getExtensionContext(this) as any
        const { page = 1, perPage = 10, ...queryArgs } = args as any

        const skip = (page - 1) * perPage

        const [total, data] = await Promise.all([
          context.count({ where: queryArgs.where }),
          context.findMany({
            ...queryArgs,
            skip,
            take: perPage,
          }),
        ])

        const totalPages = Math.ceil(total / perPage)

        return {
          data,
          meta: {
            total,
            page,
            perPage,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        }
      },
    },
  },
})

/**
 * Create an extended Prisma client
 */
export function createExtendedPrismaClient() {
  const prisma = new PrismaClient()

  return prisma
    .$extends(softDeleteExtension)
    .$extends(paginationExtension)
}

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>
