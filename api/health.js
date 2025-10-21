/**
 * Vercel Serverless Function for health check
 * Deployed at: /api/health
 */

export default function handler(req, res) {
  // Handle preflight (kept for local dev/testing)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({ ok: true });
}
