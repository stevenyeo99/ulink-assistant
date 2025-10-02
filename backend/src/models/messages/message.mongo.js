const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chatId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Chat' 
    },
    role: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
}, { timestamps: true });

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;