const Workspace = require('../models/Workspace');
const Channel = require('../models/Channel');
const prisma = require('../config/prisma');

// Create a new workspace
exports.createWorkspace = async (req, res) => {
  try {
    const { name, iconUrl } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required.' });
    }

    const newWorkspace = new Workspace({
      name,
      iconUrl,
      ownerId: userId,
      members: [userId]
    });
    await newWorkspace.save();

    // Create a default 'general' channel
    const defaultChannel = new Channel({
      workspaceId: newWorkspace._id,
      name: 'general',
      description: 'General discussion',
      type: 'public',
      members: [userId]
    });
    await defaultChannel.save();

    // Audit Log for Workspace Creation
    try {
      await prisma.auditLog.create({
        data: {
          eventType: 'WORKSPACE_CREATED',
          userId: userId.toString(),
          workspaceId: newWorkspace._id.toString(),
          details: { name: newWorkspace.name }
        }
      });
    } catch (auditErr) {
      console.warn('Audit log failed (Postgres may be down):', auditErr.message);
    }

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace: newWorkspace,
      defaultChannel
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Server error creating workspace.' });
  }
};

// Get workspaces for current user
exports.getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    const workspaces = await Workspace.find({ members: userId }).populate('ownerId', 'username avatarUrl');
    res.status(200).json(workspaces);
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Server error fetching workspaces.' });
  }
};

// Join a workspace (simplified for this demo)
exports.joinWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found.' });
    }

    if (workspace.members.includes(userId)) {
      return res.status(400).json({ message: 'User already in workspace.' });
    }

    workspace.members.push(userId);
    await workspace.save();

    // Audit Log for User Joined
    try {
      await prisma.auditLog.create({
        data: {
          eventType: 'USER_JOINED',
          userId: userId.toString(),
          workspaceId: workspace._id.toString(),
          details: { action: 'join_workspace' }
        }
      });
    } catch (auditErr) {
      console.warn('Audit log failed (Postgres may be down):', auditErr.message);
    }

    res.status(200).json({ message: 'Joined workspace successfully', workspace });
  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({ message: 'Server error joining workspace.' });
  }
};

// Get channels for a workspace
exports.getWorkspaceChannels = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Check if user is a member of the workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Return public channels or private ones the user is a member of
    const channels = await Channel.find({
      workspaceId,
      $or: [
        { type: 'public' },
        { type: 'private', members: req.user.id }
      ]
    });

    res.status(200).json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ message: 'Server error fetching channels.' });
  }
};

// Create a new channel
exports.createChannel = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, type } = req.body;
    const userId = req.user.id;

    // Must be a workspace member to create a channel
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.members.includes(userId)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const newChannel = new Channel({
      workspaceId,
      name,
      description,
      type: type || 'public',
      members: [userId] // Creator is added by default
    });
    
    await newChannel.save();

    // Audit Log for Channel Creation
    try {
      await prisma.auditLog.create({
        data: {
          eventType: 'CHANNEL_CREATED',
          userId: userId.toString(),
          workspaceId: workspaceId.toString(),
          details: { channelId: newChannel._id.toString(), name: newChannel.name }
        }
      });
    } catch (auditErr) {
      console.warn('Audit log failed (Postgres may be down):', auditErr.message);
    }

    res.status(201).json({ message: 'Channel created', channel: newChannel });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ message: 'Server error creating channel.' });
  }
};
