// ============================================================================
// Event Events - Event Classes
// ============================================================================

export class EventCreatedEvent {
  constructor(public readonly eventId: string) {}
}

export class EventUpdatedEvent {
  constructor(public readonly eventId: string) {}
}

export class EventDeletedEvent {
  constructor(public readonly eventId: string) {}
}
