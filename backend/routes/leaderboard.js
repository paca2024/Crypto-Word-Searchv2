const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/Leaderboard');
const auth = require('../middleware/auth');

// Extremely verbose logging middleware
const requestLogger = (req, res, next) => {
    console.log('=== DETAILED REQUEST LOGGING ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Full Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Raw Body:', JSON.stringify(req.body, null, 2));
    console.log('Authentication User:', JSON.stringify(req.user, null, 2));
    console.log('IP Address:', req.ip);
    console.log('Request Origin:', req.get('origin'));
    next();
};

// Submit a new score
router.post('/submit', [auth, requestLogger], async (req, res) => {
    console.log('=== SCORE SUBMISSION START ===');
    console.log('Full Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Authenticated User:', JSON.stringify(req.user, null, 2));

    try {
        // Extremely defensive checks
        if (!req.user) {
            console.error('CRITICAL: No user found in request');
            return res.status(401).json({ 
                error: 'AUTH_FAILED',
                message: 'Authentication failed - no user information', 
                details: 'Request missing authenticated user context' 
            });
        }

        // Destructure with maximum defensive programming
        const { 
            score = null, 
            timeElapsed = null, 
            wordsFound = null, 
            totalWords = null, 
            foundHiddenWord = null,
            gameDate = new Date()
        } = req.body;

        console.log('=== INPUT VALIDATION DETAILS ===');
        console.log('Raw Input Types:', {
            score: { value: score, type: typeof score },
            timeElapsed: { value: timeElapsed, type: typeof timeElapsed },
            wordsFound: { value: wordsFound, type: typeof wordsFound },
            totalWords: { value: totalWords, type: typeof totalWords },
            foundHiddenWord: { value: foundHiddenWord, type: typeof foundHiddenWord },
            gameDate: { value: gameDate, type: typeof gameDate }
        });

        // Ultra-defensive number validation
        const safeParseNumber = (value, fieldName, defaultValue = 0) => {
            console.log(`Parsing ${fieldName}:`, { input: value, type: typeof value });
            
            // Handle null/undefined
            if (value === null || value === undefined) {
                console.warn(`${fieldName} is null/undefined. Using default.`);
                return defaultValue;
            }

            // If it's already a valid number, return it
            if (typeof value === 'number' && !isNaN(value)) {
                return value;
            }

            // Try parsing
            const parsed = Number(value);
            
            if (isNaN(parsed)) {
                console.error(`CRITICAL: Cannot parse ${fieldName}. Input:`, value);
                return defaultValue;
            }

            return parsed;
        };

        // Validate and convert all numeric inputs
        const validatedScore = safeParseNumber(score, 'score');
        const validatedTimeElapsed = safeParseNumber(timeElapsed, 'timeElapsed');
        const validatedWordsFound = safeParseNumber(wordsFound, 'wordsFound');
        const validatedTotalWords = safeParseNumber(totalWords, 'totalWords');

        // Ensure user data is complete with extreme prejudice
        if (!req.user.userId || !req.user.telegramId) {
            console.error('CRITICAL: Incomplete user data', {
                userId: req.user.userId,
                telegramId: req.user.telegramId,
                fullUser: req.user
            });
            return res.status(400).json({ 
                error: 'USER_DATA_INCOMPLETE',
                message: 'Invalid user data',
                details: 'Missing userId or telegramId' 
            });
        }

        // Prepare leaderboard entry with maximum validation
        const leaderboardEntry = new Leaderboard({
            userId: req.user.userId,
            telegramId: req.user.telegramId,
            score: validatedScore,
            timeElapsed: validatedTimeElapsed,
            wordsFound: validatedWordsFound,
            totalWords: validatedTotalWords,
            foundHiddenWord: !!foundHiddenWord,
            gameDate: gameDate instanceof Date ? gameDate : new Date(gameDate)
        });

        console.log('Prepared Leaderboard Entry:', JSON.stringify(leaderboardEntry, null, 2));

        // Validate document with comprehensive error reporting
        try {
            const validationError = leaderboardEntry.validateSync();
            if (validationError) {
                console.error('MONGOOSE VALIDATION ERROR:', {
                    name: validationError.name,
                    message: validationError.message,
                    errors: Object.entries(validationError.errors).map(([path, error]) => ({
                        path,
                        message: error.message,
                        kind: error.kind,
                        value: error.value
                    }))
                });
                return res.status(400).json({
                    error: 'VALIDATION_FAILED',
                    message: 'Validation failed',
                    details: Object.values(validationError.errors).map(err => err.message)
                });
            }
        } catch (validationCatchError) {
            console.error('UNEXPECTED VALIDATION ERROR:', validationCatchError);
            return res.status(500).json({
                error: 'UNEXPECTED_VALIDATION_ERROR',
                message: 'Unexpected error during validation',
                details: validationCatchError.message
            });
        }

        // Save entry with comprehensive error handling
        try {
            const savedEntry = await leaderboardEntry.save();
            console.log('=== SCORE SUBMISSION SUCCESS ===', {
                savedEntryId: savedEntry._id,
                score: savedEntry.score
            });
            res.status(201).json(savedEntry);
        } catch (saveError) {
            console.error('SAVE ERROR:', {
                name: saveError.name,
                message: saveError.message,
                code: saveError.code,
                stack: saveError.stack
            });
            res.status(500).json({ 
                error: 'SAVE_FAILED',
                message: 'Failed to save score', 
                details: saveError.message 
            });
        }
    } catch (unexpectedError) {
        console.error('=== CATASTROPHIC UNEXPECTED ERROR ===', {
            name: unexpectedError.name,
            message: unexpectedError.message,
            stack: unexpectedError.stack,
            fullError: unexpectedError
        });

        res.status(500).json({ 
            error: 'UNEXPECTED_SERVER_ERROR',
            message: 'Unexpected error submitting score', 
            details: unexpectedError.message,
            stack: unexpectedError.stack
        });
    }
});

