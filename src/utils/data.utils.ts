/**
 * Utility functions for data cleaning and transformation
 */

/**
 * Clean object by removing empty strings and converting them to undefined
 * This helps prevent API errors when empty strings are sent for optional fields
 */
export const cleanObject = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') {
      // Skip empty strings - they will be undefined in the cleaned object
      continue;
    } else if (value === null || value === undefined) {
      // Skip null and undefined values
      continue;
    } else if (typeof value === 'string') {
      // Trim strings and add if not empty
      const trimmed = value.trim();
      if (trimmed) {
        cleaned[key as keyof T] = trimmed as any;
      }
    } else {
      // Keep all other values (numbers, booleans, etc.)
      cleaned[key as keyof T] = value;
    }
  }
  
  return cleaned;
};

/**
 * Clean phone number by removing non-numeric characters
 */
export const cleanPhoneNumber = (phone?: string): string | undefined => {
  if (!phone) return undefined;
  
  // Remove all non-numeric characters except + (for international codes)
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  return cleaned || undefined;
};

/**
 * Convert empty values to null for database storage
 */
export const emptyToNull = <T extends Record<string, any>>(obj: T): T => {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === '' || value === undefined) {
      result[key] = null;
    } else {
      result[key] = value;
    }
  }
  
  return result;
};