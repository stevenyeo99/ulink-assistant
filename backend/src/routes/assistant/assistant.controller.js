const mongoose = require('mongoose');

const { getListOfAssistant, getAsisstantKeyById, getListOfAssistantConfigs } = require("../../models/assistants/assistant.model");
const { doRetrieveAssistantIdByUserId } = require('../../models/user-assistants/user-assistant.model');
const { getUserById } = require('../../models/users/user.model');

const asssistantMap = new Map();

async function doRetrieveListOfAssistant(req, res) {
    const { userId } = req.query;

    const user = await getUserById(userId);

    let listOfAssistantId = [];
    if (userId && user?.role !== 'admin') {
      listOfAssistantId = await doRetrieveAssistantIdByUserId(userId);
      listOfAssistantId = listOfAssistantId.map(assistant => assistant?.assistantId);
    }

    const listOfAssistant = await getListOfAssistant(listOfAssistantId);

    return res.status(200).json(listOfAssistant);
}

async function doRetrieveAssistantKey(req, res) {

    const { id } = req.params;

    if (!id && !mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid Assistant Id'});
    }

    const assistantKey = await getAsisstantKeyById(id);
    if (!assistantKey) {
        return res.status(400).json({ message: 'Assistant Record does not exist.'});
    }

    return res.status(200).json(assistantKey);
}

async function initSystemPromptMap() {
  const configs = await getListOfAssistantConfigs();

  configs.forEach((assist) => {
    const assistId = assist?._id.toString();
    if (!asssistantMap.has(assistId)) {
      const { _id, ...rest } = assist;
      asssistantMap.set(assistId, { ...rest });
    }
  });
}

module.exports = {
    asssistantMap,


    doRetrieveListOfAssistant,
    doRetrieveAssistantKey,
    initSystemPromptMap
};