import axios from 'axios';
import { useAuthStore } from '../store/auth';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
};

// Get all photos
export const listPhotos = async () => {
  const { data } = await axios.get(`${API}/api/photos`);
  return data;
};

// Upload a photo — ✅ section parameter added
export const uploadPhoto = async (file, title = '', description = '', section = 'section1') => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('title', title);
  formData.append('description', description);
  formData.append('section', section); // ✅ THIS WAS MISSING

  const { data } = await axios.post(`${API}/api/photos`, formData, {
    headers: {
      ...authHeaders(),
      // NOTE: do NOT manually set Content-Type here
      // axios sets it automatically with the correct boundary for multipart
    },
  });
  return data;
};

// Update photo
export const updatePhoto = async (id, fields) => {
  const { data } = await axios.patch(`${API}/api/photos/${id}`, fields, {
    headers: authHeaders(),
  });
  return data;
};

// Delete a photo
export const deletePhoto = async (id) => {
  const { data } = await axios.delete(`${API}/api/photos/${id}`, {
    headers: authHeaders(),
  });
  return data;
};