const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const checkExpiration = require('./middlewares/checkExpiration');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Connect to the database
connectDB();

// Apply expiration middleware before post routes
app.use('/api/posts', checkExpiration);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Piazza API is running!');
});

// 404 Route
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Only listen to the port if not in a test environment
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app; // Export the app for testing
