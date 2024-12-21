import Phaser from "phaser";

export default class Architect {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "architect");
    this.initAnimations();
  }

  private initAnimations(): void {
    const animConfigs = [
      {
        key: "idle",
        start: 1,
        end: 15,
        frameRate: 10,
        repeat: -1,
      },
      {
        key: "idle_2",
        start: 16,
        end: 32,
        frameRate: 10,
        repeat: -1,
      },
      {
        key: "red_circle_dim",
        start: 33,
        end: 56,
        frameRate: 10,
        repeat: 0,
      },
      {
        key: "corrupt",
        start: 57,
        end: 126,
        frameRate: 10,
        repeat: -1,
      },
      {
        key: "break",
        start: 127,
        end: 168,
        frameRate: 10,
        repeat: -1,
      },
      {
        key: "resurrect",
        start: 169,
        end: 210,
        frameRate: 10,
        repeat: -1,
      },
      {
        key: "appear",
        start: 211,
        end: 240,
        frameRate: 12,
        repeat: 0,
      },
      {
        key: "disappear",
        start: 241,
        end: 265,
        frameRate: 12,
        repeat: 0,
      },
      {
        key: "death",
        start: 266,
        end: 330,
        frameRate: 12,
        repeat: 0,
      },
    ];

    animConfigs.forEach(({ key, start, end, frameRate, repeat }) => {
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: this.scene.anims.generateFrameNames("architect", {
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

  public playAnimation(
    animationKey: string,
    onCompleteCallback: (() => void) | null = null
  ): void {
    this.sprite.play(animationKey);

    if (onCompleteCallback) {
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        onCompleteCallback();
      });
    }
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
