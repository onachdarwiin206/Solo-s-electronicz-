import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import compression from "compression";

// Lazy-initialized Gemini Client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Using server-side fallback generator.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const FALLBACK_CAPTIONS: Record<string, (name: string, desc: string) => string> = {
  professional: (name, desc) => `🚀 Professional Upgrade: The new ${name} is engineered to optimize your daily productivity and operations. ${desc} Now in stock at Emma's Phones & Electronics. Secure yours with direct showroom procurement, local warranty, and dedicated support. Inquire today. #EmmaTech #ProfessionalHardware #${name.replace(/[^a-zA-Z0-9]/g, '')}`,
  hype: (name, desc) => `🔥 NEXT-LEVEL REVELATION! 🔥 The spectacular ${name} has landed at Emma's! 🚀 Packed with cutting-edge specs and built to outperform: ${desc} ⚡️ Units are flying off the shelves fast. Tap below to chat with a representative instantly! #TechLaunch #InsaneHardware #EmmasPhones`,
  premium: (name, desc) => `A statement of modern luxury and digital craft. The ${name} redefines high-fidelity experiences: "${desc}" Tour the showroom today to discover our handpicked showcase. #PremiumElectronics #ElegantDesign #EmmasShowroom`,
  uganda: (name, desc) => `🤝 Boss, are you ready? The original ${name} is officially here in Kampala! 🇺🇬 Avoid shipping headaches and tax surprises—buy with full confidence, Uganda-wide delivery, genuine local warranty, and a warm handshake. ⚡️ ${desc} Slide into our inbox right away to lock yours! #KampalaTech #GenuineDeals #EmmaElectronics`,
  creative: (name, desc) => `✨ Transform the way you build, code, and capture. The ${name} is the definitive companion for the dreamers and builders. ${desc} Craft your story with confidence. Hand-delivered by Emma's. #CreativeJourney #WorkspaceAesthetics #Innovate`
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // Enable fast compression for faster network transfer
  app.use(compression());

  // API endpoint for generating social media captions
  app.post("/api/marketing/generate-caption", async (req, res) => {
    const { productName, productDescription, tone, platform } = req.body;

    if (!productName) {
      return res.status(400).json({ error: "Product name is required" });
    }

    const resolvedTone = (tone || 'professional').toLowerCase();
    const resolvedPlatform = platform || 'all';

    try {
      const gClient = getGeminiClient();

      if (!gClient) {
        // Fallback response if API Key is not set
        const fbFunc = FALLBACK_CAPTIONS[resolvedTone] || FALLBACK_CAPTIONS.professional;
        const fallbackText = fbFunc(productName, productDescription || '');
        return res.json({ caption: fallbackText, generatedBy: "fallback" });
      }

      // Build precise promotional context-rich prompt
      const prompt = `Write a highly engaging, professional social media marketing caption for a premium tech product.
Product Name: ${productName}
Product Description: ${productDescription || "High-end product"}
Target Platform: ${resolvedPlatform} (make layout, hashtags, and style native to this platform)
Vibe/Tone: ${resolvedTone} (choices: professional, hype, premium/sleek, uganda/contextual, creative)

Guidelines:
- If tone is 'professional', write a polished, smart B2B/productivity-focused post with selective hashtags.
- If tone is 'hype', write an ultra-high energy post with bold emojis, exclamations, and intense excitement.
- If tone is 'premium', write elegant, luxurious copy with minimal spacing, high-end adjectives, and sleek framing.
- If tone is 'uganda', incorporate standard local business confidence: mention Emma's Phones & Electronics Kampala, "direct showrooms", "safe handshakes on purchase", "Uganda warranty", and pricing/delivery peace of mind.
- If tone is 'creative', write a warm storytelling hook linking the device to daily routine success.

Keep response formatting clean, fully styled with emojis, line spacing, and contextual hashtags. Return ONLY the generated post caption without any introductory text like 'Here is your caption:' or surrounding quotes.`;

      const response = await gClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const captionText = response.text?.trim() || "";

      if (!captionText) {
        throw new Error("Empty caption returned from Gemini");
      }

      return res.json({ caption: captionText, generatedBy: "gemini" });
    } catch (err: any) {
      console.error("Gemini Caption generation error, falling back:", err);
      const fbFunc = FALLBACK_CAPTIONS[resolvedTone] || FALLBACK_CAPTIONS.professional;
      const fallbackText = fbFunc(productName, productDescription || '');
      return res.json({ caption: fallbackText, generatedBy: "fallback-after-error", errorMsg: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Explicitly serve sw.js with absolute no-cache headers so browser always checks for the latest version
    app.get("/sw.js", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Content-Type", "application/javascript");
      res.sendFile(path.join(distPath, "sw.js"));
    });

    app.use(express.static(distPath));
    
    // Serve entry point HTML with cache validation requested
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
