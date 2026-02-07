import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, date, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  themePreference: text("theme_preference").default("system"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const returns = pgTable("returns", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  storeName: text("store_name").notNull(),
  itemName: text("item_name"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: date("purchase_date").notNull(),
  returnDeadline: date("return_deadline"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_returns_user_id").on(table.userId),
  index("idx_returns_deadline").on(table.returnDeadline),
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
  returnDeadline: true,
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createReturnSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  itemName: z.string().optional(),
  purchasePrice: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Price must be a positive number"),
  purchaseDate: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d <= new Date();
  }, "Date cannot be in the future"),
  status: z.enum(["pending", "shipped", "refunded", "expired"]).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type Return = typeof returns.$inferSelect;
