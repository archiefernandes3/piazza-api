const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let token;
let activePostId;
let expiredPostId;

beforeAll(async () => {
    // Register a user
    const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Post User',
            email: 'postuser@example.com',
            password: 'password123',
        });

    // Login the user
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
            email: 'postuser@example.com',
            password: 'password123',
        });

    token = loginRes.body.token;
});

describe('Post Operations', () => {
    // Test: Create an active post
    it('should create an active post', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Active Post',
                topic: 'Tech',
                body: 'This is an active post.',
                status: 'Live',
                expirationTime: new Date(Date.now() + 3600000), // 1 hour from now
            });

        activePostId = res.body._id;

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('Live');
    });

    // Test: Like an active post
    it('should like an active post', async () => {
        const res = await request(app)
            .put(`/api/posts/${activePostId}/like`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
    });

    // Test: Dislike an active post
    it('should dislike an active post', async () => {
        const res = await request(app)
            .put(`/api/posts/${activePostId}/dislike`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.dislikes).toBe(1);
    });

    // Test: Comment on an active post
    it('should comment on an active post', async () => {
        const res = await request(app)
            .post(`/api/posts/${activePostId}/comment`)
            .set('Authorization', `Bearer ${token}`)
            .send({ message: 'Great post!' });

        expect(res.statusCode).toBe(200);
        expect(res.body.comments[0].message).toBe('Great post!');
    });

    // Test: Create an expired post
    it('should create an expired post', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Expired Post',
                topic: 'Tech',
                body: 'This post has already expired.',
                status: 'Expired',
                expirationTime: new Date(Date.now() - 3600000), // 1 hour ago
            });

        expiredPostId = res.body._id;

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('Expired');
    });

    // Test: Get all posts by topic
    it('should get all posts by topic', async () => {
        const res = await request(app)
            .get('/api/posts/Tech')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
    });

    // Test: Get expired posts by topic
    it('should get expired posts by topic', async () => {
        const res = await request(app)
            .get('/api/posts/expired/Tech')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
    });

    // Test: Get the most active post by topic
    it('should get the most active post by topic', async () => {
        const res = await request(app)
            .get('/api/posts/most-active/Tech')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Active Post'); // Expecting the 'Active Post' to be the most active
    });
});

afterAll(async () => {
    console.log('Running afterAll for post tests');
    await mongoose.connection.close();
});
