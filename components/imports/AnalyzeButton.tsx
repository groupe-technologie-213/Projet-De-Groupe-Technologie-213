"use client";

import { useState, useTransition } from "react";
import { analyzeImportAction } from "@/app/(app)/imports/analyze";

export default function AnalyzeButton({ importId }: { importId: string }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    message: string;
    error: boolean;
  } | null>(null);

  function analyze() {
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await analyzeImportAction(importId);

        if ("error" in result) {
          setFeedback({
            message: result.error ?? "L’analyse a échoué.",
            error: true,
          });
          return;
        }

        setFeedback({
          message: `Analyse terminée. Alertes détectées : ${result.alertCount}.`,
          error: false,
        });
      } catch {
        setFeedback({ message: "Le serveur n’a pas répondu.", error: true });
      }
    });
  }

  return (
    <div>
      <button type="button" onClick={analyze} disabled={pending}>
        {pending ? "Analyse en cours…" : "Analyser"}
      </button>
      {feedback && (
        <p role={feedback.error ? "alert" : "status"}>{feedback.message}</p>
      )}
    </div>
  );
}