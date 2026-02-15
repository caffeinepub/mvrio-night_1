# Specification

## Summary
**Goal:** Make the app fully installable as a PWA on desktop and mobile with reliable install prompts, standalone/full-screen behavior, and offline support.

**Planned changes:**
- Register `/service-worker.js` once on app startup from an editable file (without changing immutable paths) so the browser recognizes the app as a PWA.
- Update `frontend/public/manifest.webmanifest` to meet installability requirements (correct `start_url`/`scope`, standalone-capable `display`, theme/background colors, and working 192/512 icons) while keeping existing branding.
- Add iOS PWA meta/link tags to `frontend/index.html` (including an `apple-touch-icon`) to improve Add to Home Screen and standalone launch behavior.
- Harden the existing install UX (A2HSBanner + Sidebar “Install App”) to consistently trigger the native install prompt when eligible and show accurate guidance when not eligible; hide/disable install after installation in-session.
- Improve service worker caching for the app shell and essential static assets to support offline use for previously visited content, while preserving the existing behavior that avoids auto-caching audio files.

**User-visible outcome:** Users on desktop and mobile can install the app as a PWA (with a working install prompt when eligible), launch it in an app-like standalone window, and continue to load the app shell and essential UI assets offline for previously visited pages (without changing how audio offline caching works).
