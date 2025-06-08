# nodejs-proxy 🌐💻
A versatile Node.js proxy toolkit that provides both TCP and HTTP-based proxying capabilities for bypassing network restrictions and enhancing connectivity. Perfect for development environments, testing, or production scenarios where traffic routing needs special handling. 🔒🌐🚀

## Components 📦

- **Onlyserver.js** - Pure TCP proxy implementation without extra dependencies. Uses only Node.js built-in modules. Ideal for environments where TCP ports can be opened. ✨

- **http-proxy-server.js** - HTTP-based proxy solution for environments where TCP ports are blocked. Utilizes Express and Socket.io for communication. 🧙‍♂️

- **http-proxy-client.js** - Client component that connects to the HTTP proxy server. Works together with the server to bypass TCP restrictions. 🔄

## Usage Guide 🤔

### Direct TCP Proxy
```bash
node Onlyserver.js
```
Configure your applications to use localhost:8080 as the proxy address. 💯

### HTTP Proxy (for environments with TCP restrictions)
1. On your server:
```bash
node http-proxy-server.js
```

2. On your client machine:
```bash
node http-proxy-client.js
```
Configure your applications to use localhost:100 as the proxy address. 🔌

## Configuration Options 🛠️

You can modify port settings by editing the environment variables or port constants at the top of each file.

## Examples 💡

For examples using Axios and Puppeteer, see the commented code in http-proxy-client.js.


## Made with ❤️ by DeveloperKubilay