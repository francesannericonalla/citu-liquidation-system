export const DEFAULT_EXPENSE_CATEGORIES = [
  "Registration",
  "Accommodation",
  "Meals/Foods/Snacks",
  "Supplies",
  "Documentation",
  "Transportation",
  "Others",
] as const;

export type DefaultExpenseCategory =
  (typeof DEFAULT_EXPENSE_CATEGORIES)[number];
