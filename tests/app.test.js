process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

beforeAll(async () => {
});

describe('App Routes', () => {
    it('should return a welcome message for the root route', async () => {
        const res = await request(app).get('/');
        
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('Piazza API is running!');
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});
