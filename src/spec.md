# Specification

## Summary
**Goal:** Fix the frontend authentication state mismatch so Internet Identity signed-in users are consistently treated as authenticated, preventing restricted actions from repeatedly opening the soft sign-in modal and ensuring the modal sign-in button reliably initiates login and closes/retries correctly.

**Planned changes:**
- Update `frontend/src/context/AuthContext.tsx` so `isAuthenticated` is derived from `useInternetIdentity().identity` and stays in sync on identity changes (login/logout).
- Fix restricted-action guards (Like, Add to Favorites, Create Playlist, Add to Playlist, offline cache, device download, messaging) to only open the soft sign-in modal when truly unauthenticated.
- Make the soft sign-in modal “Sign In with Internet Identity” button reliably trigger the Internet Identity login flow and automatically close the modal on successful authentication.
- Ensure `requireAuth(...)` pending restricted actions are retried once after successful login, then cleared to avoid loops and repeat prompts.
- Standardize error handling so signed-in users encountering non-auth failures see an appropriate error (e.g., toast) rather than being routed back into the sign-in modal; keep all user-facing text in English.

**User-visible outcome:** After signing in with Internet Identity, restricted actions work without re-opening the soft sign-in modal. If signed out, restricted actions still prompt the modal; signing in from the modal works reliably, closes automatically on success, and completes the originally requested action once without getting stuck in a loop.
