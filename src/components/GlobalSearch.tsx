import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { getAllPlaylists, getAllTracks, Playlist, Track } from '@/lib/db';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useIsMobile } from '@/hooks/use-mobile';

// Lightweight global event names for opening/closing the palette from anywhere
const OPEN_EVENT = 'open-command-palette';
const TOGGLE_EVENT = 'toggle-command-palette';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const isMobile = useIsMobile();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);

  const loadData = React.useCallback(async () => {
    // Fetch on open for freshness
    const [t, p] = await Promise.all([getAllTracks(), getAllPlaylists()]);
    setTracks(t);
    setPlaylists(p);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || target?.isContentEditable;

      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      if (isCmdK) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (!isTyping && e.key === '/' && !open) {
        // Quick open on '/'
        e.preventDefault();
        setOpen(true);
      }
    };

    const onOpen = () => setOpen(true);
    const onToggle = () => setOpen((o) => !o);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpen as EventListener);
    window.addEventListener(TOGGLE_EVENT, onToggle as EventListener);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpen as EventListener);
      window.removeEventListener(TOGGLE_EVENT, onToggle as EventListener);
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      loadData();
    }
  }, [open, loadData]);

  const q = query.trim().toLowerCase();
  const match = React.useCallback((text?: string) => (text || '').toLowerCase().includes(q), [q]);

  const filteredTracks = React.useMemo(() => {
    if (!q) return tracks.slice(0, 20);
    const results = tracks.filter((t) =>
      match(t.title) || match(t.artist) || match(t.album)
    );
    return results.slice(0, 25);
  }, [tracks, q, match]);

  const filteredPlaylists = React.useMemo(() => {
    if (!q) return playlists.slice(0, 10);
    const results = playlists.filter((p) => match(p.name) || match(p.description));
    return results.slice(0, 15);
  }, [playlists, q, match]);

  function handleSelectTrack(track: Track) {
    playTrack(track, [track]);
    setOpen(false);
  }

  function handleSelectPlaylist(pl: Playlist) {
    navigate(`/playlist/${pl.id}`);
    setOpen(false);
  }

  // Shared content for both mobile (Drawer) and desktop (Dialog)
  const CommandBody = (
    <>
      <CommandInput
        autoFocus
        value={query}
        onValueChange={setQuery}
        placeholder="Search tracks or playlists…"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Tracks">
          {filteredTracks.map((t) => (
            <CommandItem
              key={t.id}
              value={`track:${t.title} ${t.artist ?? ''} ${t.album ?? ''}`}
              onSelect={() => handleSelectTrack(t)}
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{t.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {t.artist || 'Unknown artist'}{t.album ? ` • ${t.album}` : ''}
                </span>
              </div>
              {!isMobile && <CommandShortcut>Enter</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Playlists">
          {filteredPlaylists.map((p) => (
            <CommandItem
              key={p.id}
              value={`playlist:${p.name}`}
              onSelect={() => handleSelectPlaylist(p)}
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{p.name}</span>
                {p.description ? (
                  <span className="truncate text-xs text-muted-foreground">{p.description}</span>
                ) : null}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[85dvh] pb-safe">
          <DrawerHeader>
            <DrawerTitle>Search</DrawerTitle>
          </DrawerHeader>
          <div className="flex h-full min-h-0 flex-col">
            {CommandBody}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      {CommandBody}
    </CommandDialog>
  );
}
