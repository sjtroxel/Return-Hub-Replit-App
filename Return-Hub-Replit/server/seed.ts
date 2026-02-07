import { storage } from "./storage";
import { hashPassword } from "./auth";
import { log } from "./index";

export async function seedTestData() {
  try {
    const existingUser = await storage.getUserByEmail("test@example.com");
    if (existingUser) {
      log("Test user already exists, skipping seed");
      return;
    }

    const passwordHash = await hashPassword("password123");
    const user = await storage.createUser("test@example.com", passwordHash);
    log("Created test user: test@example.com");

    const today = new Date();

    const date1 = new Date(today);
    date1.setDate(date1.getDate() - 25);

    const date2 = new Date(today);
    date2.setDate(date2.getDate() - 5);

    const date3 = new Date(today);
    date3.setDate(date3.getDate() - 28);

    await storage.createReturn({
      userId: user.id,
      storeName: "Amazon",
      itemName: "Wireless Headphones",
      purchasePrice: "89.99",
      purchaseDate: date1.toISOString().split("T")[0],
      status: "pending",
    });

    await storage.createReturn({
      userId: user.id,
      storeName: "Target",
      itemName: "Winter Jacket",
      purchasePrice: "124.50",
      purchaseDate: date2.toISOString().split("T")[0],
      status: "pending",
    });

    await storage.createReturn({
      userId: user.id,
      storeName: "Best Buy",
      itemName: "USB-C Cable",
      purchasePrice: "19.99",
      purchaseDate: date3.toISOString().split("T")[0],
      status: "pending",
    });

    log("Seeded 3 sample returns for test user");
  } catch (error) {
    console.error("Failed to seed test data:", error);
  }
}
