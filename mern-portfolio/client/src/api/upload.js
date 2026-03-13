// src/api/upload.js
// Generic Cloudinary upload — returns just the URL
// Used for profile photo, NOT for carousel photos
import axios from 'axios';
import { useAuthStore } from '../store/auth';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
};

// Upload any image to Cloudinary and get back just the URL
// Does NOT create a Photo document in MongoDB
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await axios.post(`${API}/api/upload`, formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });

  return data.url; // just the Cloudinary URL string
};