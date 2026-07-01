import { Router } from "express";
import jwt from "jsonwebtoken";
import { pinRateLimiter } from "../middleware/rateLimiter";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "solo_secret_key_change_me_in_prod";

// ADMIN_EMAILS and ADMIN_PIN are parsed from .env
const getAdminEmails = (): string[] => {
  const envEmails = process.env.ADMIN_EMAILS;
  if (!envEmails) {
    // Default fallback from client side configuration
    return ["onachdarwiin@gmail.com", "emmanuelsolo@gmail.com", "soloelectronics@gmail.com"];
  }
  return envEmails.split(",").map(e => e.trim().toLowerCase());
};

const getAdminPin = (): string => {
  return process.env.ADMIN_PIN || "8585";
};

router.post("/login-pin", pinRateLimiter, (req, res) => {
  const { pin, email } = req.body;
  
  if (!pin) {
    console.warn(`[Security Audit] Login attempt rejected: PIN code not provided.`);
    return res.status(400).json({ success: false, error: "PIN code is required." });
  }

  const normalizedEmail = email?.trim().toLowerCase();
  const adminEmails = getAdminEmails();
  const adminPin = getAdminPin();

  // Validate the operator's email address is in the admin whitelist
  if (normalizedEmail && !adminEmails.includes(normalizedEmail)) {
    console.warn(`[Security Audit] PIN login rejected for whitelisting. Operator email: ${normalizedEmail}`);
    return res.status(403).json({ success: false, error: "Email is not authorized for administrative operations." });
  }

  // Validate the pin securely
  if (pin === adminPin) {
    const operatorEmail = normalizedEmail || adminEmails[0];
    
    // Generate JWT token with 15-minute expiration
    const token = jwt.sign(
      { email: operatorEmail, role: "admin" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    console.log(`[Security Audit] Administrative login successful. Operator: ${operatorEmail}`);
    
    return res.json({
      success: true,
      token,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: "legacy-admin",
        name: "Authorized Admin",
        email: operatorEmail,
        role: "admin"
      }
    });
  }

  console.warn(`[Security Audit WARNING] Failed PIN login attempt. Operator: ${normalizedEmail || "anonymous"}`);
  return res.status(401).json({ success: false, error: "Incorrect administrative PIN code." });
});

export default router;
