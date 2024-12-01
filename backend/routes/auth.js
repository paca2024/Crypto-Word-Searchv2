const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login user
router.post('/login', async (req, res) => {
    try {
        const { telegramId } = req.body;

        if (!telegramId) {
            return res.status(400).json({ message: 'Telegram ID is required' });
        }

        // Find or create user
        let user = await User.findOne({ telegramId });
        
        if (!user) {
            try {
                user = await User.create({ telegramId });
            } catch (createError) {
                // Handle potential race condition
                if (createError.code === 11000) { // Duplicate key error
                    user = await User.findOne({ telegramId });
                } else {
                    throw createError;
                }
            }
        }

        if (!user) {
            return res.status(500).json({ message: 'Failed to create or find user' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                telegramId: user.telegramId
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '7d' }
        );

        res.json({ 
            token,
            user: {
                id: user._id,
                telegramId: user.telegramId
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

module.exports = router;
