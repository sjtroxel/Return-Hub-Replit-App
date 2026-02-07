import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET or JWT_SECRET environment variable must be set");
}
const COOKIE_NAME = "returnhub_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    clearAuthCookie(res);
    return res.status(401).json({ message: "Session expired" });
  }

  const decoded = jwt.decode(token) as any;
  if (decoded?.exp) {
    const timeLeft = decoded.exp * 1000 - Date.now();
    if (timeLeft < 24 * 60 * 60 * 1000) {
      const newToken = generateToken({ userId: payload.userId, email: payload.email });
      setAuthCookie(res, newToken);
    }
  }

  req.user = payload;
  next();
}
