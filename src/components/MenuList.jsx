import React, { useMemo } from 'react';
import MenuItem from './MenuItem';

const MenuList = ({ menuItems, activeCategory }) => {
  // Sort menu items by order property if available
  const sortedMenuItems = useMemo(() => {
    if (!menuItems || menuItems.length === 0) {
      return [];
    }

    // Check if we have order field to sort by
    const hasOrderField = menuItems.some(item => 
      typeof item.order === 'number'
    );

    if (hasOrderField) {
      // Return a new sorted array
      return [...menuItems].sort((a, b) => {
        // Handle items without order field by placing them at the end
        const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    }

    // If no order field, return original array
    return menuItems;
  }, [menuItems]);

  if (!menuItems || menuItems.length === 0) {
    return <div className="text-center py-4 text-gray-500">No menu items available</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {sortedMenuItems.map((item, index) => (
        <MenuItem 
          key={`${activeCategory}-${item.id}-${index}`} 
          item={item} 
        />
      ))}
    </div>
  );
};

export default MenuList;