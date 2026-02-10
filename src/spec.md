# Specification

## Summary
**Goal:** Add an Admin/Artist allowlist with backend-enforced permissions and frontend role-based gating so only approved principals can manage songs, official playlists, and Home banner edits, while preserving guest read-only mode.

**Planned changes:**
- Add a hard-coded Admin/Artist Principal ID allowlist in the Motoko canister and a query method to check whether the caller is admin.
- Enforce admin-only authorization in the backend for song management operations (add/upload and delete), returning/raising authorization failures for non-admin signed-in users while keeping guest read-only flows working.
- Enforce admin-only authorization in the backend for official playlist write operations (create/add/remove) while keeping official playlist reads accessible to everyone and leaving user-owned playlist permissions unchanged.
- Add frontend role detection (querying the backend and caching per session) to derive an `isAdmin` state that updates on sign-in/sign-out and remains `false` in guest mode.
- Gate admin-only UI entry points (song add/upload, song delete, Home banner editing controls) so they are hidden or disabled for non-admin users, with clear English feedback.
- Update frontend error handling so backend authorization failures for admin-only actions show an English “admin access required” style message (without triggering the guest soft sign-in modal), and prevent retry loops for these actions.

**User-visible outcome:** Admin/Artist users (from the allowlist) can add/delete songs, manage official playlists, and edit the Home banner; all other users can still browse/search/play in guest/read-only mode, but cannot access or trigger admin-only features and will see clear English permission errors if they try.
