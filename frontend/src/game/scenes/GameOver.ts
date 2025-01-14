import { EventBus } from "../EventBus";
import { Scene } from "phaser";
interface GameOverData {
  collectedOrbs?: number; // Data passed to display the collected orbs
}

export class GameOver extends Scene {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private background: Phaser.GameObjects.Rectangle;
  private gameOverText: Phaser.GameObjects.Text;
  private autoRestartTimer: Phaser.Time.TimerEvent | null = null;
  private eventListeners: { event: string; handler: Function }[] = [];
  private seperator: Phaser.GameObjects.Image;
  private collectedOrbsText: Phaser.GameObjects.Text;

  constructor() {
    super("GameOver");
  }

  create(data: GameOverData = {}) {
    this.camera = this.cameras.main;
    const { centerX, centerY } = this.camera;

    // Create dark background
    this.background = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8)
      .setOrigin(0)
      .setDepth(0);

    // Add separator line
    this.seperator = this.add
      .image(centerX, centerY - 40, "seperator")
      .setScale(1.0);

    // Game Over Text
    this.gameOverText = this.add
      .text(centerX, centerY - 100, "Game Over", {
        fontFamily: "Public Pixel",
        fontSize: "48px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    const collectedOrbs = data.collectedOrbs || 0;
    this.collectedOrbsText = this.add
      .text(centerX, centerY, `Orbs Collected: ${collectedOrbs}`, {
        fontFamily: "Public Pixel",
        fontSize: "32px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Trigger fade-out effect after 5 seconds
    this.time.delayedCall(5000, () => {
      this.fadeToBlack();
    });
  }

  private fadeToBlack(): void {
    this.camera.fadeOut(10000, 0, 0, 0);
  }

  private cleanup(): void {
    this.eventListeners.forEach(({ event, handler }) => {
      EventBus.off(event, handler);
    });
    this.eventListeners = [];
    if (this.autoRestartTimer) {
      this.autoRestartTimer.destroy();
      this.autoRestartTimer = null;
    }

    // Clear any remaining tweens
    this.tweens.killAll();

    this.background?.destroy();
    this.gameOverText?.destroy();
    this.seperator?.destroy();
    this.collectedOrbsText?.destroy();
  }

  shutdown() {
    this.cleanup();
  }
}
