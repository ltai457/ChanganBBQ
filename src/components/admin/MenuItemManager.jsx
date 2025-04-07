// src/components/admin/MenuItemManager.jsx
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../../firebase.js';
import { getAuth } from 'firebase/auth';

function MenuItemManager() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    nameEn: '',
    nameCn: '',
    description: '',
    descriptionEn: '',
    descriptionCn: '',
    price: '',
    priceUsd: '',
    dietary: [],
    imageFile: null,
    imageUrl: ''
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  
 
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  useEffect(() => {
    if (selectedCategory) {
      fetchMenuItems();
    }
  }, [selectedCategory]);
  
  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      const categoriesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesList);
      if (categoriesList.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesList[0].id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  const fetchMenuItems = async () => {
    if (!selectedCategory) return;
    
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'categories', selectedCategory, 'items'));
      const itemsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(itemsList);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Image upload function
  const uploadImage = async (imageFile) => {
    if (!imageFile) return null;
  
    const auth = getAuth();
    const user = auth.currentUser;
  
    // Detailed authentication check
    if (!user) {
      console.error('No authenticated user found');
      alert('You must be logged in to upload images');
      return null;
    }
  
    try {
      // Comprehensive file validation
      if (!imageFile) {
        console.error('No image file provided');
        alert('Please select an image to upload');
        return null;
      }
  
      // File size validation (5MB limit)
      if (imageFile.size > 5 * 1024 * 1024) {
        console.error('File too large', {
          fileName: imageFile.name,
          fileSize: imageFile.size
        });
        alert('File is too large. Maximum size is 5MB');
        return null;
      }
  
      // File type validation
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(imageFile.type)) {
        console.error('Invalid file type', {
          fileName: imageFile.name,
          fileType: imageFile.type
        });
        alert('Invalid file type. Please upload JPEG, PNG, GIF, or WebP.');
        return null;
      }
  
      // Create a more secure and descriptive file path
      const imageName = `menu-items/${user.uid}/${Date.now()}_${imageFile.name
        .replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      const storageRef = ref(storage, imageName);
  
      // Metadata with additional information
      const metadata = {
        contentType: imageFile.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString()
        }
      };
  
      // Upload the image with detailed logging
      console.log('Uploading image:', {
        path: imageName,
        size: imageFile.size,
        type: imageFile.type
      });
  
      const snapshot = await uploadBytes(storageRef, imageFile, metadata);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
  
      // Log successful upload
      console.log('Image upload successful', {
        downloadURL,
        metadata: snapshot.metadata
      });
  
      return downloadURL;
    } catch (error) {
      // Comprehensive error logging
      console.group('Image Upload Error');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Full Error Object:', error);
      console.groupEnd();
      
      // Specific error handling
      switch (error.code) {
        case 'storage/unauthorized':
          alert('You do not have permission to upload. Please check your authentication.');
          break;
        case 'storage/canceled':
          alert('Upload was canceled.');
          break;
        case 'storage/unknown':
          alert('An unknown error occurred during upload.');
          break;
        default:
          alert(`Upload failed: ${error.message}. Please try again.`);
      }
      
      return null;
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  

  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imageFile: file
      });
      
      // Create image preview and store as data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Alternative: Add a URL input field
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData({
      ...formData,
      imageUrl: url
    });
    setImagePreview(url);
  };
  
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      nameEn: '',
      nameCn: '',
      description: '',
      descriptionEn: '',
      descriptionCn: '',
      price: '',
      priceUsd: '',
      dietary: [],
      imageFile: null,
      imageUrl: ''
    });
    setImagePreview(null);
    setFormMode('add');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      alert('Please select a category first.');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload image if a file is selected
      let imageUrl = formData.imageUrl;
      if (formData.imageFile) {
        imageUrl = await uploadImage(formData.imageFile);
        
        // If upload fails, use the existing URL or skip
        if (!imageUrl) {
          setIsUploading(false);
          return;
        }
      }
      
      // Prepare the item data
      const itemData = {
        name: formData.name,
        nameEn: formData.nameEn || '',
        nameCn: formData.nameCn || '',
        description: formData.description,
        descriptionEn: formData.descriptionEn || '',
        descriptionCn: formData.descriptionCn || '',
        price: parseFloat(formData.price) || 0,
        priceUsd: parseFloat(formData.priceUsd) || 0,
        dietary: formData.dietary,
        imageUrl: imageUrl || '', // Use uploaded URL or existing URL
        updatedAt: new Date()
      };
      
      if (formMode === 'add') {
        // Add new menu item
        itemData.createdAt = new Date();
        await addDoc(collection(db, 'categories', selectedCategory, 'items'), itemData);
        alert('Menu item added successfully!');
      } else {
        // Update existing menu item
        const docRef = doc(db, 'categories', selectedCategory, 'items', formData.id);
        await updateDoc(docRef, itemData);
        alert('Menu item updated successfully!');
      }
      
      // Reset form and refresh data
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Error saving menu item. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleEdit = (item) => {
    setFormData({
      id: item.id,
      name: item.name || '',
      nameEn: item.nameEn || '',
      nameCn: item.nameCn || '',
      description: item.description || '',
      descriptionEn: item.descriptionEn || '',
      descriptionCn: item.descriptionCn || '',
      price: item.price?.toString() || '',
      priceUsd: item.priceUsd?.toString() || '',
      dietary: item.dietary || [],
      imageFile: null,
      imageUrl: item.imageUrl || ''
    });
    setImagePreview(item.imageUrl);
    setFormMode('edit');
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }
    
    try {
      // First get the item to access its imageUrl
      const docRef = doc(db, 'categories', selectedCategory, 'items', itemId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const itemData = docSnap.data();
        
        // If there's an image URL, delete the image from Storage
        if (itemData.imageUrl && itemData.imageUrl.includes('firebasestorage')) {
          try {
            // Extract the storage path from the URL
            const storageRef = ref(storage, itemData.imageUrl);
            // Delete the file
            await deleteObject(storageRef);
            console.log('Image deleted successfully');
          } catch (error) {
            console.error('Error deleting image:', error);
            // Continue with item deletion even if image deletion fails
          }
        }
        
        // Delete the document from Firestore
        await deleteDoc(docRef);
        alert('Menu item deleted successfully!');
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Error deleting menu item. Please try again.');
    }
  };

  // Helper function to display price in both currencies
  const displayPrice = (item) => {
    let priceDisplay = `KHR ${item.price?.toFixed(2)  || '0.00'}`;
    if (item.priceUsd) {
      priceDisplay += ` / USD ${item.priceUsd?.toFixed(2)}`;
    }
    return priceDisplay;
  };
  
  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-6">Manage Menu Items</h1>
      
      {/* Category Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {categories.length === 0 ? (
            <option value="">No categories available</option>
          ) : (
            categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          )}
        </select>
      </div>
      
      {/* Add/Edit Form */}
      {selectedCategory && (
        <form onSubmit={handleSubmit} className="mb-8 border-b border-gray-200 pb-8">
          <h2 className="text-lg font-medium mb-4">
            {formMode === 'add' ? 'Add New Menu Item' : 'Edit Menu Item'}
          </h2>
          
          {/* Item Names (Multiple Languages) */}
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Item Name</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm text-gray-500 mb-1">
                  Default Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="nameEn" className="block text-sm text-gray-500 mb-1">
                  English Name
                </label>
                <input
                  type="text"
                  id="nameEn"
                  name="nameEn"
                  value={formData.nameEn}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="nameCn" className="block text-sm text-gray-500 mb-1">
                  Chinese Name
                </label>
                <input
                  type="text"
                  id="nameCn"
                  name="nameCn"
                  value={formData.nameCn}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          {/* Prices (Multiple Currencies) */}
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Price</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm text-gray-500 mb-1">
                  Local Price* (KHR)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="priceUsd" className="block text-sm text-gray-500 mb-1">
                  USD Price
                </label>
                <input
                  type="number"
                  id="priceUsd"
                  name="priceUsd"
                  value={formData.priceUsd}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          {/* Description (Multiple Languages) */}
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Description</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm text-gray-500 mb-1">
                  Default Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="descriptionEn" className="block text-sm text-gray-500 mb-1">
                  English Description
                </label>
                <textarea
                  id="descriptionEn"
                  name="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={handleInputChange}
                  rows="2"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="descriptionCn" className="block text-sm text-gray-500 mb-1">
                  Chinese Description
                </label>
                <textarea
                  id="descriptionCn"
                  name="descriptionCn"
                  value={formData.descriptionCn}
                  onChange={handleInputChange}
                  rows="2"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                ></textarea>
              </div>
            </div>
          </div>
          

          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Item Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <div className="mt-2 text-sm text-gray-500">
              Or enter an image URL:
            </div>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={handleImageUrlChange}
              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            {imagePreview && (
              <div className="mt-2">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-32 w-32 object-cover rounded-md" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            {formMode === 'edit' && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isUploading}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading 
                  ? 'Uploading...' 
                  : (formMode === 'add' ? 'Add Menu Item' : 'Update Menu Item')
                }
              </button>
            </div>
          </form>
        )}
        
        {/* Menu Items List */}
        <div>
          <h2 className="text-lg font-medium mb-4">Menu Items</h2>
          
          {!selectedCategory ? (
            <div className="text-center py-4 text-gray-500">Please select a category first.</div>
          ) : loading ? (
            <div className="text-center py-4">Loading menu items...</div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No items in this category yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menuItems.map(item => (
                <div key={item.id} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="h-48 bg-gray-200 relative">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{item.name}</h3>
                        {item.nameEn && <div className="text-sm text-gray-500">{item.nameEn}</div>}
                        {item.nameCn && <div className="text-sm">{item.nameCn}</div>}
                      </div>
                      <span className="text-green-600 font-medium whitespace-nowrap">
                        {displayPrice(item)}
                      </span>
                    </div>
                    
                    {item.description && (
                      <div className="mt-2">
                        <p className="text-gray-500 text-sm">{item.description}</p>
                        {item.descriptionEn && <p className="text-gray-500 text-sm">{item.descriptionEn}</p>}
                        {item.descriptionCn && <p className="text-gray-500 text-sm">{item.descriptionCn}</p>}
                      </div>
                    )}
                    
                    {item.dietary && item.dietary.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.dietary.map(diet => (
                          <span 
                            key={diet} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                          >
                            {diet}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  export default MenuItemManager;