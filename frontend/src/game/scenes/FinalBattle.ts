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
    this.bossBar = new BossHealthBar(
      this,
      centerX, // x position centered
      screenHeight - 50, // y position near bottom
      "boss_healthbar",
      "boss_bar"
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

  update() {
    super.update();

    // Update boss health bar to stay fixed on screen
    const centerX = this.cameras.main.centerX;
    const screenHeight = this.cameras.main.height;

    if (this.bossBar) {
      this.bossBar.setPosition(centerX, screenHeight - 50);
    }

    // Update knight if needed
    if (this.knight) {
      this.knight.update();
    }
  }

  changeScene() {
    this.scene.start("Game Over");
  }
}
