import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { ChatbotMessageDto } from '../dto/chatbot.dto';
import { ChatbotService, ChatbotResponse } from '../services/chatbot.service';

@Public()
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  sendMessage(@Body() dto: ChatbotMessageDto): Promise<ChatbotResponse> {
    return this.chatbotService.respond(dto);
  }
}
