import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { BlogService } from '../../../domain/content/services/blog.service';
import {
  BlogStatus,
  SearchBlogPostsDto,
} from '../../../domain/content/dto/blog-post.dto';
import { PrismaService } from '../../../core/database/prisma.service';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { MediaUrlNormalizerService } from '../services/media-url-normalizer.service';

@Controller('blog')
@Public()
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly prisma: PrismaService,
    private readonly mediaUrlNormalizer: MediaUrlNormalizerService,
  ) {}

  @Get('posts')
  list(@Query() query: SearchBlogPostsDto) {
    return this.blogService
      .search({
        ...query,
        status: BlogStatus.PUBLISHED,
      })
      .then((result) => this.mediaUrlNormalizer.normalizeDeep(result));
  }

  @Get('posts/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.blogService
      .findBySlug(slug, false)
      .then(async (post) => {
        // Only published posts whose publish date has arrived are public. Drafts and scheduled posts must not be
        // reachable by guessing the URL (they would otherwise be served, and indexed, before they are ready).
        const live =
          post.status === BlogStatus.PUBLISHED &&
          post.publishedAt !== null &&
          post.publishedAt <= new Date();
        if (!live) throw new NotFoundException('Blog post not found');

        await this.blogService.findBySlug(slug, true); // count the view for live posts only
        return post;
      })
      .then((result) => this.mediaUrlNormalizer.normalizeDeep(result));
  }

  @Get('categories')
  listCategories() {
    return this.prisma.blogCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Get('tags')
  listTags() {
    return this.prisma.blogTag.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
