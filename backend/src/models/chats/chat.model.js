const Chat = require('./chat.mongo');

async function findChat(filter) {
    return await Chat.findOne(filter, {
        __v: 0
    })
    .sort({ timestamp: 1 });
}

async function addChat(chat) {
    return await saveChat(chat);
}

async function saveChat(chat) {
    return await Chat.findOneAndUpdate(
        {
            sessionId: chat?.sessionId
        },
        chat,
        {
            upsert: true,
            new: true
        }
    );
}

module.exports = {
    findChat,
    addChat
};