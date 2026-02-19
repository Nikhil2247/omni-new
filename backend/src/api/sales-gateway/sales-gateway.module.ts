import { Module } from '@nestjs/common';
import { LeadsController } from './controllers/leads.controller';
import { AcquisitionsController } from './controllers/acquisitions.controller';
import { PartnershipsController } from './controllers/partnerships.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { LeadsModule } from '../../domain/leads/leads.module';

@Module({
  imports: [LeadsModule],
  controllers: [
    LeadsController,
    AcquisitionsController,
    PartnershipsController,
    AnalyticsController,
  ],
})
export class SalesGatewayModule {}
