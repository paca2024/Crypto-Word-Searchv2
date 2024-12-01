const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        required: true,
        unique: true,
    },
    scores: [{
        gameId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Game',
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
}, { 
    timestamps: true,
    collection: 'users'
});

// Create indices
userSchema.index({ telegramId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
