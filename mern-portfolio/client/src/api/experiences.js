import axios from 'axios';
import { useAuthStore } from '../store/auth';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
};

// Get all experiences
export const listExperiences = async () => {
  const { data } = await axios.get(`${API}/api/experiences`);
  return data;
};

// Create a new experience entry
export const createExperience = async (fields) => {
  const { data } = await axios.post(`${API}/api/experiences`, fields, {
    headers: authHeaders(),
  });
  return data;
};

// Update an experience entry
export const updateExperience = async (id, fields) => {
  const { data } = await axios.patch(`${API}/api/experiences/${id}`, fields, {
    headers: authHeaders(),
  });
  return data;
};

// Delete an experience entry
export const deleteExperience = async (id) => {
  const { data } = await axios.delete(`${API}/api/experiences/${id}`, {
    headers: authHeaders(),
  });
  return data;
};