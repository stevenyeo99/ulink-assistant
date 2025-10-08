const express = require('express');

const { doStreamChat, doGetChatHistory, doGetChatMessages, doGenerateConversationHistoryReport, doUpdateChatTitle } = require('./chat.controller');

const chatRouter = express.Router();

chatRouter.post('/stream', doStreamChat);
chatRouter.get('/history', doGetChatHistory);
chatRouter.get('/messages/:chatId', doGetChatMessages);
chatRouter.get('/history/report/:sessionId', doGenerateConversationHistoryReport);
chatRouter.post('/title/update', doUpdateChatTitle);

module.exports = chatRouter;