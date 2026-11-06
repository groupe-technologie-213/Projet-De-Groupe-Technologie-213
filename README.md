# Projet-De-Groupe-Technologie-213 — Analyseur de journaux de connexion

Application web de **cybersécurité** qui analyse des journaux de connexion (logs) pour **détecter des comportements suspects**.

Exemple : si un compte subit plusieurs tentatives de connexion échouées en quelques minutes, l'application génère une **alerte** et **explique pourquoi** ce comportement mérite d'être vérifié.

> 🚧 **État actuel** : seule l'architecture est en place. La plupart des fichiers sont **vides** et attendent d'être développés (voir [Architecture](#-architecture)).

---

## 🎯 Fonctionnalités prévues

1. **Import de journaux** : envoyer un fichier de logs de connexion (ex. `samples/auth-sample.log`).
2. **Analyse** : chaque ligne est transformée en entrée structurée (date, utilisateur, IP, succès/échec).
3. **Détection** : des règles parcourent les entrées et repèrent les comportements suspects.
4. **Alertes expliquées** : chaque alerte indique le compte concerné, la gravité et une explication lisible.
5. **Interface web** : consulter les journaux importés, la liste des alertes et le détail de chaque alerte.

### Règles de détection (exemples)

| Règle | Fichier | Comportement détecté |
| ----- | ------- | -------------------- |
| Force brute | `lib/detection/rules/bruteForce.ts` | Plusieurs échecs de connexion sur un même compte en peu de temps |
| IP multiples | `lib/detection/rules/multipleIps.ts` | Un même compte utilisé depuis plusieurs adresses IP différentes en peu de temps |
| Heure inhabituelle | `lib/detection/rules/unusualHour.ts` | Connexion à une heure anormale (ex. en pleine nuit) |

Les seuils (nombre d'échecs, fenêtre de temps…) seront centralisés dans `lib/config.ts`.

---

## 🧰 Stack technique

- **Framework** : [Next.js](https://nextjs.org/docs) 16 (App Router) — frontend **et** API dans le même projet
- **Langage** : TypeScript
- **Interface** : React 19
- **Données** : stockage en mémoire (pas de base de données pour l'instant)

---

## 🚀 Démarrage rapide

### 1. Prérequis

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) version 20 ou plus (`node -v` pour vérifier)

### 2. Cloner le dépôt

```bash
git clone https://github.com/Alexis-Zoa/Projet-De-Groupe-Technologie-213.git
cd Projet-De-Groupe-Technologie-213
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Lancer le projet

```bash
npm run dev
```

Puis ouvrir http://localhost:3000.

### Scripts disponibles

| Commande        | Rôle                                                        |
| --------------- | ----------------------------------------------------------- |
| `npm run dev`   | Lance le serveur de développement (rechargement automatique) |
| `npm run build` | Compile le projet pour la production (vérifie aussi le TypeScript) |
| `npm start`     | Lance la version compilée                                   |

> ⚠️ `npm run lint` n'est pas encore fonctionnel : ESLint n'est pas installé, et son support TypeScript ne gère pas encore TypeScript 7. En attendant, lancez `npm run build` avant chaque Pull Request.

---

## 🗂 Architecture

Avec Next.js, **chaque dossier de `app/` correspond à une URL** : un fichier `page.tsx` est une page, un fichier `route.ts` est une route d'API.

```
.
├── app/                              # Pages et API (App Router de Next.js)
│   ├── layout.tsx                    # Mise en page commune à toutes les pages
│   ├── page.tsx                      # Accueil                       → /
│   ├── globals.css                   # Styles globaux
│   ├── logs/page.tsx                 # Import + liste des logs        → /logs
│   ├── alerts/
│   │   ├── page.tsx                  # Liste des alertes              → /alerts
│   │   └── [id]/page.tsx             # Détail + explication           → /alerts/123
│   └── api/                          # API (backend)
│       ├── logs/route.ts             # GET liste des logs, POST import  → /api/logs
│       └── alerts/
│           ├── route.ts              # GET liste des alertes          → /api/alerts
│           └── [id]/route.ts         # GET détail d'une alerte        → /api/alerts/123
│
├── components/                       # Composants React réutilisables
│   ├── Navbar.tsx                    # Barre de navigation
│   ├── LogUploader.tsx               # Formulaire d'envoi d'un fichier de logs
│   ├── LogTable.tsx                  # Tableau des entrées de logs
│   ├── AlertList.tsx                 # Liste d'alertes
│   └── AlertCard.tsx                 # Carte d'une alerte (gravité, compte, explication)
│
├── lib/                              # Logique métier (aucun code d'affichage ici)
│   ├── config.ts                     # Seuils de détection, fenêtres de temps
│   ├── db.ts                         # Stockage en mémoire (logs importés, alertes)
│   ├── parser/logParser.ts           # Transforme le texte brut des logs en entrées structurées
│   ├── detection/
│   │   ├── detectionEngine.ts        # Applique toutes les règles sur les entrées
│   │   └── rules/                    # Une règle de détection = un fichier
│   │       ├── index.ts              # Liste des règles actives
│   │       ├── bruteForce.ts
│   │       ├── multipleIps.ts
│   │       └── unusualHour.ts
│   ├── alerts/alertService.ts        # Crée, enregistre et liste les alertes
│   └── utils/time.ts                 # Fonctions utilitaires sur les dates / fenêtres de temps
│
├── types/                            # Types TypeScript partagés
│   ├── logEntry.ts                   # Une entrée de log (date, utilisateur, IP, statut…)
│   └── alert.ts                      # Une alerte (règle, gravité, compte, explication…)
│
├── samples/auth-sample.log           # Exemple de journal de connexion pour tester
│
├── tests/
│   ├── unit/                         # Tests unitaires (règles, parser, services)
│   └── integration/                  # Tests des routes de l'API
│
├── package.json
└── tsconfig.json
```

Les fichiers de `app/` contiennent un contenu minimal (un titre, ou une réponse `501 Non implémenté` pour l'API), car Next.js refuse de compiler une page ou une route vide. Tous les autres fichiers sont vides.

### Flux d'une analyse

```
LogUploader ──▶ POST /api/logs ──▶ lib/parser ──▶ lib/detection (rules/*) ──▶ lib/alerts ──▶ lib/db
                                                                                               │
/alerts, /alerts/[id] ◀──────────────── GET /api/alerts ◀──────────────────────────────────────┘
```

---

## 🤝 Travailler en équipe

### Récupérer le projet la première fois

Suivre la section [Démarrage rapide](#-démarrage-rapide).

### Avant de commencer à coder

Toujours partir d'un `main` à jour :

```bash
git checkout main
git pull origin main
npm install
```

### Créer sa branche

Une branche par fonctionnalité :

```bash
git checkout -b feature/nom-de-la-fonctionnalite
```

### Enregistrer et envoyer son travail

```bash
git add .
git commit -m "feat: ajoute la règle de force brute"
git push origin feature/nom-de-la-fonctionnalite
```

Puis ouvrir une **Pull Request** vers `main` sur GitHub et demander une relecture à un membre de l'équipe.

### Récupérer le travail des autres

```bash
git checkout main
git pull origin main
git checkout feature/ma-branche
git merge main
```

### Conventions

- **Branches** : `feature/...`, `fix/...`, `docs/...`
- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/) — `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- **Avant chaque Pull Request** : `npm run build` doit passer sans erreur.
- **Ne jamais réécrire l'historique de `main`** (pas de `git push --force` sur `main`) : passez toujours par une Pull Request.
- Ne jamais committer `node_modules/`, `.next/` ni les fichiers `.env*.local` (déjà ignorés par `.gitignore`).
