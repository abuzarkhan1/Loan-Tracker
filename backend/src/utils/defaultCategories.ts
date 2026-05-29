export const defaultExpenseCategories = [
  { name: "Food", icon: "utensils", color: "#f36f56" },
  { name: "Transport", icon: "car", color: "#8a6d1f" },
  { name: "Rent", icon: "home", color: "#1b7d62" },
  { name: "Bills", icon: "receipt", color: "#d95441" },
  { name: "Shopping", icon: "shopping-bag", color: "#f59e0b" },
  { name: "Health", icon: "heart-pulse", color: "#16a34a" },
  { name: "Education", icon: "book-open", color: "#2563eb" },
  { name: "Family", icon: "users", color: "#7c3aed" },
  { name: "Mobile/Internet", icon: "smartphone", color: "#0891b2" },
  { name: "Business", icon: "briefcase", color: "#475569" },
  { name: "Other", icon: "circle", color: "#64748b" },
] as const;

export const defaultIncomeCategories = [
  { name: "Salary", icon: "wallet", color: "#1b7d62" },
  { name: "Freelance", icon: "laptop", color: "#2563eb" },
  { name: "Business", icon: "briefcase", color: "#8a6d1f" },
  { name: "Gift", icon: "gift", color: "#f36f56" },
  { name: "Other Income", icon: "plus-circle", color: "#64748b" },
] as const;

export const defaultCategories = [
  ...defaultExpenseCategories.map((category) => ({ ...category, type: "EXPENSE" as const })),
  ...defaultIncomeCategories.map((category) => ({ ...category, type: "INCOME" as const })),
] as const;
