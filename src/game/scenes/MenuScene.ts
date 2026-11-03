import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { net } from '../net/MultiplayerManager';

export class MenuScene extends Phaser.Scene {
    private difficulty: 'easy' | 'normal' | 'hard' = 'normal';
    private diffText!: Phaser.GameObjects.Text;
    private soundBtn!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background Dark Gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x140520, 0x140520, 0x050a18, 0x050a18, 1);
        bg.fillRect(0, 0, width, height);

        // Grid lines for retro arcade arena feel
        bg.lineStyle(1, 0x332255, 0.4);
        for (let x = 0; x < width; x += 40) {
            bg.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 40) {
            bg.lineBetween(0, y, width, y);
        }

        // Floating Title Banner
        this.add.text(width / 2, 85, '⚔️ FIGHTKARO ⚔️', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '56px',
            color: '#ff9933',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 4, color: '#ff3300', blur: 15, fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, 135, 'THE SATIRICAL PARODY BATTLEGROUND', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            color: '#00e5ff',
            letterSpacing: 3
        }).setOrigin(0.5);

        // Menu Buttons
        let startY = 195;
        const gap = 52;

        this.createArcadeButton(width / 2, startY, '1P VS CPU', 0x138808, () => {
            sounds.playMenuSelect();
            this.scene.start('CharSelectScene', {
                mode: 'cpu',
                difficulty: this.difficulty
            });
        });

        this.createArcadeButton(width / 2, startY + gap, '2P LOCAL VERSUS', 0x0077be, () => {
            sounds.playMenuSelect();
            this.scene.start('CharSelectScene', {
                mode: 'local'
            });
        });

        this.createArcadeButton(width / 2, startY + gap * 2, '🌐 ONLINE MULTIPLAYER', 0x9933ff, () => {
            sounds.playMenuSelect();
            this.showMultiplayerModal();
        });

        this.createArcadeButton(width / 2, startY + gap * 3, '📖 HOW TO PLAY', 0x444455, () => {
            sounds.playMenuSelect();
            this.showHowToPlayModal();
        });

        // Difficulty Selector
        this.diffText = this.add.text(width / 2, startY + gap * 4 + 10, `CPU DIFFICULTY: [ ${this.difficulty.toUpperCase()} ]`, {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '18px',
            color: '#ffcc00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.diffText.on('pointerdown', () => {
            sounds.playMenuMove();
            if (this.difficulty === 'easy') this.difficulty = 'normal';
            else if (this.difficulty === 'normal') this.difficulty = 'hard';
            else this.difficulty = 'easy';
            this.diffText.setText(`CPU DIFFICULTY: [ ${this.difficulty.toUpperCase()} ]`);
        });

        // Footer & Utility Controls
        this.soundBtn = this.add.text(40, height - 35, sounds.getMuted() ? '🔇 SOUND: OFF' : '🔊 SOUND: ON', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#aaaaaa'
        }).setInteractive({ useHandCursor: true });

        this.soundBtn.on('pointerdown', () => {
            const muted = sounds.toggleMute();
            this.soundBtn.setText(muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON');
        });

        const fullBtn = this.add.text(width - 40, height - 35, '⛶ FULLSCREEN', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        fullBtn.on('pointerdown', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        });
    }

    private createArcadeButton(x: number, y: number, text: string, color: number, callback: () => void) {
        const btn = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(color, 0.85);
        bg.fillRoundedRect(-140, -20, 280, 40, 8);
        bg.lineStyle(2, 0xffffff, 0.9);
        bg.strokeRoundedRect(-140, -20, 280, 40, 8);

        const label = this.add.text(0, 0, text, {
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, label]);
        btn.setSize(280, 40);
        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            sounds.playMenuMove();
            btn.setScale(1.05);
            bg.clear();
            bg.fillStyle(0xffffff, 0.95);
            bg.fillRoundedRect(-140, -20, 280, 40, 8);
            label.setColor('#000000');
        });

        btn.on('pointerout', () => {
            btn.setScale(1);
            bg.clear();
            bg.fillStyle(color, 0.85);
            bg.fillRoundedRect(-140, -20, 280, 40, 8);
            bg.lineStyle(2, 0xffffff, 0.9);
            bg.strokeRoundedRect(-140, -20, 280, 40, 8);
            label.setColor('#ffffff');
        });

        btn.on('pointerdown', callback);
    }

    private showMultiplayerModal() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, w, h);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);

        const modal = this.add.container(w / 2, h / 2);

        const panel = this.add.graphics();
        panel.fillStyle(0x181824, 0.98);
        panel.fillRoundedRect(-220, -150, 440, 300, 12);
        panel.lineStyle(3, 0x9933ff, 1);
        panel.strokeRoundedRect(-220, -150, 440, 300, 12);

        const title = this.add.text(0, -110, 'ONLINE MULTIPLAYER ROOM', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '22px',
            color: '#ffcc00'
        }).setOrigin(0.5);

        // Host Button
        const hostBtn = this.add.text(0, -40, '👑 HOST NEW ROOM', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '18px',
            color: '#00e5ff',
            backgroundColor: '#22223a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        hostBtn.on('pointerdown', async () => {
            hostBtn.setText('CREATING ROOM...');
            const code = await net.createRoom();
            overlay.destroy();
            modal.destroy();
            this.scene.start('CharSelectScene', {
                mode: 'multiplayer',
                isHost: true,
                roomCode: code
            });
        });

        // Join Button with prompt
        const joinBtn = this.add.text(0, 35, '🔑 JOIN WITH ROOM CODE', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '18px',
            color: '#00ff88',
            backgroundColor: '#22223a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        joinBtn.on('pointerdown', async () => {
            const entered = prompt('Enter 5-character Room Code:');
            if (entered && entered.trim().length > 0) {
                joinBtn.setText('JOINING...');
                const res = await net.joinRoom(entered.trim());
                if (res.success) {
                    overlay.destroy();
                    modal.destroy();
                    this.scene.start('CharSelectScene', {
                        mode: 'multiplayer',
                        isHost: false,
                        roomCode: entered.trim().toUpperCase()
                    });
                } else {
                    alert(res.message || 'Could not join room!');
                    joinBtn.setText('🔑 JOIN WITH ROOM CODE');
                }
            }
        });

        // Close button
        const closeBtn = this.add.text(0, 105, '✕ CANCEL', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            color: '#ff4444'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            modal.destroy();
        });

        modal.add([panel, title, hostBtn, joinBtn, closeBtn]);
    }

    private showHowToPlayModal() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, w, h);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);

        const modal = this.add.container(w / 2, h / 2);

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a24, 0.98);
        panel.fillRoundedRect(-260, -180, 520, 360, 12);
        panel.lineStyle(2, 0xff9933, 1);
        panel.strokeRoundedRect(-260, -180, 520, 360, 12);

        const title = this.add.text(0, -145, '🎮 CONTROLS & COMBAT SYSTEM', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '20px',
            color: '#ff9933'
        }).setOrigin(0.5);

        const instructions = [
            '🕹️ MOVEMENT: W/A/S/D or Arrow Keys (Jump, Walk, Crouch)',
            '👊 PUNCH: [ J ] (Quick jab, chains into combos)',
            '🦵 KICK: [ K ] (High damage, heavier reach)',
            '🤝 GRAB: [ U ] (Unblockable close-range throw)',
            '⚡ SPECIAL: [ I ] (Consumes 25% Shakti Energy)',
            '💥 SUPER MOVE: [ O ] (Unleash at 100% Shakti Meter!)',
            '🛡️ BLOCK: [ L ] (Absorbs 75% incoming damage)',
            '📱 MOBILE: On-screen responsive D-Pad & Touch Buttons!'
        ];

        instructions.forEach((line, idx) => {
            const t = this.add.text(-230, -100 + idx * 26, line, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#ffffff'
            });
            modal.add(t);
        });

        const closeBtn = this.add.text(0, 140, 'GOT IT! [ CLOSE ]', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '16px',
            color: '#00e5ff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            modal.destroy();
        });

        modal.add([panel, title, closeBtn]);
    }
}
