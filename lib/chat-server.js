const socketio = require('socket.io');

let io;
let guestNumber = 1;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  const name = `Guest${guestNumber}`;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name,
  });
  namesUsed.push(name);
  return guestNumber + 1;
}

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', {room});
  socket.broadcast.to(room).emit('message', {
    text: `${nickNames[socket.id]} has joined ${room}`,
  });
  const usersInRoom = io.sockets.adapter.rooms[room];
  let usersInRoomSummary = `Users currently in ${room}:`;
  if (usersInRoom && usersInRoom.length > 1) {
    for (const key in usersInRoom) {
      if (!usersInRoom.hasOwnProperty(key)) {
        continue;
      }
      const userSocketId = usersInRoom[key].id;
      if (userSocketId === socket.id) {
        continue;
      }
      if (key > 0) {
        usersInRoomSummary += ', ';
      }
      usersInRoomSummary += nickNames[userSocketId];
    }
  }
  usersInRoomSummary += '.';
  socket.emit('message', {
    text: usersInRoomSummary,
  });
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', (name) => {
    if (name.indexOf('Guest') === 0) {
      return socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest"',
      });
    }
    if (namesUsed.indexOf(name) > -1) {
      return socket.emit('nameResult', {
        success: false,
        message: 'That name is already in use.',
      });
    }
    const previousName = nickNames[socket.id];
    const previousNameIndex = nickNames.indexOf(previousName);
    namesUsed.splcie(index, 1, name);
    nickNames[socket.id] = name;
  });
}

function handleMessageBroadcasting(socket) {
  socket.on('message', (message) => {
    socket.broadcast.to(message.room).emit('message', {
      text: `${nickNames[socket.id]}: ${message.text}`,
    });
  })
}

function handleRoomJoining(socket) {
  socket.on('join', (room) => {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', () => {
    const nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    namesUsed.splice(nameIndex, 1);
    delete nickNames[socket.id];
  });
}

exports.listen = function(server) {
  io = socketio.listen(server);
  io.set('log level', 1);
  io.on('connection', (socket) => {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
    socket.on('rooms', () => {
      socket.emit('rooms', io.sockets.adapter.rooms);
    });
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
}
