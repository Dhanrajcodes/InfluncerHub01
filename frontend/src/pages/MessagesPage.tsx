// frontend/src/pages/MessagesPage.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import websocketService from "../services/websocket";
import axios from "axios";
import MessageList from "../components/MessageList";
import MessageRequests from "../components/MessageRequests";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  status?: string;
}

const MessagesPage: React.FC = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "requests">("messages");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get recipient from URL query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const recipientId = searchParams.get("recipient");
    const recipientName = searchParams.get("name");
    
    if (recipientId) {
      setRecipient({ id: recipientId, name: recipientName || "Conversation" });
    } else {
      setRecipient(null);
    }
  }, [location.search]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!token || !recipient) return;
    
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages?recipient=${recipient.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessages(res.data);
    } catch (err) {
      console.error("Error loading messages:", err);
      // Fallback to empty array
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [token, recipient]);

  // Connect to WebSocket
  useEffect(() => {
    if (token) {
      websocketService.connect(token);
      
      // Load initial messages if we have a recipient
      if (recipient) {
        loadMessages();
      } else {
        setLoading(false);
      }
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [token, recipient, loadMessages]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      if (message.type === 'message' && message.data) {
        // Check if the message is from our recipient
        if (
          (message.data.senderId === recipient?.id && message.data.recipientId === user?._id) ||
          (message.data.senderId === user?._id && message.data.recipientId === recipient?.id)
        ) {
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const messageExists = prev.some(msg => msg.id === message.data.id);
            if (!messageExists) {
              return [...prev, message.data];
            }
            return prev;
          });
        }
      } else if (message.type === 'messageRequestConfirmation') {
        // Show confirmation that request was sent
        console.log("Message request sent successfully");
      } else if (message.type === 'requestAccepted') {
        // Reload messages when a request is accepted
        if (recipient) {
          loadMessages();
        }
      }
    };
    
    websocketService.addMessageListener(handleWebSocketMessage);
    
    return () => {
      websocketService.removeMessageListener(handleWebSocketMessage);
    };
  }, [recipient, user, loadMessages]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || !recipient) return;

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages`,
        { content: newMessage, recipientId: recipient.id },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // If it's a request, show appropriate message
      if (res.data.type === 'request') {
        setNewMessage("");
        // Show a message that the request was sent
        alert("Message request sent! You'll be able to chat once they accept your request.");
        // Go back to message list
        navigate('/messages');
        return;
      }

      // Add message to local state if not already there (in case WebSocket is slow)
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        // But for sent messages, we want to update the message with the one from the server
        if (res.data.senderId === user?._id) {
          // For sent messages, replace with server version if exists, or add if not
          const serverMessage = res.data;
          const existsIndex = prev.findIndex(msg => msg.id === serverMessage.id);
          
          if (existsIndex !== -1) {
            // Replace the temporary message with the server version
            const updated = [...prev];
            updated[existsIndex] = serverMessage;
            return updated;
          } else {
            // Add the server message
            return [...prev, serverMessage];
          }
        } else {
          // For received messages, check if it already exists
          const messageExists = prev.some(msg => msg.id === res.data.id);
          if (!messageExists) {
            return [...prev, res.data];
          }
          return prev;
        }
      });

      setNewMessage("");
    } catch (err: any) {
      if (err.response && err.response.status === 400) {
        alert("You've already sent a message request to this user. Please wait for them to accept.");
      } else {
        console.error("Error sending message:", err);
        alert("Failed to send message. Please try again.");
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach(message => {
    const date = formatDate(message.timestamp);
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  // If no recipient is selected, show the message list or requests
  if (!recipient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card shadow-lg rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Messages</h1>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "messages"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("messages")}
                >
                  Messages
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "requests"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("requests")}
                >
                  Requests
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 min-h-[500px]">
              {activeTab === "messages" ? <MessageList /> : <MessageRequests />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If recipient is selected, show the conversation
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card shadow-lg rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center">
            <button
              onClick={() => navigate("/messages")}
              className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{recipient.name}</h1>
          </div>
          
          {/* Messages */}
          <div className="bg-white dark:bg-gray-800 flex-1 overflow-y-auto max-h-[60vh] p-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-lg">No messages yet</p>
                <p className="mt-2 text-center">Send a message to start the conversation</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date}>
                    <div className="text-center my-4">
                      <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {date}
                      </span>
                    </div>
                    {dateMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex mb-4 ${message.senderId === user?._id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                            message.senderId === user?._id
                              ? "bg-blue-500 text-white rounded-br-none"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"
                          }`}
                        >
                          <p>{message.content}</p>
                          <div
                            className={`text-xs mt-1 ${
                              message.senderId === user?._id ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Message Input */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
