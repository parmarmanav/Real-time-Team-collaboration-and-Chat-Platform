import React, { useEffect, useState } from 'react';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import { Plus, Hash, LogOut, Copy, Check, UserPlus } from 'lucide-react';

const Sidebar = () => {
  const {
    workspaces,
    activeWorkspace,
    channels,
    activeChannel,
    fetchWorkspaces,
    setActiveWorkspace,
    setActiveChannel,
    createWorkspace,
    joinWorkspace,
    createChannel
  } = useWorkspaceStore();
  const { logout, user } = useAuthStore();
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaceModalTab, setWorkspaceModalTab] = useState('create'); // 'create' | 'join'
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [workspaceJoinId, setWorkspaceJoinId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);

  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      await createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setShowWorkspaceModal(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!workspaceJoinId.trim()) return;
    try {
      await joinWorkspace(workspaceJoinId);
      setWorkspaceJoinId('');
      setShowWorkspaceModal(false);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join workspace. Verify the ID.');
    }
  };

  const handleCopyWorkspaceId = () => {
    if (!activeWorkspace) return;
    navigator.clipboard.writeText(activeWorkspace._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (newChannelName.trim() && activeWorkspace) {
      await createChannel(activeWorkspace._id, newChannelName);
      setNewChannelName('');
      setShowNewChannel(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Workspace List (Darkest) */}
      <div className="w-16 flex-none bg-slate-900 py-4 flex flex-col items-center space-y-4">
        {workspaces.map((ws) => (
          <button
            key={ws._id}
            onClick={() => setActiveWorkspace(ws)}
            className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg transition-all ${
              activeWorkspace?._id === ws._id
                ? 'bg-blue-600 rounded-lg'
                : 'bg-slate-700 hover:bg-slate-600 hover:rounded-lg'
            }`}
            title={ws.name}
          >
            {ws.name.charAt(0).toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => {
            setWorkspaceModalTab('create');
            setJoinError('');
            setShowWorkspaceModal(true);
          }}
          className="h-12 w-12 rounded-xl flex items-center justify-center text-green-400 bg-slate-800 hover:bg-slate-700 hover:rounded-lg transition-all"
          title="Add or Join Workspace"
        >
          <Plus className="h-6 w-6" />
        </button>

        <div className="flex-1" />
        <button
          onClick={logout}
          className="h-12 w-12 rounded-xl flex items-center justify-center text-red-400 hover:bg-slate-800 transition-all"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Channel List (Dark) */}
      <div className="w-60 flex-none bg-slate-800 flex flex-col text-slate-300">
        {activeWorkspace ? (
          <>
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-900 shadow-sm">
              <span className="font-bold text-white truncate max-w-[130px]" title={activeWorkspace.name}>
                {activeWorkspace.name}
              </span>
              <button
                onClick={handleCopyWorkspaceId}
                className="flex items-center space-x-1 px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                title="Copy Workspace ID to share with teammates"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-green-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-300" />
                    <span>Invite</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 mb-2 flex items-center justify-between group">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Channels
                </span>
                <button
                  onClick={() => setShowNewChannel(true)}
                  className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                  title="Create Channel"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-0.5 px-2">
                {channels.map((channel) => (
                  <button
                    key={channel._id}
                    onClick={() => setActiveChannel(channel)}
                    className={`w-full flex items-center px-2 py-1.5 rounded-md transition-colors ${
                      activeChannel?._id === channel._id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-700 hover:text-slate-100'
                    }`}
                  >
                    <Hash className="h-4 w-4 mr-2 opacity-70" />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-slate-400 text-xs">
            <p className="mb-2">No workspace selected</p>
            <button
              onClick={() => {
                setWorkspaceModalTab('join');
                setJoinError('');
                setShowWorkspaceModal(true);
              }}
              className="text-blue-400 hover:underline"
            >
              Join a workspace
            </button>
          </div>
        )}
      </div>

      {/* Modal for Creating or Joining Workspace */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
            {/* Tabs */}
            <div className="flex border-b border-slate-700 mb-5">
              <button
                type="button"
                onClick={() => { setWorkspaceModalTab('create'); setJoinError(''); }}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                  workspaceModalTab === 'create'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Workspace
              </button>
              <button
                type="button"
                onClick={() => { setWorkspaceModalTab('join'); setJoinError(''); }}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                  workspaceModalTab === 'join'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Join with Code
              </button>
            </div>

            {workspaceModalTab === 'create' ? (
              <form onSubmit={handleCreateWorkspace}>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                  Workspace Name
                </label>
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Acme Corp, Engineering, Project Delta"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowWorkspaceModal(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newWorkspaceName.trim()}
                    className="bg-blue-600 disabled:opacity-50 px-4 py-2 text-sm rounded-lg text-white font-medium hover:bg-blue-500"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleJoinWorkspace}>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                  Workspace ID / Invite Code
                </label>
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Paste Workspace ID here..."
                  value={workspaceJoinId}
                  onChange={(e) => setWorkspaceJoinId(e.target.value)}
                />
                {joinError && (
                  <p className="text-red-400 text-xs mb-3">{joinError}</p>
                )}
                <p className="text-slate-400 text-xs mb-4">
                  Ask your team owner to click the <strong>Invite</strong> button in their workspace header and share the code.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowWorkspaceModal(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!workspaceJoinId.trim()}
                    className="bg-blue-600 disabled:opacity-50 px-4 py-2 text-sm rounded-lg text-white font-medium hover:bg-blue-500"
                  >
                    Join Workspace
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showNewChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96 shadow-xl">
            <h3 className="text-white text-lg font-bold mb-4">Create Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <input
                type="text"
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mb-4"
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowNewChannel(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-500">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
