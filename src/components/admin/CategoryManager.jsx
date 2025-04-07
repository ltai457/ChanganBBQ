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
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

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

  // Drag and drop handlers
  const handleDragStart = (index) => {
    setDraggedItem(index);
  };

  const handleDragEnter = (index) => {
    setDragOverItem(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnd = async () => {
    if (draggedItem === null || dragOverItem === null || draggedItem === dragOverItem) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    try {
      // Update the UI immediately for better user experience
      const newCategories = [...categories];
      const draggedCategory = newCategories[draggedItem];
      // Remove the dragged item
      newCategories.splice(draggedItem, 1);
      // Insert at the new position
      newCategories.splice(dragOverItem, 0, draggedCategory);
      
      // Update the local state first for immediate feedback
      setCategories(newCategories);
      
      // Create an array of update promises with new order values
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
      // If there's an error, refresh to get the original order
      await fetchCategories();
    } finally {
      // Reset drag state
      setDraggedItem(null);
      setDragOverItem(null);
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
          
          <ul className="divide-y divide-gray-200">
            {categories.map((category, index) => (
              <li 
                key={category.id} 
                className={`py-4 flex items-center justify-between ${dragOverItem === index ? 'bg-gray-50 border-y border-indigo-200' : ''} ${draggedItem === index ? 'opacity-60' : ''}`}
                draggable={editCategory?.id !== category.id}
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
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
                    <div className="flex items-center cursor-move">
                      <div className="mr-3 text-gray-400">
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