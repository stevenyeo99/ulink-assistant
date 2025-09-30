const express = require('express');

const { doStreamChat } = require('./chat.controller');

const chatRouter = express.Router();

// chatRouter.post('/', null);
chatRouter.post('/stream', doStreamChat);

module.exports = chatRouter;