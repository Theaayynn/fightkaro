import Phaser from 'phaser';
import { FighterRenderer } from '../graphics/FighterRenderer';
import { STAGES } from '../data/stages';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create Loading Bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const title = this.add.text(width / 2, height / 2 - 50, 'FIGHTKARO', {
            fontFamily: 'Impact, sans-serif',
            fontSize: '48px',
            color: '#ff9933'
        }).setOrigin(0.5);

        const sub = this.add.text(width / 2, height / 2, 'GENERATING CARTOON ARENA ASSETS...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const progressBox = this.add.graphics();
        const progressBar = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRoundedRect(width / 2 - 160, height / 2 + 30, 320, 24, 6);

        // Procedurally generate all fighter sprites
        FighterRenderer.generateAllTextures(this);

        // Generate Stage Textures
        this.generateStageAssets();

        progressBar.fillStyle(0x00e5ff, 1);
        progressBar.fillRoundedRect(width / 2 - 156, height / 2 + 34, 312, 16, 4);

        this.time.delayedCall(400, () => {
            title.destroy();
            sub.destroy();
            progressBox.destroy();
            progressBar.destroy();
            this.scene.start('MenuScene');
        });
    }

    private generateStageAssets() {
        STAGES.forEach(stage => {
            const width = 1000;
            const height = 600;

            if (this.textures.exists(`bg_${stage.id}`)) return;

            const rt = this.make.renderTexture({ width, height }, false);
            const g = this.make.graphics({}, false);

            // Sky gradient
            g.fillGradientStyle(
                stage.skyTopColor,
                stage.skyTopColor,
                stage.skyBottomColor,
                stage.skyBottomColor,
                1
            );
            g.fillRect(0, 0, width, height - 100);

            // Background buildings / architecture silhouettes
            g.fillStyle(0x111116, 0.7);
            if (stage.id === 'parliament-arena') {
                // Classical pillars
                for (let x = 60; x < width; x += 110) {
                    g.fillRect(x, 120, 35, height - 220);
                    g.fillRect(x - 8, 110, 50, 16); // Capital
                    g.fillRect(x - 8, height - 120, 50, 20); // Base
                }
                // Arch top
                g.fillRect(40, 90, width - 80, 25);
            } else if (stage.id === 'jantar-mantar') {
                // Protest tents & fluttering banners
                for (let i = 0; i < 8; i++) {
                    const bx = 80 + i * 110;
                    g.fillStyle(i % 2 === 0 ? 0xff9933 : 0x138808, 0.6);
                    g.fillTriangle(bx, 280, bx + 50, 280, bx + 25, 230); // Banner
                    g.lineStyle(2, 0xffffff, 0.8);
                    g.lineBetween(bx + 25, 230, bx + 25, 480); // Pole
                }
            } else {
                // Desi Sadak: Neon shops & Chai stalls
                g.fillStyle(0x0a1018, 0.85);
                g.fillRect(80, 220, 160, 260);
                g.fillRect(300, 260, 180, 220);
                g.fillRect(550, 200, 170, 280);
                g.fillRect(780, 250, 160, 230);

                // Neon signs
                g.fillStyle(0x00e5ff, 0.8);
                g.fillRect(100, 250, 120, 25);
                g.fillStyle(0xff0055, 0.8);
                g.fillRect(320, 290, 140, 25);
                g.fillStyle(0xffcc00, 0.8);
                g.fillRect(570, 230, 130, 25);
            }

            // Ground platform
            g.fillStyle(stage.groundColor, 1);
            g.fillRect(0, height - 100, width, 100);

            // Ground trim line
            g.fillStyle(stage.accentColor, 1);
            g.fillRect(0, height - 100, width, 6);

            rt.draw(g, 0, 0);
            rt.saveTexture(`bg_${stage.id}`);

            g.destroy();
            rt.destroy();
        });
    }
}
