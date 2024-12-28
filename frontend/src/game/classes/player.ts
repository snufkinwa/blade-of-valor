import { Physics } from "phaser";
import { EventBus } from "../EventBus";

type PlayerAction =
  | { type: "move"; velocity: number }
  | { type: "jump" }
  | { type: "roll" }
  | { type: "attack"; attackType: "attack1" | "attack2" | "attack3" }
  | { type: "dash"; direction: "left" | "right" }
  | { type: "transform" };

export class Player extends Physics.Arcade.Sprite {
  protected hp: number = 100;
  private lastDirection: "left" | "right" = "right";
  private moveState: {
    isRunning: boolean;
    isJumping: boolean;
    isDashing: boolean;
    isFalling: boolean;
    isRolling: boolean;
    isAttacking: boolean;
    isTransforming: boolean;
  } = {
    isRunning: false,
    isJumping: false,
    isDashing: false,
    isFalling: false,
    isRolling: false,
    isAttacking: false,
    isTransforming: false,
  };

  private jumpCount: number = 0; // Track current jump count
  private maxJumps: number = 2; // Maximum number of jumps allowed
  private isHoldingJump: boolean = false;
  private readonly MAX_JUMP_HOLD_TIME = 350;
  private readonly JUMP_HOLD_ACCELERATION = -15;
  private jumpHoldTimer: number = 0;
  private lastJumpHoldTime: number = 0;

