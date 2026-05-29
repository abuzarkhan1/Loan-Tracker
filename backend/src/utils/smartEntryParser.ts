import { PaymentMethod } from "../constants/enums";

export type SmartEntryIntent =
  | "CREATE_LOAN"
  | "ADD_PAYMENT"
  | "CREATE_EXPENSE"
  | "CREATE_INCOME"
  | "CREATE_SALARY"
  | "CREATE_BILL"
  | "CREATE_PROMISE"
  | "CREATE_RECURRING_TRANSACTION"
  | "UNKNOWN";

export type SmartEntryLanguage = "ROMAN_URDU" | "ENGLISH" | "MIXED";

export type ParsedSmartEntry = {
  intent: SmartEntryIntent;
  confidence: number;
  parsedData: Record<string, unknown>;
  missingFields: string[];
  language: SmartEntryLanguage;
};

const expenseKeywords: Record<string, string> = {
  food: "Food",
  lunch: "Food",
  dinner: "Food",
  breakfast: "Food",
  restaurant: "Food",
  kfc: "Food",
  petrol: "Transport",
  fuel: "Transport",
  transport: "Transport",
  rent: "Rent",
  kiraya: "Rent",
  electricity: "Bills",
  gas: "Bills",
  water: "Bills",
  bill: "Bills",
  mobile: "Mobile/Internet",
  internet: "Mobile/Internet",
  zong: "Mobile/Internet",
  jazz: "Mobile/Internet",
  shopping: "Shopping",
  clothes: "Shopping",
  medicine: "Health",
  doctor: "Health",
  school: "Education",
  fee: "Education",
};

const paymentMethodKeywords: Record<string, PaymentMethod> = {
  cash: PaymentMethod.CASH,
  bank: PaymentMethod.BANK,
  jazzcash: PaymentMethod.JAZZCASH,
  jazz: PaymentMethod.JAZZCASH,
  easypaisa: PaymentMethod.EASYPAISA,
};

const romanUrduWords = ["ko", "se", "sai", "say", "diye", "diya", "liye", "liya", "wapis", "mile", "mila", "kharch", "tankhwa", "kal", "dega", "kaha"];
const urduScriptHints = /[\u0600-\u06ff]/;

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

const detectLanguage = (text: string): SmartEntryLanguage => {
  const lower = normalize(text);
  if (urduScriptHints.test(text)) return "ROMAN_URDU";
  const hasRomanUrdu = romanUrduWords.some((word) => lower.includes(` ${word} `) || lower.startsWith(`${word} `) || lower.endsWith(` ${word}`));
  const hasEnglish = /(?:salary|income|expense|spent|borrowed|lent|received|bill|promise|freelance|business)/i.test(text);
  if (hasRomanUrdu && hasEnglish) return "MIXED";
  return hasRomanUrdu ? "ROMAN_URDU" : "ENGLISH";
};

const extractAmount = (text: string) => {
  const normalizedDigits = text.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const match = normalizedDigits.replace(/,/g, "").match(/(?:rs\.?\s*|روپے\s*)?(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : undefined;
};

const extractPaymentMethod = (text: string) => {
  const lower = normalize(text);
  return Object.entries(paymentMethodKeywords).find(([keyword]) => lower.includes(keyword))?.[1] || PaymentMethod.CASH;
};

const parseDate = (text: string) => {
  const lower = normalize(text);
  const today = new Date();
  if (lower.includes("today") || lower.includes("aaj") || lower.includes("آج")) return today;
  if (lower.includes("tomorrow") || lower.includes("kal") || lower.includes("کل")) return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekday = weekdays.findIndex((day) => lower.includes(day));
  if (weekday >= 0) {
    const diff = (weekday + 7 - today.getDay()) % 7 || 7;
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
  }
  const dateMatch = lower.match(/(?:on|due on|ko)?\s*(\d{1,2})\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)/);
  if (dateMatch) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = months.findIndex((item) => dateMatch[2].startsWith(item));
    const candidate = new Date(today.getFullYear(), month, Number(dateMatch[1]));
    if (candidate < today) candidate.setFullYear(today.getFullYear() + 1);
    return candidate;
  }
  return today;
};

const extractContactBefore = (text: string, marker: RegExp) => {
  const match = text.match(marker);
  return match?.[1]?.trim().split(/\s+/).slice(-3).join(" ");
};

const detectCategory = (text: string) => {
  const lower = normalize(text);
  const match = Object.entries(expenseKeywords).find(([keyword]) => lower.includes(keyword));
  return match?.[1];
};

