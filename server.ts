import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase (Server-side)
// We use the same config as the frontend
const configPath = path.join(__dirname, "firebase-applet-config.json");
let firebaseConfig;
try {
  const configData = await fs.readFile(configPath, "utf-8");
  firebaseConfig = JSON.parse(configData);
} catch (e) {
  console.error("Failed to load Firebase config on server:", e);
}

const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : null;
const storage = firebaseApp ? getStorage(firebaseApp, firebaseConfig.firestoreDatabaseId) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // Set up Multer for multipart/form-data (Memory storage)
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });

  // API Route for upload (demonstrating multipart/form-data support)
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!storage) {
        return res.status(500).json({ error: "Firebase storage not initialized" });
      }

      const fileName = `${Date.now()}-${req.file.originalname}`;
      const storageRef = ref(storage, `products/${fileName}`);
      
      // Upload to Firebase Storage from server using the buffer from multipart-form-data
      await uploadBytes(storageRef, req.file.buffer, {
        contentType: req.file.mimetype
      });
      
      const downloadURL = await getDownloadURL(storageRef);
      
      res.json({ 
        url: downloadURL, 
        name: fileName,
        type: req.file.mimetype 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal server error during upload" });
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
