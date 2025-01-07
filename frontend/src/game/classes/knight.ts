import { Scene, GameObjects, Physics } from "phaser";

export class Knight extends Physics.Arcade.Sprite {
  hp: number = 100;
  private moveState = {
    isCharging: false,
    isRunning: false,
    isJumping: false,
    isFalling: false,
    isAttacking: false,
    isTeleporting: false,
  };

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, "knight");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.initAnimations();
    this.setUpPhysics();
  }

  // Override setVisible to emit our custom event
  setVisible(value: boolean): this {
    super.setVisible(value);
    // Emit our custom event after setting visibility
    this.emit("knightVisibilityChange", value);
    return this;
  }

  // Use the built-in visible property instead of isVisible
  get isKnightVisible(): boolean {
    return this.visible;
  }

  private initAnimations(): void {
    // Idle animation (sprites 1-13)
    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 1,
        end: 13,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Charge transition (sprites 14-15)
    this.anims.create({
      key: "chargeTransition",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 14,
        end: 15,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Charge (sprites 16-21)
    this.anims.create({
      key: "charge",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 16,
        end: 21,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Down transition (sprites 22-23)
    this.anims.create({
      key: "downTransition",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 22,
        end: 23,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Run (sprites 24-31)
    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 24,
        end: 31,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Jump (sprites 32-35)
    this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 32,
        end: 35,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Jump to fall transition (sprites 36-37)
    this.anims.create({
      key: "jumpToFall",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 36,
        end: 37,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Fall (sprites 38-41)
    this.anims.create({
      key: "fall",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 38,
        end: 41,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Land (sprites 42-44)
    this.anims.create({
      key: "land",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 42,
        end: 44,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Double Slash (sprites 45-58)
    this.anims.create({
      key: "doubleSlash",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 45,
        end: 58,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Attack 3 (sprites 59-71)
    this.anims.create({
      key: "attack3",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 59,
        end: 71,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Attack 1 (sprites 72-90)
    this.anims.create({
      key: "attack1",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 72,
        end: 90,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Attack 2 (sprites 91-103)
    this.anims.create({
      key: "attack2",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 91,
        end: 103,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Jump Slam (sprites 104-116)
    this.anims.create({
      key: "jumpSlam",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 104,
        end: 116,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Hit (sprites 117-118)
    this.anims.create({
      key: "hit",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 117,
        end: 118,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Teleport 1 (sprites 119-129)
    this.anims.create({
      key: "teleport1",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 119,
        end: 129,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Heart Slam (sprites 130-147)
    this.anims.create({
      key: "heartSlam",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 130,
        end: 147,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Teleport 2 (sprites 148-159)
    this.anims.create({
      key: "teleport2",
      frames: this.anims.generateFrameNames("knight", {
        prefix: "sprite",
        start: 148,
        end: 159,
      }),
      frameRate: 15,
      repeat: 0,
    });
  }

  private setUpPhysics(): void {
    const body = this.body as Physics.Arcade.Body;
    if (body) {
      body.setSize(40, 60); // Adjust hitbox size as needed
      body.setCollideWorldBounds(true);
      body.setGravityY(300);
    }
  }

  public startCharge(): void {
    if (!this.moveState.isCharging) {
      this.moveState.isCharging = true;
      this.play("chargeTransition").chain("charge");
    }
  }

  public stopCharge(): void {
    if (this.moveState.isCharging) {
      this.moveState.isCharging = false;
      this.play("downTransition").chain("idle");
    }
  }

  public startRun(velocity: number): void {
    if (!this.moveState.isRunning && !this.moveState.isCharging) {
      this.moveState.isRunning = true;
      this.setVelocityX(velocity);
      this.setFlipX(velocity < 0);
      this.play("run", true);
    }
  }

  public stopRun(): void {
    if (this.moveState.isRunning) {
      this.moveState.isRunning = false;
      this.setVelocityX(0);
      this.play("idle", true);
    }
  }

  public jump(): void {
    if (!this.moveState.isJumping && !this.moveState.isFalling) {
      this.moveState.isJumping = true;
      this.setVelocityY(-400);
      this.play("jump").chain("jumpToFall");
    }
  }

  public update(): void {
    const body = this.body as Physics.Arcade.Body;
    if (!body) return;

    // Handle falling state
    if (body.velocity.y > 50 && !this.moveState.isFalling) {
      this.moveState.isFalling = true;
      this.moveState.isJumping = false;
      this.play("fall", true);
    }

    // Reset states when landing
    if (body.blocked.down) {
      if (this.moveState.isFalling || this.moveState.isJumping) {
        this.moveState.isFalling = false;
        this.moveState.isJumping = false;
        if (!this.moveState.isRunning && !this.moveState.isCharging) {
          this.play("idle", true);
        }
      }
    }
  }

  public attack(type: 1 | 2 | 3 | "double" | "heart" | "jump"): void {
    if (this.moveState.isAttacking) return;

    this.moveState.isAttacking = true;
    const attackMap = {
      1: "attack1",
      2: "attack2",
      3: "attack3",
      double: "doubleSlash",
      heart: "heartSlam",
      jump: "jumpSlam",
    };

    this.play(attackMap[type]).once("animationcomplete", () => {
      this.moveState.isAttacking = false;
      if (!this.moveState.isRunning) {
        this.play("idle", true);
      }
    });
  }

  public teleport(type: 1 | 2): void {
    if (this.moveState.isTeleporting) return;

    this.moveState.isTeleporting = true;
    this.play(`teleport${type}`).once("animationcomplete", () => {
      this.moveState.isTeleporting = false;
      if (!this.moveState.isRunning) {
        this.play("idle", true);
      }
    });
  }

  public takeDamage(): void {
    this.play("hit").once("animationcomplete", () => {
      if (!this.moveState.isRunning) {
        this.play("idle", true);
      }
    });
  }

  public destroy(): void {
    super.destroy();
  }
}
