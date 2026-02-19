// ============================================================================
// BUSINESS GATEWAY - Messaging Controller
// ============================================================================

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { ConversationService } from '../../../domain/messaging/services/conversation.service';
import { MessagingMessageService } from '../../../domain/messaging/services/message.service';
import {
  CreateDirectConversationDto,
  GetConversationsDto,
} from '../../../domain/messaging/dto/conversation.dto';
import {
  AddReactionDto,
  DeleteMessageDto,
  GetConversationMessagesDto,
  MarkReadDto,
  SendMessageDto,
} from '../../../domain/messaging/dto/message.dto';

@Controller('messaging')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class MessagingController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessagingMessageService,
  ) {}

  @Post('conversations/direct')
  createDirectConversation(
    @Body() dto: CreateDirectConversationDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.conversationService.createDirectConversation(
      user.id,
      dto.participantUserId,
    );
  }

  @Get('conversations')
  listConversations(
    @Query() query: GetConversationsDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.conversationService.getUserConversations(
      user.id,
      query.page,
      query.limit,
    );
  }

  @Get('conversations/:id')
  getConversation(
    @Param('id') conversationId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.conversationService.getConversationById(
      conversationId,
      user.id,
    );
  }

  @Get('conversations/:id/messages')
  listMessages(
    @Param('id') conversationId: string,
    @Query() query: GetConversationMessagesDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.messageService.getMessages(
      user.id,
      conversationId,
      query.page,
      query.limit,
    );
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.messageService.sendMessage(user.id, {
      ...dto,
      conversationId,
    });
  }

  @Post('messages/:id/read')
  markRead(
    @Param('id') messageId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const dto: MarkReadDto = { messageId };
    return this.messageService.markRead(user.id, dto.messageId);
  }

  @Post('messages/:id/reactions')
  addReaction(
    @Param('id') messageId: string,
    @Body() dto: AddReactionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.messageService.addReaction(user.id, messageId, dto.emoji);
  }

  @Delete('messages/:id')
  deleteMessage(
    @Param('id') messageId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const dto: DeleteMessageDto = { messageId };
    return this.messageService.deleteForUser(user.id, dto.messageId);
  }
}
