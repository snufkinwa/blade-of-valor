import { Scene, Physics, GameObjects } from "phaser";

export default class Darkling extends Physics.Arcade.Sprite {
  private static readonly WAVE_DISTANCE = 20;
  private static readonly MAX_STACK_HEIGHT = 4;

  private moveState = {
    isWalking: false,
    isAttacking: false,
    isHurt: false,
    isRespawning: false,
    isDisappearing: false,
  };

  private waveIndex?: number;

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

    const velocity = direction === "left" ? -100 : 100;
    this.setVelocityX(velocity);
    this.setFlipX(direction === "left");

    if (!this.moveState.isWalking) {
      this.moveState.isWalking = true;
      this.play("darkling-walk", true);
    }
  }

  attack(): void {
    if (this.moveState.isAttacking || this.moveState.isHurt) return;

    this.moveState.isAttacking = true;
    this.setVelocityX(0);

    this.play("darkling-attack", true).once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      () => {
        this.moveState.isAttacking = false;
        this.play("darkling-idle", true);
      }
    );
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

  setWavePosition(index: number, baseY: number): this {
    this.waveIndex = index;
    const row = Math.floor(index / Darkling.MAX_STACK_HEIGHT);
    const stackPosition = index % Darkling.MAX_STACK_HEIGHT;

    const xOffset = row * Darkling.WAVE_DISTANCE;
    const yOffset = -stackPosition * (this.height * 0.5);

    this.setPosition(this.x - xOffset, baseY + yOffset);

    const body = this.body as Physics.Arcade.Body;
    if (body) {
      body.setCollideWorldBounds(false);
      if (stackPosition > 0) {
        body.setAllowGravity(false);
      }
    }

    return this;
  }

  update(): void {
    const body = this.body as Physics.Arcade.Body;
    if (!body) return;

    if (this.waveIndex !== undefined) {
      const baseSpeed = -150;
      body.setVelocityX(baseSpeed);

      const oscillation = Math.sin(this.scene.time.now / 500) * 2;
      body.setVelocityY(oscillation);
    }

    if (this.moveState.isWalking && body.velocity.x === 0) {
      this.stop();
    }
  }
}
