import Phaser from 'phaser';
export interface FighterConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    texture: string;
    isPlayer: boolean;
}
export declare class Fighter extends Phaser.Physics.Arcade.Sprite {
    isPlayer: boolean;
    health: number;
    shakti: number;
    private cursors?;
    private punchKey?;
    private kickKey?;
    private blockKey?;
    constructor(config: FighterConfig);
    update(): void;
    punch(): void;
    kick(): void;
}
//# sourceMappingURL=Fighter.d.ts.map