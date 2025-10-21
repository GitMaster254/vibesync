/// <reference lib="webworker" />
export {};

import * as mm from 'music-metadata-browser';

// Define types inline since music-metadata-browser doesn't export them
interface IPicture {
  format: string;
  data: Uint8Array | Buffer;
  description?: string;
  type?: string;
}

interface IFileInfo {
  mimeType: string;
  size: number;
  path?: string;
}

type MetadataMsg = {
  type: 'metadata';
  index: number;
  total: number;
  fileName: string;
  data: {
    title: string;
    artist: string;
    album?: string;
    duration: number;
    coverArt?: string; // data URL
  };
  // We still send file back to persist/playback
  file: File;
};

type ErrorMsg = { type: 'error'; fileName: string; error: string };
type DoneMsg = { type: 'done'; total: number };

function toDataUrl(picture?: IPicture | null): string | undefined {
  if (!picture || !picture.data) return undefined;
  try {
    const bytes = picture.data instanceof Uint8Array ? picture.data : new Uint8Array(picture.data);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      const slice = bytes.subarray(i, i + chunk);
      binary += String.fromCharCode.apply(null, Array.from(slice) as unknown as number[]);
    }
    const b64 = btoa(binary);
    const mime = picture.format || 'image/jpeg';
    return `data:${mime};base64,${b64}`;
  } catch {
    return undefined;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { files } = e.data as { files: File[] };
  const total = files.length;
  for (let i = 0; i < total; i++) {
    const file = files[i];
    try {
      if (!file || typeof file.type !== 'string' || !file.type.startsWith('audio/')) {
        const msg: ErrorMsg = { type: 'error', fileName: file?.name || 'unknown', error: 'Unsupported file format' };
        self.postMessage(msg);
        continue;
      }

  // Parse metadata in worker using music-metadata (browser-compatible via parseBuffer)
  const buf = new Uint8Array(await file.arrayBuffer());
  const fileInfo: IFileInfo = { mimeType: file.type, size: file.size, path: file.name } as IFileInfo;
  const meta = await mm.parseBuffer(buf, fileInfo);
      const title = meta.common.title || file.name.replace(/\.[^/.]+$/, '');
      const artist = meta.common.artist || 'Unknown Artist';
      const album = meta.common.album || undefined;
      const duration = typeof meta.format.duration === 'number' && isFinite(meta.format.duration)
        ? meta.format.duration
        : 0;
      const coverArt = toDataUrl(meta.common.picture && meta.common.picture.length > 0 ? meta.common.picture[0] : null);

      const payload: MetadataMsg = {
        type: 'metadata',
        index: i + 1,
        total,
        fileName: file.name,
        data: { title, artist, album, duration, coverArt },
        file,
      };
      self.postMessage(payload);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const msg: ErrorMsg = { type: 'error', fileName: file?.name || 'unknown', error };
      self.postMessage(msg);
    }
  }
  const done: DoneMsg = { type: 'done', total };
  self.postMessage(done);
};
