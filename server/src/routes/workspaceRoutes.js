const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getUserWorkspaces);
router.post('/:workspaceId/join', workspaceController.joinWorkspace);

// Channels within a workspace
router.get('/:workspaceId/channels', workspaceController.getWorkspaceChannels);
router.post('/:workspaceId/channels', workspaceController.createChannel);

module.exports = router;
