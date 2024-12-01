const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    gameNumber: {
        type: Number,
        required: true,
        enum: [1, 2] // Only 2 games per day
    },
    grid: [[String]], // 2D array representing the word search grid
    words: [{
        word: String,
        isHidden: Boolean,
        points: Number
    }],
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique game per day
gameSchema.index({ date: 1, gameNumber: 1 }, { unique: true });

module.exports = mongoose.model('Game', gameSchema);
