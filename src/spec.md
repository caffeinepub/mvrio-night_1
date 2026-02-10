# Specification

## Summary
**Goal:** Fix mobile playlist Favorites so they persist per authenticated user, and make the mobile playlist Share action generate and share/copy a working deep link.

**Planned changes:**
- Add/repair backend support for per-user playlist favorites keyed by the authenticated Internet Identity principal, including `getPlaylistFavorites()` and `togglePlaylistFavorite(playlistName: Text)` with proper auth handling.
- Update the mobile `PlaylistOverflowMenu` Favorites action to call the backend, support sign-in gating (pending action `playlist-favorites`), close the menu after action, and reflect updated favorite state persistently.
- Implement the mobile `PlaylistOverflowMenu` Share action to generate a hash/query deep link for playlists (matching the existing song deep-link pattern) and use Web Share API when available, otherwise copy to clipboard and show a toast, without redesigning the menu.

**User-visible outcome:** On mobile, signed-in users can add/remove playlist favorites and see them persist after refresh/navigation, and users can share a playlist via the native share sheet (when supported) or copy a correct deep link to the clipboard.
