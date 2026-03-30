// ============================================================================
// REQUIREMENT ENUMS - Operations Domain
// ============================================================================

export enum RequirementStatus {
  PENDING = 'PENDING',
  SOURCING = 'SOURCING',
  VENDOR_SELECTED = 'VENDOR_SELECTED',
  CONTRACTED = 'CONTRACTED',
  FULFILLED = 'FULFILLED',
}

export enum ClientApprovalStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
