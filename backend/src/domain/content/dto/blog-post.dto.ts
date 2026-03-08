// ============================================================================
// BLOG POST DTOs - Content Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum BlogStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum BlogPostSortBy {
  LATEST = 'latest',
  MOST_VIEWED = 'mostViewed',
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateBlogPostDto {
  @ApiProperty({
    description: 'Post title',
    example: 'Top 10 Wedding Photographers in Mumbai',
  })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'URL slug (auto-generated if not provided)',
    example: 'top-10-wedding-photographers-mumbai',
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Short excerpt',
    example: 'Discover the best wedding photographers...',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @ApiProperty({ description: 'Full content (Markdown/HTML)' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Meta title for SEO', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Meta description for SEO',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'Focus keyword', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  focusKeyword?: string;

  @ApiPropertyOptional({ description: 'Keywords array', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: 'Open Graph image URL', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImage?: string;

  @ApiPropertyOptional({ description: 'Featured image URL', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  featuredImage?: string;

  @ApiPropertyOptional({
    description: 'Featured image alt text',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 125) : value,
  )
  @IsString()
  @MaxLength(125)
  featuredImageAlt?: string;

  @ApiPropertyOptional({ description: 'Category ID', nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Tag IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    description: 'Vendor ID (for vendor spotlight)',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Reading time in minutes', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  readingTime?: number;
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateBlogPostDto {
  @ApiPropertyOptional({ description: 'Post title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'URL slug' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  slug?: string;

  @ApiPropertyOptional({ description: 'Short excerpt', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Full content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Meta title', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'Meta description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'Focus keyword', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  focusKeyword?: string;

  @ApiPropertyOptional({ description: 'Keywords array' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: 'Open Graph image URL', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImage?: string;

  @ApiPropertyOptional({ description: 'Featured image URL', nullable: true })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional({
    description: 'Featured image alt text',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 125) : value,
  )
  @IsString()
  @MaxLength(125)
  featuredImageAlt?: string;

  @ApiPropertyOptional({ description: 'Status', enum: BlogStatus })
  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @ApiPropertyOptional({ description: 'Category ID', nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Tag IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'Vendor ID', nullable: true })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Reading time' })
  @IsOptional()
  @IsInt()
  @Min(1)
  readingTime?: number;
}

// ============================================================================
// SEARCH DTOs
// ============================================================================

export class SearchBlogPostsDto {
  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: BlogStatus })
  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by tag ID' })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiPropertyOptional({ description: 'Search by keyword' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Sort blog posts',
    enum: BlogPostSortBy,
    default: BlogPostSortBy.LATEST,
  })
  @IsOptional()
  @IsEnum(BlogPostSortBy)
  sortBy?: BlogPostSortBy;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class BlogPostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Title' })
  title: string;

  @ApiProperty({ description: 'URL slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Excerpt', nullable: true })
  excerpt: string | null;

  @ApiProperty({ description: 'Content' })
  content: string;

  @ApiPropertyOptional({ description: 'Meta title', nullable: true })
  metaTitle: string | null;

  @ApiPropertyOptional({ description: 'Meta description', nullable: true })
  metaDescription: string | null;

  @ApiPropertyOptional({ description: 'Focus keyword', nullable: true })
  focusKeyword: string | null;

  @ApiProperty({ description: 'Keywords', type: [String] })
  keywords: string[];

  @ApiPropertyOptional({ description: 'Featured image', nullable: true })
  featuredImage: string | null;

  @ApiPropertyOptional({ description: 'Featured image alt', nullable: true })
  featuredImageAlt: string | null;

  @ApiProperty({ description: 'Status', enum: BlogStatus })
  status: BlogStatus;

  @ApiPropertyOptional({ description: 'Published at', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ description: 'Author ID' })
  authorId: string;

  @ApiPropertyOptional({ description: 'Category ID', nullable: true })
  categoryId: string | null;

  @ApiProperty({ description: 'View count' })
  viewCount: number;

  @ApiProperty({ description: 'Reading time (minutes)' })
  readingTime: number;

  @ApiPropertyOptional({ description: 'Vendor ID', nullable: true })
  vendorId: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}
