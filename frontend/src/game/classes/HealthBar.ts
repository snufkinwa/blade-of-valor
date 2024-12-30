import Phaser from "phaser";

export default class HealthBar {
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Sprite;
  private healthFill: Phaser.GameObjects.Sprite;
  private bossBar: Phaser.GameObjects.Sprite;
  private bossFill: Phaser.GameObjects.Sprite;
  private value: number = 100;
  private isVisible: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    healthTexture: string,
    healthFillTexture: string,
    bossTexture: string,
    bossFillTexture: string
  ) {
    this.container = scene.add.container(x, y);

    // Health bar background and fill
    this.background = scene.add.sprite(0, 0, healthTexture);
    this.background.setScale(1.5);
    this.healthFill = scene.add.sprite(0, 0, healthFillTexture);
    this.background.setOrigin(0, 0);
    this.healthFill.setOrigin(0, 0);

    // Boss bar background and fill
    this.bossBar = scene.add.sprite(0, 0, bossTexture);
    this.bossFill = scene.add.sprite(0, 0, bossFillTexture);
    this.bossBar.setOrigin(0, 0);
    this.bossFill.setOrigin(0, 0);

    // Set visibility
    this.bossBar.setVisible(false);
    this.bossFill.setVisible(false);

    // Add all elements to container
    this.container.add([
      this.background,
      this.healthFill,
      this.bossBar,
      this.bossFill,
    ]);
    this.container.setDepth(1000);

    this.updateBar();
  }

  setValue(value: number) {
    this.value = Phaser.Math.Clamp(value, 0, 100);
    this.updateBar();
  }

  private updateBar() {
    const fillWidth = this.value / 100;
    this.healthFill.setScale(fillWidth, 1);
    this.bossFill.setScale(fillWidth, 1);
  }

  setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  update(
    camera: Phaser.Cameras.Scene2D.Camera,
    knight?: Phaser.GameObjects.Sprite
  ) {
    this.setPosition(camera.scrollX + 20, camera.scrollY + 20);

    if (knight) {
      const knightVisible = camera.worldView.contains(knight.x, knight.y);
      if (knightVisible && !this.isVisible) {
        this.showBossBar();
      } else if (!knightVisible && this.isVisible) {
        this.hideBossBar();
      }
    }
  }

  private showBossBar() {
    this.isVisible = true;
    this.bossBar.setVisible(true);
    this.bossFill.setVisible(true);
  }

  private hideBossBar() {
    this.isVisible = false;
    this.bossBar.setVisible(false);
    this.bossFill.setVisible(false);
  }

  destroy() {
    this.container.destroy();
  }
}
