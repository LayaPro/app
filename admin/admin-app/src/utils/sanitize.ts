/**
 * Sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize text input by removing potentially malicious characters
 * Allows: letters, numbers, spaces, and common punctuation (.,'-@)
 */
export const sanitizeTextInput = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script-related content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove common XSS patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=
  
  // Remove special characters that could be used for injection
  // Allow: letters, numbers, spaces, dots, commas, apostrophes, hyphens, @
  sanitized = sanitized.replace(/[^\w\s.,'\-@]/g, '');
  
  // Trim and limit consecutive spaces
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  return sanitized;
};

/**
 * Sanitize URL input (website, social media links)
 * Strips HTML/script injection but preserves all valid URL characters
 */
export const sanitizeUrl = (input: string): string => {
  if (!input) return '';

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script-related content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Block javascript: protocol and event handlers
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Trim whitespace only — preserve all valid URL characters (/, :, ?, =, &, %, #, etc.)
  return sanitized.trim();
};

/**
 * Sanitize name fields (first name, last name)
 * Allows: letters, spaces, hyphens, apostrophes
 */
export const sanitizeName = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags and scripts
  let sanitized = input.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Allow only letters, spaces, hyphens, and apostrophes
  sanitized = sanitized.replace(/[^a-zA-Z\s'\-]/g, '');
  
  // Trim and limit consecutive spaces
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  return sanitized;
};

/**
 * Sanitize email input
 * Allows: standard email characters
 */
export const sanitizeEmail = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags and scripts
  let sanitized = input.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Allow only valid email characters: letters, numbers, @, ., -, _
  sanitized = sanitized.replace(/[^a-zA-Z0-9@.\-_]/g, '');
  
  // Remove spaces
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Sanitize phone number input
 * Allows: numbers, +, -, (, ), spaces
 */
export const sanitizePhoneNumber = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags and scripts
  let sanitized = input.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Allow only phone number characters
  sanitized = sanitized.replace(/[^0-9+\-() ]/g, '');
  
  return sanitized.trim();
};

/**
 * Sanitize alphanumeric input (like government ID)
 * Allows: letters, numbers, hyphens
 */
export const sanitizeAlphanumeric = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags and scripts
  let sanitized = input.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Allow only letters, numbers, and hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-]/g, '');
  
  return sanitized.trim();
};

/**
 * Sanitize textarea/address input
 * Allows: letters, numbers, spaces, common punctuation, newlines
 */
export const sanitizeTextarea = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script-related content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove common XSS patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Allow: letters, numbers, spaces, newlines, and common punctuation
  sanitized = sanitized.replace(/[^\w\s.,'\-@#\n\r/()?!:]/g, '');
  
  // Trim excessive whitespace but preserve intentional line breaks
  sanitized = sanitized.trim().replace(/[ \t]+/g, ' ');
  
  return sanitized;
};

/**
 * General sanitization for any string input
 * Most restrictive - use for unknown input types
 */
export const sanitizeString = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script-related content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove common XSS patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized.trim();
};
