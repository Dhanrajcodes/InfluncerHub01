import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../useAuth';

const QuickActions: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'brand') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link 
          to="/sponsorships/create" 
          className="card p-4 hover-lift flex flex-col items-center justify-center text-center h-32 group transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="Create New Campaign"
        >
          <div className="w-10 h-10 bg-primary-light/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-primary group-hover:text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-primary-light transition-colors duration-300">New Campaign</span>
        </Link>
        
        <Link 
          to="/brand-profile" 
          className="card p-4 hover-lift flex flex-col items-center justify-center text-center h-32 group transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="View Brand Profile"
        >
          <div className="w-10 h-10 bg-secondary-light/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-secondary group-hover:text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-secondary dark:group-hover:text-secondary-light transition-colors duration-300">Brand Profile</span>
        </Link>
        
        <Link 
          to="/search?type=influencers" 
          className="card p-4 hover-lift flex flex-col items-center justify-center text-center h-32 group transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="Find Influencers"
        >
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-accent group-hover:text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-accent transition-colors duration-300">Find Influencers</span>
        </Link>
        
        <Link 
          to="/analytics" 
          className="card p-4 hover-lift flex flex-col items-center justify-center text-center h-32 group transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="View Campaign Analytics"
        >
          <div className="w-10 h-10 bg-primary-light/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-primary group-hover:text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              />
            </svg>
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-primary-light transition-colors duration-300">Campaign Analytics</span>
        </Link>
      </div>
    );
  } else {
    // Influencer quick actions
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link 
          to="/sponsorships" 
          className="card p-4 hover-lift flex flex-col items-center justify-center text-center h-32 group transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="View My Offers"
        >
          <div className="w-10 h-10 bg-primary-light/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-primary group-hover:text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-primary-light transition-colors duration-300">My Offers</span>
        </Link>
        
        <Link 
          to="/influencer-profile" 
          className="card p-4 hover-lift flex flex-col items-center justify-center text-center h-32 group transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="View My Profile"
        >
          <div className="w-10 h-10 bg-secondary-light/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-secondary group-hover:text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-secondary dark:group-hover:text-secondary-light transition-colors duration-300">My Profile</span>
        </Link>
        
        <Link 
          to="/search?type=brands" 
          className="card p-4 hover-lift flex flex-col items-center justify-center text-center h-32 group transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="Discover Brands"
        >
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-accent group-hover:text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-accent transition-colors duration-300">Discover Brands</span>
        </Link>
        
        <Link 
          to="/analytics" 
          className="card p-4 hover-lift flex flex-col items-center justify-center text-center h-32 group transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="View Performance Analytics"
        >
          <div className="w-10 h-10 bg-primary-light/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-primary group-hover:text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              />
            </svg>
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-primary-light transition-colors duration-300">Performance</span>
        </Link>
      </div>
    );
  }
};

export default QuickActions;
