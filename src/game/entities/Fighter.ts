import Phaser from 'phaser';
import { CharacterData } from '../data/characters';
import { sounds } from '../audio/SoundManager';
import { net } from '../net/MultiplayerManager';

export type FighterState =
    | 'idle'
    | 'walk'
    | 'jump'
    | 'crouch'
    | 'punch'
    | 'kick'
    | 'grab'
    | 'special'
    | 'super'
    | 'block'
    | 'hurt'
    | 'knockout';

export interface FighterOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    character: CharacterData;
    isPlayer1: boolean;
    isCPU: boolean;
    difficulty?: 'easy' | 'normal' | 'hard';
}

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    public character: CharacterData;
    public isPlayer1: boolean;
    public isCPU: boolean;
    public difficulty: 'easy' | 'normal' | 'hard';

    public maxHealth: number = 100;
    public health: number = 100;
    public shakti: number = 0; // Super meter (0 to 100)
    public comboCount: number = 0;
    public currentState: FighterState = 'idle';

    public isGrounded: boolean = true;
    public opponent: Fighter | null = null;

    private attackHitbox: Phaser.GameObjects.Rectangle;
    private attackTimer: number = 0;
    private hurtTimer: number = 0;
    private aiDecisionTimer: number = 0;
    private comboResetTimer: number = 0;

    // Control bindings
    private keys: {
        up?: Phaser.Input.Keyboard.Key;
        down?: Phaser.Input.Keyboard.Key;
        left?: Phaser.Input.Keyboard.Key;
        right?: Phaser.Input.Keyboard.Key;
        punch?: Phaser.Input.Keyboard.Key;
        kick?: Phaser.Input.Keyboard.Key;
        grab?: Phaser.Input.Keyboard.Key;
        special?: Phaser.Input.Keyboard.Key;
        super?: Phaser.Input.Keyboard.Key;
        block?: Phaser.Input.Keyboard.Key;
    } = {};

    constructor(options: FighterOptions) {
        super(options.scene, options.x, options.y, `${options.character.id}_idle`);

        this.character = options.character;
        this.isPlayer1 = options.isPlayer1;
        this.isCPU = options.isCPU;
        this.difficulty = options.difficulty || 'normal';

        options.scene.add.existing(this);
        options.scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setSize(50, 110);
        this.setOffset(25, 20);

        // Attack Hitbox (invisible trigger)
        this.attackHitbox = options.scene.add.rectangle(0, 0, 55, 35, 0xff0000, 0);
        options.scene.physics.add.existing(this.attackHitbox);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setEnable(false);

        // Setup Controls if local player
        if (!this.isCPU && options.scene.input.keyboard) {
            this.setupControls();
        }

        // Face the center initially
        if (!this.isPlayer1) {
            this.setFlipX(true);
        }
    }

    private setupControls() {
        const kb = this.scene.input.keyboard!;
        if (this.isPlayer1) {
            // Player 1: WASD / Arrows + J (Punch), K (Kick), U (Grab), I (Special), O (Super), L (Block)
            this.keys = {
                up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
                punch: kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
                kick: kb.addKey(Phaser.Input.Keyboard.KeyCodes.K),
                grab: kb.addKey(Phaser.Input.Keyboard.KeyCodes.U),
                special: kb.addKey(Phaser.Input.Keyboard.KeyCodes.I),
                super: kb.addKey(Phaser.Input.Keyboard.KeyCodes.O),
                block: kb.addKey(Phaser.Input.Keyboard.KeyCodes.L)
            };
        } else {
            // Player 2 local keys: Arrows + Numpad / Keys
            this.keys = {
                up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
                down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
                left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
                right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
                punch: kb.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),
                kick: kb.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO),
                grab: kb.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR),
                special: kb.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_FIVE),
                super: kb.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX),
                block: kb.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE)
            };
        }
    }

    public setFighterState(state: FighterState) {
        if (this.currentState === 'knockout') return;
        this.currentState = state;
        const textureKey = `${this.character.id}_${state}`;
        if (this.scene.textures.exists(textureKey)) {
            this.setTexture(textureKey);
        }
    }

    public update(time: number, delta: number) {
        if (this.currentState === 'knockout') return;

        this.isGrounded = Boolean(this.body?.touching.down);

        // Auto-face opponent
        if (this.opponent && this.canTurn()) {
            if (this.x < this.opponent.x) {
                this.setFlipX(false);
            } else {
                this.setFlipX(true);
            }
        }

        // Combo reset timer
        if (this.comboCount > 0) {
            this.comboResetTimer += delta;
            if (this.comboResetTimer > 1500) {
                this.comboCount = 0;
                this.comboResetTimer = 0;
            }
        }

        // Handle Active Attack Timing
        if (this.isAttacking()) {
            this.attackTimer += delta;
            this.checkAttackCollision();

            const attackDuration = this.currentState === 'super' ? 650 : 280;
            if (this.attackTimer >= attackDuration) {
                this.endAttack();
            }
            return;
        }

        // Handle Hurt Stun
        if (this.currentState === 'hurt') {
            this.hurtTimer += delta;
            if (this.hurtTimer > 250) {
                this.hurtTimer = 0;
                this.setFighterState('idle');
            }
            return;
        }

        // CPU AI execution
        if (this.isCPU && this.opponent) {
            this.updateCPU(delta);
            return;
        }

        // Handle Local Player Input
        this.handlePlayerInput();
    }

    private canTurn(): boolean {
        return !['punch', 'kick', 'grab', 'special', 'super', 'hurt', 'knockout'].includes(this.currentState);
    }

    public isAttacking(): boolean {
        return ['punch', 'kick', 'grab', 'special', 'super'].includes(this.currentState);
    }

    public isBlocking(): boolean {
        return this.currentState === 'block';
    }

    private handlePlayerInput() {
        if (this.isAttacking() || this.currentState === 'hurt') return;

        // Block
        if (this.keys.block?.isDown) {
            this.setVelocityX(0);
            this.setFighterState('block');
            return;
        }

        // Attacks
        if (Phaser.Input.Keyboard.JustDown(this.keys.super!) && this.shakti >= 100) {
            this.performSuper();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.special!) && this.shakti >= 25) {
            this.performSpecial();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.punch!)) {
            this.performPunch();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.kick!)) {
            this.performKick();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.grab!)) {
            this.performGrab();
            return;
        }

        // Crouch
        if (this.keys.down?.isDown && this.isGrounded) {
            this.setVelocityX(0);
            this.setFighterState('crouch');
            return;
        }

        // Jump
        if (this.keys.up?.isDown && this.isGrounded) {
            this.setVelocityY(-480);
            this.setFighterState('jump');
            return;
        }

        // Horizontal Movement
        const speed = 200 * (this.character.stats.speed / 75);
        if (this.keys.left?.isDown) {
            this.setVelocityX(-speed);
            if (this.isGrounded) this.setFighterState('walk');
        } else if (this.keys.right?.isDown) {
            this.setVelocityX(speed);
            if (this.isGrounded) this.setFighterState('walk');
        } else {
            this.setVelocityX(0);
            if (this.isGrounded) this.setFighterState('idle');
        }
    }

    // Touch / Virtual Controls Direct Actions
    public performPunch() {
        if (this.isAttacking() || this.currentState === 'hurt') return;
        this.setFighterState('punch');
        this.attackTimer = 0;
        this.setVelocityX(this.flipX ? -60 : 60);
        sounds.playPunch();
        this.activateHitbox(40, 25, 12, 10);
        this.broadcastAction('punch');
    }

    public performKick() {
        if (this.isAttacking() || this.currentState === 'hurt') return;
        this.setFighterState('kick');
        this.attackTimer = 0;
        this.setVelocityX(this.flipX ? -80 : 80);
        sounds.playKick();
        this.activateHitbox(55, 30, 16, 15);
        this.broadcastAction('kick');
    }

    public performGrab() {
        if (this.isAttacking() || this.currentState === 'hurt') return;
        this.setFighterState('grab');
        this.attackTimer = 0;
        this.setVelocityX(0);
        sounds.playPunch();
        this.activateHitbox(35, 35, 18, 12);
        this.broadcastAction('grab');
    }

    public performSpecial() {
        if (this.isAttacking() || this.shakti < 25) return;
        this.shakti = Math.max(0, this.shakti - 25);
        this.setFighterState('special');
        this.attackTimer = 0;
        sounds.playSuperMove();
        this.activateHitbox(70, 45, this.character.specialMove.damage, 20);
        this.broadcastAction('special');
    }

    public performSuper() {
        if (this.isAttacking() || this.shakti < 100) return;
        this.shakti = 0;
        this.setFighterState('super');
        this.attackTimer = 0;
        this.setVelocityX(0);

        // Screen shake & super sound
        this.scene.cameras.main.shake(300, 0.015);
        sounds.playSuperMove();

        this.activateHitbox(90, 80, this.character.superMove.damage, 35);
        this.broadcastAction('super');
    }

    public startBlock() {
        if (this.isAttacking()) return;
        this.setFighterState('block');
        this.setVelocityX(0);
        this.broadcastAction('block');
    }

    public stopBlock() {
        if (this.currentState === 'block') {
            this.setFighterState('idle');
        }
    }

    public jump() {
        if (this.isGrounded && !this.isAttacking()) {
            this.setVelocityY(-480);
            this.setFighterState('jump');
            this.broadcastAction('jump');
        }
    }

    public crouch(down: boolean) {
        if (this.isGrounded && !this.isAttacking()) {
            if (down) {
                this.setVelocityX(0);
                this.setFighterState('crouch');
            } else {
                this.setFighterState('idle');
            }
        }
    }

    private activateHitbox(width: number, height: number, _damage: number, _knockback: number) {
        const offsetX = this.flipX ? -width / 2 - 20 : width / 2 + 20;
        this.attackHitbox.setPosition(this.x + offsetX, this.y - 10);
        this.attackHitbox.setSize(width, height);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setEnable(true);
    }

    private checkAttackCollision() {
        if (!this.opponent || !(this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable) return;

        const hit = Phaser.Geom.Intersects.RectangleToRectangle(
            this.attackHitbox.getBounds(),
            this.opponent.getBounds()
        );

        if (hit) {
            // Hit landed!
            (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setEnable(false);

            let baseDamage = 10;
            let knockback = 120;

            if (this.currentState === 'punch') {
                baseDamage = 10 * (this.character.stats.attack / 75);
                knockback = 100;
            } else if (this.currentState === 'kick') {
                baseDamage = 16 * (this.character.stats.attack / 75);
                knockback = 160;
            } else if (this.currentState === 'grab') {
                baseDamage = 18;
                knockback = 180;
            } else if (this.currentState === 'special') {
                baseDamage = this.character.specialMove.damage;
                knockback = 240;
            } else if (this.currentState === 'super') {
                baseDamage = this.character.superMove.damage;
                knockback = 340;
            }

            // Increase Shakti energy on successful hit
            this.shakti = Math.min(100, this.shakti + 12);
            this.comboCount++;
            this.comboResetTimer = 0;

            // Apply Damage to Opponent
            this.opponent.takeDamage(baseDamage, this.flipX ? -knockback : knockback, this.currentState === 'grab');
        }
    }

    private endAttack() {
        this.attackTimer = 0;
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setEnable(false);
        this.setFighterState('idle');
    }

    public takeDamage(amount: number, knockbackX: number, isUnblockable: boolean = false) {
        if (this.currentState === 'knockout') return;

        // Blocking reduces damage by 75%
        if (this.isBlocking() && !isUnblockable) {
            amount = Math.max(1, Math.floor(amount * 0.25));
            sounds.playBlock();
            this.scene.cameras.main.shake(80, 0.003);
            this.setVelocityX(knockbackX * 0.3);
            return;
        }

        // Regular hit
        this.health = Math.max(0, this.health - amount);
        this.shakti = Math.min(100, this.shakti + 8); // gain super on taking damage
        sounds.playHitImpact();
        this.scene.cameras.main.shake(150, 0.008);

        // Apply knockback
        this.setVelocityX(knockbackX);
        this.setVelocityY(-150);

        // Check Knockout
        if (this.health <= 0) {
            this.knockout();
        } else {
            this.setFighterState('hurt');
            this.hurtTimer = 0;
        }
    }

    public knockout() {
        this.health = 0;
        this.setFighterState('knockout');
        sounds.playKO();
        this.setVelocityX(this.flipX ? 200 : -200);
        this.setVelocityY(-250);
        this.scene.cameras.main.shake(400, 0.02);
    }

    private broadcastAction(type: string) {
        if (net.isMultiplayer && !this.isCPU) {
            net.sendAction({
                type,
                x: this.x,
                y: this.y,
                flipX: this.flipX,
                health: this.health,
                shakti: this.shakti
            });
        }
    }

    // 3-Tier Strategic CPU AI System (Easy, Normal, Hard)
    private updateCPU(delta: number) {
        if (!this.opponent) return;

        this.aiDecisionTimer += delta;
        const decisionInterval = this.difficulty === 'hard' ? 140 : this.difficulty === 'normal' ? 240 : 450;

        if (this.aiDecisionTimer < decisionInterval) return;
        this.aiDecisionTimer = 0;

        const distance = Math.abs(this.x - this.opponent.x);
        const rand = Math.random();

        // Hard AI: Strategic Blocking against player attacks
        if (this.difficulty === 'hard' && this.opponent.isAttacking() && distance < 100 && rand < 0.75) {
            this.startBlock();
            this.scene.time.delayedCall(300, () => this.stopBlock());
            return;
        }

        // Close Combat Range (< 90px)
        if (distance < 90) {
            if (this.shakti >= 100 && rand < (this.difficulty === 'hard' ? 0.9 : 0.6)) {
                this.performSuper();
            } else if (this.shakti >= 25 && rand < 0.5) {
                this.performSpecial();
            } else if (rand < 0.45) {
                this.performPunch();
            } else if (rand < 0.8) {
                this.performKick();
            } else {
                this.performGrab();
            }
        }
        // Mid Range (90 - 220px)
        else if (distance < 220) {
            if (this.difficulty === 'hard' && rand < 0.3) {
                this.jump(); // Jump in attack
            }
            // Move toward opponent
            const speed = 180 * (this.character.stats.speed / 75);
            if (this.x < this.opponent.x) {
                this.setVelocityX(speed);
                this.setFighterState('walk');
            } else {
                this.setVelocityX(-speed);
                this.setFighterState('walk');
            }
        }
        // Far Range (> 220px)
        else {
            // Close the gap
            const speed = 200 * (this.character.stats.speed / 75);
            if (this.x < this.opponent.x) {
                this.setVelocityX(speed);
                this.setFighterState('walk');
            } else {
                this.setVelocityX(-speed);
                this.setFighterState('walk');
            }
        }
    }
}
