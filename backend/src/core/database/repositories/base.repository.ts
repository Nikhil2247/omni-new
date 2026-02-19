// ============================================================================
// BASE REPOSITORY - Generic Repository Pattern Implementation
// ============================================================================
// Provides common CRUD operations and query patterns for all domain entities
// ============================================================================

import { PrismaService } from '../prisma.service';
import { Logger } from '@nestjs/common';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface FindManyOptions<WhereInput, OrderByInput> {
  where?: WhereInput;
  orderBy?: OrderByInput | OrderByInput[];
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean | object>;
}

export abstract class BaseRepository<
  Entity,
  CreateInput,
  UpdateInput,
  WhereInput,
  WhereUniqueInput,
  OrderByInput,
> {
  protected readonly logger: Logger;
  protected abstract readonly modelName: string;

  constructor(protected readonly prisma: PrismaService) {
    this.logger = new Logger(this.constructor.name);
  }

  protected abstract get model(): {
    findUnique: (args: {
      where: WhereUniqueInput;
      include?: Record<string, boolean | object>;
    }) => Promise<Entity | null>;
    findFirst: (args: {
      where?: WhereInput;
      orderBy?: OrderByInput | OrderByInput[];
      include?: Record<string, boolean | object>;
    }) => Promise<Entity | null>;
    findMany: (args: {
      where?: WhereInput;
      orderBy?: OrderByInput | OrderByInput[];
      skip?: number;
      take?: number;
      include?: Record<string, boolean | object>;
    }) => Promise<Entity[]>;
    create: (args: {
      data: CreateInput;
      include?: Record<string, boolean | object>;
    }) => Promise<Entity>;
    update: (args: {
      where: WhereUniqueInput;
      data: UpdateInput;
      include?: Record<string, boolean | object>;
    }) => Promise<Entity>;
    delete: (args: { where: WhereUniqueInput }) => Promise<Entity>;
    count: (args: { where?: WhereInput }) => Promise<number>;
    updateMany: (args: {
      where: WhereInput;
      data: UpdateInput;
    }) => Promise<{ count: number }>;
    deleteMany: (args: { where: WhereInput }) => Promise<{ count: number }>;
  };

  async findById(
    id: string,
    include?: Record<string, boolean | object>,
  ): Promise<Entity | null> {
    try {
      return await this.model.findUnique({
        where: { id } as WhereUniqueInput,
        include,
      });
    } catch (error) {
      this.logger.error(`Error finding ${this.modelName} by id: ${id}`, error);
      throw error;
    }
  }

  async findByIdOrThrow(
    id: string,
    include?: Record<string, boolean | object>,
  ): Promise<Entity> {
    const entity = await this.findById(id, include);
    if (!entity) {
      throw new Error(`${this.modelName} with id ${id} not found`);
    }
    return entity;
  }

  async findOne(
    where: WhereInput,
    include?: Record<string, boolean | object>,
  ): Promise<Entity | null> {
    try {
      return await this.model.findFirst({
        where,
        include,
      });
    } catch (error) {
      this.logger.error(`Error finding ${this.modelName}`, error);
      throw error;
    }
  }

  async findMany(
    options: FindManyOptions<WhereInput, OrderByInput> = {},
  ): Promise<Entity[]> {
    try {
      return await this.model.findMany({
        where: options.where,
        orderBy: options.orderBy,
        include: options.include,
      });
    } catch (error) {
      this.logger.error(`Error finding many ${this.modelName}`, error);
      throw error;
    }
  }

  async findManyPaginated(
    pagination: PaginationParams,
    options: FindManyOptions<WhereInput, OrderByInput> = {},
  ): Promise<PaginatedResult<Entity>> {
    const { page = 1, limit = 20, sortBy, sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        this.model.findMany({
          where: options.where,
          orderBy: sortBy
            ? ({ [sortBy]: sortOrder } as OrderByInput)
            : options.orderBy,
          skip,
          take: limit,
          include: options.include,
        }),
        this.model.count({ where: options.where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error finding paginated ${this.modelName}`, error);
      throw error;
    }
  }

  async create(
    data: CreateInput,
    include?: Record<string, boolean | object>,
  ): Promise<Entity> {
    try {
      const entity = await this.model.create({
        data,
        include,
      });
      this.logger.debug(`Created ${this.modelName}`);
      return entity;
    } catch (error) {
      this.logger.error(`Error creating ${this.modelName}`, error);
      throw error;
    }
  }

  async createMany(data: CreateInput[]): Promise<Entity[]> {
    try {
      const entities = await Promise.all(
        data.map((item) => this.model.create({ data: item })),
      );
      this.logger.debug(`Created ${entities.length} ${this.modelName} records`);
      return entities;
    } catch (error) {
      this.logger.error(`Error creating multiple ${this.modelName}`, error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateInput,
    include?: Record<string, boolean | object>,
  ): Promise<Entity> {
    try {
      const entity = await this.model.update({
        where: { id } as WhereUniqueInput,
        data,
        include,
      });
      this.logger.debug(`Updated ${this.modelName} with id: ${id}`);
      return entity;
    } catch (error) {
      this.logger.error(
        `Error updating ${this.modelName} with id: ${id}`,
        error,
      );
      throw error;
    }
  }

  async updateMany(where: WhereInput, data: UpdateInput): Promise<number> {
    try {
      const result = await this.model.updateMany({
        where,
        data,
      });
      this.logger.debug(`Updated ${result.count} ${this.modelName} records`);
      return result.count;
    } catch (error) {
      this.logger.error(`Error updating multiple ${this.modelName}`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<Entity> {
    try {
      const entity = await this.model.delete({
        where: { id } as WhereUniqueInput,
      });
      this.logger.debug(`Deleted ${this.modelName} with id: ${id}`);
      return entity;
    } catch (error) {
      this.logger.error(
        `Error deleting ${this.modelName} with id: ${id}`,
        error,
      );
      throw error;
    }
  }

  async deleteMany(where: WhereInput): Promise<number> {
    try {
      const result = await this.model.deleteMany({ where });
      this.logger.debug(`Deleted ${result.count} ${this.modelName} records`);
      return result.count;
    } catch (error) {
      this.logger.error(`Error deleting multiple ${this.modelName}`, error);
      throw error;
    }
  }

  async softDelete(id: string): Promise<Entity> {
    return this.update(id, { deletedAt: new Date() } as UpdateInput);
  }

  async restore(id: string): Promise<Entity> {
    return this.update(id, { deletedAt: null } as UpdateInput);
  }

  async count(where?: WhereInput): Promise<number> {
    try {
      return await this.model.count({ where });
    } catch (error) {
      this.logger.error(`Error counting ${this.modelName}`, error);
      throw error;
    }
  }

  async exists(where: WhereInput): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }

  async upsert(
    where: WhereUniqueInput,
    create: CreateInput,
    update: UpdateInput,
    include?: Record<string, boolean | object>,
  ): Promise<Entity> {
    try {
      const existing = await this.model.findUnique({ where });
      if (existing) {
        return await this.model.update({ where, data: update, include });
      }
      return await this.model.create({ data: create, include });
    } catch (error) {
      this.logger.error(`Error upserting ${this.modelName}`, error);
      throw error;
    }
  }
}
