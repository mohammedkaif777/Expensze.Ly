export const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Education",
  "Travel",
  "Subscriptions",
  "Other",
];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Housing: "#8b5cf6",
  Utilities: "#06b6d4",
  Entertainment: "#ec4899",
  Healthcare: "#ef4444",
  Shopping: "#eab308",
  Education: "#10b981",
  Travel: "#14b8a6",
  Subscriptions: "#6366f1",
  Other: "#64748b",
};

export const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY"];

export const categoryColor = (category: string) =>
  CATEGORY_COLORS[category] || "#64748b";

export const frequencyLabel = (frequency: string) =>
  frequency.charAt(0).toUpperCase() + frequency.slice(1);