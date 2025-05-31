const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const rooms = {}; // Stores players and hider per room

io.on('connection', socket => {
  socket.on('joinRoom', ({ roomCode, playerId }) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], hider: null };
    }

    rooms[roomCode].players.push(playerId);

    // Assign hider if not already assigned
    if (!rooms[roomCode].hider) {
      const randomIndex = Math.floor(Math.random() * rooms[roomCode].players.length);
      rooms[roomCode].hider = rooms[roomCode].players[randomIndex];
    }

    const role = playerId === rooms[roomCode].hider ? 'hider' : 'seeker';
    socket.join(roomCode);
    socket.emit('role', role);
  });

  socket.on('updateLocation', ({ roomCode, coords }) => {
    // Send the hider's location to all seekers
    socket.to(roomCode).emit('hiderLocation', coords);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
