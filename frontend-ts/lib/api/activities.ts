import client from './client';
import { Activity, ActivityDetail } from '../types';

export const uploadActivity = async (file: File): Promise<Activity> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/activities/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getActivities = async (): Promise<Activity[]> => {
  const response = await client.get('/activities/');
  return response.data;
};

export const getActivity = async (id: number): Promise<ActivityDetail> => {
  const response = await client.get(`/activities/${id}`);
  return response.data;
};

export const deleteActivity = async (id: number): Promise<void> => {
  await client.delete(`/activities/${id}`);
};

export const reEvaluateActivity = async (id: number): Promise<void> => {
  await client.post(`/activities/${id}/evaluate`);
};
