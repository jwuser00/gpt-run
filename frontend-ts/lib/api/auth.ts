import client from './client';
import { Token, User, UserProfile } from '../types';

export const login = async (
  email: string,
  password: string,
): Promise<Token> => {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  const response = await client.post('/users/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

export const register = async (
  email: string,
  nickname: string,
  birthYear: number,
  birthMonth: number,
  gender: string,
  password: string,
): Promise<User> => {
  const response = await client.post('/users/', {
    email,
    nickname,
    birth_year: birthYear,
    birth_month: birthMonth,
    gender,
    password,
  });
  return response.data;
};

export const forgotPassword = async (email: string): Promise<void> => {
  await client.post('/users/forgot-password', { email });
};

export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<void> => {
  await client.post('/users/reset-password', {
    token,
    new_password: newPassword,
  });
};

export const getProfile = async (): Promise<UserProfile> => {
  const response = await client.get('/users/me');
  return response.data;
};

export const updateProfile = async (data: {
  nickname: string;
  birth_year: number;
  birth_month: number;
  gender: string;
}): Promise<UserProfile> => {
  const response = await client.put('/users/me', data);
  return response.data;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  await client.put('/users/me/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
};
