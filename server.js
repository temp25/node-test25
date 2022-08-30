const cliService = require('./service/CliService');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
cliService.parseArgs(app);
const jaysonClient = require('./service/JaysonClientService');
const io = require('socket.io')(http);
const enforce = require('express-sslify');
const env = require('./util/env');
const Log = require('./service/LogService');
const killPort = require('kill-port');
const bodyParser = require('body-parser');
const path = require('path');

const controller = require('./controller/controller')(jaysonClient, io);

const NODE_PORT = env.NODE_SERVER_PORT;
const ARIA2C_PORT = env.ARIA2C_PORT;

let connections = [];

app.use(enforce.HTTPS({ trustProtoHeader: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', controller.getHealth);
app.get('/supportedRPCMethods', controller.getRPCMethods);
app.post('/aria2cRPC', controller.rpcRequest);
app.get('*', controller.respondWith404);
app.post('*', controller.respondWith404);

io.on('connection', (socket) => {
    let socketId = socket.id;
    console.log(`user connected with socket id ${socketId}`);
    socket.on('testPing', (message) => {
        message.id = socket.id;
        console.debug(JSON.stringify(message));
        emitPongMessage(socket);
    });
});

const server = http.listen(NODE_PORT, () => {
    Log.i(`Express server listening on port ${NODE_PORT}`);
});

server.on('connection', connection => {
    connections.push(connection);
    connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

setInterval(() => server.getConnections(
    (err, connections) => Log.i(`${connections} connections currently open`)
), 1800000); // checks the connections currently open for every 30 minutes

setInterval(() => {
    jaysonClient.sendTellActiveData(io);
}, 1000); //send tell data to all clients

//For capturing SIGINT on Windows platform
if (process.platform === 'win32') {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('SIGINT', function () {
        process.emit('SIGINT');
    });
}

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function emitPongMessage(socket) {
    setTimeout(() => {
        socket.emit('testPong', {
            type: 'keep-alive',
            message: 'pong',
            timestamp: new Date().toISOString()
        });
    }, 3000);
}

function shutDown() {
    Log.i('Received kill signal, shutting down gracefully');
    Log.i('Exiting aria2c process');
    killPort(ARIA2C_PORT, 'tcp')
        .then(e => {
            Log.i(e);
            shutDownExpressServer();
        })
        .catch(e => {
            Log.e(e);
            shutDownExpressServer();
        });
}

function shutDownExpressServer() {
    Log.i('Exiting Express server');
    server.close(() => {
        Log.i('Closed out remaining connections');
        process.exit(0);
    });

    setTimeout(() => {
        Log.w('Could not close connections within 30s, forcefully shutting down');
        process.exit(-1);
    }, 30000); // Exit forcefully after 30s

    connections.forEach(curr => curr.end());
    setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
}