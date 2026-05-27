export function formatResidentRegistrationNumberInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);

  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export function maskResidentRegistrationNumber(value: string | undefined) {
  if (!value) return "-";

  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) return value;

  return `${digits.slice(0, 6)}-${digits.slice(6, 7)}******`;
}

export function isValidResidentRegistrationNumber(value: string) {
  if (!value) return true;
  if (!/^\d{6}-\d{7}$/.test(value)) return false;

  const digits = value.replace(/\D/g, "");
  const yearText = digits.slice(0, 2);
  const monthText = digits.slice(2, 4);
  const dayText = digits.slice(4, 6);
  const genderCode = Number(digits.slice(6, 7));
  if (genderCode < 1 || genderCode > 8) return false;

  const century = genderCode <= 2 || genderCode === 5 || genderCode === 6 ? 1900 : 2000;
  const year = century + Number(yearText);
  const month = Number(monthText);
  if (month < 1 || month > 12) return false;

  const day = Number(dayText);
  const lastDay = new Date(year, month, 0).getDate();
  return day >= 1 && day <= lastDay;
}
