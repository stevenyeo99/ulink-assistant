import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export async function register(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: String(user._id), email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    return next(err);
  }
}
