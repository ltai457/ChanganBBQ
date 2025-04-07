// src/components/admin/BannerImageManager.jsx
import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../../firebase';

function BannerImageManager() {
  const [bannerInfo, setBannerInfo] = useState({
    active: true,
    imageUrl: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  useEffect(() => {
    fetchBannerInfo();
  }, []);
  
  const fetchBannerInfo = async () => {
    setLoading(true);
    try {
      const bannerDoc = await getDoc(doc(db, 'settings', 'bannerImage'));
      if (bannerDoc.exists()) {
        const data = bannerDoc.data();
        setBannerInfo(data);
        setImagePreview(data.imageUrl || null);
      } else {
        // Initialize with default empty values
        setBannerInfo({
          active: true,
          imageUrl: ''
        });
      }
    } catch (error) {
      console.error('Error fetching banner info:', error);
      setError('Failed to load banner image. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, checked } = e.target;
    setBannerInfo({
      ...bannerInfo,
      [name]: checked
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Function to upload banner image
  const uploadImage = async (file) => {
    if (!file) return bannerInfo.imageUrl || '';
    
    try {
      // File size validation (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 5MB');
      }
      
      // File type validation
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP.');
      }
      
      // Create a secure file path
      const imageName = `banners/banner_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, imageName);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Delete old image if exists
      if (bannerInfo.imageUrl && bannerInfo.imageUrl.includes('firebasestorage')) {
        try {
          const oldImageRef = ref(storage, bannerInfo.imageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue with update even if deletion fails
        }
      }
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageFile && !bannerInfo.imageUrl) {
      setError('Please select an image to upload');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      let imageUrl = bannerInfo.imageUrl;
      
      // Upload image if a new file is selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      // Prepare data to save
      const bannerData = {
        active: bannerInfo.active,
        imageUrl,
        updatedAt: new Date()
      };
      
      // Check if document exists
      const bannerDoc = await getDoc(doc(db, 'settings', 'bannerImage'));
      
      if (bannerDoc.exists()) {
        // Update existing document
        await updateDoc(doc(db, 'settings', 'bannerImage'), bannerData);
      } else {
        // Create new document
        bannerData.createdAt = new Date();
        await setDoc(doc(db, 'settings', 'bannerImage'), bannerData);
      }
      
      alert('Banner image saved successfully!');
      
      // Reset image file state
      setImageFile(null);
      
      // Fetch updated info
      await fetchBannerInfo();
    } catch (error) {
      console.error('Error saving banner image:', error);
      setError('Failed to save banner image. ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const deleteBanner = async () => {
    if (!window.confirm('Are you sure you want to delete this banner image?')) {
      return;
    }
    
    setSaving(true);
    try {
      // Delete image from storage if it exists
      if (bannerInfo.imageUrl && bannerInfo.imageUrl.includes('firebasestorage')) {
        try {
          const imageRef = ref(storage, bannerInfo.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue even if deletion fails
        }
      }
      
      // Update document to inactive state
      await updateDoc(doc(db, 'settings', 'bannerImage'), {
        active: false,
        imageUrl: '',
        updatedAt: new Date()
      });
      
      alert('Banner image deleted successfully!');
      
      // Reset states
      setImageFile(null);
      setImagePreview(null);
      
      // Fetch updated info
      await fetchBannerInfo();
    } catch (error) {
      console.error('Error deleting banner:', error);
      setError('Failed to delete banner image. ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-6">Banner Image</h1>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4">Loading banner information...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={bannerInfo.active}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">
              Show banner image
            </label>
          </div>
          
          {/* Banner Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Image
            </label>
            
            <div className="flex flex-col space-y-4">
              {imagePreview && (
                <div>
                  <img
                    src={imagePreview}
                    alt="Banner Preview"
                    className="w-full h-40 object-cover rounded-md border border-gray-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/1200x300?text=Banner+Image';
                    }}
                  />
                </div>
              )}
              
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommended size: 1200x300 pixels. Max file size: 5MB.
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="pt-5 flex justify-end space-x-3">
            {bannerInfo.imageUrl && (
              <button
                type="button"
                onClick={deleteBanner}
                className="bg-red-50 text-red-600 py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Image
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default BannerImageManager;