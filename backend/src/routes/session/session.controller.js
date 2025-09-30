const mongoose = require('mongoose');

const { getSessionBySID, saveSession } = require('../../models/sessions/session.model');
const { checkExistAsstRecord } = require('../../models/assistants/assistant.model');
const { checkExistUserRecord } = require('../../models/users/user.model');

async function doGetSessionBySID(req, res) {

    const { sid } = req.params;

    if (!sid) {
        return res.status(400).json({ message: 'Invalid SID' });
    }

    const session = await getSessionBySID(sid);
    if (!session) {
        return res.status(400).json({ message: 'Session Record not found.'});
    }

    return res.status(200).json(session);
}

async function doPostNewSession(req, res) {

    const { assistantId, userId } = req.body;

    if (!assistantId && !mongoose.isValidObjectId(assistantId)) {
        return res.status(400).json({ message: 'Invalid Assistant ID.'});
    }

    if (!userId) {
        return res.status(400).json({ message: 'Invalid User ID.'});
    }

    // check assisstant & user exist or not.
    if (!await checkExistAsstRecord({_id: assistantId})) {
        return res.status(400).json({ message: 'Assistant ID not exist.'});
    }
    if (!await checkExistUserRecord({ userId: userId })) {
        return res.status(400).json({ message: 'User ID not exist.'});
    }

    const sessionId = doGenerateSessionKey(assistantId, userId);

    const newSession = {
        sessionId: sessionId        
    };

    try {
        await saveSession(newSession);
        return res.status(201).json({ 
            message: 'Succesfully Generated Session Key',
            data: {
                sessionId: sessionId
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to create session.'});
    }
    
}

async function doPutExistingSession(req, res) {
    const { sessionId } = req.body;

    const existingSession = await getSessionBySID(sessionId);
    if (!existingSession) {
        return res.json({ message: 'Session ID not found.'});
    }

    const updateSession = {
        ...existingSession
    };
    updateSession.lastUsed = new Date();

    try {
        saveSession(updateSession);
        return res.status(202).json({ message: 'Success updated lastused session.'});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update session.'});
    }
}

function doGenerateSessionKey(assistantId, userId) {

    const sanityAsstId = assistantId.toLowerCase().replace(' ', '_');
    const sanityUserId = userId.toLowerCase().replace(' ', '_');

    let currentDateTime = new Date();
    currentDateTime = tsLocalYYYYMMDDHHmmss(currentDateTime);

    const newSessionKey = `${currentDateTime}.${sanityAsstId}.${sanityUserId}`;
    return newSessionKey;
}

function tsLocalYYYYMMDDHHmmss(d) {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0'); // 0-based month
  const dd   = String(d.getDate()).padStart(2, '0');
  const HH   = String(d.getHours()).padStart(2, '0');     // local time
  const MM   = String(d.getMinutes()).padStart(2, '0');
  const SS   = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${HH}${MM}${SS}`;
}

module.exports = {
    doGetSessionBySID,
    doPostNewSession,
    doPutExistingSession
};