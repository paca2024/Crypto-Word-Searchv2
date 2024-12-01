const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Game = require('../models/Game');
const Score = require('../models/Score');
const GridGenerator = require('../utils/gridGenerator');
const cryptoWords = require('../config/wordLists');
const auth = require('../middleware/auth');

// Helper function to generate a unique, high-entropy seed for a user
function generateUserSpecificSeed(userId, gameNumber, today, browserFingerprint) {
    // Combine multiple entropy sources, including browser fingerprint
    const entropy = [
        userId,
        gameNumber.toString(),
        today,
        Date.now().toString(),
        process.pid.toString(),
        browserFingerprint || crypto.randomBytes(16).toString('hex'),
        crypto.randomBytes(16).toString('hex')  // Additional randomness
    ];

    // Create a high-entropy seed using SHA-512
    return crypto.createHash('sha512')
        .update(entropy.join('|'))
        .digest('hex');
}

// Get current game route
router.get('/current', auth, async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const gameNumber = now.getHours() < 12 ? 1 : 2;

        // Extract browser fingerprint from request headers or generate one
        const browserFingerprint = req.headers['x-browser-fingerprint'] || 
            crypto.createHash('md5')
                .update(req.headers['user-agent'] || crypto.randomBytes(16).toString('hex'))
                .digest('hex');

        // Check if user has already played this game
        const existingScore = await Score.findOne({
            userId: req.user.userId,
            date: today,
            gameNumber
        });

        if (existingScore) {
            return res.status(403).json({ 
                message: 'You have already played this game. Please wait for the next game.',
                nextGameTime: gameNumber === 1 ? 
                    new Date(today.getTime() + 12 * 60 * 60 * 1000) : // 12 hours for game 1
                    new Date(today.getTime() + 24 * 60 * 60 * 1000)   // 24 hours for game 2
            });
        }

        // Get today's words (same for all users)
        const { selectedWords, hiddenWord } = getTodaysWords(gameNumber);
        const allWords = [...selectedWords, hiddenWord];

        // Generate a unique, high-entropy seed for this user and browser
        const todayString = today.toISOString().split('T')[0];
        const userSeed = generateUserSpecificSeed(
            req.user.userId, 
            gameNumber, 
            todayString, 
            browserFingerprint
        );

        console.log(`Game Generation Context:
        - User ID: ${req.user.userId}
        - Game Number: ${gameNumber}
        - Date: ${todayString}
        - Browser Fingerprint: ${browserFingerprint}
        - Generated Seed: ${userSeed}
        - Words: ${allWords.join(', ')}
        `);

        // Create a new GridGenerator with user and browser-specific seed
        const gridGen = new GridGenerator(12, userSeed);
        const { grid, placedWords } = gridGen.generateGrid(allWords);

        // Create game data
        const gameData = {
            date: today,
            gameNumber,
            grid,
            difficulty: getDifficulty(gameNumber),
            words: selectedWords.map(word => ({
                word,
                points: calculateWordPoints(word)
            })),
            browserFingerprint: browserFingerprint,
            debug: {
                seed: userSeed,
                placedWords: placedWords
            }
        };

        res.json(gameData);
    } catch (error) {
        console.error('Error getting current game:', error);
        res.status(500).json({ message: 'Error getting current game', error: error.message });
    }
});

// Helper function to get today's words
function getTodaysWords(gameNumber) {
    const difficulty = getDifficulty(gameNumber);
    
    // Fixed word sets for each game
    const words = {
        1: [ // Game 1 (Easy)
            'BITCOIN',
            'ETHEREUM',
            'WALLET',
            'MINING',
            'TOKEN',
            'BLOCK',
            'COIN',
            'HASH',
            'KEY',
            'NODE'
        ],
        2: [ // Game 2 (Medium)
            'BLOCKCHAIN',
            'CRYPTOGRAPHY',
            'ALTCOIN',
            'BINANCE',
            'STAKING',
            'DEFI',
            'METAMASK',
            'LEDGER',
            'PROTOCOL',
            'EXCHANGE'
        ]
    };

    // Get hidden word using today's date
    const today = new Date().toISOString().split('T')[0];
    const seed = parseInt(today.replace(/-/g, '') + gameNumber);
    const hiddenWords = cryptoWords.hiddenWords[difficulty];
    const hiddenWordIndex = seed % hiddenWords.length;
    const hiddenWord = hiddenWords[hiddenWordIndex];

    return {
        selectedWords: words[gameNumber],
        hiddenWord
    };
}

function getDifficulty(gameNumber) {
    return gameNumber === 1 ? 'easy' : 'medium';
}

function calculateWordPoints(word) {
    const basePoints = 100;
    const lengthBonus = Math.max(0, word.length - 4) * 20;
    return basePoints + lengthBonus;
}

// Validate word
router.post('/validate', auth, async (req, res) => {
    try {
        const { word } = req.body;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const gameNumber = now.getHours() < 12 ? 1 : 2;

        // Check if user has already played this game
        const existingScore = await Score.findOne({
            userId: req.user.userId,
            date: today,
            gameNumber
        });

        if (existingScore) {
            return res.status(403).json({ message: 'You have already completed this game' });
        }

        // Get today's words to validate against
        const { selectedWords, hiddenWord } = getTodaysWords(gameNumber);
        const upperWord = word.toUpperCase();

        // Check if word is valid
        const isRegularWord = selectedWords.includes(upperWord);
        const isHiddenWord = upperWord === hiddenWord;

        if (!isRegularWord && !isHiddenWord) {
            return res.json({ valid: false });
        }

        res.json({
            valid: true,
            points: calculateWordPoints(upperWord),
            isHidden: isHiddenWord
        });
    } catch (error) {
        console.error('Error validating word:', error);
        res.status(500).json({ message: 'Error validating word', error: error.message });
    }
});

// Submit score
router.post('/score', auth, async (req, res) => {
    try {
        const { score, timeSpent, wordsFound } = req.body;
        const userId = req.user.userId;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const gameNumber = now.getHours() < 12 ? 1 : 2;

        // Validate game exists
        const game = await Game.findOne({
            date: today,
            gameNumber
        });
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        // Check if user already has a better score for this game
        const existingScore = await Score.findOne({
            user: userId,
            game: game._id
        }).sort('-score');

        if (existingScore && existingScore.score >= score) {
            return res.json({ message: 'Previous score was higher' });
        }

        // Create new score
        const newScore = new Score({
            user: userId,
            game: game._id,
            score,
            timeSpent,
            wordsFound: wordsFound.map(word => ({
                word,
                timeFound: new Date()
            })),
            hiddenWordFound: wordsFound.includes(game.words.find(w => w.isHidden)?.word)
        });

        await newScore.save();

        res.json({ message: 'Score submitted successfully' });
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({ message: 'Error submitting score' });
    }
});

// Get leaderboard
router.get('/leaderboard/:type', async (req, res) => {
    try {
        const { type } = req.params; // 'daily' or 'overall'
        const pipeline = [];

        if (type === 'daily') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            pipeline.push({
                $match: {
                    completedAt: { $gte: today }
                }
            });
        }

        pipeline.push(
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $unwind: '$userInfo'
            },
            {
                $sort: { score: -1 }
            },
            {
                $limit: 100
            },
            {
                $project: {
                    username: '$userInfo.username',
                    score: 1,
                    timeSpent: 1,
                    wordsFound: { $size: '$wordsFound' },
                    hiddenWordFound: 1
                }
            }
        );

        const leaderboard = await Score.aggregate(pipeline);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ message: 'Error getting leaderboard' });
    }
});

module.exports = router;
