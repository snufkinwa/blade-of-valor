import Phaser from "phaser";

export default class HealthBar {
  protected container: Phaser.GameObjects.Container;
  protected background: Phaser.GameObjects.Sprite;
  protected healthFill: Phaser.GameObjects.TileSprite;
  protected healthStamina: Phaser.GameObjects.TileSprite;
  protected crystal: Phaser.GameObjects.Sprite;
  protected value: number = 100;
  protected isVisible: boolean = false;
  protected currentForm: "light" | "dark" = "light";

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    healthTexture: string,
    healthFillTexture: string,
    healthStamina: string
  ) {
    this.container = scene.add.container(x, y);

    this.background = scene.add.sprite(0, 0, healthTexture);
    this.background.setScale(1.5);
    this.background.setOrigin(0, 0).setDepth(5);

    this.healthFill = scene.add.tileSprite(55, 33, 57, 3, healthFillTexture);
    this.healthFill.setOrigin(0, 0).setScale(1.5);

    this.healthStamina = scene.add.tileSprite(54, 21, 57, 3, healthStamina);
    this.healthStamina.setOrigin(0, 0).setScale(1.5).setDepth(-1);

    this.crystal = scene.add.sprite(30, 30, "crystal-light");
    this.crystal.setScale(2.2);

    this.container.add([
      this.healthFill,
      this.healthStamina,
      this.crystal,
      this.background,
    ]);

    this.container.setDepth(1000);
    this.updateBar();
  }

  setForm(form: "light" | "dark") {
    this.currentForm = form;
    const textureKey = form === "light" ? "crystal-light" : "crystal-dark";
    this.crystal.setTexture(textureKey);
  }

  setValue(value: number) {
    this.value = Phaser.Math.Clamp(value, 0, 100);
    this.updateBar();
  }

  protected updateBar() {
    const fillWidth = this.value / 100;
    this.healthFill.setScale(fillWidth, 1);
  }

  setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera) {
    this.setPosition(camera.scrollX + 20, camera.scrollY + 20);
  }

  destroy() {
    this.container.destroy();
  }
}
