const express = require('express');

const { doStreamChat, doGetChatHistory, doGetChatMessages } = require('./chat.controller');

const chatRouter = express.Router();

// chatRouter.post('/', null);
chatRouter.post('/stream', doStreamChat);
chatRouter.get('/history', doGetChatHistory);
chatRouter.get('/messages/:chatId', doGetChatMessages);

module.exports = chatRouter;