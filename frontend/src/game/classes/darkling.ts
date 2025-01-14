import { Scene, Physics, GameObjects } from "phaser";
import { EventBus } from "../EventBus";

export default class Darkling extends Physics.Arcade.Sprite {
  public hp: number = 200;

  private moveState = {
    isWalking: false,
    isAttacking: false,
    isHurt: false,
    isRespawning: false,
    isDisappearing: false,
  };

  // AI properties
  private player: Phaser.GameObjects.Sprite | null = null;
  private detectionRange: number = 300;
  private attackRange: number = 50;
  private lastAttackTime: number = 0;
  private attackCooldown: number = 2000;
  private chaseSpeed: number = 100;
  public isAttacking: boolean = false;
  private onAttackComplete: (() => void) | null = null;

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, "darkling");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Physics.Arcade.Body;
    if (body) {
      body.setSize(15, 13);
      body.setCollideWorldBounds(true);
    }

    this.initAnimations();
    this.play("darkling-idle");
  }

  public setPlayer(player: Phaser.GameObjects.Sprite) {
    this.player = player;
  }

  public takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.onDefeat();
    } else {
      this.hurt();
    }
  }

  public getHealth() {
    return this.hp;
  }

  private onDefeat(): void {
    this.isAttacking = false;
    this.moveState.isAttacking = false;
    const body = this.body as Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.setEnable(false);
    }
    EventBus.emit("darkling-defeated", this);
  }

  public isVulnerable(): boolean {
    return this.hp > 0;
  }

  public isDefeated(): boolean {
    return this.hp <= 0;
  }

  private initAnimations(): void {
    console.log("Available textures:", this.scene.textures.list);

    const animConfigs = [
      {
        key: "darkling-idle",
        start: 1,
        end: 4,
        frameRate: 8,
        repeat: -1,
      },
      {
        key: "darkling-walk",
        start: 5,
        end: 13,
        frameRate: 10,
        repeat: -1,
      },
      {
        key: "darkling-attack",
        start: 14,
        end: 20,
        frameRate: 12,
        repeat: 0,
      },
      {
        key: "darkling-hurt",
        start: 21,
        end: 24,
        frameRate: 10,
        repeat: 0,
      },
      {
        key: "darkling-disappear",
        start: 25,
        end: 32,
        frameRate: 10,
        repeat: 0,
      },
      {
        key: "darkling-respawn",
        start: 33,
        end: 43,
        frameRate: 10,
        repeat: 0,
      },
    ];

    animConfigs.forEach(({ key, start, end, frameRate, repeat }) => {
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: this.scene.anims.generateFrameNames("darkling", {
            start,
            end,
            prefix: "sprite",
          }),
          frameRate,
          repeat,
        });
      }
    });
  }

  walk(direction: "left" | "right"): void {
    if (this.moveState.isAttacking || this.moveState.isHurt) return;

    const velocity = direction === "left" ? -this.chaseSpeed : this.chaseSpeed;
    this.setVelocityX(velocity);
    this.setFlipX(direction === "left");

    if (!this.moveState.isWalking) {
      this.moveState.isWalking = true;
      this.play("darkling-walk", true);
    }
  }

  public attack(onComplete?: () => void) {
    if (this.isAttacking) return;

    this.isAttacking = true;
    this.onAttackComplete = onComplete || null;

    // Play attack animation
    this.play("darkling-attack").once("animationcomplete", () => {
      this.isAttacking = false;
      this.play("darkling-idle");

      if (this.onAttackComplete) {
        this.onAttackComplete();
      }
    });
  }

  hurt(): void {
    if (this.moveState.isHurt) return;

    this.moveState.isHurt = true;
    this.setVelocityX(0);

    this.play("darkling-hurt", true).once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      () => {
        this.moveState.isHurt = false;
        this.play("darkling-idle", true);
      }
    );
  }

  disappear(onComplete?: () => void): void {
    if (this.moveState.isDisappearing) return;

    this.moveState.isDisappearing = true;
    this.setVelocityX(0);

    this.play("darkling-disappear", true).once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      () => {
        this.moveState.isDisappearing = false;
        if (onComplete) onComplete();
      }
    );
  }

  respawn(x: number, y: number, onComplete?: () => void): void {
    if (this.moveState.isRespawning) return;

    this.moveState.isRespawning = true;
    this.setPosition(x, y);
    this.setAlpha(1);

    this.play("darkling-respawn", true).once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      () => {
        this.moveState.isRespawning = false;
        this.play("darkling-idle", true);
        if (onComplete) onComplete();
      }
    );
  }

  stop(): this {
    this.setVelocityX(0);
    if (!this.moveState.isAttacking && !this.moveState.isHurt) {
      this.moveState.isWalking = false;
      this.play("darkling-idle", true);
    }
    return this;
  }

  update(): void {
    const body = this.body as Physics.Arcade.Body;

    if (!this.isAttacking) {
      // Regular movement or idle behavior when not attacking
      body.setVelocity(0);
    }

    if (!body || this.moveState.isHurt || this.moveState.isDisappearing) return;

    if (this.player) {
      this.handleAIBehavior();
    }

    if (this.moveState.isWalking && body.velocity.x === 0) {
      this.stop();
    }
  }

  private handleAIBehavior(): void {
    if (!this.player || this.moveState.isAttacking) return;

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y
    );

    if (distance <= this.attackRange) {
      this.handleAttack();
    } else if (distance <= this.detectionRange) {
      this.handleChase();
    } else {
      this.stop();
    }
  }

  private handleChase(): void {
    if (!this.player || this.moveState.isAttacking) return;

    const direction = this.player.x < this.x ? "left" : "right";
    this.walk(direction);
  }

  private handleAttack(): void {
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime >= this.attackCooldown) {
      this.lastAttackTime = currentTime;
      this.attack();

      // Emit attack event through EventBus
      EventBus.emit("darkling-attack", {
        damage: 10,
        corruption: 5,
      });
    }
  }
}
