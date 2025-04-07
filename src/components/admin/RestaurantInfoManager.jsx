import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../firebase";
import { getAuth } from "firebase/auth";

function RestaurantInfoManager() {
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "Dream Flower Shop",
    description: "Flower Shop",
    address: "",
    phone: "010372037",
    phone2: "077808293",
    hours: "",
    logoUrl: "",
    facebook: "",
    telegram: "",
    instagram: "",
    googlemap: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    fetchRestaurantInfo();
  }, []);

  const fetchRestaurantInfo = async () => {
    setLoading(true);
    try {
      const infoDoc = await getDoc(doc(db, "settings", "restaurantInfo"));
      if (infoDoc.exists()) {
        const data = infoDoc.data();
        setRestaurantInfo({
          ...data,
          phone2: data.phone2 || "", // Ensure phone2 exists
        });
        setLogoPreview(data.logoUrl || null);
        setIsEditing(false); // Switch to view mode if info exists
      } else {
        setIsEditing(true); // Stay in edit mode if no info
      }
    } catch (error) {
      console.error("Error fetching restaurant info:", error);
      setError("Failed to load restaurant information. Please try again.");
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRestaurantInfo({
      ...restaurantInfo,
      [name]: value,
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);

      // Create logo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setLogoPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to upload logo
  const uploadLogo = async (file) => {
    if (!file) return restaurantInfo.logoUrl || "";

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("You must be logged in to upload images");
    }

    try {
      // File size validation (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File is too large. Maximum size is 2MB");
      }

      // File type validation
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Please upload JPEG, PNG, GIF, or WebP."
        );
      }

      // Create a secure file path
      const imageName = `restaurant/logo_${Date.now()}_${file.name.replace(
        /[^a-zA-Z0-9.]/g,
        "_"
      )}`;
      const storageRef = ref(storage, imageName);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Delete old logo if exists
      if (
        restaurantInfo.logoUrl &&
        restaurantInfo.logoUrl.includes("firebasestorage")
      ) {
        try {
          const oldLogoRef = ref(storage, restaurantInfo.logoUrl);
          await deleteObject(oldLogoRef);
        } catch (error) {
          console.error("Error deleting old logo:", error);
          // Continue with update even if deletion fails
        }
      }

      return downloadURL;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError(null);

    try {
      let logoUrl = restaurantInfo.logoUrl;

      // Upload logo if a new file is selected
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      // Prepare data to save
      const infoData = {
        ...restaurantInfo,
        logoUrl,
        updatedAt: new Date(),
      };

      // Check if document exists
      const infoDoc = await getDoc(doc(db, "settings", "restaurantInfo"));

      if (infoDoc.exists()) {
        // Update existing document
        await updateDoc(doc(db, "settings", "restaurantInfo"), infoData);
      } else {
        // Create new document
        infoData.createdAt = new Date();
        await setDoc(doc(db, "settings", "restaurantInfo"), infoData);
      }

      // Reset logo file state
      setLogoFile(null);

      // Fetch updated info and switch to view mode
      await fetchRestaurantInfo();
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving restaurant info:", error);
      setError("Failed to save restaurant information. " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Render view mode
  const renderViewMode = () => (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="relative bg-gray-100 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Restaurant Information
          </h1>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
        </div>

        {/* Information Display */}
        <div className="p-6 space-y-4">
          {/* Logo */}
          {restaurantInfo.logoUrl && (
            <div className="flex justify-center mb-4">
              <img
                src={restaurantInfo.logoUrl}
                alt="Restaurant Logo"
                className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
              />
            </div>
          )}
          {/* Address Display */}
          {restaurantInfo.address && (
            <div className="text-gray-700 mb-4">
              <p className="font-semibold">Address:</p>
              <p>{restaurantInfo.address}</p>
            </div>
          )}

          {/* Restaurant Details */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {restaurantInfo.name}
            </h2>

            {restaurantInfo.description && (
              <p className="text-gray-600 mb-2">{restaurantInfo.description}</p>
            )}

            {/* Contact Information */}
            <div className="space-y-2">
              {restaurantInfo.phone && (
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-500 mr-2"
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
                  <span>{restaurantInfo.phone}</span>
                </div>
              )}

              {restaurantInfo.phone2 && (
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-500 mr-2"
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
                  <span>{restaurantInfo.phone2}</span>
                </div>
              )}
            </div>

            {/* Social Media Links */}
            <div className="flex space-x-4 mt-4">
              {restaurantInfo.facebook && (
                <a
                  href={restaurantInfo.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg
                    className="h-6 w-6"
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
              {/* Instagram Display */}
              {restaurantInfo.instagram && (
                <div className="text-gray-700 mb-4">
                  <p className="font-semibold">Instagram:</p>
                  <a
                    href={restaurantInfo.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {restaurantInfo.instagram}
                  </a>
                </div>
              )}

              {/* Google Maps Display */}
              {restaurantInfo.googlemap && (
                <div className="text-gray-700 mb-4">
                  <p className="font-semibold">Google Maps:</p>
                  <a
                    href={restaurantInfo.googlemap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {restaurantInfo.googlemap}
                  </a>
                </div>
              )}

              {restaurantInfo.telegram && (
                <a
                  href={restaurantInfo.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.297c-.146.658-.537.818-1.084.51l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.548-.19 1.03.136.832.92z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render edit mode
  const renderEditMode = () => (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        {/* Blurred Background */}
        <div
          className="absolute top-0 left-0 right-0 h-32 opacity-20 blur-sm"
          style={{
            background:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)",
          }}
        ></div>

        {/* Header */}
        <div className="relative bg-gray-100 p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Edit Restaurant Information
          </h1>
        </div>

        {/* Form Container */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-4">
              Loading restaurant information...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Restaurant Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Restaurant Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={restaurantInfo.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={restaurantInfo.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Primary Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={restaurantInfo.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone2"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Secondary Phone
                  </label>
                  <input
                    type="text"
                    id="phone2"
                    name="phone2"
                    value={restaurantInfo.phone2}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="facebook"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Facebook
                  </label>
                  <input
                    type="text"
                    id="facebook"
                    name="facebook"
                    value={restaurantInfo.facebook}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                {/* Instagram Link */}
                <div>
                  <label
                    htmlFor="instagram"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Instagram
                  </label>
                  <input
                    type="text"
                    id="instagram"
                    name="instagram"
                    value={restaurantInfo.instagram}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Google Maps Link */}
                <div>
                  <label
                    htmlFor="googlemap"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Google Maps Link
                  </label>
                  <input
                    type="text"
                    id="googlemap"
                    name="googlemap"
                    value={restaurantInfo.googlemap}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telegram"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Telegram
                  </label>
                  <input
                    type="text"
                    id="telegram"
                    name="telegram"
                    value={restaurantInfo.telegram}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Logo
                </label>

                <div className="flex items-start">
                  {logoPreview && (
                    <div className="mr-4">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="h-24 w-24 object-cover rounded-full border border-gray-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/100?text=Logo";
                        }}
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended size: 400x400 pixels. Max file size: 2MB.
                    </p>
                  </div>
                </div>
              </div>
              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={restaurantInfo.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      saving ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  // Main render method
  return isEditing ? renderEditMode() : renderViewMode();
}

export default RestaurantInfoManager; // src/components/admin/RestaurantInfoManager.jsx
