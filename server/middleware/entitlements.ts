/**
 * Feature Entitlement Middleware
 * Gates route access based on the user's active subscription plan.
 * Cache is keyed by userId:orgId with a 5-minute TTL.
 */

import { Response, NextFunction } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { AuthRequest } from '../auth';
import { db, memoryDb } from '../../src/db';
import { subscriptionsTable, plansCatalogTable } from '../../src/db/schema';

// ---------------------------------------------------------------------------
// In-memory entitlement cache: "userId:orgId" -> { features, expiresAt }
// ---------------------------------------------------------------------------
const cache = new Map<string, { features: string[]; expiresAt: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

async function getUserFeatures(userId: string, orgId: string): Promise<string[]> {
  const cacheKey = `${userId}:${orgId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.features;
  }

  try {
    let features: string[] = ['basic_access']; // starter-tier default

    if (db) {
      try {
        // JOIN subscriptions -> plans_catalog, pick the most recent active subscription
        const rows = await db
          .select({ featureEntitlements: plansCatalogTable.featureEntitlements })
          .from(subscriptionsTable)
          .innerJoin(plansCatalogTable, eq(subscriptionsTable.planId, plansCatalogTable.id))
          .where(
            and(
              eq(subscriptionsTable.userId, userId),
              eq(subscriptionsTable.status, 'active')
            )
          )
          .orderBy(desc(subscriptionsTable.createdAt))
          .limit(1);

        if (rows.length > 0) {
          const entitlements = rows[0].featureEntitlements;
          if (Array.isArray(entitlements) && entitlements.length > 0) {
            features = entitlements as string[];
          }
        }
      } catch (dbErr) {
        // DB query failed — fall through to memoryDb fallback in dev/test only
        if (process.env.NODE_ENV === 'production') {
          throw dbErr; // Task #4: fail loudly in production; never serve stale memory entitlements
        }
        features = getMemoryDbFeatures(userId, orgId);
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[OPROX OS] FATAL: Database connection required in production for entitlement checks.');
      }
      features = getMemoryDbFeatures(userId, orgId);
    }

    cache.set(cacheKey, { features, expiresAt: Date.now() + TTL });
    return features;
  } catch {
    // Fail secure: deny everything except explicit bypass
    return [];
  }
}

/**
 * Fallback: look up entitlements from the in-memory store.
 */
function getMemoryDbFeatures(userId: string, orgId: string): string[] {
  // Find the most recent active subscription for this user
  const userSubs = Array.from(memoryDb.subscriptions.values())
    .filter((s) => s.userId === userId && s.status === 'active')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (userSubs.length > 0) {
    const plan = memoryDb.plansCatalog.get(userSubs[0].planId);
    if (plan && Array.isArray(plan.featureEntitlements) && plan.featureEntitlements.length > 0) {
      return plan.featureEntitlements as string[];
    }
  }

  // Also check org-level subscription
  if (orgId) {
    const orgSubs = Array.from(memoryDb.subscriptions.values())
      .filter((s) => s.orgId === orgId && s.status === 'active')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (orgSubs.length > 0) {
      const plan = memoryDb.plansCatalog.get(orgSubs[0].planId);
      if (plan && Array.isArray(plan.featureEntitlements) && plan.featureEntitlements.length > 0) {
        return plan.featureEntitlements as string[];
      }
    }
  }

  return ['basic_access'];
}

/**
 * requireEntitlement(feature)
 * Returns an Express middleware that enforces subscription-based feature gating.
 *
 * Bypass rules:
 *  - superadmin: always allowed (full platform access).
 *  - admin: granted basic_access, pro_access, team_collaboration implicitly
 *    (admins must be able to manage users/orgs regardless of their personal plan).
 *  - any plan with 'all_access': always allowed.
 */
export function requireEntitlement(feature: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Superadmins bypass all entitlement checks
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Admins get implicit access to operational features they need for user management
    if (req.user.role === 'admin') {
      const adminImplicit = ['basic_access', 'pro_access', 'team_collaboration'];
      if (adminImplicit.includes(feature)) {
        return next();
      }
    }

    const features = await getUserFeatures(req.user.id, req.user.orgId);

    if (features.includes('all_access') || features.includes(feature)) {
      return next();
    }

    return res.status(403).json({
      error: 'Your current plan does not include this feature. Please upgrade to access it.',
      feature,
      upgradeRequired: true,
    });
  };
}

/**
 * Clears the entitlement cache for a given user/org pair.
 * Call this after any subscription upgrade, downgrade, or cancellation.
 */
export function clearEntitlementCache(userId: string, orgId: string): void {
  cache.delete(`${userId}:${orgId}`);
}
