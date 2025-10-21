const { Types: { ObjectId } } = require('mongoose');

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

async function getAllChats({ userId, assistantId, isAdmin }) {

    const chatConditionList = [
        {
            $eq: ['$assistantId', new ObjectId(assistantId)]
        }
    ];

    if (!isAdmin) {
        chatConditionList.push({
            $eq: ['$userId', new ObjectId(userId)]
        });
    }

    return await Chat.aggregate([ 
        {
            $match: {
                $expr: {
                    $and: chatConditionList
                }
            }
        },
        {
            $lookup: {
                from: 'messages',
                let: {
                    chatId: '$_id'
                },
                pipeline: [
                    { $match: { $expr: { $eq: ['$chatId', '$$chatId'] } } },
                    // INDICATOR FOR UPLOAD FILE EVENT ONLY TO SKIP LIKE GPT LOGIC.
                    { $match: { $expr: { $eq: ['$isOcr', false] } } },
                    { $sort: { createdAt: 1 } },
                    { $project: { _id: 0, role: 1, content: 1, createdAt: 1 } }
                ],
                as: 'messages'
            }
        },
        {
            $sort: {
                updatedAt: -1
            }
        },
    ]);
}

module.exports = {
    findChat,
    addChat,
    getAllChats,
    saveChat
};