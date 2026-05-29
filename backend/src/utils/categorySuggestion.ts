import { PaymentMethod } from "../constants/enums";

export type CategorySuggestionInput = {
  text?: string;
  amount?: number;
  type: "INCOME" | "EXPENSE";
};

export const defaultCategoryRules = [
  { keywords: ["petrol", "fuel", "transport", "uber", "careem"], type: "EXPENSE", categoryName: "Transport", paymentMethod: PaymentMethod.CASH },
  { keywords: ["food", "lunch", "dinner", "breakfast", "restaurant", "kfc"], type: "EXPENSE", categoryName: "Food", paymentMethod: PaymentMethod.CASH },
  { keywords: ["rent", "kiraya"], type: "EXPENSE", categoryName: "Rent", paymentMethod: PaymentMethod.BANK },
  { keywords: ["medicine", "doctor", "health"], type: "EXPENSE", categoryName: "Health", paymentMethod: PaymentMethod.CASH },
  { keywords: ["school", "fee", "course", "education"], type: "EXPENSE", categoryName: "Education", paymentMethod: PaymentMethod.BANK },
  { keywords: ["jazz", "zong", "mobile", "internet", "package"], type: "EXPENSE", categoryName: "Mobile/Internet", paymentMethod: PaymentMethod.JAZZCASH },
  { keywords: ["electricity", "gas", "water", "bill"], type: "EXPENSE", categoryName: "Bills", paymentMethod: PaymentMethod.BANK },
  { keywords: ["shopping", "clothes"], type: "EXPENSE", categoryName: "Shopping", paymentMethod: PaymentMethod.CASH },
  { keywords: ["salary", "tankhwa"], type: "INCOME", categoryName: "Salary", paymentMethod: PaymentMethod.BANK },
  { keywords: ["freelance", "client"], type: "INCOME", categoryName: "Freelance", paymentMethod: PaymentMethod.BANK },
  { keywords: ["business"], type: "INCOME", categoryName: "Business", paymentMethod: PaymentMethod.CASH },
  { keywords: ["gift"], type: "INCOME", categoryName: "Gift", paymentMethod: PaymentMethod.CASH },
] as const;

export const suggestDefaultCategory = ({ text = "", type }: CategorySuggestionInput) => {
  const lower = text.toLowerCase();
  const rule = defaultCategoryRules.find((item) => item.type === type && item.keywords.some((keyword) => lower.includes(keyword)));
  if (!rule) {
    return {
      categoryName: type === "EXPENSE" ? "Other" : "Other Income",
      paymentMethod: PaymentMethod.CASH,
      confidence: 0.45,
      reason: "Used fallback category",
    };
  }
  return {
    categoryName: rule.categoryName,
    paymentMethod: rule.paymentMethod,
    confidence: 0.82,
    reason: `Matched keyword ${rule.keywords.find((keyword) => lower.includes(keyword))}`,
  };
};
