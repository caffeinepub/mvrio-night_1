/**
 * Validation utilities for Artist Profile fields.
 * Provides English error messages for inline display.
 */

export interface ArtistProfileValidationErrors {
  bio?: string;
  youtube?: string;
  instagram?: string;
  buyMeACoffee?: string;
}

/**
 * Validates a URL field (required and must be a valid URL format).
 */
function validateUrl(url: string, fieldName: string): string | undefined {
  if (!url || url.trim() === '') {
    return `${fieldName} is required`;
  }

  try {
    new URL(url);
    return undefined;
  } catch {
    return `${fieldName} must be a valid URL`;
  }
}

/**
 * Validates the entire artist profile.
 * Returns an object with field-level error messages.
 */
export function validateArtistProfile(profile: {
  bio: string;
  youtube: string;
  instagram: string;
  buyMeACoffee: string;
}): ArtistProfileValidationErrors {
  const errors: ArtistProfileValidationErrors = {};

  // Bio is optional, no validation needed

  // YouTube URL is required
  const youtubeError = validateUrl(profile.youtube, 'YouTube URL');
  if (youtubeError) {
    errors.youtube = youtubeError;
  }

  // Instagram URL is required
  const instagramError = validateUrl(profile.instagram, 'Instagram URL');
  if (instagramError) {
    errors.instagram = instagramError;
  }

  // Buy Me a Coffee URL is required
  const buyMeACoffeeError = validateUrl(profile.buyMeACoffee, 'Buy Me a Coffee URL');
  if (buyMeACoffeeError) {
    errors.buyMeACoffee = buyMeACoffeeError;
  }

  return errors;
}

/**
 * Checks if the validation errors object has any errors.
 */
export function hasValidationErrors(errors: ArtistProfileValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
