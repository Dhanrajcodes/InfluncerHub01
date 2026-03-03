// frontend/src/pages/InfluencerPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { InfluencerProfile } from "../types/types";
import { useAuth } from "../useAuth";
import toast from "react-hot-toast";
import SponsorshipModal from "../components/SponsorshipModal";
import axios from "axios";

const normalizeUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

const InfluencerPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const apiBaseUrl = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || "http://localhost:5000";
  
  const { user, token } = useAuth();

  const [influencer, setInfluencer] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previousPath = (location.state as { from?: string } | null)?.from;

  // Portfolio lightbox
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Check if we should open the sponsor modal (coming from search page)
    if ((location.state as any)?.openSponsorModal) {
      setIsModalOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchInfluencer = async () => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/influencers/handle/${handle}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!res.ok) throw new Error("Failed to fetch influencer");
        const data = await res.json();
        setInfluencer(data.data || data);
      } catch (err: any) {
        toast.error(err.message || "Error fetching influencer profile");
      } finally {
        setLoading(false);
      }
    };

    if (handle) fetchInfluencer();
  }, [apiBaseUrl, handle, token]);

  const handleCreateSponsorship = async (sponsorshipData: any) => {
    if (!token || !influencer) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      };
      
      const data = {
        influencer: influencer._id,
        title: sponsorshipData.title,
        description: sponsorshipData.description,
        budget: sponsorshipData.budget,
        deliverables: sponsorshipData.deliverables
      };
      
      await axios.post(`${apiBaseUrl}/api/sponsorships`, data, config);
      toast.success("Sponsorship offer sent successfully!");
      setIsModalOpen(false);
      // Redirect to sponsorships page after successful creation
      navigate("/sponsorships");
    } catch (error: any) {
      console.error("Error creating sponsorship:", error);
      const errorMessage = error.response?.data?.message || "Failed to send sponsorship offer";
      toast.error(errorMessage);
      // Re-throw the error so the modal can handle it appropriately
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        Loading profile...
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        Influencer not found
      </div>
    );
  }

  const openImage = (index: number) => setSelectedIndex(index);
  const closeImage = () => setSelectedIndex(null);
  const nextImage = () =>
    setSelectedIndex((prev) =>
      prev !== null && influencer.portfolio
        ? (prev + 1) % influencer.portfolio.length
        : null
    );
  const prevImage = () =>
    setSelectedIndex((prev) =>
      prev !== null && influencer.portfolio
        ? (prev - 1 + (influencer.portfolio?.length || 0)) %
          (influencer.portfolio?.length || 0)
        : null
    );

  const handleBack = () => {
    if (previousPath) {
      navigate(previousPath);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/search");
  };

  // Format follower count
  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Get influencer name
  const getInfluencerName = () => {
    if (influencer.user && typeof influencer.user === 'object') {
      return influencer.user.name;
    }
    return influencer.handle;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Profile Image */}
          <div className="md:shrink-0 p-8 flex items-center justify-center">
            <img
              className="h-48 w-48 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
              src={influencer.avatarUrl || "https://placehold.co/300"}
              alt={influencer.handle}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/300";
              }}
            />
          </div>

          {/* Profile Info */}
          <div className="p-8 flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {getInfluencerName()}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mt-1">@{influencer.handle}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {influencer.categories?.map((category) => (
                    <span
                      key={category._id}
                      className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm font-medium"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatFollowerCount(influencer.followerCount || 0)}
                </p>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-6 text-gray-600 dark:text-gray-300 max-w-2xl">
              {influencer.bio ||
                "This influencer hasn't added a bio yet."}
            </p>

            {/* Location & Join Date */}
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
              {influencer.location && (
                <div className="flex items-center">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  {influencer.location}
                </div>
              )}
              <div className="flex items-center">
                <i className="fas fa-calendar-alt mr-2"></i>
                Joined{" "}
                {new Date(influencer.createdAt || "").toLocaleDateString()}
              </div>
            </div>

            {/* Engagement Rate */}
            {influencer.engagementRate && (
              <div className="mt-6">
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {influencer.engagementRate}%
                  </span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Engagement Rate
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${influencer.engagementRate}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Pricing */}
            {influencer.pricing &&
              (influencer.pricing.post ||
                influencer.pricing.reel ||
                influencer.pricing.story) && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Pricing</h3>
                  <div className="flex gap-6">
                    {influencer.pricing.post && (
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">₹{influencer.pricing.post.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Post</p>
                      </div>
                    )}
                    {influencer.pricing.reel && (
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">₹{influencer.pricing.reel.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reel</p>
                      </div>
                    )}
                    {influencer.pricing.story && (
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">₹{influencer.pricing.story.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Story</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Social Links */}
            <div className="flex justify-center sm:justify-start gap-6 mt-6">
              {influencer.socialLinks?.instagram && (
                <a
                  href={normalizeUrl(influencer.socialLinks.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-pink-500 dark:text-gray-400 dark:hover:text-pink-400 transition-colors"
                >
                  <i className="fab fa-instagram text-3xl"></i>
                </a>
              )}
              {influencer.socialLinks?.youtube && (
                <a
                  href={normalizeUrl(influencer.socialLinks.youtube)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors"
                >
                  <i className="fab fa-youtube text-3xl"></i>
                </a>
              )}
              
              {influencer.socialLinks?.twitter && (
                <a
                  href={normalizeUrl(influencer.socialLinks.twitter)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-sky-400 dark:text-gray-400 dark:hover:text-sky-400 transition-colors"
                >
                  <i className="fab fa-twitter text-3xl"></i>
                </a>
              )}
              {influencer.socialLinks?.other && (
                <a
                  href={normalizeUrl(influencer.socialLinks.other)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                >
                  <i className="fas fa-link text-3xl"></i>
                </a>
              )}
            </div>

            {/* Sponsor button */}
            {user?.role === "brand" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition shadow-lg hover:shadow-xl"
              >
                Sponsor this Influencer
              </button>
            )}
          </div>
        </div>

        {/* Portfolio */}
        {influencer.portfolio && influencer.portfolio.length > 0 && (
          <div className="mt-12 px-8 pb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Portfolio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {influencer.portfolio.map((img, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-xl shadow-md group cursor-pointer"
                  onClick={() => openImage(idx)}
                >
                  <img
                    src={img}
                    alt={`Portfolio ${idx + 1}`}
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/300x300?text=Image+Not+Found";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {selectedIndex !== null && influencer.portfolio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
            <button
              className="absolute top-4 right-6 text-white text-3xl font-bold"
              onClick={closeImage}
            >
              &times;
            </button>
            <button
              className="absolute left-6 text-white text-4xl"
              onClick={prevImage}
            >
              &#8249;
            </button>
            <img
              src={influencer.portfolio[selectedIndex]}
              alt="Full size"
              className="max-h-[90%] max-w-[90%] rounded-xl shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/600x400?text=Image+Not+Found";
              }}
            />
            <button
              className="absolute right-6 text-white text-4xl"
              onClick={nextImage}
            >
              &#8250;
            </button>
          </div>
        )}

        {/* Sponsorship Modal */}
        {influencer && (
          <SponsorshipModal
            sponsorship={null}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
            }}
            onAccept={function (id: string): void {
              throw new Error('Function not implemented.');
            }}
            onReject={function (id: string): void {
              throw new Error('Function not implemented.');
            }}
            onCancel={function (id: string): void {
              throw new Error('Function not implemented.');
            }}
            onComplete={function (id: string): void {
              throw new Error('Function not implemented.');
            }}
            userRole="brand"
            onCreateSponsorship={handleCreateSponsorship}
            influencerName={getInfluencerName()}
            influencerHandle={influencer.handle}
          />
        )}
      </div>
    </div>
  );
};

export default InfluencerPage;
