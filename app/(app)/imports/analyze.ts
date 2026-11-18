"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { explainAlert } from "@/lib/analysis/explanations";
import {
  detectBruteForce,
  detectImpossibleTravel,
  detectNewIp,
  detectOffHours,
  detectPasswordSpraying,
} from "@/lib/analysis/rules";
import { lookupIp, type IpIntel } from "@/lib/ip-intel";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 500;
const MAX_IP_LOOKUPS = 20;
const IP_LOOKUP_BATCH_SIZE = 5;

type Detection = Parameters<typeof explainAlert>[0];

const titles: Record<Detection["rule"], string> = {
  brute_force: "Tentatives de force brute",
  password_spraying: "Tentatives sur plusieurs comptes",
  impossible_travel: "Voyage impossible",
  off_hours: "Connexion hors horaires",
  new_ip: "Connexion depuis une nouvelle IP",
};

function alertId(importId: string, rule: string, index: number) {
  const hash = createHash("sha256")
    .update(`${importId}:${rule}:${index}`)
    .digest("hex");

  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export async function analyzeImportAction(importId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Connecte-toi pour analyser cet import." };

  const { data: logImport, error: importError } = await supabase
    .from("log_imports")
    .select("id, status")
    .eq("id", importId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (importError) return { error: importError.message };
  if (!logImport) return { error: "Import introuvable." };
  if (logImport.status === "failed") {
    return { error: "Cet import a échoué. Importe à nouveau le fichier." };
  }

  const events: {
    timestamp: string;
    username: string;
    ip_address: string;
    event_type: string;
  }[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data: rows, error } = await supabase
      .from("log_events")
      .select("occurred_at, source_ip, username, event_type")
      .eq("import_id", importId)
      .eq("user_id", user.id)
      .order("occurred_at")
      .order("id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) return { error: error.message };

    for (const row of rows ?? []) {
      events.push({
        timestamp: row.occurred_at,
        username: row.username ?? "",
        ip_address: typeof row.source_ip === "string" ? row.source_ip : "",
        event_type: row.event_type,
      });
    }

    if ((rows?.length ?? 0) < PAGE_SIZE) break;
  }

  if (events.length === 0) return { error: "Aucun événement à analyser." };

  const ips = [...new Set(
    events
      .filter((event) => event.event_type === "login_success" && event.ip_address)
      .map((event) => event.ip_address),
  )].slice(0, MAX_IP_LOOKUPS);

  const locations = new Map<string, IpIntel>();

  for (let offset = 0; offset < ips.length; offset += IP_LOOKUP_BATCH_SIZE) {
    const batch = ips.slice(offset, offset + IP_LOOKUP_BATCH_SIZE);

    await Promise.all(batch.map(async (ip) => {
      const location = await lookupIp(ip);
      if (location) locations.set(ip, location);
    }));
  }

  const detections: Detection[] = [
    ...detectBruteForce(events.filter((event) => event.username)).map(
      (alert) => ({ rule: "brute_force", alert }) as const,
    ),
    ...detectPasswordSpraying(events).map(
      (alert) => ({ rule: "password_spraying", alert }) as const,
    ),
    ...detectOffHours(events).map(
      (alert) => ({ rule: "off_hours", alert }) as const,
    ),
    ...detectNewIp(events).map(
      (alert) => ({ rule: "new_ip", alert }) as const,
    ),
    ...detectImpossibleTravel(events, locations).map(
      (alert) => ({ rule: "impossible_travel", alert }) as const,
    ),
  ];

  const indicesByRule = new Map<Detection["rule"], number>();

  const alerts = detections.map((detection) => {
    const index = indicesByRule.get(detection.rule) ?? 0;
    indicesByRule.set(detection.rule, index + 1);

    const common = {
  id: alertId(importId, detection.rule, index),
  import_id: importId,
  user_id: user.id,
  rule: detection.rule,
  title: titles[detection.rule],
  severity: detection.alert.severity,
  explanation: explainAlert(detection),
  source_ips: [] as string[],
  usernames: [] as string[],
};

    switch (detection.rule) {
      case "brute_force":
        return {
          ...common,
          usernames: [detection.alert.username],
          event_count: detection.alert.failureCount,
        };

      case "password_spraying":
        return {
          ...common,
          source_ips: [detection.alert.ipAddress],
          // Chaque compte distinct représente au moins un échec.
          event_count: detection.alert.accountCount,
        };

      case "off_hours":
      case "new_ip":
        return {
          ...common,
          usernames: [detection.alert.username],
          source_ips: detection.alert.ip_address ? [detection.alert.ip_address] : [],
          first_seen: detection.alert.timestamp,
          last_seen: detection.alert.timestamp,
          event_count: 1,
        };

      case "impossible_travel": {
        const { username, fromIp, toIp } = detection.alert;
        return {
          ...common,
          usernames: [username],
          source_ips: [fromIp, toIp],
          event_count: 2,
          ip_info: {
            from: locations.get(fromIp) ?? null,
            to: locations.get(toIp) ?? null,
          },
        };
      }
    }
  });

  if (alerts.length > 0) {
    const { error } = await supabase.from("alerts").upsert(alerts, {
      onConflict: "id",
      ignoreDuplicates: true,
    });

    if (error) return { error: error.message };
  }

  const { error: updateError } = await supabase
    .from("log_imports")
    .update({ status: "analyzed", analyzed_at: new Date().toISOString() })
    .eq("id", importId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/imports");
  revalidatePath("/alerts");
  revalidatePath("/dashboard");

  return { success: true, alertCount: alerts.length };
}