import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";

export class EchoesOfFailure extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  dialogueText: Phaser.GameObjects.Text;

  constructor() {
    super("EchoesOfFailure");
  }

  create() {
    this.camera = this.cameras.main;

    this.dialogueText = this.add
      .text(512, 384, "TEST", {
        fontFamily: "Rover Cloxe",
        fontSize: 64,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100);

    EventBus.emit("current-scene-ready", this);
  }

  changeScene() {
    this.scene.start("Corruption");
  }
}
