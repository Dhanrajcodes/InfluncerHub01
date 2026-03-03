//src/services/sponsorship.ts
import axios from 'axios';
import { Sponsorship } from '../types/types';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/sponsorships`;

// Get all sponsorships for the logged in user
export const getSponsorships = async (token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.get<Sponsorship[]>(API_URL, config);
  return response.data;
};

// Get brand's sponsorships
export const getBrandSponsorships = async (token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.get<Sponsorship[]>(`${API_URL}/brand/my`, config);
  return response.data;
};

// Get influencer's sponsorships
export const getInfluencerSponsorships = async (token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.get<Sponsorship[]>(`${API_URL}/my`, config);
  return response.data;
};

// Create a new sponsorship
export const createSponsorship = async (sponsorshipData: any, token: string) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.post<Sponsorship>(API_URL, sponsorshipData, config);
  return response.data;
};

// Accept a sponsorship
export const acceptSponsorship = async (id: string, token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.patch(`${API_URL}/${id}/accept`, {}, config);
  return response.data;
};

// Reject a sponsorship
export const rejectSponsorship = async (id: string, token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.patch(`${API_URL}/${id}/reject`, {}, config);
  return response.data;
};

// Cancel a sponsorship
export const cancelSponsorship = async (id: string, token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.put(`${API_URL}/${id}/cancel`, {}, config);
  return response.data;
};

// Complete a sponsorship
export const completeSponsorship = async (id: string, token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.put(`${API_URL}/${id}/complete`, {}, config);
  return response.data;
};
