function Chat(socket) {
  this.socket = socket;
}

Chat.prototype.sendMessage = function(room, text) {
  const message = {
    room,
    text,
  };
  this.socket.emit('message', message);
}

Chat.prototype.changeRoom = function (room) {
  this.socket.emit('join', {
    newRoom: room,
  });
}

Chat.prototype.processCommand = function(command) {
  const words = command.split(' ');
  command = words[0].substring(1, words[0].length).toLowerCase();
  let message = false;
  words.shift();
  const room = words.join(' ');
  switch (command) {
    case 'join':
    this.changeRoom(room);
    break;
    case 'nick':
    this.socket.emit('nameAttempt', name);
    break;
    message = 'Unrecoginzed command.';
    break;
  }
  return message;
}
