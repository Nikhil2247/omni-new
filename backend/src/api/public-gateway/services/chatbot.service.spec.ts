import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from './chatbot.service';
import { ChatbotDomainService } from '../../../domain/chatbot/services/chatbot-domain.service';

describe('ChatbotService', () => {
  let service: ChatbotService;
  const chatbotDomainService = {
    respond: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: ChatbotDomainService,
          useValue: chatbotDomainService,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    jest.clearAllMocks();
  });

  it('forwards session fields to domain service', async () => {
    chatbotDomainService.respond.mockResolvedValue({ intent: 'GENERAL' });

    await service.respond({
      message: 'find photographers in mumbai',
      userId: 'user-1',
      sessionId: 'session-1',
      resetSession: true,
      context: { cityName: 'Mumbai' },
      conversationHistory: [{ role: 'user', content: 'hello' }],
    } as any);

    expect(chatbotDomainService.respond).toHaveBeenCalledWith({
      message: 'find photographers in mumbai',
      userId: 'user-1',
      sessionId: 'session-1',
      resetSession: true,
      context: { cityName: 'Mumbai' },
      conversationHistory: [{ role: 'user', content: 'hello' }],
    });
  });
});
