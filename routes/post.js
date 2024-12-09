const express = require('express');
const Post = require('../models/Post');
const auth = require('../middlewares/auth');
const checkExpiration = require('../middlewares/checkExpiration');
const router = express.Router();

// Middleware to check and update expired posts
router.use(checkExpiration);

// Create a new post
router.post('/', auth, async (req, res) => {
    const { title, topics, body, expirationTime } = req.body;

    try {
        // Validate expiration time
        if (new Date(expirationTime) <= new Date()) {
            return res.status(400).json({ message: 'Expiration time must be in the future.' });
        }

        const post = new Post({
            title,
            topics,
            body,
            expirationTime,
            createdBy: req.user.id,
        });

        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all posts by topics
router.get('/topics/:topics', async (req, res) => {
    const { topics } = req.params;

    try {
        const posts = await Post.find({ topics: { $in: [topics] } }).populate('createdBy', 'name');
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Like a post
router.put('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || post.status === 'Expired') {
            return res.status(400).json({ message: 'Post not found or expired.' });
        }

        // Restrict liking own post
        if (post.createdBy.toString() === req.user.id) {
            return res.status(403).json({ message: 'You cannot like your own post.' });
        }

        post.likes += 1;
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Dislike a post
router.put('/:id/dislike', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || post.status === 'Expired') {
            return res.status(400).json({ message: 'Post not found or expired.' });
        }

        if (post.createdBy.toString() === req.user.id) {
            return res.status(403).json({ message: 'You cannot dislike your own post.' });
        }

        post.dislikes += 1;
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Comment on a post
router.post('/:id/comment', auth, async (req, res) => {
    const { message } = req.body;

    try {
        const post = await Post.findById(req.params.id);
        if (!post || new Date() > new Date(post.expirationTime)) {
            return res.status(400).json({ message: 'Post not found or expired.' });
        }

        if (post.createdBy.toString() === req.user.id) {
            return res.status(403).json({ message: 'You cannot comment on your own post.' });
        }

        post.comments.push({
            user: req.user.id,
            message,
        });

        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Fetch expired posts by topic
router.get('/expired/:topic', auth, async (req, res) => {
    const { topic } = req.params;

    try {
        const expiredPosts = await Post.find({ topic, status: 'Expired' });
        res.status(200).json(expiredPosts);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Fetch the most active post for a topic
router.get('/most-active/:topic', async (req, res) => {
    const { topic } = req.params;

    try {
        const mostActivePost = await Post.aggregate([
            {
                $match: {
                    topics: topic,
                    status: 'Live',
                }
            },
            {
                $addFields: {
                    interest: { $add: ['$likes', '$dislikes'] } 
                }
            },
            {
                $sort: { interest: -1, createdAt: -1 }
            },
            {
                $limit: 1
            }
        ]);

        if (!mostActivePost || mostActivePost.length === 0) {
            return res.status(404).json({ message: 'No active posts found for this topic.' });
        }

        res.status(200).json(mostActivePost[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching most active post', error: err.message });
    }
});

module.exports = router;
