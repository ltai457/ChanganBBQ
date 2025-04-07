// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

// Admin components
import CategoryManager from "../components/admin/CategoryManager";
import MenuItemManager from "../components/admin/MenuItemManager";
import RestaurantInfoManager from "../components/admin/RestaurantInfoManager"; // Import the new component
import PromotionalBannerManager from"../components/admin/PromotionalBannerManager"

function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div
        className={`md:flex md:flex-shrink-0 ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gray-800">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
              <h1 className="text-lg font-medium text-white">
                Restaurant Admin
              </h1>
            </div>

            {/* User Info Section */}
            {currentUser && (
              <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                <p>Logged in as:</p>
                <p className="font-medium text-white truncate">
                  {currentUser.email}
                </p>
              </div>
            )}

            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {/* Add Restaurant Info link */}
                <Link
                  to="/admin/dashboard/restaurant-info"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700"
                >
                  Restaurant Info
                </Link>
                <Link
                  to="/admin/dashboard/categories"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700"
                >
                  Categories
                </Link>
                <Link
                  to="/admin/dashboard/promotional-banner"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700"
                >
                  Promotional Banner
                </Link>

                <Link
                  to="/admin/dashboard/menu-items"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700"
                >
                  Menu Items
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700"
                >
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
          >
            <span className="sr-only">Open sidebar</span>
            {/* Menu icon */}
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-medium text-gray-900">
              Admin Dashboard
            </h1>
            {currentUser && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">Logged in as:</span>
                <span className="font-medium">{currentUser.email}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Routes>
                <Route
                  path="/"
                  element={
                    <div className="text-2xl font-semibold">
                      Welcome to the Admin Dashboard
                    </div>
                  }
                />
                {/* Add the new Restaurant Info route */}
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
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
