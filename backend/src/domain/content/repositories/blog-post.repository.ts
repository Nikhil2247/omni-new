// ============================================================================
// BLOG POST REPOSITORY - Content Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, BlogPost } from '@prisma/client';
import {
  BaseRepository,
  PaginatedResult,
} from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import { SearchBlogPostsDto } from '../dto/blog-post.dto';

@Injectable()
export class BlogPostRepository extends BaseRepository<
  BlogPost,
  Prisma.BlogPostCreateInput,
  Prisma.BlogPostUpdateInput,
  Prisma.BlogPostWhereInput,
  Prisma.BlogPostWhereUniqueInput,
  Prisma.BlogPostOrderByWithRelationInput
> {
  protected readonly modelName = 'BlogPost';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.blogPost;
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    return this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async search(dto: SearchBlogPostsDto): Promise<PaginatedResult<BlogPost>> {
    const {
      authorId,
      status,
      categoryId,
      tagId,
      keyword,
      page = 1,
      limit = 20,
    } = dto;

    const where: Prisma.BlogPostWhereInput = {
      ...(authorId && { authorId }),
      ...(status && { status: status as any }),
      ...(categoryId && { categoryId }),
      ...(tagId && {
        tags: {
          some: {
            tagId,
          },
        },
      }),
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { excerpt: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } },
          { keywords: { has: keyword } },
        ],
      }),
    };

    return this.findManyPaginated(
      { page, limit },
      {
        where,
        orderBy: { publishedAt: 'desc' },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    );
  }

  async findPublished(limit: number = 10): Promise<BlogPost[]> {
    return this.prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        category: true,
      },
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.blogPost.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  async findByCategory(
    categoryId: string,
    limit: number = 10,
  ): Promise<BlogPost[]> {
    return this.prisma.blogPost.findMany({
      where: {
        categoryId,
        status: 'PUBLISHED',
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async findRelated(
    postId: string,
    categoryId: string | null,
    limit: number = 3,
  ): Promise<BlogPost[]> {
    if (!categoryId) return [];

    return this.prisma.blogPost.findMany({
      where: {
        id: { not: postId },
        categoryId,
        status: 'PUBLISHED',
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }
}
