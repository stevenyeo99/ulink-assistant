const mongoose = require('mongoose');

const UserAssistantSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        assistantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assistant'
        }
    },
    { timestamps: true }
);

const UserAssistant = mongoose.model('User.Assistance', UserAssistantSchema);

module.exports = UserAssistant;