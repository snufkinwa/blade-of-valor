import { Physics } from "phaser";
import { EventBus } from "../EventBus";
import { PlayerHealthBar } from "./HealthBar";

type ActionType = {
  type: "attack" | "jump" | "dash" | "roll" | "run" | "transform";
  data?: any;
};

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

  private moveState = {
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
      const frames = scene.anims.generateFrameNames(texture, {
        start,
        end,
        prefix: "sprite",
        zeroPad: 0,
      });

      scene.anims.create({
        key,
        frames,
        frameRate,
        repeat,
      });
    });
  }

  private setupControls(): void {
    const listeners = [
      {
        event: "run-pressed",
        handler: (key: string) => {
          if (
            this.isPaused ||
            this.moveState.isRolling ||
            this.moveState.isTransforming
          )
            return;
          this.moveState.isRunning = true;
          const velocity =
            key === "ArrowLeft" ? -this.RUN_VELOCITY : this.RUN_VELOCITY;
          this.setVelocityX(velocity);
          this.setFlipX(velocity < 0);
          if (!this.moveState.isJumping && !this.moveState.isFalling) {
            this.play("run", true);
          }
        },
      },
      {
        event: "run-released",
        handler: () => {
          if (this.isPaused) return;
          this.moveState.isRunning = false;
          if (!this.moveState.isDashing && !this.moveState.isRolling) {
            this.setVelocityX(0);
            if (!this.moveState.isJumping && !this.moveState.isFalling) {
              this.play("idle", true);
            }
          }
        },
      },
      {
        event: "jump-pressed",
        handler: () => {
          if (this.isPaused) return;
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
        },
      },
      {
        event: "attack-1-pressed",
        handler: () => {
          if (this.isPaused) return;
          this.queueAttack("attack1");
        },
      },
      {
        event: "attack-2-pressed",
        handler: () => {
          if (this.isPaused) return;
          this.queueAttack("attack2");
        },
      },
      {
        event: "attack-3-pressed",
        handler: () => {
          if (this.isPaused) return;
          this.queueAttack("attack3");
        },
      },
      {
        event: "dash-pressed",
        handler: () => {
          if (this.isPaused) return;
          this.handleDash();
        },
      },
      {
        event: "dash-released",
        handler: () => {
          if (this.isPaused) return;
          if (this.moveState.isDashing) {
            this.moveState.isDashing = false;
            this.setVelocityX(0);
            if (!this.moveState.isJumping && !this.moveState.isFalling) {
              this.play("idle", true);
            }
          }
        },
      },
      {
        event: "roll-pressed",
        handler: () => {
          if (this.isPaused) return;
          this.handleRoll();
        },
      },
      {
        event: "recover-balance",
        handler: () => {
          if (this.isPaused) return;
          if (this.moveState.isRolling) {
            this.setVelocityX(0);
            this.play("recoverBalance", true).once("animationcomplete", () => {
              this.moveState.isRolling = false;
              if (!this.moveState.isJumping && !this.moveState.isFalling) {
                this.play("idle", true);
              }
            });
          }
        },
      },
      {
        event: "transform-pressed",
        handler: () => {
          if (this.isPaused) return;
          this.handleTransformRequest();
        },
      },
      {
        event: "stamina-depleted",
        handler: () => {
          if (this.isPaused) return;
          this.handleTransform("dark");
        },
      },
    ];

    // Register all listeners
    listeners.forEach(({ event, handler }) => {
      EventBus.on(event, handler);
      this.eventListeners.push({ event, handler });
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
    this.eventListeners.forEach(({ event, handler }) => {
      EventBus.off(event, handler);
    });
    this.eventListeners = [];
  }

  private queueAttack(type: string): void {
    if (this.moveState.isRolling || this.moveState.isTransforming) return;

    // Limit queue size to prevent memory issues
    if (this.attackQueue.length < 3) {
      this.attackQueue.push(type);
    }

    if (!this.isProcessingAttacks && !this.moveState.isAttacking) {
      this.processAttackQueue();
    }
  }

  private processAttackQueue(): void {
    if (this.attackQueue.length === 0) {
      this.isProcessingAttacks = false;
      this.moveState.isAttacking = false;
      return;
    }

    this.isProcessingAttacks = true;
    this.moveState.isAttacking = true;
    const nextAttack = this.attackQueue[0];

    // Clear any existing animation complete listeners
    this.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);

    this.play(nextAttack, true).once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      () => {
        if (this.attackQueue.length > 0) {
          this.attackQueue.shift();
        }

        if (this.attackQueue.length > 0 && !this.moveState.isRolling) {
          this.processAttackQueue();
        } else {
          this.play("recoverBalance", true).once(
            Phaser.Animations.Events.ANIMATION_COMPLETE,
            () => {
              this.isProcessingAttacks = false;
              this.moveState.isAttacking = false;
              this.attackQueue = [];

              if (!this.moveState.isJumping && !this.moveState.isFalling) {
                this.play("idle", true);
              }
            }
          );
        }
      }
    );
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

  private handleTransformRequest(): void {
    if (!this.healthBar) {
      console.error("Health bar is not initialized!");
      return; // Exit early to prevent further errors
    }

    // Force transform to dark form if stamina is depleted
    if (this.healthBar.baseWidthLight <= 0) {
      if (this.currentForm === "light") {
        this.handleTransform("dark");
      }
      return; // Prevent further transform attempts when stamina is depleted
    }

    // Normal transform logic when stamina is available
    const targetForm = this.currentForm === "light" ? "dark" : "light";
    this.handleTransform(targetForm);
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

    if (this.moveState.isAttacking || this.moveState.isTransforming) {
      body.setVelocity(0);
      return;
    }

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
