
function divEscapedContentElement(message) {
  return $('<div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div>').html(`<i>${message}</i>`);
}

function processUserInput(chatApp, socket) {
  const sendMessageEl = $('#send-message');
  const message = sendMessageEl.val();
  let systemMessage;
  if (message[0] === '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($('#room').text(), message);
    const messagesEl = $('messages');
    messagesEl.append(divEscapedContentElement(message));
    messagesEl.scrollTop(messagesEl.prop('scrollHeight'));
  }
  sendMessageEl.val('');
}

const socket = io.connect();

$(function() {
  const chatApp = new Chat(socket);

  socket.on('nameResult', (result) => {
    let message = result.message;
    if (result.success) {
      message = `You are now know as ${result.text}`;
    }
    $('#messages').append(divSystemContentElement(message));
  });

  socket.on('joinResult', (result) => {
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  socket.on('message', (message) => {
    $('#messages').append(divEscapedContentElement(message.text));
  });

  socket.on('rooms', (rooms) => {
    var roomListEl = $('#room-list');
    roomListEl.empty();
    for (let room in rooms) {
      if (!rooms.hasOwnProperty(room)) {
        continue;
      }
      // room = room.substring(1, room.length);
      if (room !== '') {
        roomListEl.append(divEscapedContentElement(room));
      }
    }

    roomListEl.on('click', 'div', function() {
      chatApp.processCommand(`/join ${$(this).text()}`);
      $('#send-message').focus();
    })
  });

  setInterval(() => {
    socket.emit('rooms');
  }, 1000);
  $('#send-message').focus();
  $('#send-form').submit(function (e) {
    e.preventDefault();
    processUserInput(chatApp, socket);
  });
});
