import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common'
import { BlogService } from '../../../domain/content/services/blog.service'
import { CreateBlogPostDto, UpdateBlogPostDto, SearchBlogPostsDto } from '../../../domain/content/dto/blog-post.dto'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { MarketingAccess } from '../../../core/auth/decorators/roles.decorator'

@Controller('content')
@UseGuards(JwtAuthGuard, RolesGuard)
@MarketingAccess()
export class ContentController {
	constructor(private readonly blogService: BlogService) {}

	@Post('posts')
	create(@Body() dto: CreateBlogPostDto, @Req() req: any) {
		return this.blogService.create(dto, req?.user?.id || 'system')
	}

	@Get('posts/:id')
	findById(@Param('id') id: string) {
		return this.blogService.findById(id)
	}

	@Get('posts')
	search(@Query() query: SearchBlogPostsDto) {
		return this.blogService.search(query)
	}

	@Put('posts/:id')
	update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
		return this.blogService.update(id, dto)
	}

	@Delete('posts/:id')
	async remove(@Param('id') id: string) {
		await this.blogService.delete(id)
		return { success: true }
	}
}

