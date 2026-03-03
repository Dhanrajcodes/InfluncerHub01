// frontend/src/components/SponsorshipModal.tsx
import React, { useState } from 'react';
import { Sponsorship } from '../types/types';
import { Link } from 'react-router-dom';
import Modal from './Modal';

interface SponsorshipModalProps {
  sponsorship: Sponsorship | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  userRole: string;
  onCreateSponsorship?: (data: any) => void;
  influencerName?: string;
  influencerHandle?: string;
}

const SponsorshipModal: React.FC<SponsorshipModalProps> = ({
  sponsorship,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onCancel,
  onComplete,
  userRole,
  onCreateSponsorship,
  influencerName,
  influencerHandle
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deliverables: ['']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDeliverableChange = (index: number, value: string) => {
    const newDeliverables = [...formData.deliverables];
    newDeliverables[index] = value;
    setFormData(prev => ({
      ...prev,
      deliverables: newDeliverables
    }));
  };

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, '']
    }));
  };

  const removeDeliverable = (index: number) => {
    if (formData.deliverables.length <= 1) return;
    
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.budget) {
      newErrors.budget = 'Budget is required';
    } else if (parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !onCreateSponsorship) return;
    
    setIsSubmitting(true);
    try {
      await onCreateSponsorship({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      });
    } catch (error) {
      console.error('Error submitting sponsorship:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If we're creating a new sponsorship (no existing sponsorship object)
  if (!sponsorship) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Sponsorship Offer">
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white">Creating sponsorship for:</h3>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {influencerName} <span className="font-normal text-gray-600 dark:text-gray-300">(@{influencerHandle})</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="Sponsored post for summer collection"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Describe the sponsorship opportunity..."
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget (INR) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                ₹
              </div>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                min="1"
                step="1"
                className={`w-full pl-8 px-3 py-2 border ${
                  errors.budget ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="5000"
              />
            </div>
            {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deliverables
              </label>
              <button
                type="button"
                onClick={addDeliverable}
                className="text-sm text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => handleDeliverableChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={`e.g., Instagram post, YouTube video`}
                  />
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark transition flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : 'Send Offer'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // If we're viewing an existing sponsorship
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sponsorship Details">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{sponsorship.title}</h3>
          <p className="mt-1 text-gray-600 dark:text-gray-300">{sponsorship.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">
              <span className={`px-2 py-1 rounded-full text-xs ${
                sponsorship.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                sponsorship.status === 'accepted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                sponsorship.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                sponsorship.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                sponsorship.status === 'cancelled' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
                {sponsorship.status}
              </span>
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {sponsorship.budget ? `₹${sponsorship.budget.toLocaleString()}` : 'Not specified'}
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDate(sponsorship.createdAt)}</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDate(sponsorship.updatedAt)}</p>
          </div>
        </div>

        {sponsorship.deliverables && sponsorship.deliverables.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Deliverables</h4>
            <ul className="list-disc pl-5 space-y-1">
              {sponsorship.deliverables.map((deliverable, index) => (
                <li key={index} className="text-gray-600 dark:text-gray-300">{deliverable}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons based on user role and sponsorship status */}
        <div className="flex flex-wrap gap-3 pt-4">
          {userRole === "brand" && sponsorship.status === "pending" && (
            <button
              onClick={() => onCancel && onCancel(sponsorship._id)}
              className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
            >
              Cancel Offer
            </button>
          )}

          {userRole === "brand" && sponsorship.status === "accepted" && (
            <button
              onClick={() => onComplete && onComplete(sponsorship._id)}
              className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition"
            >
              Mark Complete
            </button>
          )}

          {userRole === "influencer" && sponsorship.status === "pending" && (
            <>
              <button
                onClick={() => onReject && onReject(sponsorship._id)}
                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
              >
                Reject
              </button>
              <button
                onClick={() => onAccept && onAccept(sponsorship._id)}
                className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition"
              >
                Accept
              </button>
            </>
          )}

          <Link 
            to={`/messages?recipient=${
              userRole === "brand" 
                ? (typeof sponsorship.influencer === 'object' && sponsorship.influencer.user
                    ? (typeof sponsorship.influencer.user === 'object'
                        ? sponsorship.influencer.user?._id
                        : sponsorship.influencer.user)
                    : '')
                : (typeof sponsorship.brand === 'object' && sponsorship.brand.user 
                    ? (typeof sponsorship.brand.user === 'object' ? sponsorship.brand.user?._id : '') 
                    : '')
            }&name=${
              userRole === "brand"
                ? (typeof sponsorship.influencer === "object"
                    ? (sponsorship.influencer.user && typeof sponsorship.influencer.user === "object"
                        ? sponsorship.influencer.user.name
                        : sponsorship.influencer.handle)
                    : "")
                : (typeof sponsorship.brand === "object" ? sponsorship.brand.companyName : "")
            }`}
            className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark transition"
          >
            Message
          </Link>
        </div>
      </div>
    </Modal>
  );
};

export default SponsorshipModal;
