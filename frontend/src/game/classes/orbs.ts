import { Scene, Physics } from "phaser";
import { EventBus } from "../EventBus";
import { PlayerHealthBar } from "./HealthBar";

export class Orb extends Physics.Arcade.Sprite {
  private isLarge: boolean;
  private isDropping: boolean = false;

  constructor(scene: Scene, x: number, y: number, isLarge: boolean = false) {
    super(scene, x, y, "Orbs");
    this.isLarge = isLarge;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Physics.Arcade.Body;
    body.setSize(16, 10);
    body.setBounce(0.6);
    body.setCollideWorldBounds(true);
    body.setDrag(50);
    body.setGravityY(300);
    body.setFriction(0);

    this.initAnimation();
    this.play("orb-drop").once("animationcomplete", () => {
      this.isDropping = false;
      this.play(this.isLarge ? "large-orb-float" : "small-orb-float");
      this.scatter();
    });
    this.isDropping = true;
  }

  private initAnimation(): void {
    if (!this.scene.anims.exists("large-orb-float")) {
      this.scene.anims.create({
        key: "large-orb-float",
        frames: this.scene.anims.generateFrameNames("collectOrbs", {
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
        frames: this.scene.anims.generateFrameNames("collectOrbs", {
          start: 32,
          end: 39,
          prefix: "sprite",
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("orb-drop")) {
      this.scene.anims.create({
        key: "orb-drop",
        frames: this.scene.anims.generateFrameNames("Orbs", {
          start: 1,
          end: 7,
          prefix: "sprite",
        }),
        frameRate: 10,
        repeat: 0, // Play only once
      });
    }
  }

  scatter(): void {
    if (this.isDropping) return;

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
  private playerHealthBar: PlayerHealthBar | null = null;
  public collectedOrbs: number = 0;

  constructor(scene: Scene) {
    this.scene = scene;
    console.log("OrbSystem initialized"); // Debug log
  }

  setupCollisions(): void {
    if ((this.scene as any).layers) {
      ["Ground", "Platforms", "Gutter"].forEach((layerName) => {
        const layer = (this.scene as any).layers[layerName];
        if (layer) {
          this.scene.physics.add.collider(this.orbs, layer);
        }
      });
    }
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
      }
    }

    // Setup collisions for new orbs
    this.setupCollisions();
  }

  spawnOrbsFromDarkling(x: number, y: number, isElite: boolean = false): void {
    if (isElite) {
      this.spawnOrbs(x, y, { large: 2, small: 1 });
    } else {
      this.spawnOrbs(x, y, { large: 1, small: 1 });
    }
  }

  setupPlayerCollision(
    target: Physics.Arcade.Sprite,
    healthBar: PlayerHealthBar
  ): void {
    if (!healthBar) {
      console.error("HealthBar is undefined in setupPlayerCollision");
      return;
    }

    console.log("Setting up player collision with orbs");
    this.playerHealthBar = healthBar;

    this.scene.physics.add.overlap(
      target,
      this.orbs,
      (_, obj2) => {
        const orb = obj2 as Orb;
        console.log("Collision detected with orb");
        if (this.playerHealthBar) {
          this.collectOrb(orb, this.playerHealthBar);
        }
      },
      undefined,
      this
    );
  }

  public getCollectedOrbs(): number {
    return this.collectedOrbs;
  }

  private collectOrb(orb: Orb, healthBar: PlayerHealthBar): void {
    const index = this.orbs.indexOf(orb);
    if (index > -1) {
      this.orbs.splice(index, 1);
      healthBar.collectOrb();
      this.collectedOrbs++;
      //console.log("Collected orb. Total collected:", this.collectedOrbs);

      // Play collection effect
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

  public setupCollision(target: Phaser.GameObjects.Sprite): void {
    this.scene.physics.add.overlap(
      target,
      this.orbs,
      (_, orb) => {
        const orbSprite = orb as Orb;
        if (this.playerHealthBar) {
          this.collectOrb(orbSprite, this.playerHealthBar);
        }
      },
      undefined,
      this
    );
  }

  cleanup(): void {
    this.orbs.forEach((orb) => orb.destroy());
    this.orbs = [];
  }
}
