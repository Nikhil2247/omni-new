import { Controller, Get, Query, Param } from '@nestjs/common'
import { MediaTagService } from '../../../domain/catalog/services/media-tag.service'

@Controller('media-tags')
export class MediaTagsController {
  constructor(private readonly mediaTagService: MediaTagService) {}

  @Get('list')
  list(@Query('query') query?: string) {
    return this.mediaTagService.listTags(query)
  }

  @Get('media/:mediaItemId')
  listMediaTags(@Param('mediaItemId') mediaItemId: string) {
    return this.mediaTagService.listMediaTags(mediaItemId)
  }
}
