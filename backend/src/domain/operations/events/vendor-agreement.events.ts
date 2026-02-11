// ============================================================================
// Vendor Agreement Events - Event Classes
// ============================================================================

export class VendorAgreementCreatedEvent {
  constructor(public readonly agreementId: string) {}
}

export class VendorAgreementUpdatedEvent {
  constructor(public readonly agreementId: string) {}
}

export class VendorAgreementSignedEvent {
  constructor(public readonly agreementId: string) {}
} 
