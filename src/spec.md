# Specification

## Summary
**Goal:** Fix the song Like button to behave as a true toggle and update the Home banner to use the uploaded image without cropping or stretching.

**Planned changes:**
- Update the Like (heart) button interaction to correctly call the existing `toggleLikeSong(songId)` mutation, toggle like/unlike on repeated taps, and refresh/update the displayed `likeCount` while staying in sync with the backend.
- Ensure the Like button click/tap does not trigger song playback or any parent click handlers, and preserves existing “login required” behavior when the user is not authenticated.
- Replace the Home channel banner image with the bundled static asset `Aesthetic Moments from My Week (1).jpeg`, rendering it with preserved aspect ratio and no cropping/stretching, while keeping current header/A2HS placement and avoiding overlap.

**User-visible outcome:** Users can like/unlike a song reliably with the heart button (with the count updating correctly), and the Home page shows the new uploaded banner image fully visible without being cropped or distorted.
