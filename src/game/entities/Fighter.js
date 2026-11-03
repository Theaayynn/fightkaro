import Phaser from 'phaser';
export class Fighter extends Phaser.Physics.Arcade.Sprite {
    isPlayer;
    health = 100;
    shakti = 0; // Super meter
    cursors;
    punchKey;
    kickKey;
    blockKey;
    constructor(config) {
        super(config.scene, config.x, config.y, config.texture);
        this.isPlayer = config.isPlayer;
        config.scene.add.existing(this);
        config.scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setSize(50, 100);
        if (this.isPlayer && config.scene.input.keyboard) {
            this.cursors = config.scene.input.keyboard.createCursorKeys();
            this.punchKey = config.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
            this.kickKey = config.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
            this.blockKey = config.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
        }
    }
    update() {
        if (!this.isPlayer || !this.cursors)
            return;
        // Reset velocity
        this.setVelocityX(0);
        // Movement
        if (this.cursors.left?.isDown) {
            this.setVelocityX(-160);
        }
        else if (this.cursors.right?.isDown) {
            this.setVelocityX(160);
        }
        // Jump
        if (this.cursors.up?.isDown && this.body?.touching.down) {
            this.setVelocityY(-330);
        }
        // Attacks
        if (Phaser.Input.Keyboard.JustDown(this.punchKey)) {
            this.punch();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.kickKey)) {
            this.kick();
        }
    }
    punch() {
        console.log('Punch!');
        // Trigger hitbox / animation
    }
    kick() {
        console.log('Kick!');
        // Trigger hitbox / animation
    }
}
//# sourceMappingURL=Fighter.js.map