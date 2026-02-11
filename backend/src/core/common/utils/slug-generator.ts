// ============================================================================
// SLUG GENERATOR - URL-Friendly Slug Generation
// ============================================================================
// Utilities for generating unique, URL-safe slugs
// ============================================================================

import slugify from 'slugify'
import { PrismaService } from '../../database/prisma.service'

export interface SlugOptions {
  lower?: boolean
  strict?: boolean
  replacement?: string
  maxLength?: number
}

export class SlugGenerator {
  private static defaultOptions: SlugOptions = {
    lower: true,
    strict: true,
    replacement: '-',
    maxLength: 100,
  }

  /**
   * Generate a basic slug from text
   */
  static generate(text: string, options: SlugOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options }

    let slug = slugify(text, {
      lower: opts.lower,
      strict: opts.strict,
      replacement: opts.replacement,
    })

    // Enforce max length
    if (opts.maxLength && slug.length > opts.maxLength) {
      slug = slug.slice(0, opts.maxLength)
      // Remove trailing hyphen if present
      if (slug.endsWith('-')) {
        slug = slug.slice(0, -1)
      }
    }

    return slug
  }

  /**
   * Generate a unique slug by checking against existing slugs
   */
  static async generateUnique(
    text: string,
    existingCheck: (slug: string) => Promise<boolean>,
    options: SlugOptions = {},
  ): Promise<string> {
    const baseSlug = this.generate(text, options)

    // Check if base slug is available
    const exists = await existingCheck(baseSlug)
    if (!exists) {
      return baseSlug
    }

    // Try adding numbers until unique
    let counter = 1
    let slug = `${baseSlug}-${counter}`

    while (await existingCheck(slug)) {
      counter++
      slug = `${baseSlug}-${counter}`

      // Safety limit
      if (counter > 1000) {
        // Add random suffix instead
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        slug = `${baseSlug}-${randomSuffix}`
        break
      }
    }

    return slug
  }

  /**
   * Generate unique slug for a Prisma model
   */
  static async generateUniqueForModel(
    prisma: PrismaService,
    modelName: string,
    text: string,
    slugField: string = 'slug',
    options: SlugOptions = {},
  ): Promise<string> {
    const model = (prisma as any)[modelName]
    if (!model) {
      throw new Error(`Model ${modelName} not found`)
    }

    return this.generateUnique(
      text,
      async (slug: string) => {
        const existing = await model.findFirst({
          where: { [slugField]: slug },
          select: { id: true },
        })
        return !!existing
      },
      options,
    )
  }

  /**
   * Generate unique slug for vendor profiles
   */
  static async generateVendorSlug(
    prisma: PrismaService,
    businessName: string,
    excludeId?: string,
  ): Promise<string> {
    return this.generateUnique(
      businessName,
      async (slug: string) => {
        const existing = await prisma.vendorProfile.findFirst({
          where: {
            slug,
            ...(excludeId && { id: { not: excludeId } }),
          },
          select: { id: true },
        })
        return !!existing
      },
      { maxLength: 80 },
    )
  }

  /**
   * Generate unique slug for categories
   */
  static async generateCategorySlug(
    prisma: PrismaService,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    return this.generateUnique(
      name,
      async (slug: string) => {
        const existing = await prisma.category.findFirst({
          where: {
            slug,
            ...(excludeId && { id: { not: excludeId } }),
          },
          select: { id: true },
        })
        return !!existing
      },
      { maxLength: 50 },
    )
  }

  /**
   * Validate slug format
   */
  static isValidSlug(slug: string): boolean {
    // Valid slug: lowercase letters, numbers, and hyphens
    // Cannot start or end with hyphen, no consecutive hyphens
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    return slugRegex.test(slug)
  }

  /**
   * Sanitize a slug (fix common issues)
   */
  static sanitize(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphen
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }
}
