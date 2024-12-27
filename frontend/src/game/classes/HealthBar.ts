import Phaser from "phaser";

export default class HealthBar {
  private container: Phaser.GameObjects.Container;
  private barSprite: Phaser.GameObjects.Sprite;
  private maskGraphics: Phaser.GameObjects.Graphics;
  private value: number = 100;
  private maxWidth: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    this.container = scene.add.container(x, y);
    this.maxWidth = 200;

    // Add the bar sprite
    this.barSprite = scene.add.sprite(0, 0, texture);
    this.barSprite.setOrigin(0, 0.5);

    // Create mask
    this.maskGraphics = scene.add.graphics();
    const mask = this.maskGraphics.createGeometryMask();
    this.barSprite.setMask(mask);

    // Add to container
    this.container.add([this.barSprite]);

    this.updateBar();
  }

  setValue(value: number) {
    this.value = Phaser.Math.Clamp(value, 0, 100);
    this.updateBar();
  }

  private updateBar() {
    this.maskGraphics.clear();
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.fillRect(
      this.container.x,
      this.container.y - this.barSprite.height / 2,
      this.maxWidth * (this.value / 100),
      this.barSprite.height
    );
  }

  destroy() {
    this.maskGraphics.destroy();
    this.container.destroy();
  }
}
