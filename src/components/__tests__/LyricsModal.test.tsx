// Unit test for LyricsModal component
// Note: This is a basic test structure. In a real setup, you'd use React Testing Library.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LyricsModal } from '../LyricsModal';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('LyricsModal', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('renders modal trigger', () => {
    render(
      <LyricsModal
        artist="Test Artist"
        title="Test Title"
        trigger={<button>Open Lyrics</button>}
      />
    );

    expect(screen.getByText('Open Lyrics')).toBeInTheDocument();
  });

  test('opens modal and shows loading state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        found: true,
        lyrics: 'Test lyrics content',
        message: 'Lyrics found',
        source: 'lyrics.ovh',
        cached: false
      })
    });

    render(
      <LyricsModal
        artist="Test Artist"
        title="Test Title"
        trigger={<button>Open Lyrics</button>}
        open={true}
      />
    );

    // Check loading state
    expect(screen.getByText('Loading lyrics...')).toBeInTheDocument();

    // Wait for lyrics to load
    await waitFor(() => {
      expect(screen.getByText('Test lyrics content')).toBeInTheDocument();
    });
  });

  test('shows lyrics not found message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        found: false,
        lyrics: '',
        message: 'Lyrics not found',
        source: 'lyrics.ovh',
        cached: false
      })
    });

    render(
      <LyricsModal
        artist="Unknown Artist"
        title="Unknown Title"
        trigger={<button>Open Lyrics</button>}
        open={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lyrics Not Found')).toBeInTheDocument();
    });
  });

  test('handles fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <LyricsModal
        artist="Test Artist"
        title="Test Title"
        trigger={<button>Open Lyrics</button>}
        open={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error Loading Lyrics')).toBeInTheDocument();
    });
  });

  test('copy button works', async () => {
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn()
      }
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        found: true,
        lyrics: 'Test lyrics',
        message: 'Lyrics found',
        source: 'lyrics.ovh',
        cached: false
      })
    });

    render(
      <LyricsModal
        artist="Test Artist"
        title="Test Title"
        trigger={<button>Open Lyrics</button>}
        open={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test lyrics')).toBeInTheDocument();
    });

    const copyButton = screen.getByTitle('Copy');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test lyrics');
  });

  test('share button works with native share', async () => {
    // Mock native share
    Object.assign(navigator, {
      share: jest.fn()
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        found: true,
        lyrics: 'Test lyrics',
        message: 'Lyrics found',
        source: 'lyrics.ovh',
        cached: false
      })
    });

    render(
      <LyricsModal
        artist="Test Artist"
        title="Test Title"
        trigger={<button>Open Lyrics</button>}
        open={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test lyrics')).toBeInTheDocument();
    });

    const shareButton = screen.getByTitle('Share');
    fireEvent.click(shareButton);

    expect(navigator.share).toHaveBeenCalled();
  });
});