// ============================================================================
// MAIN BOOTSTRAP - Application Entry Point
// ============================================================================
// Configures security, validation, documentation, and starts the server
// ============================================================================

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
// csurf removed — JWT Bearer-token API does not require CSRF protection
import { AppModule } from './app.module';
import { createRedisIoAdapter } from './infrastructure/websockets/redis-io.adapter';
import { CustomIoAdapter } from './infrastructure/websockets/custom-io.adapter';
import { IdempotencyInterceptor } from './infrastructure/idempotency/idempotency.interceptor';
import { IdempotencyService } from './infrastructure/idempotency/idempotency.service';
import { EmailService } from './infrastructure/notifications/email.service';
import { initializeSentry } from './infrastructure/monitoring/sentry.config';

// Initialize Sentry as early as possible
const sentryDsn = process.env.SENTRY_DSN;
const nodeEnv = process.env.NODE_ENV || 'development';
if (sentryDsn) {
  initializeSentry(sentryDsn, nodeEnv);
}

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
}

if (!process.env.PRISMA_QUERY_ENGINE_TYPE) {
  process.env.PRISMA_QUERY_ENGINE_TYPE = 'binary';
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const parseBoolean = (
    value: string | boolean | undefined,
    defaultValue: boolean,
  ): boolean => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;

    const normalized = value.toString().trim().toLowerCase();
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'on'
    );
  };

  // Create application with Express platform
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  let closeWebSocketAdapter: (() => Promise<void>) | null = null;

  // ===========================================================================
  // WEBSOCKET ADAPTER CONFIGURATION
  // ===========================================================================
  const enableWebSocketRedis = configService.get<boolean>(
    'WEBSOCKET_REDIS_ADAPTER',
    false,
  );
  if (enableWebSocketRedis) {
    try {
      const redisIoAdapter = await createRedisIoAdapter(app);
      app.useWebSocketAdapter(redisIoAdapter);
      closeWebSocketAdapter = async () => {
        await redisIoAdapter.close();
      };
      logger.log('WebSocket Redis adapter enabled for horizontal scaling');
    } catch (error) {
      logger.warn(
        'Failed to initialize WebSocket Redis adapter, falling back to default',
      );
      // Fallback to default Socket.IO adapter
      const fallbackAdapter = new IoAdapter(app);
      app.useWebSocketAdapter(fallbackAdapter);
    }
  } else {
    // Use custom Socket.IO adapter with path configuration
    const customAdapter = new CustomIoAdapter(app, configService);
    app.useWebSocketAdapter(customAdapter);
    logger.log('WebSocket adapter initialized (Socket.IO) with custom path');
  }

  // ===========================================================================
  // GLOBAL INTERCEPTORS
  // ===========================================================================
  // Idempotency interceptor - prevents duplicate processing of mutations
  const idempotencyService = app.get(IdempotencyService);
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new IdempotencyInterceptor(idempotencyService, reflector),
  );

  // ===========================================================================
  // SECURITY CONFIGURATION (ADR-011)
  // ===========================================================================

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for Swagger UI
    }),
  );

  // CORS - Strict origin whitelist
  const allowedOrigins = configService
    .get<string>('CORS_ORIGINS')
    ?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://omnicassion.com',
    'https://www.omnicassion.com',
    'https://backend.omnicassion.com',
  ];

  const isDevelopment = configService.get('NODE_ENV') === 'development';

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // In development, allow all localhost origins for easier debugging
      if (isDevelopment && (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      )) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Request-ID',
      'X-Idempotency-Key',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
    ],
    maxAge: 86400, // 24 hours
  });

  // ===========================================================================
  // PERFORMANCE CONFIGURATION
  // ===========================================================================

  // Compression
  app.use(compression());

  // Request size limits with raw body preservation for webhook signature verification
  // Raw body is needed for verifying webhook signatures (e.g., Razorpay, Stripe)
  app.useBodyParser('json', {
    limit: '10mb',
    verify: (req: any, _res: any, buf: Buffer) => {
      // Preserve raw body for webhook routes
      if (req.originalUrl?.includes('/webhooks/')) {
        req.rawBody = buf;
      }
    },
  });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });

  // Trust proxy (for rate limiting behind load balancer)
  app.set('trust proxy', 1);

  // ===========================================================================
  // CSRF PROTECTION
  // ===========================================================================

  // Cookie parser (used for cookie-based session reading)
  app.use(cookieParser());

  // CSRF protection is NOT applicable for a stateless JWT API.
  // CSRF attacks exploit cookie-based session auth; this API uses
  // Authorization: Bearer headers which cannot be sent cross-origin.
  logger.log('CSRF protection skipped — stateless JWT API');

  // ===========================================================================
  // VALIDATION CONFIGURATION (ADR-011)
  // ===========================================================================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
    }),
  );

  // ===========================================================================
  // API VERSIONING
  // ===========================================================================

  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  //   prefix: 'v',
  // })

  // Global prefix for all routes
  app.setGlobalPrefix('api', {
    exclude: ['health', 'ready'],
  });

  // ===========================================================================
  // SWAGGER/OPENAPI DOCUMENTATION
  // ===========================================================================

  if (configService.get('NODE_ENV') !== 'production') {
    // Main API Documentation
    const mainConfig = new DocumentBuilder()
      .setTitle('Omnicassion API')
      .setDescription('Omnicassion V2.0 - Event Planning Ecosystem API')
      .setVersion('2.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key for public endpoints',
        },
        'API-Key',
      )
      .addTag('Admin', 'System administration endpoints')
      .addTag('Operations', 'Operations team endpoints')
      .addTag('Marketing', 'Marketing team endpoints')
      .addTag('Sales', 'Sales team endpoints')
      .addTag('Business', 'Vendor/Business admin endpoints')
      .addTag('User', 'End user/planner endpoints')
      .addTag('Public', 'Public API endpoints')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, mainConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });

    logger.log('Swagger documentation available at /docs');
  }

  // ===========================================================================
  // GRACEFUL SHUTDOWN
  // ===========================================================================

  app.enableShutdownHooks();

  let isShuttingDown = false;
  const shutdown = async (signal: 'SIGTERM' | 'SIGINT') => {
    if (isShuttingDown) {
      logger.warn(`Received ${signal} during ongoing shutdown, ignoring`);
      return;
    }

    isShuttingDown = true;
    logger.log(`${signal} received, shutting down gracefully...`);

    const forceShutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 10000);

    try {
      if (closeWebSocketAdapter) {
        logger.log('Closing WebSocket adapter connections...');
        await closeWebSocketAdapter();
      }

      await app.close();
      clearTimeout(forceShutdownTimeout);
      logger.log('Application shutdown complete');
      process.exit(0);
    } catch (error) {
      clearTimeout(forceShutdownTimeout);
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  // ===========================================================================
  // START SERVER
  // ===========================================================================

  const port = configService.get<number>('PORT') || 3001;
  const host = configService.get<string>('HOST') || '0.0.0.0';

  // ===========================================================================
  // EMAIL SERVER CONNECTIVITY
  // ===========================================================================

  const emailService = app.get(EmailService);
  const emailProvider = configService.get<string>('EMAIL_PROVIDER', 'smtp');
  const smtpHost = configService.get<string>('SMTP_HOST', 'localhost');
  const smtpPortRaw = configService.get<string | number>('SMTP_PORT', 587);
  const smtpPort =
    typeof smtpPortRaw === 'number' ? smtpPortRaw : Number(smtpPortRaw) || 587;
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const shouldVerifyEmailOnStartup = parseBoolean(
    configService.get<string | boolean>('EMAIL_VERIFY_ON_STARTUP'),
    nodeEnv === 'production',
  );

  if (!shouldVerifyEmailOnStartup) {
    logger.log(
      `📧 Email server startup check skipped (${emailProvider}: ${smtpHost}:${smtpPort})`,
    );
  } else {
    const emailStatus = await emailService.verifyConnectionWithDetails();

    if (emailStatus.connected) {
      logger.log(
        `📧 Email server connected (${emailProvider}: ${smtpHost}:${smtpPort})`,
      );
    } else {
      const emailError = emailStatus.error ? ` - ${emailStatus.error}` : '';
      logger.warn(
        `📧 Email server connection failed (${emailProvider}: ${smtpHost}:${smtpPort})${emailError}`,
      );
    }
  }

  await app.listen(port, host);

  logger.log(`🚀 Application running on: http://${host}:${port}`);
  logger.log(`📚 API Documentation: http://${host}:${port}/docs`);
  logger.log(`🏥 Health Check: http://${host}:${port}/health`);
  logger.log(`Environment: ${configService.get('NODE_ENV') || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
