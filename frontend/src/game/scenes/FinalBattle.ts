import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class FinalBattle extends Scene {
    constructor ()
    {
        super('FinalBattle');
    }

    create() {
        // Create environment and characters
         
        EventBus.emit('current-scene-ready', this);
    }

    update() {
        // Update logic
    }

    changeScene() {
        this.scene.start('Game Over');
      }

}