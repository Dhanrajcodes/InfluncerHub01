// frontend/src/pages/InfluencerProfile.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../useAuth";
import toast from "react-hot-toast";
import { FaInstagram, FaYoutube, FaTwitter, FaLink, FaMapMarkerAlt, FaTiktok } from 'react-icons/fa';

interface ProfileFormValues {
  handle: string;
  bio: string;
  categories: string[];
  followerCount: number;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  other?: string;
  location?: string;
  avatarUrl?: string;
  portfolio?: string[];
  tags?: string[];
  averageEngagementRate?: number;
  pricing?: {
    post?: number;
    reel?: number;
    story?: number;
  };
}

const InfluencerProfile: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: { categories: [], portfolio: [], tags: [], pricing: {} },
  });

  const [categoryInput, setCategoryInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [initialProfileData, setInitialProfileData] = useState<ProfileFormValues | null>(null);

  // Check user role and redirect if not an influencer
  useEffect(() => {
    if (user && user.role !== 'influencer') {
      navigate('/dashboard');
      toast.error('Access denied. Only influencers can access this page.');
    }
  }, [user, navigate]);

  // Memoized functions to prevent unnecessary re-renders
  const addCategory = useCallback(() => {
    const trimmed = categoryInput.trim();
    if (trimmed) {
      const currentCategories = getValues("categories") || [];
      if (!currentCategories.includes(trimmed)) {
        setValue("categories", [...currentCategories, trimmed]);
        setCategoryInput("");
      }
    }
  }, [categoryInput, getValues, setValue]);

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed) {
      const currentTags = getValues("tags") || [];
      if (!currentTags.includes(trimmed)) {
        setValue("tags", [...currentTags, trimmed]);
        setTagInput("");
      }
    }
  }, [tagInput, getValues, setValue]);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.msg || `Failed to upload avatar: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setValue("avatarUrl", data.url);
      setAvatarPreview(data.url);
      toast.success("Avatar uploaded successfully!");
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast.error(err.message || "Could not upload avatar");
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  }, [token, setValue]);

  const handlePortfolioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("image", files[i]);

        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.msg || `Failed to upload image ${i + 1}: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        urls.push(data.url);
      }

      const currentPortfolio = getValues("portfolio") || [];
      setValue("portfolio", [...currentPortfolio, ...urls]);
      toast.success(`${files.length} image(s) uploaded successfully!`);
    } catch (err: any) {
      console.error("Portfolio upload error:", err);
      toast.error(err.message || "Could not upload portfolio images");
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  }, [token, getValues, setValue]);

  const removeImage = useCallback((index: number) => {
    const currentPortfolio = getValues("portfolio") || [];
    const newPortfolio = currentPortfolio.filter((_, i) => i !== index);
    setValue("portfolio", newPortfolio);
  }, [getValues, setValue]);

  const removeCategory = useCallback((categoryToRemove: string) => {
    const currentCategories = getValues("categories") || [];
    setValue("categories", currentCategories.filter((cat) => cat !== categoryToRemove));
  }, [getValues, setValue]);

  const removeTag = useCallback((tagToRemove: string) => {
    const currentTags = getValues("tags") || [];
    setValue("tags", currentTags.filter((tag) => tag !== tagToRemove));
  }, [getValues, setValue]);

  const handleCancel = useCallback(() => {
    if (initialProfileData) {
      reset(initialProfileData);
      setAvatarPreview(initialProfileData.avatarUrl || null);
    }
    setIsEditMode(false);
  }, [initialProfileData, reset]);

  // Format currency
  const currencySymbol = () => "₹";

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "N/A";
    const v = Number(value);
    const formatted = Number.isInteger(v) ? v.toString() : v.toFixed(2);
    return `${currencySymbol()}${formatted}`;
  };

  // Fetch current influencer profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || user?.role !== 'influencer') {
        navigate('/login');
        return;
      }
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/influencers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) {
          setIsEditMode(true);
          setProfileExists(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load profile");

        const data = await res.json();
        // backend returns fields as in model; map for form defaults
        const profileData: ProfileFormValues = {
          handle: data.handle || "",
          bio: data.bio || "",
          categories: data.categories?.map((cat: any) => {
            // If cat is an object with a name, return the name
            if (typeof cat === 'object' && cat.name) {
              return cat.name;
            }
            // If cat is an object with _id, return the _id
            if (typeof cat === 'object' && cat._id) {
              return cat._id;
            }
            // Otherwise, return cat as is (assuming it's a string)
            return cat;
          }) || [],
          followerCount: data.followerCount || 0,
          instagram: data.socialLinks?.instagram || "",
          youtube: data.socialLinks?.youtube || "",
          twitter: data.socialLinks?.twitter || "",
          tiktok: data.socialLinks?.tiktok || "",
          other: data.socialLinks?.other || "",
          location: data.location || "",
          avatarUrl: data.avatarUrl || "",
          portfolio: data.portfolio || [],
          tags: data.tags || [],
          averageEngagementRate: data.averageEngagementRate || 0,
          pricing: {
            post: data.pricing?.post,
            reel: data.pricing?.reel,
            story: data.pricing?.story,
          },
        };

        reset(profileData);
        setInitialProfileData(profileData);
        setIsEditMode(false);
        setProfileExists(true);
        setAvatarPreview(data.avatarUrl || null);
      } catch (err: any) {
        toast.error(err.message || "Could not fetch profile");
      }
    };

    if (user?.role === 'influencer') {
      fetchProfile();
    }
  }, [token, reset, navigate, user?.role]);

  // Handle form submission
  const onSubmit = useCallback(async (data: ProfileFormValues) => {
    try {
      // Send social links as individual fields (not nested) to match backend expectations
      const profileData = {
        ...data,
        // No need to restructure - send data as-is since social links are already individual fields
      };

      const url = profileExists
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/influencers/me`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/influencers/me`;

      const method = profileExists ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      toast.success("Profile saved successfully!");
      setIsEditMode(false);
    } catch (err: any) {
      toast.error(err.message || "Could not save profile");
    }
  }, [profileExists, token]);

  // Format followers count
  const formatFollowers = useCallback((count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, []);

  if (user?.role !== 'influencer') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Only influencers can access this page. Your current role is: {user?.role}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light to-white dark:from-gray-900 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="relative h-48 bg-gradient-to-r from-primary to-secondary">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar" 
                    className="w-32 h-32 rounded-full border-4 border-white object-cover bg-white"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/100";
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center border-4 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                {isEditMode && (
                  <label className="absolute bottom-2 right-2 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary-dark transition">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-20 px-8 pb-8">
            {!isEditMode ? (
              // View Mode
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
                    <p className="text-gray-600 dark:text-gray-300">@{getValues("handle") || "handle"}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditMode(true)}
                    className="btn-primary px-6 py-2 rounded-lg font-medium"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    {/* Bio */}
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">About</h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        {getValues("bio") || "No bio provided."}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{formatFollowers(getValues("followerCount") || 0)}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-accent">
                          {getValues("averageEngagementRate") ? getValues("averageEngagementRate")?.toFixed(1) : "0"}%
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Engagement</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {getValues("location") || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Location</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-accent">
                          {getValues("categories")?.length || 0}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Categories</div>
                      </div>
                    </div>

                    {/* Categories */}
                    {getValues("categories") && getValues("categories")!.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Categories</h2>
                        <div className="flex flex-wrap gap-2">
                          {getValues("categories")!.map((category, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-primary/20 text-primary dark:text-primary-light rounded-full text-sm"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    {(getValues("instagram") || getValues("youtube") || getValues("twitter") || getValues("tiktok") || getValues("other")) && (
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Social Media</h2>
                        <div className="flex flex-wrap gap-3">
                          {getValues("instagram") && (
                            <a 
                              href={getValues("instagram")} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
                            >
                              <FaInstagram className="h-5 w-5" />
                              <span>Instagram</span>
                            </a>
                          )}
                          {getValues("youtube") && (
                            <a 
                              href={getValues("youtube")} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                              <FaYoutube className="h-5 w-5" />
                              <span>YouTube</span>
                            </a>
                          )}
                          {getValues("twitter") && (
                            <a 
                              href={getValues("twitter")} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                            >
                              <FaTwitter className="h-5 w-5" />
                              <span>Twitter</span>
                            </a>
                          )}
                          {getValues("tiktok") && (
                            <a 
                              href={getValues("tiktok")} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
                            >
                              <FaTiktok className="h-5 w-5" />
                              <span>TikTok</span>
                            </a>
                          )}
                          {getValues("other") && (
                            <a 
                              href={getValues("other")} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
                            >
                              <FaLink className="h-5 w-5" />
                              <span>Website</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Portfolio */}
                    {getValues("portfolio") && getValues("portfolio")!.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Portfolio</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {getValues("portfolio")!.map((image, index) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden">
                              <img 
                                src={image} 
                                alt={`Portfolio ${index + 1}`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://placehold.co/300";
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {getValues("tags") && getValues("tags")!.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tags</h2>
                        <div className="flex flex-wrap gap-2">
                          {getValues("tags")!.map((tag, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Pricing */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pricing (INR)</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Post</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(getValues("pricing")?.post)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Reel</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(getValues("pricing")?.reel)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Story</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(getValues("pricing")?.story)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      {/* Removed duplicate Edit Profile and Delete Profile buttons */}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
                    <p className="text-gray-600 dark:text-gray-300">Edit your profile</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn-primary px-6 py-2 rounded-lg font-medium"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Handle *</label>
                        <input 
                          {...register("handle", { required: "Handle is required" })} 
                          placeholder="Your handle" 
                          className="input"
                        />
                        {errors.handle && <p className="text-red-500 text-sm mt-1">{errors.handle.message}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                            <FaMapMarkerAlt className="h-5 w-5" />
                          </div>
                          <input 
                            {...register("location")} 
                            placeholder="City, Country" 
                            className="input pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                      <textarea 
                        {...register("bio")} 
                        placeholder="Tell us about yourself..." 
                        rows={4}
                        className="input"
                      />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Follower Count</label>
                        <input 
                          type="number" 
                          {...register("followerCount", { valueAsNumber: true, min: 0 })} 
                          placeholder="0" 
                          className="input"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Engagement Rate (%)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          {...register("averageEngagementRate", { valueAsNumber: true, min: 0, max: 100 })} 
                          placeholder="0" 
                          className="input"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</label>
                        <div className="flex">
                          <input
                            type="text"
                            value={categoryInput}
                            onChange={(e) => setCategoryInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
                            className="input flex-grow rounded-r-none"
                            placeholder="Add categories..."
                          />
                          <button type="button" onClick={addCategory} className="btn-primary rounded-l-none px-4">Add</button>
                        </div>
                      </div>
                    </div>

                    {/* Categories List */}
                    <Controller
                      name="categories"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                          {field.value?.map((category, index) => (
                            <div key={index} className="flex items-center bg-primary/20 text-primary-dark dark:text-primary-light text-sm font-medium px-3 py-1 rounded-full">
                              <span>{category}</span>
                              <button type="button" onClick={() => removeCategory(category)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
                            </div>
                          ))}
                        </div>
                      )}
                    />

                    {/* Social links */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Social Links</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input {...register("instagram")} placeholder="Instagram URL" className="input" />
                        <input {...register("youtube")} placeholder="YouTube URL" className="input" />
                        <input {...register("twitter")} placeholder="Twitter URL" className="input" />
                        <input {...register("tiktok")} placeholder="TikTok URL" className="input" />
                        <input {...register("other")} placeholder="Other Link" className="input" />
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                      <div className="flex flex-wrap items-center w-full px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50/70 dark:bg-gray-700/70">
                        <Controller
                          name="tags"
                          control={control}
                          render={({ field }) => (
                            <>
                              {field.value?.map((tag, index) => (
                                <div key={index} className="flex items-center bg-primary/20 text-primary-dark dark:text-primary-light text-sm font-medium mr-2 mb-1 px-2 py-1 rounded-full">
                                  <span>{tag}</span>
                                  <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
                                </div>
                              ))}
                              <div className="flex-grow flex items-center">
                                <input
                                  type="text"
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                  className="flex-grow bg-transparent outline-none"
                                  placeholder="Add tags..."
                                />
                                <button type="button" onClick={addTag} className="btn-primary text-sm py-1 ml-2">Add</button>
                              </div>
                            </>
                          )}
                        />
                      </div>
                    </div>

                    {/* Pricing */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pricing (INR)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Post</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                              ₹
                            </div>
                            <input
                              type="number"
                              {...register("pricing.post", { valueAsNumber: true, min: 0 })}
                              className="input pl-8"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reel</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                              ₹
                            </div>
                            <input
                              type="number"
                              {...register("pricing.reel", { valueAsNumber: true, min: 0 })}
                              className="input pl-8"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Story</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                              ₹
                            </div>
                            <input
                              type="number"
                              {...register("pricing.story", { valueAsNumber: true, min: 0 })}
                              className="input pl-8"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Portfolio Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Portfolio Images</label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePortfolioUpload}
                          disabled={uploading}
                          className="input flex-grow"
                        />
                        {uploading && (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {getValues("portfolio")?.map((image, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={image} 
                              alt={`Portfolio ${index + 1}`} 
                              className="w-full aspect-square object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://placehold.co/300";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Avatar */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Avatar</h2>
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          {avatarPreview ? (
                            <img 
                              src={avatarPreview} 
                              alt="Avatar Preview" 
                              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://placehold.co/100";
                              }}
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                            className="input"
                          />
                          {uploading && (
                            <div className="mt-2 animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing Preview */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pricing Preview</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Post</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(getValues("pricing")?.post)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Reel</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(getValues("pricing")?.reel)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Story</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(getValues("pricing")?.story)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfluencerProfile;