import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { ChatbotMessageDto, ChatbotResponseDto } from '../dto/chatbot.dto';
import { ChatbotService, ChatbotResponse } from '../services/chatbot.service';

@Public()
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @ApiOperation({ summary: 'Send a message to the chatbot' })
  @ApiResponse({ status: 200, type: ChatbotResponseDto })
  sendMessage(@Body() dto: ChatbotMessageDto): Promise<ChatbotResponse> {
    return this.chatbotService.respond(dto);
  }
}
