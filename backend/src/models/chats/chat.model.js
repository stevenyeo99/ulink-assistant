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

async function getAllChats(filter = {}, skip, limit) {
    return await Chat.find(filter, {
        __v: 0
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);
}

module.exports = {
    findChat,
    addChat,
    getAllChats
};