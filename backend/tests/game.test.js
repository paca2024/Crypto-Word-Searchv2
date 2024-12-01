const mongoose = require('mongoose');
const Game = require('../models/Game');
const Score = require('../models/Score');

describe('Game Model Test', () => {
    beforeAll(async () => {
        await mongoose.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should create & save game successfully', async () => {
        const validGame = new Game({
            date: new Date(),
            gameNumber: 1,
            grid: Array(12).fill().map(() => Array(12).fill('A')),
            words: [
                { word: 'BITCOIN', isHidden: false, points: 70 },
                { word: 'ETHEREUM', isHidden: false, points: 80 },
                { word: 'SATOSHI', isHidden: true, points: 100 }
            ],
            difficulty: 'easy'
        });

        const savedGame = await validGame.save();
        
        expect(savedGame._id).toBeDefined();
        expect(savedGame.words.length).toBe(3);
        expect(savedGame.grid.length).toBe(12);
    });

    it('should fail to save game with invalid game number', async () => {
        const gameWithInvalidNumber = new Game({
            date: new Date(),
            gameNumber: 3, // Only 1 or 2 allowed
            grid: Array(12).fill().map(() => Array(12).fill('A')),
            words: [{ word: 'BITCOIN', isHidden: false, points: 70 }],
            difficulty: 'easy'
        });

        let err;
        try {
            await gameWithInvalidNumber.save();
        } catch (error) {
            err = error;
        }
        
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });
});

describe('Score Model Test', () => {
    let gameId;
    let userId;

    beforeAll(async () => {
        await mongoose.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Create test game and user IDs
        gameId = new mongoose.Types.ObjectId();
        userId = new mongoose.Types.ObjectId();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should create & save score successfully', async () => {
        const validScore = new Score({
            user: userId,
            game: gameId,
            score: 1000,
            timeSpent: 240,
            wordsFound: [
                { word: 'BITCOIN', timeFound: new Date() },
                { word: 'ETHEREUM', timeFound: new Date() }
            ],
            hiddenWordFound: false
        });

        const savedScore = await validScore.save();
        
        expect(savedScore._id).toBeDefined();
        expect(savedScore.score).toBe(1000);
        expect(savedScore.wordsFound.length).toBe(2);
    });

    it('should fail to save score without required fields', async () => {
        const scoreWithoutRequiredField = new Score({
            user: userId,
            // missing game field
            score: 1000
        });

        let err;
        try {
            await scoreWithoutRequiredField.save();
        } catch (error) {
            err = error;
        }
        
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });
});
