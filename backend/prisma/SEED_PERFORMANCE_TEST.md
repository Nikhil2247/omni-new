# Performance Test Seed Configuration

## Overview
The seed file has been updated to create **1000 vendor profiles** with comprehensive portfolio data to test system performance under realistic load conditions.

## What's Generated

### Users
- **1000 Vendor Users**: Created in 10 batches of 100 users each
- Each vendor has a unique email, name, and verified account
- All vendors have the "Vendor" role assigned

### Addresses
- **1000 Unique Addresses**: One for each vendor
- Distributed across 8 major cities:
  - Los Angeles
  - San Francisco
  - New York City
  - Miami
  - Austin
  - Brooklyn
  - San Diego
  - Houston
- Realistic street addresses with postal codes

### Vendor Profiles
- **1000 Vendor Profiles**: Created in 10 batches of 100 profiles each
- Distributed evenly across all 8 categories:
  - Photography (125 vendors)
  - Videography (125 vendors)
  - Catering (125 vendors)
  - Venues (125 vendors)
  - Entertainment (125 vendors)
  - Florist (125 vendors)
  - Makeup & Hair (125 vendors)
  - Decor (125 vendors)
- Each vendor has:
  - Unique business name and slug
  - Professional description and tagline
  - Contact information (email, phone, website)
  - Service radius (25-150 miles)
  - Random view counts (0-5000) and lead counts (0-100)
  - 90% active, 10% pending review
  - 5% featured vendors

### Business Data

#### Business Hours
- **7000 Business Hour Records**: 7 days per vendor
- Standard hours: Mon-Sat 9AM-6PM, Sun 10AM-4PM

#### Tags
- **2500+ Vendor Tags**: Each vendor assigned 2-4 tags
- Rotated distribution across all available tags

#### Service Areas
- **2500+ Service Areas**: Each vendor serves 2-4 cities
- Varying service radii (25, 50, 75, 100 miles)
- Some with additional travel fees

### Portfolio Content

#### Portfolios
- **3000 Portfolios**: 3 portfolios per vendor
  - Featured Work
  - Recent Projects  
  - Client Favorites
- Each portfolio flagged appropriately

#### Media Items
- **15,000 Media Items**: 5 media items per portfolio
- All images sourced from Unsplash
- Proper thumbnails and metadata
- All approved and ready for display

### Services & Pricing

#### Services
- **3000 Services**: 3 services per vendor (average)
- Matched to vendor category
- Professional descriptions
- Tiered pricing structure

#### Pricing Tiers
- **9000 Pricing Tiers**: 3 tiers per service
  - Basic Package
  - Standard Package
  - Premium Package
- Realistic pricing ranges ($500-$8000)

### Blog Content

#### Blog Posts
- **100 Comprehensive Blog Posts**: Covering all aspects of wedding planning
- 8 blog categories (Wedding Planning, Vendor Spotlights, Real Weddings, etc.)
- 15 blog tags for organization
- Each post includes:
  - Comprehensive content (1500+ words)
  - Professional featured images from Unsplash
  - SEO-optimized metadata
  - Multiple tags for categorization
  - Realistic view counts
  - Proper reading time estimates
- Topics cover: Planning guides, vendor spotlights, real weddings, trends, DIY ideas, budget tips, destination weddings, and seasonal ideas
- 95% published, 5% drafts

## Total Database Records

| Entity | Count |
|--------|-------|
| Vendor Users | 1,000 |
| Vendor Profiles | 1,000 |
| Addresses | 1,000+ |
| Business Hours | 7,000 |
| Vendor Tags | 2,500+ |
| Service Areas | 2,500+ |
| Portfolios | 3,000 |
| Media Items | 15,000 |
| Services | 3,000 |
| Pricing Tiers | 9,000 |
| Blog Posts | 100 |
| Blog Categories | 8 |
| Blog Tags | 15 |
| **TOTAL** | **~40,000+** |

## Running the Seed

### Prerequisites
1. Ensure PostgreSQL database is running
2. Database connection configured in `.env`
3. Prisma migrations are up to date

### Commands

```bash
# Navigate to backend directory
cd backend

# Run migrations if needed
npx prisma migrate dev

# Run the seed (this will take 2-5 minutes)
npm run seed
```

### Expected Output

You should see progress logs like:

