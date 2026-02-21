# MongoDB to PostgreSQL Migration Guide

This guide explains how to migrate data from the old MongoDB-based Omnicassion system to the new PostgreSQL-based system.

## Prerequisites

1. **Node.js** (v18+)
2. **MongoDB backup file** at `D:\backup\backup-20-02-2026.gz`
3. **PostgreSQL database** running and configured in `.env`
4. **Prisma migrations** applied to the new database

## Migration Overview

The migration will:
- Extract users, vendor profiles, reviews from MongoDB
- Create new users with password: `Password123!`
- Map old roles to new roles
- Create vendor profiles with portfolios
- Migrate portfolio photos as MediaItems
- Create vendor tags and services

## Step 1: Install Dependencies

```bash
cd D:\omnicassion\omni-new\backend
npm install bson tar
```

## Step 2: Ensure Database is Ready

Make sure your PostgreSQL database has the schema:

```bash
npx prisma migrate deploy
```

## Step 3: Extract MongoDB Backup

**Option A: Using Node.js script (Recommended)**

```bash
npm run migrate:extract
```

**Option B: Using batch script (Windows)**

```bash
scripts\extract-mongo-backup.bat
```

**Option C: Manual extraction with MongoDB Tools**

If you have MongoDB Database Tools installed:

```bash
# Extract the gzip
tar -xzf D:\backup\backup-20-02-2026.gz -C D:\backup\extracted

# Convert BSON to JSON
cd D:\backup\extracted\dump\omnicassion
bsondump --outFile=User.json User.bson
bsondump --outFile=VendorProfile.json VendorProfile.bson
bsondump --outFile=Review.json Review.bson
```

## Step 4: Run Migration

```bash
npm run migrate:mongodb
```

Or run everything at once:

```bash
npm run migrate:full
```

## What Gets Migrated

### Users
| Old Field | New Field |
|-----------|-----------|
| `_id` | `id` (new UUID) |
| `name` | `firstName`, `lastName` |
| `email` | `email` |
| `password` | `passwordHash` = bcrypt("Password123!") |
| `role` | `userRoles` (via junction table) |

### Roles Mapping
| Old Role | New Role |
|----------|----------|
| `ADMIN` | `ADMIN_SYSTEM` |
| `USER` | `PLANNER` |
| `VENDOR` | `VENDOR` |
| `MANAGER` | `OPERATIONAL_ADMIN` |

### Vendor Profiles
| Old Field | New Field |
|-----------|-----------|
| `_id` | `id` (new UUID) |
| `userId` | `userId` (mapped UUID) |
| `name` | `businessName` |
| `slug` | `slug` |
| `profilePhoto` | `profilePhotoUrl` |
| `shortDescription` | `tagline` |
| `description` | `description` |
| `category` | `categoryId` (lookup) |
| `featured` | `featuredUntil` (1 year from now) |
| `photos[]` | Portfolio -> MediaItem[] |
| `tags[]` | VendorTag[] |
| `startingPackage` | Service with `startingPrice` |

### Categories Created
- Photography
- Videography
- Catering
- Venues
- Florists
- Decor
- DJ & Music
- Makeup & Hair
- Wedding Planning
- Cakes
- Invitations
- Rentals
- Other

## Post-Migration Steps

1. **Notify Users**: All passwords are set to `Password123!`
   - Users should change passwords on first login
   - Consider sending password reset emails

2. **Verify Data**: Check migrated data in the database
   ```sql
   SELECT COUNT(*) FROM public.users;
   SELECT COUNT(*) FROM catalog.vendor_profiles;
   SELECT COUNT(*) FROM catalog.portfolios;
   SELECT COUNT(*) FROM catalog.media_items;
   ```

3. **Update Image URLs**: If image URLs have changed, update:
   - `profilePhotoUrl` in `vendor_profiles`
   - `url` in `media_items`

4. **Rebuild Search Index**: Re-index vendors in Meilisearch
   ```bash
   npm run seed:search
   ```

## Troubleshooting

### "BSON file found" error
The script found BSON files but couldn't read them. Run the extraction first:
```bash
npm run migrate:extract
```

### "User not found" warnings
Some vendor profiles reference users that don't exist. These are skipped.

### Duplicate slug errors
Slugs are made unique by appending timestamps if duplicates exist.

### Database connection errors
Check your `.env` file has correct `DATABASE_URL`.

## Rollback

To rollback the migration, you can:

1. Delete migrated data:
```sql
-- WARNING: This deletes ALL data!
TRUNCATE catalog.media_items CASCADE;
TRUNCATE catalog.portfolios CASCADE;
TRUNCATE catalog.vendor_profiles CASCADE;
TRUNCATE public.user_role_assignments CASCADE;
TRUNCATE public.users CASCADE;
```

2. Or restore from a PostgreSQL backup if you made one before migration.

## Files Created

- `scripts/migrate-mongodb-to-postgres.ts` - Main migration script
- `scripts/extract-bson-to-json.ts` - BSON extractor
- `scripts/extract-mongo-backup.bat` - Windows batch extractor
- `scripts/MIGRATION_README.md` - This file

## Support

If you encounter issues, check:
1. MongoDB backup file exists at the specified path
2. PostgreSQL database is accessible
3. All Prisma migrations are applied
4. Required npm packages are installed
