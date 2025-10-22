const Session = require('./session.mongo');
const sessions = require('./session.mongo');

async function saveSession(session) {
    await sessions.findOneAndUpdate(
        {
            sessionId: session.sessionId
        },
        session,
        {
            upsert: true
        }
    );
}

async function getSessionBySID(sessionId) {
    return await sessions.findOne({sessionId}).lean().exec();
}

async function deleteSession(filter = {}) {
    return await Session.deleteMany(filter);
}

module.exports = {
    saveSession,
    getSessionBySID,
    deleteSession
};