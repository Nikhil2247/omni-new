import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../../../core/auth/decorators/public.decorator';

@Controller('webhooks')
@Public()
export class WebhooksController {
  @Post()
  receive(@Body() payload: Record<string, unknown>) {
    return { received: true, payload };
  }
}
