const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../../config.js');

const User = require('../../models/users/user.mongo.js');
const { doApplyUserAssistant } = require('../../models/user-assistants/user-assistant.model.js');
const { getListOfAssistant } = require('../../models/assistants/assistant.model.js');
const { retrieveUsers } = require('../../models/users/user.model.js');

async function create(req, res, next) {
  try {
    const { username, password, assistantIds } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: passwordHash, role: 'user' });

    let listOfAsstId = assistantIds;
    if (!listOfAsstId || listOfAsstId?.length === 0) {
      listOfAsstId = await getListOfAssistant();
      listOfAsstId = listOfAsstId.map(asst => asst?._id);
    }
    
    await doApplyUserAssistant(user?.id, listOfAsstId);
    
    return res.status(201).json({ id: user._id, username: user.username });
  } catch (err) {
    return next(err);
  }
};

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: String(user._id), username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    return next(err);
  }
};

async function getListOfUsers(req, res) {
  const users = await retrieveUsers({ role: 'user' });

  return res.json(users).status(200);
}

module.exports = {
  create,
  login,
  getListOfUsers
}