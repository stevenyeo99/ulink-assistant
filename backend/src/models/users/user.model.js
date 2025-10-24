const User = require('./user.mongo');

// util
const { cleanStmt } = require('../../utils/stmt-util');

async function checkExistUserRecord(user) {
    const filter = cleanStmt(user);

    const exist = !!await (User.exists(filter));
    return exist;
}

async function getUserById(id) {
    return await User.findById(id);
}

async function retrieveUsers(filter) {
    return await User.aggregate([
        {
            $match: {
                ...filter
            }
        },
        {
            $lookup: {
                let: {
                    userId: '$_id'
                },
                from: 'user.assistances',
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$userId', '$$userId']
                            }
                        }
                    },
                    {
                        $lookup: {
                            let: {
                                assistantId: '$assistantId'
                            },
                            from: 'assistants',
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: ['$_id', '$$assistantId']
                                                },
                                                {
                                                    $eq: ['$enabled', true]
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: '_assistant'
                        }
                    },
                    { $unwind: { path: '$_assistant', preserveNullAndEmptyArrays: false }}
                ],
                as: 'allowedAssistantIds'
            }
        },
        {
            $addFields: {
            allowedAssistantIds: {
                $map: {
                    input: '$allowedAssistantIds',
                    as: 'a',
                    in: '$$a.assistantId'
                }
            }
            }
        },
        {
            $sort: {
                updatedAt: -1
            }
        }
    ], { allowDiskUse: true });
}

module.exports = {
    getUserById,
    checkExistUserRecord,
    retrieveUsers
}