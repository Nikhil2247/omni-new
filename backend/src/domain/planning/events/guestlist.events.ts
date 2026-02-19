// ============================================================================
// Guestlist Events - Event Classes
// ============================================================================

export class GuestlistCreatedEvent {
  constructor(public readonly guestlistId: string) {}
}

export class GuestlistUpdatedEvent {
  constructor(public readonly guestlistId: string) {}
}

export class GuestAddedEvent {
  constructor(
    public readonly guestlistId: string,
    public readonly guestId: string,
  ) {}
}

export class RSVPUpdatedEvent {
  constructor(
    public readonly guestlistId: string,
    public readonly guestId: string,
  ) {}
}
