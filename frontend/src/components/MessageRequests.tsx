// frontend/src/components/MessageRequests.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../useAuth";
import axios from "axios";
import websocketService from "../services/websocket";
import { useNavigate } from "react-router-dom";

interface MessageRequest {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  status: string;
  senderName?: string;
  recipientName?: string;
}

const MessageRequests: React.FC = () => {
  const { token } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<MessageRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const navigate = useNavigate();

  // Load requests
  const loadRequests = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      // Load incoming requests
      const incomingRes = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/requests`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setIncomingRequests(incomingRes.data);
      
      // Load outgoing requests
      const outgoingRes = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/requests/sent`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setOutgoingRequests(outgoingRes.data);
    } catch (err) {
      console.error("Error loading message requests:", err);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
    
    // Listen for new message requests
    const handleWebSocketMessage = (message: any) => {
      if (message.type === 'messageRequest') {
        loadRequests();
      }
    };
    
    websocketService.addMessageListener(handleWebSocketMessage);
    
    return () => {
      websocketService.removeMessageListener(handleWebSocketMessage);
    };
  }, [loadRequests]);

  const handleAccept = async (requestId: string, senderId: string, senderName?: string) => {
    if (!token) return;
    
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/requests/${requestId}/accept`,
        { senderId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Remove the request from the list
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Navigate to the conversation
      navigate(`/messages?recipient=${senderId}&name=${encodeURIComponent(senderName || "Conversation")}`);
    } catch (err) {
      console.error("Error accepting message request:", err);
      alert("Failed to accept message request. Please try again.");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!token) return;
    
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages/requests/${requestId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Remove the request from the list
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err) {
      console.error("Error rejecting message request:", err);
      alert("Failed to reject message request. Please try again.");
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs for incoming and outgoing requests */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "incoming"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("incoming")}
          >
            Incoming Requests
          </button>
          <button
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "outgoing"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("outgoing")}
          >
            Sent Requests
          </button>
        </nav>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activeTab === "incoming" ? (
          incomingRequests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No message requests</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                When someone wants to message you, their request will appear here.
              </p>
            </div>
          ) : (
            incomingRequests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {request.senderName?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.senderName || "Unknown User"}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(request.timestamp)}
                      </span>
                    </div>
                    
                    <div className="mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Request message:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">
                        {request.content}
                      </p>
                    </div>
                    
                    <div className="flex space-x-3 mt-3">
                      <button
                        onClick={() => handleAccept(request.id, request.from, request.senderName)}
                        className="px-3 py-1 bg-primary hover:bg-primary-dark text-white text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          outgoingRequests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No sent requests</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                When you send a message request, it will appear here.
              </p>
            </div>
          ) : (
            outgoingRequests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {request.recipientName?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.recipientName || "Unknown User"}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(request.timestamp)}
                      </span>
                    </div>
                    
                    <div className="mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your message:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">
                        {request.content}
                      </p>
                    </div>
                    
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default MessageRequests;
