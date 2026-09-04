const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock the User model
jest.mock('../models/User');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock that user does not exist
      User.findOne.mockResolvedValue(null);
      // Mock save to resolve
      User.prototype.save = jest.fn().mockResolvedValue({});
      // Mock the new User object structure for token generation
      User.mockImplementation(() => {
        return {
          _id: 'mocked-id',
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          save: jest.fn().mockResolvedValue({})
        };
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', 'testuser');
    });

    it('should return 400 if user already exists', async () => {
      User.findOne.mockResolvedValue({ id: 'existing-id' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists with that email or username.');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user data for a valid token', async () => {
      const token = jwt.sign({ id: 'mocked-id', username: 'testuser' }, process.env.JWT_SECRET || 'testsecret');
      
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: 'mocked-id',
          username: 'testuser',
          email: 'test@example.com'
        })
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser');
    });
  });
});
