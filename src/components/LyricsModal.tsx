import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Copy, Share, ExternalLink, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LyricsResponse {
  found: boolean;
  lyrics: string;
  message: string;
  source: string;
  cached: boolean;
  durationMs: number;
  errors: Array<{ source: string; status?: number; message: string }>;
}

interface LyricsModalProps {
  artist: string;
  title: string;
  trigger: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LyricsModal({ artist, title, trigger, className, open: controlledOpen, onOpenChange }: LyricsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [lyrics, setLyrics] = useState<LyricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchLyrics = async () => {
    setLoading(true);
    setError(null);

    try {
      // In development, call API directly since serverless functions don't run locally
      const isDevelopment = import.meta.env.DEV;
      const apiUrl = isDevelopment
        ? `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
        : `/api/lyrics?${new URLSearchParams({ artist, title })}`;

      const response = await fetch(apiUrl);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        throw new Error('Invalid response format');
      }

      let apiData;
      try {
        apiData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format');
      }

      // Normalize response format
      const data: LyricsResponse = isDevelopment
        ? {
            found: response.ok && !!apiData.lyrics,
            lyrics: apiData.lyrics || '',
            message: response.ok && apiData.lyrics ? 'Lyrics found' : `LYRICS NOT FOUND 🔜\nYou can still search "${title}" by ${artist} for this song's lyrics online.`,
            source: 'lyrics.ovh',
            cached: false,
            durationMs: 0,
            errors: []
          }
        : apiData;

      setLyrics(data);
    } catch (err: any) {
      console.error('Lyrics fetch error:', err);
      setError(err.message || 'Failed to fetch lyrics');
      toast.error('Failed to load lyrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !lyrics && !error) {
      fetchLyrics();
    }
  }, [open]);

  const handleCopy = async () => {
    if (!lyrics?.lyrics) return;

    try {
      await navigator.clipboard.writeText(lyrics.lyrics);
      toast.success('Lyrics copied to clipboard');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = lyrics.lyrics;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Lyrics copied to clipboard');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${title} - ${artist} Lyrics`,
      text: `Check out the lyrics for "${title}" by ${artist}`,
      url: `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error, fallback to copy URL
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleCopyUrl = async () => {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lyrics URL copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const handleRetry = () => {
    setLyrics(null);
    setError(null);
    fetchLyrics();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading lyrics...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Lyrics</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    if (!lyrics) return null;

    if (!lyrics.found) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-sm text-muted-foreground mb-4 whitespace-pre-line">
            {lyrics.message}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => window.open(`https://www.google.com/search?q=lyrics+${encodeURIComponent(title)}+${encodeURIComponent(artist)}`, '_blank')}
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Search Online
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {lyrics.source}
            </Badge>
            {lyrics.cached && (
              <Badge variant="outline" className="text-xs">
                Cached
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCopy} size="sm" variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button onClick={handleShare} size="sm" variant="outline">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={() => window.open(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, '_blank')}
              size="sm"
              variant="outline"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea ref={scrollAreaRef} className="h-96 w-full rounded-md border p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
            {lyrics.lyrics}
          </pre>
        </ScrollArea>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={className}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lyrics: {title}
            <span className="text-muted-foreground font-normal">by {artist}</span>
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}