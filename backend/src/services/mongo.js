const mongoose = require('mongoose');

const {
    MONGODB_URI
} = require('../config');

mongoose.connection.once('open', () => {
    console.log('MongoDB Connection Ready!');
});

mongoose.connection.on('error', (err) => {
    console.error(err);
});

async function mongoConnect() {
    await mongoose.connect(MONGODB_URI);
}

async function mongoDisconnect() {
    await mongoose.disconnect();
}

module.exports = {
    mongoConnect,
    mongoDisconnect
}