import client from './client';
import { Plan, PlanDetail, PlanSessionBrief } from '../types';

export const createPlan = async (userPrompt: string): Promise<Plan> => {
  const response = await client.post('/plans/', { user_prompt: userPrompt });
  return response.data;
};

export const getPlans = async (): Promise<Plan[]> => {
  const response = await client.get('/plans/');
  return response.data;
};

export const getActivePlan = async (): Promise<PlanDetail | null> => {
  const response = await client.get('/plans/active');
  return response.data;
};

export const getPlan = async (id: number): Promise<PlanDetail> => {
  const response = await client.get(`/plans/${id}`);
  return response.data;
};

export const deletePlan = async (id: number): Promise<void> => {
  await client.delete(`/plans/${id}`);
};

export const getPlanSessions = async (planId: number): Promise<PlanSessionBrief[]> => {
  const response = await client.get(`/plans/${planId}/sessions`);
  return response.data;
};
