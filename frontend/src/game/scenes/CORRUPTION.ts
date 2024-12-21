import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class Corruption extends Scene {
    constructor() {
        super("Corruption");
    }

    create() {
        // Create environment and characters

        EventBus.emit("current-scene-ready", this);
    }

    update() {
        // Update logic
    }

    changeScene() {
        this.scene.start("Game Over");
    }
}

