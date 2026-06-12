import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { handleMomoPayment } from "./src/lib/payments-backend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // Backend API route for secure mobile money processing (keeps keys hidden on the server)
  app.post("/api/payments/charge-momo", async (req, res) => {
    const { amount, phone, customerName, orderId, network } = req.body;

    if (!amount || !phone || !customerName || !orderId || !network) {
      return res.status(400).json({
        success: false,
        message: "Missing checkout payload parameters in secure request."
      });
    }

    try {
      const result = await handleMomoPayment({
        amount: Number(amount),
        phone,
        customerName,
        orderId,
        network
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error handshaking with telecom node.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
