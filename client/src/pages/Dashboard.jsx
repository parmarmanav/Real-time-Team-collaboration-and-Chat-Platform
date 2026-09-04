import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useMessageStore from '../store/useMessageStore';
import useAuthStore from '../store/useAuthStore';
import { socket, connectSocket, disconnectSocket } from '../lib/socket';
import { Send } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { activeWorkspace, activeChannel } = useWorkspaceStore();
  const { messages, fetchMessages, addMessage, sendMessage, clearMessages, typingUsers, setTypingUser, removeTypingUser } = useMessageStore();
  const { token, user } = useAuthStore();
  const [inputValue, setInputValue] = useState('');
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel._id);
      socket.emit('join_channel', activeChannel._id);
    } else {
      clearMessages();
    }
  }, [activeChannel, fetchMessages, clearMessages]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      if (activeChannel && message.channelId === activeChannel._id) {
        addMessage(message);
        // Also remove typing status if they send a message
        removeTypingUser(message.senderId._id, message.channelId);
      }
    };
    
    const handleUserTyping = ({ userId, username, channelId }) => {
      if (activeChannel && channelId === activeChannel._id) {
        setTypingUser(userId, username, channelId);
      }
    };
    
    const handleUserStoppedTyping = ({ userId, channelId }) => {
      if (activeChannel && channelId === activeChannel._id) {
        removeTypingUser(userId, channelId);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [activeChannel, addMessage, setTypingUser, removeTypingUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (e) => {
    setInputValue(e.target.value);
    
    if (activeChannel) {
      socket.emit('typing_start', activeChannel._id);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_end', activeChannel._id);
      }, 2000); // stop typing after 2 seconds of inactivity
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (inputValue.trim() && activeChannel) {
      sendMessage(activeChannel._id, inputValue);
      setInputValue('');
      socket.emit('typing_end', activeChannel._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-700">
        {activeChannel ? (
          <>
            <div className="h-14 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm z-10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <span className="text-slate-400 mr-1">#</span>
                {activeChannel.name}
              </h2>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {messages.length === 0 ? (
                <div className="text-slate-500 text-center mt-10">
                  Welcome to the #{activeChannel.name} channel! This is the start of the conversation.
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg._id} className="flex space-x-4">
                    <div className="h-10 w-10 flex-none rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {msg.senderId?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {msg.senderId?.username}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 mt-1">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="px-6 py-2 text-sm text-slate-500 italic bg-white dark:bg-slate-700">
                {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  placeholder={`Message #${activeChannel.name}`}
                  value={inputValue}
                  onChange={handleTyping}
                  className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg pl-4 pr-12 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500"
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : !activeWorkspace ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800">
            <div className="h-16 w-16 mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xl">
              💬
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Welcome{user?.username ? `, ${user.username}` : ''}!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm mb-4 leading-relaxed">
              You are not in any workspace yet. Click the <span className="font-semibold text-blue-600 dark:text-blue-400">+</span> button on the far-left dock to <strong>Create a Workspace</strong> or <strong>Join</strong> your team with an invite code.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800">
            <div className="h-14 w-14 mb-3 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xl font-bold">
              #
            </div>
            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
              No channel selected
            </h4>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
              Pick a channel from the sidebar or click <span className="font-semibold">+</span> to create a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
