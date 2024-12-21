import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Platformer extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText : Phaser.GameObjects.Text;

    constructor ()
    {
        super('Platformer');
    }

    preload() {
        // Load assets
    }

    create() {
        // Create environment and characters
         
        EventBus.emit('current-scene-ready', this);
    }

    update() {
        // Update logic
    }

    changeScene() {
        this.scene.start('GameOver');
      }

}