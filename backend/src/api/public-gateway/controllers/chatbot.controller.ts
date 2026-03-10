import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../core/auth/decorators/public.decorator';
import {
  ChatbotMessageDto,
  ChatbotResponseDto,
  CreateConversationDto,
  UpdateConversationDto,
} from '../dto/chatbot.dto';
import { ChatbotService, ChatbotResponse } from '../services/chatbot.service';

@Public()
@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @ApiOperation({ summary: 'Send a message to the chatbot' })
  @ApiResponse({ status: 200, type: ChatbotResponseDto })
  sendMessage(@Body() dto: ChatbotMessageDto): Promise<ChatbotResponse> {
    return this.chatbotService.respond(dto);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get persisted chatbot history for a user (legacy)' })
  getHistory(@Param('userId') userId: string) {
    return this.chatbotService.getUserHistory(userId);
  }

  // ==================== Conversation Management ====================

  @Get('conversations/:userId')
  @ApiOperation({ summary: 'Get all conversations for a user' })
  async getConversations(@Param('userId') userId: string) {
    const conversations = await this.chatbotService.getConversations(userId);
    return { success: true, data: conversations };
  }

  @Get('conversations/:userId/:conversationId')
  @ApiOperation({ summary: 'Get a specific conversation with messages' })
  async getConversation(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const conversation = await this.chatbotService.getConversation(
      conversationId,
      userId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return { success: true, data: conversation };
  }

  @Post('conversations/:userId')
  @ApiOperation({ summary: 'Create a new conversation' })
  async createConversation(
    @Param('userId') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    const conversation = await this.chatbotService.createConversation(
      userId,
      dto.title,
    );

    if (!conversation) {
      throw new NotFoundException('Failed to create conversation');
    }

    return { success: true, data: conversation };
  }

  @Patch('conversations/:userId/:conversationId')
  @ApiOperation({ summary: 'Update conversation title' })
  async updateConversation(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: UpdateConversationDto,
  ) {
    const success = await this.chatbotService.updateConversationTitle(
      conversationId,
      userId,
      dto.title,
    );

    if (!success) {
      throw new NotFoundException('Conversation not found');
    }

    return { success: true };
  }

  @Delete('conversations/:userId/:conversationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a conversation' })
  async deleteConversation(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const success = await this.chatbotService.deleteConversation(
      conversationId,
      userId,
    );

    if (!success) {
      throw new NotFoundException('Conversation not found');
    }

    return { success: true };
  }

  @Post('conversations/:userId/:conversationId/clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all messages in a conversation' })
  async clearConversation(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const success = await this.chatbotService.clearConversation(
      conversationId,
      userId,
    );

    if (!success) {
      throw new NotFoundException('Conversation not found');
    }

    return { success: true };
  }
}
