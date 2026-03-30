# Quick Start Guide - Continuing Omnicassion V2.0 Development

## What's Been Completed

### ✅ Catalog Domain Module (Fully Functional)
- Complete vendor profile management
- Discovery/search endpoints  
- Event-driven side effects
- RBAC-protected endpoints

**Test the Implementation:**
```bash
# 1. Install dependencies
npm install

# 2. Set up database
npx prisma generate
npx prisma db push

# 3. Start development server
npm run start:dev

# For lower CPU usage (native watch events, may fail on some Windows/Docker setups):
npm run start:dev:fast

# If auto-reload does not detect file changes on Windows/Docker mounts:
npm run start:dev:poll

# 4. Access Swagger docs
# http://localhost:3000/api/docs
```

---

## Next Module to Implement: Planning Domain

### Step-by-Step Implementation Pattern

Following the **exact same pattern** used for Catalog Domain:

### 1. Create DTOs (`src/domain/planning/dto/`)

```typescript
// event.dto.ts
export class CreateEventDto {
  @ApiProperty() 
  @IsString() 
  name: string
  
  @ApiProperty()
  @IsUUID()
  eventTypeId: string
  
  @ApiProperty()
  @IsDateString()
  eventDate: string
  
  // ... more fields from Prisma schema
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class SearchEventDto extends PaginationDto {
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus
  @IsOptional() @IsUUID() eventTypeId?: string
}
```

### 2. Create Repository (`src/domain/planning/repositories/`)

```typescript
// event.repository.ts
@Injectable()
export class EventRepository extends BaseRepository<
  Event,
  Prisma.EventCreateInput,
  Prisma.EventUpdateInput,
  Prisma.EventWhereInput,
  Prisma.EventWhereUniqueInput,
  Prisma.EventOrderByWithRelationInput
> {
  protected readonly modelName = 'Event'
  
  constructor(prisma: PrismaService) {
    super(prisma)
  }
  
  protected get model() {
    return this.prisma.event
  }
  
  // Custom queries specific to events
  async findByUserId(userId: string) {
    return this.prisma.event.findMany({
      where: { userId },
      orderBy: { eventDate: 'asc' }
    })
  }
  
  async findUpcoming(limit: number = 10) {
    return this.prisma.event.findMany({
      where: {
        eventDate: { gte: new Date() },
        status: 'ACTIVE'
      },
      take: limit,
      orderBy: { eventDate: 'asc' }
    })
  }
}
```

### 3. Create Service (`src/domain/planning/`)

```typescript
// event.service.ts
@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name)
  
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  
  async create(dto: CreateEventDto, userId: string): Promise<Event> {
    const event = await this.eventRepository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      eventType: { connect: { id: dto.eventTypeId } },
      eventDate: new Date(dto.eventDate),
      status: 'DRAFT',
      // ... other fields
    })
    
    // Emit event for side effects
    this.eventEmitter.emit('event.created', {
      eventId: event.id,
      userId: event.userId,
      eventDate: event.eventDate,
    })
    
    return event
  }
  
  async findById(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id, {
      eventType: true,
      checklist: true,
      budget: true,
      guestList: true,
    })
    
    if (!event) {
      throw new NotFoundException('Event not found')
    }
    
    return event
  }
  
  async findByUserId(userId: string): Promise<Event[]> {
    return this.eventRepository.findByUserId(userId)
  }
  
  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    await this.findById(id) // Validate exists
    
    const updated = await this.eventRepository.update(id, dto)
    
    this.eventEmitter.emit('event.updated', {
      eventId: id,
      changes: dto,
    })
    
    return updated
  }
  
  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.eventRepository.delete(id)
    
    this.eventEmitter.emit('event.deleted', { eventId: id })
  }
}
```

### 4. Create Event Handler (`src/domain/planning/events/`)

```typescript
// event.handler.ts
@Injectable()
export class EventEventHandler {
  private readonly logger = new Logger(EventEventHandler.name)
  
  @OnEvent('event.created')
  async handleEventCreated(payload: { eventId: string; userId: string }) {
    this.logger.log(`Handling event.created: ${payload.eventId}`)
    
    // TODO: Create default checklist
    // TODO: Create default budget
    // TODO: Create default guest list
    // TODO: Send welcome email
    // TODO: Index in search
  }
  
  @OnEvent('event.updated')
  async handleEventUpdated(payload: { eventId: string; changes: any }) {
    this.logger.log(`Handling event.updated: ${payload.eventId}`)
    
    // TODO: Invalidate cache
    // TODO: Update search index
  }
  
  @OnEvent('event.deleted')
  async handleEventDeleted(payload: { eventId: string }) {
    this.logger.log(`Handling event.deleted: ${payload.eventId}`)
    
    // TODO: Clean up related data
    // TODO: Remove from search
  }
}
```

### 5. Update Module (`src/domain/planning/planning.module.ts`)

```typescript
@Module({
  providers: [
    // Repositories
    EventRepository,
    ChecklistRepository,
    BudgetRepository,
    GuestListRepository,
    
    // Services
    EventService,
    ChecklistService,
    BudgetService,
    GuestListService,
    
    // Event Handlers
    EventEventHandler,
  ],
  exports: [
    EventService,
    ChecklistService,
    BudgetService,
    GuestListService,
    // Repositories if needed elsewhere
  ]
})
export class PlanningModule {}
```

### 6. Create Controllers (`src/api/user-gateway/controllers/`)

