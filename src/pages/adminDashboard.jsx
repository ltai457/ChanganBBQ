// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

// Admin components
import CategoryManager from "../components/admin/CategoryManager";
import MenuItemManager from "../components/admin/MenuItemManager";
import RestaurantInfoManager from "../components/admin/RestaurantInfoManager";
import PromotionalBannerManager from "../components/admin/PromotionalBannerManager";

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRoute, setActiveRoute] = useState("/");
  
  // Bottom navigation visibility control for mobile
  const [showNav, setShowNav] = useState(true);
  
  useEffect(() => {
    // Get current user when component mounts
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        // If no user is logged in, redirect to login page
        navigate("/admin");
      }
    });

    // Clean up subscription
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Track current route for active nav highlighting
    setActiveRoute(location.pathname);
  }, [location]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(auth);
        navigate("/admin");
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  // Get page title based on current route
  const getPageTitle = () => {
    if (location.pathname.includes("restaurant-info")) {
      return "Restaurant Info";
    } else if (location.pathname.includes("categories")) {
      return "Categories";
    } else if (location.pathname.includes("promotional-banner")) {
      return "Promotional Banner";
    } else if (location.pathname.includes("menu-items")) {
      return "Menu Items";
    } else {
      return "Dashboard";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* App Header */}
      <header className="bg-indigo-600 text-white shadow-md z-10">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          
          <div className="flex items-center space-x-2">
            {/* User Avatar */}
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500 hover:bg-indigo-400 transition-colors"
              aria-label="User menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="px-4 py-4 max-w-4xl mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Admin Dashboard</h2>
                  
                  {/* Dashboard Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/admin/dashboard/restaurant-info" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-indigo-500 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="font-medium">Restaurant Info</div>
                    </Link>
                    
                    <Link to="/admin/dashboard/categories" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-indigo-500 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="font-medium">Categories</div>
                    </Link>
                    
                    <Link to="/admin/dashboard/promotional-banner" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-indigo-500 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="font-medium">Promotional Banner</div>
                    </Link>
                    
                    <Link to="/admin/dashboard/menu-items" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-indigo-500 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="font-medium">Menu Items</div>
                    </Link>
                  </div>
                  
                  {/* User Info Card */}
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Logged in as:</div>
                        <div className="font-medium truncate">{currentUser?.email}</div>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                </div>
              }
            />
            <Route
              path="/restaurant-info"
              element={<RestaurantInfoManager />}
            />
            <Route
              path="/promotional-banner"
              element={<PromotionalBannerManager />}
            />
            <Route path="/categories" element={<CategoryManager />} />
            <Route path="/menu-items" element={<MenuItemManager />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-10">
        <Link 
          to="/admin/dashboard" 
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeRoute === "/admin/dashboard" ? "text-indigo-600" : "text-gray-500"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link 
          to="/admin/dashboard/restaurant-info" 
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeRoute.includes("restaurant-info") ? "text-indigo-600" : "text-gray-500"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs mt-1">Info</span>
        </Link>
        
        <Link 
          to="/admin/dashboard/categories" 
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeRoute.includes("categories") ? "text-indigo-600" : "text-gray-500"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs mt-1">Categories</span>
        </Link>
        
        <Link 
          to="/admin/dashboard/menu-items" 
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeRoute.includes("menu-items") ? "text-indigo-600" : "text-gray-500"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-xs mt-1">Menu</span>
        </Link>
      </nav>
    </div>
  );
}

export default AdminDashboard;