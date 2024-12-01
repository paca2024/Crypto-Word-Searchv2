const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    gameNumber: {
        type: Number,
        required: true,
        enum: [1, 2] // Only game 1 or 2 allowed
    },
    score: {
        type: Number,
        required: true
    },
    timeElapsed: {
        type: Number,
        required: true,
        description: 'Time elapsed in milliseconds'
    },
    wordsFound: [{
        word: {
            type: String,
            required: true
        },
        isHidden: {
            type: Boolean,
            default: false
        },
        foundAt: {
            type: Date,
            default: Date.now
        }
    }],
    completed: {
        type: Boolean,
        default: true
    },
    deviceInfo: {
        userAgent: String,
        ip: String
    }
}, {
    timestamps: true
});

// Create indices for efficient querying
scoreSchema.index({ userId: 1, date: 1, gameNumber: 1 }, { unique: true });
scoreSchema.index({ date: -1, gameNumber: 1, score: -1 });

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;
