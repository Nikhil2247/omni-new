// ============================================================================
// Operational Task Events - Event Classes
// ============================================================================

export class OperationalTaskCreatedEvent {
  constructor(public readonly taskId: string) {}
}

export class OperationalTaskUpdatedEvent {
  constructor(public readonly taskId: string) {}
}

export class OperationalTaskCompletedEvent {
  constructor(public readonly taskId: string) {}
} 
