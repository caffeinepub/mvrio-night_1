# Specification

## Summary
**Goal:** Add a 5-second long-press activation on the Home banner to open the existing Hidden Admin Mode passcode modal, as an additional trigger alongside the Ctrl+Shift+U shortcut.

**Planned changes:**
- Add a long-press (press-and-hold) gesture handler on the Home channel banner image area that triggers after a continuous 5 seconds.
- Support both touch (mobile) and mouse/pointer (desktop) long-press detection, cancelling if released early or if the pointer/finger leaves the banner area.
- Wire the long-press trigger to open the same existing Admin passcode modal used by Ctrl+Shift+U, without changing the existing passcode flow or admin mode logic.
- Ensure the long-press interaction does not interfere with normal playback/navigation interactions elsewhere on the Home screen.

**User-visible outcome:** On both mobile and desktop, the user can press and hold on the Home banner for 5 seconds to open the existing Admin passcode modal and enable Admin Mode (without changing the Ctrl+Shift+U shortcut behavior).
