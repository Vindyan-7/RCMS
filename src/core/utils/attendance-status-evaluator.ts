import { AttendanceSessionSelect } from "@/db/schema";

/**
 * Safely parses session date and time strings into JavaScript Date objects in local time.
 */
export function parseSessionDateTime(dateVal: Date | string, timeStr: string): Date {
  const dateStr = typeof dateVal === "string" 
    ? dateVal.split("T")[0] 
    : new Date(dateVal).toISOString().split("T")[0];

  let cleanTime = (timeStr || "00:00").trim();

  // Handle 12-hour AM/PM strings if present (e.g. "01:00 PM" -> "13:00")
  if (/am|pm/i.test(cleanTime)) {
    const isPm = /pm/i.test(cleanTime);
    cleanTime = cleanTime.replace(/am|pm/i, "").trim();
    const parts = cleanTime.split(":");
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || "00";
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
    cleanTime = `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  const parts = cleanTime.split(":");
  const hh = String(parts[0] || "00").padStart(2, "0");
  const mm = String(parts[1] || "00").padStart(2, "0");
  const ss = String(parts[2] || "00").padStart(2, "0");

  return new Date(`${dateStr}T${hh}:${mm}:${ss}`);
}

/**
 * Evaluates the authoritative real-time session status based on current server/client time.
 */
export function evaluateSessionStatus(session: AttendanceSessionSelect, now: Date = new Date()): string {
  // Archived sessions remain archived
  if (session.status === "archived") return "archived";

  // Explicitly closed or completed sessions remain completed
  if (session.status === "completed" || session.status === "closed") return "completed";

  // Explicitly paused sessions remain paused
  if (session.status === "paused") return "paused";

  const startDateTime = parseSessionDateTime(session.date, session.startTime);
  const endDateTime = parseSessionDateTime(session.date, session.endTime);

  if (now < startDateTime) {
    if (session.status === "prepared") return "prepared";
    return session.status === "draft" ? "draft" : "scheduled";
  } else if (now >= startDateTime && now < endDateTime) {
    return "active"; // LIVE!
  } else {
    return "completed"; // CLOSED / COMPLETED!
  }
}

/**
 * Mutates session status in-place to ensure real-time consistency.
 */
export function applyEffectiveSessionStatus<T extends AttendanceSessionSelect>(session: T, now: Date = new Date()): T {
  const effectiveStatus = evaluateSessionStatus(session, now);
  return {
    ...session,
    status: effectiveStatus,
  };
}
