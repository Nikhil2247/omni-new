import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { BlogService } from '../../../domain/content/services/blog.service';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  SearchBlogPostsDto,
} from '../../../domain/content/dto/blog-post.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import {
  MarketingAccess,
  Roles,
} from '../../../core/auth/decorators/roles.decorator';

const CONTENT_WRITER_ROLE = 'CONTENT_WRITER';
const MARKETING_ADMIN_ROLES = ['ADMIN_SYSTEM', 'MARKETING_SERVICES_ADMIN'];
const CONTENT_EDITOR_ROLES = [
  'ADMIN_SYSTEM',
  'MARKETING_SERVICES_ADMIN',
  'CONTENT_WRITER',
];

@Controller('content')
@UseGuards(JwtAuthGuard, RolesGuard)
@MarketingAccess()
export class ContentController {
  constructor(private readonly blogService: BlogService) {}

  @Post('posts')
  @Roles(...CONTENT_EDITOR_ROLES)
  create(@Body() dto: CreateBlogPostDto, @Req() req: any) {
    return this.blogService.create(dto, req?.user?.id || 'system');
  }

  @Get('posts/:id')
  @Roles(...CONTENT_EDITOR_ROLES)
  async findById(@Param('id') id: string, @Req() req: any) {
    const post = await this.blogService.findById(id);

    if (this.isContentWriter(req) && post.authorId !== req?.user?.id) {
      throw new ForbiddenException(
        'Content writers can only access their own posts',
      );
    }

    return post;
  }

  @Get('posts')
  @Roles(...CONTENT_EDITOR_ROLES)
  search(@Query() query: SearchBlogPostsDto, @Req() req: any) {
    if (this.isContentWriter(req)) {
      query.status = 'DRAFT' as any;
      query.authorId = req?.user?.id;
    }

    return this.blogService.search(query);
  }

  @Put('posts/:id')
  @Roles(...CONTENT_EDITOR_ROLES)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
    @Req() req: any,
  ) {
    if (this.isContentWriter(req)) {
      const existing = await this.blogService.findById(id);

      if (existing.authorId !== req?.user?.id) {
        throw new ForbiddenException(
          'Content writers can only edit their own drafts',
        );
      }

      if (existing.status !== 'DRAFT') {
        throw new ForbiddenException(
          'Published or archived posts cannot be edited by content writers',
        );
      }

      if (dto.status && dto.status !== 'DRAFT') {
        throw new ForbiddenException(
          'Content writers can only keep posts in draft status',
        );
      }

      dto.status = 'DRAFT' as any;
    }

    return this.blogService.update(id, dto);
  }

  @Delete('posts/:id')
  @Roles(...MARKETING_ADMIN_ROLES)
  async remove(@Param('id') id: string) {
    await this.blogService.delete(id);
    return { success: true };
  }

  @Post('posts/:id/publish')
  @Roles(...MARKETING_ADMIN_ROLES)
  async publish(@Param('id') id: string) {
    return this.blogService.publish(id);
  }

  private isContentWriter(req: any): boolean {
    const roles = req?.user?.roles ?? [];
    const isWriter = roles.includes(CONTENT_WRITER_ROLE);
    const isMarketingAdmin = roles.some((role: string) =>
      MARKETING_ADMIN_ROLES.includes(role),
    );

    return isWriter && !isMarketingAdmin;
  }
}
