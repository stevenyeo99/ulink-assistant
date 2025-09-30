const express = require('express');

const { doRetrieveListOfAssistant, doRetrieveAssistantKey } = require('./assistant.controller');

const assistantRouter = express.Router();

assistantRouter.get('/', doRetrieveListOfAssistant);
assistantRouter.get('/:id', doRetrieveAssistantKey);

module.exports = assistantRouter;