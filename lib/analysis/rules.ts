import type { Severity } from "../../types/database";

type DetectionEvent = {
  timestamp: string;
  username: string;
  event_type: string;
};

export function detectBruteForce(events: readonly DetectionEvent[]) {
  const windowMs = 5 * 60 * 1000;
  const eventsByAccount = new Map<string, { time: number; type: string }[]>();
  const alerts: { username: string; failureCount: number; severity: Severity }[] = [];

  for (const event of events) {
    if (event.event_type !== "login_failure" && event.event_type !== "login_success") {
      continue;
    }

    const time = Date.parse(event.timestamp);
    if (!Number.isFinite(time)) continue;

    const timeline = eventsByAccount.get(event.username) ?? [];
    timeline.push({ time, type: event.event_type });
    eventsByAccount.set(event.username, timeline);
  }

  for (const [username, timeline] of eventsByAccount) {
    timeline.sort((a, b) => a.time - b.time);

    const failures: number[] = [];
    let start = 0;
    let lastQualifiedFailure: number | undefined;
    let failureCount = 0;
    let severity: Severity = "high";

    for (const { time, type } of timeline) {
      if (type === "login_success") {
        if (
          lastQualifiedFailure !== undefined &&
          time > lastQualifiedFailure &&
          time - lastQualifiedFailure <= windowMs
        ) {
          severity = "critical";
          break;
        }
        continue;
      }

      failures.push(time);
      while (time - failures[start] > windowMs) start++;

      const count = failures.length - start;
      if (count >= 5) {
        lastQualifiedFailure = time;
        failureCount = count;
      }
    }

    if (failureCount >= 5) {
      alerts.push({ username, failureCount, severity });
    }
  }

  return alerts;
}