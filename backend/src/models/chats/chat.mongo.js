const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    assistantId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Assistant' 
    },
    sessionId: {
        type: String,
        required: true
    },
}, { timestamps: true });

const Chat = mongoose.model('Chat', ChatSchema);

module.exports = Chat;