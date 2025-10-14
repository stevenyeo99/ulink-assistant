const { Types: { ObjectId } } = require('mongoose');

const UserAssistant = require('./user-assistant.mongo');

async function doApplyUserAssistant(userId, listOfAsstId = []) {
    
    await UserAssistant.deleteMany({ userId });

    const userAssistantList = listOfAsstId.map(assistantId => {
        return {
            userId,
            assistantId
        }
    });

    await UserAssistant.insertMany(userAssistantList);
}

async function doRetrieveAssistantIdByUserId(userId) {
    const listOfAssistantId = UserAssistant.find({
        userId: new ObjectId(userId)
    }, { assistantId: 1 }).lean();

    return listOfAssistantId;
}

module.exports = {
    doApplyUserAssistant,
    doRetrieveAssistantIdByUserId
}