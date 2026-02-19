// ============================================================================
// CATEGORY LOOKUP SERVICE - Cached Category Data
// ============================================================================
// Provides fast lookup for vendor categories with in-memory caching
// ============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service';
import { CATEGORY_EVENTS } from '../events/event-constants';

export interface CategoryLookup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  iconUrl?: string;
  displayOrder: number;
}

export interface CategoryTree extends CategoryLookup {
  children: CategoryTree[];
}

@Injectable()
export class CategoryLookupService implements OnModuleInit {
  private readonly logger = new Logger(CategoryLookupService.name);

  private categories: Map<string, CategoryLookup> = new Map();
  private categoriesBySlug: Map<string, CategoryLookup> = new Map();
  private categoriesByParent: Map<string | null, CategoryLookup[]> = new Map();
  private categoryTree: CategoryTree[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadAllData();
  }

  private async loadAllData(): Promise<void> {
    this.logger.log('Loading category lookup data...');

    try {
      const categoryRecords = await this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      this.categories.clear();
      this.categoriesBySlug.clear();
      this.categoriesByParent.clear();

      for (const category of categoryRecords) {
        const lookup: CategoryLookup = {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description || undefined,
          parentId: category.parentId || undefined,
          iconUrl: category.icon || undefined,
          displayOrder: category.sortOrder,
        };

        this.categories.set(category.id, lookup);
        this.categoriesBySlug.set(category.slug, lookup);

        // Group by parent
        const parentKey = category.parentId || null;
        const parentChildren = this.categoriesByParent.get(parentKey) || [];
        parentChildren.push(lookup);
        this.categoriesByParent.set(parentKey, parentChildren);
      }

      // Build tree
      this.categoryTree = this.buildTree(null);

      this.logger.log(`Loaded ${this.categories.size} categories`);
    } catch (error) {
      this.logger.error('Failed to load category lookup data', error);
    }
  }

  private buildTree(parentId: string | null): CategoryTree[] {
    const children = this.categoriesByParent.get(parentId) || [];
    return children.map((category) => ({
      ...category,
      children: this.buildTree(category.id),
    }));
  }

  // Event handlers for cache invalidation
  @OnEvent(CATEGORY_EVENTS.CREATED)
  @OnEvent(CATEGORY_EVENTS.UPDATED)
  @OnEvent(CATEGORY_EVENTS.DELETED)
  async handleCategoryChange() {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    await this.loadAllData();
  }

  // Lookups
  getAllCategories(): CategoryLookup[] {
    return Array.from(this.categories.values());
  }

  getCategoryById(id: string): CategoryLookup | undefined {
    return this.categories.get(id);
  }

  getCategoryBySlug(slug: string): CategoryLookup | undefined {
    return this.categoriesBySlug.get(slug);
  }

  getParentCategories(): CategoryLookup[] {
    return this.categoriesByParent.get(null) || [];
  }

  getChildCategories(parentId: string): CategoryLookup[] {
    return this.categoriesByParent.get(parentId) || [];
  }

  getCategoryTree(): CategoryTree[] {
    return this.categoryTree;
  }

  // Get full category path (for breadcrumbs)
  getCategoryPath(categoryId: string): CategoryLookup[] {
    const path: CategoryLookup[] = [];
    let current = this.categories.get(categoryId);

    while (current) {
      path.unshift(current);
      current = current.parentId
        ? this.categories.get(current.parentId)
        : undefined;
    }

    return path;
  }

  // Get all descendants of a category (for filtering)
  getCategoryDescendants(categoryId: string): string[] {
    const descendants: string[] = [categoryId];
    const children = this.categoriesByParent.get(categoryId) || [];

    for (const child of children) {
      descendants.push(...this.getCategoryDescendants(child.id));
    }

    return descendants;
  }

  // Validation
  isValidCategory(id: string): boolean {
    return this.categories.has(id);
  }

  isValidCategorySlug(slug: string): boolean {
    return this.categoriesBySlug.has(slug);
  }
}
