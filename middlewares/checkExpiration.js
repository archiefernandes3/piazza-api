const Post = require('../models/Post');

const checkExpiration = async (req, res, next) => {
    try {
        const now = new Date();

        await Post.updateMany(
            { expirationTime: { $lt: now }, status: 'Live' },
            { $set: { status: 'Expired' } }
        );

        next();
    } catch (err) {
        res.status(500).json({ message: 'Error updating expired posts', error: err.message });
    }
};

module.exports = checkExpiration;
