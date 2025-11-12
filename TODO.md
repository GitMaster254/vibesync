# TODO: Expand Music Search and Add More Songs/Genres

## Steps to Complete

- [x] Update `src/lib/spotify-proxy.ts`:
  - [x] Expand `getGenres()` function: Add more genres (e.g., metal, punk, indie, alternative, techno, house, ambient, soul, funk, disco, latin, r&b, gospel, instrumental, soundtrack) to reach ~30-40 total genres.
  - [x] Increase API limits:
    - [x] `getFeaturedTracks`: Change limit from 50 to 100.
    - [x] `getGenreTracks`: Change limit from 20 to 50.
    - [x] `searchTracks`: Change limit from 20 to 50.

- [x] Update `src/pages/explorer.tsx`:
  - [x] Update function calls to match new limits:
    - [x] Featured: Change `await spotifyProxy.getFeaturedTracks(50)` to `await spotifyProxy.getFeaturedTracks(100)`.
    - [x] Genre tracks: Change `await spotifyProxy.getGenreTracks(genreId, 20)` to `await spotifyProxy.getGenreTracks(genreId, 50)`.
    - [x] Search: Change `await spotifyProxy.searchTracks(searchQuery.trim(), 20)` to `await spotifyProxy.searchTracks(searchQuery.trim(), 50)`.
  - [x] Update `genreIconMap` to include icons for new genres (e.g., use existing icons like Guitar for metal/punk).

- [x] Followup Steps:
  - [x] Test the app locally (e.g., `npm run dev`) and navigate to Explorer page.
  - [ ] Verify Featured tab has more tracks (up to 100).
  - [ ] Verify Genres tab has expanded list and more tracks per genre (up to 50).
  - [ ] Perform searches to verify more results (up to 50).
  - [ ] Monitor for API rate limits or errors; adjust if needed.
  - [ ] If app loads slowly, consider pagination in future.
