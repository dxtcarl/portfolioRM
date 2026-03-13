import api from './client';

export const getSection = async (key) => {
  const { data } = await api.get(`/api/sections/${key}`);
  return data;
};

export const saveSection = async (key, payload) => {
  const { data } = await api.put(`/api/sections/${key}`, payload);
  return data;
};
