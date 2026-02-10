# A2HSBanner Behavior Documentation

## Invariants

The `A2HSBanner` component maintains the following behavior rules:

1. **Conditional Visibility**: The banner only renders when `canInstall` is `true` (i.e., when the `beforeinstallprompt` event has been captured and the app is not already installed).

2. **Session-Only Dismissal**: When the user clicks the close button (X), the banner is hidden for the current session only using `sessionStorage`. It will reappear on the next browser session if install conditions are still met.

3. **Automatic Hiding After Install Interaction**: After the user interacts with the install prompt (either accepting or dismissing it), the banner automatically hides and stores this state in `sessionStorage`.

4. **No Changes to This File**: This change set (REQ-146 through REQ-149) does not modify the `A2HSBanner` component or its behavior. The banner continues to follow all existing rules independently of the new sidebar "Install App" button.

## Purpose

This documentation ensures that future modifications to the PWA install flow do not inadvertently alter the top banner's carefully designed behavior.
