import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    checkDependencies: jest.fn().mockResolvedValue({
      database: true,
      cache: true,
      search: true,
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API welcome payload', () => {
      expect(appController.getHello()).toEqual({
        message: 'Omnicassion API v2.0',
        docs: '/docs',
      });
    });
  });
});
