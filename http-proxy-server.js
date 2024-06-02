const net = require("net");
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
var session = {}
let connectedSockets = 0;

app.get('/', (req, res) => {
  res.send("Welcome to the http proxy server");
});

io.on('connection', (socket) => {
  connectedSockets++;

  socket.on('disconnect', (err) => {
    connectedSockets--;
    console.log(socket.id, "disconnected",connectedSockets);
    if (session[socket.id]) {
      session[socket.id].end();
      delete session[socket.id];
    }
});

   socket.once("zina", (data) => {
    let isTLSConnection = data.toString().indexOf("CONNECT") !== -1;
    let serverPort = isTLSConnection ? 443 : 80;
        let serverAddress;
        //console.log(data.toString());
        if (isTLSConnection) {
          serverAddress = data.toString().split("CONNECT")[1].split(" ")[1].split(":")[0];
        } else {
          serverAddress = data.toString().toLowerCase().split("host: ")[1]?.split("\r\n")[0];
        }
        if(!serverAddress) return io.to(socket.id).emit("end",true);
        let proxyToServerSocket = net.createConnection({host: serverAddress,port: serverPort,},() => {
                console.log("Proxy to server set up",serverAddress,connectedSockets);
        });

        session[socket.id] = proxyToServerSocket

        if (isTLSConnection) {
          io.to(socket.id).emit("data","HTTP/1.1 200 OK\r\n\r\n");
        } else {
            proxyToServerSocket.write(data);
        }

      socket.on("zina",(data)=> proxyToServerSocket.write(data))
      proxyToServerSocket.on('data', (data) => io.to(socket.id).emit("data",data));
      proxyToServerSocket.on('end', () => io.to(socket.id).emit("end",true));
      proxyToServerSocket.on('error', () => io.to(socket.id).emit("end",true));
      
    });
 
});

server.listen(process.env.PORT || 80, () => {
  console.log('SERVER STARTED');
});
