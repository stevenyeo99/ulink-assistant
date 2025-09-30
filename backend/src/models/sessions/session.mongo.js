const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
});

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;