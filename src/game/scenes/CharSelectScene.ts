import Phaser from 'phaser';
import { CharacterData, CHARACTERS } from '../data/characters';
import { StageData, STAGES } from '../data/stages';
import { sounds } from '../audio/SoundManager';
import { net } from '../net/MultiplayerManager';

export class CharSelectScene extends Phaser.Scene {
    private mode: 'cpu' | 'local' | 'multiplayer' = 'cpu';
    private difficulty: 'easy' | 'normal' | 'hard' = 'normal';
    private isHost: boolean = false;
    private roomCode: string = '';

    private p1Char: CharacterData = CHARACTERS[0];
    private p2Char: CharacterData = CHARACTERS[1];
    private selectedStage: StageData = STAGES[0];
    private activeSelectingPlayer: 1 | 2 = 1;

    private p1PreviewSprite!: Phaser.GameObjects.Sprite;
    private p2PreviewSprite!: Phaser.GameObjects.Sprite;
    private p1InfoText!: Phaser.GameObjects.Text;
    private p2InfoText!: Phaser.GameObjects.Text;
    private stageText!: Phaser.GameObjects.Text;
    private readyBtn!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'CharSelectScene' });
    }

    init(data: any) {
        this.mode = data.mode || 'cpu';
        this.difficulty = data.difficulty || 'normal';
        this.isHost = Boolean(data.isHost);
        this.roomCode = data.roomCode || '';
        this.activeSelectingPlayer = 1;
        this.p1Char = CHARACTERS[0];
        this.p2Char = CHARACTERS[1];
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x180b2a, 0x180b2a, 0x070c18, 0x070c18, 1);
        bg.fillRect(0, 0, w, h);

        // Header Title
        let headerTitle = 'CHOOSE YOUR FIGHTER';
        if (this.mode === 'multiplayer') {
            headerTitle = `ONLINE ROOM: ${this.roomCode} (YOU ARE P${net.playerNumber})`;
        }

        this.add.text(w / 2, 35, headerTitle, {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '32px',
            color: '#ff9933'
        }).setOrigin(0.5);

        // Character Grid in center
        const startX = w / 2 - ((CHARACTERS.length) * 90) / 2 + 45;
        CHARACTERS.forEach((char, index) => {
            const cardX = startX + index * 90;
            const cardY = 110;

            const card = this.add.container(cardX, cardY);
            const box = this.add.graphics();
            box.fillStyle(char.avatarColor, 0.3);
            box.fillRoundedRect(-40, -45, 80, 90, 8);
            box.lineStyle(2, 0xffffff, 0.7);
            box.strokeRoundedRect(-40, -45, 80, 90, 8);

            const sprite = this.add.sprite(0, 5, `${char.id}_idle`).setScale(0.65);
            const name = this.add.text(0, 32, char.name.split(' ')[0], {
                fontFamily: 'Arial Black, sans-serif',
                fontSize: '11px',
                color: '#ffffff'
            }).setOrigin(0.5);

            card.add([box, sprite, name]);
            card.setSize(80, 90);
            card.setInteractive({ useHandCursor: true });

            card.on('pointerover', () => {
                sounds.playMenuMove();
                card.setScale(1.08);
            });

            card.on('pointerout', () => {
                card.setScale(1);
            });

            card.on('pointerdown', () => {
                sounds.playMenuSelect();
                this.selectCharacter(char);
            });
        });

        // Left: Player 1 Preview
        this.add.text(120, 180, 'PLAYER 1', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '20px',
            color: '#00e5ff'
        }).setOrigin(0.5);

        this.p1PreviewSprite = this.add.sprite(120, 270, `${this.p1Char.id}_idle`).setScale(1.2);
        this.p1InfoText = this.add.text(120, 370, this.getCharacterStatsText(this.p1Char), {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Right: Player 2 / CPU Preview
        const p2Label = this.mode === 'cpu' ? 'CPU OPPONENT' : 'PLAYER 2';
        this.add.text(w - 120, 180, p2Label, {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '20px',
            color: '#ff3366'
        }).setOrigin(0.5);

        this.p2PreviewSprite = this.add.sprite(w - 120, 270, `${this.p2Char.id}_idle`).setScale(1.2);
        this.p2PreviewSprite.setFlipX(true);
        this.p2InfoText = this.add.text(w - 120, 370, this.getCharacterStatsText(this.p2Char), {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Stage Selector (Center Bottom)
        this.stageText = this.add.text(w / 2, 440, `ARENA: ${this.selectedStage.name} [ CLICK TO CHANGE ]`, {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '15px',
            color: '#ffcc00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.stageText.on('pointerdown', () => {
            sounds.playMenuMove();
            let idx = STAGES.findIndex(s => s.id === this.selectedStage.id);
            idx = (idx + 1) % STAGES.length;
            this.selectedStage = STAGES[idx];
            this.stageText.setText(`ARENA: ${this.selectedStage.name} [ CLICK TO CHANGE ]`);
        });

        // Fight Button
        this.readyBtn = this.add.text(w / 2, 505, '🔥 START FIGHT! 🔥', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#138808',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.readyBtn.on('pointerover', () => {
            this.readyBtn.setScale(1.06);
        });

        this.readyBtn.on('pointerout', () => {
            this.readyBtn.setScale(1);
        });

        this.readyBtn.on('pointerdown', () => {
            this.startFight();
        });

        // Back to Menu Button
        const backBtn = this.add.text(45, h - 30, '← BACK TO MENU', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#888888'
        }).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            net.reset();
            this.scene.start('MenuScene');
        });

        // Multiplayer Socket Listeners
        if (this.mode === 'multiplayer' && net.socket) {
            net.socket.on('opponent_selected_char', (data: { playerNumber: 1 | 2; characterId: string }) => {
                const found = CHARACTERS.find(c => c.id === data.characterId);
                if (found) {
                    if (data.playerNumber === 1) {
                        this.p1Char = found;
                        this.p1PreviewSprite.setTexture(`${found.id}_idle`);
                        this.p1InfoText.setText(this.getCharacterStatsText(found));
                    } else {
                        this.p2Char = found;
                        this.p2PreviewSprite.setTexture(`${found.id}_idle`);
                        this.p2InfoText.setText(this.getCharacterStatsText(found));
                    }
                }
            });

            net.socket.on('start_match', (data: { stageId: string }) => {
                const stage = STAGES.find(s => s.id === data.stageId) || this.selectedStage;
                this.scene.start('FightScene', {
                    player1Character: this.p1Char,
                    player2Character: this.p2Char,
                    stage,
                    isCPU: false,
                    isMultiplayer: true
                });
            });
        }
    }

    private selectCharacter(char: CharacterData) {
        if (this.mode === 'multiplayer') {
            if (net.playerNumber === 1) {
                this.p1Char = char;
                this.p1PreviewSprite.setTexture(`${char.id}_idle`);
                this.p1InfoText.setText(this.getCharacterStatsText(char));
            } else {
                this.p2Char = char;
                this.p2PreviewSprite.setTexture(`${char.id}_idle`);
                this.p2InfoText.setText(this.getCharacterStatsText(char));
            }

            if (net.socket && this.roomCode) {
                net.socket.emit('select_character', {
                    roomCode: this.roomCode,
                    characterId: char.id
                });
            }
            return;
        }

        if (this.activeSelectingPlayer === 1) {
            this.p1Char = char;
            this.p1PreviewSprite.setTexture(`${char.id}_idle`);
            this.p1InfoText.setText(this.getCharacterStatsText(char));

            if (this.mode === 'cpu') {
                // Auto choose a different CPU opponent
                const pool = CHARACTERS.filter(c => c.id !== char.id);
                this.p2Char = pool[Math.floor(Math.random() * pool.length)];
                this.p2PreviewSprite.setTexture(`${this.p2Char.id}_idle`);
                this.p2InfoText.setText(this.getCharacterStatsText(this.p2Char));
            } else {
                // In local 2P, let next click select P2
                this.activeSelectingPlayer = 2;
            }
        } else {
            this.p2Char = char;
            this.p2PreviewSprite.setTexture(`${char.id}_idle`);
            this.p2InfoText.setText(this.getCharacterStatsText(char));
            this.activeSelectingPlayer = 1;
        }
    }

    private getCharacterStatsText(char: CharacterData): string {
        return `${char.title}\n"${char.quote}"\n\nATK: ${char.stats.attack}  |  DEF: ${char.stats.defense}\nSPD: ${char.stats.speed}  |  SHAKTI: ${char.stats.shakti}\n\nSPECIAL: ${char.specialMove.name}\nSUPER: ${char.superMove.name}`;
    }

    private startFight() {
        sounds.playRoundStart();

        if (this.mode === 'multiplayer') {
            this.readyBtn.setText('WAITING FOR OPPONENT...');
            return;
        }

        this.scene.start('FightScene', {
            player1Character: this.p1Char,
            player2Character: this.p2Char,
            stage: this.selectedStage,
            isCPU: this.mode === 'cpu',
            difficulty: this.difficulty,
            isMultiplayer: false
        });
    }
}
