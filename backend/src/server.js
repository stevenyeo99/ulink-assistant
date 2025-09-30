const http = require('http');

const { PORT } = require('./config');
const app = require('./app');
const { mongoConnect } = require('./services/mongo');

const server = http.createServer(app);

async function startServer() {
    await mongoConnect();

    server.listen(PORT, () => {
        console.log(`ULINK Backend running on port: ${PORT}`);
    });
}

startServer();