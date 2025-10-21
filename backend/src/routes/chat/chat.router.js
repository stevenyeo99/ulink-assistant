const express = require('express');

// upload util
const { upload } = require('../../utils/upload-file-util');

const { 
    doStreamChat, doGetChatHistory, doGetChatMessages, 
    doGenerateConversationHistoryReport, doUpdateChatTitle,
    doStreamChatV2,
    doGenerateALLConversationHistoryReport
} = require('./chat.controller');

const chatRouter = express.Router();

// v1 chat (json)
chatRouter.post('/stream', doStreamChat);
chatRouter.get('/history', doGetChatHistory);
chatRouter.get('/messages/:chatId', doGetChatMessages);
chatRouter.get('/history/report/:sessionId', doGenerateConversationHistoryReport);
chatRouter.post('/title/update', doUpdateChatTitle);

// v2 chat + upload file (multipart request body)
chatRouter.post('/v2/stream', upload.array('files'), doStreamChatV2);

// Admin Export All Chat & zip it & delete all the chat history from system.
chatRouter.get('/history/all/report', doGenerateALLConversationHistoryReport);

module.exports = chatRouter;