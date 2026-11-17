import type * as rules from "./rules";

type DetectionAlert =
  | { rule: "brute_force"; alert: ReturnType<typeof rules.detectBruteForce>[number] }
  | { rule: "password_spraying"; alert: ReturnType<typeof rules.detectPasswordSpraying>[number] }
  | { rule: "off_hours"; alert: ReturnType<typeof rules.detectOffHours>[number] }
  | { rule: "new_ip"; alert: ReturnType<typeof rules.detectNewIp>[number] }
  | { rule: "impossible_travel"; alert: ReturnType<typeof rules.detectImpossibleTravel>[number] };

export function explainAlert(detection: DetectionAlert): string {
  switch (detection.rule) {
    case "brute_force": {
      const { username, failureCount, severity } = detection.alert;
      const summary =
        `Le compte ${username} a subi ${failureCount} échecs de connexion en cinq minutes ou moins.`;

      if (severity === "critical") {
        return `${summary} Une connexion réussie a suivi. Vérifiez si le compte a été utilisé sans autorisation.`;
      }

      return `${summary} Vérifiez si ces tentatives étaient légitimes.`;
    }

    case "password_spraying": {
      const { ipAddress, accountCount } = detection.alert;
      return `L’adresse IP ${ipAddress} a échoué à se connecter à ${accountCount} comptes distincts en dix minutes ou moins. Vérifiez l’origine de ces tentatives.`;
    }

    case "off_hours": {
      const { username, timestamp, ip_address } = detection.alert;
      const utcTime = new Date(timestamp).toISOString().slice(11, 16);
      return `Le compte ${username} s’est connecté à ${utcTime} UTC depuis ${ip_address}, pendant la plage de surveillance de minuit à 05 h UTC. Vérifiez si cette connexion était attendue.`;
    }

    case "new_ip": {
      const { username, ip_address } = detection.alert;
      return `Le compte ${username} s’est connecté depuis ${ip_address}, une adresse absente de ses connexions réussies précédentes dans les journaux analysés. Vérifiez si ce nouvel accès était attendu.`;
    }

    case "impossible_travel": {
      const { username, fromIp, toIp, elapsedMinutes, distanceKm } = detection.alert;
      return `Le compte ${username} s’est connecté depuis ${fromIp}, puis ${toIp}, à ${elapsedMinutes.toFixed(1)} minutes d’intervalle. Les deux IP sont estimées à ${distanceKm} km l’une de l’autre. Vérifiez si un VPN ou un accès non autorisé peut expliquer l’écart.`;
    }
  }
}