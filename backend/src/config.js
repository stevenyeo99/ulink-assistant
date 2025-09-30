const dotenv = require('dotenv');

dotenv.config();

const configs = {
    // Node JS ENV
    HOST: process.env.HOST || '127.0.0.1',
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'change-me-super-strong',
    CORS_ALLOW_ORIGIN: process.env.CORS_ALLOW_ORIGIN || 'http://localhost:5173',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-5o',

    // MONGO DB URI
    MONGODB_URI: process.env.MONGODB_URI || ''
};

module.exports = configs;