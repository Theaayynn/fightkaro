import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CharSelectScene } from './scenes/CharSelectScene';
import { FightScene } from './scenes/FightScene';
import { GameOverScene } from './scenes/GameOverScene';

export const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#0a0a14',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 750 },
            debug: false
        }
    },
    input: {
        keyboard: true,
        touch: true
    },
    scene: [BootScene, MenuScene, CharSelectScene, FightScene, GameOverScene]
};
