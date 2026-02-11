import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { MarketingAccess } from '../../../core/auth/decorators/roles.decorator'

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@MarketingAccess()
export class CategoriesController {
	@Get()
	list() {
		return []
	}
}
