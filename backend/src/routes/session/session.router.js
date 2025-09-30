const express = require('express');

const { doGetSessionBySID, doPostNewSession, doPutExistingSession } = require('./session.controller');

const sessionRouter = express.Router();

sessionRouter.get('/:sid', doGetSessionBySID);
sessionRouter.post('/', doPostNewSession);
sessionRouter.put('/', doPutExistingSession)

module.exports = sessionRouter;