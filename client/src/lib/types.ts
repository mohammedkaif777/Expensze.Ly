export interface User {
  id: string;
  name: string;
  email: string;
  defaultCurrency: string;
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Category {
  name: string;
  color: string;
}

export interface CategorySpending {
  category: string;
  total: number;
  count: number;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string;
  alertThreshold: number;
  spent: number;
  percent: number;
  status: "exceeded" | "warning" | "ok";
}

export interface RecurringExpense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextDueDate: string;
  active: boolean;
  lastGenerated: string | null;
}

export interface BudgetSummaryItem {
  category: string;
  monthlyLimit: number;
  spent: number;
  percent: number;
  status: "exceeded" | "warning" | "ok";
  alertThreshold: number;
}

export interface DashboardData {
  metrics: {
    currentTotal: number;
    prevTotal: number;
    change: number | null;
    currentCount: number;
    prevCount: number;
  };
  byCategory: CategorySpending[];
  monthlySpend: { _id: string; total: number }[];
  recentExpenses: Expense[];
  budgetSummary: BudgetSummaryItem[];
  recurring: {
    items: number;
    monthlyTotal: number;
  };
}