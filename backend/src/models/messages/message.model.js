const Message = require('./message.mongo');

async function addMessage(message) {
    await Message.create(message);
}

async function findMessageByChatId(filter) {
    return await Message.find(filter, {
        _id: 0,
        __v: 0
    })
    .lean()
    .sort({ timestamp: 1 });
}

module.exports = {
    addMessage,
    findMessageByChatId
}