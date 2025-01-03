import { Scene, Physics } from "phaser";
import { EventBus } from "../EventBus";

export class Orb extends Physics.Arcade.Sprite {
  private isLarge: boolean;

  constructor(scene: Scene, x: number, y: number, isLarge: boolean = false) {
    super(scene, x, y, "Orbs");
    this.isLarge = isLarge;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Physics.Arcade.Body;
    body.setSize(16, 16);
    body.setBounce(0.6);
    body.setCollideWorldBounds(true);
    body.setDrag(50);
    body.setGravityY(300);
    body.setFriction(0);

    this.initAnimation();
    this.play(this.isLarge ? "large-orb-float" : "small-orb-float");
  }

  private initAnimation(): void {
    if (!this.scene.anims.exists("large-orb-float")) {
      this.scene.anims.create({
        key: "large-orb-float",
        frames: this.scene.anims.generateFrameNames("Orbs", {
          start: 24,
          end: 31,
          prefix: "sprite",
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("small-orb-float")) {
      this.scene.anims.create({
        key: "small-orb-float",
        frames: this.scene.anims.generateFrameNames("Orbs", {
          start: 32,
          end: 39,
          prefix: "sprite",
        }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  scatter(): void {
    const angle = Phaser.Math.Between(-30, 30);
    const speed = Phaser.Math.Between(150, 250);
    const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
    const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed - 300;

    const body = this.body as Physics.Arcade.Body;
    body.setVelocity(vx, vy);
  }

  isLargeOrb(): boolean {
    return this.isLarge;
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

    ground.setAlpha(0);
    this.scene.physics.add.collider(this.orbs, platforms);
  }

  spawnOrbs(
    x: number,
    y: number,
    config: { large?: number; small?: number }
  ): void {
    if (config.large) {
      for (let i = 0; i < config.large; i++) {
        const orb = new Orb(
          this.scene,
          x + Phaser.Math.Between(-10, 10),
          y + Phaser.Math.Between(-10, 10),
          true
        );
        this.orbs.push(orb);
        orb.scatter();
      }
    }

    if (config.small) {
      for (let i = 0; i < config.small; i++) {
        const orb = new Orb(
          this.scene,
          x + Phaser.Math.Between(-10, 10),
          y + Phaser.Math.Between(-10, 10),
          false
        );
        this.orbs.push(orb);
        orb.scatter();
      }
    }
  }

  spawnOrbsFromDarkling(x: number, y: number, isElite: boolean = false): void {
    if (isElite) {
      this.spawnOrbs(x, y, { large: 2, small: 1 });
    } else {
      this.spawnOrbs(x, y, { large: 1, small: 1 });
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
      this.increaseLightLevel(orb.isLargeOrb() ? 15 : 10);

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

  cleanup(): void {
    this.orbs.forEach((orb) => orb.destroy());
    this.orbs = [];
  }
}
