/**
 * Utility functions for image processing and validation
 */

/**
 * Validate an image file
 * @param {File} file - The file to validate
 * @returns {Object} - Validation result
 */
export const validateImageFile = (file) => {
  const errors = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/gif'];

  if (!file) {
    return { valid: false, errors: ['No file selected'] };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type "${file.type}" not supported. Please use JPEG, PNG, WebP, BMP, or GIF.`);
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit.`);
  }

  // Check if it's actually an image
  if (!file.type.startsWith('image/')) {
    errors.push('Selected file is not an image.');
  }

  return {
    valid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeFormatted: `${(file.size / 1024).toFixed(2)} KB`
    }
  };
};

/**
 * Create a thumbnail/preview of an image
 * @param {File} file - The image file
 * @param {number} maxWidth - Maximum width for thumbnail
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export const createThumbnail = (file, maxWidth = 300) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - JPEG quality (0.1 to 1.0)
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Extract EXIF orientation and fix rotation if needed
 * @param {File} file - Image file
 * @returns {Promise<File>} - Rotated image file
 */
export const fixImageRotation = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Check if rotation is needed based on EXIF data
        // Note: Full EXIF reading requires external library
        // For now, just return original if dimensions suggest portrait
        if (img.height > img.width * 1.5) {
          // Image appears portrait, might need rotation
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Rotate 90 degrees if needed
          canvas.width = img.height;
          canvas.height = img.width;
          
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file); // Return original if blob creation fails
              return;
            }
            
            const rotatedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(rotatedFile);
          }, 'image/jpeg', 0.9);
        } else {
          resolve(file); // Return original if no rotation needed
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Crop image to business card aspect ratio (3.5:2)
 * @param {File} file - Image file
 * @returns {Promise<File>} - Cropped image file
 */
export const cropToCardRatio = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const targetRatio = 3.5 / 2; // Business card ratio
        const currentRatio = img.width / img.height;
        
        let cropWidth, cropHeight, cropX, cropY;
        
        if (currentRatio > targetRatio) {
          // Image is wider than target ratio, crop width
          cropHeight = img.height;
          cropWidth = cropHeight * targetRatio;
          cropX = (img.width - cropWidth) / 2;
          cropY = 0;
        } else {
          // Image is taller than target ratio, crop height
          cropWidth = img.width;
          cropHeight = cropWidth / targetRatio;
          cropX = 0;
          cropY = (img.height - cropHeight) / 2;
        }
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight, // Source rectangle
          0, 0, cropWidth, cropHeight          // Destination rectangle
        );
        
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file); // Return original if blob creation fails
            return;
          }
          
          const croppedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(croppedFile);
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Enhance image for better OCR results
 * @param {File} file - Image file
 * @returns {Promise<File>} - Enhanced image file
 */
export const enhanceForOCR = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple contrast enhancement
        for (let i = 0; i < data.length; i += 4) {
          // Increase contrast
          const factor = 1.2;
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));     // R
          data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // G
          data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file); // Return original if blob creation fails
            return;
          }
          
          const enhancedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(enhancedFile);
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Get image dimensions
 * @param {File} file - Image file
 * @returns {Promise<Object>} - Width and height
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};