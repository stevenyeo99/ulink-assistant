const mongoose = require('mongoose');

const AssistantSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        required: true
    },
    useDocs: {
        type: Boolean,
        required: true
    },
    apiKey: {
        type: String,
        required: true
    },
    vectorStoreId: {
        type: String,
        required: true
    },
    systemPromptFile: {
        type: String,
        required: true
    }
});

const Assistant = mongoose.model('Assistant', AssistantSchema);

module.exports = Assistant;