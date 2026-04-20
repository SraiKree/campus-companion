/**
 * Seeds Supabase Auth users for every club in the `clubs` table:
 *   - Creates/updates an auth user with password Club@2026
 *   - Upserts a `user_roles` row with role = 'club'
 *   - Links `clubs.user_id` to the new auth user
 *
 * Run once after applying sql/clubs_schema.sql:
 *   npx tsx scripts/seed-club-users.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (already used by lib/supabase-admin.ts).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load env without adding a dotenv dependency. Checks .env.local then .env.
const candidates = ['.env.local', '.env'].map((f) => resolve(process.cwd(), f));
let envPath = '';
let raw = '';
for (const p of candidates) {
  try {
    raw = readFileSync(p, 'utf8');
    envPath = p;
    break;
  } catch {
    // try next
  }
}
if (!envPath) {
  console.error(`Could not find .env.local or .env in ${process.cwd()}`);
  console.error('Run this script from the project root.');
  process.exit(1);
}

for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error(`  NEXT_PUBLIC_SUPABASE_URL:     ${SUPABASE_URL ? 'set' : 'MISSING'}`);
  console.error(`  SUPABASE_SERVICE_ROLE_KEY:    ${SERVICE_KEY ? 'set' : 'MISSING'}`);
  console.error(`\nLoaded from: ${envPath}`);
  console.error(`Keys found in file: ${raw.split(/\r?\n/).map(l => l.split('=')[0].trim()).filter(Boolean).filter(k => !k.startsWith('#')).join(', ')}`);
  process.exit(1);
}

const DEFAULT_PASSWORD = 'Club@2026';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isEmailExistsError(err: any): boolean {
  const msg = (err?.message || '').toString().toLowerCase();
  return err?.code === 'email_exists' || msg.includes('already been registered') || msg.includes('already registered') || msg.includes('already exists');
}

async function seedClub(name: string, email: string) {
  // 1. Try to create the user. On first run this succeeds.
  const { data: createRes, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'club', name },
  });

  let userId: string | null = createRes?.user?.id ?? null;

  if (createErr && !isEmailExistsError(createErr)) {
    throw createErr;
  }

  // 2. If email already existed, look up id via the `profiles` table (email is indexed there).
  if (!userId) {
    const { data: profile } = await admin
      .from('profiles').select('id').eq('email', email).maybeSingle();
    userId = profile?.id ?? null;

    if (!userId) {
      // Fall back to an existing clubs.user_id (set on a prior run)
      const { data: prior } = await admin
        .from('clubs').select('user_id').eq('name', name).maybeSingle();
      userId = prior?.user_id ?? null;
    }

    if (!userId) {
      throw new Error(`user exists but id lookup failed — reset password manually in Supabase dashboard`);
    }

    // Reset password + metadata so the known default always works.
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password: DEFAULT_PASSWORD,
      user_metadata: { role: 'club', name },
    });
    if (updErr) throw updErr;
    console.log(`  ↻ existing user updated: ${email}`);
  } else {
    console.log(`  + created: ${email}`);
  }

  // 3. user_roles upsert
  const { error: roleErr } = await admin
    .from('user_roles')
    .upsert({ user_id: userId, role: 'club' }, { onConflict: 'user_id' });
  if (roleErr) throw roleErr;

  // 4. link clubs.user_id
  const { error: linkErr } = await admin
    .from('clubs')
    .update({ user_id: userId })
    .eq('name', name);
  if (linkErr) throw linkErr;
}

async function main() {
  const { data: clubs, error } = await admin
    .from('clubs')
    .select('name, contact_email')
    .order('name');

  if (error) throw error;
  if (!clubs?.length) {
    console.error('No clubs found — run sql/clubs_schema.sql first.');
    process.exit(1);
  }

  console.log(`Seeding auth users for ${clubs.length} clubs (password: ${DEFAULT_PASSWORD})\n`);

  for (const c of clubs) {
    if (!c.contact_email) {
      console.warn(`  ⚠ skipped ${c.name} (no contact_email)`);
      continue;
    }
    console.log(`→ ${c.name} (${c.contact_email})`);
    try {
      await seedClub(c.name, c.contact_email);
    } catch (e: any) {
      console.error(`  ✗ failed: ${e.message}`);
    }
  }

  console.log('\nDone. Each club can now log in via Staff → Club with password Club@2026.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
