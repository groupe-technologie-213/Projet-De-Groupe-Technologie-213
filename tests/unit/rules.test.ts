import { expect, it } from "vitest";
import {
  detectBruteForce,
  detectImpossibleTravel,
  detectNewIp,
  detectOffHours,
  detectPasswordSpraying,
} from "../../lib/analysis/rules";

const failures = [0, 1, 2, 3, 5].map((minute) => ({
  timestamp: `2026-11-10T09:0${minute}:00Z`,
  username: "demo",
  event_type: "login_failure",
}));

it("détecte cinq échecs sur un compte en cinq minutes", () => {
  expect(detectBruteForce(failures.slice(0, 4))).toEqual([]);

  expect(detectBruteForce([...failures].reverse())).toEqual([
    { username: "demo", failureCount: 5, severity: "high" },
  ]);
});

it("passe en critique si le même compte se connecte après les échecs", () => {
  const success = {
    timestamp: "2026-11-10T09:06:00Z",
    username: "demo",
    event_type: "login_success",
  };

  expect(detectBruteForce([success, ...failures])).toEqual([
    { username: "demo", failureCount: 5, severity: "critical" },
  ]);

  expect(
    detectBruteForce([...failures, { ...success, username: "autre" }]),
  ).toEqual([{ username: "demo", failureCount: 5, severity: "high" }]);
});

it("détecte cinq comptes distincts en dix minutes depuis une même IP", () => {
  const attempts = [0, 2, 4, 6, 10].map((minute, index) => ({
    timestamp: `2026-11-10T09:${String(minute).padStart(2, "0")}:00Z`,
    username: `compte-${index}`,
    ip_address: "192.0.2.20",
    event_type: "login_failure",
  }));

  expect(detectPasswordSpraying([...attempts].reverse())).toEqual([
    { ipAddress: "192.0.2.20", accountCount: 5, severity: "high" },
  ]);

  expect(
    detectPasswordSpraying(
      attempts.map((event) => ({ ...event, username: "demo" })),
    ),
  ).toEqual([]);

  expect(
    detectPasswordSpraying([
      ...attempts.slice(0, 4),
      { ...attempts[4], timestamp: "2026-11-10T09:10:01Z" },
    ]),
  ).toEqual([]);
});

it("détecte une connexion réussie avant 05 h UTC", () => {
  const nightLogin = {
    timestamp: "2026-11-10T04:59:59Z",
    username: "demo",
    ip_address: "192.0.2.10",
    event_type: "login_success",
  };

  expect(
    detectOffHours([
      nightLogin,
      { ...nightLogin, timestamp: "2026-11-10T05:00:00Z" },
      { ...nightLogin, event_type: "login_failure" },
    ]),
  ).toEqual([{ ...nightLogin, severity: "medium" }]);
});

it("signale une nouvelle IP une seule fois après la connexion de référence", () => {
  const firstLogin = {
    timestamp: "2026-11-10T09:00:00Z",
    username: "demo",
    ip_address: "192.0.2.10",
    event_type: "login_success",
  };

  const newIpLogin = {
    ...firstLogin,
    timestamp: "2026-11-10T09:10:00Z",
    ip_address: "192.0.2.20",
  };

  expect(
    detectNewIp([
      { ...newIpLogin, timestamp: "2026-11-10T09:20:00Z" },
      newIpLogin,
      firstLogin,
    ]),
  ).toEqual([{ ...newIpLogin, severity: "low" }]);
});

it("signale Paris puis Singapour en vingt minutes pour le même compte", () => {
  const parisLogin = {
    timestamp: "2026-11-10T09:00:00Z",
    username: "demo",
    ip_address: "192.0.2.10",
    event_type: "login_success",
  };

  const singaporeLogin = {
    ...parisLogin,
    timestamp: "2026-11-10T09:20:00Z",
    ip_address: "192.0.2.20",
  };

  const locations = new Map([
    ["192.0.2.10", { latitude: 48.8566, longitude: 2.3522 }],
    ["192.0.2.20", { latitude: 1.3521, longitude: 103.8198 }],
  ]);

  const alerts = detectImpossibleTravel([singaporeLogin, parisLogin], locations);

  expect(alerts).toHaveLength(1);
  expect(alerts[0]).toMatchObject({
    username: "demo",
    fromIp: "192.0.2.10",
    toIp: "192.0.2.20",
    elapsedMinutes: 20,
    severity: "high",
  });

  const nextDay = { ...singaporeLogin, timestamp: "2026-11-11T09:00:00Z" };
  expect(detectImpossibleTravel([parisLogin, nextDay], locations)).toEqual([]);

  expect(detectImpossibleTravel([parisLogin, singaporeLogin], new Map())).toEqual([]);
});