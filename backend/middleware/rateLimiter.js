const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs for auth routes
    message: 'Too many login attempts, please try again later'
});

const gameLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs for game routes
    message: 'Too many requests, please slow down'
});

module.exports = {
    authLimiter,
    gameLimiter
};
