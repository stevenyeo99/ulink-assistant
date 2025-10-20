const Upload = require('./upload.mongo');

async function addUpload(upload) {
    await Upload.create(upload);
}

async function findUpload(filter, excludeField) {
    return await Message.find(filter, {
        _id: 0,
        __v: 0,
        ...excludeField
    })
    .lean()
    .sort({ createdAt: 1 });
}

module.exports = {
    addUpload,
    findUpload
}