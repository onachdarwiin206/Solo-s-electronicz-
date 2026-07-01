import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "solo_secret_key_change_me_in_prod";

export interface AuthenticatedRequest extends Request {
  adminUser?: {
    email: string;
    role: string;
  };
}

export function verifyAdminToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[Security Audit] Blocked unauthorized access attempt to ${req.originalUrl}`);
    return res.status(401).json({ error: "Unauthorized access: Bearer token is missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string };
    
    // Check if roles align
    if (decoded.role !== "admin") {
      console.warn(`[Security Audit] Access denied: User ${decoded.email} does not possess admin role.`);
      return res.status(403).json({ error: "Access Denied: Administrative privileges required." });
    }

    req.adminUser = decoded;
    next();
  } catch (err: any) {
    console.error(`[Security Audit] JWT validation failure on path ${req.originalUrl}:`, err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid authentication token." });
  }
}
