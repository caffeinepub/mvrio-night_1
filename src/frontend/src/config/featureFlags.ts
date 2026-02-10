/**
 * Feature flags for staged rollouts and experimental features.
 * All flags default to false/disabled to preserve current behavior.
 */

export const featureFlags = {
  /**
   * Enable desktop bottom tab bar with Night Mode colors.
   * When false (default): Desktop uses sidebar navigation only (lg:hidden on BottomTabBar).
   * When true: Desktop displays bottom tab bar with same Night Mode color rules as mobile.
   */
  enableDesktopBottomTabBar: true,
} as const;

export type FeatureFlags = typeof featureFlags;
