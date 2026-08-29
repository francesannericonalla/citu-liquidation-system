/**
 * Standard download filenames for all liquidation documents.
 * Format: {TYPE}-{PR_NUMBER}_{YYYY-MM-DD}.{ext}
 * Sanitizes PR number to be filesystem-safe.
 */
export function buildFilename(
  type: "LIQ" | "CERT" | "AR" | "EXPENSE",
  prNumber: string,
  date: string, // ISO date string YYYY-MM-DD or JS Date
  ext: "pdf" | "xlsx",
): string {
  const safepr = prNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  const isoDate = date.slice(0, 10); // ensure YYYY-MM-DD
  return `${type}-${safepr}_${isoDate}.${ext}`;
}
