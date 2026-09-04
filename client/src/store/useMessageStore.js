import { create } from 'zustand';
import api from '../lib/api';
import { socket } from '../lib/socket';

const useMessageStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  typingUsers: [], // Array of { userId, username, channelId }

  fetchMessages: async (channelId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/messages/channel/${channelId}`);
      set({ messages: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch messages', error);
      set({ isLoading: false });
    }
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  sendMessage: (channelId, content) => {
    socket.emit('send_message', { channelId, content });
  },

  setTypingUser: (userId, username, channelId) => {
    set((state) => {
      const existing = state.typingUsers.find(u => u.userId === userId && u.channelId === channelId);
      if (existing) return state;
      return { typingUsers: [...state.typingUsers, { userId, username, channelId }] };
    });
  },

  removeTypingUser: (userId, channelId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter(u => !(u.userId === userId && u.channelId === channelId))
    }));
  },

  clearMessages: () => set({ messages: [], typingUsers: [] }),
}));

export default useMessageStore;
