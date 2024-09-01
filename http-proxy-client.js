var port = 100
var url = "http://localhost"

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