  private readonly JUMP_VELOCITY = -800;
  private readonly RUN_VELOCITY = 160;
  private readonly DASH_VELOCITY = 300;
  private readonly ROLL_VELOCITY = 200;
  private readonly FALL_THRESHOLD = 50;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: "light" | "dark"
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.getBody();
    body.setCollideWorldBounds(true);
    body.setGravityY(300);
    this.setupAnimations(scene, texture);
    this.setupEventListeners();
    this.setupPhysicsCheck();
  }

  private isIdle(): boolean {
    return (
      !this.moveState.isRunning &&
      !this.moveState.isJumping &&
      !this.moveState.isDashing &&
      !this.moveState.isRolling &&
      !this.moveState.isFalling &&
      !this.moveState.isAttacking &&
      !this.moveState.isTransforming
    );
  }

  private resetAnimationOnKeyRelease(): void {
    if (this.isIdle()) {
      this.setFlipX(this.lastDirection === "left");
      this.playAnimation("idle");
    }
  }

  private handleAction(action: PlayerAction): void {
    if (!this.canPerformAction(action)) return;

    const body = this.getBody();

    switch (action.type) {
      case "move":
        body.setVelocityX(action.velocity);
        if (!this.isIdle() && action.velocity !== 0) {
          this.playAnimation("run");
        } else if (action.velocity === 0) {
          this.resetAnimationOnKeyRelease();
        }
        this.checkFlip(action.velocity);
        break;

      case "jump":
        if (this.jumpCount < this.maxJumps) {
          this.moveState.isJumping = true;
          this.moveState.isFalling = false;
          this.jumpCount++;

          body.setVelocityY(this.jumpCount === 1 ? -450 : -400);

          this.isHoldingJump = true;
          this.jumpHoldTimer = 0;
          this.lastJumpHoldTime = this.scene.time.now;

          this.playAnimation("jump");
        }
        break;

      case "roll":
        if (!this.moveState.isRolling) {
          this.moveState.isRolling = true;
          const direction = this.flipX ? -1 : 1;
          this.getBody().setVelocityX(this.ROLL_VELOCITY * direction);
          this.playAnimation("roll", () => {
            this.getBody().setVelocityX(0); // Stop movement after roll
            EventBus.emit("recover-balance");
          });
        }
        break;

      case "attack":
        this.moveState.isAttacking = true;
        this.playAnimation(action.attackType, () => {
          this.moveState.isAttacking = false;
          this.resetState();
        });
        break;

      case "dash":
        this.moveState.isDashing = true;
        const velocity =
          action.direction === "left"
            ? -this.DASH_VELOCITY
            : this.DASH_VELOCITY;
        body.setVelocityX(velocity);
        this.playAnimation("dash", () => {
          body.setVelocityX(0);
          this.moveState.isDashing = false;
          this.resetState();
        });
        break;

      case "transform":
        this.moveState.isTransforming = true;
        body.setVelocityX(0);
        this.playAnimation("transformBefore", () => {
          this.playAnimation("transformAfter", () => {
            this.moveState.isTransforming = false;
            this.resetState();
          });
        });
        break;
    }
  }

  private setupEventListeners(): void {
    EventBus.on("run-pressed", (key: string) => {
      this.moveState.isRunning = true;
      const velocity =
        key === "ArrowLeft" ? -this.RUN_VELOCITY : this.RUN_VELOCITY;
      this.handleAction({ type: "move", velocity });
    });

    EventBus.on("jump-pressed", () => {
      const body = this.getBody();

      if (!this.anims.isPlaying || this.anims.currentAnim?.key !== "jump") {
        this.playAnimation("jump");
      }

      this.handleAction({ type: "jump" });
    });

    EventBus.on("dash-pressed", () => {
      this.handleAction({
        type: "dash",
        direction: this.flipX ? "left" : "right",
      });
    });

    EventBus.on("roll-pressed", () => {
      this.handleAction({ type: "roll" });
    });

    EventBus.on("attack-1-pressed", () => {
      this.handleAction({ type: "attack", attackType: "attack1" });
    });

    EventBus.on("attack-2-pressed", () => {
      this.handleAction({ type: "attack", attackType: "attack2" });
    });

    EventBus.on("attack-3-pressed", () => {
      this.handleAction({ type: "attack", attackType: "attack3" });
    });

    EventBus.on("transform-pressed", () => {
      this.handleAction({ type: "transform" });
    });

    EventBus.on("jump-released", () => {
      this.isHoldingJump = false; // Disable holding
    });

    EventBus.on("run-released", () => {
      this.moveState.isRunning = false;
      if (!this.moveState.isDashing && !this.moveState.isRolling) {
        this.handleAction({ type: "move", velocity: 0 });
        this.resetAnimationOnKeyRelease();
      }
    });

    EventBus.on("recover-balance", () => {
      if (this.moveState.isRolling) {
        const body = this.getBody();
        body.setVelocityX(0);
        body.setAccelerationX(0);
        this.playAnimation("recoverBalance", () => {
          this.moveState.isRolling = false;
          this.resetAnimationOnKeyRelease();
        });
      }
    });

    EventBus.on("dash-released", () => {
      if (this.moveState.isDashing) {
        this.getBody().setVelocityX(0);
        this.moveState.isDashing = false;
        this.resetAnimationOnKeyRelease();
      }
    });
  }

  private canPerformAction(action: PlayerAction): boolean {
    switch (action.type) {
      case "move":
        return !this.moveState.isRolling;
      case "jump":
        return !this.moveState.isRolling && !this.moveState.isTransforming;
      case "roll":
        return (
          !this.moveState.isRolling &&
          !this.moveState.isAttacking &&
          !this.moveState.isDashing &&
          !this.moveState.isTransforming
        );
      case "attack":
        return (
          !this.moveState.isRolling &&
          !this.moveState.isDashing &&
          !this.moveState.isTransforming
        );
      case "dash":
        return (
          !this.moveState.isRolling &&
          !this.moveState.isAttacking &&
          !this.moveState.isTransforming
        );
      case "transform":
        return (
          !this.moveState.isAttacking &&
          !this.moveState.isRolling &&
          !this.moveState.isDashing
        );
      default:
        return true;
    }
  }

  private resetState(): void {
    const body = this.getBody();
    if (
      !this.moveState.isJumping &&
      !this.moveState.isFalling &&
      !this.moveState.isDashing &&
      !this.moveState.isRolling
    ) {
      if (this.moveState.isRunning && body.velocity.x !== 0) {
        this.playAnimation("run");
      } else if (body.velocity.x === 0 && body.velocity.y === 0) {
        body.setVelocityX(0);
        this.playAnimation("idle");
      }
    }
  }

  private setupPhysicsCheck(): void {
    this.scene.events.on("update", this.updateMovementState, this);
  }

  private updateMovementState(): void {
    const body = this.getBody();
    const currentTime = this.scene.time.now;

    // Handle falling state
    if (body.velocity.y > this.FALL_THRESHOLD && !body.blocked.down) {
      if (!this.moveState.isFalling && !this.moveState.isRolling) {
        this.moveState.isFalling = true;
        this.moveState.isJumping = false; // No longer jumping
        this.playAnimation("fall");
      }
    }

    // Handle landing
    if (body.blocked.down) {
      if (this.moveState.isFalling || this.moveState.isJumping) {
        this.moveState.isFalling = false;
        this.moveState.isJumping = false;
        this.jumpCount = 0;
        this.resetState();
      }
    }

    // Maintain jump animation if in the air and not falling
    if (this.moveState.isJumping && !this.moveState.isFalling) {
      if (this.anims.currentAnim?.key !== "jump") {
        this.playAnimation("jump");
      }
    }

    if (this.isHoldingJump && this.moveState.isJumping) {
      const elapsed = currentTime - this.lastJumpHoldTime;

      if (elapsed >= 16 && this.jumpHoldTimer < this.MAX_JUMP_HOLD_TIME) {
        const currentVelocity = body.velocity.y;
        if (currentVelocity > -900) {
          body.setVelocityY(currentVelocity + this.JUMP_HOLD_ACCELERATION);
          this.jumpHoldTimer += elapsed;
        }
        this.lastJumpHoldTime = currentTime;
      }
    } else {
      this.isHoldingJump = false; // Stop holding if time exceeds max
    }
  }

  private setupAnimations(scene: Phaser.Scene, texture: string): void {
    const animations = [
      { key: "idle", start: 1, end: 3, frameRate: 1, repeat: -1 },
      { key: "lookIntro", start: 4, end: 9, frameRate: 10, repeat: 0 },
      { key: "lookBlink", start: 10, end: 11, frameRate: 10, repeat: -1 },
      { key: "lookBack", start: 12, end: 15, frameRate: 10, repeat: 0 },
      { key: "run", start: 16, end: 25, frameRate: 10, repeat: -1 },
      { key: "wallSlide", start: 26, end: 29, frameRate: 10, repeat: -1 },
      { key: "dash", start: 30, end: 33, frameRate: 10, repeat: -1 },
      { key: "wallGrab", start: 34, end: 46, frameRate: 10, repeat: -1 },
      { key: "jump", start: 47, end: 50, frameRate: 10, repeat: -1 },
      { key: "fall", start: 51, end: 54, frameRate: 10, repeat: -1 },
      { key: "roll", start: 55, end: 62, frameRate: 10, repeat: -1 },
      { key: "recoverBalance", start: 63, end: 72, frameRate: 10, repeat: 0 },
      { key: "attack1", start: 73, end: 82, frameRate: 10, repeat: 0 },
      { key: "attack2", start: 83, end: 92, frameRate: 10, repeat: 0 },
      { key: "attack3", start: 93, end: 103, frameRate: 10, repeat: 0 },
      { key: "turn", start: 104, end: 122, frameRate: 10, repeat: 0 },
      {
        key: "transformBefore",
        start: 123,
        end: 147,
        frameRate: 10,
        repeat: 0,
      },
      { key: "transformAfter", start: 148, end: 160, frameRate: 10, repeat: 0 },
    ];

    animations.forEach((anim) => {
      scene.anims.remove(anim.key);
      const frames = scene.anims.generateFrameNames(texture, {
        start: anim.start,
        end: anim.end,
        prefix: "sprite",
        zeroPad: 0,
      });

      scene.anims.create({
        key: anim.key,
        frames: frames,
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    });
  }

  private getBody(): Physics.Arcade.Body {
    return this.body as Physics.Arcade.Body;
  }

  private checkFlip(velocity: number): void {
    if (velocity > 0) {
      this.setFlipX(false); // Facing right
      this.lastDirection = "right";
    } else if (velocity < 0) {
      this.setFlipX(true); // Facing left
      this.lastDirection = "left";
    } else {
      // No velocity, retain last direction
      this.setFlipX(this.lastDirection === "left");
    }
  }

  public playAnimation(key: string, onComplete?: () => void): void {
    const currentAnim = this.anims.currentAnim;
    if (currentAnim?.key !== key) {
      if (this.scene.anims.exists(key)) {
        this.anims.stop();
        this.play(key);
        if (onComplete) {
          this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
        }
      } else {
        console.warn(`Animation "${key}" does not exist.`);
      }
    }
  }

  destroy(fromScene?: boolean): void {
    this.scene.events.off("update", this.updateMovementState, this);
    EventBus.removeAllListeners();
    super.destroy(fromScene);
  }
}
