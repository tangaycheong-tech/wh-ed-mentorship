// ============================================================
// lib/validators.ts — Input validation helpers
// ============================================================

/**
 * Validate an email address format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength
 * - At least 8 characters
 * - At least one letter
 * - At least one number
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}

/**
 * Sanitize a string: trim, collapse whitespace, strip HTML tags
 */
export function sanitize(str: string): string {
  return str
    .trim()
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/\s+/g, " ");   // collapse whitespace
}

/**
 * Validate that a string is non-empty after sanitization
 */
export function isNonEmpty(str: string): boolean {
  return sanitize(str).length > 0;
}

/**
 * Validate a URL string
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a UUID v4 format
 */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}
