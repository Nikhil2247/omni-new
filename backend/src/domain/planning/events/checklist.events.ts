// ============================================================================
// Checklist Events - Event Classes
// ============================================================================

export class ChecklistCreatedEvent {
  constructor(public readonly checklistId: string) {}
}

export class ChecklistUpdatedEvent {
  constructor(public readonly checklistId: string) {}
}

export class ChecklistItemCompletedEvent {
  constructor(public readonly checklistId: string, public readonly itemId: string) {}
} 
