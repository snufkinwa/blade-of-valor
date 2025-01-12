import { Physics } from "phaser";
import { EventBus } from "../EventBus";
import { PlayerHealthBar } from "./HealthBar";

type AttackType = "attack1" | "attack2" | "attack3";

export class Player extends Physics.Arcade.Sprite {
  protected hp: number = 100;
  private jumpCount: number = 0;
  private maxJumps: number = 2;
  private currentForm: "light" | "dark";
  private fallThreshold = 30;
  private attackQueue: string[] = [];
  private isProcessingAttacks = false;
  private healthBar: PlayerHealthBar;
  private _previousVelocityX: number = 0;
  private _previousVelocityY: number = 0;
  private eventListeners: { event: string; handler: Function }[] = [];
  private isPaused: boolean = false;
  private currentAttack: AttackType | null = null;

  public moveState = {
    isRunning: false,
    isJumping: false,
    isDashing: false,
    isFalling: false,
    isRolling: false,
    isAttacking: false,
    isTransforming: false,
  };

  private readonly JUMP_VELOCITY = -800;
  private readonly RUN_VELOCITY = 160;
  private readonly DASH_VELOCITY = 300;
  private readonly ROLL_VELOCITY = 200;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: "light" | "dark",
    healthBar: PlayerHealthBar
  ) {
    super(scene, x, y, texture);
    this.currentForm = texture;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.healthBar = healthBar;

    const body = this.body as Physics.Arcade.Body;
    if (body) {
      body.setCollideWorldBounds(true);
      body.setGravityY(300);
    }

    this.setupAnimations(scene, texture);
    this.setupControls();
    console.log("Player State:", this.moveState, "Velocity:", body.velocity);
  }

  public setVelocityX(velocity: number): this {
    const body = this.body as Physics.Arcade.Body;
    if (!body) {
      console.warn("Attempting to set velocity without a physics body");
      return this;
    }
    body.setVelocityX(velocity);
    return this;
  }

  public setVelocityY(velocity: number): this {
    const body = this.body as Physics.Arcade.Body;
    if (!body) {
      console.warn("Attempting to set velocity without a physics body");
      return this;
    }
    body.setVelocityY(velocity);
    return this;
  }

  private setupAnimations(scene: Phaser.Scene, texture: string): void {
    const animations = [
      { key: "idle", start: 1, end: 3, frameRate: 1, repeat: -1 },
      { key: "lookIntro", start: 4, end: 9, frameRate: 8, repeat: 0 },
      { key: "lookBlink", start: 10, end: 11, frameRate: 3, repeat: -1 },
      { key: "lookBack", start: 12, end: 15, frameRate: 10, repeat: 0 },
      { key: "run", start: 16, end: 25, frameRate: 10, repeat: -1 },
      { key: "jump", start: 47, end: 50, frameRate: 10, repeat: -1 },
      { key: "fall", start: 51, end: 54, frameRate: 10, repeat: -1 },
      { key: "dash", start: 30, end: 33, frameRate: 10, repeat: -1 },
      { key: "roll", start: 55, end: 62, frameRate: 10, repeat: -1 },
      { key: "recoverBalance", start: 63, end: 72, frameRate: 10, repeat: 0 },
      { key: "attack1", start: 73, end: 82, frameRate: 15, repeat: 0 },
      { key: "attack2", start: 83, end: 92, frameRate: 15, repeat: 0 },
      { key: "attack3", start: 93, end: 103, frameRate: 15, repeat: 0 },
      {
        key: "transformBefore",
        start: 123,
        end: 147,
        frameRate: 10,
        repeat: 0,
      },
      { key: "transformAfter", start: 148, end: 159, frameRate: 10, repeat: 0 },
    ];

    animations.forEach(({ key, start, end, frameRate, repeat }) => {
      scene.anims.remove(key);
      console.log("Creating animation:", key, { start, end });
      const frames = scene.anims.generateFrameNames(texture, {
        start,
        end,
        prefix: "sprite",
        zeroPad: 0,
      });
      console.log("Generated frames:", frames);

      scene.anims.create({
        key,
        frames,
        frameRate,
        repeat,
      });
      console.log(`Animation created: ${key}`, frames);
    });
  }

  private setupControls(): void {
    EventBus.on("run-pressed", (key: string) => {
      if (this.moveState.isRolling || this.moveState.isTransforming) return;

      this.moveState.isRunning = true;
      const velocity =
        key === "ArrowLeft" ? -this.RUN_VELOCITY : this.RUN_VELOCITY;
      this.setVelocityX(velocity);
      this.setFlipX(velocity < 0);

      if (!this.moveState.isJumping && !this.moveState.isFalling) {
        this.play("run", true);
      }
    });

    EventBus.on("run-released", () => {
      this.moveState.isRunning = false;
      if (!this.moveState.isDashing && !this.moveState.isRolling) {
        this.setVelocityX(0);
        if (!this.moveState.isJumping && !this.moveState.isFalling) {
          this.play("idle", true);
        }
      }
    });

    EventBus.on("jump-pressed", () => {
      if (
        this.jumpCount < this.maxJumps &&
        !this.moveState.isRolling &&
        !this.moveState.isTransforming
      ) {
        this.moveState.isJumping = true;
        this.moveState.isFalling = false;
        this.jumpCount++;
        this.setVelocityY(this.JUMP_VELOCITY);
        this.anims.stop();
        this.play("jump", true);
      }
    });

    EventBus.on("attack-1-pressed", () => {
      console.log("EventBus: attack-1-pressed");
      this.queueAttack("attack1");
    });

    EventBus.on("attack-2-pressed", () => {
      console.log("EventBus: attack-2-pressed");
      this.queueAttack("attack2");
    });

    EventBus.on("attack-3-pressed", () => {
      console.log("EventBus: attack-3-pressed");
      this.queueAttack("attack3");
    });

    EventBus.on("dash-pressed", () => {
      this.handleDash();
    });

    EventBus.on("dash-released", () => {
      if (this.moveState.isDashing) {
        this.moveState.isDashing = false;
        this.setVelocityX(0);
        if (!this.moveState.isJumping && !this.moveState.isFalling) {
          this.play("idle", true);
        }
      }
    });

    EventBus.on("roll-pressed", () => {
      this.handleRoll();
    });

    EventBus.on("recover-balance", () => {
      if (this.moveState.isRolling) {
        this.setVelocityX(0);
        this.play("recoverBalance", true).once("animationcomplete", () => {
          this.moveState.isRolling = false;
          if (!this.moveState.isJumping && !this.moveState.isFalling) {
            this.play("idle", true);
          }
        });
      }
    });

    EventBus.on("stamina-depleted", () => {
      this.handleTransform("dark");
    });
  }

  public pause(): void {
    this.isPaused = true;
    const body = this.body as Physics.Arcade.Body;
    if (body) {
      // Store current velocities if needed for resume
      this._previousVelocityX = body.velocity.x;
      this._previousVelocityY = body.velocity.y;
      body.setVelocity(0, 0);
    }
    this.anims.pause();
  }

  public resume(): void {
    this.isPaused = false;
    const body = this.body as Physics.Arcade.Body;
    if (body && this._previousVelocityX !== undefined) {
      body.setVelocity(this._previousVelocityX, this._previousVelocityY);
    }
    this.anims.resume();
  }

  public cleanup(): void {
    // Remove all event listeners
    EventBus.removeAllListeners("run-pressed");
    EventBus.removeAllListeners("run-released");
    EventBus.removeAllListeners("jump-pressed");
    EventBus.removeAllListeners("attack-1-pressed");
    EventBus.removeAllListeners("attack-2-pressed");
    EventBus.removeAllListeners("attack-3-pressed");
    EventBus.removeAllListeners("dash-pressed");
    EventBus.removeAllListeners("dash-released");
    EventBus.removeAllListeners("roll-pressed");
    EventBus.removeAllListeners("recover-balance");

    EventBus.removeAllListeners("stamina-depleted");
  }

  private isAttacking = false;

  queueAttack(attackName: string) {
    this.attackQueue.push(attackName);
    this.processAttackQueue();
  }

  processAttackQueue() {
    if (this.attackQueue.length > 0) {
      const attack = this.attackQueue.shift();
      if (attack) {
        this.play(attack); // Play the attack animation
      }
    }
  }

  private handleDash(): void {
    if (!this.moveState.isDashing && !this.moveState.isRolling) {
      this.moveState.isDashing = true;
      const velocity = this.flipX ? -this.DASH_VELOCITY : this.DASH_VELOCITY;
      this.setVelocityX(velocity);
      this.play("dash", true);
    }
  }

  private handleRoll(): void {
    if (!this.moveState.isRolling && !this.moveState.isAttacking) {
      this.moveState.isRolling = true;
      const velocity = this.flipX ? -this.ROLL_VELOCITY : this.ROLL_VELOCITY;
      this.setVelocityX(velocity);
      this.play("roll", true).once("animationcomplete", () => {
        EventBus.emit("recover-balance");
      });
    }
  }

  private handleTransform(targetForm: "light" | "dark"): void {
    if (
      this.moveState.isTransforming ||
      this.moveState.isAttacking ||
      this.currentForm === targetForm
    ) {
      return;
    }

    this.moveState.isTransforming = true;
    this.setVelocityX(0);
    this.executeTransformPhase(targetForm);
  }

  private executeTransformPhase(targetForm: "light" | "dark"): void {
    const handleAfterTransform = () => {
      this.moveState.isTransforming = false;
      if (!this.moveState.isJumping && !this.moveState.isFalling) {
        this.play("idle", true);
      }
    };

    const handleMainTransform = () => {
      this.currentForm = targetForm;
      this.setTexture(this.currentForm);
      this.setupAnimations(this.scene, this.currentForm);
      EventBus.emit("transform", targetForm);
      this.play("transformAfter", true).once(
        "animationcomplete",
        handleAfterTransform
      );
    };

    this.play("transformBefore", true).once(
      "animationcomplete",
      handleMainTransform
    );
  }

  update(): void {
    const body = this.body as Physics.Arcade.Body;
    if (!body || this.isPaused) return;

    // Handle jumping and falling based on vertical velocity
    if (body.velocity.y < 0) {
      this.moveState.isJumping = true;
      this.moveState.isFalling = false;
      if (this.anims.currentAnim?.key !== "jump") {
        this.play("jump", true);
      }
    } else if (
      body.velocity.y > this.fallThreshold &&
      !this.moveState.isRolling
    ) {
      this.moveState.isFalling = true;
      this.moveState.isJumping = false;
      if (this.anims.currentAnim?.key !== "fall") {
        this.play("fall", true);
      }
    }

    // Handle landing
    if (body.blocked.down) {
      this.jumpCount = 0;
      if (this.moveState.isFalling || this.moveState.isJumping) {
        this.moveState.isFalling = false;
        this.moveState.isJumping = false;
        if (
          !this.moveState.isRunning &&
          !this.moveState.isDashing &&
          !this.moveState.isRolling
        ) {
          this.play("idle", true);
        }
      }
    }
  }
}
