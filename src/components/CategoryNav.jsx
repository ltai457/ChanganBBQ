// src/components/CategoryNav.jsx - Updated with Preahvihear font
import { useState } from 'react';

// Define a styles object for the font (placed outside the component)
const styles = {
  preahvihearFont: {
    fontFamily: "'Preahvihear', sans-serif"
  }
};

const CategoryNav = ({ activeCategory, setActiveCategory, categories = [] }) => {
  // Make sure categories are properly sorted by order
  const sortedCategories = [...categories].sort((a, b) => {
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
  
  return (
    <div className="mb-4">
      {/* Unified Horizontal Scrollable Navigation */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex space-x-3 pb-2 px-4">
          {sortedCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                flex-shrink-0 mt-3 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                border-2 border-red-600 
                ${activeCategory === category.id 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-black-600 hover:bg-red-50'}
              `}
              style={styles.preahvihearFont}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryNav;