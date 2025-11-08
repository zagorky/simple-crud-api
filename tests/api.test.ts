import { createAppServer } from '../src/server';
import { Server } from 'http';
import { db } from '../src/db';

describe('CRUD API Tests', () => {
  let server: Server;
  let port: number;
  let baseUrl: string;

  beforeAll((done) => {
    server = createAppServer();
    server.listen(0, () => {
      const addr = server.address();
      port = typeof addr === 'object' && addr !== null ? addr.port : 0;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    db.length = 0;
  });

  describe('Scenario 1: Full CRUD workflow', () => {
    let userId: string;

    it('1. GET /api/users should return empty array', async () => {
      const res = await fetch(`${baseUrl}/api/users`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('2. POST /api/users should create a new user', async () => {
      const newUser = {
        username: 'John Doe',
        age: 30,
        hobbies: ['reading', 'gaming'],
      };

      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toHaveProperty('id');
      expect(data.username).toBe(newUser.username);
      expect(data.age).toBe(newUser.age);
      expect(data.hobbies).toEqual(newUser.hobbies);
    });

    it('3. GET /api/users/{userId} should return created user', async () => {
      const newUser = {
        username: 'Jane Doe',
        age: 25,
        hobbies: ['coding'],
      };

      const createRes = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const createdUser = await createRes.json();
      userId = createdUser.id;

      const res = await fetch(`${baseUrl}/api/users/${userId}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(userId);
      expect(data.username).toBe(newUser.username);
    });

    it('4. PUT /api/users/{userId} should update user', async () => {
      const newUser = {
        username: 'Old Name',
        age: 20,
        hobbies: ['swimming'],
      };

      const createRes = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const createdUser = await createRes.json();
      userId = createdUser.id;

      const updatedUser = {
        username: 'New Name',
        age: 21,
        hobbies: ['running', 'cycling'],
      };

      const res = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(userId);
      expect(data.username).toBe(updatedUser.username);
      expect(data.age).toBe(updatedUser.age);
      expect(data.hobbies).toEqual(updatedUser.hobbies);
    });

    it('5. DELETE /api/users/{userId} should delete user', async () => {
      const newUser = {
        username: 'To Delete',
        age: 40,
        hobbies: [],
      };

      const createRes = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const createdUser = await createRes.json();
      userId = createdUser.id;

      const res = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);
    });

    it('6. GET /api/users/{userId} should return 404 after deletion', async () => {
      const newUser = {
        username: 'Deleted User',
        age: 35,
        hobbies: ['tennis'],
      };

      const createRes = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const createdUser = await createRes.json();
      userId = createdUser.id;

      await fetch(`${baseUrl}/api/users/${userId}`, { method: 'DELETE' });

      const res = await fetch(`${baseUrl}/api/users/${userId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Scenario 2: Validation tests', () => {
    it('should return 400 for invalid UUID', async () => {
      const res = await fetch(`${baseUrl}/api/users/invalid-uuid`);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain('Invalid userId');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidUser = {
        username: 'Test',
      };

      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUser),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain('Invalid user body');
    });

    it('should return 404 for non-existing user', async () => {
      const fakeId = '7392aec2-ff6f-46e8-8406-3d47f3d1b970';
      const res = await fetch(`${baseUrl}/api/users/${fakeId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Scenario 3: Edge cases', () => {
    it('should return 201 for user with empty hobbies array', async () => {
      const newUser = {
        username: 'No Hobbies',
        age: 28,
        hobbies: [],
      };

      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.hobbies).toEqual([]);
    });

    it('should return 400 for invalid hobbies type', async () => {
      const invalidUser = {
        username: 'Test',
        age: 25,
        hobbies: 'not-an-array',
      };

      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUser),
      });

      expect(res.status).toBe(400);
    });
  });
});
