import { Scene, Physics, GameObjects } from "phaser";
import { EventBus } from "../EventBus";

export class Orb extends Physics.Arcade.Sprite {
  constructor(
    scene: Scene,
    x: number,
    y: number,
    type: "light" | "collect" | "dark"
  ) {
    const textureKey = type === "collect" ? "collectOrbs" : "Orbs";
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Physics.Arcade.Body;
    body.setSize(16, 16);
    body.setBounce(0.6);
    body.setCollideWorldBounds(true);
    body.setDrag(50);
    body.setGravityY(300);
    body.setFriction(0);

    this.initAnimations(type);
    this.play(`${type}-orb-float`);
  }

  private initAnimations(type: string): void {
    if (!this.scene.anims.exists(`${type}-orb-float`)) {
      const configs = {
        light: { start: 1, end: 7, frameRate: 10 },
        collect: { start: 24, end: 39, frameRate: 12 },
        dark: { start: 1, end: 7, frameRate: 10, tint: 0x4a0080 },
      };

      const config = configs[type as keyof typeof configs];
      this.scene.anims.create({
        key: `${type}-orb-float`,
        frames: this.scene.anims.generateFrameNames(
          type === "collect" ? "collectOrbs" : "Orbs",
          {
            start: config.start,
            end: config.end,
            prefix: "sprite",
          }
        ),
        frameRate: config.frameRate,
        repeat: -1,
      });
    }
  }

  scatter(): void {
    const angle = Phaser.Math.Between(0, 360);
    const speed = Phaser.Math.Between(100, 200);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 200; // Extra upward boost

    const body = this.body as Physics.Arcade.Body;
    body.setVelocity(vx, vy);
  }
}

export class OrbSystem {
  private scene: Scene;
  private orbs: Orb[] = [];
  private lightLevel: number = 0;
  private maxLight: number = 100;

  constructor(scene: Scene) {
    this.scene = scene;
    this.setupGroundCollision();
  }

  private setupGroundCollision(): void {
    const platforms = this.scene.physics.add.staticGroup();
    const ground = platforms
      .create(0, this.scene.cameras.main.height - 10, "ground")
      .setOrigin(0, 0)
      .setDisplaySize(this.scene.cameras.main.width, 20)
      .refreshBody();
    ground.setAlpha(0); // Invisible ground

    this.scene.physics.add.collider(this.orbs, platforms);
  }

  spawnOrbs(
    x: number,
    y: number,
    count: number,
    type: "light" | "collect" | "dark"
  ): void {
    for (let i = 0; i < count; i++) {
      const orb = new Orb(this.scene, x, y, type);
      this.orbs.push(orb);
      orb.scatter();
    }
  }

  setupCollision(target: Physics.Arcade.Sprite): void {
    this.scene.physics.add.overlap(target, this.orbs, (obj1, obj2) => {
      const orb = obj2 as Orb;
      this.collectOrb(orb);
    });
  }

  private collectOrb(orb: Orb): void {
    const index = this.orbs.indexOf(orb);
    if (index > -1) {
      this.orbs.splice(index, 1);
      this.increaseLightLevel(10);

      // Collection effect
      this.scene.tweens.add({
        targets: orb,
        scale: { from: 1, to: 0 },
        alpha: { from: 1, to: 0 },
        duration: 200,
        onComplete: () => {
          orb.destroy();
        },
      });
    }
  }

  private increaseLightLevel(amount: number): void {
    this.lightLevel = Math.min(this.maxLight, this.lightLevel + amount);
    EventBus.emit("light-level-change", this.lightLevel);
  }

  update(): void {
    // Add any update logic for orbs here
  }

  cleanup(): void {
    this.orbs.forEach((orb) => orb.destroy());
    this.orbs = [];
  }
}
