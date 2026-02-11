import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { WishlistService } from '../../../domain/planning/services/wishlist.service'
import { CreateWishlistDto, AddWishlistItemDto } from '../../../domain/planning/dto/wishlist.dto'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { UserAccess } from '../../../core/auth/decorators/roles.decorator'
import { UserId } from '../../../core/auth/decorators/current-user.decorator'

@Controller('wishlists')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class WishlistsController {
	constructor(private readonly wishlistService: WishlistService) {}

	@Post()
	create(@Body() dto: CreateWishlistDto, @UserId() userId: string) {
		dto.userId = userId
		return this.wishlistService.create(dto)
	}

	@Get()
	findByUser(@UserId() userId: string) {
		return this.wishlistService.findByUserId(userId)
	}

	@Get(':id')
	findById(@Param('id') id: string) {
		return this.wishlistService.findById(id)
	}

	@Post(':id/items')
	addVendor(@Param('id') id: string, @Body() dto: AddWishlistItemDto) {
		return this.wishlistService.addVendor(id, dto.vendorProfileId, dto.notes)
	}

	@Delete('items/:itemId')
	async removeVendor(@Param('itemId') itemId: string) {
		await this.wishlistService.removeVendor(itemId)
		return { success: true }
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		await this.wishlistService.delete(id)
		return { success: true }
	}
}
