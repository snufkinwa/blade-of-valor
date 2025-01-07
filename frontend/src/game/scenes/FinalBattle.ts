import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { BaseScene } from "./BaseScene";
import { BossHealthBar } from "../classes/HealthBar";
import { Knight } from "../classes/knight";

export class FinalBattle extends BaseScene {
  private bossBar: BossHealthBar;
  knight: Knight;

  constructor() {
    super("FinalBattle");
  }

  create() {
    super.create();
    // Create environment and characters

    this.setupKnight();

    EventBus.emit("current-scene-ready", this);
  }

  private setupKnight() {
    this.knight = new Knight(this, 200, 530);
    const body = this.knight.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(28, 70);

    const centerX = this.cameras.main.centerX;
    const screenHeight = this.cameras.main.height;
    if (this.knight && this.knight.visible) {
      const centerX = this.cameras.main.centerX;
      const screenHeight = this.cameras.main.height;
      this.bossBar = new BossHealthBar(
        this,
        centerX,
        screenHeight - 50,
        "boss_healthbar",
        "boss_bar"
      );
      // Initially hide the boss bar
      this.bossBar.hideBossBar();
    }

    // Add visibility listener to knight
    if (this.knight.isKnightVisible) {
      this.bossBar.showBossBar();
    }

    // Add visibility change listener
    this.knight.on(
      "knightVisibilityChange",
      this.onKnightVisibilityChange,
      this
    );

    this.physics.add.existing(this.knight);

    if (this.layers["Ground"]) {
      this.physics.add.collider(this.knight, this.layers["Ground"]);
    }
    if (this.layers["Platforms"]) {
      this.physics.add.collider(this.knight, this.layers["Platforms"]);
    }
    if (this.layers["Gutter"]) {
      this.physics.add.collider(this.knight, this.layers["Gutter"]);
    }
  }

  private onKnightVisibilityChange = (visible: boolean): void => {
    if (this.bossBar) {
      this.bossBar.showBossBar();
    }
  };

  update() {
    super.update();

    // Update knight if needed
    if (this.knight) {
      this.knight.update();
    }

    // Update boss health bar position if it exists and knight is visible
    if (this.bossBar && this.knight.visible) {
      const centerX = this.cameras.main.centerX;
      const screenHeight = this.cameras.main.height;
      this.bossBar.setPosition(centerX, screenHeight - 50);
    }
  }
  changeScene() {
    this.scene.start("LightEnding");
  }
}
