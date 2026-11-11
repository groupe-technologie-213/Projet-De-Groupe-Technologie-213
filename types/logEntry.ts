export type LogEntry = {
  timestamp: string;
  username: string;
  ip: string;
  status: "success" | "failure";
};