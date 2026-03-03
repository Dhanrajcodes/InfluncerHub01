// frontend/src/pages/BrandDashboard.tsx
import React from "react";
import { useAuth } from "../useAuth";
import { Link } from "react-router-dom";
import Stats from "../components/Stats";
import QuickActions from "../components/QuickActions";
import RecentActivity from "../components/RecentActivity";

const BrandDashboard: React.FC = () => {
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
            Ready to launch your next influencer marketing campaign?
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
            {/* Brand-specific sidebar */}
            <div className="space-y-6">
              <div className="card p-6 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4">
                  Brand Profile
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Manage your company information and preferences.
                </p>
                <Link to="/brand-profile" className="btn-primary block text-center">
                  Manage Profile
                </Link>
              </div>
              
              <div className="card p-6 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4">
                  Sponsorships
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create and manage your sponsorship campaigns.
                </p>
                <Link to="/sponsorships" className="btn-primary block text-center">
                  View Sponsorships
                </Link>
                <Link to="/sponsorships/create" className="btn-outline block text-center mt-2">
                  Create New
                </Link>
              </div>
              
              <div className="card p-6 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4">
                  Campaign Tips
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Define clear campaign goals and KPIs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Set realistic budgets and timelines</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Provide detailed briefs to influencers</span>
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

export default BrandDashboard;