const mongoose = require('mongoose');

const { getListOfAssistant, getAsisstantKeyById } = require("../../models/assistants/assistant.model");

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

module.exports = {
    doRetrieveListOfAssistant,
    doRetrieveAssistantKey
};