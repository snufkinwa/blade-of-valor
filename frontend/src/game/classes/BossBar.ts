import HealthBar from "./HealthBar";

export default class BossBar extends HealthBar {
  private bossBar: Phaser.GameObjects.Sprite;
  private bossFill: Phaser.GameObjects.Sprite;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    healthTexture: string,
    healthFillTexture: string,
    healthStamina: string,
    bossTexture: string,
    bossFillTexture: string
  ) {
    super(scene, x, y, healthTexture, healthFillTexture, healthStamina);

    this.bossBar = scene.add.sprite(0, 0, bossTexture);
    this.bossFill = scene.add.sprite(0, 0, bossFillTexture);

    this.bossBar.setOrigin(0, 0);
    this.bossFill.setOrigin(0, 0);

    this.bossBar.setVisible(false);
    this.bossFill.setVisible(false);

    this.container.add([this.bossBar, this.bossFill]);
    this.updateBar();
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

  protected updateBar() {
    super.updateBar();
    const fillWidth = this.value / 100;
    this.bossFill.setScale(fillWidth, 1);
  }

  destroy() {
    this.bossBar.destroy();
    this.bossFill.destroy();
    super.destroy();
  }
}
