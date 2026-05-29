type QueryValue = string | number | boolean | null | undefined | string[] | number[];
type QueryParams = Record<string, QueryValue>;

const namespace = "loan-tracker";

const normalizeQueryValue = (value: QueryValue) => {
  if (Array.isArray(value)) return value.map(String).sort().join(",");
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
};

export const stableQueryKey = (query: QueryParams = {}) => {
  const normalized = Object.keys(query)
    .sort()
    .map((key) => {
      const value = normalizeQueryValue(query[key]);
      return value === undefined ? undefined : `${key}=${encodeURIComponent(value)}`;
    })
    .filter(Boolean)
    .join("&");

  return normalized || "default";
};

const userPrefix = (userId: string) => `${namespace}:user:${userId}`;

export const cacheKeys = {
  userPrefix,
  dashboard: {
    summary: (userId: string) => `${userPrefix(userId)}:dashboard:summary`,
    monthlyChart: (userId: string, query: QueryParams) => `${userPrefix(userId)}:dashboard:monthly-chart:${stableQueryKey(query)}`,
    loanTypeChart: (userId: string) => `${userPrefix(userId)}:dashboard:loan-type-chart`,
    loanStatusChart: (userId: string) => `${userPrefix(userId)}:dashboard:loan-status-chart`,
    topContacts: (userId: string, query: QueryParams) => `${userPrefix(userId)}:dashboard:top-contacts:${stableQueryKey(query)}`,
    insights: (userId: string) => `${userPrefix(userId)}:dashboard:insights`,
    pattern: (userId: string) => `${userPrefix(userId)}:dashboard:*`,
  },
  reports: {
    overview: (userId: string) => `${userPrefix(userId)}:reports:overview`,
    detail: (userId: string, name: string, query: QueryParams = {}) => `${userPrefix(userId)}:reports:${name}:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:reports:*`,
  },
  contacts: {
    list: (userId: string, query: QueryParams) => `${userPrefix(userId)}:contacts:list:${stableQueryKey(query)}`,
    detail: (userId: string, contactId: string) => `${userPrefix(userId)}:contacts:detail:${contactId}`,
    favorites: (userId: string, query: QueryParams) => `${userPrefix(userId)}:contacts:favorites:${stableQueryKey(query)}`,
    recent: (userId: string, query: QueryParams) => `${userPrefix(userId)}:contacts:recent:${stableQueryKey(query)}`,
    trust: (userId: string, contactId: string) => `${userPrefix(userId)}:contacts:trust:${contactId}`,
    listPattern: (userId: string) => `${userPrefix(userId)}:contacts:list:*`,
    favoritesPattern: (userId: string) => `${userPrefix(userId)}:contacts:favorites:*`,
    recentPattern: (userId: string) => `${userPrefix(userId)}:contacts:recent:*`,
    trustPattern: (userId: string, contactId = "*") => `${userPrefix(userId)}:contacts:trust:${contactId}`,
    detailPattern: (userId: string, contactId = "*") => `${userPrefix(userId)}:contacts:detail:${contactId}`,
  },
  loans: {
    list: (userId: string, query: QueryParams) => `${userPrefix(userId)}:loans:list:${stableQueryKey(query)}`,
    detail: (userId: string, loanId: string) => `${userPrefix(userId)}:loans:detail:${loanId}`,
    pinned: (userId: string, query: QueryParams) => `${userPrefix(userId)}:loans:pinned:${stableQueryKey(query)}`,
    listPattern: (userId: string) => `${userPrefix(userId)}:loans:list:*`,
    pinnedPattern: (userId: string) => `${userPrefix(userId)}:loans:pinned:*`,
    detailPattern: (userId: string, loanId = "*") => `${userPrefix(userId)}:loans:detail:${loanId}`,
  },
  activity: {
    recent: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:activity:recent:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:activity:*`,
  },
  receipts: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:receipts:list:${stableQueryKey(query)}`,
    detail: (userId: string, receiptId: string) => `${userPrefix(userId)}:receipts:detail:${receiptId}`,
    pattern: (userId: string) => `${userPrefix(userId)}:receipts:*`,
  },
  backups: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:backups:list:${stableQueryKey(query)}`,
    detail: (userId: string, backupId: string) => `${userPrefix(userId)}:backups:detail:${backupId}`,
    pattern: (userId: string) => `${userPrefix(userId)}:backups:*`,
  },
  email: {
    preferences: (userId: string) => `${userPrefix(userId)}:email:preferences`,
    logs: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:email:logs:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:email:*`,
  },
  recovery: {
    center: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:recovery:center:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:recovery:*`,
  },
  reminderTemplates: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:reminder-templates:list:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:reminder-templates:*`,
  },
  followUps: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:follow-ups:list:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:follow-ups:*`,
  },
  promises: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:promises:list:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:promises:*`,
  },
  paymentRequests: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:payment-requests:list:${stableQueryKey(query)}`,
    detail: (userId: string, id: string) => `${userPrefix(userId)}:payment-requests:detail:${id}`,
    pattern: (userId: string) => `${userPrefix(userId)}:payment-requests:*`,
  },
  settlements: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:settlements:list:${stableQueryKey(query)}`,
    detail: (userId: string, id: string) => `${userPrefix(userId)}:settlements:detail:${id}`,
    pattern: (userId: string) => `${userPrefix(userId)}:settlements:*`,
  },
  communications: {
    contact: (userId: string, contactId: string, query: QueryParams = {}) => `${userPrefix(userId)}:communications:contact:${contactId}:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:communications:*`,
  },
  categories: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:categories:list:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:categories:*`,
  },
  transactions: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:transactions:list:${stableQueryKey(query)}`,
    detail: (userId: string, id: string) => `${userPrefix(userId)}:transactions:detail:${id}`,
    pattern: (userId: string) => `${userPrefix(userId)}:transactions:*`,
  },
  salary: {
    profile: (userId: string) => `${userPrefix(userId)}:salary:profile`,
    entries: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:salary:entries:${stableQueryKey(query)}`,
    dashboard: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:salary:dashboard:${stableQueryKey(query)}`,
    cycle: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:salary:cycle:${stableQueryKey(query)}`,
    allocations: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:salary:allocations:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:salary:*`,
  },
  budgets: {
    current: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:budgets:current:${stableQueryKey(query)}`,
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:budgets:list:${stableQueryKey(query)}`,
    recommendations: (userId: string) => `${userPrefix(userId)}:budgets:recommendations`,
    pattern: (userId: string) => `${userPrefix(userId)}:budgets:*`,
  },
  savingsGoals: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:savings-goals:list:${stableQueryKey(query)}`,
    detail: (userId: string, id: string) => `${userPrefix(userId)}:savings-goals:detail:${id}`,
    pattern: (userId: string) => `${userPrefix(userId)}:savings-goals:*`,
  },
  finance: {
    dashboard: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:finance:dashboard:${stableQueryKey(query)}`,
    cashFlow: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:finance:cash-flow:${stableQueryKey(query)}`,
    categoryBreakdown: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:finance:category-breakdown:${stableQueryKey(query)}`,
    paymentMethodBreakdown: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:finance:payment-method-breakdown:${stableQueryKey(query)}`,
    monthlyReport: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:finance:monthly-report:${stableQueryKey(query)}`,
    insights: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:finance:insights:${stableQueryKey(query)}`,
    report: (userId: string, name: string, query: QueryParams = {}) => `${userPrefix(userId)}:finance:report:${name}:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:finance:*`,
  },
  bills: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:bills:list:${stableQueryKey(query)}`,
    upcoming: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:bills:upcoming:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:bills:*`,
  },
  recurringTransactions: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:recurring-transactions:list:${stableQueryKey(query)}`,
    upcoming: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:recurring-transactions:upcoming:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:recurring-transactions:*`,
  },
  calendar: {
    events: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:calendar:events:${stableQueryKey(query)}`,
    monthSummary: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:calendar:month-summary:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:calendar:*`,
  },
  forecast: {
    currentCycle: (userId: string) => `${userPrefix(userId)}:forecast:current-cycle`,
    monthEnd: (userId: string) => `${userPrefix(userId)}:forecast:month-end`,
    custom: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:forecast:custom:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:forecast:*`,
  },
  alerts: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:alerts:list:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:alerts:*`,
  },
  transactionTemplates: {
    list: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:transaction-templates:list:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:transaction-templates:*`,
  },
  spendingInsights: {
    habits: (userId: string, query: QueryParams = {}) => `${userPrefix(userId)}:spending-insights:habits:${stableQueryKey(query)}`,
    pattern: (userId: string) => `${userPrefix(userId)}:spending-insights:*`,
  },
  goals: {
    planner: (userId: string) => `${userPrefix(userId)}:goals:planner`,
    pattern: (userId: string) => `${userPrefix(userId)}:goals:*`,
  },
  phase8: {
    moneyHealth: (userId: string) => `${userPrefix(userId)}:phase8:money-health`,
    whatChanged: (userId: string) => `${userPrefix(userId)}:phase8:what-changed`,
    dataQuality: (userId: string) => `${userPrefix(userId)}:phase8:data-quality`,
    pattern: (userId: string) => `${userPrefix(userId)}:phase8:*`,
  },
};

export const cacheTtl = {
  dashboardSummary: 60,
  charts: 300,
  contactDetail: 60,
  loanDetail: 60,
  lists: 30,
  insights: 60,
  trustProfile: 300,
  reports: 300,
  activity: 60,
  recovery: 60,
  communication: 60,
  finance: 60,
  salary: 60,
  budgets: 60,
  savings: 60,
};
