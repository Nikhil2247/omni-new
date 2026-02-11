import { Controller, Get, Param, Query } from '@nestjs/common'
import { BlogService } from '../../../domain/content/services/blog.service'
import { BlogStatus, SearchBlogPostsDto } from '../../../domain/content/dto/blog-post.dto'
import { PrismaService } from '../../../core/database/prisma.service'
import { Public } from '../../../core/auth/decorators/public.decorator'

@Controller('blog')
@Public()
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('posts')
  list(@Query() query: SearchBlogPostsDto) {
    return this.blogService.search({
      ...query,
      status: BlogStatus.PUBLISHED,
    })
  }

  @Get('posts/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug, true)
  }

  @Get('categories')
  listCategories() {
    return this.prisma.blogCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
  }

  @Get('tags')
  listTags() {
    return this.prisma.blogTag.findMany({
      orderBy: { name: 'asc' },
    })
  }
}
