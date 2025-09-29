// services/uploadUtils.js
import CloudinaryService from './cloudinaryService';

export const uploadImageToCloudinary = async (file, folder = 'profile-pictures') => {
  try {
    console.log('=== UPLOAD UTILS START ===');
    console.log('File:', file);
    console.log('File type:', file.type);
    console.log('File size:', file.size);

    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.log('File validation failed:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    // Check if credentials are available
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    console.log('Environment check:', {
      cloudName,
      uploadPreset,
      hasCloudName: !!cloudName,
      hasUploadPreset: !!uploadPreset
    });

    if (!cloudName || !uploadPreset) {
      console.warn('Cloudinary credentials missing, using local fallback');
      // Fallback: return local file URL for testing
      const localUrl = URL.createObjectURL(file);
      return {
        success: true,
        url: localUrl,
        public_id: `local_${Date.now()}`,
        isLocal: true
      };
    }

    console.log('Proceeding with Cloudinary upload...');

    // Upload to Cloudinary
    const result = await CloudinaryService.upload(file, folder);
    
    console.log('Cloudinary upload successful:', result);
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const deleteImageFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return { success: true };
    
    // If it's a local file, just return success
    if (publicId.startsWith('local_')) {
      return { success: true };
    }

    // Check if credentials are available
    if (!process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || !process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET) {
      console.warn('Cloudinary credentials not found, skipping delete');
      return { success: true };
    }
    
    const result = await CloudinaryService.delete(publicId);
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Validate image file
export const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please select a valid image file (JPG, PNG, GIF, WebP)' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size should be less than 5MB' };
  }
  
  return { valid: true };
};