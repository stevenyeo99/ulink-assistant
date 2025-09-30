const User = require('./user.mongo');

// util
const { cleanStmt } = require('../../utils/stmt-util');

async function checkExistUserRecord(user) {
    const filter = cleanStmt(user);

    const exist = !!await (User.exists(filter));
    return exist;
}

module.exports = {
    checkExistUserRecord
}