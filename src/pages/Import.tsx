import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decodeSharePayload } from '@/lib/share';
import { Button } from '@/components/ui/button';

export default function Import() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    const d = params.get('d');
    if (!d) return null;
    return decodeSharePayload(d);
  }, [params]);

  useEffect(() => {
    if (!payload) setError('Invalid or missing data.');
  }, [payload]);

  return (
    <div className="min-h-screen pb-40 pt-8">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-bold">Import Playlist</h1>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-2">Playlist name</p>
            <p className="mb-4 font-semibold">{payload?.name || 'Untitled playlist'}</p>
            <p className="text-sm text-muted-foreground mb-2">Tracks to import</p>
            <p className="mb-4">{payload?.trackIds.length ?? 0} track IDs</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/')}>Done</Button>
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
