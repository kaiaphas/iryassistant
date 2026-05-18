export function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function isValidPartialBirthDate(value: string) {
  if (!value) return true;
  if (!/^\d{4}(-\d{2})?(-\d{2})?$/.test(value)) return false;

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  if (year < 1900 || year > 2100) return false;
  if (!monthText) return true;

  const month = Number(monthText);
  if (month < 1 || month > 12) return false;
  if (!dayText) return true;

  const day = Number(dayText);
  const lastDay = new Date(year, month, 0).getDate();
  return day >= 1 && day <= lastDay;
}
