
export type LogEventType =
  | "login_success"
  | "login_failure"
  | "password_change"
  | "logout";

export interface NormalizedLogEvent {
  occurred_at: string; // timestamptz
  source_ip: string;   // inet
  event_type: LogEventType;
  username: string;
  user_agent: string | null;
  raw_data?: Record<string, unknown>;
}

export interface ParseResult {
  events: NormalizedLogEvent[];
  validCount: number;
  invalidCount: number;
  errors: Array<{ line: number; reason: string }>;
}

const VALID_EVENT_TYPES: Set<string> = new Set([
  "login_success",
  "login_failure",
  "password_change",
  "logout",
]);

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV6_REGEX = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

export function isValidIp(ip: string): boolean {
  const trimmed = ip.trim();
  return IPV4_REGEX.test(trimmed) || IPV6_REGEX.test(trimmed);
}

export function parseAndValidateRow(
  raw: Record<string, unknown>,
  lineNumber: number
): { event?: NormalizedLogEvent; error?: { line: number; reason: string } } {
  // 1. Date (occurred_at)
  const rawDate = raw.occurred_at ?? raw.timestamp ?? raw.date ?? raw.time;
  if (!rawDate || typeof rawDate !== "string") {
    return { error: { line: lineNumber, reason: "Date manquante" } };
  }
  const parsedDate = new Date(rawDate.trim());
  if (Number.isNaN(parsedDate.getTime())) {
    return { error: { line: lineNumber, reason: `Date invalide : ${rawDate}` } };
  }

  // 2. IP (source_ip)
  const rawIp = raw.source_ip ?? raw.ip ?? raw.ip_address ?? raw.client_ip;
  if (!rawIp || typeof rawIp !== "string" || !isValidIp(rawIp)) {
    return { error: { line: lineNumber, reason: `IP invalide : ${String(rawIp ?? "")}` } };
  }

  // 3. Type d'événement (event_type)
  const rawType = String(raw.event_type ?? raw.eventType ?? raw.type ?? "").trim().toLowerCase();
  if (!VALID_EVENT_TYPES.has(rawType)) {
    return { error: { line: lineNumber, reason: `Type d'événement invalide : ${rawType}` } };
  }

  // 4. Username
  const rawUser = raw.username ?? raw.user ?? raw.email;
  const username = typeof rawUser === "string" ? rawUser.trim() : "";
  if (!username) {
    return { error: { line: lineNumber, reason: "Nom d'utilisateur manquant" } };
  }

  const rawUa = raw.user_agent ?? raw.userAgent ?? raw.ua;
  const user_agent = typeof rawUa === "string" && rawUa.trim() ? rawUa.trim() : null;

  return {
    event: {
      occurred_at: parsedDate.toISOString(),
      source_ip: rawIp.trim(),
      event_type: rawType as LogEventType,
      username,
      user_agent,
    },
  };
}

export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { events: [], validCount: 0, invalidCount: 0, errors: [] };
  }

  const delimiter = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, "").trim());

  const events: NormalizedLogEvent[] = [];
  const errors: Array<{ line: number; reason: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.replace(/^["']|["']$/g, "").trim());
    if (values.length < headers.length) {
      errors.push({ line: i + 1, reason: "Nombre de colonnes insuffisant" });
      continue;
    }

    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });

    const { event, error } = parseAndValidateRow(row, i + 1);
    if (event) events.push(event);
    else if (error) errors.push(error);
  }

  return { events, validCount: events.length, invalidCount: errors.length, errors };
}

export function parseJSON(content: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { events: [], validCount: 0, invalidCount: 1, errors: [{ line: 1, reason: "JSON malformé" }] };
  }

  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const events: NormalizedLogEvent[] = [];
  const errors: Array<{ line: number; reason: string }> = [];

  rows.forEach((item, idx) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push({ line: idx + 1, reason: "Objet JSON invalide" });
      return;
    }
    const { event, error } = parseAndValidateRow(item as Record<string, unknown>, idx + 1);
    if (event) events.push(event);
    else if (error) errors.push(error);
  });

  return { events, validCount: events.length, invalidCount: errors.length, errors };
}

export function parseLogFile(content: string, filename: string): ParseResult {
  if (filename.toLowerCase().endsWith(".json")) {
    return parseJSON(content);
  }
  return parseCSV(content);
}