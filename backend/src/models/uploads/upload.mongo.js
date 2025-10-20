const mongoose = require('mongoose');

const UploadSchema = new mongoose.Schema({
    messageId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Message' 
    },
    originalFileName: {
        type: String,
        required: true
    },
    uploadedFileName: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Upload = mongoose.model('Upload', UploadSchema);

module.exports = Upload;