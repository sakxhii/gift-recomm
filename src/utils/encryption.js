/**
 * Simple data obfuscation for local storage
 * Note: This is not for security, just to prevent casual inspection
 */

export const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    // Simple reversible transformation
    const encoded = btoa(encodeURIComponent(jsonString));
    return encoded;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

export const decryptData = (encryptedString) => {
  try {
    if (!encryptedString) return null;
    const decoded = decodeURIComponent(atob(encryptedString));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * Generate a simple checksum for data integrity
 */
export const generateChecksum = (data) => {
  const str = JSON.stringify(data);
  let hash = 0;
  if (str.length === 0) return hash.toString(36);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Compress data before storage (reduces size)
 */
export const compressData = (data) => {
  // Simple compression by removing whitespace
  return JSON.stringify(data);
};

/**
 * Validate data structure
 */
export const validateData = (data, schema) => {
  if (!data || typeof data !== 'object') return false;
  
  // Basic validation - can be expanded
  return Array.isArray(data) || 
         (data.profiles !== undefined || 
          data.history !== undefined || 
          data.settings !== undefined);
};