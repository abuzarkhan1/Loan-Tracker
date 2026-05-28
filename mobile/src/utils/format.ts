export const formatCurrency = (value = 0) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (date?: string | Date | null) => {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export const formatDateTime = (date?: string | Date | null) => {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const formatTime = (date?: string | Date | null) => {
  if (!date) return "No time";
  return new Intl.DateTimeFormat("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const toDateInput = (date?: string | Date | null) => {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
};

export const getProgress = (paidAmount = 0, amount = 0) => {
  if (!amount) return 0;
  return Math.min(100, Math.round((paidAmount / amount) * 100));
};
