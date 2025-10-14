const Assistant = require('./assistant.mongo');

// util
const { cleanStmt } = require('../../utils/stmt-util');

async function getListOfAssistant(listOfAssistantId = []) {

    let filter = {};
    if (listOfAssistantId.length > 0) {
        filter = {
            _id: {
                $in: [...listOfAssistantId]
            }
        }
    }

    return await Assistant.find(filter, { apiKey: 0, vectorStoreId: 0, systemPromptFile: 0 }).lean();
}

async function getListOfAssistantConfigs() {
    return await Assistant.find({}, { _id: 1, apiKey: 1, vectorStoreId: 1, systemPromptFile: 1 }).lean();
}

async function getAsisstantKeyById(id) {
    return await Assistant.findById(id).lean().exec();
}

async function checkExistAsstRecord(assistant) {
    const filter = cleanStmt(assistant);

    const exist = !!await (Assistant.exists(filter));
    return exist;
}

module.exports = {
    getListOfAssistant,
    getAsisstantKeyById,
    checkExistAsstRecord,
    getListOfAssistantConfigs
}