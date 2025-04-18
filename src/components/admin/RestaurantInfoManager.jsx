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
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Restaurant Information
        </h1>
        <button
          onClick={() => setIsEditing(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Information Display */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Logo */}
        {restaurantInfo.logoUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={restaurantInfo.logoUrl}
              alt="Restaurant Logo"
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-gray-200"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/100?text=Logo";
              }}
            />
          </div>
        )}

        {/* Restaurant Details */}
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            {restaurantInfo.name}
          </h2>
          {restaurantInfo.description && (
            <p className="text-gray-600">{restaurantInfo.description}</p>
          )}
        </div>

        {/* Address Display */}
        {restaurantInfo.address && (
          <div className="border-t pt-4 border-gray-100">
            <p className="font-semibold text-gray-700">Address:</p>
            <p className="text-gray-600">{restaurantInfo.address}</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="border-t pt-4 border-gray-100">
          <p className="font-semibold text-gray-700 mb-2">Contact:</p>
          <div className="space-y-2">
            {restaurantInfo.phone && (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
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
                <a
                  href={`tel:${restaurantInfo.phone}`}
                  className="text-gray-600 hover:text-blue-500"
                >
                  {restaurantInfo.phone}
                </a>
              </div>
            )}

            {restaurantInfo.phone2 && (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
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
                <a
                  href={`tel:${restaurantInfo.phone2}`}
                  className="text-gray-600 hover:text-blue-500"
                >
                  {restaurantInfo.phone2}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Social Media Links */}
        <div className="border-t pt-4 border-gray-100">
          <p className="font-semibold text-gray-700 mb-2">Follow Us:</p>
          <div className="flex flex-wrap gap-4">
            {restaurantInfo.facebook && (
              <a
                href={restaurantInfo.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 mr-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">Facebook</span>
              </a>
            )}

            {restaurantInfo.instagram && (
              <a
                href={restaurantInfo.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-pink-600 hover:text-pink-800"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 mr-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">Instagram</span>
              </a>
            )}

            {restaurantInfo.telegram && (
              <a
                href={restaurantInfo.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-500 hover:text-blue-700"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 mr-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.297c-.146.658-.537.818-1.084.51l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.548-.19 1.03.136.832.92z" />
                </svg>
                <span className="text-sm">Telegram</span>
              </a>
            )}
          </div>
        </div>

        {/* Google Maps Link */}
        {restaurantInfo.googlemap && (
          <div className="border-t pt-4 border-gray-100">
            <p className="font-semibold text-gray-700 mb-2">Location:</p>
            <a
              href={restaurantInfo.googlemap}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-500 hover:text-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>View on Google Maps</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );

  // Render edit mode
  const renderEditMode = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 p-4 sm:p-6 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Edit Restaurant Information
        </h1>
      </div>

      {/* Form Container */}
      <div className="p-4 sm:p-6">
        {/* Error Message */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block text-sm">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2">Loading restaurant information...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
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

            {/* Phone Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Logo
              </label>

              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {logoPreview && (
                  <div className="self-center sm:self-auto">
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
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended size: 400x400 pixels. Max file size: 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Social Media & Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-5">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // Main render method
  return (
    <div className="max-w-lg mx-auto p-4">
      {isEditing ? renderEditMode() : renderViewMode()}
    </div>
  );
}

export default RestaurantInfoManager;
