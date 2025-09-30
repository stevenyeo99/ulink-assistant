const express = require('express');

const chatController = require('./chat.controller');

const chatRouter = express.Router();

// chatRouter.post('/', null);
chatRouter.post('/stream', chatController);

module.exports = chatRouter;