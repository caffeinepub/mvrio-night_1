# Specification

## Summary
**Goal:** Restore the app header icon to a neon-green music note with a white outline, without changing the header’s layout or behavior.

**Planned changes:**
- Add a neon-green music note (white outline) PNG icon as a static asset under `frontend/public/assets/generated/`.
- Update `frontend/src/components/branding/AppHeader.tsx` to reference the new icon via its `<img src=...>` while keeping all existing sizing, alignment, spacing, and wrapper classes unchanged.
- Ensure no navigation, click handlers, or other header functionality is modified.

**User-visible outcome:** The header shows a neon-green music note icon with a white outline in the same position/size as before, with all header buttons and navigation working exactly the same.