const detectIntent = (text: string): SmartEntryIntent => {
  const lower = normalize(text);
  if (/(ko .*(diye|diya)|کو .*د(یے|یا)|gave to|lent|loan diya)/.test(lower)) return "CREATE_LOAN";
  if (/((se|sai|say) .*(liye|liya)|سے .*ل(یے|یا)|borrowed from|loan liya)/.test(lower)) return "CREATE_LOAN";
  if (/(wapis (mile|mila)|واپس .*مل|received from|paid back|ne diye)/.test(lower)) return "ADD_PAYMENT";
  if (/(wapis (diye|diya)|واپس .*د(یے|یا)|paid to|returned to)/.test(lower)) return "ADD_PAYMENT";
  if (/(promise|dene ka kaha|dega|kaha|وعدہ|کہا)/.test(lower)) return "CREATE_PROMISE";
  if (/(monthly bill|bill|due|rent due|electricity|بل|کرایہ)/.test(lower)) return lower.includes("monthly") || lower.includes("ماہانہ") ? "CREATE_RECURRING_TRANSACTION" : "CREATE_BILL";
  if (/(salary|tankhwa|pay received|تنخواہ)/.test(lower)) return "CREATE_SALARY";
  if (/(kharch|expense|spent|خرچ)/.test(lower) || detectCategory(lower)) return "CREATE_EXPENSE";
  if (/(income|freelance|business income|gift|آمدنی)/.test(lower)) return "CREATE_INCOME";
  return "UNKNOWN";
};

export const parseSmartEntryText = (text: string, preferredLanguage?: SmartEntryLanguage): ParsedSmartEntry => {
  const originalText = text.trim();
  const lower = normalize(originalText);
  const amount = extractAmount(originalText);
  const intent = detectIntent(originalText);
  const date = parseDate(originalText);
  const paymentMethod = extractPaymentMethod(originalText);
  const categoryName = detectCategory(originalText);
  const parsedData: Record<string, unknown> = { amount, date, paymentMethod };

  if (intent === "CREATE_LOAN") {
    const taken = /((se|sai|say) .*(liye|liya)|سے .*ل(یے|یا)|borrowed from|loan liya)/.test(lower);
    parsedData.loanType = taken ? "TAKEN" : "GIVEN";
    parsedData.contactName = taken
      ? extractContactBefore(originalText, /(.+?)\s+(?:se|sai|say)\s+/i) || extractContactBefore(originalText, /(.+?)\s+سے\s+/i)
      : extractContactBefore(originalText, /(.+?)\s+ko\s+/i) || extractContactBefore(originalText, /(.+?)\s+کو\s+/i) || extractContactBefore(originalText, /(?:gave to|lent)\s+(.+?)\s+\d/i);
    parsedData.issueDate = date;
  }

  if (intent === "ADD_PAYMENT") {
    const paid = /(wapis (diye|diya)|paid to|returned to)/.test(lower);
    parsedData.paymentDirection = paid ? "PAID" : "RECEIVED";
    parsedData.contactName = extractContactBefore(originalText, /(.+?)\s+(?:se|sai|say|ne)\s+/i) || extractContactBefore(originalText, /(.+?)\s+(?:سے|نے)\s+/i);
    parsedData.paymentDate = date;
  }

  if (intent === "CREATE_EXPENSE" || intent === "CREATE_INCOME") {
    parsedData.categoryName = intent === "CREATE_EXPENSE" ? categoryName || "Other" : (lower.includes("freelance") ? "Freelance" : lower.includes("business") ? "Business" : "Other Income");
    parsedData.note = originalText;
  }

  if (intent === "CREATE_SALARY") {
    parsedData.source = lower.includes("business") ? "BUSINESS" : lower.includes("freelance") ? "FREELANCE" : "JOB";
    parsedData.salaryDate = date;
  }

  if (intent === "CREATE_BILL" || intent === "CREATE_RECURRING_TRANSACTION") {
    parsedData.title = originalText.replace(/rs\.?\s*\d[\d,]*/i, "").replace(/\d[\d,]*/, "").replace(/due on.+$/i, "").trim() || categoryName || "Bill";
    parsedData.categoryName = categoryName || "Bills";
    parsedData.dueDate = date;
    parsedData.frequency = lower.includes("yearly") ? "YEARLY" : lower.includes("weekly") ? "WEEKLY" : lower.includes("quarterly") ? "QUARTERLY" : lower.includes("monthly") ? "MONTHLY" : "ONCE";
  }

  if (intent === "CREATE_PROMISE") {
    parsedData.contactName = extractContactBefore(originalText, /(.+?)\s+ne\s+/i);
    parsedData.promiseDate = date;
    parsedData.promisedAmount = amount;
  }

  const missingFields = [
    !amount && intent !== "UNKNOWN" ? "amount" : undefined,
    ["CREATE_LOAN", "ADD_PAYMENT", "CREATE_PROMISE"].includes(intent) && !parsedData.contactName ? "contact" : undefined,
  ].filter(Boolean) as string[];

  const confidence = intent === "UNKNOWN" ? 0.18 : Math.max(0.35, Math.min(0.95, 0.72 + (amount ? 0.12 : -0.15) + (missingFields.length ? -0.18 : 0)));
  return {
    intent,
    confidence,
    parsedData,
    missingFields,
    language: preferredLanguage || detectLanguage(originalText),
  };
};
