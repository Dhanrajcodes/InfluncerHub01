// frontend/src/pages/SponsorshipDetailPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";
import axios from "axios";
import { Sponsorship } from "../types/types";
import toast from "react-hot-toast";
import {
  acceptSponsorship,
  rejectSponsorship,
  cancelSponsorship,
  completeSponsorship
} from "../services/sponsorship";

const SponsorshipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchSponsorship = async () => {
      try {
        if (!token || !id) return;
        
        setLoading(true);
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/sponsorships/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setSponsorship(res.data);
      } catch (err: any) {
        console.error("Error fetching sponsorship:", err);
        if (err.response && err.response.status === 403) {
          toast.error("You don't have permission to view this sponsorship");
        } else if (err.response && err.response.status === 404) {
          toast.error("Sponsorship not found");
        } else {
          toast.error(err.message || "Failed to load sponsorship details");
        }
        navigate("/sponsorships");
      } finally {
        setLoading(false);
      }
    };

    fetchSponsorship();
  }, [id, token, navigate]);

  const handleAccept = async () => {
    if (!token || !id) return;
    
    try {
      setUpdating(true);
      await acceptSponsorship(id, token);
      toast.success("Sponsorship accepted!");
      
      // Refresh the sponsorship data
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/sponsorships/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSponsorship(res.data);
    } catch (err: any) {
      console.error("Error accepting sponsorship:", err);
      toast.error(err.message || "Failed to accept sponsorship");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!token || !id) return;
    
    try {
      setUpdating(true);
      await rejectSponsorship(id, token);
      toast.success("Sponsorship rejected!");
      
      // Refresh the sponsorship data
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/sponsorships/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSponsorship(res.data);
    } catch (err: any) {
      console.error("Error rejecting sponsorship:", err);
      toast.error(err.message || "Failed to reject sponsorship");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!token || !id) return;
    
    try {
      setUpdating(true);
      await cancelSponsorship(id, token);
      toast.success("Sponsorship cancelled!");
      
      // Refresh the sponsorship data
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/sponsorships/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSponsorship(res.data);
    } catch (err: any) {
      console.error("Error cancelling sponsorship:", err);
      toast.error(err.message || "Failed to cancel sponsorship");
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!token || !id) return;
    
    try {
      setUpdating(true);
      await completeSponsorship(id, token);
      toast.success("Sponsorship marked as complete!");
      
      // Refresh the sponsorship data
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/sponsorships/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSponsorship(res.data);
    } catch (err: any) {
      console.error("Error completing sponsorship:", err);
      toast.error(err.message || "Failed to mark sponsorship as complete");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (value?: number) => {
    if (value === undefined || value === null) return "N/A";
    return `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sponsorship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sponsorship Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The sponsorship you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link 
            to="/sponsorships" 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Back to Sponsorships
          </Link>
        </div>
      </div>
    );
  }

  // Get brand name
  const getBrandName = () => {
    if (typeof sponsorship.brand === 'object') {
      return sponsorship.brand.companyName || 
             sponsorship.brand.contactEmail || 
             (sponsorship.brand.user && typeof sponsorship.brand.user === 'object' 
               ? sponsorship.brand.user.name 
               : "Unknown Brand");
    }
    return "Unknown Brand";
  };

  // Get influencer name
  const getInfluencerName = () => {
    if (typeof sponsorship.influencer === 'object') {
      return sponsorship.influencer.user && typeof sponsorship.influencer.user === 'object'
        ? sponsorship.influencer.user.name
        : sponsorship.influencer.handle;
    }
    return "Unknown Influencer";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link 
          to="/sponsorships" 
          className="flex items-center text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Sponsorships
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sponsorship.title}</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{sponsorship.description}</p>
            </div>
            
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              sponsorship.status === 'pending' 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              sponsorship.status === 'accepted' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              sponsorship.status === 'rejected' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              sponsorship.status === 'completed' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              sponsorship.status === 'cancelled' 
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {sponsorship.status.charAt(0).toUpperCase() + sponsorship.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Brand</h3>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {getBrandName()}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Influencer</h3>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {getInfluencerName()}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Budget</h3>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {formatPrice(sponsorship.budget)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created</h3>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {formatDate(sponsorship.createdAt)}
              </p>
            </div>
          </div>

          {sponsorship.deliverables && sponsorship.deliverables.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Deliverables</h3>
              <ul className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {sponsorship.deliverables.map((deliverable, index) => (
                  <li key={index} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-4">
            {user?.role === "brand" && sponsorship.status === "pending" && (
              <button
                onClick={handleCancel}
                disabled={updating}
                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {updating ? "Processing..." : "Cancel Offer"}
              </button>
            )}

            {user?.role === "brand" && sponsorship.status === "accepted" && (
              <button
                onClick={handleComplete}
                disabled={updating}
                className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {updating ? "Processing..." : "Mark Complete"}
              </button>
            )}

            {user?.role === "influencer" && sponsorship.status === "pending" && (
              <>
                <button
                  onClick={handleReject}
                  disabled={updating}
                  className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Reject"}
                </button>
                <button
                  onClick={handleAccept}
                  disabled={updating}
                  className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Accept"}
                </button>
              </>
            )}

            <Link 
              to={`/messages?recipient=${
                user?.role === "brand" 
                  ? (typeof sponsorship.influencer === 'object' && sponsorship.influencer.user
                      ? (typeof sponsorship.influencer.user === 'object' ? sponsorship.influencer.user?._id : sponsorship.influencer.user)
                      : '')
                  : (typeof sponsorship.brand === 'object' && sponsorship.brand.user 
                      ? (typeof sponsorship.brand.user === 'object' ? sponsorship.brand.user?._id : '') 
                      : '')
              }&name=${
                user?.role === "brand" 
                  ? (typeof sponsorship.influencer === 'object'
                      ? (sponsorship.influencer.user && typeof sponsorship.influencer.user === 'object'
                          ? sponsorship.influencer.user.name
                          : sponsorship.influencer.handle)
                      : '')
                  : (typeof sponsorship.brand === 'object' ? sponsorship.brand.companyName : '')
              }`}
              className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark transition"
            >
              Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorshipDetailPage;
