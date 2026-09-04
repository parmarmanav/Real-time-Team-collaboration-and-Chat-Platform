import { io } from 'socket.io-client';

const URL = 'http://localhost:5001';

export const socket = io(URL, {
  autoConnect: false, // We'll connect manually when we have the token
});

export const connectSocket = (token) => {
  socket.auth = { token };
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};
