// frontend/src/pages/InfluencerDashboard.tsx
import React from "react";
import { useAuth } from "../useAuth";
import { Link } from "react-router-dom";
import Stats from "../components/Stats";
import QuickActions from "../components/QuickActions";
import RecentActivity from "../components/RecentActivity";

const InfluencerDashboard: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your collaborations today.
          </p>
        </div>

        {/* Stats Section */}
        <Stats />

        {/* Quick Actions */}
        <div className="my-8">
          <QuickActions />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          
          <div>
            {/* Influencer-specific sidebar */}
            <div className="space-y-6">
              <div className="card p-6 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4">
                  Manage Profile
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Update your profile information and preferences.
                </p>
                <Link to="/influencer-profile" className="btn-primary block text-center">
                  Edit Profile
                </Link>
              </div>
              
              <div className="card p-6 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4">
                  Upcoming Deadlines
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No upcoming deadlines at the moment.
                </p>
              </div>
              
              <div className="card p-6 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white">
                    Performance Summary
                  </h3>
                  <Link to="/analytics" className="text-sm text-primary hover:text-primary-dark dark:hover:text-primary-light transition-colors">
                    View Full
                  </Link>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Engagement Rate</span>
                      <span className="font-medium">4.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Response Rate</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
                
                <Link to="/analytics" className="btn-outline w-full mt-6 text-center block">
                  View Full Analytics
                </Link>
              </div>
              
              <div className="card p-6 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4">
                  Growth Tips
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Post consistently to maintain engagement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Engage with your audience in comments</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Use relevant hashtags to expand reach</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InfluencerDashboard;