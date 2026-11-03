import Phaser from 'phaser';
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    preload() {
        // Preload assets here
    }
    create() {
        this.add.text(400, 300, 'Game Started', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
    }
}
//# sourceMappingURL=BootScene.js.map