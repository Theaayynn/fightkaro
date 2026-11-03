import Phaser from 'phaser';
import { CharacterData } from '../data/characters';
import { StageData } from '../data/stages';
import { sounds } from '../audio/SoundManager';
import { net } from '../net/MultiplayerManager';

export class GameOverScene extends Phaser.Scene {
    private winner!: CharacterData;
    private loser!: CharacterData;
    private stage!: StageData;
    private isCPU: boolean = true;
    private difficulty: 'easy' | 'normal' | 'hard' = 'normal';
    private isMultiplayer: boolean = false;

    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data: any) {
        this.winner = data.winner;
        this.loser = data.loser;
        this.stage = data.stage;
        this.isCPU = Boolean(data.isCPU);
        this.difficulty = data.difficulty || 'normal';
        this.isMultiplayer = Boolean(data.isMultiplayer);
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Dark Background with Gold Accents
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x221105, 0x221105, 0x0a0512, 0x0a0512, 1);
        bg.fillRect(0, 0, w, h);

        // Victory Banner
        this.add.text(w / 2, 70, '🏆 WINNER! 🏆', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '54px',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Winner Avatar & Details
        this.add.sprite(w / 2, 210, `${this.winner.id}_super`).setScale(1.6);

        this.add.text(w / 2, 310, this.winner.name, {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(w / 2, 345, `"${this.winner.quote}"`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontStyle: 'italic',
            color: '#00e5ff'
        }).setOrigin(0.5);

        // Buttons Container
        const btnY = 430;

        // Rematch Button
        const rematchBtn = this.createButton(w / 2 - 140, btnY, '🔁 REMATCH', 0x138808, () => {
            sounds.playMenuSelect();
            if (this.isMultiplayer && net.socket) {
                net.socket.emit('rematch_request', { roomCode: net.roomCode });
                rematchBtn.setText('WAITING...');
                return;
            }

            this.scene.start('FightScene', {
                player1Character: this.winner,
                player2Character: this.loser,
                stage: this.stage,
                isCPU: this.isCPU,
                difficulty: this.difficulty,
                isMultiplayer: this.isMultiplayer
            });
        });

        // Change Fighter Button
        this.createButton(w / 2 + 140, btnY, '👥 CHANGE FIGHTER', 0x0077be, () => {
            sounds.playMenuSelect();
            this.scene.start('CharSelectScene', {
                mode: this.isMultiplayer ? 'multiplayer' : this.isCPU ? 'cpu' : 'local',
                difficulty: this.difficulty,
                roomCode: net.roomCode
            });
        });

        // Main Menu
        const menuBtn = this.add.text(w / 2, 510, '🏠 RETURN TO MAIN MENU', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '16px',
            color: '#aaaaaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            sounds.playMenuSelect();
            net.reset();
            this.scene.start('MenuScene');
        });

        // Listen for Multiplayer Rematch
        if (this.isMultiplayer && net.socket) {
            net.socket.on('opponent_rematch_requested', () => {
                const accept = confirm('Opponent wants a rematch! Accept?');
                if (accept) {
                    net.socket?.emit('rematch_accept', { roomCode: net.roomCode });
                }
            });

            net.socket.on('rematch_start', () => {
                this.scene.start('FightScene', {
                    player1Character: this.winner,
                    player2Character: this.loser,
                    stage: this.stage,
                    isCPU: false,
                    isMultiplayer: true
                });
            });
        }
    }

    private createButton(x: number, y: number, text: string, color: number, callback: () => void): Phaser.GameObjects.Text {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: Phaser.Display.Color.IntegerToColor(color).rgba,
            padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setScale(1.06));
        btn.on('pointerout', () => btn.setScale(1));
        btn.on('pointerdown', callback);

        return btn;
    }
}
