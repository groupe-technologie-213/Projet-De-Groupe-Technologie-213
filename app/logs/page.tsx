"use client";

import { useState, type FormEvent } from "react";
import type { LogEntry } from "../../types/logEntry";

export default function LogsPage() {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function importLogs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setEntries(null);
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message ?? "L’import a échoué.");
        return;
      }

      setEntries(result.entries);
    } catch {
      setError("Impossible de lire la réponse du serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Journaux de connexion</h1>

      <form onSubmit={importLogs}>
        <label htmlFor="log-file">Fichier de journaux</label>{" "}
        <input id="log-file" name="file" type="file" accept=".log,.csv" required />
        <button type="submit" disabled={loading}>
          {loading ? "Lecture en cours…" : "Importer"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {entries && (
        <>
          <p>Événements lus : {entries.length}</p>
          <ul>
            {entries.map((entry, index) => (
              <li key={index}>
                {entry.timestamp} · {entry.username} · {entry.ip} · {entry.status}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}