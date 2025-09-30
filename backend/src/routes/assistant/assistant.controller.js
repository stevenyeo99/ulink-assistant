const mongoose = require('mongoose');

const { getListOfAssistant, getAsisstantKeyById, getListOfAssistantConfigs } = require("../../models/assistants/assistant.model");
const assistantRouter = require('./assistant.router');

const asssistantMap = new Map();

async function doRetrieveListOfAssistant(req, res) {
    return res.status(200).json(await getListOfAssistant());
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