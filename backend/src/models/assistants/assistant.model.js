const Assistant = require('./assistant.mongo');

// util
const { cleanStmt } = require('../../utils/stmt-util');

async function getListOfAssistant() {
    return await Assistant.find({}, { apiKey: 0, vectorStoreId: 0, systemPromptFile: 0 });
};

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
    checkExistAsstRecord
}