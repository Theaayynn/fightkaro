import Phaser from 'phaser';
import { CharacterData, CHARACTERS } from '../data/characters';

export class FighterRenderer {
    public static generateAllTextures(scene: Phaser.Scene) {
        CHARACTERS.forEach(char => {
            this.generateCharacterSprites(scene, char);
        });
    }

    private static generateCharacterSprites(scene: Phaser.Scene, char: CharacterData) {
        const states = ['idle', 'walk', 'punch', 'kick', 'crouch', 'jump', 'hurt', 'block', 'super'];

        states.forEach(state => {
            const key = `${char.id}_${state}`;
            if (scene.textures.exists(key)) return;

            const width = 100;
            const height = 140;
            const rt = scene.make.renderTexture({ width, height }, false);
            const g = scene.make.graphics({}, false);

            this.drawCharacterPose(g, char, state, width, height);
            rt.draw(g, 0, 0);
            rt.saveTexture(key);

            g.destroy();
            rt.destroy();
        });
    }

    private static drawCharacterPose(
        g: Phaser.GameObjects.Graphics,
        char: CharacterData,
        state: string,
        w: number,
        h: number
    ) {
        const cx = w / 2;
        const cy = h / 2 + 10;

        // Visual effects for super / hurt / block
        if (state === 'super') {
            g.fillStyle(char.accentColor, 0.4);
            g.fillCircle(cx, cy, 55);
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(cx, cy, 45);
        } else if (state === 'block') {
            g.fillStyle(0x00e5ff, 0.3);
            g.fillRoundedRect(cx + 10, cy - 40, 20, 70, 8);
        }

        // Shadows
        g.fillStyle(0x000000, 0.35);
        g.fillEllipse(cx, h - 8, 50, 14);

        // Legs / Feet
        g.fillStyle(0x222222, 1);
        if (state === 'kick') {
            // High kick
            g.fillRect(cx - 18, cy + 18, 14, 38); // Standing leg
            // Kicking leg horizontally extended
            g.fillStyle(char.clothesColor, 1);
            g.fillRect(cx - 5, cy, 38, 14);
            g.fillStyle(0x111111, 1);
            g.fillRect(cx + 33, cy - 2, 16, 18); // Shoe
        } else if (state === 'crouch') {
            g.fillRect(cx - 20, cy + 15, 16, 20);
            g.fillRect(cx + 4, cy + 15, 16, 20);
        } else if (state === 'jump') {
            g.fillRect(cx - 18, cy + 5, 14, 22);
            g.fillRect(cx + 4, cy + 5, 14, 22);
        } else {
            // Normal standing / walking stance
            g.fillRect(cx - 16, cy + 18, 13, 38);
            g.fillRect(cx + 3, cy + 18, 13, 38);
        }

        // Torso / Clothing
        const torsoY = state === 'crouch' ? cy - 8 : cy - 20;
        const torsoH = state === 'crouch' ? 32 : 44;

        g.fillStyle(char.clothesColor, 1);
        g.fillRoundedRect(cx - 20, torsoY, 40, torsoH, 6);

        // Jacket / Kurta Accent
        g.fillStyle(char.avatarColor, 1);
        g.fillRect(cx - 16, torsoY + 4, 32, torsoH - 8);

        // Character specific accessories
        if (char.id === 'muffler-man') {
            // Muffler wrapped around neck
            g.fillStyle(0x800000, 1);
            g.fillRoundedRect(cx - 18, torsoY - 8, 36, 14, 4);
            g.fillRect(cx - 6, torsoY + 6, 12, 22); // hanging muffler tail
        } else if (char.id === 'yatra-boy') {
            // White collar
            g.fillStyle(0xffffff, 1);
            g.fillTriangle(cx - 10, torsoY, cx + 10, torsoY, cx, torsoY + 12);
        } else if (char.id === 'mitraman') {
            // Saffron waistcoat pocket square & trim
            g.fillStyle(0x138808, 1);
            g.fillRect(cx + 4, torsoY + 10, 8, 4);
        } else if (char.id === 'didi-thunder') {
            // Blue saree border
            g.fillStyle(0x0077be, 1);
            g.fillRect(cx - 16, torsoY, 6, torsoH);
        }

        // Arms & Attack Posings
        g.fillStyle(char.clothesColor, 1);
        if (state === 'punch') {
            // Back arm ready
            g.fillRect(cx - 26, torsoY + 8, 12, 24);
            // Extended punching arm
            g.fillStyle(char.avatarColor, 1);
            g.fillRect(cx + 10, torsoY + 6, 36, 14);
            // Fist
            g.fillStyle(0xf0c090, 1);
            g.fillCircle(cx + 48, torsoY + 13, 10);
        } else if (state === 'block') {
            // Arms crossed in front
            g.fillRect(cx + 2, torsoY + 4, 18, 30);
            g.fillRect(cx + 8, torsoY + 4, 18, 30);
        } else {
            // Idle arms
            g.fillRect(cx - 26, torsoY + 6, 10, 28);
            g.fillRect(cx + 16, torsoY + 6, 10, 28);
            // Hands
            g.fillStyle(0xf0c090, 1);
            g.fillCircle(cx - 21, torsoY + 36, 5);
            g.fillCircle(cx + 21, torsoY + 36, 5);
        }

        // Head / Face
        const headY = state === 'crouch' ? cy - 30 : cy - 44;
        g.fillStyle(0xf0c090, 1);
        g.fillCircle(cx, headY, 18);

        // Head style / Hair / Turban / Cap
        if (char.headStyle === 'turban') {
            g.fillStyle(char.accentColor, 1);
            g.fillRoundedRect(cx - 20, headY - 20, 40, 16, 8);
            // White beard
            g.fillStyle(0xffffff, 1);
            g.fillRoundedRect(cx - 12, headY + 4, 24, 15, 6);
            // Spectacles
            g.lineStyle(2, 0x111111, 1);
            g.strokeCircle(cx - 5, headY - 1, 4);
            g.strokeCircle(cx + 5, headY - 1, 4);
            g.lineBetween(cx - 1, headY - 1, cx + 1, headY - 1);
        } else if (char.headStyle === 'curly') {
            // Curly hair & beard
            g.fillStyle(0x1a1a1a, 1);
            g.fillCircle(cx - 10, headY - 12, 10);
            g.fillCircle(cx, headY - 16, 11);
            g.fillCircle(cx + 10, headY - 12, 10);
            // Trimmed beard
            g.fillStyle(0x222222, 0.9);
            g.fillRoundedRect(cx - 10, headY + 5, 20, 11, 5);
        } else if (char.headStyle === 'bald-cap') {
            // Clean shaved head with saffron tilak
            g.fillStyle(0xcc5500, 1);
            g.fillRect(cx - 2, headY - 14, 4, 12);
            g.fillStyle(0xffcc00, 1);
            g.fillCircle(cx, headY - 4, 2);
        } else if (char.headStyle === 'saree-pallu') {
            // Saree pallu drape on head
            g.fillStyle(0xffffff, 1);
            g.fillCircle(cx, headY - 8, 20);
            g.fillStyle(0x0077be, 1);
            g.strokeCircle(cx, headY - 8, 20);
            // Face
            g.fillStyle(0xf0c090, 1);
            g.fillCircle(cx, headY, 14);
            // Spectacles
            g.lineStyle(2, 0x333333, 1);
            g.strokeCircle(cx - 5, headY, 4);
            g.strokeCircle(cx + 5, headY, 4);
        } else if (char.headStyle === 'muffler') {
            // Top hair + Cap/Spectacles
            g.fillStyle(0x222222, 1);
            g.fillRoundedRect(cx - 16, headY - 18, 32, 12, 4);
            // Big spectacles
            g.lineStyle(2, 0x111111, 1);
            g.strokeCircle(cx - 6, headY - 1, 5);
            g.strokeCircle(cx + 6, headY - 1, 5);
            g.lineBetween(cx - 1, headY - 1, cx + 1, headY - 1);
            // Mustache
            g.fillStyle(0x111111, 1);
            g.fillRoundedRect(cx - 8, headY + 7, 16, 4, 2);
        }

        // Eyes
        g.fillStyle(0x111111, 1);
        g.fillCircle(cx - 5, headY - 2, 2);
        g.fillCircle(cx + 5, headY - 2, 2);

        // Hurt flash
        if (state === 'hurt') {
            g.fillStyle(0xff0000, 0.4);
            g.fillCircle(cx, cy, 40);
        }
    }
}
