import { init } from "next/dist/compiled/webpack/webpack";
import Phaser from "phaser";

export default class Knight {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "knight", "sprite0");
    this.sprite.setScale(0.5);
    this.initAnimations();
  }

  initAnimations() {
    this.sprite.anims.create({
      key: "idle",
      frames: this.sprite.anims.generateFrameNames("knight", {
        start: 0,
        end: 3,
        prefix: "sprite",
      }),
      frameRate: 6,
      repeat: -1,
    });

    this.sprite.anims.create({
      key: "walk",
      frames: this.sprite.anims.generateFrameNames("knight", {
        start: 4,
        end: 7,
        prefix: "sprite",
      }),
      frameRate: 6,
      repeat: -1,
    });

    this.sprite.anims.create({
      key: "attack",
      frames: this.sprite.anims.generateFrameNames("knight", {
        start: 8,
        end: 11,
        prefix: "sprite",
      }),
      frameRate: 6,
      repeat: 0,
    });

    this.sprite.anims.create({
      key: "death",
      frames: this.sprite.anims.generateFrameNames("knight", {
        start: 12,
        end: 15,
        prefix: "sprite",
      }),
      frameRate: 6,
      repeat: 0,
    });
  }
}
