import Phaser from 'phaser';
import { CharacterData } from '../data/characters';
import { StageData } from '../data/stages';
import { Fighter } from '../entities/Fighter';
import { sounds } from '../audio/SoundManager';
import { net } from '../net/MultiplayerManager';

export class FightScene extends Phaser.Scene {
    private p1Char!: CharacterData;
    private p2Char!: CharacterData;
    private stageData!: StageData;
    private isCPU: boolean = true;
    private difficulty: 'easy' | 'normal' | 'hard' = 'normal';
    private isMultiplayer: boolean = false;

    public player1!: Fighter;
    public player2!: Fighter;

    // HUD Elements
    private p1HealthBar!: Phaser.GameObjects.Graphics;
    private p2HealthBar!: Phaser.GameObjects.Graphics;
    private p1ShaktiBar!: Phaser.GameObjects.Graphics;
    private p2ShaktiBar!: Phaser.GameObjects.Graphics;
    private p1ShaktiAlert!: Phaser.GameObjects.Text;
    private p2ShaktiAlert!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private roundBanner!: Phaser.GameObjects.Text;

    private matchTimeRemaining: number = 99;
    private matchTimerEvent!: Phaser.Time.TimerEvent;
    private isMatchOver: boolean = false;
    private isPaused: boolean = false;
    private pauseMenuContainer?: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'FightScene' });
    }

    init(data: any) {
        this.p1Char = data.player1Character;
        this.p2Char = data.player2Character;
        this.stageData = data.stage;
        this.isCPU = Boolean(data.isCPU);
        this.difficulty = data.difficulty || 'normal';
        this.isMultiplayer = Boolean(data.isMultiplayer);
        this.matchTimeRemaining = 99;
        this.isMatchOver = false;
        this.isPaused = false;
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Start BGM
        sounds.startFightBgm();

        // Stage Background
        this.add.image(w / 2, h / 2, `bg_${this.stageData.id}`).setDisplaySize(w, h);

        // Invisible Ground Platform
        const ground = this.physics.add.staticGroup();
        const groundY = h - 50;
        const groundPlatform = this.add.rectangle(w / 2, groundY, w, 20, 0x000000, 0);
        ground.add(groundPlatform);

        // Create Fighters
        this.player1 = new Fighter({
            scene: this,
            x: 220,
            y: groundY - 80,
            character: this.p1Char,
            isPlayer1: true,
            isCPU: false
        });

        this.player2 = new Fighter({
            scene: this,
            x: 580,
            y: groundY - 80,
            character: this.p2Char,
            isPlayer1: false,
            isCPU: this.isCPU && !this.isMultiplayer,
            difficulty: this.difficulty
        });

        // Set Opponents
        this.player1.opponent = this.player2;
        this.player2.opponent = this.player1;

        // Physics Colliders
        this.physics.add.collider(this.player1, ground);
        this.physics.add.collider(this.player2, ground);
        this.physics.add.collider(this.player1, this.player2);

        // Build Top HUD
        this.createHUD(w);

        // Mobile On-Screen Touch Controls
        this.createMobileTouchControls(w, h);

        // Match Timer Countdown (Every 1s)
        this.matchTimerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isMatchOver || this.isPaused) return;
                this.matchTimeRemaining--;
                this.timerText.setText(this.matchTimeRemaining.toString().padStart(2, '0'));

                if (this.matchTimeRemaining <= 0) {
                    this.handleTimeOver();
                }
            },
            loop: true
        });

        // Round Start Cinematic Banner
        this.playRoundStartSequence(w, h);

        // Keyboard Pause Key (ESC)
        this.input.keyboard?.on('keydown-ESC', () => {
            this.togglePause();
        });

        // Setup Multiplayer Network Listener
        if (this.isMultiplayer && net.socket) {
            net.socket.on('opponent_action', (action: any) => {
                const target = net.playerNumber === 1 ? this.player2 : this.player1;
                this.applyNetworkAction(target, action);
            });
        }
    }

    private createHUD(w: number) {
        // P1 Header
        this.add.text(35, 18, this.p1Char.name, {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '18px',
            color: '#00e5ff'
        });

        // P2 Header
        this.add.text(w - 35, 18, this.p2Char.name, {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '18px',
            color: '#ff3366'
        }).setOrigin(1, 0);

        // Health Bars
        this.p1HealthBar = this.add.graphics();
        this.p2HealthBar = this.add.graphics();
        this.drawHealthBars(w);

        // Shakti (Super) Bars
        this.p1ShaktiBar = this.add.graphics();
        this.p2ShaktiBar = this.add.graphics();
        this.drawShaktiBars(w);

        // Super Ready Alerts
        this.p1ShaktiAlert = this.add.text(35, 75, '🔥 SHAKTI READY [O]! 🔥', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '12px',
            color: '#ffcc00'
        }).setVisible(false);

        this.p2ShaktiAlert = this.add.text(w - 35, 75, '🔥 SHAKTI READY! 🔥', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '12px',
            color: '#ffcc00'
        }).setOrigin(1, 0).setVisible(false);

        // Center Timer Box
        const timerBg = this.add.graphics();
        timerBg.fillStyle(0x111122, 0.9);
        timerBg.fillRoundedRect(w / 2 - 32, 16, 64, 46, 8);
        timerBg.lineStyle(2, 0xffcc00, 1);
        timerBg.strokeRoundedRect(w / 2 - 32, 16, 64, 46, 8);

        this.timerText = this.add.text(w / 2, 39, '99', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Combo Counter Text
        this.comboText = this.add.text(w / 2, 110, '', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '30px',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setVisible(false);

        // Pause Button (Top Right)
        const pauseBtn = this.add.text(w - 20, 15, '⏸', {
            fontSize: '22px'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        pauseBtn.on('pointerdown', () => this.togglePause());
    }

    private drawHealthBars(w: number) {
        const barWidth = 300;
        const barHeight = 20;

        // P1 Health Bar
        this.p1HealthBar.clear();
        this.p1HealthBar.fillStyle(0x331111, 0.85);
        this.p1HealthBar.fillRoundedRect(35, 42, barWidth, barHeight, 4);

        const p1Pct = Math.max(0, this.player1 ? this.player1.health / 100 : 1);
        this.p1HealthBar.fillStyle(p1Pct > 0.3 ? 0x00e575 : 0xff3300, 1);
        this.p1HealthBar.fillRoundedRect(35, 42, barWidth * p1Pct, barHeight, 4);

        // P2 Health Bar
        this.p2HealthBar.clear();
        this.p2HealthBar.fillStyle(0x331111, 0.85);
        this.p2HealthBar.fillRoundedRect(w - 35 - barWidth, 42, barWidth, barHeight, 4);

        const p2Pct = Math.max(0, this.player2 ? this.player2.health / 100 : 1);
        this.p2HealthBar.fillStyle(p2Pct > 0.3 ? 0x00e575 : 0xff3300, 1);
        this.p2HealthBar.fillRoundedRect(w - 35 - barWidth * p2Pct, 42, barWidth * p2Pct, barHeight, 4);
    }

    private drawShaktiBars(w: number) {
        const barWidth = 180;
        const barHeight = 10;

        // P1 Shakti
        this.p1ShaktiBar.clear();
        this.p1ShaktiBar.fillStyle(0x1a1a33, 0.8);
        this.p1ShaktiBar.fillRect(35, 65, barWidth, barHeight);

        const p1ShaktiPct = Math.min(1, this.player1 ? this.player1.shakti / 100 : 0);
        this.p1ShaktiBar.fillStyle(p1ShaktiPct >= 1 ? 0xffcc00 : 0x00c3ff, 1);
        this.p1ShaktiBar.fillRect(35, 65, barWidth * p1ShaktiPct, barHeight);
        this.p1ShaktiAlert.setVisible(p1ShaktiPct >= 1);

        // P2 Shakti
        this.p2ShaktiBar.clear();
        this.p2ShaktiBar.fillStyle(0x1a1a33, 0.8);
        this.p2ShaktiBar.fillRect(w - 35 - barWidth, 65, barWidth, barHeight);

        const p2ShaktiPct = Math.min(1, this.player2 ? this.player2.shakti / 100 : 0);
        this.p2ShaktiBar.fillStyle(p2ShaktiPct >= 1 ? 0xffcc00 : 0x00c3ff, 1);
        this.p2ShaktiBar.fillRect(w - 35 - barWidth * p2ShaktiPct, 65, barWidth * p2ShaktiPct, barHeight);
        this.p2ShaktiAlert.setVisible(p2ShaktiPct >= 1);
    }

    private playRoundStartSequence(w: number, h: number) {
        this.roundBanner = this.add.text(w / 2, h / 2 - 40, 'ROUND 1', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '64px',
            color: '#ff9933',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        sounds.playRoundStart();

        this.time.delayedCall(1000, () => {
            this.roundBanner.setText('FIGHT!');
            this.roundBanner.setColor('#00e5ff');
            this.cameras.main.shake(200, 0.008);

            this.time.delayedCall(800, () => {
                this.tweens.add({
                    targets: this.roundBanner,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        this.roundBanner.destroy();
                    }
                });
            });
        });
    }

    private createMobileTouchControls(w: number, h: number) {
        // Virtual D-Pad (Left side)
        const dpadX = 85;
        const dpadY = h - 85;

        // Left button
        this.createTouchButton(dpadX - 45, dpadY, '◀', () => {
            this.player1.setVelocityX(-200);
            this.player1.setFighterState('walk');
        }, () => {
            this.player1.setVelocityX(0);
            this.player1.setFighterState('idle');
        });

        // Right button
        this.createTouchButton(dpadX + 45, dpadY, '▶', () => {
            this.player1.setVelocityX(200);
            this.player1.setFighterState('walk');
        }, () => {
            this.player1.setVelocityX(0);
            this.player1.setFighterState('idle');
        });

        // Jump button
        this.createTouchButton(dpadX, dpadY - 45, '▲', () => {
            this.player1.jump();
        });

        // Crouch button
        this.createTouchButton(dpadX, dpadY + 45, '▼', () => {
            this.player1.crouch(true);
        }, () => {
            this.player1.crouch(false);
        });

        // Action Buttons (Right side)
        const actX = w - 120;
        const actY = h - 90;

        // Punch (P)
        this.createActionButton(actX - 50, actY - 20, 'PUNCH', 0xff3366, () => {
            this.player1.performPunch();
        });

        // Kick (K)
        this.createActionButton(actX + 45, actY - 20, 'KICK', 0xff9900, () => {
            this.player1.performKick();
        });

        // Grab (G)
        this.createActionButton(actX - 50, actY + 45, 'GRAB', 0x9933ff, () => {
            this.player1.performGrab();
        });

        // Block (B)
        this.createActionButton(actX + 45, actY + 45, 'BLOCK', 0x0077be, () => {
            this.player1.startBlock();
        }, () => {
            this.player1.stopBlock();
        });

        // SUPER BUTTON (Center Right)
        this.createActionButton(actX, actY - 75, '⚡ SUPER', 0xffcc00, () => {
            this.player1.performSuper();
        });
    }

    private createTouchButton(x: number, y: number, label: string, onDown: () => void, onUp?: () => void) {
        const bg = this.add.circle(x, y, 22, 0x222233, 0.7);
        bg.setStrokeStyle(2, 0xffffff, 0.8);
        const txt = this.add.text(x, y, label, { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', onDown);
        if (onUp) bg.on('pointerup', onUp);
        if (onUp) bg.on('pointerout', onUp);
    }

    private createActionButton(x: number, y: number, label: string, color: number, onDown: () => void, onUp?: () => void) {
        const bg = this.add.graphics();
        bg.fillStyle(color, 0.85);
        bg.fillRoundedRect(x - 38, y - 18, 76, 36, 6);
        bg.lineStyle(2, 0xffffff, 0.9);
        bg.strokeRoundedRect(x - 38, y - 18, 76, 36, 6);

        const txt = this.add.text(x, y, label, {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '11px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(x, y, 76, 36, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerdown', () => {
            hitArea.setScale(0.95);
            onDown();
        });

        hitArea.on('pointerup', () => {
            hitArea.setScale(1);
            if (onUp) onUp();
        });

        hitArea.on('pointerout', () => {
            hitArea.setScale(1);
            if (onUp) onUp();
        });
    }

    override update(time: number, delta: number) {
        if (this.isPaused) return;

        this.player1.update(time, delta);
        this.player2.update(time, delta);

        // Update HUD
        const w = this.cameras.main.width;
        this.drawHealthBars(w);
        this.drawShaktiBars(w);

        // Combo Counter display
        const activeCombo = Math.max(this.player1.comboCount, this.player2.comboCount);
        if (activeCombo >= 2) {
            this.comboText.setText(`${activeCombo} HITS!`);
            this.comboText.setVisible(true);
        } else {
            this.comboText.setVisible(false);
        }

        // Check Victory / Defeat Condition
        if (!this.isMatchOver) {
            if (this.player1.health <= 0) {
                this.endMatch(this.player2.character, this.player1.character);
            } else if (this.player2.health <= 0) {
                this.endMatch(this.player1.character, this.player2.character);
            }
        }
    }

    private handleTimeOver() {
        if (this.isMatchOver) return;
        this.isMatchOver = true;

        let winner = this.player1.character;
        let loser = this.player2.character;

        if (this.player2.health > this.player1.health) {
            winner = this.player2.character;
            loser = this.player1.character;
        }

        this.endMatch(winner, loser, true);
    }

    private endMatch(winner: CharacterData, loser: CharacterData, isTimeOver: boolean = false) {
        this.isMatchOver = true;
        sounds.stopBgm();

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        const koText = this.add.text(w / 2, h / 2 - 20, isTimeOver ? 'TIME OVER!' : 'K.O.!', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '80px',
            color: '#ff0033',
            stroke: '#ffffff',
            strokeThickness: 10
        }).setOrigin(0.5);

        this.cameras.main.shake(500, 0.02);

        this.time.delayedCall(2000, () => {
            koText.destroy();
            this.scene.start('GameOverScene', {
                winner,
                loser,
                stage: this.stageData,
                isCPU: this.isCPU,
                difficulty: this.difficulty,
                isMultiplayer: this.isMultiplayer
            });
        });
    }

    private togglePause() {
        this.isPaused = !this.isPaused;
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        if (this.isPaused) {
            this.pauseMenuContainer = this.add.container(w / 2, h / 2);

            const bg = this.add.graphics();
            bg.fillStyle(0x000000, 0.8);
            bg.fillRect(-w / 2, -h / 2, w, h);

            const panel = this.add.graphics();
            panel.fillStyle(0x1a1a2e, 0.95);
            panel.fillRoundedRect(-140, -100, 280, 200, 10);
            panel.lineStyle(2, 0xffcc00, 1);
            panel.strokeRoundedRect(-140, -100, 280, 200, 10);

            const title = this.add.text(0, -65, 'GAME PAUSED', {
                fontFamily: 'Arial Black, sans-serif',
                fontSize: '22px',
                color: '#ffcc00'
            }).setOrigin(0.5);

            const resumeBtn = this.add.text(0, -10, '▶ RESUME', {
                fontFamily: 'Arial Black, sans-serif',
                fontSize: '18px',
                color: '#00e5ff'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            resumeBtn.on('pointerdown', () => this.togglePause());

            const quitBtn = this.add.text(0, 45, '🚪 QUIT TO MENU', {
                fontFamily: 'Arial Black, sans-serif',
                fontSize: '18px',
                color: '#ff4444'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            quitBtn.on('pointerdown', () => {
                sounds.stopBgm();
                net.reset();
                this.scene.start('MenuScene');
            });

            this.pauseMenuContainer.add([bg, panel, title, resumeBtn, quitBtn]);
        } else {
            this.pauseMenuContainer?.destroy();
        }
    }

    private applyNetworkAction(fighter: Fighter, action: any) {
        if (!fighter) return;

        if (action.type === 'punch') fighter.performPunch();
        else if (action.type === 'kick') fighter.performKick();
        else if (action.type === 'grab') fighter.performGrab();
        else if (action.type === 'special') fighter.performSpecial();
        else if (action.type === 'super') fighter.performSuper();
        else if (action.type === 'block') fighter.startBlock();
        else if (action.type === 'jump') fighter.jump();

        if (typeof action.x === 'number') fighter.setX(action.x);
        if (typeof action.flipX === 'boolean') fighter.setFlipX(action.flipX);
    }
}
