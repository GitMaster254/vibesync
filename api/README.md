# VibeSync API - Vercel Serverless Functions

This folder contains Vercel serverless functions for metadata extraction.

## Endpoints

### `GET /api/health`
Health check endpoint to verify the API is running.

**Response:**
```json
{
  "ok": true
}
```

### `POST /api/extract-metadata`
Extract metadata from audio files using FFmpeg and music-metadata.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: File upload with field name `audio`

**Response:**
```json
{
  "success": true,
  "metadata": {
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "genre": "Genre",
    "year": "2024",
    "bitrate": 320000,
    "duration": 245.5,
    "codec": "mp3",
    "sampleRate": 44100,
    "channels": 2,
    "formatName": "MP3 (MPEG audio layer 3)",
    "size": 8388608,
    "coverArt": "data:image/jpeg;base64,..."
  }
}
```

## Local Development

For local development, you can run the Express server in the `backend/` folder:

```bash
cd backend
npm install
node server.js
```

Or use Vercel CLI to test serverless functions:

```bash
npm install -g vercel
vercel dev
```

## Deployment

When deployed to Vercel, these functions are automatically available at:
- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app/api/extract-metadata`

The frontend automatically detects whether it's running locally or deployed and uses the appropriate endpoint.

## Dependencies

- `fluent-ffmpeg` - FFmpeg wrapper for Node.js
- `ffprobe-static` - Static FFprobe binary
- `music-metadata` - Metadata parser for audio files
- `formidable` - Form data parsing for file uploads
