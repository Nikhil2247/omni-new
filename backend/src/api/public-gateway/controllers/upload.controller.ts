import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { UploadService, FileCategory } from '../../../infrastructure/storage/upload.service'
import { Public } from '../../../core/auth/decorators/public.decorator'

interface PresignedUploadRequest {
	filename: string
	mimeType: string
	category?: string
	expiresIn?: number
}

@Public()
@Controller('upload')
export class UploadController {
	constructor(private readonly uploadService: UploadService) {}

	@Post('presigned')
	async getPresignedUpload(@Body() body: PresignedUploadRequest) {
		const filename = body?.filename?.trim()
		const mimeType = body?.mimeType?.trim()
		const category = (body?.category || FileCategory.MEDIA) as FileCategory

		if (!filename || !mimeType) {
			throw new BadRequestException('filename and mimeType are required')
		}

		if (!Object.values(FileCategory).includes(category)) {
			throw new BadRequestException('Invalid category')
		}

		return this.uploadService.getPresignedUploadUrl(
			category,
			filename,
			mimeType,
			body?.expiresIn,
		)
	}
}
