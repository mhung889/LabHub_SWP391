require('dotenv').config();

const app = require("./src/app");
const { app: { port } } = require('./src/config/config-mongodb');

const PORT = port;

const server = app.listen(PORT, () => {
    console.log('🚀 LabHub running at port ' + PORT);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log("❌ Server closed");
    });
});
