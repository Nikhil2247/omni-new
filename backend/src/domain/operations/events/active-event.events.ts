// ============================================================================
// Active Event Events - Event Classes
// ============================================================================

export class ActiveEventCreatedEvent {
  constructor(public readonly activeEventId: string) {}
}

export class ActiveEventUpdatedEvent {
  constructor(public readonly activeEventId: string) {}
}

export class ActiveEventDeletedEvent {
  constructor(public readonly activeEventId: string) {}
}
