export const createReceiptNumber = (date = new Date()) => {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LTR-${stamp}-${suffix}`;
};
