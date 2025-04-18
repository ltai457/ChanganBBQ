// src/components/admin/CategoryManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [initialY, setInitialY] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const listRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use orderBy to ensure categories are fetched in order
      const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      let categoriesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Extra sorting in the client for categories that might not have an order field
      categoriesList = categoriesList.sort((a, b) => {
        // If both have order field, sort by that
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // If only one has order, the one with order comes first
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // Otherwise keep original order
        return 0;
      });
      
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    // Check if category already exists
    const categoryExists = categories.some(
      category => category.name.toLowerCase() === newCategory.trim().toLowerCase()
    );

    if (categoryExists) {
      setError('This category already exists');
      return;
    }
    
    try {
      // Get the highest order value or use the length if no order values exist
      let highestOrder = categories.length;
      if (categories.some(cat => cat.order !== undefined)) {
        highestOrder = Math.max(...categories.map(cat => cat.order !== undefined ? cat.order : 0));
      }
      
      // Add new category with incremented order
      await addDoc(collection(db, 'categories'), { 
        name: newCategory.trim(),
        order: highestOrder + 1, // Place new category at the end
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Reset input and fetch updated categories
      setNewCategory('');
      setError(null);
      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category. Please try again.');
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!editCategory || !editCategory.name.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    // Check if category already exists (excluding current category)
    const categoryExists = categories.some(
      category => 
        category.id !== editCategory.id && 
        category.name.toLowerCase() === editCategory.name.trim().toLowerCase()
    );

    if (categoryExists) {
      setError('A category with this name already exists');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'categories', editCategory.id), {
        name: editCategory.name.trim(),
        order: editCategory.order, // Save the order if it was changed
        updatedAt: new Date()
      });
      
      // Reset edit mode and fetch updated categories
      setEditCategory(null);
      setError(null);
      await fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category. Please try again.');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? All related items will also be deleted.')) {
      return;
    }
    
    try {
      // First, delete all items in this category
      const itemsRef = collection(db, 'categories', categoryId, 'items');
      const itemsSnapshot = await getDocs(itemsRef);
      
      // Delete all items
      const deleteItemPromises = itemsSnapshot.docs.map(itemDoc => 
        deleteDoc(itemDoc.ref)
      );
      
      await Promise.all(deleteItemPromises);
      
      // Delete the category
      await deleteDoc(doc(db, 'categories', categoryId));
      
      // Refresh categories
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category. Please try again.');
    }
  };

  // Function to reorder all categories to fix any ordering issues
  const reorderAllCategories = async () => {
    if (!window.confirm('This will reset the order of all categories. Continue?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create an array of update promises
      const updatePromises = categories.map((category, index) => {
        return updateDoc(doc(db, 'categories', category.id), {
          order: index,
          updatedAt: new Date()
        });
      });
      
      // Execute all updates
      await Promise.all(updatePromises);
      
      // Refresh categories
      await fetchCategories();
      
      alert('All categories have been reordered successfully.');
    } catch (error) {
      console.error('Error reordering categories:', error);
      setError('Failed to reorder categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Find the index where the dragged item should be placed
  const findDropIndex = (y) => {
    const listItems = Array.from(listRef.current?.children || []);
    if (!listItems.length) return 0;

    // Skip the active item
    const filteredItems = listItems.filter(
      item => item !== itemRefs.current[activeItem?.id]
    );

    // Find the first item that's below the cursor position
    for (let i = 0; i < filteredItems.length; i++) {
      const rect = filteredItems[i].getBoundingClientRect();
      const itemMiddle = rect.top + rect.height / 2;
      if (y < itemMiddle) return i;
    }

    // If no item is below, place at the end
    return filteredItems.length;
  };

  // Setup touch event listeners once on mount
  useEffect(() => {
    // Setup passive handlers for move events
    const handleTouchMove = (e) => {
      if (!activeItem) return;
      
      const touch = e.touches[0];
      if (!touch) return;
      
      const pageY = touch.pageY;
      const newOffsetY = pageY - initialY;
      setOffsetY(newOffsetY);
    };
    
    const handleTouchEnd = async (e) => {
      if (!activeItem) return;
      
      const touch = e.changedTouches[0];
      if (!touch) {
        setActiveItem(null);
        setOffsetY(0);
        return;
      }
      
      const pageY = touch.pageY;
      
      // Find the index to drop at
      const dropIndex = findDropIndex(pageY);
      
      // Adjust index based on the start position
      let finalDropIndex = dropIndex;
      if (dropIndex > activeItem.startIndex) {
        finalDropIndex -= 1;
      }
      
      // Only reorder if the position changed
      if (finalDropIndex !== activeItem.startIndex) {
        try {
          // Make a copy of the categories array
          const newCategories = [...categories];
          
          // Remove the dragged item
          const [draggedItem] = newCategories.splice(activeItem.startIndex, 1);
          
          // Add it to the new position
          newCategories.splice(finalDropIndex, 0, draggedItem);
          
          // Update the state first for better UX
          setCategories(newCategories);
          
          // Reset active item and offset
          setActiveItem(null);
          setOffsetY(0);
          
          // Update Firestore with new order values
          const updatePromises = newCategories.map((category, index) => {
            return updateDoc(doc(db, 'categories', category.id), {
              order: index,
              updatedAt: new Date()
            });
          });
          
          // Execute all updates
          await Promise.all(updatePromises);
          
          // Refresh categories to ensure consistency
          await fetchCategories();
        } catch (error) {
          console.error('Error updating category order:', error);
          setError('Failed to update category order. Please try again.');
          setActiveItem(null);
          setOffsetY(0);
          // Refresh to restore original order
          await fetchCategories();
        }
      } else {
        // Reset if no change
        setActiveItem(null);
        setOffsetY(0);
      }
    };
    
    // Mouse events (still need these for desktop)
    const handleMouseMove = (e) => {
      if (!activeItem) return;
      const newOffsetY = e.pageY - initialY;
      setOffsetY(newOffsetY);
    };
    
    const handleMouseUp = async (e) => {
      if (!activeItem) return;
      
      // Find the index to drop at
      const dropIndex = findDropIndex(e.pageY);
      
      // Adjust index based on the start position
      let finalDropIndex = dropIndex;
      if (dropIndex > activeItem.startIndex) {
        finalDropIndex -= 1;
      }
      
      // Only reorder if the position changed
      if (finalDropIndex !== activeItem.startIndex) {
        try {
          // Make a copy of the categories array
          const newCategories = [...categories];
          
          // Remove the dragged item
          const [draggedItem] = newCategories.splice(activeItem.startIndex, 1);
          
          // Add it to the new position
          newCategories.splice(finalDropIndex, 0, draggedItem);
          
          // Update the state first for better UX
          setCategories(newCategories);
          
          // Reset active item and offset
          setActiveItem(null);
          setOffsetY(0);
          
          // Update Firestore with new order values
          const updatePromises = newCategories.map((category, index) => {
            return updateDoc(doc(db, 'categories', category.id), {
              order: index,
              updatedAt: new Date()
            });
          });
          
          // Execute all updates
          await Promise.all(updatePromises);
          
          // Refresh categories to ensure consistency
          await fetchCategories();
        } catch (error) {
          console.error('Error updating category order:', error);
          setError('Failed to update category order. Please try again.');
          // Refresh to restore original order
          await fetchCategories();
        }
      }
      
      // Reset state
      setActiveItem(null);
      setOffsetY(0);
    };
    
    // Add global listeners when component mounts
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Remove listeners when component unmounts
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeItem, initialY, categories]);

  // Start dragging (for both mouse and touch)
  const handleDragStart = (e, category, index) => {
    if (editCategory) return; // Don't allow dragging while editing
    
    // Track touch or mouse position
    let pageY;
    if (e.type === 'touchstart') {
      e.preventDefault(); // This is OK in touchstart (not passive by default)
      pageY = e.touches[0].pageY;
    } else {
      e.preventDefault();
      pageY = e.pageY;
    }
    
    setActiveItem({ ...category, startIndex: index });
    setInitialY(pageY);
    setOffsetY(0);
  };

  // Register a reference to a category list item
  const registerItemRef = (id, ref) => {
    if (ref) {
      itemRefs.current[id] = ref;
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-6">Manage Categories</h1>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="mb-6">
        <div className="flex items-center">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
          />
          <button
            type="submit"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add
          </button>
        </div>
      </form>
      
      {/* Categories List */}
      {loading ? (
        <div className="text-center py-4">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No categories found. Add your first category above.</div>
      ) : (
        <div className="mt-4">
          <h2 className="text-lg font-medium mb-2">Your Categories</h2>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop categories to reorder them. The order here will match what customers see.
          </p>
          
          {/* Reorder All Button */}
          <div className="mb-4">
            <button
              onClick={reorderAllCategories}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset Category Order
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Use this to fix ordering issues or reset to default order.
            </p>
          </div>
          
          <ul className="divide-y divide-gray-200" ref={listRef}>
            {categories.map((category, index) => (
              <li 
                key={category.id}
                ref={(ref) => registerItemRef(category.id, ref)}
                className={`py-4 flex items-center justify-between relative ${
                  activeItem?.id === category.id ? 'opacity-60 bg-gray-50 border border-indigo-200 z-10' : ''
                }`}
                style={activeItem?.id === category.id ? { 
                  transform: `translateY(${offsetY}px)`,
                  position: 'relative',
                  zIndex: 10,
                } : {}}
              >
                {editCategory && editCategory.id === category.id ? (
                  <form onSubmit={handleUpdateCategory} className="flex-1 flex items-center">
                    <input
                      type="text"
                      value={editCategory.name}
                      onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                    />
                    <button
                      type="submit"
                      className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditCategory(null)}
                      className="ml-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center">
                      <div 
                        className="mr-3 text-gray-400 cursor-move touch-none" 
                        onMouseDown={(e) => handleDragStart(e, category, index)}
                        onTouchStart={(e) => handleDragStart(e, category, index)}
                      >
                        {/* Drag handle icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>
                      <div className="mr-4">
                        <span className="text-gray-500">Position: {index + 1}</span>
                      </div>
                      <span className="text-gray-900">{category.name}</span>
                    </div>
                    <div>
                      <button
                        onClick={() => setEditCategory(category)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CategoryManager;