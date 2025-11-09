import request from 'supertest';
import { createServer } from 'http';
import { addHandler } from '../src/server';

describe('API Tests', () => {
  let server: ReturnType<typeof createServer>;
  let createdUserId: string;
  const baseUrl = '/api/users';
  const testUser = {
    username: 'testuser',
    age: 25,
    hobbies: ['reading', 'gaming'],
  };
  const updatedUser = {
    username: 'updateduser',
    age: 26,
    hobbies: ['swimming'],
  };

  beforeAll((done) => {
    process.env.NODE_ENV = 'test';
    server = createServer((req, res) => addHandler(req, res));
    server.listen(0, () => {
      const address = server.address();
      process.env.PORT = (address && typeof address === 'object' ? address.port : 0).toString();
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('should return empty array when no users exist', async () => {
    if (!server) throw new Error('Server not initialized');
    const response = await request(server).get(baseUrl);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('should create a new user', async () => {
    const response = await request(server).post(baseUrl).send(testUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(testUser.username);
    expect(response.body.age).toBe(testUser.age);
    expect(response.body.hobbies).toEqual(testUser.hobbies);

    createdUserId = response.body.id;
  });

  it('should get user by ID', async () => {
    const response = await request(server).get(`${baseUrl}/${createdUserId}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdUserId);
    expect(response.body.username).toBe(testUser.username);
  });

  it('should update user', async () => {
    const response = await request(server).put(`${baseUrl}/${createdUserId}`).send(updatedUser);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdUserId);
    expect(response.body.username).toBe(updatedUser.username);
    expect(response.body.age).toBe(updatedUser.age);
    expect(response.body.hobbies).toEqual(updatedUser.hobbies);
  });

  it('should delete user', async () => {
    const response = await request(server).delete(`${baseUrl}/${createdUserId}`);
    expect(response.status).toBe(204);
  });

  it('should return 404 when getting deleted user', async () => {
    const response = await request(server).get(`${baseUrl}/${createdUserId}`);
    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid user ID format', async () => {
    const response = await request(server).get(`${baseUrl}/invalid-id`);
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid user data on create', async () => {
    const response = await request(server).post(baseUrl).send({ invalid: 'data' });

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent endpoint', async () => {
    const response = await request(server).get('/api/nonexistent');
    expect(response.status).toBe(404);
  });
});
