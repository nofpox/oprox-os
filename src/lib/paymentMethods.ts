import { db, memoryDb } from "../db";
import { paymentMethodsConfigTable, PaymentMethodConfigRow } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getPaymentMethodsConfig(): Promise<PaymentMethodConfigRow[]> {
  if (db) {
    try {
      return await db.select().from(paymentMethodsConfigTable);
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.paymentMethodsConfig.values());
}

export async function getPaymentMethodById(id: string): Promise<PaymentMethodConfigRow | null> {
  if (db) {
    try {
      const rows = await db.select().from(paymentMethodsConfigTable).where(eq(paymentMethodsConfigTable.id, id)).limit(1);
      if (rows.length > 0) return rows[0];
    } catch {
      // Fallback
    }
  }
  return memoryDb.paymentMethodsConfig.get(id) || null;
}

export async function updatePaymentMethodConfig(id: string, updates: Partial<PaymentMethodConfigRow>): Promise<PaymentMethodConfigRow> {
  const existing = await getPaymentMethodById(id);
  const now = new Date();

  const record: PaymentMethodConfigRow = {
    id,
    name: updates.name || (existing ? existing.name : id),
    provider: updates.provider || (existing ? existing.provider : "stripe"),
    enabled: updates.enabled !== undefined ? updates.enabled : (existing ? existing.enabled : false),
    currency: updates.currency || (existing ? existing.currency : "SAR"),
    paymentMethodType: updates.paymentMethodType || (existing ? existing.paymentMethodType : id),
    status: updates.status || (existing ? existing.status : "active"),
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(paymentMethodsConfigTable).values(record).onConflictDoUpdate({
        target: paymentMethodsConfigTable.id,
        set: record,
      });
    } catch {
      // Fallback
    }
  }

  memoryDb.paymentMethodsConfig.set(id, record);
  return record;
}

export async function validatePaymentMethodAllowed(methodId: string): Promise<{ allowed: boolean; reason?: string; config?: PaymentMethodConfigRow }> {
  // Normalize method ID
  const normalizedId = methodId.toLowerCase().trim();
  
  if (normalizedId === "credit_card" || normalizedId === "card" || normalizedId === "visa" || normalizedId === "mastercard") {
    // Explicit policy restriction on standard credit cards
    const method = await getPaymentMethodById("credit_card");
    if (!method || !method.enabled) {
      return {
        allowed: false,
        reason: "Credit card payment methods are disabled by OPROX commercial policy. Please use approved Saudi payment methods (mada, STC Pay, barq Pay, Bank Transfer).",
      };
    }
  }

  const method = await getPaymentMethodById(normalizedId);
  if (!method) {
    return {
      allowed: false,
      reason: `Payment method '${methodId}' is not configured in the payment provider abstraction.`,
    };
  }

  if (!method.enabled || method.status !== "active") {
    return {
      allowed: false,
      reason: `Payment method '${method.name}' is currently disabled or restricted by policy.`,
      config: method,
    };
  }

  return { allowed: true, config: method };
}
