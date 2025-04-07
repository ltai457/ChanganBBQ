import React from 'react';
import MenuItem from './MenuItem';

const MenuList = ({ menuItems, activeCategory }) => {
  if (!menuItems || menuItems.length === 0) {
    return <div className="text-center py-4 text-gray-500">No menu items available</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {menuItems.map((item, index) => (
        <MenuItem 
          key={`${activeCategory}-${item.id}-${index}`} 
          item={item} 
        />
      ))}
    </div>
  );
};

export default MenuList;
