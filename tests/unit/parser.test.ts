// tests/unit/parser.test.ts
import { describe, it, expect } from "vitest";
import { parseCSV, parseJSON, parseLogFile} from "@/lib/analysis/parser";

describe("Log Parser", () => {
  it("parse et normalise un CSV valide", () => {
    const csv = [
      "occurred_at,source_ip,event_type,username,user_agent",
      "2026-11-10T09:00:01Z,185.220.101.42,login_failure,admin@logsentinel.io,Mozilla/5.0",
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(0);
    expect(result.events[0].source_ip).toBe("185.220.101.42");
    expect(result.events[0].event_type).toBe("login_failure");
  });

  it("compte et ignore les lignes invalides", () => {
    const csv = [
      "occurred_at,source_ip,event_type,username",
      "bad-date,10.0.0.1,login_success,user1",
      "2026-11-10T09:00:00Z,999.999.999.999,login_success,user2",
      "2026-11-10T09:00:00Z,10.0.0.1,INVALID_TYPE,user3",
      "2026-11-10T09:00:00Z,10.0.0.1,login_success,user4",
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(3);
    expect(result.events[0].username).toBe("user4");
  });
});