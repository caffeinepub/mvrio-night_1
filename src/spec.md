# Specification

## Summary
**Goal:** Add a dedicated playlist detail screen with Spotify-like playlist controls, and enable admin-only creation plus real listing/opening of Official Playlists.

**Planned changes:**
- Make Library → Playlists cards fully clickable to open a playlist detail view (without triggering unintended playback), with a Back control that returns to the prior Library → Playlists state.
- Implement a playlist detail view that shows playlist name and renders the playlist’s songs using existing song row components and existing playback behavior.
- Ensure playback from the playlist detail view uses playlist context for Next/Previous navigation within the playlist’s song list.
- Add playlist-level controls on the playlist detail view: a prominent Play button plus Shuffle, Repeat (at least Off/Repeat All), and a Play Mode control that visibly changes state and affects playlist playback ordering/behavior.
- Add an Admin-Mode-only “Create Official Playlist” button beside the “Official Playlists” header in Library → Playlists; open a name-entry dialog and show English success/failure toasts.
- Backend: expose APIs to list official playlists (names + songIds) and to load official playlist details for the playlist detail view (Motoko single-actor).
- Frontend: render a real “Official Playlists” section (name + song count) from backend data; allow opening an official playlist in the same playlist detail view, with official playlist reads accessible to guests.

**User-visible outcome:** Users can open any playlist to view its songs and play within that playlist using playlist-level Shuffle/Repeat/Play Mode controls; admins (Hidden Admin Mode) can create official playlists, and everyone (including guests) can browse and open official playlists and see their contents.
