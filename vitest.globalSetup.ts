/**
 * Vitest Global Setup — OPROX OS
 *
 * Runs once in the main process before any test workers spawn.
 * Environment variables set here are inherited by all test workers.
 *
 * Responsibilities:
 *   1. Set JWT_SECRET so auth.ts does not throw at function-call time during tests.
 *   2. Run Drizzle migrations (via JS API) so all tables exist before tests execute
 *      DB operations. Uses its own short-lived pg.Pool to avoid coupling to the
 *      application's connection pool.
 */

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function setup(): Promise<void> {
  // 1. JWT_SECRET — must be present before any auth function is first called.
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET =
      'vitest-only-jwt-secret-oprox-os-testing-environment-not-for-production-use';
    console.log('[vitest:setup] JWT_SECRET set for test environment.');
  }

  // 2. Database migrations + test-isolation cleanup — run if DATABASE_URL is configured.
  //    Uses a dedicated pool so the application pool is not touched here.
  //    Drizzle migrate() is idempotent: safe to call even if all migrations are applied.
  if (process.env.DATABASE_URL) {
    console.log('[vitest:setup] Running database migrations...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const db = drizzle(pool);
    try {
      await migrate(db, { migrationsFolder: path.resolve(__dirname, 'drizzle') });
      console.log('[vitest:setup] Migrations complete.');
    } catch (err: any) {
      // Non-fatal: migrations may already be fully applied.
      // Any genuinely missing tables will surface as test failures.
      console.warn('[vitest:setup] Migration warning (may already be applied):', err?.message || err);
    }

    // 3. Cross-run test isolation: delete stale rows that persist between test suite runs in the
    //    shared database. These tables accumulate data across runs because tests use stable tenant
    //    IDs. Each cleanup is independent (wrapped in its own try/catch) so a missing table is
    //    non-fatal on the very first run.
    const testTenants = `('org_tenant_a', 'org_tenant_b', 'tenant_p4_test_org1', 'tenant_p4_test_org2')`;
    const cleanupQueries: [string, string][] = [
      // phase5: must run before re-phase4 (no cross-dep)
      ['phase5_memberships', `DELETE FROM phase5_memberships WHERE tenant_id IN ${testTenants}`],
      // re-phase4 marketplace — order matters for FK constraints
      // Actual table names from realestate.ts schema (re_saved_searches, re_favorites, re_inquiries)
      ['re_saved_searches', `DELETE FROM re_saved_searches WHERE tenant_id IN ${testTenants}`],
      ['re_favorites', `DELETE FROM re_favorites WHERE tenant_id IN ${testTenants}`],
      ['re_inquiries', `DELETE FROM re_inquiries WHERE tenant_id IN ${testTenants}`],
      ['re_public_listings', `DELETE FROM re_public_listings WHERE tenant_id IN ${testTenants}`],
      ['re_project_listing_units', `DELETE FROM re_project_listing_units WHERE tenant_id IN ${testTenants}`],
      ['re_projects', `DELETE FROM re_projects WHERE tenant_id IN ${testTenants}`],
      ['re_developers', `DELETE FROM re_developers WHERE tenant_id IN ${testTenants}`],
    ];

    const client = await pool.connect();
    try {
      for (const [label, sql] of cleanupQueries) {
        try {
          await client.query(sql);
        } catch (err: any) {
          // Table may not exist on the very first run — non-fatal.
          console.warn(`[vitest:setup] Cleanup skipped for ${label}:`, err?.message?.split('\n')[0]);
        }
      }
      console.log('[vitest:setup] Test-isolation cleanup complete.');
    } finally {
      client.release();
    }

    await pool.end().catch(() => {/* ignore cleanup error */});
  } else {
    console.log('[vitest:setup] DATABASE_URL not set — skipping migrations (in-memory mode).');
  }
}
