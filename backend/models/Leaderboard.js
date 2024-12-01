const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    telegramId: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0
    },
    timeElapsed: {
        type: Number,
        required: true,
        min: 0,
        description: 'Time elapsed in milliseconds'
    },
    wordsFound: {
        type: Number,
        required: true,
        min: 0
    },
    totalWords: {
        type: Number,
        required: true,
        min: 0
    },
    foundHiddenWord: {
        type: Boolean,
        default: false
    },
    gameDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create indices for efficient querying
leaderboardSchema.index({ score: -1, timeElapsed: 1 });
leaderboardSchema.index({ userId: 1, gameDate: -1 });
leaderboardSchema.index({ gameDate: -1 });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard;
