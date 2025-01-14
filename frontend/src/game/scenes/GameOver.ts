import { EventBus } from "../EventBus";
import { Scene } from "phaser";

interface GameOverData {
  reason?: string;
  score?: number;
  gameId?: string;
}

export class GameOver extends Scene {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private background: Phaser.GameObjects.Rectangle;
  private gameOverText: Phaser.GameObjects.Text;
  private promptText: Phaser.GameObjects.Text;
  private eventListeners: { event: string; handler: Function }[] = [];
  private seperator: Phaser.GameObjects.Image;
  private allowRestart: boolean = false;

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

    // Short delay before showing restart prompt
    this.time.delayedCall(2000, () => {
      this.allowRestart = true;
      this.promptText = this.add
        .text(centerX, centerY + 100, "Press ENTER to continue", {
          fontFamily: "Public Pixel",
          fontSize: "24px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5)
        .setAlpha(0);

      // Fade in the prompt text
      this.tweens.add({
        targets: this.promptText,
        alpha: 1,
        duration: 500,
        ease: "Power2",
      });

      // Setup event listener for enter key
      const enterHandler = () => this.handleRestart();
      EventBus.on("enter-key-pressed", enterHandler);
      this.eventListeners.push({
        event: "enter-key-pressed",
        handler: enterHandler,
      });
    });

    EventBus.emit("current-scene-ready", this);
  }

  private handleRestart(): void {
    if (!this.allowRestart) return;

    this.allowRestart = false;

    // Fade out the current scene
    this.cameras.main.fadeOut(500);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.cleanup();
      EventBus.emit("restart-game");
    });
  }

  private cleanup(): void {
    // Remove all event listeners
    this.eventListeners.forEach(({ event, handler }) => {
      EventBus.removeListener(event, handler);
    });
    this.eventListeners = [];

    // Clear any remaining tweens
    this.tweens.killAll();

    // Remove all game objects
    this.background?.destroy();
    this.gameOverText?.destroy();
    this.promptText?.destroy();
    this.seperator?.destroy();

    // Remove any remaining event listeners
    EventBus.removeAllListeners();
  }

  shutdown() {
    this.cleanup();
  }
}
