// frontend/src/components/Navbar.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../useAuth";
import axios from "axios";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const { isAuthenticated, logout, user, token } = useAuth();
  const location = useLocation();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleProfileMenu = () => {
    setProfileOpen(!isProfileOpen);
  };

  const closeProfileMenu = () => {
    setProfileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        closeProfileMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 添加状态来存储未读消息数量
  const [unreadMessages, setUnreadMessages] = useState(0);

  // 从API获取未读消息数量
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!token) return;
      
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/conversations`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // 计算未读消息总数
        const totalUnread = res.data.reduce((acc: number, conversation: any) => 
          acc + (conversation.unreadCount || 0), 0);
          
        setUnreadMessages(totalUnread);
      } catch (err) {
        console.error("Error fetching unread messages:", err);
      }
    };

    fetchUnreadMessages();
    
    // 每30秒轮询更新
    const interval = setInterval(fetchUnreadMessages, 30000);
    
    return () => clearInterval(interval);
  }, [token]);

  return (
    <nav className="bg-white dark:bg-background-dark shadow-md dark:shadow-gray-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <svg
                className="h-8 w-8 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                  fill="currentColor"
                />
                <path
                  d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="ml-2 text-xl font-display font-bold text-gradient">
                InfluencerHub
              </span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to={user?.role === "brand" ? "/brand/dashboard" : "/influencer/dashboard"}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard") || isActive("/brand/dashboard") || isActive("/influencer/dashboard")
                      ? "bg-primary-light/20 text-primary-dark dark:text-primary-light"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/sponsorships"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/sponsorships")
                      ? "bg-primary-light/20 text-primary-dark dark:text-primary-light"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Sponsorships
                </Link>
                <Link
                  to="/search"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/search")
                      ? "bg-primary-light/20 text-primary-dark dark:text-primary-light"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Search
                </Link>
                
                {/* Messages icon with dynamic unread count */}
                <Link
                  to="/messages"
                  className="relative p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  {/* Dynamic unread message badge */}
                  {unreadMessages > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-xs text-white ring-2 ring-white dark:ring-gray-800">
                      {unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="ml-3 relative" ref={profileMenuRef}>
                  <div>
                    <button
                      onClick={toggleProfileMenu}
                      className="flex items-center space-x-2 focus:outline-none"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary-light text-white flex items-center justify-center overflow-hidden">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {user?.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user?.name || "User"}
                      </span>
                      <svg
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          isProfileOpen ? "rotate-180" : ""
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  {isProfileOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                      <Link
                        to={user?.role === "brand" ? "/brand-profile" : "/influencer-profile"}
                        onClick={closeProfileMenu}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={closeProfileMenu}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          closeProfileMenu();
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            >
              <span className="sr-only">
                {isOpen ? "Close menu" : "Open menu"}
              </span>
              {isOpen ? (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  to={user?.role === "brand" ? "/brand/dashboard" : "/influencer/dashboard"}
                  onClick={closeMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/dashboard") || isActive("/brand/dashboard") || isActive("/influencer/dashboard")
                      ? "bg-primary-light/20 text-primary-dark dark:text-primary-light"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/sponsorships"
                  onClick={closeMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/sponsorships")
                      ? "bg-primary-light/20 text-primary-dark dark:text-primary-light"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Sponsorships
                </Link>
                <Link
                  to="/search"
                  onClick={closeMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/search")
                      ? "bg-primary-light/20 text-primary-dark dark:text-primary-light"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Search
                </Link>
                
                {/* Messages icon for mobile */}
                <Link
                  to="/messages"
                  onClick={closeMenu}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/messages")
                      ? "bg-primary-light/20 text-primary-dark dark:text-primary-light"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
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
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Messages
                  {/* Dynamic unread message badge */}
                  {unreadMessages > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-xs text-white">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                
                <Link
                  to={user?.role === "brand" ? "/brand-profile" : "/influencer-profile"}
                  onClick={closeMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    (user?.role === "brand" ? isActive("/brand-profile") : isActive("/influencer-profile"))
                      ? "bg-primary-light/20 text-primary-dark dark:text-primary-light"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={closeMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/settings")
                      ? "bg-primary-light/20 text-primary-dark dark:text-primary-light"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="px-3 py-3 flex flex-col space-y-3">
                <Link to="/login" onClick={closeMenu} className="btn-outline w-full">
                  Log in
                </Link>
                <Link to="/signup" onClick={closeMenu} className="btn-primary w-full">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;