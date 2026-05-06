const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getKstDateInput(offsetDays = 0) {
  const kstTime = Date.now() + KST_OFFSET_MS + offsetDays * 24 * 60 * 60 * 1000;
  return new Date(kstTime).toISOString().slice(0, 10);
}
