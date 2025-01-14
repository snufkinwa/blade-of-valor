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
  private crystalSFX: Phaser.GameObjects.Sprite;
  private baseWidthDark: number = 43;
  public baseWidthLight: number = 57;
  private currentForm: "light" | "dark" = "light";
  private brokenCrystalSound: Phaser.Sound.BaseSound;
  private crystalSFXSound: Phaser.Sound.BaseSound;

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

    this.crystalSFX = scene.add.sprite(30, 30, "crystal_sfx");
    this.crystalSFX.setScale(2.2).setVisible(false);

    // Initialize animations
    this.initializeAnimations(scene);

    // Initialize sounds
    this.brokenCrystalSound = scene.sound.add("broken_crystal", {
      volume: 0.5,
    });
    this.crystalSFXSound = scene.sound.add("crystal_sfx", { volume: 0.3 });

    this.container.add([
      this.healthFill,
      this.healthStamina,
      this.crystal,
      this.crystalSFX,
      this.background,
    ]);

    this.updateBar();

    EventBus.on("player-damage", (damage: number) => {
      console.log(`PlayerHealthBar received damage: ${damage}`);
      this.applyDamage(damage);
    });
  }

  private initializeAnimations(scene: Phaser.Scene): void {
    // Broken crystal animation
    scene.anims.create({
      key: "broken_crystal_anim",
      frames: scene.anims.generateFrameNames("broken_crystal_SFX", {
        prefix: "sprite",
        start: 1,
        end: 17,
      }),
      frameRate: 24,
      repeat: 0,
    });

    // Dark crystal animation
    scene.anims.create({
      key: "dark_crystal_anim",
      frames: scene.anims.generateFrameNames("crystal_sfx", {
        prefix: "sprite",
        start: 13,
        end: 24,
      }),
      frameRate: 24,
      repeat: 0,
    });

    // Light crystal animation
    scene.anims.create({
      key: "light_crystal_anim",
      frames: scene.anims.generateFrameNames("crystal_sfx", {
        prefix: "sprite",
        start: 85,
        end: 96,
      }),
      frameRate: 24,
      repeat: 0,
    });
  }

  private playCrystalSFX(animKey: string): void {
    this.crystalSFX.setVisible(true);
    this.crystalSFX.play(animKey);
    this.crystalSFX.once("animationcomplete", () => {
      this.crystalSFX.setVisible(false);
    });
  }

  setForm(form: "light" | "dark") {
    const previousForm = this.currentForm;
    this.currentForm = form;
    const textureKey = form === "light" ? "crystal-light" : "crystal-dark";
    this.crystal.setTexture(textureKey);

    // Play appropriate SFX animation and sound
    if (previousForm !== form) {
      const animKey =
        form === "light" ? "light_crystal_anim" : "dark_crystal_anim";
      this.playCrystalSFX(animKey);
      this.crystalSFXSound.play();
    }
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
    console.log("Applying damage:", damage);
    console.log("Current light width:", this.baseWidthLight);
    console.log("Current dark width:", this.baseWidthDark);
    if (this.baseWidthLight > 0) {
      // Deplete light health (healthStamina) first
      this.baseWidthLight = Phaser.Math.Clamp(
        this.baseWidthLight - damage,
        0,
        57
      );
      this.updateDarkBar();

      if (this.baseWidthLight === 0) {
        console.log("Light depleted, emitting stamina-depleted");
        EventBus.emit("stamina-depleted");
        this.setForm("dark");
      }
    } else if (this.baseWidthDark > 0) {
      console.log("Dark depleted, setting broken crystal");
      // Only start depleting dark health (healthFill) after light is gone
      this.baseWidthDark = Phaser.Math.Clamp(
        this.baseWidthDark - damage,
        0,
        43
      );
      this.updateHealthBar();

      if (this.baseWidthDark === 0) {
        this.crystal.setTexture("broken_crystal_dark");
        this.playCrystalSFX("broken_crystal_anim");
        this.brokenCrystalSound.play();
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
    const prevForm = this.currentForm;

    if (this.currentForm === "light") {
      if (this.baseWidthLight < 57) {
        this.baseWidthLight = Math.min(57, this.baseWidthLight + increase);
        this.updateDarkBar();
      } else if (this.baseWidthDark < 43) {
        this.baseWidthDark = Math.min(43, this.baseWidthDark + increase);
        this.updateHealthBar();
      }
    } else {
      // Dark form
      if (this.baseWidthDark < 43) {
        this.baseWidthDark = Math.min(43, this.baseWidthDark + increase);
        this.updateHealthBar();
      } else {
        // Start filling light bar when dark is full
        this.baseWidthLight = Math.min(57, this.baseWidthLight + increase);
        this.updateDarkBar();

        // Check if we should transform back to light
        if (this.currentForm === "dark" && this.baseWidthLight > 10) {
          EventBus.emit("light-restored");
          this.setForm("light");
        }
      }
    }
  }

  destroy() {
    this.background.destroy();
    this.healthFill.destroy();
    this.healthStamina.destroy();
    this.crystal.destroy();
    this.crystalSFX.destroy();
    this.brokenCrystalSound.destroy();
    this.crystalSFXSound.destroy();
    super.destroy();
  }
}
