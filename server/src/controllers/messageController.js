const Message = require('../models/Message');
const Channel = require('../models/Channel');

exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { cursor, limit = 50 } = req.query; // For infinite scroll

    // Optional: check if user has access to channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (channel.type === 'private' && !channel.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { channelId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Newest first for pagination
      .limit(parseInt(limit))
      .populate('senderId', 'username avatarUrl status');

    // Reverse to send oldest first in the page
    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages.' });
  }
};
