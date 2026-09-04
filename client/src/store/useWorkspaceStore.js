import { create } from 'zustand';
import api from '../lib/api';

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  channels: [],
  activeChannel: null,
  isLoading: false,

  resetWorkspaceStore: () => {
    set({
      workspaces: [],
      activeWorkspace: null,
      channels: [],
      activeChannel: null,
      isLoading: false,
    });
  },

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/workspaces');
      const fetchedWorkspaces = response.data || [];
      const currentActive = get().activeWorkspace;

      // Ensure active workspace belongs to the fetched workspaces of the current user
      const stillValid = fetchedWorkspaces.find((ws) => ws._id === currentActive?._id);
      const nextActive = stillValid || (fetchedWorkspaces.length > 0 ? fetchedWorkspaces[0] : null);

      set({
        workspaces: fetchedWorkspaces,
        activeWorkspace: nextActive,
        isLoading: false,
      });

      if (nextActive) {
        get().fetchChannels(nextActive._id);
      } else {
        set({ channels: [], activeChannel: null });
      }
    } catch (error) {
      console.error('Failed to fetch workspaces', error);
      set({
        workspaces: [],
        activeWorkspace: null,
        channels: [],
        activeChannel: null,
        isLoading: false,
      });
    }
  },

  createWorkspace: async (name) => {
    try {
      const response = await api.post('/workspaces', { name });
      set((state) => ({ workspaces: [...state.workspaces, response.data.workspace] }));
      get().setActiveWorkspace(response.data.workspace);
      return response.data.workspace;
    } catch (error) {
      console.error('Failed to create workspace', error);
      throw error;
    }
  },

  joinWorkspace: async (workspaceId) => {
    try {
      const cleanId = workspaceId.trim();
      const response = await api.post(`/workspaces/${cleanId}/join`);
      const joinedWorkspace = response.data.workspace;
      set((state) => {
        const exists = state.workspaces.some((ws) => ws._id === joinedWorkspace._id);
        return {
          workspaces: exists ? state.workspaces : [...state.workspaces, joinedWorkspace],
        };
      });
      get().setActiveWorkspace(joinedWorkspace);
      return joinedWorkspace;
    } catch (error) {
      console.error('Failed to join workspace', error);
      throw error;
    }
  },

  setActiveWorkspace: (workspace) => {
    set({ activeWorkspace: workspace, activeChannel: null });
    if (workspace) {
      get().fetchChannels(workspace._id);
    }
  },

  fetchChannels: async (workspaceId) => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/channels`);
      set({ channels: response.data });
      if (response.data.length > 0) {
        set({ activeChannel: response.data[0] });
      }
    } catch (error) {
      console.error('Failed to fetch channels', error);
    }
  },

  createChannel: async (workspaceId, name, description = '', type = 'public') => {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/channels`, { name, description, type });
      set((state) => ({ channels: [...state.channels, response.data.channel] }));
      set({ activeChannel: response.data.channel });
      return response.data.channel;
    } catch (error) {
      console.error('Failed to create channel', error);
      throw error;
    }
  },

  setActiveChannel: (channel) => {
    set({ activeChannel: channel });
  }
}));

export default useWorkspaceStore;
