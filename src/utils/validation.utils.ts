/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): boolean {
  if (!password || password.length < 8) {
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email) {
    return false;
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Additional checks
  if (!emailRegex.test(email)) {
    return false;
  }

  // Check for double dots
  if (email.includes('..')) {
    return false;
  }

  // Check for valid domain
  const [, domain] = email.split('@');
  if (!domain || domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }

  return true;
}

/**
 * Validates username
 * Requirements:
 * - 3-50 characters
 * - Only alphanumeric and underscore
 * - Must start with a letter
 */
export function validateUsername(username: string): boolean {
  if (!username || username.length < 3 || username.length > 50) {
    return false;
  }

  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(username);
}

/**
 * Validates UUID v4 format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}