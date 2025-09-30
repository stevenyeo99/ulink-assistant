const Chat = require('./chat.mongo');

export async function addMessage(message) {
    await saveMessage(message);
}

async function saveMessage(message) {
    await Message.findOneAndUpdate(
        {
            chatId: message.chatId
        },
        message,
        {
            upsert: true
        }
    );
}

async function findMessageByChatId(filter) {
    return await Message.findOne({}, {
        _id: 0,
        __v: 0
    })
    .sort({ timestamp: 1 });
}

module.exports = {
    addMessage,
    saveMessage,
    findMessageByChatId
};