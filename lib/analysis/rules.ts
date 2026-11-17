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
type IpDetectionEvent = DetectionEvent & { ip_address: string };

export function detectPasswordSpraying(events: readonly IpDetectionEvent[]) {
  const windowMs = 10 * 60 * 1000;
  const failuresByIp = new Map<string, { time: number; username: string }[]>();
  const alerts: { ipAddress: string; accountCount: number; severity: Severity }[] = [];

  for (const event of events) {
    if (event.event_type !== "login_failure") continue;

    const time = Date.parse(event.timestamp);
    if (!Number.isFinite(time) || !event.ip_address || !event.username) continue;

    const failures = failuresByIp.get(event.ip_address) ?? [];
    failures.push({ time, username: event.username });
    failuresByIp.set(event.ip_address, failures);
  }

  for (const [ipAddress, failures] of failuresByIp) {
    failures.sort((a, b) => a.time - b.time);
    const accounts = new Map<string, number>();
    let start = 0;

    for (const failure of failures) {
      accounts.set(failure.username, (accounts.get(failure.username) ?? 0) + 1);

      while (failure.time - failures[start].time > windowMs) {
        const username = failures[start].username;
        const count = (accounts.get(username) ?? 0) - 1;

        if (count === 0) accounts.delete(username);
        else accounts.set(username, count);

        start++;
      }

      if (accounts.size >= 5) {
        alerts.push({ ipAddress, accountCount: accounts.size, severity: "high" });
        break;
      }
    }
  }

  return alerts;
}

export function detectOffHours(events: readonly IpDetectionEvent[]) {
  const alerts: (IpDetectionEvent & { severity: Severity })[] = [];

  for (const event of events) {
    if (event.event_type !== "login_success") continue;

    const hour = new Date(event.timestamp).getUTCHours();
    if (hour >= 0 && hour < 5) {
      alerts.push({ ...event, severity: "medium" });
    }
  }

  return alerts;
}

export function detectNewIp(events: readonly IpDetectionEvent[]) {
  const successes = events
    .filter((event) =>
      event.event_type === "login_success" &&
      event.username &&
      event.ip_address &&
      Number.isFinite(Date.parse(event.timestamp)),
    )
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  const ipsByAccount = new Map<string, Set<string>>();
  const alerts: (IpDetectionEvent & { severity: Severity })[] = [];

  for (const event of successes) {
    let knownIps = ipsByAccount.get(event.username);

    if (!knownIps) {
      ipsByAccount.set(event.username, new Set([event.ip_address]));
      continue;
    }

    if (!knownIps.has(event.ip_address)) {
      alerts.push({ ...event, severity: "low" });
      knownIps.add(event.ip_address);
    }
  }

  return alerts;
}

type IpLocation = {
  latitude: number;
  longitude: number;
};

function distanceKm(from: IpLocation, to: IpLocation) {
  const radians = Math.PI / 180;
  const deltaLat = (to.latitude - from.latitude) * radians;
  const deltaLon = (to.longitude - from.longitude) * radians;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(from.latitude * radians) *
      Math.cos(to.latitude * radians) *
      Math.sin(deltaLon / 2) ** 2;

  return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export function detectImpossibleTravel(
  events: readonly IpDetectionEvent[],
  locationsByIp: ReadonlyMap<string, IpLocation>,
) {
  const successes = events
    .filter((event) => event.event_type === "login_success" && event.username)
    .map((event) => ({ event, time: Date.parse(event.timestamp) }))
    .filter(({ time }) => Number.isFinite(time))
    .sort((a, b) => a.time - b.time);

  const previousByAccount = new Map<string, (typeof successes)[number]>();
  const alerts: {
    username: string;
    fromIp: string;
    toIp: string;
    elapsedMinutes: number;
    distanceKm: number;
    severity: Severity;
  }[] = [];

  for (const current of successes) {
    const { event, time } = current;
    const previous = previousByAccount.get(event.username);
    previousByAccount.set(event.username, current);

    if (!previous || previous.event.ip_address === event.ip_address) continue;

    const from = locationsByIp.get(previous.event.ip_address);
    const to = locationsByIp.get(event.ip_address);
    if (!from || !to) continue;

    const elapsedHours = (time - previous.time) / 3_600_000;
    const distance = distanceKm(from, to);

    if (distance > 900 * elapsedHours) {
      alerts.push({
        username: event.username,
        fromIp: previous.event.ip_address,
        toIp: event.ip_address,
        elapsedMinutes: elapsedHours * 60,
        distanceKm: Math.round(distance),
        severity: "high",
      });
    }
  }

  return alerts;
}