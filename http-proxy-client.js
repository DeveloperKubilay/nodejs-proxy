import net from 'net';
import socketio from 'socket.io-client';
import { chromium } from "playwright";

const LOCAL_PORT = 100;
const SERVER_URL = "http://localhost";

const AUTH = {
    username: "kullanici1",
    password: "test"
};

net.createServer((sourceSocket) => {
    const io = socketio(SERVER_URL, {
        auth: AUTH
    });

    io.on('connect', () => {
        console.log("Connected to remote:", io.id);

        io.on("data", (msg) => sourceSocket.write(msg));
        io.on("end", () => io.disconnect());

        sourceSocket.on('data', (data) => io.emit('data2', data));
    });

    io.on("connect_error", (err) => {
        console.error("Auth Error:", err.message);
        sourceSocket.end();
    });

    io.on("disconnect", () => sourceSocket.end());
    sourceSocket.on('error', () => io.disconnect());

}).listen(LOCAL_PORT, () => console.log(`Local proxy on ${LOCAL_PORT}`));

const browser = await chromium.launch({
    proxy: {
        server: `localhost:${LOCAL_PORT}`
    },
    headless: false,
});

const context = await browser.newContext();
const page = await context.newPage();

try {
    await page.goto("https://api.ipify.org/?format=json");
    console.log(await page.textContent("body"));
} catch (e) {
    console.log(e);
}




/*const port = 100
const url = "http://localhost"

const socketio = require('socket.io-client')
const net = require('net');


net.createServer((sourceSocket) => {
  const io = socketio(url);
  io.on('connect', () => {
    console.log(io.id)
    io.on("data",((msg) =>sourceSocket.write(msg)))
    io.on("end",io.disconnect)
    sourceSocket.on('data', (data) => io.emit('data2', data));
  })
  io.on("disconnect", () => sourceSocket.end());
  sourceSocket.on('error', (err) => io.disconnect());
}).listen(port);
*/


/*
setTimeout(()=>{

  async function send(){
    const res = await axios.get('http://ifconfig.me', {
    proxy: {
      host: 'localhost',
      port: 100
    }
  }).catch((e)=>{
   console.log(e.message)
  })
  console.log("res"+res?.data)
  }
  send()
},1000)
*/


/*

const puppeteer = require('puppeteer');

(async() => {
  const browser = await puppeteer.launch({
    headless:false,
    args: [ '--proxy-server=127.0.0.1:100' ]
  });
  const page = await browser.newPage();
  await page.goto('http://ifconfig.me',{timeout:0});
  
})();

*/
