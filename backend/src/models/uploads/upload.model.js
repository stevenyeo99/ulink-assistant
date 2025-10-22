const Upload = require('./upload.mongo');

async function addUpload(upload) {
    await Upload.create(upload);
}

async function findUpload(filter, excludeField) {
    return await Upload.find(filter, {
        _id: 0,
        __v: 0,
        ...excludeField
    })
    .lean()
    .sort({ createdAt: 1 });
}

async function deleteUpload(filter = {}) {
    return await Upload.deleteMany(filter);
}

module.exports = {
    addUpload,
    findUpload,
    deleteUpload
}