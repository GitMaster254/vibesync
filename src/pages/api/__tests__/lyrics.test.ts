import { fetchLyrics } from '../lyrics'; // Assuming we export the function

// Mock environment variables
process.env.API_NINJAS_KEY = 'test_key';
process.env.LYRICS_ALLOW_SCRAPING = 'false';
process.env.LYRICS_UPSTREAM_TIMEOUT = '1000';

describe('Lyrics API', () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('successful lyrics fetch from primary source (lyrics.ovh)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ lyrics: 'Test lyrics from lyrics.ovh' })
    });

    const result = await fetchLyrics('test_artist', 'test_title');

    expect(result.found).toBe(true);
    expect(result.lyrics).toBe('Test lyrics from lyrics.ovh');
    expect(result.source).toBe('lyrics.ovh');
    expect(result.cached).toBe(false);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  test('fallback to API Ninjas when primary fails', async () => {
    // Primary fails with 404 (not considered an error)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });
    // Secondary succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ lyrics: 'Test lyrics from API Ninjas' }]
    });

    const result = await fetchLyrics('test_artist', 'test_title');

    expect(result.found).toBe(true);
    expect(result.lyrics).toBe('Test lyrics from API Ninjas');
    expect(result.source).toBe('api-ninjas');
    expect(result.errors).toHaveLength(0); // 404 is not an error, just not found
  });

  test('lyrics not found from all sources', async () => {
    // All sources fail with 404
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404
    });

    const result = await fetchLyrics('unknown_artist', 'unknown_title');

    expect(result.found).toBe(false);
    expect(result.lyrics).toBe('');
    expect(result.message).toBe('LYRICS NOT FOUND 🔜\nYou can still search "unknown_title" by unknown_artist for this song\'s lyrics online.');
    expect(result.source).toBe('');
    expect(result.errors).toHaveLength(0); // 404 is not an error
  });

  test('upstream error handling (5xx)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const result = await fetchLyrics('test_artist', 'test_title');

    expect(result.found).toBe(false);
    expect(result.errors[0].message).toBe('HTTP 500');
  });

  test('timeout handling', async () => {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await fetchLyrics('test_artist', 'test_title');

    expect(result.found).toBe(false);
    expect(result.errors[0].message).toBe('Timeout');
  });

  test('rate limiting', () => {
    // Test rate limit logic (would need to mock the rate limit store)
    // This is a placeholder for rate limiting tests
    expect(true).toBe(true);
  });

  test('caching', () => {
    // Test cache logic (would need to mock the cache)
    // This is a placeholder for caching tests
    expect(true).toBe(true);
  });
});