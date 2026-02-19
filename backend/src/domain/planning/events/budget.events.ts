// ============================================================================
// Budget Events - Event Classes
// ============================================================================

export class BudgetCreatedEvent {
  constructor(public readonly budgetId: string) {}
}

export class BudgetUpdatedEvent {
  constructor(public readonly budgetId: string) {}
}

export class BudgetItemAddedEvent {
  constructor(
    public readonly budgetId: string,
    public readonly itemId: string,
  ) {}
}

export class BudgetExceededEvent {
  constructor(public readonly budgetId: string) {}
}
