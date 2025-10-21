/**
 * Vercel Serverless Function for audio metadata extraction
 * Works natively with Vercel API routes
 */

import { IncomingForm } from "formidable";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import fs from "fs";
import mm from "music-metadata";

ffmpeg.setFfprobePath(ffprobeStatic.path);

// Disable Next.js/Vercel default body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Main handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse file upload
    const form = new IncomingForm({
      uploadDir: "/tmp",
      keepExtensions: true,
      multiples: false,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const file = files.audio || files.file || Object.values(files)[0];
    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const filePath = Array.isArray(file) ? file[0].filepath : file.filepath;

    // Extract metadata using ffprobe
    const probe = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) =>
        err ? reject(err) : resolve(metadata)
      );
    });

    // Extract tags using music-metadata
    const meta = await mm.parseFile(filePath, { duration: true });
    const c = meta.common ?? {};
    const f = probe?.format ?? meta.format ?? {};
    const stream0 = probe?.streams?.[0] ?? {};

    // Handle embedded cover art
    let coverArt;
    if (Array.isArray(c.picture) && c.picture.length > 0) {
      const pic = c.picture[0];
      const mime = pic.format || "image/jpeg";
      const b64 = Buffer.from(pic.data).toString("base64");
      coverArt = `data:${mime};base64,${b64}`;
    }

    const extracted = {
      title: c.title || f.tags?.title || file.originalFilename?.replace(/\.[^/.]+$/, "") || "Untitled",
      artist: c.artist || "Unknown Artist",
      album: c.album || "Unknown Album",
      genre: Array.isArray(c.genre) ? c.genre[0] : c.genre || "Unknown",
      year: c.year || f.tags?.date || null,
      bitrate: f.bit_rate ? parseInt(f.bit_rate) : meta.format?.bitrate ? Math.round(meta.format.bitrate) : null,
      duration: f.duration ? Number(f.duration.toFixed(2)) : meta.format?.duration ? Number(meta.format.duration.toFixed(2)) : null,
      codec: stream0.codec_name || meta.format?.codec || "Unknown",
      sampleRate: stream0.sample_rate ? Number(stream0.sample_rate) : meta.format?.sampleRate,
      channels: stream0.channels || meta.format?.numberOfChannels,
      formatName: f.format_long_name || meta.format?.container,
      size: f.size ? Number(f.size) : file.size,
      coverArt,
    };

    // Cleanup temp file
    try { fs.unlinkSync(filePath); } catch {}

    res.status(200).json({ success: true, metadata: extracted });
  } catch (err) {
    console.error("Metadata extraction failed:", err);
    res.status(500).json({ success: false, error: "Failed to extract metadata" });
  }
}
