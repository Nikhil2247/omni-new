import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatbotContextDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  cityName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsString()
  eventType?: string;
}

export class ChatbotMessageHistoryDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatbotMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChatbotContextDto)
  context?: ChatbotContextDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatbotMessageHistoryDto)
  conversationHistory?: ChatbotMessageHistoryDto[];
}

export class ChatbotVendorSuggestionDto {
  @ApiProperty({ example: 'vendor-uuid' })
  id: string;

  @ApiProperty({ example: 'vendor-slug' })
  slug: string;

  @ApiProperty({ example: 'The Brilliant Studio' })
  businessName: string;

  @ApiPropertyOptional({ example: 'Professional photography since 2015' })
  tagline?: string;

  @ApiPropertyOptional({ example: 'Photography & Videography' })
  categoryName?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  city?: string;

  @ApiPropertyOptional({ example: 50000 })
  minPrice?: number;

  @ApiPropertyOptional({ example: 200000 })
  maxPrice?: number;

  @ApiPropertyOptional({ example: true })
  isVerified?: boolean;

  @ApiProperty({ example: '/vendors/the-brilliant-studio' })
  profileUrl: string;
}

export class ChatbotFollowUpQuestionDto {
  @ApiProperty({ example: 'category' })
  id: string;

  @ApiProperty({ example: 'What type of vendor do you need?' })
  text: string;

  @ApiProperty({ enum: ['category', 'location', 'budget', 'eventType', 'refinement'] })
  type: 'category' | 'location' | 'budget' | 'eventType' | 'refinement';
}

export class ChatbotResponseMetaDto {
  @ApiProperty({ example: 245 })
  responseTime: number;

  @ApiProperty({ example: 5 })
  vendorsFound: number;

  @ApiProperty({ example: false })
  hasMoreResults: boolean;
}

export class ChatbotResponseDto {
  @ApiProperty({ example: 'I found 5 photographers in Mumbai. Here are the top matches...' })
  reply: string;

  @ApiProperty({ example: 'FIND_VENDOR', enum: ['WELCOME', 'GENERAL', 'FIND_VENDOR'] })
  intent: string;

  @ApiProperty({
    type: [String],
    example: ['Show me more options', 'Only verified vendors', 'Filter by budget'],
  })
  suggestions: string[];

  @ApiProperty({ type: [ChatbotVendorSuggestionDto] })
  vendors: ChatbotVendorSuggestionDto[];

  @ApiProperty({ type: [ChatbotFollowUpQuestionDto] })
  followUpQuestions: ChatbotFollowUpQuestionDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      categoryId: { type: 'string' },
      categoryName: { type: 'string' },
      cityId: { type: 'string' },
      cityName: { type: 'string' },
      budgetMin: { type: 'number' },
      budgetMax: { type: 'number' },
      eventType: { type: 'string' },
    },
  })
  filters: ChatbotContextDto;

  @ApiProperty({ type: ChatbotResponseMetaDto })
  meta: ChatbotResponseMetaDto;
}
