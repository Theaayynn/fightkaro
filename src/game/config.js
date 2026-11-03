import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
export const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    scene: [BootScene]
};
//# sourceMappingURL=config.js.map