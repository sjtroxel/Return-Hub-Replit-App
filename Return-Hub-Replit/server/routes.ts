import type { Express } from "express";
import { type Server } from "http";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import {
  hashPassword,
  comparePassword,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  authMiddleware,
} from "./auth";
import { seedTestData } from "./seed";

function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(cookieParser());

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: "Too many signup attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", apiLimiter);

  app.post("/api/auth/signup", signupLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Invalid input" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existing = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser(email.toLowerCase().trim(), passwordHash);

      const token = generateToken({ userId: user.id, email: user.email });
      setAuthCookie(res, token);

      return res.status(201).json({
        id: user.id,
        email: user.email,
        themePreference: user.themePreference,
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken({ userId: user.id, email: user.email });
      setAuthCookie(res, token);

      return res.json({
        id: user.id,
        email: user.email,
        themePreference: user.themePreference,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    clearAuthCookie(res);
    return res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.userId);
      if (!user) {
        clearAuthCookie(res);
        return res.status(401).json({ message: "User not found" });
      }
      return res.json({
        id: user.id,
        email: user.email,
        themePreference: user.themePreference,
      });
    } catch (error) {
      console.error("Auth me error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/returns", authMiddleware, async (req, res) => {
    try {
      const returns = await storage.getReturnsByUserId(req.user!.userId);
      return res.json(returns);
    } catch (error) {
      console.error("Get returns error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/returns", authMiddleware, async (req, res) => {
    try {
      const { storeName, itemName, purchasePrice, purchaseDate, status } = req.body;

      if (!storeName || !purchasePrice || !purchaseDate) {
        return res.status(400).json({ message: "Store name, price, and purchase date are required" });
      }

      const price = parseFloat(purchasePrice);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ message: "Price must be a positive number" });
      }

      const date = new Date(purchaseDate);
      if (isNaN(date.getTime()) || date > new Date()) {
        return res.status(400).json({ message: "Invalid or future purchase date" });
      }

      const validStatuses = ["pending", "shipped", "refunded", "expired"];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const ret = await storage.createReturn({
        userId: req.user!.userId,
        storeName: sanitizeString(storeName),
        itemName: itemName ? sanitizeString(itemName) : undefined,
        purchasePrice: price.toFixed(2),
        purchaseDate: purchaseDate,
        status: status || "pending",
      });

      return res.status(201).json(ret);
    } catch (error) {
      console.error("Create return error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/returns/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { storeName, itemName, purchasePrice, purchaseDate, status } = req.body;

      const updateData: any = {};
      if (storeName) updateData.storeName = sanitizeString(storeName);
      if (itemName !== undefined) updateData.itemName = sanitizeString(itemName);
      if (purchasePrice !== undefined) {
        const price = parseFloat(purchasePrice);
        if (isNaN(price) || price < 0) {
          return res.status(400).json({ message: "Price must be a positive number" });
        }
        updateData.purchasePrice = price.toFixed(2);
      }
      if (purchaseDate) {
        const date = new Date(purchaseDate);
        if (isNaN(date.getTime()) || date > new Date()) {
          return res.status(400).json({ message: "Invalid or future purchase date" });
        }
        updateData.purchaseDate = purchaseDate;
      }
      if (status) {
        const validStatuses = ["pending", "shipped", "refunded", "expired"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        updateData.status = status;
      }

      const ret = await storage.updateReturn(id, req.user!.userId, updateData);
      if (!ret) {
        return res.status(404).json({ message: "Return not found" });
      }

      return res.json(ret);
    } catch (error) {
      console.error("Update return error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  await seedTestData();

  return httpServer;
}
