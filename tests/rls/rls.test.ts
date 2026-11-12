import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// Deux utilisateurs fictifs (identifiants fixes, plus simples à lire)
const ALICE = "11111111-1111-1111-1111-111111111111"
const BOB = "22222222-2222-2222-2222-222222222222"

// Le minimum de ce que Supabase fournit, pour que la migration s'exécute telle quelle :
// rôles, table auth.users et fonction auth.uid() qui lit l'utilisateur « connecté ».
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;

  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );

  create function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`

let db: PGlite
let aliceImportId: string
// Exécute fn « en tant que » userId : rôle authenticated + identifiant dans le jeton,
// exactement comme une requête venant de l'application.
async function asUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec("set role authenticated")
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId])
  try {
    return await fn()
  } finally {
    await db.exec("reset role")
  }
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUB)

  // La VRAIE migration du projet, sans modification
  const migration = readFileSync(join(process.cwd(), "supabase/migrations/0001_init.sql"), "utf8")
  await db.exec(migration)

  // Alice et Bob s'inscrivent (le trigger doit créer leurs profils)
  await db.query(
    "insert into auth.users (id, email) values ($1, 'alice@example.com'), ($2, 'bob@example.com')",
        [ALICE, BOB],
  )

  // Alice crée un import, un événement et une alerte (en tant qu'Alice, via la RLS)
  const { rows } = await asUser(ALICE, () =>
    db.query<{ id: string }>(
      "insert into public.log_imports (name, file_format) values ('Import d''Alice', 'csv') returning id",
    ),
  )
  aliceImportId = rows[0].id

  await asUser(ALICE, () =>
    db.query(
      "insert into public.log_events (import_id, occurred_at, username, source_ip, event_type) values ($1, now(), 'admin', '185.220.101.4', 'login_failure')",
      [aliceImportId],
    ),
  )
  await asUser(ALICE, () =>
    db.query(
      "insert into public.alerts (import_id, rule, severity, title, explanation) values ($1, 'brute_force', 'critical', 'Force brute sur admin', 'Alerte de test')",
      [aliceImportId],
    ),
  )
})

afterAll(async () => {
  await db.close()
})

describe("Préparation", () => {
  it("crée un profil pour chaque utilisateur (trigger)", async () => {
    const { rows } = await db.query<{ n: number }>("select count(*)::int as n from public.profiles")
    expect(rows[0].n).toBe(2)
  })

  it("simule bien l'utilisateur connecté", async () => {
    const { rows } = await asUser(ALICE, () => db.query<{ id: string }>("select auth.uid() as id"))
    expect(rows[0].id).toBe(ALICE)
  })
})
describe("Lecture : chacun ne voit que ses données", () => {
  it("Alice voit son import, son événement et son alerte (témoin)", async () => {
    const imports = await asUser(ALICE, () => db.query("select id from public.log_imports"))
    const events = await asUser(ALICE, () => db.query("select id from public.log_events"))
    const alerts = await asUser(ALICE, () => db.query("select id from public.alerts"))

    expect(imports.rows).toHaveLength(1)
    expect(events.rows).toHaveLength(1)
    expect(alerts.rows).toHaveLength(1)
  })

  it("Bob ne voit aucun import d'Alice", async () => {
    const { rows } = await asUser(BOB, () => db.query("select id from public.log_imports"))
    expect(rows).toHaveLength(0)
  })

  it("Bob ne voit aucun événement d'Alice", async () => {
    const { rows } = await asUser(BOB, () => db.query("select id from public.log_events"))
    expect(rows).toHaveLength(0)
  })

  it("Bob ne voit aucune alerte d'Alice", async () => {
    const { rows } = await asUser(BOB, () => db.query("select id from public.alerts"))
    expect(rows).toHaveLength(0)
  })

  it("Bob ne voit que son propre profil", async () => {
    const { rows } = await asUser(BOB, () => db.query<{ id: string }>("select id from public.profiles"))
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(BOB)
  })

  it("un visiteur non connecté n'a accès à rien", async () => {
    await db.exec("set role anon")
    try {
      await expect(db.query("select id from public.log_imports")).rejects.toThrow("permission denied")
    } finally {
      await db.exec("reset role")
    }
  })
})

describe("Écriture : personne ne touche aux données des autres", () => {
  it("Bob ne peut pas renommer l'import d'Alice", async () => {
    const result = await asUser(BOB, () =>
      db.query("update public.log_imports set name = 'Piraté' where id = $1", [aliceImportId]),
    )
    expect(result.affectedRows).toBe(0)

    // Vérification en administrateur : le nom n'a pas changé
    const { rows } = await db.query<{ name: string }>("select name from public.log_imports where id = $1", [
      aliceImportId,
    ])
    expect(rows[0].name).toBe("Import d'Alice")
  })

  it("Bob ne peut pas modifier une alerte d'Alice", async () => {
    const result = await asUser(BOB, () =>
      db.query("update public.alerts set status = 'resolved' where import_id = $1", [aliceImportId]),
    )
    expect(result.affectedRows).toBe(0)
  })

  it("Bob ne peut pas supprimer l'import d'Alice", async () => {
    const result = await asUser(BOB, () => db.query("delete from public.log_imports where id = $1", [aliceImportId]))
    expect(result.affectedRows).toBe(0)

    // Vérification en administrateur : l'import existe toujours
    const { rows } = await db.query("select id from public.log_imports where id = $1", [aliceImportId])
    expect(rows).toHaveLength(1)
  })

  it("Bob ne peut pas ajouter d'événement dans l'import d'Alice", async () => {
    await expect(
      asUser(BOB, () =>
        db.query(
          "insert into public.log_events (import_id, occurred_at, username, source_ip, event_type) values ($1, now(), 'admin', '1.2.3.4', 'login_success')",
          [aliceImportId],
        ),
      ),
    ).rejects.toThrow("row-level security")
  })

  it("Bob ne peut pas créer d'alerte sur l'import d'Alice", async () => {
    await expect(
      asUser(BOB, () =>
        db.query(
          "insert into public.alerts (import_id, rule, severity, title, explanation) values ($1, 'manual', 'low', 'Fausse alerte', 'Test')",
          [aliceImportId],
        ),
      ),
    ).rejects.toThrow("row-level security")
  })

  it("Bob ne peut pas créer un import au nom d'Alice", async () => {
    await expect(
      asUser(BOB, () =>
        db.query("insert into public.log_imports (user_id, name, file_format) values ($1, 'Usurpation', 'csv')", [
          ALICE,
        ]),
      ),
    ).rejects.toThrow("row-level security")
  })

  it("personne ne peut modifier un événement, même son propriétaire", async () => {
    await expect(
      asUser(ALICE, () =>
        db.query("update public.log_events set username = 'autre' where import_id = $1", [aliceImportId]),
      ),
    ).rejects.toThrow("permission denied")
  })
})