```typescript
// events.controller.ts
@ApiTags('User - Event Planning')
@ApiBearerAuth()
@Controller('user/events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventService: EventService) {}
  
  @Post()
  @Roles('USER', 'BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Create new event' })
  async create(
    @Body() dto: CreateEventDto,
    @Request() req: any
  ): Promise<Event> {
    return this.eventService.create(dto, req.user.id)
  }
  
  @Get()
  @Roles('USER', 'BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get all my events' })
  async findMyEvents(@Request() req: any): Promise<Event[]> {
    return this.eventService.findByUserId(req.user.id)
  }
  
  @Get(':id')
  @Roles('USER', 'BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get event by ID' })
  async findOne(@Param('id') id: string): Promise<Event> {
    return this.eventService.findById(id)
  }
  
  @Put(':id')
  @Roles('USER', 'BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Update event' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto
  ): Promise<Event> {
    return this.eventService.update(id, dto)
  }
  
  @Delete(':id')
  @Roles('USER', 'BUSINESS_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.eventService.delete(id)
  }
}
```

### 7. Update Gateway Module (`src/api/user-gateway/user-gateway.module.ts`)

```typescript
@Module({
  imports: [
    CatalogModule,
    PlanningModule, // Add this
  ],
  controllers: [
    EventsController,
    DiscoveryController,
    // ... other controllers
  ]
})
export class UserGatewayModule {}
```

---

## Implementation Checklist for Each Domain

```
For each domain module (Planning, Operations, Leads, Content):

□ 1. Study Prisma schema for the domain
□ 2. Create DTOs (Create, Update, Search, Response)
□ 3. Create Repositories extending BaseRepository
□ 4. Create Services with business logic
□ 5. Create Event Handlers for side effects
□ 6. Update Domain Module (providers & exports)
□ 7. Create Controllers in appropriate gateway
□ 8. Update Gateway Module (imports)
□ 9. Test endpoints manually
□ 10. Write unit tests
```

---

## Common Patterns to Follow

### ✅ Always Do This:
1. **Use BaseRepository**: Don't write raw Prisma queries unless necessary
2. **Emit Events**: For cache invalidation, search indexing, notifications
3. **Validate Input**: Use DTOs with class-validator decorations
4. **Handle Not Found**: Throw `NotFoundException` when entity doesn't exist
5. **Use Transactions**: For multi-step operations (use `prisma.$transaction`)
6. **Log Important Actions**: Use NestJS Logger for debugging
7. **Include Relations**: Use Prisma include for related data
8. **Paginate Lists**: Always use pagination for list endpoints
9. **Add Swagger Docs**: Use `@ApiOperation`, `@ApiProperty`, etc.
10. **Protect Routes**: Use `@UseGuards()` and `@Roles()` decorators

### ❌ Never Do This:
1. **Don't bypass validation**: Always use DTOs
2. **Don't expose internal errors**: Catch and transform to HTTP exceptions
3. **Don't forget authorization**: All routes need guards except public
4. **Don't hardcode values**: Use environment variables
5. **Don't skip event emission**: Events drive cache/search updates
6. **Don't return raw Prisma types**: Transform to response DTOs
7. **Don't perform sync operations**: Use async/await everywhere
8. **Don't forget error handling**: Wrap risky operations in try-catch

---

## Debugging Tips

### Check Current Errors:
```bash
# In VS Code, press Ctrl+Shift+M to see Problems panel
# Or use the command:
npx tsc --noEmit
```

### Test API Endpoints:
```bash
# Use Thunder Client, Postman, or curl
curl http://localhost:3000/api/user/discovery/vendors
```

### View Logs:
```bash
# Development logs show in terminal
npm run start:dev

# Look for [EventService], [VendorProfileService], etc.
```

### Prisma Studio (Database GUI):
```bash
npx prisma studio
# Opens at http://localhost:5555
```

---

## Priority Order for Next Modules

### 🔥 High Priority (Core User Features)
1. **Planning Domain** - Event, Checklist, Guest List, Budget
2. **Operations Domain** - Active Events, Requirements, Tasks
3. **Leads Domain** - Inquiry management, Messages

### 🔥 High Priority (Infrastructure)
4. **Cache Module** - Redis/Dragonfly integration
5. **Search Module** - Meilisearch integration
6. **Storage Module** - MinIO for file uploads

### 📌 Medium Priority
7. **Notifications Module** - Email, Push, WebSocket
8. **Jobs Module** - Background task processing
9. **Admin Gateway** - System administration
10. **Ops Gateway** - Operations team features

### 📌 Low Priority
11. **Marketing Gateway** - Campaigns, Content
12. **Sales Gateway** - Lead management
13. **Content Domain** - Blog posts, SEO

---

## Questions & Support

### Common Issues:

**Q: Prisma type errors?**  
A: Run `npx prisma generate` after schema changes

**Q: Import errors?**  
A: Restart VS Code TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"

**Q: Module not found?**  
A: Check that module is in `app.module.ts` imports array

**Q: Authentication errors?**  
A: Implement auth guards first (currently scaffolded but not functional)

---

## File Templates

### Quick Create New Files:
```bash
# Repository
touch src/domain/{domain}/repositories/{entity}.repository.ts

# Service
touch src/domain/{domain}/{entity}.service.ts

# DTO
touch src/domain/{domain}/dto/{entity}.dto.ts

# Controller
touch src/api/{gateway}-gateway/controllers/{entity}.controller.ts

# Event Handler
touch src/domain/{domain}/events/{entity}.handler.ts
```

---

**Happy Coding! 🚀**

Follow this guide to maintain architectural consistency and code quality across all modules.
