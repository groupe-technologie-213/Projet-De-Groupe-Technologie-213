// tests/unit/parser.test.ts
import { describe, it, expect } from "vitest";
import { isValidIp, parseCSV, parseJSON, parseLogFile } from "@/lib/analysis/parser";

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

describe("Parser : cas particuliers", () => {
  it("garde une valeur entre guillemets contenant une virgule", () => {
    const csv = [
      "occurred_at,source_ip,event_type,username,user_agent",
      '2026-11-10T09:00:01Z,10.0.0.1,login_success,alice,"Mozilla/5.0 (KHTML, like Gecko)"',
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.validCount).toBe(1);
    expect(result.events[0].user_agent).toBe("Mozilla/5.0 (KHTML, like Gecko)");
  });

  it("accepte les adresses IPv6 abrégées", () => {
    expect(isValidIp("2001:db8::1")).toBe(true);
    expect(isValidIp("::1")).toBe(true);
    expect(isValidIp("999.999.999.999")).toBe(false);
    expect(isValidIp("pas-une-ip")).toBe(false);
  });

  it("accepte le point-virgule comme séparateur", () => {
    const csv = [
      "occurred_at;source_ip;event_type;username",
      "2026-11-10T09:00:01Z;10.0.0.1;login_failure;bob",
    ].join("\n");

    expect(parseCSV(csv).validCount).toBe(1);
  });

  it("lit un fichier JSON (tableau d'objets)", () => {
    const json = JSON.stringify([
      { occurred_at: "2026-11-10T09:00:01Z", source_ip: "10.0.0.1", event_type: "logout", username: "carol" },
      { occurred_at: "pas-une-date", source_ip: "10.0.0.1", event_type: "logout", username: "dave" },
    ]);

    const result = parseLogFile(json, "journal.json");
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
  });

  it("signale un JSON mal formé", () => {
    const result = parseJSON("{ ceci n'est pas du JSON");
    expect(result.validCount).toBe(0);
    expect(result.errors[0].reason).toBe("JSON malformé");
  });

  it("renvoie un résultat vide pour un fichier vide", () => {
    expect(parseCSV("")).toEqual({ events: [], validCount: 0, invalidCount: 0, errors: [] });
  });
});