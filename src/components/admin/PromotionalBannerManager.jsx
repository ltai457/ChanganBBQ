// src/components/admin/BannerImageManager.jsx
import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { db, storage } from "../../firebase";

function BannerImageManager() {
  const [bannerInfo, setBannerInfo] = useState({
    active: true,
    imageUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [storedBanners, setStoredBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(false);

  useEffect(() => {
    fetchBannerInfo();
    fetchAllBanners();
  }, []);

  const fetchBannerInfo = async () => {
    setLoading(true);
    try {
      const bannerDoc = await getDoc(doc(db, "settings", "bannerImage"));
      if (bannerDoc.exists()) {
        const data = bannerDoc.data();
        setBannerInfo(data);
        setImagePreview(data.imageUrl || null);
      } else {
        // Initialize with default empty values
        setBannerInfo({
          active: true,
          imageUrl: "",
        });
      }
    } catch (error) {
      console.error("Error fetching banner info:", error);
      setError("Failed to load banner image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch banners from both Firestore collection and Storage
  const fetchAllBanners = async () => {
    setLoadingBanners(true);
    setError(null);

    try {
      const banners = [];

      // 1. Try to get banners from Firestore first
      try {
        const bannersQuery = query(
          collection(db, "bannerImages"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(bannersQuery);
        querySnapshot.forEach((doc) => {
          banners.push({
            id: doc.id,
            ...doc.data(),
          });
        });
      } catch (firestoreError) {
        console.error("Error fetching from Firestore:", firestoreError);
      }

      // 2. Try to get banners directly from Storage
      try {
        // Get the current banner if it exists
        const bannerDoc = await getDoc(doc(db, "settings", "bannerImage"));
        if (bannerDoc.exists() && bannerDoc.data().imageUrl) {
          const currentUrl = bannerDoc.data().imageUrl;

          // Check if this banner is already in our list
          if (!banners.some((b) => b.url === currentUrl)) {
            banners.push({
              name: "Current Banner",
              url: currentUrl,
              isCurrentBanner: true,
            });
          }
        }

        // Try to get specific files we know exist
        const knownBanners = [
          "banner_1744985505118_logo.png",
          "banner_1744986464091_65479f3d_9488_4a4e_89d8_645e04d95db2.jpeg",
          "banner_1745379543528_65479f3d_9488_4a4e_89d8_645e04d95db2.jpeg",
        ];

        for (const filename of knownBanners) {
          try {
            const imgRef = ref(storage, `banners/${filename}`);
            const url = await getDownloadURL(imgRef);

            // Check if this URL is already in our list
            if (!banners.some((b) => b.url === url)) {
              banners.push({
                name: filename,
                path: `banners/${filename}`,
                url: url,
              });

              // Save to Firestore collection for future use
              try {
                await addDoc(collection(db, "bannerImages"), {
                  name: filename,
                  path: `banners/${filename}`,
                  url: url,
                  createdAt: new Date(),
                });
              } catch (addError) {
                console.log("Error saving banner reference:", addError);
                // Continue even if saving reference fails
              }
            }
          } catch (storageError) {
            console.log(`Could not access ${filename}:`, storageError);
          }
        }

        // Try to list all files in banners folder
        try {
          const bannersRef = ref(storage, "banners/");
          const result = await listAll(bannersRef);

          for (const item of result.items) {
            try {
              const url = await getDownloadURL(item);

              // Check if this URL is already in our list
              if (!banners.some((b) => b.url === url)) {
                banners.push({
                  name: item.name,
                  path: item.fullPath,
                  url: url,
                });

                // Save to Firestore collection for future use
                try {
                  await addDoc(collection(db, "bannerImages"), {
                    name: item.name,
                    path: item.fullPath,
                    url: url,
                    createdAt: new Date(),
                  });
                } catch (addError) {
                  console.log("Error saving banner reference:", addError);
                }
              }
            } catch (urlError) {
              console.log(`Could not get URL for ${item.name}:`, urlError);
            }
          }
        } catch (listError) {
          console.log("Error listing all banners:", listError);
        }
      } catch (storageError) {
        console.error("Error accessing Storage:", storageError);
      }

      setStoredBanners(banners);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoadingBanners(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, checked } = e.target;
    setBannerInfo({
      ...bannerInfo,
      [name]: checked,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectBanner = (imageUrl) => {
    setBannerInfo({
      ...bannerInfo,
      imageUrl,
    });
    setImagePreview(imageUrl);
    setImageFile(null);
  };

  // Function to upload banner image
  const uploadImage = async (file) => {
    if (!file) return bannerInfo.imageUrl || "";

    try {
      // File size validation (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File is too large. Maximum size is 5MB");
      }

      // File type validation
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Please upload JPEG, PNG, GIF, or WebP."
        );
      }

      // Create a secure file path
      const imageName = `banners/banner_${Date.now()}_${file.name.replace(
        /[^a-zA-Z0-9.]/g,
        "_"
      )}`;
      const storageRef = ref(storage, imageName);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Add to bannerImages collection
      await addDoc(collection(db, "bannerImages"), {
        name: file.name,
        path: imageName,
        url: downloadURL,
        createdAt: new Date(),
      });

      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile && !bannerInfo.imageUrl) {
      setError(
        "Please select an image to upload or choose from existing images"
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let imageUrl = bannerInfo.imageUrl;

      // Upload image if a new file is selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Prepare data to save
      const bannerData = {
        active: bannerInfo.active,
        imageUrl,
        updatedAt: new Date(),
      };

      // Check if document exists
      const bannerDoc = await getDoc(doc(db, "settings", "bannerImage"));

      if (bannerDoc.exists()) {
        // Update existing document
        await updateDoc(doc(db, "settings", "bannerImage"), bannerData);
      } else {
        // Create new document
        bannerData.createdAt = new Date();
        await setDoc(doc(db, "settings", "bannerImage"), bannerData);
      }

      alert("Banner image saved successfully!");

      // Reset image file state
      setImageFile(null);

      // Fetch updated info
      await fetchBannerInfo();
      await fetchAllBanners();
    } catch (error) {
      console.error("Error saving banner image:", error);
      setError("Failed to save banner image. " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeActiveBanner = async () => {
    if (
      !window.confirm(
        "Are you sure you want to remove the current banner image?"
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      // Update document to inactive state
      await updateDoc(doc(db, "settings", "bannerImage"), {
        active: false,
        imageUrl: "",
        updatedAt: new Date(),
      });

      alert("Banner removed successfully!");

      // Reset states
      setImageFile(null);
      setImagePreview(null);

      // Fetch updated info
      await fetchBannerInfo();
    } catch (error) {
      console.error("Error removing banner:", error);
      setError("Failed to remove banner image. " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (banner) => {
    if (
      !window.confirm(`Are you sure you want to permanently delete this image?`)
    ) {
      return;
    }

    setSaving(true);
    try {
      // Delete from storage if we have a path
      if (banner.path) {
        try {
          const imageRef = ref(storage, banner.path);
          await deleteObject(imageRef);
        } catch (error) {
          console.error("Error deleting image from storage:", error);
          // Continue even if storage deletion fails
        }
      }

      // Delete from Firestore collection if we have an ID
      if (banner.id) {
        await deleteDoc(doc(db, "bannerImages", banner.id));
      }

      // If it was the active banner, reset it
      if (bannerInfo.imageUrl === banner.url) {
        await updateDoc(doc(db, "settings", "bannerImage"), {
          active: false,
          imageUrl: "",
          updatedAt: new Date(),
        });

        setImagePreview(null);
      }

      // Remove from local state
      setStoredBanners(storedBanners.filter((b) => b.url !== banner.url));

      alert("Image deleted successfully!");

      // Refresh data
      await fetchBannerInfo();
    } catch (error) {
      console.error("Error deleting banner:", error);
      setError("Failed to delete image. " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Function to refresh the banner list
  const refreshBanners = () => {
    fetchAllBanners();
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-6">Banner Image</h1>

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
        <div className="text-center py-4">Loading banner information...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={bannerInfo.active}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="active"
              className="ml-2 block text-sm font-medium text-gray-700"
            >
              Show banner image
            </label>
          </div>

          {/* Banner Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Image
            </label>

            <div className="flex flex-col space-y-4">
              {imagePreview && (
                <div>
                  <img
                    src={imagePreview}
                    alt="Banner Preview"
                    className="w-full h-40 object-cover rounded-md border border-gray-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://via.placeholder.com/1200x300?text=Banner+Image";
                    }}
                  />
                </div>
              )}

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommended size: 1200x300 pixels. Max file size: 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Previously Uploaded Images */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Available Images
              </h3>
              <button
                type="button"
                onClick={refreshBanners}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Refresh
              </button>
            </div>

            {loadingBanners ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-sm text-gray-500">Loading images...</p>
              </div>
            ) : storedBanners.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border rounded-md p-3">
                {storedBanners.map((banner, index) => (
                  <div
                    key={banner.id || `banner-${index}`}
                    className={`relative group rounded-md border ${
                      banner.url === bannerInfo.imageUrl
                        ? "border-indigo-500 ring-2 ring-indigo-500"
                        : "border-gray-300"
                    } hover:border-indigo-500`}
                  >
                    {/* Fixed aspect ratio container */}
                    <div
                      className="cursor-pointer aspect-[3/1] w-full relative overflow-hidden"
                      onClick={() => selectBanner(banner.url)}
                    >
                      <img
                        src={banner.url}
                        alt={banner.name || `Banner ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/300x100?text=Error";
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white py-1 px-2">
                        <div className="text-xs truncate">
                          {banner.url === bannerInfo.imageUrl
                            ? "✓ Current"
                            : `Banner ${index + 1}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteBanner(banner)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <p className="text-sm text-gray-500">No images available.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-5 flex justify-end space-x-3">
            {bannerInfo.imageUrl && (
              <button
                type="button"
                onClick={removeActiveBanner}
                className="bg-red-50 text-red-600 py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove Banner
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                saving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Saving..." : "Save Banner"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default BannerImageManager;
