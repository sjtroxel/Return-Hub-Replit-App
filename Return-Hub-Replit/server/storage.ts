import { db } from "./db";
import { users, returns, type User, type Return } from "@shared/schema";
import { eq, and, desc, lt } from "drizzle-orm";

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, passwordHash: string, isGuest?: boolean): Promise<User>;
  deleteGuestUsers(cutoffDate: Date): Promise<number>;
  getReturnsByUserId(userId: string): Promise<Return[]>;
  getReturnById(id: string, userId: string): Promise<Return | undefined>;
  createReturn(data: {
    userId: string;
    storeName: string;
    itemName?: string;
    purchasePrice: string;
    purchaseDate: string;
    status?: string;
  }): Promise<Return>;
  updateReturn(
    id: string,
    userId: string,
    data: Partial<{
      storeName: string;
      itemName: string;
      purchasePrice: string;
      purchaseDate: string;
      status: string;
    }>
  ): Promise<Return | undefined>;
  deleteReturn(id: string, userId: string): Promise<Return | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(email: string, passwordHash: string, isGuest: boolean = false): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, isGuest })
      .returning();
    return user;
  }

  async deleteGuestUsers(cutoffDate: Date): Promise<number> {
    const deleted = await db
      .delete(users)
      .where(and(eq(users.isGuest, true), lt(users.createdAt, cutoffDate)))
      .returning();
    return deleted.length;
  }

  async getReturnsByUserId(userId: string): Promise<Return[]> {
    return db
      .select()
      .from(returns)
      .where(eq(returns.userId, userId))
      .orderBy(desc(returns.createdAt));
  }

  async getReturnById(id: string, userId: string): Promise<Return | undefined> {
    const [ret] = await db
      .select()
      .from(returns)
      .where(and(eq(returns.id, id), eq(returns.userId, userId)))
      .limit(1);
    return ret;
  }

  async createReturn(data: {
    userId: string;
    storeName: string;
    itemName?: string;
    purchasePrice: string;
    purchaseDate: string;
    status?: string;
  }): Promise<Return> {
    const purchaseDate = new Date(data.purchaseDate);
    const deadline = new Date(purchaseDate);
    deadline.setDate(deadline.getDate() + 30);

    const [ret] = await db
      .insert(returns)
      .values({
        userId: data.userId,
        storeName: data.storeName,
        itemName: data.itemName || null,
        purchasePrice: data.purchasePrice,
        purchaseDate: data.purchaseDate,
        returnDeadline: deadline.toISOString().split("T")[0],
        status: data.status || "pending",
      })
      .returning();
    return ret;
  }

  async updateReturn(
    id: string,
    userId: string,
    data: Partial<{
      storeName: string;
      itemName: string;
      purchasePrice: string;
      purchaseDate: string;
      status: string;
    }>
  ): Promise<Return | undefined> {
    const updateData: Record<string, any> = {};
    if (data.storeName !== undefined) updateData.storeName = data.storeName;
    if (data.itemName !== undefined) updateData.itemName = data.itemName;
    if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.purchaseDate !== undefined) {
      updateData.purchaseDate = data.purchaseDate;
      const purchaseDate = new Date(data.purchaseDate);
      const deadline = new Date(purchaseDate);
      deadline.setDate(deadline.getDate() + 30);
      updateData.returnDeadline = deadline.toISOString().split("T")[0];
    }

    const [ret] = await db
      .update(returns)
      .set(updateData)
      .where(and(eq(returns.id, id), eq(returns.userId, userId)))
      .returning();
    return ret;
  }

  async deleteReturn(id: string, userId: string): Promise<Return | undefined> {
    const [ret] = await db
      .delete(returns)
      .where(and(eq(returns.id, id), eq(returns.userId, userId)))
      .returning();
    return ret;
  }
}

export const storage = new DatabaseStorage();
