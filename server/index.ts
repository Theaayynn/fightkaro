import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

interface PlayerState {
    id: string;
    playerNumber: 1 | 2;
    characterId?: string;
    ready?: boolean;
}

interface GameRoom {
    id: string;
    players: Map<string, PlayerState>;
    stageId: string;
    status: 'waiting' | 'selecting' | 'fighting' | 'finished';
}

const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Create a new multiplayer room
    socket.on('create_room', () => {
        let roomCode = generateRoomCode();
        while (rooms.has(roomCode)) {
            roomCode = generateRoomCode();
        }

        const room: GameRoom = {
            id: roomCode,
            players: new Map(),
            stageId: 'jantar-mantar',
            status: 'waiting'
        };

        const playerState: PlayerState = {
            id: socket.id,
            playerNumber: 1,
            ready: false
        };

        room.players.set(socket.id, playerState);
        rooms.set(roomCode, room);

        socket.join(roomCode);
        socket.emit('room_created', {
            roomCode,
            playerNumber: 1
        });
        console.log(`[Room] Created: ${roomCode} by ${socket.id}`);
    });

    // Join an existing room
    socket.on('join_room', (data: { roomCode: string }) => {
        const roomCode = (data.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit('room_error', { message: 'Room not found! Check your code.' });
            return;
        }

        if (room.players.size >= 2) {
            socket.emit('room_error', { message: 'Room is already full!' });
            return;
        }

        const playerState: PlayerState = {
            id: socket.id,
            playerNumber: 2,
            ready: false
        };

        room.players.set(socket.id, playerState);
        room.status = 'selecting';
        socket.join(roomCode);

        // Notify joiner
        socket.emit('room_joined', {
            roomCode,
            playerNumber: 2,
            stageId: room.stageId
        });

        // Notify both that opponent joined
        io.to(roomCode).emit('opponent_joined', {
            roomCode,
            playersCount: 2
        });

        console.log(`[Room] ${socket.id} joined room ${roomCode}`);
    });

    // Character Selection
    socket.on('select_character', (data: { roomCode: string; characterId: string }) => {
        const room = rooms.get(data.roomCode);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (player) {
            player.characterId = data.characterId;
            player.ready = true;

            // Broadcast character choice to room
            socket.to(data.roomCode).emit('opponent_selected_char', {
                playerNumber: player.playerNumber,
                characterId: data.characterId
            });

            // Check if both ready
            let allReady = true;
            for (const [, p] of room.players) {
                if (!p.ready || !p.characterId) allReady = false;
            }

            if (room.players.size === 2 && allReady) {
                room.status = 'fighting';
                io.to(data.roomCode).emit('start_match', {
                    stageId: room.stageId,
                    players: Array.from(room.players.values())
                });
            }
        }
    });

    // Stage Selection
    socket.on('select_stage', (data: { roomCode: string; stageId: string }) => {
        const room = rooms.get(data.roomCode);
        if (!room) return;
        room.stageId = data.stageId;
        socket.to(data.roomCode).emit('stage_selected', { stageId: data.stageId });
    });

    // Real-time Combat Action Synchronization
    socket.on('game_action', (data: { roomCode: string; action: any }) => {
        // Broadcast to the other player in the room
        socket.to(data.roomCode).emit('opponent_action', data.action);
    });

    // Rematch Request
    socket.on('rematch_request', (data: { roomCode: string }) => {
        socket.to(data.roomCode).emit('opponent_rematch_requested');
    });

    socket.on('rematch_accept', (data: { roomCode: string }) => {
        const room = rooms.get(data.roomCode);
        if (room) {
            room.status = 'fighting';
            io.to(data.roomCode).emit('rematch_start');
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);
        for (const [code, room] of rooms.entries()) {
            if (room.players.has(socket.id)) {
                room.players.delete(socket.id);
                socket.to(code).emit('opponent_disconnected', {
                    message: 'Opponent disconnected from the match.'
                });
                if (room.players.size === 0) {
                    rooms.delete(code);
                    console.log(`[Room] Cleaned up empty room: ${code}`);
                }
            }
        }
    });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        game: 'FightKaro Rebuild',
        activeRooms: rooms.size,
        uptime: process.uptime()
    });
});

// Serve compiled static assets from dist folder
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// For SPA routing, send index.html for all other requests
app.use((_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 FIGHTKARO PRODUCTION SERVER RUNNING!`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`📁 Static files: ${distPath}`);
    console.log(`===============================================`);
});
