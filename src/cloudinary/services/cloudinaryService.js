// services/cloudinaryService.js
export class CloudinaryService {
    static async upload(file, folder = 'profile-pictures') {
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
      
      console.log('=== CLOUDINARY SERVICE UPLOAD ===');
      console.log('Cloud Name:', cloudName);
      console.log('Upload Preset:', uploadPreset);
      console.log('Folder:', folder);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      
      // Optional: Add transformations
      formData.append('transformation', 'w_400,h_400,c_fill,g_face,q_auto');
      
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      console.log('Upload URL:', uploadUrl);
      
      try {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed with status:', response.status);
          console.error('Error response:', errorText);
          throw new Error(`Upload failed: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Upload successful:', result);
        return result;
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
      }
    }
    
    static async delete(publicId) {
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
      
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('upload_preset', uploadPreset);
      
      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          {
            method: 'POST',
            body: formData,
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Delete failed');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
      }
    }
  }
  
  export default CloudinaryService;