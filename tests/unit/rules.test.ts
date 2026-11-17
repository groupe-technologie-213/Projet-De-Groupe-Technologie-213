import { expect, it } from "vitest";
import { detectBruteForce } from "../../lib/analysis/rules";

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
  ).toEqual([
    { username: "demo", failureCount: 5, severity: "high" },
  ]);
});