const digitsOnly = (value: string) => value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");

export const normalizePhone = (phone?: string | null) => {
  if (!phone) return undefined;

  const compact = digitsOnly(phone.trim());
  if (!compact) return undefined;

  let digits = compact.startsWith("+") ? compact.slice(1) : compact;

  if (digits.startsWith("0092")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    digits = `92${digits.slice(1)}`;
  } else if (digits.startsWith("3") && digits.length === 10) {
    digits = `92${digits}`;
  }

  if (digits.startsWith("92") && digits.length === 12) {
    return `+${digits}`;
  }

  if (compact.startsWith("+")) {
    return `+${digits}`;
  }

  return digits.length >= 7 ? `+${digits}` : undefined;
};

export const normalizeContactName = (name?: string | null) =>
  (name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
