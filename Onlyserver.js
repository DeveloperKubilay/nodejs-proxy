const port = process.env.PORT || 8080;

const net = require("net");
const server = net.createServer();

server.on("connection", (clientToProxySocket) => {
    console.log("Client connected to proxy");
    clientToProxySocket.once("data", (data) => {
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
        console.log(serverAddress);


        let proxyToServerSocket = net.createConnection(
            {
                host: serverAddress,
                port: serverPort,
            },
            () => {
                console.log("Proxy to server set up");
            }
        );


        if (isTLSConnection) {
            clientToProxySocket.write("HTTP/1.1 200 OK\r\n\r\n");
        } else {
            proxyToServerSocket.write(dataString);
        }

        clientToProxySocket.pipe(proxyToServerSocket);
        proxyToServerSocket.pipe(clientToProxySocket);

        proxyToServerSocket.on("error", (err) => {try{clientToProxySocket.end()}catch{}});
        clientToProxySocket.on("error", (err) => {try{proxyToServerSocket.end()}catch{}});
    });
});

server.on("error", (err) => {});
server.on("close", () => { console.log("Client disconnected");});

server.listen(
    {
        host: "0.0.0.0",
        port: port,
    },
    () => {
        console.log("Server listening on 0.0.0.0:8080");
    }
);
