// ============================================================================
// BLOG POST SERVICE - Content Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BlogPost } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { BlogPostRepository } from '../repositories/blog-post.repository';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  SearchBlogPostsDto,
} from '../dto/blog-post.dto';
import { PaginatedResult } from '../../../core/database/repositories/base.repository';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  private normalizeBlogMediaPath(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return trimmed.replace(/^\/+/, '');
    }

    try {
      const parsed = new URL(trimmed);
      const mediaPathParam = parsed.searchParams.get('path');

      if (mediaPathParam) {
        try {
          return decodeURIComponent(mediaPathParam).replace(/^\/+/, '');
        } catch {
          return mediaPathParam.replace(/^\/+/, '');
        }
      }

      const isMinioLikeHost =
        parsed.hostname === 'infra-minio' ||
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.port === '9000';

      if (isMinioLikeHost) {
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (segments.length > 1) {
          return segments.slice(1).join('/');
        }
      }

      return trimmed;
    } catch {
      return trimmed;
    }
  }

  constructor(
    private readonly blogPostRepository: BlogPostRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async assertValidTagIds(tagIds?: string[]): Promise<void> {
    if (!tagIds || tagIds.length === 0) {
      return;
    }

    const uniqueTagIds = Array.from(new Set(tagIds));
    const existingTags = await this.prisma.blogTag.findMany({
      where: { id: { in: uniqueTagIds } },
      select: { id: true },
    });

    const existingTagIdSet = new Set(existingTags.map((tag) => tag.id));
    const missingTagIds = uniqueTagIds.filter((tagId) => !existingTagIdSet.has(tagId));

    if (missingTagIds.length > 0) {
      throw new BadRequestException(
        `Invalid blog tag IDs: ${missingTagIds.join(', ')}`,
      );
    }
  }

  async create(dto: CreateBlogPostDto, authorId: string): Promise<BlogPost> {
    this.logger.log(`Creating blog post: ${dto.title} by author: ${authorId}`);

    // Generate slug if not provided
    const slug = dto.slug || this.generateSlug(dto.title);

    // Check slug uniqueness
    const existing = await this.blogPostRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(
        `A blog post with slug "${slug}" already exists`,
      );
    }

    const normalizedOgImage = this.normalizeBlogMediaPath(dto.ogImage);
    const normalizedFeaturedImage = this.normalizeBlogMediaPath(
      dto.featuredImage,
    );
    await this.assertValidTagIds(dto.tagIds);

    const blogPost = await this.blogPostRepository.create(
      {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: dto.content,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        focusKeyword: dto.focusKeyword,
        keywords: dto.keywords || [],
        ogImage: normalizedOgImage,
        featuredImage: normalizedFeaturedImage,
        featuredImageAlt: dto.featuredImageAlt,
        authorId,
        category: dto.categoryId
          ? { connect: { id: dto.categoryId } }
          : undefined,
        tags: dto.tagIds?.length
          ? {
              create: Array.from(new Set(dto.tagIds)).map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
        vendorId: dto.vendorId,
        readingTime: dto.readingTime || this.calculateReadingTime(dto.content),
        status: 'DRAFT',
      },
      {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    );

    this.eventEmitter.emit('blog-post.created', {
      postId: blogPost.id,
      authorId,
    });
    return blogPost;
  }

  async findById(id: string): Promise<BlogPost> {
    const blogPost = await this.blogPostRepository.findById(id, {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    });

    if (!blogPost) {
      throw new NotFoundException('Blog post not found');
    }

    return blogPost;
  }

  async findBySlug(
    slug: string,
    incrementView: boolean = false,
  ): Promise<BlogPost> {
    const blogPost = await this.blogPostRepository.findBySlug(slug);

    if (!blogPost) {
      throw new NotFoundException('Blog post not found');
    }

    if (incrementView && blogPost.status === 'PUBLISHED') {
      await this.blogPostRepository.incrementViewCount(blogPost.id);
    }

    return blogPost;
  }

  async search(dto: SearchBlogPostsDto): Promise<PaginatedResult<BlogPost>> {
    return this.blogPostRepository.search(dto);
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<BlogPost> {
    await this.findById(id);

    // Check slug uniqueness if changing slug
    if (dto.slug) {
      const existing = await this.blogPostRepository.findBySlug(dto.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `A blog post with slug "${dto.slug}" already exists`,
        );
      }
    }

    const normalizedOgImage = this.normalizeBlogMediaPath(dto.ogImage);
    const normalizedFeaturedImage = this.normalizeBlogMediaPath(
      dto.featuredImage,
    );
    await this.assertValidTagIds(dto.tagIds);

    const updated = await this.blogPostRepository.update(
      id,
      {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        content: dto.content,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        focusKeyword: dto.focusKeyword,
        keywords: dto.keywords,
        ogImage: normalizedOgImage,
        featuredImage: normalizedFeaturedImage,
        featuredImageAlt: dto.featuredImageAlt,
        status: dto.status,
        category: dto.categoryId
          ? { connect: { id: dto.categoryId } }
          : undefined,
        tags:
          dto.tagIds !== undefined
            ? {
                deleteMany: {},
                create: Array.from(new Set(dto.tagIds)).map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              }
            : undefined,
        vendorId: dto.vendorId,
        readingTime:
          dto.readingTime ||
          (dto.content ? this.calculateReadingTime(dto.content) : undefined),
      },
      {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    );

    this.eventEmitter.emit('blog-post.updated', { postId: id, changes: dto });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.blogPostRepository.delete(id);
    this.eventEmitter.emit('blog-post.deleted', { postId: id });
  }

  async publish(id: string): Promise<BlogPost> {
    const blogPost = await this.findById(id);

    if (blogPost.status === 'PUBLISHED') {
      return blogPost;
    }

    const published = await this.blogPostRepository.update(
      id,
      {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    );

    this.eventEmitter.emit('blog-post.published', { postId: id });
    return published;
  }

  async unpublish(id: string): Promise<BlogPost> {
    const blogPost = await this.findById(id);

    if (blogPost.status !== 'PUBLISHED') {
      return blogPost;
    }

    const unpublished = await this.blogPostRepository.update(id, {
      status: 'DRAFT',
    });

    this.eventEmitter.emit('blog-post.unpublished', { postId: id });
    return unpublished;
  }

  async getPublished(limit: number = 10): Promise<BlogPost[]> {
    return this.blogPostRepository.findPublished(limit);
  }

  async getByCategory(
    categoryId: string,
    limit: number = 10,
  ): Promise<BlogPost[]> {
    return this.blogPostRepository.findByCategory(categoryId, limit);
  }

  async getRelated(postId: string, limit: number = 3): Promise<BlogPost[]> {
    const post = await this.findById(postId);
    return this.blogPostRepository.findRelated(postId, post.categoryId, limit);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute) || 1;
  }
}
