const express = require('express');

const { doStreamChat, doGetChatHistory, doGetChatMessages, doGenerateConversationHistoryReport } = require('./chat.controller');

const chatRouter = express.Router();

// chatRouter.post('/', null);
chatRouter.post('/stream', doStreamChat);
chatRouter.get('/history', doGetChatHistory);
chatRouter.get('/messages/:chatId', doGetChatMessages);
chatRouter.get('/history/report/:chatId', doGenerateConversationHistoryReport);

module.exports = chatRouter;