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
    pattern: (userId: string) => `${userPrefix(userId)}:dashboard:*`,
  },
  reports: {
    pattern: (userId: string) => `${userPrefix(userId)}:reports:*`,
  },
  contacts: {
    list: (userId: string, query: QueryParams) => `${userPrefix(userId)}:contacts:list:${stableQueryKey(query)}`,
    detail: (userId: string, contactId: string) => `${userPrefix(userId)}:contacts:detail:${contactId}`,
    listPattern: (userId: string) => `${userPrefix(userId)}:contacts:list:*`,
    detailPattern: (userId: string, contactId = "*") => `${userPrefix(userId)}:contacts:detail:${contactId}`,
  },
  loans: {
    list: (userId: string, query: QueryParams) => `${userPrefix(userId)}:loans:list:${stableQueryKey(query)}`,
    detail: (userId: string, loanId: string) => `${userPrefix(userId)}:loans:detail:${loanId}`,
    listPattern: (userId: string) => `${userPrefix(userId)}:loans:list:*`,
    detailPattern: (userId: string, loanId = "*") => `${userPrefix(userId)}:loans:detail:${loanId}`,
  },
};

export const cacheTtl = {
  dashboardSummary: 60,
  charts: 300,
  contactDetail: 60,
  loanDetail: 60,
  lists: 30,
};
