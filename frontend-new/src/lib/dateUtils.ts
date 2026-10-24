/**
 * IST date formatting utilities.
 * All user-facing timestamps in the dashboard must be in Indian Standard Time (IST, UTC+5:30).
 */

export function formatIST(
  dateStr: string | null | undefined,
  options?: {
    includeTime?: boolean;
    format?: "short" | "medium" | "full";
  },
): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";

  const includeTime = options?.includeTime ?? true;

  const dateFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      : {}),
  });

  return dateFormatter.format(date);
}

export function formatDateOnlyIST(dateStr: string | null | undefined): string {
  return formatIST(dateStr, { includeTime: false });
}

export const formatIstDate = formatIST;
