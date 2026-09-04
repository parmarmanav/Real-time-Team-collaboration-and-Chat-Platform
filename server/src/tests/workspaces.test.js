const request = require('supertest');
const app = require('../app');
const Workspace = require('../models/Workspace');
const Channel = require('../models/Channel');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../models/Workspace');
jest.mock('../models/Channel');
jest.mock('../models/User');

// Mock prisma to avoid postgres connection error during tests
jest.mock('../config/prisma', () => ({
  auditLog: {
    create: jest.fn().mockResolvedValue({})
  }
}));

describe('Workspaces API', () => {
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ id: 'user-id', username: 'testuser' }, process.env.JWT_SECRET || 'testsecret');
  });

  describe('POST /api/workspaces', () => {
    it('should create a workspace and a default channel', async () => {
      // Mock workspace creation
      Workspace.mockImplementation(() => ({
        _id: 'workspace-id',
        name: 'My Workspace',
        save: jest.fn().mockResolvedValue({})
      }));
      
      // Mock channel creation
      Channel.mockImplementation(() => ({
        _id: 'channel-id',
        name: 'general',
        save: jest.fn().mockResolvedValue({})
      }));

      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Workspace' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Workspace created successfully');
      expect(response.body).toHaveProperty('workspace');
      expect(response.body).toHaveProperty('defaultChannel');
    });
  });
});
