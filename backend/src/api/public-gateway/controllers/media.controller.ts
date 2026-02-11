import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { MinioService } from '../../../infrastructure/storage/minio.service'
import { Public } from '../../../core/auth/decorators/public.decorator'
import * as path from 'path'

@Public()
@Controller('media')
export class MediaController {
	constructor(private readonly minioService: MinioService) {}

	@Get('view')
	async viewMedia(
		@Query('path') path: string,
		@Res() res: Response,
		@Query('expiresIn') expiresIn?: string,
	) {
		if (!path) {
			throw new BadRequestException('path is required')
		}

		const objectPath = this.extractObjectPath(path)
		const ttl = expiresIn ? Number(expiresIn) : undefined

		try {
			const [stream, info] = await Promise.all([
				this.minioService.getFileStream(objectPath),
				this.minioService.getFileInfo(objectPath).catch(() => null),
			])

			const contentType =
				(info?.metadata?.['content-type'] as string | undefined) ||
				(info?.metadata?.['Content-Type'] as string | undefined) ||
				this.guessContentType(objectPath) ||
				'application/octet-stream'

			res.setHeader('Content-Type', contentType)
			if (info?.size) {
				res.setHeader('Content-Length', info.size.toString())
			}
			if (ttl) {
				res.setHeader('Cache-Control', `private, max-age=${ttl}`)
			} else {
				res.setHeader('Cache-Control', 'public, max-age=300')
			}
			res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')

			stream.pipe(res)
		} catch (error) {
			throw new BadRequestException('Unable to load media')
		}
	}

	private extractObjectPath(pathOrUrl: string): string {
		const trimmed = pathOrUrl.trim()

		if (!trimmed) {
			return trimmed
		}

		if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
			try {
				const url = new URL(trimmed)
				const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
				const segments = pathname.split('/').filter(Boolean)

				if (segments.length <= 1) {
					return segments.join('/')
				}

				return segments.slice(1).join('/')
			} catch {
				return trimmed
			}
		}

		return trimmed.replace(/^\/+/, '')
	}

	private guessContentType(objectPath: string): string | null {
		const ext = path.extname(objectPath).toLowerCase()

		switch (ext) {
			case '.jpg':
			case '.jpeg':
				return 'image/jpeg'
			case '.png':
				return 'image/png'
			case '.webp':
				return 'image/webp'
			case '.gif':
				return 'image/gif'
			case '.svg':
				return 'image/svg+xml'
			case '.mp4':
				return 'video/mp4'
			case '.webm':
				return 'video/webm'
			default:
				return null
		}
	}
}
