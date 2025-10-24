const { Router } = require('express');
const { create, login, getListOfUsers } = require('./user.controller.js');

const userRouter = Router();

userRouter.post('/create', create);
userRouter.post('/login', login);
userRouter.get('/list', getListOfUsers);

module.exports = userRouter;