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