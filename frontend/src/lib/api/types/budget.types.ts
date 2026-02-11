export interface BudgetItem {
  id: string
  budgetId: string
  category: string
  name: string
  estimatedCost?: number | null
  actualCost?: number | null
  isPaid: boolean
  notes?: string | null
  createdAt: string
}

export interface Budget {
  id: string
  eventId: string
  totalBudget: number
  totalSpent: number
  remaining: number
  createdAt: string
  updatedAt: string
  items?: BudgetItem[]
}

export interface CreateBudgetInput {
  eventId: string
  totalBudget: number
}

export interface UpdateBudgetInput {
  totalBudget?: number
}

export interface CreateBudgetItemInput {
  category: string
  name: string
  estimatedCost?: number
  actualCost?: number
  isPaid?: boolean
  notes?: string
}

export interface UpdateBudgetItemInput {
  category?: string
  name?: string
  estimatedCost?: number
  actualCost?: number
  isPaid?: boolean
  notes?: string
}