// Get top scores (default last 24 hours)
router.get('/top', async (req, res) => {
    try {
        const { period = 'daily', limit = 10 } = req.query;
        
        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case 'daily':
                dateFilter = {
                    gameDate: {
                        $gte: new Date(now.setDate(now.getDate() - 1))
                    }
                };
                break;
            case 'weekly':
                dateFilter = {
                    gameDate: {
                        $gte: new Date(now.setDate(now.getDate() - 7))
                    }
                };
                break;
            case 'monthly':
                dateFilter = {
                    gameDate: {
                        $gte: new Date(now.setMonth(now.getMonth() - 1))
                    }
                };
                break;
            case 'all':
                dateFilter = {};
                break;
            default:
                dateFilter = {
                    gameDate: {
                        $gte: new Date(now.setDate(now.getDate() - 1))
                    }
                };
        }

        const topScores = await Leaderboard.find(dateFilter)
            .sort({ score: -1, timeElapsed: 1 })
            .limit(parseInt(limit))
            .select('telegramId score timeElapsed wordsFound totalWords foundHiddenWord gameDate');

        res.json(topScores);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
    }
});

// Get user's personal best scores
router.get('/personal', auth, async (req, res) => {
    try {
        const userScores = await Leaderboard.find({ userId: req.user.userId })
            .sort({ score: -1, timeElapsed: 1 })
            .limit(5)
            .select('score timeElapsed wordsFound totalWords foundHiddenWord gameDate');

        res.json(userScores);
    } catch (error) {
        console.error('Error fetching personal scores:', error);
        res.status(500).json({ message: 'Error fetching personal scores', error: error.message });
    }
});

// Get user's rank
router.get('/rank', auth, async (req, res) => {
    try {
        const { period = 'daily' } = req.query;
        
        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case 'daily':
                dateFilter = {
                    gameDate: {
                        $gte: new Date(now.setDate(now.getDate() - 1))
                    }
                };
                break;
            case 'weekly':
                dateFilter = {
                    gameDate: {
                        $gte: new Date(now.setDate(now.getDate() - 7))
                    }
                };
                break;
            case 'monthly':
                dateFilter = {
                    gameDate: {
                        $gte: new Date(now.setMonth(now.getMonth() - 1))
                    }
                };
                break;
            default:
                dateFilter = {
                    gameDate: {
                        $gte: new Date(now.setDate(now.getDate() - 1))
                    }
                };
        }

        // Get user's best score for the period
        const userBestScore = await Leaderboard.findOne({
            userId: req.user.userId,
            ...dateFilter
        }).sort({ score: -1 });

        if (!userBestScore) {
            return res.json({ rank: null, totalPlayers: 0 });
        }

        // Count players with better scores
        const betterScores = await Leaderboard.countDocuments({
            ...dateFilter,
            score: { $gt: userBestScore.score }
        });

        // Count total players
        const totalPlayers = await Leaderboard.countDocuments(dateFilter);

        res.json({
            rank: betterScores + 1,
            totalPlayers,
            bestScore: userBestScore
        });
    } catch (error) {
        console.error('Error fetching rank:', error);
        res.status(500).json({ message: 'Error fetching rank', error: error.message });
    }
});

module.exports = router;
