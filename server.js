const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const cache = {};
const chatServer = require('./lib/chat-server')

function send404(response) {
  response.writeHead(404, {'content-type': 'text/plain'});
  response.write('Error 404: resource not found');
  response.end();
}

function sendFile(response, filePath, fileContents) {
  response.writeHead(200, {
    'content-type': mime.getType(path.basename(filePath)),
  });
  response.end(fileContents);
}

function serverStatic(response, cache, absPath) {
  if (cache[absPath]) {
    return sendFile(response, absPath, cache[absPath]);
  }
  fs.exists(absPath, (exists) => {
    if (!exists) {
      return send404(response);
    }
    fs.readFile(absPath, (err, data) => {
      if (err) {
        return send404(response);
      }
      cache[absPath] = data;
      sendFile(response, absPath, data);
    });
  });
}

const server = http.createServer();
server.on('request', (req, res) => {
  let filePath = false;
  if (req.url === '/') {
    filePath = 'public/index.html';
  } else {
    filePath = `public${req.url}`;
  }
  const absPath = `./${filePath}`;
  serverStatic(res, cache, absPath);
});
chatServer.listen(server);
server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
