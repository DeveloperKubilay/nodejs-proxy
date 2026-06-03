const net = require("net");
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');

const PORT = 24101;
const TIMEOUT_MS = 180000;
const LOG = false;

const authUsers = [
    { username: "kullanici1", password: "test" }
];

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const sessions = new Map();

const parseConnectData = (dataString) => {
    const isTLS = dataString.indexOf("CONNECT") !== -1;
    let serverAddress, serverPort;

    if (isTLS) {
        const parts = dataString.split("CONNECT")[1].split(" ")[1].split(":");
        serverAddress = parts[0];
        serverPort = parts[1] || 443;
    } else {
        const hostHeader = dataString.toLowerCase().split("host: ")[1]?.split("\r\n")[0];
        if (!hostHeader) return null;
        const parts = hostHeader.split(":");
        serverAddress = parts[0];
        serverPort = parts[1] || 80;
    }
    return { serverAddress, serverPort, isTLS };
};

const setupProxy = (socket, proxyData) => {
    const dataString = proxyData.toString().replace(/Proxy-Connection/gi, 'Connection');
    const parsed = parseConnectData(dataString);

    if (!parsed || !parsed.serverAddress) {
        socket.emit("end", true);
        return;
    }

    const { serverAddress, serverPort, isTLS } = parsed;

    const proxySocket = net.createConnection({
        host: serverAddress,
        port: serverPort
    }, () => {
        if (LOG) console.log("Proxy setup:", serverAddress);
    });

    sessions.set(socket.id, { proxySocket, lastActivity: Date.now() });

    if (isTLS) {
        socket.emit("data", "HTTP/1.1 200 OK\r\n\r\n");
    } else {
        proxySocket.write(dataString);
    }

    proxySocket.on('data', (d) => {
        updateActivity(socket.id);
        socket.emit("data", d);
    });

    socket.on("data2", (d) => {
        updateActivity(socket.id);
        proxySocket.write(d);
    });

    proxySocket.on('end', () => socket.emit("end", true));
    proxySocket.on('error', () => socket.emit("end", true));
};

const updateActivity = (socketId) => {
    const session = sessions.get(socketId);
    if (session) session.lastActivity = Date.now();
};

const checkTimeouts = () => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.lastActivity > TIMEOUT_MS) {
            io.to(id).emit("end", true);
            session.proxySocket.end();
            sessions.delete(id);
        }
    }
};

setInterval(checkTimeouts, 5000);

io.use((socket, next) => {
    const auth = socket.handshake.auth;
    if (!auth) return next(new Error("No auth"));

    const valid = authUsers.some(u => u.username === auth.username && u.password === auth.password);
    if (valid) {
        next();
    } else {
        next(new Error("Authentication failed"));
    }
});

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        const session = sessions.get(socket.id);
        if (session) {
            session.proxySocket.end();
            sessions.delete(socket.id);
        }
    });

    socket.once("data2", (data) => setupProxy(socket, data));
});

server.listen(PORT, () => console.log(`Server on ${PORT}`));
