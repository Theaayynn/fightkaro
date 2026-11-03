const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomId] = { players: [socket.id] };
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && rooms[roomId].players.length < 2) {
            rooms[roomId].players.push(socket.id);
            socket.join(roomId);
            io.to(roomId).emit('gameStart', rooms[roomId]);
        } else {
            socket.emit('error', 'Room full or not found');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle disconnect/room cleanup
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(Server running on port );
});
