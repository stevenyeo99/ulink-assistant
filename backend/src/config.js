const dotenv = require('dotenv');

dotenv.config();

const configs = {
    // Node JS ENV
    HOST: process.env.HOST || '127.0.0.1',
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'change-me-super-strong',
    CORS_ALLOW_ORIGIN: process.env.CORS_ALLOW_ORIGIN || 'http://localhost:5173',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-5o',
    REPORT_FOLDER_PATH: process.env.REPORT_FOLDER_PATH || 'reports',
    OCR_API_KEY: process.env.OCR_API_KEY || '',
    UPLOAD_PATH: process.env.UPLOAD_PATH || 'ocr-docs',
    UPLOAD_END: process.env.UPLOAD_END || 'tmp',

    // ZOHO WorkDrive
    ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID || '',
    ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET || '',
    ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN || '',
    ZOHO_ACCOUNTS_BASE: process.env.ZOHO_ACCOUNTS_BASE || '',
    ZOHO_WORKDRIVE_BASE: process.env.ZOHO_WORKDRIVE_BASE || '',
    WORKDRIVE_ASSISTANT_PARENT_ID: process.env.WORKDRIVE_ASSISTANT_PARENT_ID || '',

    // MONGO DB URI
    MONGODB_URI: process.env.MONGODB_URI || 'a'
};

module.exports = configs;