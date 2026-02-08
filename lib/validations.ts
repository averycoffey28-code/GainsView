import { z } from "zod";

// Common field validations
const symbolSchema = z.string().min(1).max(10).regex(/^[A-Za-z]+$/, "Symbol must contain only letters");
const priceSchema = z.number().min(0).max(1000000);
const quantitySchema = z.number().int().min(1).max(100000);
const notesSchema = z.string().max(1000).optional().nullable();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").optional().nullable();

// Position validation
export const positionSchema = z.object({
  symbol: symbolSchema,
  contract_type: z.enum(["call", "put"]),
  position_type: z.enum(["long", "short"]),
  strike_price: priceSchema,
  premium: priceSchema,
  contracts: quantitySchema,
  entry_stock_price: priceSchema.optional().nullable(),
  expiration_date: dateSchema,
  notes: notesSchema,
});

// Trade validation
export const tradeSchema = z.object({
  symbol: symbolSchema,
  trade_type: z.enum(["buy", "sell"]),
  asset_type: z.enum(["stock", "call", "put"]),
  quantity: quantitySchema,
  price: priceSchema,
  total_value: priceSchema.optional(),
  pnl: z.number().min(-10000000).max(10000000).optional().nullable(),
  notes: notesSchema,
  trade_date: z.string().optional(),
});

// Watchlist validation
export const watchlistSchema = z.object({
  symbol: symbolSchema,
});

// Chat message validation
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(50000),
});

// User settings validation
export const userSettingsSchema = z.object({
  theme: z.enum(["dark", "light"]).optional(),
  notifications_enabled: z.boolean().optional(),
  push_reminder_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  timezone: z.string().max(50).optional().nullable(),
  risk_level: z.enum(["conservative", "moderate", "aggressive"]).optional().nullable(),
}).partial();

// Notification subscription validation
export const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().max(2000),
    keys: z.object({
      p256dh: z.string().min(1).max(500),
      auth: z.string().min(1).max(500),
    }),
  }),
  reminder_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// Helper function to safely validate and return errors
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: "Invalid input data" };
}
