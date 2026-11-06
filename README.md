# LogSentinel

Application web de **cybersécurité** qui importe des journaux de connexion, les analyse automatiquement pour repérer des **comportements suspects** (force brute, connexions inhabituelles…) et génère des **alertes qui expliquent clairement** pourquoi chaque comportement mérite d'être vérifié.

> 🚧 **État actuel** : seule l'architecture est en place. La plupart des fichiers sont **vides**. Chaque membre de l'équipe a sa partie : voir [Répartition des tâches](#-répartition-des-tâches).

---

## Sommaire

1. [Le problème](#-le-problème)
2. [Fonctionnalités](#-fonctionnalités)
3. [Règles de détection](#-règles-de-détection)
4. [Stack technique](#-stack-technique)
5. [Démarrage rapide](#-démarrage-rapide)
6. [Architecture](#-architecture)
7. [Répartition des tâches](#-répartition-des-tâches)
8. [Travailler en équipe](#-travailler-en-équipe)

---

## ❓ Le problème

Un serveur, un VPN ou une application web enregistre chaque tentative de connexion dans un journal (log). Ces fichiers contiennent souvent des milliers de lignes illisibles à l'œil nu. Une attaque y est pourtant visible : par exemple, 40 mots de passe faux sur le compte `admin` en deux minutes. LogSentinel fait ce tri à la place de l'analyste et lui montre seulement ce qui compte, par ordre de gravité.

---

## 🎯 Fonctionnalités

1. **Compte utilisateur** : connexion avec GitHub (OAuth) ou email + mot de passe. Chaque utilisateur ne voit que ses propres imports et alertes.
2. **Import de journaux** (page Imports) : envoi d'un fichier CSV ou JSON. Un import peut être renommé ou supprimé (ce qui supprime aussi ses événements et ses alertes).

   ```csv
   timestamp,username,source_ip,event_type,user_agent
   2026-11-06T08:14:02Z,admin,185.220.101.4,login_failure,curl/8.0
   2026-11-06T08:14:05Z,admin,185.220.101.4,login_failure,curl/8.0
   2026-11-06T08:15:40Z,admin,185.220.101.4,login_success,curl/8.0
   ```

   Types d'événements reconnus : `login_success`, `login_failure`, `logout`, `password_change`.
3. **Analyse** : un bouton **Analyser** passe tous les événements de l'import dans les règles de détection et crée une alerte pour chaque scénario suspect.
4. **Alertes** (page Alertes) :
   - filtrer par sévérité (faible, moyenne, haute, critique), par statut ou par règle ;
   - rechercher par compte ou par adresse IP ;
   - ouvrir une alerte : explication, comptes et IP concernés, période, nombre d'événements, localisation et réputation de l'IP ;
   - changer son statut (ouverte → en investigation → résolue, ou faux positif) et ajouter des notes ;
   - supprimer une alerte ou en créer une à la main.
5. **Tableau de bord** : nombre d'imports, d'événements analysés, d'alertes ouvertes et d'alertes graves.

### Parcours de démo

1. Créer un compte avec GitHub.
2. Importer `samples/auth-logs-sample.csv`.
3. Cliquer sur **Analyser** : des alertes de force brute et de password spraying apparaissent.
4. Filtrer les alertes « critiques », en ouvrir une et lire l'explication et la localisation de l'IP.
5. Passer l'alerte en « résolue » avec une note. Le tableau de bord se met à jour.

---

## 🚨 Règles de détection

| Règle | Ce qu'elle repère | Seuil (ajustable) | Pourquoi c'est suspect |
| ----- | ----------------- | ----------------- | ---------------------- |
| Force brute | Beaucoup d'échecs sur un même compte en peu de temps | ≥ 5 échecs en 5 min | Quelqu'un essaie de deviner le mot de passe. **Critique** si un succès suit les échecs (compte peut-être compromis). |
| Password spraying | Une même IP qui échoue sur beaucoup de comptes différents | ≥ 5 comptes en 10 min | L'attaquant teste un mot de passe courant sur tous les comptes pour passer sous les seuils de blocage. |
| Voyage impossible | Deux connexions réussies d'un même compte depuis des pays trop éloignés pour le temps écoulé | Paris puis Singapour en 20 min | Le compte est probablement utilisé par quelqu'un d'autre que son propriétaire. |
| Connexion hors horaires | Connexion réussie en pleine nuit | Entre 0 h et 5 h | Activité inhabituelle, typique d'un accès volé. |
| Nouvelle IP | Connexion réussie depuis une IP jamais vue pour ce compte | Première apparition | Changement d'appareil ou de lieu à confirmer. |

Chaque alerte contient une **explication en langage clair**, générée à partir des données. Exemple :

> « Le compte admin a subi 12 échecs de connexion en 3 minutes depuis l'IP 185.220.101.4 (Allemagne, signalée comme nœud Tor), suivis d'une connexion réussie. Ce schéma correspond à une attaque par force brute ayant probablement abouti : vérifiez l'activité du compte et changez son mot de passe. »

---

## 🧰 Stack technique

```
Navigateur ──► Next.js (hébergé sur Vercel) ──► Supabase (Postgres + Auth)
                          │
                          └──► API externe de géolocalisation / réputation IP
```

| Outil | Rôle |
| ----- | ---- |
| [Next.js 16](https://nextjs.org/docs) (App Router) + TypeScript | Pages et logique serveur |
| [Supabase](https://supabase.com/docs) | Base Postgres, authentification (GitHub + email), Row Level Security |
| [Tailwind CSS 4](https://tailwindcss.com/docs) | Style et responsive |
| [Vercel](https://vercel.com/docs) | Hébergement (une URL de test par Pull Request) |

### Principes à respecter

- **Server Components par défaut** : les pages lisent les données sur le serveur. Seuls les éléments interactifs (formulaires, filtres, menu actif) sont des Client Components (`"use client"`).
- **Server Actions pour toutes les modifications** (import, analyse, statut, suppression), dans les fichiers `actions.ts`. Jamais d'écriture directe depuis le navigateur.
- **`proxy.ts`** s'exécute avant chaque requête : il rafraîchit la session et redirige vers `/login` si l'utilisateur n'est pas connecté.
- **Chaque page a un `loading.tsx`** (squelette), **un `error.tsx`** (message + bouton « Réessayer ») et il existe une page 404.
- **Sécurité** :
  - RLS activé sur toutes les tables, chaque politique vérifie `user_id = auth.uid()` ;
  - on ne peut ajouter un événement ou une alerte qu'à un import qui nous appartient ;
  - l'identité est vérifiée côté serveur avec `getClaims()`, pas seulement en lisant le cookie ;
  - les redirections après connexion sont limitées aux chemins internes.

### Base de données

```
auth.users ─1:1─ profiles
     │
     └─1:n─ log_imports ─1:n─ log_events
                         └─1:n─ alerts
```

- `profiles` est créé automatiquement à l'inscription par un trigger SQL.
- Suppressions en cascade : supprimer un import supprime ses événements et ses alertes.
- Index sur `(import_id, username, occurred_at)` pour les recherches par compte et par période.

---

## 🚀 Démarrage rapide

### 1. Prérequis

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) version 20.9 ou plus (`node -v` pour vérifier)
- Une invitation au projet Supabase de l'équipe (demander au membre 1)

### 2. Cloner et installer

```bash
git clone https://github.com/Alexis-Zoa/Projet-De-Groupe-Technologie-213.git
cd Projet-De-Groupe-Technologie-213
npm install
```

### 3. Configurer Supabase

```bash
cp .env.example .env.local
```

(Sous Windows PowerShell : `Copy-Item .env.example .env.local`)

Remplir `.env.local` avec l'URL et la clé publique du projet (Supabase › Project Settings › API). **Ne jamais committer `.env.local`** (il est déjà ignoré par Git).

### 4. Lancer le projet

```bash
npm run dev
```

Puis ouvrir http://localhost:3000.

### Scripts disponibles

| Commande        | Rôle                                                        |
| --------------- | ----------------------------------------------------------- |
| `npm run dev`   | Serveur de développement (rechargement automatique)         |
| `npm run build` | Compilation pour la production (vérifie aussi le TypeScript) |
| `npm start`     | Lance la version compilée                                   |

> ⚠️ `npm run lint` ne fonctionne pas encore : ESLint n'est pas installé et son support TypeScript ne gère pas encore TypeScript 7. En attendant, `npm run build` doit passer avant chaque Pull Request.

---

## 🗂 Architecture

Avec Next.js, **chaque dossier de `app/` correspond à une URL**. Les dossiers entre parenthèses, comme `(auth)` ou `(app)`, servent seulement à regrouper des pages : ils n'apparaissent pas dans l'URL.

Les fichiers que Next.js exige non vides (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`, `proxy.ts`) contiennent un contenu minimal avec un `TODO`. Tous les autres sont vides.

```
.
├── proxy.ts                          # Avant chaque requête : session + redirection vers /login   [M1]
│
├── app/
│   ├── layout.tsx                    # Mise en page racine (charge Tailwind)                     [M1]
│   ├── page.tsx                      # Accueil                                   → /             [M1]
│   ├── globals.css                   # Import de Tailwind
│   ├── not-found.tsx                 # Page 404                                                  [M4]
│   ├── auth/callback/route.ts        # Retour de GitHub OAuth                    → /auth/callback [M1]
│   ├── (auth)/                       # Pages publiques
│   │   ├── actions.ts                # Server Actions : connexion, inscription, déconnexion      [M1]
│   │   ├── login/page.tsx            #                                           → /login        [M1]
│   │   └── signup/page.tsx           #                                           → /signup       [M1]
│   └── (app)/                        # Pages réservées aux utilisateurs connectés
│       ├── layout.tsx                # Barre de navigation commune                               [M1]
│       ├── dashboard/                # page + loading + error                    → /dashboard    [M4]
│       ├── imports/                  # page + loading + error                    → /imports      [M2]
│       │   └── actions.ts            # Server Actions : upload, renommer, supprimer, analyser    [M2, M3]
│       └── alerts/                   # page + loading + error                    → /alerts       [M4]
│           ├── actions.ts            # Server Actions : statut, notes, créer, supprimer          [M4]
│           ├── [id]/                 # page + loading + error                    → /alerts/123   [M4]
│           └── new/page.tsx          # Création manuelle                         → /alerts/new   [M4]
│
├── components/                       # Composants React
│   ├── layout/Navbar.tsx             # Menu (Client Component : lien actif)                      [M1]
│   ├── auth/                         # LoginForm, SignupForm, GithubButton                       [M1]
│   ├── imports/                      # UploadForm, ImportsTable, AnalyzeButton                   [M2]
│   ├── alerts/                       # AlertFilters, AlertsTable, AlertDetail, StatusForm,       [M4]
│   │                                 # SeverityBadge, AlertForm
│   └── dashboard/StatCard.tsx        # Carte de statistique                                      [M4]
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Client Supabase côté navigateur                           [M1]
│   │   ├── server.ts                 # Client Supabase côté serveur (cookies)                    [M1]
│   │   └── proxy.ts                  # Rafraîchissement de session, utilisé par proxy.ts         [M1]
│   ├── safe-redirect.ts              # N'autorise que les redirections internes                  [M1]
│   ├── analysis/
│   │   ├── parser.ts                 # Lecture, validation et normalisation CSV/JSON             [M2]
│   │   ├── rules.ts                  # Les 5 règles (fenêtre glissante)                          [M3]
│   │   └── explanations.ts           # Phrases d'explication des alertes                         [M3]
│   └── ip-intel.ts                   # API de géolocalisation / réputation IP                    [M3]
│
├── types/database.ts                 # Types partagés : Profile, LogImport, LogEvent, Alert…     [M1]
├── supabase/migrations/0001_init.sql # Tables, trigger, index, politiques RLS                    [M1]
├── samples/auth-logs-sample.csv      # Fichier de démo (doit déclencher plusieurs alertes)       [M2]
│
└── tests/
    ├── unit/                         # Tests du parser et des règles                             [M2, M3]
    └── rls/                          # Test RLS : deux utilisateurs isolés (npm run test:rls)    [M1]
```

### Traitement d'un fichier, étape par étape

```
UploadForm ─► imports/actions.ts ─► log_imports (statut pending)
                     │
                     ├─► lib/analysis/parser.ts   lignes valides normalisées, invalides comptées
                     └─► log_events               insertion par lots

AnalyzeButton ─► imports/actions.ts ─► lib/analysis/rules.ts ─► lib/ip-intel.ts ─► explanations.ts
                                                                                        │
                     /alerts, /alerts/[id], /dashboard ◄─ alerts ◄──────────────────────┘
                                                (import passe au statut analyzed)
```

---

## 👥 Répartition des tâches

Le projet est découpé en **4 parties verticales** : chacun travaille sur ses propres fichiers (repérés par `[M1]` à `[M4]` dans l'arborescence ci-dessus), ce qui limite les conflits Git.

| Membre | Partie | Nom |
| ------ | ------ | --- |
| **M1** | Socle, authentification et sécurité | *à compléter* |
| **M2** | Imports de journaux | *à compléter* |
| **M3** | Moteur de détection | *à compléter* |
| **M4** | Alertes et tableau de bord | *à compléter* |

### M1 — Socle, authentification et sécurité

**Branche** : `feature/auth`

- [ ] Créer le projet Supabase, inviter les 3 autres membres, activer la connexion GitHub et email
- [ ] `supabase/migrations/0001_init.sql` : tables `profiles`, `log_imports`, `log_events`, `alerts`, suppressions en cascade, index
- [ ] Trigger SQL qui crée `profiles` à l'inscription
- [ ] Politiques RLS sur toutes les tables (`user_id = auth.uid()`), y compris « on n'ajoute qu'à un import qui nous appartient »
- [ ] `types/database.ts` : types partagés (**à livrer en premier**, voir [Ordre de travail](#ordre-de-travail))
- [ ] `lib/supabase/*`, `proxy.ts` : session et redirection vers `/login`, vérification avec `getClaims()`
- [ ] Pages `/login` et `/signup`, `auth/callback`, Server Actions de connexion, inscription et déconnexion
- [ ] `lib/safe-redirect.ts` : redirections limitées aux chemins internes
- [ ] Mise en page `(app)/layout.tsx` + `Navbar`
- [ ] `npm run test:rls` : deux utilisateurs simulés, aucun n'accède aux données de l'autre
- [ ] Déploiement Vercel et variables d'environnement

### M2 — Imports de journaux

**Branche** : `feature/imports`

- [ ] `lib/analysis/parser.ts` : lecture CSV et JSON, validation (date, IP, type d'événement), normalisation, comptage des lignes invalides
- [ ] Server Action d'upload : crée l'import (statut `pending`), parse, insère les événements **par lots**
- [ ] Page `/imports` : `UploadForm`, `ImportsTable` (nom, date, nombre d'événements, lignes ignorées, statut)
- [ ] Renommer et supprimer un import
- [ ] `samples/auth-logs-sample.csv` : fichier de démo qui déclenche force brute **et** password spraying
- [ ] Tests unitaires du parser (`tests/unit/`)

### M3 — Moteur de détection

**Branche** : `feature/detection`

- [ ] `lib/analysis/rules.ts` : tri par date, regroupement par compte ou IP, fenêtre glissante
- [ ] Les 5 règles : force brute, password spraying, voyage impossible, connexion hors horaires, nouvelle IP, avec leur sévérité
- [ ] `lib/analysis/explanations.ts` : phrase claire pour chaque alerte (voir l'exemple plus haut)
- [ ] `lib/ip-intel.ts` : appel à l'API de géolocalisation / réputation (pays, ville, fournisseur), avec gestion des erreurs et des limites de l'API
- [ ] Server Action « Analyser » (`AnalyzeButton`) : crée les alertes, passe l'import en `analyzed`
- [ ] Tests unitaires de chaque règle (`tests/unit/`)

> Les règles sont des **fonctions pures** (liste d'événements → liste d'alertes) : elles se codent et se testent sans base de données ni interface, dès le premier jour.

### M4 — Alertes et tableau de bord

**Branche** : `feature/alerts`

- [ ] Page `/alerts` : `AlertsTable`, `AlertFilters` (sévérité, statut, règle) et recherche par compte ou IP
- [ ] Page `/alerts/[id]` : explication, comptes et IP, période, nombre d'événements, localisation et réputation de l'IP
- [ ] `StatusForm` : changement de statut et notes d'analyste
- [ ] Supprimer une alerte, créer une alerte à la main (`/alerts/new`)
- [ ] Page `/dashboard` avec `StatCard` : imports, événements analysés, alertes ouvertes, alertes graves
- [ ] `loading.tsx`, `error.tsx` de chaque page, page 404, `SeverityBadge`
- [ ] Interface responsive avec Tailwind

### Ordre de travail

| Étape | Qui | Quoi |
| ----- | --- | ---- |
| **1. Le contrat** (premiers jours) | M1, relu par tous | `types/database.ts` + `0001_init.sql` fusionnés dans `main`. Tout le monde s'appuie dessus ensuite. |
| **2. En parallèle** | M2, M3, M4 | M3 code et teste ses règles sur des données inventées. M2 et M4 construisent leurs pages avec des données factices, puis les branchent sur Supabase dès que le contrat est fusionné. |
| **3. Intégration** | Tous | Le parcours de démo complet fonctionne sur l'URL Vercel. |
| **4. Finitions** | Tous | Responsive, messages d'erreur, explications, préparation de la démo. |

### Règles communes

- **Seul M1 modifie `types/database.ts` et `supabase/migrations/`.** Si vous avez besoin d'une colonne ou d'un type en plus, demandez-le à M1 (ou proposez-le dans une Pull Request relue par M1). Une nouvelle modification du schéma = un **nouveau** fichier de migration (`0002_...sql`), jamais une modification de `0001`.
- **Ne modifiez pas le schéma directement dans l'interface Supabase** : tout passe par les fichiers de migration, sinon les bases de chacun divergent.
- Le projet Supabase gratuit **se met en pause après environ une semaine sans activité** : pensez à le réveiller avant la démo.

---

## 🤝 Travailler en équipe

### Avant de commencer à coder

Toujours partir d'un `main` à jour :

```bash
git checkout main
git pull origin main
npm install
```

### Créer sa branche

```bash
git checkout -b feature/nom-de-la-partie
```

### Enregistrer et envoyer son travail

```bash
git add .
git commit -m "feat: ajoute la règle de force brute"
git push origin feature/nom-de-la-partie
```

Puis ouvrir une **Pull Request** vers `main` et demander une relecture à un membre **d'une autre partie**. Vercel crée automatiquement une URL de test pour chaque Pull Request.

### Récupérer le travail des autres

```bash
git checkout main
git pull origin main
git checkout feature/ma-partie
git merge main
```

### Conventions

- **Branches** : `feature/...`, `fix/...`, `docs/...`
- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/) — `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- **Pull Requests courtes** : une fonctionnalité à la fois, plus facile à relire.
- **Avant chaque Pull Request** : `npm run build` doit passer sans erreur.
- **Ne jamais réécrire l'historique de `main`** (pas de `git push --force` sur `main`) : passez toujours par une Pull Request.
- Ne jamais committer `node_modules/`, `.next/` ni `.env.local` (déjà ignorés par `.gitignore`).
Mohamed Dahorri
Mohamed Dahorri
