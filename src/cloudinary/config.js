// services/cloudinaryService.js
class CloudinaryService {
    static async upload(file, folder = 'profile-pictures') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', folder);
      
      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
      }
    }
    
    static async delete(publicId) {
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
      
      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/destroy`,
          {
            method: 'POST',
            body: formData,
          }
        );
        
        if (!response.ok) {
          throw new Error('Delete failed');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
      }
    }
  }
  
  export default CloudinaryService;