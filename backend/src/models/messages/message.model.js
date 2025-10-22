const Message = require('./message.mongo');

async function addMessage(message) {
    return await Message.create(message);
}

async function findMessageByChatId(filter, excludeField) {
    return await Message.find(filter, {
        _id: 0,
        __v: 0,
        ...excludeField
    })
    .lean()
    .sort({ createdAt: 1 });
}

async function deleteMessage(filter = {}) {
    return await Message.deleteMany(filter);
}

module.exports = {
    addMessage,
    findMessageByChatId,
    deleteMessage
}