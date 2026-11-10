import type { Tables, TablesInsert } from "./supabase"

export type Profile = Tables<"profiles">
export type LogImport = Tables<"log_imports">
export type LogEvent = Tables<"log_events">
export type Alert = Tables<"alerts">

export type Newlogevent = TablesInsert<"log_events">
export type NewAlert = TablesInsert<"alerts">

export type EventType = "login_success" | "login_failure" | "logout" | "password_change"
export type ImportStatus = "pending" | "analyzed" | "failed"
export type Severity = "low" | "medium" | "high" | "critical"
export type AlertStatus =  "open" | "investigating" | "resolved" | "false_positive"
export type RuleType = "brute_force" | "password_spraying" | "impossible_travel" | "off_hours" | "new_ip" | "manual"
