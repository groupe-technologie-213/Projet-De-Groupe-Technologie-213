import type { LogEntry } from "../../types/logEntry";

export function parseLogs(content: string): LogEntry[] {
  const [header, ...rows] = content.trim().split(/\r?\n/);

  if (header.trim() !== "timestamp,username,ip,status") {
    throw new Error("En-tête attendu : timestamp,username,ip,status");
  }

  const entries: LogEntry[] = [];

  for (const [index, row] of rows.entries()) {
    if (!row.trim()) continue;

    const columns = row.split(",").map((value) => value.trim());
    const [timestamp, username, ip, status] = columns;

    if (
      columns.length !== 4 ||
      !timestamp ||
      Number.isNaN(Date.parse(timestamp)) ||
      !username ||
      !ip ||
      (status !== "success" && status !== "failure")
    ) {
      throw new Error(`Journal invalide à la ligne ${index + 2}.`);
    }

    entries.push({ timestamp, username, ip, status });
  }

  return entries;
}