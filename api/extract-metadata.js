import express from "express";
import cors from "cors";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import fs from "fs";
import path from "path";
import mm from "music-metadata";

const app = express();

// CORS for production (allow your frontend domain)
app.use(cors({ origin: process.env.FRONTEND_URL || "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));

// Basic health route
app.get("/health", (_req, res) => res.json({ ok: true }));

// Ensure uploads dir exists (in serverless, use /tmp)
const uploadsDir = process.env.VERCEL ? "/tmp" : path.resolve(process.cwd(), "uploads");
if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const upload = multer({ dest: uploadsDir });

// Tell FFmpeg where to find ffprobe
ffmpeg.setFfprobePath(ffprobeStatic.path);

// Metadata extraction route
app.post("/api/extract-metadata", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;
  try {
    const probe = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => (err ? reject(err) : resolve(metadata)));
    });

    // Parse tags and cover art using music-metadata (Node)
    const meta = await mm.parseFile(filePath, { duration: true });
    const c = meta.common ?? {};
    const f = (probe && probe.format) ? probe.format : (meta.format ?? {});
    const stream0 = (probe && probe.streams && probe.streams[0]) ? probe.streams[0] : {};

    let coverArt;
    if (Array.isArray(c.picture) && c.picture.length > 0) {
      const pic = c.picture[0];
      const mime = pic.format || "image/jpeg";
      const b64 = Buffer.from(pic.data).toString("base64");
      coverArt = `data:${mime};base64,${b64}`;
    }

    const extracted = {
      title: c.title || f.tags?.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
      artist: c.artist || f.tags?.artist || "Unknown Artist",
      album: c.album || f.tags?.album || "Unknown Album",
      genre: (Array.isArray(c.genre) ? c.genre[0] : c.genre) || f.tags?.genre,
      year: c.year || f.tags?.date,
      bitrate: f.bit_rate ? parseInt(f.bit_rate) : (meta.format?.bitrate ? Math.round(meta.format.bitrate) : undefined),
      duration: f.duration ? Number(Number(f.duration).toFixed(2)) : (meta.format?.duration ? Number(meta.format.duration.toFixed(2)) : undefined),
      codec: stream0.codec_name || meta.format?.codec || "Unknown",
      sampleRate: stream0.sample_rate ? Number(stream0.sample_rate) : meta.format?.sampleRate,
      channels: stream0.channels || meta.format?.numberOfChannels,
      formatName: f.format_long_name || meta.format?.container,
      size: f.size ? Number(f.size) : req.file.size,
      coverArt,
    };

    res.json({ success: true, metadata: extracted });
  } catch (err) {
    console.error("Metadata extraction failed:", err);
    res.status(500).json({ success: false, error: "Failed to extract metadata" });
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
});

// Export for Vercel serverless
export default app;
