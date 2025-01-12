import Phaser from "phaser";
import { EventBus } from "../EventBus";

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
  private currentHealth: number = 100;
  private maxHealth: number = 100;
  private background: Phaser.GameObjects.Sprite;
  private healthFill: Phaser.GameObjects.TileSprite;
  private healthStamina: Phaser.GameObjects.TileSprite;
  private crystal: Phaser.GameObjects.Sprite;
  private baseWidthDark: number = 43;
  public baseWidthLight: number = 57;
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

    this.healthFill = scene.add.tileSprite(
      55,
      33,
      this.baseWidthDark,
      3,
      healthFillTexture
    );
    this.healthFill.setOrigin(0, 0).setScale(1.5);

    this.healthStamina = scene.add.tileSprite(
      54,
      21,
      this.baseWidthLight,
      3,
      healthStamina
    );
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

    EventBus.on("player-damage", (damage: number) => {
      console.log(`PlayerHealthBar received damage: ${damage}`);
      this.applyDamage(damage);
    });
  }

  setForm(form: "light" | "dark") {
    this.currentForm = form;
    const textureKey = form === "light" ? "crystal-light" : "crystal-dark";
    this.crystal.setTexture(textureKey);
  }

  public setValue(value: number): void {
    this.currentHealth = Phaser.Math.Clamp(value, 0, this.maxHealth);
    this.updateHealthBar();

    if (this.currentHealth <= 0) {
      this.currentHealth = this.maxHealth;
      this.updateHealthBar();
    }
  }

  private applyDamage(damage: number): void {
    if (this.baseWidthLight > 0) {
      // Deplete light health (healthStamina) first
      this.baseWidthLight = Phaser.Math.Clamp(
        this.baseWidthLight - damage,
        0,
        57
      );
      this.updateDarkBar();

      if (this.baseWidthLight === 0) {
        EventBus.emit("stamina-depleted");
        this.setForm("dark");
      }
    } else if (this.baseWidthDark > 0) {
      // Only start depleting dark health (healthFill) after light is gone
      this.baseWidthDark = Phaser.Math.Clamp(
        this.baseWidthDark - damage,
        0,
        43
      );
      this.updateHealthBar();

      if (this.baseWidthDark === 0) {
        this.crystal.setTexture("broken_crystal_dark");
        EventBus.emit("player-depleted");
      }
    }
  }

  public getValue(): number {
    return this.currentHealth;
  }

  private updateHealthBar(): void {
    // This should update healthFill (dark health)
    const fillWidth = (this.baseWidthDark / 43) * 1.5;
    this.healthFill.setScale(fillWidth, 1.5);
  }

  private updateDarkBar(): void {
    // This should update healthStamina (light health)
    const fillWidth = (this.baseWidthLight / 57) * 1.5;
    this.healthStamina.setScale(fillWidth, 1.5);
  }

  public collectOrb(): void {
    const increase = 5;

    if (this.currentForm === "light") {
      if (this.baseWidthLight < 57) {
        this.baseWidthLight = Math.min(57, this.baseWidthLight + increase);
      } else if (this.baseWidthDark < 43) {
        this.baseWidthDark = Math.min(43, this.baseWidthDark + increase);
      }
      this.updateDarkBar();
    } else {
      if (this.baseWidthDark < 43) {
        this.baseWidthDark = Math.min(43, this.baseWidthDark + increase);
      } else if (this.baseWidthLight < 57) {
        this.baseWidthLight = Math.min(57, this.baseWidthLight + increase);
      }
      this.updateHealthBar();
    }

    //this.updateForm();

    console.log(
      "After - Light:",
      this.baseWidthLight,
      "Dark:",
      this.baseWidthDark
    );
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
  private bossFill: Phaser.GameObjects.TileSprite;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bossTexture: string,
    bossFillTexture: string
  ) {
    super(scene, x, y);

    this.bossBar = scene.add.sprite(0, 0, bossTexture);

    this.bossFill = scene.add.tileSprite(9, 20, 205, 9, bossFillTexture);

    this.bossBar.setOrigin(0, 0);
    this.bossBar.setScale(1.5);
    this.bossFill.setOrigin(0, 0);

    this.container.add([this.bossFill, this.bossBar]);
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

  public showBossBar() {
    this.isVisible = true;
    this.bossBar.setVisible(true);
    this.bossFill.setVisible(true);
  }

  public hideBossBar() {
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
