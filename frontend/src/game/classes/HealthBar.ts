import Phaser from "phaser";

// Base health bar class with common functionality
class BaseHealthBar {
  protected container: Phaser.GameObjects.Container;
  protected value: number = 100;
  protected isVisible: boolean = false;

  constructor(protected scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.container.setDepth(1000);
  }

  setValue(value: number) {
    this.value = Phaser.Math.Clamp(value, 0, 100);
    this.updateBar();
  }

  setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  protected updateBar() {
    // Implemented by child classes
  }

  update(camera: Phaser.Cameras.Scene2D.Camera) {
    this.setPosition(camera.scrollX + 20, camera.scrollY + 20);
  }

  destroy() {
    this.container.destroy();
  }
}

// Player health bar with stamina
export class PlayerHealthBar extends BaseHealthBar {
  private background: Phaser.GameObjects.Sprite;
  private healthFill: Phaser.GameObjects.TileSprite;
  private healthStamina: Phaser.GameObjects.TileSprite;
  private crystal: Phaser.GameObjects.Sprite;
  private currentForm: "light" | "dark" = "light";

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    healthTexture: string,
    healthFillTexture: string,
    healthStamina: string
  ) {
    super(scene, x, y);

    this.background = scene.add.sprite(0, 0, healthTexture);
    this.background.setScale(1.5);
    this.background.setOrigin(0, 0).setDepth(5);

    this.healthFill = scene.add.tileSprite(55, 33, 43, 3, healthFillTexture);
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

    this.updateBar();
  }

  setForm(form: "light" | "dark") {
    this.currentForm = form;
    const textureKey = form === "light" ? "crystal-light" : "crystal-dark";
    this.crystal.setTexture(textureKey);
  }

  protected updateBar() {
    const fillWidth = this.value / 100;
    this.healthFill.setScale(fillWidth * 1.5, 1.5);
  }

  updateHealth(amount: number): void {
    this.value = Math.min(100, this.value + amount); // Ensure health does not exceed 100
    this.updateBar();
  }

  destroy() {
    this.background.destroy();
    this.healthFill.destroy();
    this.healthStamina.destroy();
    this.crystal.destroy();
    super.destroy();
  }
}

// Boss health bar without stamina
export class BossHealthBar extends BaseHealthBar {
  private bossBar: Phaser.GameObjects.Sprite;
  private bossFill: Phaser.GameObjects.Sprite;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bossTexture: string,
    bossFillTexture: string
  ) {
    super(scene, x, y);

    this.bossBar = scene.add.sprite(0, 0, bossTexture);
    this.bossFill = scene.add.sprite(0, 0, bossFillTexture);

    this.bossBar.setOrigin(0, 0);
    this.bossFill.setOrigin(0, 0);

    this.container.add([this.bossBar, this.bossFill]);
    this.updateBar();
  }

  update(
    camera: Phaser.Cameras.Scene2D.Camera,
    knight?: Phaser.GameObjects.Sprite
  ) {
    super.update(camera);
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
    const fillWidth = this.value / 100;
    this.bossFill.setScale(fillWidth, 1);
  }

  destroy() {
    this.bossBar.destroy();
    this.bossFill.destroy();
    super.destroy();
  }
}
