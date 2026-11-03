import { io, Socket } from 'socket.io-client';

export class MultiplayerManager {
    private static instance: MultiplayerManager;
    public socket: Socket | null = null;
    public roomCode: string = '';
    public playerNumber: 1 | 2 = 1;
    public isMultiplayer: boolean = false;

    private constructor() {}

    public static getInstance(): MultiplayerManager {
        if (!MultiplayerManager.instance) {
            MultiplayerManager.instance = new MultiplayerManager();
        }
        return MultiplayerManager.instance;
    }

    public connect(): Socket {
        if (!this.socket) {
            // Determine socket endpoint
            const url = window.location.port === '3000' && window.location.hostname === 'localhost'
                ? 'http://localhost:3000'
                : window.location.origin;

            this.socket = io(url, {
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('[Multiplayer] Connected to server, ID:', this.socket?.id);
            });

            this.socket.on('connect_error', (err) => {
                console.warn('[Multiplayer] Connection warning:', err.message);
            });
        }
        return this.socket;
    }

    public createRoom(): Promise<string> {
        this.isMultiplayer = true;
        this.connect();

        return new Promise((resolve) => {
            if (!this.socket) return;
            this.socket.emit('create_room');
            this.socket.once('room_created', (data: { roomCode: string; playerNumber: 1 | 2 }) => {
                this.roomCode = data.roomCode;
                this.playerNumber = data.playerNumber;
                resolve(data.roomCode);
            });
        });
    }

    public joinRoom(roomCode: string): Promise<{ success: boolean; message?: string }> {
        this.isMultiplayer = true;
        this.connect();

        return new Promise((resolve) => {
            if (!this.socket) return resolve({ success: false, message: 'No socket' });
            this.socket.emit('join_room', { roomCode });

            this.socket.once('room_joined', (data: { roomCode: string; playerNumber: 1 | 2 }) => {
                this.roomCode = data.roomCode;
                this.playerNumber = data.playerNumber;
                resolve({ success: true });
            });

            this.socket.once('room_error', (data: { message: string }) => {
                resolve({ success: false, message: data.message });
            });
        });
    }

    public sendAction(action: any) {
        if (!this.isMultiplayer || !this.socket || !this.roomCode) return;
        this.socket.emit('game_action', {
            roomCode: this.roomCode,
            action
        });
    }

    public reset() {
        this.isMultiplayer = false;
        this.roomCode = '';
        this.playerNumber = 1;
    }
}

export const net = MultiplayerManager.getInstance();
