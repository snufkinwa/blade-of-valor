import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

export class MainMenu extends Scene {
    background: GameObjects.Image;
    duelimg: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor() {
        super("MainMenu");
    }

    create() {
        this.background = this.add.image(512, 384, "background");
        this.duelimg = this.add.image(513, 454, "duelimg");

        this.logo = this.add.image(513, 354, "logoimg");

        this.title = this.add
            .text(512, 550, "PRESS START TO CONTINUE", {
                fontFamily: "Public Pixel",
                fontSize: 18,
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.tweens.add({
            targets: this.title,
            alpha: {
                from: 1,
                to: 0,
                duration: 500,
                ease: "Sine.easeInOut",
                yoyo: true,
                repeat: -1,
            },
        });

        EventBus.on("enter-key-pressed", this.handleEnterKey, this);

        EventBus.emit("current-scene-ready", this);
    }

    handleEnterKey() {
        console.log("Enter key pressed");
        this.changeScene();
    }

    changeScene() {
        console.log("Changing scene to PauseMenu"); // Debug log
        this.scene.start("PauseMenu");
    }

    shutdown() {
        // Remove the event listener when the scene is shutting down
        EventBus.removeListener("enter-key-pressed", this.handleEnterKey);
    }
}

