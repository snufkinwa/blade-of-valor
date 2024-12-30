import { Scene, GameObjects } from "phaser";

export default class Droid {
  scene: Scene;
  sprite: GameObjects.Sprite;
  private isDestroyed: boolean = false;
  private currentAttackAnimation: string | null = null;

  constructor(scene: Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "droid");
    this.sprite.setScale(0.8);
    this.initAnimations();
    this.playAnimation("idle");
  }

  private initAnimations(): void {
    // Idle Animation (sprites 1-23)
    this.sprite.anims.create({
      key: "idle",
      frames: this.sprite.anims.generateFrameNames("droid", {
        start: 1,
        end: 23,
        prefix: "sprite",
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Look Back Animation (sprites 24-45)
    this.sprite.anims.create({
      key: "lookBack",
      frames: this.sprite.anims.generateFrameNames("droid", {
        start: 24,
        end: 45,
        prefix: "sprite",
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Attack Animation (sprites 46-56)
    this.sprite.anims.create({
      key: "attack",
      frames: this.sprite.anims.generateFrameNames("droid", {
        start: 46,
        end: 56,
        prefix: "sprite",
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Attack2 Animation (sprites 57-71)
    this.sprite.anims.create({
      key: "attack2",
      frames: this.sprite.anims.generateFrameNames("droid", {
        start: 57,
        end: 71,
        prefix: "sprite",
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Laser Turn Around Animation (sprites 72-86)
    this.sprite.anims.create({
      key: "laserTurnAround",
      frames: this.sprite.anims.generateFrameNames("droid", {
        start: 72,
        end: 86,
        prefix: "sprite",
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Destroy Animation (sprites 87-107)
    this.sprite.anims.create({
      key: "destroy",
      frames: this.sprite.anims.generateFrameNames("droid", {
        start: 87,
        end: 107,
        prefix: "sprite",
      }),
      frameRate: 15,
      repeat: 0,
    });
  }

  playAnimation(key: string, onComplete?: () => void): void {
    if (this.isDestroyed) return;

    // Handle attack animations
    if (key.startsWith("attack")) {
      if (this.currentAttackAnimation) {
        return; // Don't interrupt current attack
      }
      this.currentAttackAnimation = key;
    }

    this.sprite.play(key);

    if (onComplete) {
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (key.startsWith("attack")) {
          this.currentAttackAnimation = null;
        }
        onComplete();
      });
    } else {
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (key.startsWith("attack")) {
          this.currentAttackAnimation = null;
          this.playAnimation("idle");
        }
        if (key === "destroy") {
          this.isDestroyed = true;
        }
      });
    }
  }

  lookBack(onComplete?: () => void): void {
    this.playAnimation("lookBack", () => {
      if (onComplete) {
        onComplete();
      } else {
        this.playAnimation("idle");
      }
    });
  }

  attack(type: number = 1, onComplete?: () => void): void {
    if (this.currentAttackAnimation) return;

    const attackAnim = type === 2 ? "attack2" : "attack";
    this.playAnimation(attackAnim, onComplete);
  }

  laserTurnAround(onComplete?: () => void): void {
    this.playAnimation("laserTurnAround", onComplete);
  }

  destroy(onComplete?: () => void): void {
    this.playAnimation("destroy", () => {
      this.isDestroyed = true;
      if (onComplete) onComplete();
    });
  }

  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }

  setFlip(flipX: boolean): void {
    this.sprite.setFlipX(flipX);
  }

  setVisible(visible: boolean): void {
    this.sprite.setVisible(visible);
  }

  setScale(scale: number): void {
    this.sprite.setScale(scale);
  }

  setDepth(depth: number): void {
    this.sprite.setDepth(depth);
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  isAnimationPlaying(key: string): boolean {
    return this.sprite.anims.currentAnim?.key === key;
  }
}
