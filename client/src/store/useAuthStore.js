import { create } from 'zustand';
import api from '../lib/api';
import useWorkspaceStore from './useWorkspaceStore';
import useMessageStore from './useMessageStore';
import { disconnectSocket } from '../lib/socket';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      useWorkspaceStore.getState().resetWorkspaceStore();
      useMessageStore.getState().clearMessages();
      set({ user, token, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      return false;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      useWorkspaceStore.getState().resetWorkspaceStore();
      useMessageStore.getState().clearMessages();
      set({ user, token, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    useWorkspaceStore.getState().resetWorkspaceStore();
    useMessageStore.getState().clearMessages();
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/auth/profile');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export default useAuthStore;
