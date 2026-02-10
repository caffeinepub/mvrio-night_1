# Specification

## Summary
**Goal:** Add a global authentication context and soft sign-in modal that gates restricted actions for guests, captures/recovers the user’s current screen + scroll position, and retries the blocked action after successful sign-in.

**Planned changes:**
- Create `frontend/src/context/AuthContext.tsx` providing `userAuthState` (`guest`/`signedIn`), `pendingAction`, `loginReturnPath`, and helpers to open/close the sign-in modal, record a pending restricted action without navigating away, and on successful sign-in restore prior screen + scroll position and retry the pending action once.
- Add `frontend/src/components/SignInModal.tsx` as a globally rendered modal controlled by AuthContext, with exactly two primary sign-in actions plus Cancel, and status messaging for the email sign-in flow (in progress / check email / failed or expired).
- Add `frontend/src/hooks/usePendingAction.ts` to standardize registering and executing pending actions for: Like/Unlike, Create Playlist, Add to Playlist, and Download (offline cache and device download).
- Integrate `AuthProvider` and global `SignInModal` into the existing app shell (e.g., `frontend/src/App.tsx`) without modifying immutable files, while preserving existing navigation and the first-launch-only welcome popup behavior.
- Update restricted-action entry points (like actions, playlist creation/add-to-playlist flows, and download chooser actions) to use the shared AuthContext + pending-action retry flow, while keeping existing event/propagation behavior intact.
- Keep backend permission checks unchanged; ensure unauthorized failures in restricted calls trigger the soft sign-in flow without impacting guest read-only browsing/streaming/lyrics behavior.

**User-visible outcome:** Guests can browse and play normally, but attempting restricted actions (like, playlist actions, downloads) opens a soft sign-in modal without leaving the current screen; after signing in, the app returns to the same screen and scroll position and automatically completes the action they originally attempted.
