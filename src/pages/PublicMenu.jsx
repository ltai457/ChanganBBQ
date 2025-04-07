// src/pages/PublicMenu.jsx - Fixed hook implementation
import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase"; // Adjust the import path as needed
import CategoryNav from "../components/CategoryNav";
import MenuList from "../components/MenuList";
import MenuItem from "../components/MenuItem"; // Add this import

// Define styles object outside the component
const styles = {
  preahvihearFont: {
    fontFamily: "'Preahvihear', sans-serif",
    fontWeight: 800,
    fontStyle: "bold",
  },
  winkySansFont: {
    fontFamily: "'Winky Sans', sans-serif",
  },
};

const PublicMenu = () => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [displayedMenuItems, setDisplayedMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [bannerImage, setBannerImage] = useState({
    active: false,
    imageUrl: "",
  });

  // Refs for tracking category sections and scroll
  const categorySectionsRef = useRef({});
  const categoryNavRef = useRef(null);

  // Load the font
  useEffect(() => {
    // Add the font import directly to the head
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Preahvihear&display=swap";
    document.head.appendChild(link);

    // Clean up on component unmount
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Detect visible category on scroll
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY;

    // Find the category section currently in view
    const visibleCategory = Object.keys(categorySectionsRef.current).find(
      (categoryId) => {
        const section = categorySectionsRef.current[categoryId];
        if (!section) return false;

        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const navHeight = categoryNavRef.current
          ? categoryNavRef.current.offsetHeight
          : 0;

        return (
          scrollPosition >= sectionTop - navHeight - 100 &&
          scrollPosition < sectionTop + sectionHeight - navHeight - 100
        );
      }
    );

    // Update active category if a new section is visible
    if (visibleCategory && visibleCategory !== activeCategory) {
      setActiveCategory(visibleCategory);
    }
  }, [activeCategory]);

  // Fetch restaurant information
  const fetchRestaurantInfo = async () => {
    try {
      const infoDoc = await getDoc(doc(db, "settings", "restaurantInfo"));
      if (infoDoc.exists()) {
        setRestaurantInfo(infoDoc.data());
      } else {
        setRestaurantInfo({
          name: "ChanganBBq",
          description: "",
          address: "16 Oriana Avenue",
          phone: "0272789046",
          phone2: "",
          logoUrl: "/logo.png",
        });
      }
    } catch (error) {
      console.error("Error fetching restaurant info:", error);
    }
  };

  // Fetch banner image
  const fetchBannerImage = async () => {
    try {
      const bannerDoc = await getDoc(doc(db, "settings", "bannerImage"));
      if (bannerDoc.exists()) {
        const data = bannerDoc.data();
        setBannerImage({
          active: data.active && data.imageUrl ? true : false,
          imageUrl: data.imageUrl || "",
        });
      }
    } catch (error) {
      console.error("Error fetching banner image:", error);
    }
  };

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    try {
      const q = query(collection(db, "categories"), orderBy("order", "asc"));
      const categoriesSnapshot = await getDocs(q);

      const categoriesList = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCategories(categoriesList);

      // Set the first category as active if categories exist
      if (categoriesList.length > 0) {
        setActiveCategory(categoriesList[0].id);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch all menu items across all categories
  const fetchAllMenuItems = async () => {
    try {
      setLoading(true);
      const allItems = [];

      for (const category of categories) {
        const itemsRef = collection(db, "categories", category.id, "items");
        const itemsSnapshot = await getDocs(itemsRef);

        const categoryItems = itemsSnapshot.docs.map((doc) => ({
          id: doc.id,
          categoryId: category.id,
          categoryName: category.name,
          ...doc.data(),
        }));

        allItems.push(...categoryItems);
      }

      setAllMenuItems(allItems);
      setDisplayedMenuItems(allItems);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching all menu items:", error);
      setLoading(false);
    }
  };

  // Search function
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setDisplayedMenuItems(allMenuItems);
      return;
    }

    const normalizedSearchTerm = value.toLowerCase();
    const results = allMenuItems.filter((item) => {
      const nameMatch =
        (item.name && item.name.toLowerCase().includes(normalizedSearchTerm)) ||
        (item.nameEn &&
          item.nameEn.toLowerCase().includes(normalizedSearchTerm)) ||
        (item.nameCn &&
          item.nameCn.toLowerCase().includes(normalizedSearchTerm));

      const descMatch =
        (item.description &&
          item.description.toLowerCase().includes(normalizedSearchTerm)) ||
        (item.descriptionEn &&
          item.descriptionEn.toLowerCase().includes(normalizedSearchTerm)) ||
        (item.descriptionCn &&
          item.descriptionCn.toLowerCase().includes(normalizedSearchTerm));

      return nameMatch || descMatch;
    });

    setDisplayedMenuItems(results);
  };

  // Toggle restaurant info modal
  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchTerm("");

    // Scroll to the selected category section
    const categorySection = categorySectionsRef.current[categoryId];
    if (categorySection) {
      const navHeight = categoryNavRef.current
        ? categoryNavRef.current.offsetHeight
        : 0;
      window.scrollTo({
        top: categorySection.offsetTop - navHeight - 20,
        behavior: "smooth",
      });
    }
  };

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Fetch initial data
  useEffect(() => {
    fetchRestaurantInfo();
    fetchBannerImage();
    fetchCategories();
  }, []);

  // Fetch all menu items when categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      fetchAllMenuItems();
    }
  }, [categories]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with Logo and Name on same line */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="flex flex-row items-center cursor-pointer mb-4"
          onClick={toggleInfo}
        >
          {restaurantInfo?.logoUrl && (
            <img
              src={restaurantInfo.logoUrl}
              alt={restaurantInfo.name}
              className="h-12 w-12 rounded-lg object-cover shadow-md mr-3"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/logo.png"; // Fallback
              }}
            />
          )}
          <h1 className="text-l font-extrabold" style={styles.preahvihearFont}>
            {restaurantInfo?.name || "Restaurant Menu"}
          </h1>
        </div>

        {/* Banner Image */}
        {bannerImage.active && bannerImage.imageUrl && (
          <div className="mb-8">
            <img
              src={bannerImage.imageUrl}
              alt="Banner"
              className="w-full h-auto rounded-lg shadow-md"
              onError={(e) => {
                console.log(
                  "Banner image failed to load:",
                  bannerImage.imageUrl
                );
                setBannerImage({ ...bannerImage, active: false });
              }}
            />
          </div>
        )}
        {/* Search box */}
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search menu in any language..."
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setDisplayedMenuItems(allMenuItems);
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <svg
                className="w-4 h-4 text-gray-500 hover:text-gray-700"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 12 12M1 13 13 1"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Menu content */}
      <div className={showInfo ? "blur-sm" : ""}>
        {/* Category Navigation - Always Sticky */}
        {!searchTerm && (
          <div
            ref={categoryNavRef}
            className="sticky top-0 z-50 bg-white shadow-sm"
          >
            <CategoryNav
              activeCategory={activeCategory}
              setActiveCategory={handleCategoryChange}
              categories={categories}
            />
          </div>
        )}

        {/* Search results info */}
        {searchTerm && (
          <div className="mb-4 px-2 py-2 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-600">
              {displayedMenuItems.length === 0
                ? "No results found for your search"
                : `Found ${displayedMenuItems.length} ${
                    displayedMenuItems.length === 1 ? "item" : "items"
                  } for "${searchTerm}"`}
            </p>
          </div>
        )}

        {/* Menu Categories or Search Results */}
        {loading ? (
          <div className="text-center py-4">Loading menu items...</div>
        ) : (
          <div className="space-y-8">
            {!searchTerm ? (
              // Regular category display - when not searching
              categories.map((category) => (
                <div
                  key={category.id}
                  id={category.id}
                  ref={(el) => {
                    if (el) {
                      categorySectionsRef.current[category.id] = el;
                    }
                  }}
                  className="relative"
                >
                  {/* Category Title - Absolutely positioned to overlay precisely */}
                  <div className="absolute top-0 left-0 right-0 z-40">
                    <h2
                      className="text-2xl font-bold px-2 bg-white py-2 border-b border-gray-200"
                      style={styles.preahvihearFont}
                    >
                      {category.name}
                    </h2>
                  </div>

                  {/* Adjust MenuList to account for title height */}
                  <div className="pt-12">
                    <MenuList
                      menuItems={displayedMenuItems.filter(
                        (item) => item.categoryId === category.id
                      )}
                      activeCategory={category.id}
                    />
                  </div>
                </div>
              ))
            ) : (
              // Search results display - using the same MenuList component
              <div>
                <div className="relative">
                  <div className="absolute top-0 left-0 right-0 z-40">
                    <h2
                      className="text-2xl font-bold px-2 bg-white py-2 border-b border-gray-200"
                      style={styles.preahvihearFont}
                    >
                      Search Results
                    </h2>
                  </div>

                  {/* Use the same MenuList component for consistency */}
                  <div className="pt-12">
                    <MenuList
                      menuItems={displayedMenuItems}
                      activeCategory="search-results"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Restaurant Info Modal */}
      {showInfo && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center backdrop-blur-sm bg-white/30"
          onClick={toggleInfo}
        >
          <div
            className="w-full max-w-md mx-4 bg-white rounded-lg shadow-lg overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Blurred Background */}
            <div
              className="absolute top-0 left-0 right-0 bottom-0 opacity-20 blur-sm"
              style={{
                background:
                  "repeating-linear-gradient(45deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)",
              }}
            ></div>

            {/* Close Button */}
            <button
              onClick={toggleInfo}
              className="absolute top-4 right-4 z-20 text-gray-600 hover:text-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Content Container - Increased top padding to make room for logo */}
            <div className="relative z-10 pt-40 px-6 pb-6">
              {/* Logo Overlay - Updated to fix overlapping */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-32 flex items-center justify-center">
                {restaurantInfo?.logoUrl ? (
                  <img
                    src={restaurantInfo.logoUrl}
                    alt={restaurantInfo.name}
                    className="h-28 w-28 object-contain bg-white p-1 rounded-lg shadow-md"
                  />
                ) : (
                  <div className="text-center">
                    <span className="text-sm font-bold text-gray-800">
                      {restaurantInfo?.name || "Restaurant"}
                    </span>
                  </div>
                )}
              </div>

              {/* Shop Information */}
              <div className="text-center mt-2">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={styles.preahvihearFont}
                >
                  {restaurantInfo?.name}
                </h2>
                <p
                  className="text-gray-600 mb-4"
                  style={styles.preahvihearFont}
                >
                  {restaurantInfo?.description || ""}
                </p>

                {/* Business Numbers */}
                {(restaurantInfo?.phone || restaurantInfo?.phone2) && (
                  <div className="text-gray-700 mb-4">
                    <p style={styles.preahvihearFont}>Phone:</p>
                    <p className="font-semibold" style={styles.preahvihearFont}>
                      {restaurantInfo?.phone}
                      {restaurantInfo?.phone2 && ` / ${restaurantInfo.phone2}`}
                    </p>
                  </div>
                )}

                {/* Address if available */}
                {restaurantInfo?.address && (
                  <div className="text-gray-700 mb-4">
                    <p style={styles.preahvihearFont}>Address:</p>
                    <p className="font-semibold" style={styles.preahvihearFont}>
                      {restaurantInfo.address}
                    </p>
                  </div>
                )}

                {/* Social Media Links */}
                <div className="flex justify-center space-x-4 mt-6">
                  {restaurantInfo?.facebook && (
                    <a
                      href={restaurantInfo.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg
                        className="h-8 w-8"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  )}

                  {restaurantInfo?.telegram && (
                    <a
                      href={restaurantInfo.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <svg
                        className="h-8 w-8"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.297c-.146.658-.537.818-1.084.51l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.548-.19 1.03.136.832.92z" />
                      </svg>
                    </a>
                  )}

                  {restaurantInfo?.instagram && (
                    <a
                      href={restaurantInfo.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <svg
                        className="h-8 w-8"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zM12 7a5 5 0 100 10 5 5 0 000-10zm4.5-2a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                      </svg>
                    </a>
                  )}

                  {restaurantInfo?.googlemap && (
                    <a
                      href={restaurantInfo.googlemap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800"
                    >
                      <svg
                        className="h-8 w-8"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
                      </svg>
                    </a>
                  )}

                  {restaurantInfo?.phone && (
                    <a
                      href={`tel:${restaurantInfo.phone}`}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;
