// src/types/types.ts

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "brand" | "influencer" | "admin";
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "brand" | "influencer";
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// -------- BRAND PROFILE --------
export interface BrandProfile {
  _id: string;
  user?: { _id: string; name: string; email?: string }; // Populated user object
  companyName: string;
  industry: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  contactEmail: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  budgetPerPost?: number;
  createdAt?: string;
  updatedAt?: string;
}

// -------- INFLUENCER PROFILE --------
export interface InfluencerProfile {
  _id: string;
  user?: { _id: string; name: string; email?: string; avatar?: string }; // Populated user object
  handle: string;
  bio?: string;

  // Categories
  categories: { _id: string; name: string }[]; // frontend expects objects with _id + name

  // Stats
  followerCount: number;
  engagementRate?: number;
  averageEngagementRate?: number;

  // Media
  portfolio?: string[];
  avatarUrl?: string;

  // ✅ Social links (extended to include "other")
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    twitter?: string;
    tiktok?: string;
    other?: string;
  };

  // ✅ Tags for additional descriptors
  tags?: string[];

  // ✅ Pricing structure (INR only)
  pricing?: {
    post?: number;
    reel?: number;
    story?: number;
  };

  // Meta
  location?: string;
  languages?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// -------- SPONSORSHIP --------
export interface Sponsorship {
  _id: string;
  brand: { 
    _id: string; 
    user: { _id: string; name: string; email?: string } | string;
    companyName: string;
    contactEmail: string;
    name: string;
  } | string;
  influencer?: { 
    _id: string; 
    user: { _id: string; name: string } | string;
    handle: string;
    name: string;
  } | string;
  influencerProfile?: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  title: string;
  description?: string;
  budget?: number;
  deliverables?: string[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

// -------- COMMON --------
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
