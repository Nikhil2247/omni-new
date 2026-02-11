import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator'
import { CurrentUser, CurrentUserData } from '../../../core/auth/decorators/current-user.decorator'
import { MediaTagService } from '../../../domain/catalog/services/media-tag.service'
import { AddMediaTagsDto, RemoveMediaTagDto, ListMediaTagsDto } from '../../../domain/catalog/dto/media-tag.dto'

@Controller('media-tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class MediaTagsController {
  constructor(private readonly mediaTagService: MediaTagService) {}

  @Post('add')
  add(@Body() dto: AddMediaTagsDto, @CurrentUser() user: CurrentUserData) {
    return this.mediaTagService.addTags(user.id, dto.mediaItemId, dto.tags)
  }

  @Post('remove')
  remove(@Body() dto: RemoveMediaTagDto, @CurrentUser() user: CurrentUserData) {
    return this.mediaTagService.removeTag(user.id, dto.mediaItemId, dto.tag)
  }

  @Get('list')
  list(@Query() query: ListMediaTagsDto) {
    return this.mediaTagService.listTags(query.query)
  }
}
