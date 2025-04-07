// src/data/menuData.js

export const menuCategories = [
  { id: 'bbq', name: 'BBQ Specialties' },
  { id: 'starters', name: 'Appetizers' },
  { id: 'noodles', name: 'Noodles & Rice' },
  { id: 'sides', name: 'Side Dishes' },
  { id: 'desserts', name: 'Desserts' },
  { id: 'drinks', name: 'Beverages' }
];

export const menuItems = {
  bbq: [
    { 
      id: 101, 
      name: 'BBQ Pork Belly', 
      description: 'Tender slices of pork belly marinated in special spices, slow-roasted and served with dipping sauce', 
      price: 15.99, 
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 102, 
      name: 'Grilled Lamb Skewers', 
      description: 'Cumin-spiced lamb pieces grilled to perfection on bamboo skewers', 
      price: 16.99,
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 103, 
      name: 'Honey Glazed Char Siu', 
      description: 'Traditional Cantonese BBQ pork with sweet honey glaze, served with steamed rice', 
      price: 14.99, 
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 104, 
      name: 'BBQ Duck', 
      description: 'Half duck marinated in our special blend of spices, slow-roasted until crispy', 
      price: 19.99,
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 105, 
      name: 'Grilled Beef Short Ribs', 
      description: 'Tender beef short ribs marinated in soy and ginger, grilled to juicy perfection', 
      price: 18.99,
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 106, 
      name: 'BBQ Chicken Wings', 
      description: 'Spicy marinated chicken wings grilled with our signature sauce', 
      price: 12.99,
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 107, 
      name: 'BBQ Mixed Platter', 
      description: 'Selection of our best BBQ items including pork, duck, chicken and beef', 
      price: 24.99,
      imageUrl: '/images/Test.jpg'
    }
  ],
  starters: [
    { 
      id: 201, 
      name: 'Spring Rolls', 
      description: 'Crispy vegetable spring rolls served with sweet chili sauce', 
      price: 7.99, 
      dietary: ['vegetarian'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 202, 
      name: 'Steamed Dumplings', 
      description: 'Pork and chive dumplings steamed to perfection', 
      price: 8.99,
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 203, 
      name: 'Crispy Tofu', 
      description: 'Deep-fried tofu cubes with spicy salt and pepper', 
      price: 7.99, 
      dietary: ['vegetarian', 'vegan'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 204, 
      name: 'Cucumber Salad', 
      description: 'Fresh cucumber with garlic, vinegar and chili oil', 
      price: 6.99, 
      dietary: ['vegetarian', 'vegan', 'gluten-free'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 205, 
      name: 'Hot and Sour Soup', 
      description: 'Traditional spicy and sour soup with tofu, bamboo shoots, and wood ear mushrooms', 
      price: 5.99,
      imageUrl: '/images/Test.jpg'
    }
  ],
  noodles: [
    { 
      id: 301, 
      name: 'Dan Dan Noodles', 
      description: 'Spicy Sichuan noodles with minced pork, chili oil and Sichuan peppercorns', 
      price: 12.99, 
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 302, 
      name: 'Beef Noodle Soup', 
      description: 'Slow-cooked beef brisket with handmade noodles in savory broth', 
      price: 14.99,
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 303, 
      name: 'Vegetable Fried Rice', 
      description: 'Wok-fried rice with seasonal vegetables and egg', 
      price: 10.99, 
      dietary: ['vegetarian'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 304, 
      name: 'BBQ Pork Fried Rice', 
      description: 'Wok-fried rice with our signature BBQ pork and vegetables', 
      price: 12.99,
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 305, 
      name: 'Seafood Chow Mein', 
      description: 'Stir-fried noodles with shrimp, squid and seasonal vegetables', 
      price: 15.99,
      imageUrl: '/images/Test.jpg'
    }
  ],
  sides: [
    { 
      id: 401, 
      name: 'Garlic Bok Choy', 
      description: 'Stir-fried bok choy with garlic sauce', 
      price: 6.99, 
      dietary: ['vegetarian', 'vegan', 'gluten-free'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 402, 
      name: 'Spicy Green Beans', 
      description: 'Wok-fried green beans with spicy Sichuan sauce', 
      price: 7.99, 
      dietary: ['vegetarian', 'vegan'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 403, 
      name: 'Steamed Rice', 
      description: 'Bowl of fluffy steamed jasmine rice', 
      price: 2.99, 
      dietary: ['vegetarian', 'vegan', 'gluten-free'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 404, 
      name: 'Chinese Broccoli', 
      description: 'Steamed Chinese broccoli with oyster sauce', 
      price: 7.99,
      imageUrl: '/images/Test.jpg'
    }
  ],
  desserts: [
    { 
      id: 501, 
      name: 'Mango Pudding', 
      description: 'Creamy mango pudding topped with fresh fruit', 
      price: 5.99, 
      dietary: ['vegetarian'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 502, 
      name: 'Egg Tarts', 
      description: 'Traditional Chinese egg custard tarts with flaky pastry', 
      price: 4.99, 
      dietary: ['vegetarian'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 503, 
      name: 'Red Bean Soup', 
      description: 'Sweet red bean soup with lotus seeds', 
      price: 4.99, 
      dietary: ['vegetarian', 'vegan'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 504, 
      name: 'Sesame Balls', 
      description: 'Deep-fried glutinous rice balls with sweet red bean filling', 
      price: 5.99, 
      dietary: ['vegetarian'],
      imageUrl: '/images/Test.jpg'
    }
  ],
  drinks: [
    { 
      id: 601, 
      name: 'Chinese Tea', 
      description: 'Pot of traditional Chinese tea (jasmine, oolong or pu-erh)', 
      price: 3.99, 
      dietary: ['vegetarian', 'vegan', 'gluten-free'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 602, 
      name: 'Bubble Tea', 
      description: 'Milk tea with tapioca pearls, various flavors available', 
      price: 4.99, 
      dietary: ['vegetarian'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 603, 
      name: 'Fresh Juice', 
      description: 'Freshly squeezed orange, watermelon or apple juice', 
      price: 3.99, 
      dietary: ['vegetarian', 'vegan', 'gluten-free'],
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 604, 
      name: 'Tsingtao Beer', 
      description: 'Classic Chinese lager beer', 
      price: 5.99,
      imageUrl: '/images/Test.jpg'
    },
    { 
      id: 605, 
      name: 'Soda', 
      description: 'Assortment of soft drinks', 
      price: 2.99, 
      dietary: ['vegetarian', 'vegan', 'gluten-free'],
      imageUrl: '/images/Test.jpg'
    }
  ]
};

export const dietaryTagColors = {
  'vegetarian': 'bg-green-100 text-green-800',
  'vegan': 'bg-green-200 text-green-900',
  'gluten-free': 'bg-red-100 text-red-800'
};