```
🧹 Cleaning up database...
✅ Database cleaned
🌍 Creating countries and states...
✅ Countries and states created
📍 Creating cities...
✅ Cities created
🏠 Creating addresses...
✅ Addresses created
🏷️  Creating tags...
✅ Tags created
📂 Creating vendor categories...
✅ Vendor categories and service types created
👥 Creating user roles...
✅ Roles created
👤 Creating users...
  Creating 1000 vendor users in batches...
  ✓ Created user batch 1/10 (100 users)
  ✓ Created user batch 2/10 (200 users)
  ...
  ✓ Created user batch 10/10 (1000 users)
✅ Users created
🏪 Creating vendor profiles...
  Creating 1000 addresses for vendors...
  Creating 1000 vendor profiles in batches...
  ✓ Created profile batch 1/10 (100 profiles)
  ...
  ✓ Created profile batch 10/10 (1000 profiles)
✅ Vendor profiles created
🕐 Creating business hours for 1000 vendors...
  ✓ Created business hours batch 1/7
  ...
✅ Business hours created
🏷️  Assigning tags to 1000 vendors...
  ✓ Created vendor tag batch 1/3
  ...
✅ Vendor tags assigned
📍 Creating service areas for 1000 vendors...
  ✓ Created service area batch 1/3
  ...
✅ Service areas created
📸 Creating portfolios and media items for 1000 vendors...
  Creating portfolios in batches...
  ✓ Created portfolio batch 1/10 (300 portfolios)
  ...
  ✓ Created portfolio batch 10/10 (3000 portfolios)
  Creating media items in batches...
  ✓ Created media batch 1/15 (1000 items)
  ...
  ✓ Created media batch 15/15 (15000 items)
✅ Portfolios and media items created
💰 Creating services and pricing tiers for 1000 vendors...
  Creating services in batches...
  ✓ Created service batch 1/10 (300 services)
  ...
✅ Services and pricing tiers created
```

## Performance Benchmarks

Monitor these metrics during and after seeding:

### Database Metrics
- Total execution time (target: 2-5 minutes)
- Database size after seeding
- Index performance
- Query execution times

### API Performance Tests

After seeding, test these endpoints:

```bash
# Get all vendors (paginated)
GET /api/public/vendors?page=1&limit=20

# Get vendors by category
GET /api/public/vendors?categoryId={uuid}&page=1&limit=20

# Get media feed (discover page)
GET /api/public/media?page=1&limit=20

# Search vendors
GET /api/public/vendors/search?q=photography

# Get vendor details
GET /api/public/vendors/{slug}

# Get featured vendors
GET /api/public/vendors/featured
```

### Expected Performance Targets

With proper indexing:
- Vendor list queries: < 100ms
- Vendor detail queries: < 50ms
- Media feed queries: < 150ms
- Search queries: < 200ms

## Database Optimization

### Recommended Indexes

Ensure these indexes exist (should be in migrations):

```sql
-- Vendor profile indexes
CREATE INDEX idx_vendor_profile_category ON vendor_profiles(category_id);
CREATE INDEX idx_vendor_profile_status ON vendor_profiles(status);
CREATE INDEX idx_vendor_profile_featured ON vendor_profiles(featured_until);

-- Media item indexes
CREATE INDEX idx_media_item_portfolio ON media_items(portfolio_id);
CREATE INDEX idx_media_item_approved ON media_items(is_approved);

-- Portfolio indexes
CREATE INDEX idx_portfolio_vendor ON portfolios(vendor_profile_id);
CREATE INDEX idx_portfolio_featured ON portfolios(is_featured);

-- Service area indexes
CREATE INDEX idx_service_area_vendor ON service_areas(vendor_profile_id);
CREATE INDEX idx_service_area_city ON service_areas(city_id);
```

### Query Optimization

Monitor slow query log and add indexes as needed:

```bash
# Enable slow query logging in PostgreSQL
ALTER DATABASE your_db SET log_min_duration_statement = 100;

# View slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

## Troubleshooting

### Seed Takes Too Long
- Check database connection speed
- Ensure proper batch sizes (currently 100-1000)
- Monitor memory usage

### Out of Memory Errors
- Reduce batch sizes in seed file
- Increase Node.js heap size: `NODE_OPTIONS=--max-old-space-size=4096 npm run seed`

### Connection Timeouts
- Increase PostgreSQL connection timeout
- Check network latency to database
- Consider running seed closer to database (same network/region)

### Constraint Violations
- Ensure database is clean before seeding
- Run `npx prisma migrate reset` to reset database
- Check for unique constraint conflicts

## Next Steps

After successful seeding:

1. **Test Frontend Performance**
   - Load vendors page
   - Test category filtering
   - Test search functionality
   - Check discover page media loading
   - Monitor lazy loading behavior

2. **Monitor Backend Performance**
   - Check API response times
   - Monitor database query times
   - Review N+1 query issues
   - Check connection pool usage

3. **Optimize as Needed**
   - Add missing indexes
   - Implement caching (Redis)
   - Optimize database queries
   - Consider pagination improvements
   - Add query result caching

4. **Load Testing**
   - Use tools like Apache Bench, k6, or Artillery
   - Simulate concurrent users
   - Test peak load scenarios
   - Monitor resource usage

## Notes

- The seed file uses batched operations to prevent memory issues
- All data is randomly generated but realistic
- Images use Unsplash URLs (consider CDN for production)
- Vendor distribution is even across categories
- 90% of vendors are active, 10% pending review
- 5% of vendors are featured

## Cleanup

To reset the database and remove all seeded data:

```bash
# This will drop the database and recreate it
npx prisma migrate reset

# Or manually run seed again (it includes cleanup)
npm run seed
```
