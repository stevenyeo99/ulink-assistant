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

module.exports = {
    saveSession,
    getSessionBySID
};