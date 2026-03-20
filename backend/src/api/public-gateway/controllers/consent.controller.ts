// ============================================================================
// PUBLIC CONSENT CONTROLLER - Public Gateway
// ============================================================================
// Public endpoints for consent definitions (no authentication required)
// ============================================================================

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ConsentService } from '../../../domain/operations/services/consent.service';
import { ConsentType } from '@prisma/client';

@Controller('consents')
export class PublicConsentController {
  constructor(private readonly consentService: ConsentService) {}

  /**
   * Get all active consent definitions for users
   * Used by signup/registration flows
   */
  @Get('definitions/users')
  async getUserConsentDefinitions() {
    const definitions = await this.consentService.getUserConsentDefinitions();
    return {
      required: definitions.filter((d) => d.isRequired),
      optional: definitions.filter((d) => !d.isRequired),
    };
  }

  /**
   * Get all active consent definitions for vendors
   * Used by vendor registration/onboarding flows
   */
  @Get('definitions/vendors')
  async getVendorConsentDefinitions() {
    const definitions = await this.consentService.getVendorConsentDefinitions();
    return {
      required: definitions.filter((d) => d.isRequired),
      optional: definitions.filter((d) => !d.isRequired),
    };
  }

  /**
   * Get required consent definitions only (for quick validation)
   */
  @Get('definitions/required')
  async getRequiredConsentDefinitions(
    @Query('type') type: 'user' | 'vendor' = 'user',
  ) {
    if (type === 'vendor') {
      return this.consentService.getRequiredVendorConsentDefinitions();
    }
    return this.consentService.getRequiredUserConsentDefinitions();
  }

  /**
   * Get a specific consent definition by type
   * Returns the latest active version
   */
  @Get('definitions/type/:consentType')
  async getConsentDefinitionByType(
    @Param('consentType') consentType: ConsentType,
    @Query('version') version?: string,
  ) {
    return this.consentService.getConsentDefinition(consentType, version);
  }

  /**
   * Get a specific consent definition by ID
   */
  @Get('definitions/:id')
  async getConsentDefinitionById(@Param('id') id: string) {
    return this.consentService.getConsentDefinitionById(id);
  }
}
