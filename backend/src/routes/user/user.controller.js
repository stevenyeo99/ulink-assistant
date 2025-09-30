const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../../config.js');

const User = require('../../models/users/user.mongo.js');

async function register(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: passwordHash });
    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    return next(err);
  }
};

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: String(user._id), email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  login
}