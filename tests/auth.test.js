const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let token;

beforeAll(async () => {
    // Register user
    const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password1234',
        });

    // Login user
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
            email: 'testuser@example.com',
            password: 'password1234',
        });

    token = loginRes.body.token;
});

describe('User Authentication', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'newuser@example.com',
                password: 'password1234',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('User registered successfully');
        expect(res.body.token).toBeDefined();
    });

    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'password1234',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Login successful');
        expect(res.body.token).toBeDefined();
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});
