// ============================================================================
// LEAD SERVICE TESTS - Lead Creation and Management
// ============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeadService } from './lead.service';
import { LeadRepository } from '../repositories/lead.repository';
import { ConversationService } from '../../messaging/services/conversation.service';
import { MessagingMessageService } from '../../messaging/services/message.service';
import { PrismaService } from '../../../core/database/prisma.service';

describe('LeadService', () => {
  let service: LeadService;
  let prismaService: PrismaService;

  const mockLead = {
    id: 'lead-123',
    vendorProfileId: 'vendor-123',
    plannerId: 'planner-123',
    status: 'NEW',
    source: 'DISCOVERY',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConversation = {
    id: 'conv-123',
    type: 'LEAD',
    leadId: 'lead-123',
    participants: [],
  };

  const mockPrismaService = {
    lead: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockLeadRepository = {
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockConversationService = {
    createLeadConversation: jest.fn(),
  };

  const mockMessagingMessageService = {
    sendMessage: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadService,
        { provide: LeadRepository, useValue: mockLeadRepository },
        { provide: ConversationService, useValue: mockConversationService },
        {
          provide: MessagingMessageService,
          useValue: mockMessagingMessageService,
        },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<LeadService>(LeadService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createLeadDto = {
      vendorProfileId: 'vendor-123',
      plannerId: 'planner-123',
      source: 'DISCOVERY' as any,
      initialMessage: 'Hello, I am interested in your services',
    };

    it('should create lead with conversation and message atomically', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(null);
      mockPrismaService.lead.create.mockResolvedValue(mockLead);
      mockPrismaService.conversation.create.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue({
        id: 'msg-123',
        content: createLeadDto.initialMessage,
      });

      const result = await service.create(createLeadDto);

      expect(result.id).toBe('lead-123');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.lead.create).toHaveBeenCalled();
      expect(mockPrismaService.conversation.create).toHaveBeenCalled();
      expect(mockPrismaService.message.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'lead.created',
        expect.any(Object),
      );
    });

    it('should prevent duplicate lead creation within 60 seconds', async () => {
      const existingLead = {
        ...mockLead,
        createdAt: new Date(),
        vendorProfile: { id: 'vendor-123', businessName: 'Test Vendor' },
        planner: { id: 'planner-123', email: 'test@example.com' },
      };

      mockPrismaService.lead.findFirst.mockResolvedValue(existingLead);

      const result = await service.create(createLeadDto);

      expect(result.id).toBe('lead-123');
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockPrismaService.lead.create).not.toHaveBeenCalled();
    });

    it('should rollback transaction if conversation creation fails', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(null);
      mockPrismaService.lead.create.mockResolvedValue(mockLead);
      mockPrismaService.conversation.create.mockRejectedValue(
        new Error('Conversation creation failed'),
      );

      await expect(service.create(createLeadDto)).rejects.toThrow();

      // Transaction should handle rollback automatically
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
