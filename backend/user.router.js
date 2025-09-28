import { Router } from 'express';
import { register, login } from './user.controller.js';

const r = Router();
r.post('/register', register);
r.post('/login', login);
export default r;
