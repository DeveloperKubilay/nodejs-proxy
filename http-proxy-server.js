const port = process.env.PORT || 80;
const addtimeoutsystem = 60000
const log = false


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
       if (session[socket.id]) {
        session[socket.id].end();
        delete session[socket.id];
      }
   });

   socket.once("data2", (data) => {
    let dataString = data.toString().replace(/Proxy-Connection/gi, 'Connection');
    let isTLSConnection = dataString.indexOf("CONNECT") !== -1;
    let serverPort = isTLSConnection ? 443 : 80;

        let serverAddress;
        if (isTLSConnection) {
          let ckz = dataString.split("CONNECT")[1].split(" ")[1].split(":")
          serverAddress = ckz[0];
          if(ckz[1]) serverPort = ckz[1];
        }
         else {
          let ckz = serverAddress = dataString.toLowerCase().split("host: ")[1]?.split("\r\n")[0].split(":");
          serverAddress = ckz[0];
          if(ckz[1]) serverPort = ckz[1];
          console.log(dataString,serverPort);
         }
        
        if(!serverAddress) return io.to(socket.id).emit("end",true);
        let proxyToServerSocket = net.createConnection({host: serverAddress,port: serverPort,},() => {
                if(log) console.log("Proxy to server set up",serverAddress,connectedSockets);
        });

        session[socket.id] = proxyToServerSocket

        if (isTLSConnection) io.to(socket.id).emit("data","HTTP/1.1 200 OK\r\n\r\n");
        else proxyToServerSocket.write(dataString);

        if(addtimeoutsystem){
            var tmout = Date.now()+addtimeoutsystem
            proxyToServerSocket.on('data', (data) => {
                tmout= Date.now()+addtimeoutsystem
                io.to(socket.id).emit("data",data)
            });
            socket.on("data2",(data)=>{
                tmout= Date.now()+addtimeoutsystem
                proxyToServerSocket.write(data)
            })
            setInterval(() => {
                if(Date.now()>tmout) {
                    io.to(socket.id).emit("end",true);
                    if(log) console.log("Timeout:",serverAddress,connectedSockets)
                }
            }, 5000);
        }
        else {
            proxyToServerSocket.on('data', (data) => io.to(socket.id).emit("data",data));
            socket.on("data2",(data)=> proxyToServerSocket.write(data))
        }

        proxyToServerSocket.on('end', () => io.to(socket.id).emit("end",true));
        proxyToServerSocket.on('error', ()=>  io.to(socket.id).emit("end",true));
      
    });
 
});

server.listen(port, () => {
  console.log('SERVER STARTED');
});
