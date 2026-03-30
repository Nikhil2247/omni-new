import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServiceService } from '../../../domain/catalog/services/service.service';
import { ServiceItemService } from '../../../domain/catalog/services/service-item.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
} from '../../../domain/catalog/dto/service.dto';
import {
  CreateServiceItemDto,
  UpdateServiceItemDto,
  ReorderServiceItemsDto,
} from '../../../domain/catalog/dto/service-item.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class ServicesController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly serviceItemService: ServiceItemService,
  ) {}

  // ============================================================================
  // Service CRUD
  // ============================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  create(@Body() dto: CreateServiceDto) {
    return this.serviceService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  findById(@Param('id') id: string) {
    return this.serviceService.findById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get services by vendor profile' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  findByVendor(@Query('vendorProfileId') vendorProfileId: string) {
    return this.serviceService.findByVendorProfile(vendorProfileId, true);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.serviceService.delete(id);
    return { success: true };
  }

  // ============================================================================
  // Service Item CRUD
  // ============================================================================

  @Get(':serviceId/items')
  @ApiOperation({ summary: 'Get all items for a service' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully' })
  getItems(
    @Param('serviceId') serviceId: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.serviceItemService.findByService(serviceId, includeInactive);
  }

  @Post(':serviceId/items')
  @ApiOperation({ summary: 'Add an item to a service' })
  @ApiResponse({ status: 201, description: 'Item created successfully' })
  createItem(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateServiceItemDto,
  ) {
    return this.serviceItemService.create(serviceId, dto);
  }

  @Post(':serviceId/items/bulk')
  @ApiOperation({ summary: 'Add multiple items to a service' })
  @ApiResponse({ status: 201, description: 'Items created successfully' })
  createItems(
    @Param('serviceId') serviceId: string,
    @Body() items: CreateServiceItemDto[],
  ) {
    return this.serviceItemService.createMany(serviceId, items);
  }

  @Put(':serviceId/items/sync')
  @ApiOperation({ summary: 'Sync items for a service (create/update/delete)' })
  @ApiResponse({ status: 200, description: 'Items synced successfully' })
  syncItems(
    @Param('serviceId') serviceId: string,
    @Body() items: (CreateServiceItemDto & { id?: string })[],
  ) {
    return this.serviceItemService.syncItems(serviceId, items);
  }

  @Patch(':serviceId/items/reorder')
  @ApiOperation({ summary: 'Reorder items for a service' })
  @ApiResponse({ status: 200, description: 'Items reordered successfully' })
  reorderItems(
    @Param('serviceId') serviceId: string,
    @Body() dto: ReorderServiceItemsDto,
  ) {
    return this.serviceItemService.reorder(serviceId, dto.itemIds);
  }

  @Get(':serviceId/items/stats')
  @ApiOperation({ summary: 'Get item price statistics for a service' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getItemStats(@Param('serviceId') serviceId: string) {
    return this.serviceItemService.getItemPriceStats(serviceId);
  }

  @Get(':serviceId/items/:itemId')
  @ApiOperation({ summary: 'Get a specific item by ID' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully' })
  getItem(@Param('itemId') itemId: string) {
    return this.serviceItemService.findById(itemId);
  }

  @Put(':serviceId/items/:itemId')
  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateServiceItemDto,
  ) {
    return this.serviceItemService.update(itemId, dto);
  }

  @Delete(':serviceId/items/:itemId')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  async deleteItem(@Param('itemId') itemId: string) {
    await this.serviceItemService.delete(itemId);
    return { success: true };
  }
}
